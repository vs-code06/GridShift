"""FCFS with Backfilling scheduling policy."""

from __future__ import annotations

import copy
from typing import Any

from ..cluster import Cluster
from ..placement import place_job
from ...data.schemas import CanonicalJob
from .base import SchedulingDecision, SchedulingPolicy


class BackfillPolicy(SchedulingPolicy):
    """FCFS with Backfilling policy.

    Scans the waiting queue in chronological arrival order (oldest to newest).
    Whenever a job can fit on any machine with sufficient free resources, it is
    scheduled. Jobs that cannot currently fit are skipped without blocking
    subsequent jobs from utilizing idle capacity.
    """

    @property
    def name(self) -> str:
        return "backfill"

    def select_jobs(
        self,
        queue: list[CanonicalJob],
        cluster: Cluster,
        context: dict[str, Any] | None = None,
    ) -> list[SchedulingDecision]:
        if not queue:
            return []

        # Maintain a shadow copy of the cluster to ensure multiple jobs
        # scheduled in the same decision step do not exceed machine limits.
        temp_cluster = copy.deepcopy(cluster)
        decisions: list[SchedulingDecision] = []

        for job in queue:
            target_machine = place_job(job, temp_cluster)
            if target_machine is not None:
                decisions.append(SchedulingDecision(job=job, machine_id=target_machine))
                # Allocate on shadow cluster to reflect newly reserved capacity
                temp_cluster[target_machine].allocate(
                    job.job_id,
                    job.requested_gpus,
                    job.requested_cpu,
                    job.requested_memory,
                )

        return decisions

