"""Unit tests for the discrete-event simulator."""

from __future__ import annotations

import copy
import pytest

from gridshift.data.schemas import CanonicalJob
from gridshift.simulator.cluster import Cluster
from gridshift.simulator.event_loop import EventLoop
from gridshift.simulator.policies.backfill import BackfillPolicy
from gridshift.simulator.policies.fcfs import FCFSPolicy


def test_simulation_determinism(mini_jobs: list[CanonicalJob], small_cluster: Cluster) -> None:
    """Running identical setup with identical seed produces identical metrics and job outcomes."""
    cluster1 = copy.deepcopy(small_cluster)
    sim1 = EventLoop(
        jobs=mini_jobs,
        cluster=cluster1,
        policy=BackfillPolicy(),
        seed=42,
    )
    res1 = sim1.run()

    cluster2 = copy.deepcopy(small_cluster)
    sim2 = EventLoop(
        jobs=mini_jobs,
        cluster=cluster2,
        policy=BackfillPolicy(),
        seed=42,
    )
    res2 = sim2.run()

    assert res1.metrics.avg_wait == res2.metrics.avg_wait
    assert res1.metrics.p95_wait == res2.metrics.p95_wait
    assert res1.metrics.gpu_utilization == res2.metrics.gpu_utilization
    assert res1.metrics.completed_jobs == res2.metrics.completed_jobs
    assert len(res1.completed_jobs) == len(res2.completed_jobs)

    for o1, o2 in zip(res1.completed_jobs, res2.completed_jobs):
        assert o1.job_id == o2.job_id
        assert o1.start_time == o2.start_time
        assert o1.assigned_machine == o2.assigned_machine


def test_no_capacity_violations(mini_jobs: list[CanonicalJob], small_cluster: Cluster) -> None:
    """The simulator never produces constraint violations under backfill policy."""
    sim = EventLoop(
        jobs=mini_jobs,
        cluster=small_cluster,
        policy=BackfillPolicy(),
        seed=123,
    )
    res = sim.run()

    assert res.metrics.constraint_violations == 0
    # Every machine should have valid non-negative free capacity at the end
    for m in small_cluster.machines:
        assert m.free_gpus() >= 0
        assert m.free_cpu() >= 0.0
        assert m.free_memory() >= 0.0


def test_jobs_start_after_or_at_submit_time(
    mini_jobs: list[CanonicalJob], small_cluster: Cluster
) -> None:
    """Every completed job satisfies start_time >= submit_time."""
    sim = EventLoop(
        jobs=mini_jobs,
        cluster=small_cluster,
        policy=BackfillPolicy(),
        seed=42,
    )
    res = sim.run()

    for outcome in res.completed_jobs:
        assert outcome.start_time >= outcome.submit_time
        assert outcome.completion_time > outcome.start_time
        assert outcome.wait_time >= 0.0
