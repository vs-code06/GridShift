"""Job placement logic: feasibility checks and best-fit scoring.

All placement decisions consider three resource dimensions equally:
GPUs, CPU cores, and memory.
"""

from __future__ import annotations

from ..data.schemas import CanonicalJob
from .cluster import Cluster, Machine


def feasibility_check(job: CanonicalJob, machine: Machine) -> bool:
    """Return ``True`` if *machine* can accommodate *job*'s resource request.

    All three dimensions (GPU, CPU, memory) must have sufficient free
    capacity.
    """
    return machine.can_fit(
        job.requested_gpus,
        job.requested_cpu,
        job.requested_memory,
    )


def best_fit_score(job: CanonicalJob, machine: Machine) -> float:
    """Compute a normalised residual-capacity score for placing *job* on *machine*.

    Lower scores indicate a tighter fit, making the placement more
    desirable (less wasted capacity).  The score is the average of
    normalised residual capacity across the three resource dimensions,
    each in [0, 1].

    Parameters
    ----------
    job:
        The candidate job.
    machine:
        The target machine (must have enough free capacity).

    Returns
    -------
    float
        Score in [0, 1].  Lower is better.
    """
    residuals: list[float] = []

    if machine.total_gpus > 0:
        residuals.append(
            (machine.free_gpus() - job.requested_gpus) / machine.total_gpus
        )
    if machine.total_cpu > 0:
        residuals.append(
            (machine.free_cpu() - job.requested_cpu) / machine.total_cpu
        )
    if machine.total_memory > 0:
        residuals.append(
            (machine.free_memory() - job.requested_memory) / machine.total_memory
        )

    return sum(residuals) / len(residuals) if residuals else 0.0


def place_job(job: CanonicalJob, cluster: Cluster) -> str | None:
    """Find the best-fit machine for *job* in *cluster*.

    Examines all feasible machines, picks the one with the lowest
    :func:`best_fit_score` (tightest fit), and returns its ``machine_id``.

    Parameters
    ----------
    job:
        The job to place.
    cluster:
        The cluster to search.

    Returns
    -------
    str | None
        The ``machine_id`` of the chosen machine, or ``None`` if no machine
        can fit the job.
    """
    feasible = cluster.get_feasible_machines(
        job.requested_gpus,
        job.requested_cpu,
        job.requested_memory,
    )
    if not feasible:
        return None

    best_machine = min(feasible, key=lambda m: best_fit_score(job, m))
    return best_machine.machine_id
