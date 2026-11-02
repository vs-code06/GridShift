"""Unit tests for placement logic and resource invariants."""

from __future__ import annotations

import pytest

from gridshift.data.schemas import CanonicalJob
from gridshift.simulator.cluster import Cluster, Machine
from gridshift.simulator.placement import best_fit_score, feasibility_check, place_job


def test_feasibility_check(small_cluster: Cluster) -> None:
    node = small_cluster.machines[0]  # 4 GPUs, 32 CPU, 128 RAM

    fit_job = CanonicalJob(
        job_id="fit",
        submit_time=0.0,
        requested_gpus=2,
        requested_cpu=16.0,
        requested_memory=64.0,
        observed_runtime=60.0,
    )
    assert feasibility_check(fit_job, node) is True

    too_many_gpus = CanonicalJob(
        job_id="too_gpu",
        submit_time=0.0,
        requested_gpus=8,
        requested_cpu=16.0,
        requested_memory=64.0,
        observed_runtime=60.0,
    )
    assert feasibility_check(too_many_gpus, node) is False

    too_much_cpu = CanonicalJob(
        job_id="too_cpu",
        submit_time=0.0,
        requested_gpus=2,
        requested_cpu=64.0,
        requested_memory=64.0,
        observed_runtime=60.0,
    )
    assert feasibility_check(too_much_cpu, node) is False

    too_much_mem = CanonicalJob(
        job_id="too_mem",
        submit_time=0.0,
        requested_gpus=2,
        requested_cpu=16.0,
        requested_memory=256.0,
        observed_runtime=60.0,
    )
    assert feasibility_check(too_much_mem, node) is False


def test_best_fit_prefers_tighter_machine() -> None:
    # Machine A has 8 GPUs free
    # Machine B has 4 GPUs free
    # Job asks for 4 GPUs -> Machine B leaves 0 free GPUs (tighter fit)
    m_loose = Machine("loose", total_gpus=8, total_cpu=64.0, total_memory=256.0)
    m_tight = Machine("tight", total_gpus=4, total_cpu=32.0, total_memory=128.0)
    cluster = Cluster(machines=[m_loose, m_tight])

    job = CanonicalJob(
        job_id="job",
        submit_time=0.0,
        requested_gpus=4,
        requested_cpu=32.0,
        requested_memory=128.0,
        observed_runtime=60.0,
    )

    chosen = place_job(job, cluster)
    assert chosen == "tight"


def test_place_job_returns_none_when_infeasible(small_cluster: Cluster) -> None:
    huge_job = CanonicalJob(
        job_id="huge",
        submit_time=0.0,
        requested_gpus=16,
        requested_cpu=128.0,
        requested_memory=512.0,
        observed_runtime=60.0,
    )
    assert place_job(huge_job, small_cluster) is None


def test_capacity_never_negative_after_allocation(small_cluster: Cluster) -> None:
    node = small_cluster.machines[0]
    node.allocate("job_x", gpus=4, cpu=32.0, memory=128.0)
    assert node.free_gpus() == 0
    assert node.free_cpu() == 0.0
    assert node.free_memory() == 0.0
    assert node.can_fit(1, 1.0, 1.0) is False
