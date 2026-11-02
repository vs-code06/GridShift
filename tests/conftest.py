"""Pytest configuration and shared fixtures for GridShift tests."""

from __future__ import annotations

import pytest

from gridshift.data.schemas import CanonicalJob
from gridshift.simulator.cluster import Cluster, Machine


@pytest.fixture
def mini_jobs() -> list[CanonicalJob]:
    """10 hand-crafted CanonicalJob objects with staggered arrivals and diverse requests."""
    return [
        CanonicalJob(
            job_id="job_0",
            submit_time=0.0,
            requested_gpus=2,
            requested_cpu=8.0,
            requested_memory=32.0,
            observed_runtime=60.0,
        ),
        CanonicalJob(
            job_id="job_1",
            submit_time=10.0,
            requested_gpus=4,
            requested_cpu=16.0,
            requested_memory=64.0,
            observed_runtime=120.0,
        ),
        CanonicalJob(
            job_id="job_2",
            submit_time=20.0,
            requested_gpus=1,
            requested_cpu=4.0,
            requested_memory=16.0,
            observed_runtime=30.0,
        ),
        CanonicalJob(
            job_id="job_3",
            submit_time=30.0,
            requested_gpus=8,
            requested_cpu=32.0,
            requested_memory=128.0,
            observed_runtime=200.0,
        ),
        CanonicalJob(
            job_id="job_4",
            submit_time=40.0,
            requested_gpus=2,
            requested_cpu=8.0,
            requested_memory=32.0,
            observed_runtime=50.0,
        ),
        CanonicalJob(
            job_id="job_5",
            submit_time=50.0,
            requested_gpus=4,
            requested_cpu=16.0,
            requested_memory=64.0,
            observed_runtime=90.0,
        ),
        CanonicalJob(
            job_id="job_6",
            submit_time=60.0,
            requested_gpus=1,
            requested_cpu=4.0,
            requested_memory=16.0,
            observed_runtime=45.0,
        ),
        CanonicalJob(
            job_id="job_7",
            submit_time=70.0,
            requested_gpus=2,
            requested_cpu=8.0,
            requested_memory=32.0,
            observed_runtime=60.0,
        ),
        CanonicalJob(
            job_id="job_8",
            submit_time=80.0,
            requested_gpus=4,
            requested_cpu=16.0,
            requested_memory=64.0,
            observed_runtime=100.0,
        ),
        CanonicalJob(
            job_id="job_9",
            submit_time=90.0,
            requested_gpus=1,
            requested_cpu=4.0,
            requested_memory=16.0,
            observed_runtime=30.0,
        ),
    ]


@pytest.fixture
def small_cluster() -> Cluster:
    """Cluster of 3 machines with 4 GPUs, 32 CPU cores, and 128 GiB RAM each."""
    machines = [
        Machine(
            machine_id=f"node_{i}",
            total_gpus=4,
            total_cpu=32.0,
            total_memory=128.0,
        )
        for i in range(3)
    ]
    return Cluster(machines=machines)


@pytest.fixture
def single_machine_cluster() -> Cluster:
    """Cluster with 1 machine: 8 GPUs, 64 CPU cores, 256 GiB RAM."""
    return Cluster(
        machines=[
            Machine(
                machine_id="node_0",
                total_gpus=8,
                total_cpu=64.0,
                total_memory=256.0,
            )
        ]
    )
