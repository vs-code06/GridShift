"""Cluster and Machine models for the GPU cluster simulator.

A :class:`Cluster` is a collection of :class:`Machine` instances.  Each
machine tracks its total and allocated resources across three dimensions:
GPUs, CPU cores, and memory (GiB).
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class Machine:
    """A single compute node in the GPU cluster.

    Tracks total capacity and current allocations for GPUs, CPU, and memory.
    """

    machine_id: str
    total_gpus: int
    total_cpu: float
    total_memory: float

    allocated_gpus: int = 0
    allocated_cpu: float = 0.0
    allocated_memory: float = 0.0

    running_jobs: list[str] = field(default_factory=list)
    """Job IDs currently running on this machine."""

    # ── Derived capacities ───────────────────────────────────────────────

    def free_gpus(self) -> int:
        """Return number of unallocated GPUs."""
        return self.total_gpus - self.allocated_gpus

    def free_cpu(self) -> float:
        """Return unallocated CPU cores."""
        return self.total_cpu - self.allocated_cpu

    def free_memory(self) -> float:
        """Return unallocated memory (GiB)."""
        return self.total_memory - self.allocated_memory

    def can_fit(self, requested_gpus: int, requested_cpu: float, requested_memory: float) -> bool:
        """Check whether this machine can accommodate the given resource request."""
        return (
            self.free_gpus() >= requested_gpus
            and self.free_cpu() >= requested_cpu
            and self.free_memory() >= requested_memory
        )

    def utilization(self) -> float:
        """Return average utilization across the three resource dimensions (0–1)."""
        gpu_util = self.allocated_gpus / self.total_gpus if self.total_gpus > 0 else 0.0
        cpu_util = self.allocated_cpu / self.total_cpu if self.total_cpu > 0 else 0.0
        mem_util = self.allocated_memory / self.total_memory if self.total_memory > 0 else 0.0
        return (gpu_util + cpu_util + mem_util) / 3.0

    def allocate(self, job_id: str, gpus: int, cpu: float, memory: float) -> None:
        """Allocate resources for a job.

        Raises
        ------
        ValueError
            If the machine cannot fit the requested resources.
        """
        if not self.can_fit(gpus, cpu, memory):
            raise ValueError(
                f"Machine {self.machine_id} cannot fit job {job_id}: "
                f"requested ({gpus} GPU, {cpu} CPU, {memory} MEM) "
                f"but free ({self.free_gpus()} GPU, {self.free_cpu()} CPU, "
                f"{self.free_memory()} MEM)."
            )
        self.allocated_gpus += gpus
        self.allocated_cpu += cpu
        self.allocated_memory += memory
        self.running_jobs.append(job_id)

    def release(self, job_id: str, gpus: int, cpu: float, memory: float) -> None:
        """Release resources previously allocated for *job_id*.

        Raises
        ------
        ValueError
            If *job_id* is not running on this machine.
        """
        if job_id not in self.running_jobs:
            raise ValueError(
                f"Job {job_id} is not running on machine {self.machine_id}."
            )
        self.allocated_gpus -= gpus
        self.allocated_cpu -= cpu
        self.allocated_memory -= memory
        self.running_jobs.remove(job_id)


class Cluster:
    """A collection of :class:`Machine` instances forming a GPU cluster.

    Provides aggregate queries over the machines and a convenience
    factory for uniform clusters.
    """

    def __init__(self, machines: list[Machine]) -> None:
        self.machines = machines
        self._index: dict[str, Machine] = {m.machine_id: m for m in machines}

    def __getitem__(self, machine_id: str) -> Machine:
        return self._index[machine_id]

    def __len__(self) -> int:
        return len(self.machines)

    # ── Aggregate queries ────────────────────────────────────────────────

    def total_free_gpus(self) -> int:
        """Sum of free GPUs across all machines."""
        return sum(m.free_gpus() for m in self.machines)

    def total_utilization(self) -> float:
        """Average utilization across all machines."""
        if not self.machines:
            return 0.0
        return sum(m.utilization() for m in self.machines) / len(self.machines)

    def get_feasible_machines(
        self,
        requested_gpus: int,
        requested_cpu: float,
        requested_memory: float,
    ) -> list[Machine]:
        """Return machines that can fit the given resource request."""
        return [
            m
            for m in self.machines
            if m.can_fit(requested_gpus, requested_cpu, requested_memory)
        ]

    # ── Factory ──────────────────────────────────────────────────────────

    @classmethod
    def create_default(
        cls,
        num_machines: int = 10,
        gpus: int = 8,
        cpu: float = 64.0,
        memory: float = 256.0,
        **kwargs: Any,
    ) -> Cluster:
        """Create a uniform cluster with identical machines."""
        gpus = kwargs.get("gpus_per_machine", gpus)
        cpu = kwargs.get("cpu_per_machine", cpu)
        memory = kwargs.get("memory_per_machine", memory)
        machines = [
            Machine(
                machine_id=f"machine-{i:03d}",
                total_gpus=gpus,
                total_cpu=cpu,
                total_memory=memory,
            )
            for i in range(num_machines)
        ]
        return cls(machines)
