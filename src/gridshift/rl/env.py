"""Custom Gymnasium environment for GPU cluster scheduling.

Implements discrete-event scheduling as an MDP compatible with
Stable-Baselines3 and ``sb3-contrib``'s ``MaskablePPO``.
"""

from __future__ import annotations

import copy
import heapq
import logging
from typing import Any

import gymnasium as gym
from gymnasium import spaces
import numpy as np

from ..data.schemas import CanonicalJob
from ..forecasting.predictor import ForecastPredictor
from ..simulator.cluster import Cluster
from ..simulator.events import Event, EventType, RunningJob
from ..simulator.metrics import JobOutcome, SchedulingMetrics, compute_metrics
from ..simulator.placement import feasibility_check, place_job
from .action_mask import compute_action_mask
from .observation import build_observation, get_observation_dim
from .reward import RewardWeights, calculate_step_reward

logger = logging.getLogger(__name__)


class SchedulingEnv(gym.Env):
    """Gymnasium environment wrapping the trace-driven cluster simulator.

    Action Space
    ------------
    ``Discrete(candidate_k + 1)``:
    - 0 to candidate_k - 1: Select corresponding job from the waiting queue.
    - candidate_k: WAIT (advance clock to next event).

    Observation Space
    -----------------
    ``Box(0.0, 1.0, shape=(obs_dim,), dtype=np.float32)``
    Encodes queue summary, candidate jobs, cluster node states, running jobs,
    and aggregate demand forecasts.
    """

    metadata = {"render_modes": ["ansi"]}

    def __init__(
        self,
        jobs: list[CanonicalJob],
        cluster_config: dict[str, Any] | None = None,
        candidate_k: int = 10,
        forecast_predictor: ForecastPredictor | None = None,
        reward_weights: RewardWeights | None = None,
        seed: int = 42,
    ) -> None:
        super().__init__()
        self._raw_jobs = sorted(jobs, key=lambda j: j.submit_time)
        self._candidate_k = candidate_k
        self._forecast_predictor = forecast_predictor
        self._reward_weights = reward_weights or RewardWeights()
        self._seed = seed

        # Default cluster setup if not specified
        if cluster_config is None:
            self._num_machines = 10
            self._gpus_per_machine = 8
            self._cpu_per_machine = 64.0
            self._memory_per_machine = 256.0
        else:
            self._num_machines = cluster_config.get("num_machines", 10)
            self._gpus_per_machine = cluster_config.get("gpus_per_machine", 8)
            self._cpu_per_machine = float(cluster_config.get("cpu_per_machine", 64.0))
            self._memory_per_machine = float(cluster_config.get("memory_per_machine", 256.0))

        # Define Gymnasium spaces
        self.action_space = spaces.Discrete(self._candidate_k + 1)
        obs_dim = get_observation_dim(self._num_machines, self._candidate_k)
        self.observation_space = spaces.Box(
            low=0.0,
            high=1.0,
            shape=(obs_dim,),
            dtype=np.float32,
        )

        # Internal simulation state
        self._cluster: Cluster | None = None
        self._queue: list[CanonicalJob] = []
        self._running_jobs: dict[str, RunningJob] = {}
        self._completed_jobs: list[JobOutcome] = []
        self._events_log: list[dict[str, Any]] = []
        self._heap: list[tuple[float, int, Event]] = []
        self._current_time: float = 0.0
        self._event_counter: int = 0
        self._latest_forecast: float = 0.0
        self._forecast_timestamp: float = 0.0

    # ── Action Masking (sb3-contrib API) ───────────────────────────────────

    def action_masks(self) -> np.ndarray:
        """Return boolean mask for MaskablePPO."""
        if self._cluster is None:
            mask = np.zeros(self._candidate_k + 1, dtype=bool)
            mask[self._candidate_k] = True
            return mask
        return compute_action_mask(self._queue, self._cluster, self._candidate_k)

    # ── Gym API ───────────────────────────────────────────────────────────

    def reset(
        self,
        *,
        seed: int | None = None,
        options: dict[str, Any] | None = None,
    ) -> tuple[np.ndarray, dict[str, Any]]:
        """Reset environment to the beginning of the trace."""
        super().reset(seed=seed)
        if seed is not None:
            self._seed = seed

        # Re-initialize cluster
        self._cluster = Cluster.create_default(
            num_machines=self._num_machines,
            gpus=self._gpus_per_machine,
            cpu=self._cpu_per_machine,
            memory=self._memory_per_machine,
        )
        self._queue = []
        self._running_jobs = {}
        self._completed_jobs = []
        self._events_log = []
        self._heap = []
        self._event_counter = 0
        self._current_time = self._raw_jobs[0].submit_time if self._raw_jobs else 0.0
        self._latest_forecast = 0.0
        self._forecast_timestamp = self._current_time

        # Schedule all arrivals
        for job in self._raw_jobs:
            self._push_event(
                Event(
                    timestamp=job.submit_time,
                    event_type=EventType.JOB_ARRIVAL,
                    payload={"job": job},
                )
            )

        # Advance until we have jobs in the queue or trace completes
        self._advance_until_decision()

        obs = self._get_obs()
        info = {"queue_len": len(self._queue), "completed_count": len(self._completed_jobs)}
        return obs, info

    def step(
        self,
        action: int,
    ) -> tuple[np.ndarray, float, bool, bool, dict[str, Any]]:
        """Execute one scheduling action."""
        if self._cluster is None:
            raise RuntimeError("Environment must be reset() before calling step().")

        completed_before = len(self._completed_jobs)

        # ── 1. Apply chosen action ─────────────────────────────────────────
        placed_job = False
        if action < self._candidate_k and action < len(self._queue):
            job = self._queue[action]
            target_machine = place_job(job, self._cluster)

            if target_machine is not None and feasibility_check(job, self._cluster[target_machine]):
                # Allocate
                machine = self._cluster[target_machine]
                machine.allocate(
                    job.job_id,
                    job.requested_gpus,
                    job.requested_cpu,
                    job.requested_memory,
                )

                start_time = self._current_time
                completion_time = start_time + job.observed_runtime

                self._running_jobs[job.job_id] = RunningJob(
                    job=job,
                    machine_id=target_machine,
                    start_time=start_time,
                    expected_completion=completion_time,
                )

                # Schedule completion
                self._push_event(
                    Event(
                        timestamp=completion_time,
                        event_type=EventType.JOB_COMPLETION,
                        payload={"job_id": job.job_id},
                    )
                )

                # Remove from queue
                self._queue.pop(action)
                placed_job = True

        # ── 2. If WAIT or action placed job, advance simulation clock ───────
        if not placed_job:
            # WAIT chosen or invalid job: must advance clock to next event
            self._advance_to_next_event()

        # Update forecast if forecaster is present
        self._update_forecast()

        # Check if trace is finished: no events pending and no jobs running
        terminated = (len(self._heap) == 0) and (len(self._running_jobs) == 0)
        truncated = False

        completed_this_step = len(self._completed_jobs) - completed_before

        # Determine if feasible jobs are currently waiting
        has_feasible = any(
            place_job(j, self._cluster) is not None
            for j in self._queue[: self._candidate_k]
        )

        reward = calculate_step_reward(
            queue=self._queue,
            cluster=self._cluster,
            current_time=self._current_time,
            jobs_completed_this_step=completed_this_step,
            has_feasible_waiting_job=has_feasible,
            weights=self._reward_weights,
        )

        obs = self._get_obs()
        info = {
            "queue_len": len(self._queue),
            "running_count": len(self._running_jobs),
            "completed_count": len(self._completed_jobs),
            "action_mask": self.action_masks(),
        }

        return obs, reward, terminated, truncated, info

    # ── Internal Helpers ──────────────────────────────────────────────────

    def _push_event(self, event: Event) -> None:
        self._event_counter += 1
        heapq.heappush(self._heap, (event.timestamp, self._event_counter, event))

    def _advance_to_next_event(self) -> None:
        """Pop and execute the next event from the heap."""
        if not self._heap:
            return

        _, _, event = heapq.heappop(self._heap)
        self._current_time = event.timestamp

        if event.event_type is EventType.JOB_ARRIVAL:
            job: CanonicalJob = event.payload["job"]
            self._queue.append(job)

        elif event.event_type is EventType.JOB_COMPLETION:
            job_id: str = event.payload["job_id"]
            running = self._running_jobs.pop(job_id, None)
            if running is not None and self._cluster is not None:
                machine = self._cluster[running.machine_id]
                machine.release(
                    job_id,
                    running.job.requested_gpus,
                    running.job.requested_cpu,
                    running.job.requested_memory,
                )
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
                self._completed_jobs.append(outcome)

    def _advance_until_decision(self) -> None:
        """Advance time until either queue has items or no events remain."""
        while self._heap and not self._queue:
            self._advance_to_next_event()

    def _update_forecast(self) -> None:
        """Periodically compute forecast for observation vector."""
        if self._forecast_predictor is None or not self._forecast_predictor.is_ready:
            return

        # Update forecast every 15 minutes (900s)
        if (self._current_time - self._forecast_timestamp) >= 900.0:
            self._forecast_timestamp = self._current_time
            # For runtime prediction, we can estimate from running queue demand
            recent_demand = sum(j.requested_gpus for j in self._queue)
            # Safe placeholder call if feature vector required
            self._latest_forecast = float(recent_demand)

    def _get_obs(self) -> np.ndarray:
        if self._cluster is None:
            dim = get_observation_dim(self._num_machines, self._candidate_k)
            return np.zeros(dim, dtype=np.float32)

        forecast_age = max(0.0, self._current_time - self._forecast_timestamp)
        return build_observation(
            queue=self._queue,
            cluster=self._cluster,
            current_time=self._current_time,
            candidate_k=self._candidate_k,
            forecast_demand=self._latest_forecast,
            forecast_age=forecast_age,
        )

    def compute_metrics(self) -> SchedulingMetrics:
        """Compute final metrics for completed jobs."""
        if not self._raw_jobs:
            duration = 0.0
        else:
            duration = max(0.0, self._current_time - self._raw_jobs[0].submit_time)

        cluster_config = {
            "num_machines": self._num_machines,
            "gpus_per_machine": self._gpus_per_machine,
        }
        return compute_metrics(
            self._completed_jobs,
            self._events_log,
            cluster_config,
            duration,
        )
