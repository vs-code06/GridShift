"""Scheduling performance metrics.

Defines :class:`SchedulingMetrics` and :class:`JobOutcome` dataclasses plus
the :func:`compute_metrics` aggregation function.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class JobOutcome:
    """Outcome record for a single completed job."""

    job_id: str
    submit_time: float
    start_time: float
    completion_time: float
    wait_time: float
    assigned_machine: str
    requested_gpus: int
    requested_cpu: float
    requested_memory: float


@dataclass
class SchedulingMetrics:
    """Aggregate scheduling metrics for a simulation run."""

    avg_wait: float
    """Mean wait time (seconds) across all completed jobs."""

    p95_wait: float
    """95th-percentile wait time (seconds)."""

    gpu_utilization: float
    """Time-weighted average GPU utilization (0–1)."""

    throughput: float
    """Jobs completed per second of simulated time."""

    fragmentation_events: int
    """Number of times a job could not be placed despite sufficient
    aggregate cluster resources (fragmentation)."""

    constraint_violations: int
    """Number of capacity constraint violations detected (should be 0)."""

    total_jobs: int
    """Total jobs submitted."""

    completed_jobs: int
    """Number of jobs that completed."""

    simulation_duration: float
    """Wall-clock span of the simulation (seconds of simulated time)."""


def compute_metrics(
    completed_jobs: list[JobOutcome],
    timeline: list[dict],
    cluster_config: dict,
    simulation_duration: float,
) -> SchedulingMetrics:
    """Calculate aggregate scheduling metrics from simulation results.

    Parameters
    ----------
    completed_jobs:
        Per-job outcome records.
    timeline:
        Chronological list of event dicts emitted during simulation.
        Used to compute utilization and fragmentation.
    cluster_config:
        Dict with ``num_machines`` and ``gpus_per_machine`` (at minimum).
    simulation_duration:
        Total simulated time span (seconds).

    Returns
    -------
    SchedulingMetrics
    """
    if not completed_jobs:
        return SchedulingMetrics(
            avg_wait=0.0,
            p95_wait=0.0,
            gpu_utilization=0.0,
            throughput=0.0,
            fragmentation_events=0,
            constraint_violations=0,
            total_jobs=0,
            completed_jobs=0,
            simulation_duration=simulation_duration,
        )

    # ── Wait-time statistics ─────────────────────────────────────────────
    waits = sorted(j.wait_time for j in completed_jobs)
    avg_wait = sum(waits) / len(waits)
    p95_idx = int(len(waits) * 0.95)
    p95_idx = min(p95_idx, len(waits) - 1)
    p95_wait = waits[p95_idx]

    # ── GPU utilization (time-weighted) ──────────────────────────────────
    total_gpu_seconds = (
        cluster_config.get("num_machines", 1)
        * cluster_config.get("gpus_per_machine", 1)
        * simulation_duration
    )
    used_gpu_seconds = sum(
        j.requested_gpus * (j.completion_time - j.start_time)
        for j in completed_jobs
    )
    gpu_utilization = used_gpu_seconds / total_gpu_seconds if total_gpu_seconds > 0 else 0.0

    # ── Throughput (jobs per hour) ───────────────────────────────────────
    throughput = (
        (len(completed_jobs) / simulation_duration) * 3600.0
        if simulation_duration > 0
        else 0.0
    )

    # ── Fragmentation events (from timeline) ─────────────────────────────
    fragmentation_events = sum(
        1 for ev in timeline if ev.get("type") == "fragmentation"
    )

    # ── Constraint violations ────────────────────────────────────────────
    constraint_violations = sum(
        1 for ev in timeline if ev.get("type") == "constraint_violation"
    )

    return SchedulingMetrics(
        avg_wait=avg_wait,
        p95_wait=p95_wait,
        gpu_utilization=gpu_utilization,
        throughput=throughput,
        fragmentation_events=fragmentation_events,
        constraint_violations=constraint_violations,
        total_jobs=len(completed_jobs),
        completed_jobs=len(completed_jobs),
        simulation_duration=simulation_duration,
    )
