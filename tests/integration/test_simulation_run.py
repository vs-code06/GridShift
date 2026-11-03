"""Integration tests for full simulation runs under FCFS and Backfill policies."""

import pytest

from gridshift.data.schemas import CanonicalJob
from gridshift.evaluation.experiment import run_policy_experiment


def test_simulation_run_conservation_and_invariants(mini_jobs: list[CanonicalJob]) -> None:
    """Verify that all jobs complete and zero capacity violations occur."""
    cluster_cfg = {
        "num_machines": 2,
        "gpus_per_machine": 8,
        "cpu_per_machine": 64.0,
        "memory_per_machine": 256.0,
    }

    res_fcfs = run_policy_experiment(
        jobs=mini_jobs,
        policy="fcfs",
        cluster_config=cluster_cfg,
        seed=42,
    )

    res_backfill = run_policy_experiment(
        jobs=mini_jobs,
        policy="backfill",
        cluster_config=cluster_cfg,
        seed=42,
    )

    # Invariants
    assert res_fcfs.metrics.constraint_violations == 0
    assert res_backfill.metrics.constraint_violations == 0

    # Conservation of jobs
    assert res_fcfs.completed_jobs_count == len(mini_jobs)
    assert res_backfill.completed_jobs_count == len(mini_jobs)

    # Positive throughput and valid metrics
    assert res_fcfs.metrics.throughput > 0
    assert res_backfill.metrics.throughput > 0
    assert 0.0 <= res_fcfs.metrics.gpu_utilization <= 1.0
    assert 0.0 <= res_backfill.metrics.gpu_utilization <= 1.0


def test_simulation_run_determinism(mini_jobs: list[CanonicalJob]) -> None:
    """Verify identical seeds produce identical metrics."""
    cluster_cfg = {
        "num_machines": 2,
        "gpus_per_machine": 4,
        "cpu_per_machine": 32.0,
        "memory_per_machine": 128.0,
    }

    run_1 = run_policy_experiment(
        jobs=mini_jobs,
        policy="backfill",
        cluster_config=cluster_cfg,
        seed=123,
    )
    run_2 = run_policy_experiment(
        jobs=mini_jobs,
        policy="backfill",
        cluster_config=cluster_cfg,
        seed=123,
    )

    assert run_1.metrics.avg_wait == run_2.metrics.avg_wait
    assert run_1.metrics.p95_wait == run_2.metrics.p95_wait
    assert run_1.metrics.gpu_utilization == run_2.metrics.gpu_utilization
    assert run_1.metrics.throughput == run_2.metrics.throughput
