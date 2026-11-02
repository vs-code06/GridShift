"""Strict First-Come-First-Served (FCFS) scheduling policy."""

from __future__ import annotations

from typing import Any

from ..cluster import Cluster
from ..placement import place_job
from ...data.schemas import CanonicalJob
from .base import SchedulingDecision, SchedulingPolicy


class FCFSPolicy(SchedulingPolicy):
    """Strict FCFS policy.

    Always attempts to schedule the head of queue (oldest job).
    If the oldest job cannot fit on any machine in the cluster, the queue
    is blocked and no subsequent jobs are considered, preserving strict order.
    """

    @property
    def name(self) -> str:
        return "fcfs"

    def select_jobs(
        self,
        queue: list[CanonicalJob],
        cluster: Cluster,
        context: dict[str, Any] | None = None,
    ) -> list[SchedulingDecision]:
        if not queue:
            return []

        head = queue[0]
        target_machine = place_job(head, cluster)
        if target_machine is not None:
            return [SchedulingDecision(job=head, machine_id=target_machine)]
        return []
