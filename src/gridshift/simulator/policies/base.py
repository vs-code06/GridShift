"""Base interface for scheduling policies."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

from ..cluster import Cluster
from ...data.schemas import CanonicalJob


@dataclass
class SchedulingDecision:
    """A placement decision for a single job."""

    job: CanonicalJob
    machine_id: str


class SchedulingPolicy(ABC):
    """Abstract base class for all scheduling policies."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Name identifier of the policy."""

    @abstractmethod
    def select_jobs(
        self,
        queue: list[CanonicalJob],
        cluster: Cluster,
        context: dict[str, Any] | None = None,
    ) -> list[SchedulingDecision]:
        """Select queued jobs to run and assign them to eligible machines.

        Parameters
        ----------
        queue:
            Current waiting queue of jobs in arrival order.
        cluster:
            Current cluster state.
        context:
            Optional context dictionary (e.g. predictions, extra metrics).

        Returns
        -------
        list[SchedulingDecision]
            List of (job, machine_id) decisions.
        """

