"""Discrete-event simulation loop for the GPU cluster scheduler.

The :class:`EventLoop` drives a priority-queue–based simulation using
:class:`CanonicalJob` arrivals, a pluggable :class:`SchedulingPolicy`,
and the placement layer.
"""

from __future__ import annotations

import heapq
import logging
import random
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

from ..data.schemas import CanonicalJob
from .cluster import Cluster
from .events import Event, EventType, RunningJob
from .metrics import JobOutcome, SchedulingMetrics, compute_metrics
from .placement import feasibility_check, place_job
from .policies.base import SchedulingPolicy

logger = logging.getLogger(__name__)


# ── Simulation state ────────────────────────────────────────────────────────


@dataclass
class SimulationState:
    """Mutable snapshot of the entire simulation."""

    current_time: float = 0.0
    queue: list[CanonicalJob] = field(default_factory=list)
    cluster: Cluster = field(default_factory=lambda: Cluster.create_default(1))
    running_jobs: dict[str, RunningJob] = field(default_factory=dict)
    completed_jobs: list[JobOutcome] = field(default_factory=list)
    events_log: list[dict[str, Any]] = field(default_factory=list)


# ── Simulation result ────────────────────────────────────────────────────────


@dataclass
class SimulationResult:
    """Immutable results returned after a simulation run."""

    completed_jobs: list[JobOutcome]
    metrics: SchedulingMetrics
    timeline_events: list[dict[str, Any]]
    config: dict[str, Any]


# ── Event loop ───────────────────────────────────────────────────────────────


class EventLoop:
    """Priority-queue driven discrete-event simulation.

    Parameters
    ----------
    jobs:
        Canonical jobs to simulate.  They are ingested as ``JOB_ARRIVAL``
        events at their ``submit_time``.
    cluster:
        The cluster to schedule onto.
    policy:
        Scheduling policy for deciding which queued jobs to start.
    seed:
        Random seed for determinism.
    """

    def __init__(
        self,
        jobs: list[CanonicalJob],
        cluster: Cluster,
        policy: SchedulingPolicy,
        seed: int = 42,
    ) -> None:
        self._jobs = sorted(jobs, key=lambda j: j.submit_time)
        self._cluster = cluster
        self._policy = policy
        self._seed = seed

        self._state = SimulationState(cluster=cluster)
        self._heap: list[tuple[float, int, Event]] = []
        self._event_counter = 0  # tiebreaker for equal timestamps

    # ── Public API ───────────────────────────────────────────────────────

    def run(self) -> SimulationResult:
        """Execute the discrete-event simulation and return results.

        The loop is fully deterministic for a given *seed* + *jobs* +
        *cluster* + *policy* combination.
        """
        random.seed(self._seed)

        # Seed the heap with arrival events.
        for job in self._jobs:
            self._push_event(
                Event(
                    timestamp=job.submit_time,
                    event_type=EventType.JOB_ARRIVAL,
                    payload={"job": job},
                )
            )

        # Main loop.
        while self._heap:
            _, _, event = heapq.heappop(self._heap)
            self._state.current_time = event.timestamp

            if event.event_type is EventType.JOB_ARRIVAL:
                self._handle_arrival(event)
            elif event.event_type is EventType.JOB_COMPLETION:
                self._handle_completion(event)
            elif event.event_type is EventType.SCHEDULING_DECISION:
                self._handle_scheduling(event)

        # Compute final metrics.
        simulation_duration = self._simulation_duration()
        cluster_config = {
            "num_machines": len(self._cluster),
            "gpus_per_machine": (
                self._cluster.machines[0].total_gpus
                if self._cluster.machines
                else 0
            ),
        }
        metrics = compute_metrics(
            self._state.completed_jobs,
            self._state.events_log,
            cluster_config,
            simulation_duration,
        )

        return SimulationResult(
            completed_jobs=list(self._state.completed_jobs),
            metrics=metrics,
            timeline_events=list(self._state.events_log),
            config={
                "policy": self._policy.name,
                "seed": self._seed,
                "num_jobs": len(self._jobs),
                "num_machines": len(self._cluster),
            },
        )

    # ── Event handlers ───────────────────────────────────────────────────

    def _handle_arrival(self, event: Event) -> None:
        """Add arriving job to the wait queue and trigger scheduling."""
        job: CanonicalJob = event.payload["job"]
        self._state.queue.append(job)
        self._log_event("arrival", job_id=job.job_id, time=event.timestamp)

        # Trigger an immediate scheduling decision.
        self._push_event(
            Event(
                timestamp=event.timestamp,
                event_type=EventType.SCHEDULING_DECISION,
                payload={},
            )
        )

    def _handle_completion(self, event: Event) -> None:
        """Release resources for a completed job and re-trigger scheduling."""
        job_id: str = event.payload["job_id"]
        running = self._state.running_jobs.pop(job_id, None)
        if running is None:
            logger.warning("Completion event for unknown job %s", job_id)
            return

        # Release machine resources.
        machine = self._cluster[running.machine_id]
        machine.release(
            job_id,
            running.job.requested_gpus,
            running.job.requested_cpu,
            running.job.requested_memory,
        )

        # Record outcome.
        outcome = JobOutcome(
            job_id=job_id,
            submit_time=running.job.submit_time,
            start_time=running.start_time,
            completion_time=event.timestamp,
            wait_time=running.start_time - running.job.submit_time,
            assigned_machine=running.machine_id,
            requested_gpus=running.job.requested_gpus,
            requested_cpu=running.job.requested_cpu,
            requested_memory=running.job.requested_memory,
        )
        self._state.completed_jobs.append(outcome)
        self._log_event("completion", job_id=job_id, time=event.timestamp)

        # Trigger re-scheduling now that resources are free.
        self._push_event(
            Event(
                timestamp=event.timestamp,
                event_type=EventType.SCHEDULING_DECISION,
                payload={},
            )
        )

    def _handle_scheduling(self, event: Event) -> None:
        """Invoke the policy, place selected jobs, and schedule completions."""
        if not self._state.queue:
            return

        decisions = self._policy.select_jobs(
            list(self._state.queue),
            self._cluster,
        )

        placed_job_ids: set[str] = set()

        for decision in decisions:
            job = decision.job
            target_machine_id = decision.machine_id

            # Verify placement is still feasible (cluster state may have
            # changed between policy call and actual placement).
            machine = self._cluster[target_machine_id]
            if not feasibility_check(job, machine):
                self._log_event(
                    "constraint_violation",
                    job_id=job.job_id,
                    time=event.timestamp,
                    detail="Machine no longer feasible at placement time.",
                )
                continue

            # Allocate resources.
            machine.allocate(
                job.job_id,
                job.requested_gpus,
                job.requested_cpu,
                job.requested_memory,
            )

            start_time = event.timestamp
            completion_time = start_time + job.observed_runtime

            self._state.running_jobs[job.job_id] = RunningJob(
                job=job,
                machine_id=target_machine_id,
                start_time=start_time,
                expected_completion=completion_time,
            )

            # Schedule completion event.
            self._push_event(
                Event(
                    timestamp=completion_time,
                    event_type=EventType.JOB_COMPLETION,
                    payload={"job_id": job.job_id},
                )
            )
            placed_job_ids.add(job.job_id)
            self._log_event(
                "placement",
                job_id=job.job_id,
                machine_id=target_machine_id,
                time=event.timestamp,
            )

        # Remove placed jobs from queue.
        if placed_job_ids:
            self._state.queue = [
                j for j in self._state.queue if j.job_id not in placed_job_ids
            ]

        # Detect fragmentation: jobs in queue that *cannot* fit anywhere
        # despite aggregate free GPUs being sufficient.
        for job in self._state.queue:
            total_free = self._cluster.total_free_gpus()
            if total_free >= job.requested_gpus:
                feasible = self._cluster.get_feasible_machines(
                    job.requested_gpus,
                    job.requested_cpu,
                    job.requested_memory,
                )
                if not feasible:
                    self._log_event(
                        "fragmentation",
                        job_id=job.job_id,
                        time=event.timestamp,
                    )

    # ── Helpers ──────────────────────────────────────────────────────────

    def _push_event(self, event: Event) -> None:
        """Push an event onto the priority queue with a tiebreaker."""
        self._event_counter += 1
        heapq.heappush(self._heap, (event.timestamp, self._event_counter, event))

    def _log_event(self, event_type: str, **kwargs: Any) -> None:
        """Append an event record to the timeline."""
        entry = {"type": event_type, **kwargs}
        self._state.events_log.append(entry)

    def _simulation_duration(self) -> float:
        """Return the total simulated time span."""
        if not self._jobs:
            return 0.0
        earliest = self._jobs[0].submit_time
        latest = self._state.current_time
        return max(latest - earliest, 0.0)
