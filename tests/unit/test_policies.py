"""Unit tests for baseline scheduling policies."""

from __future__ import annotations

from gridshift.data.schemas import CanonicalJob
from gridshift.simulator.cluster import Cluster, Machine
from gridshift.simulator.event_loop import EventLoop
from gridshift.simulator.policies.backfill import BackfillPolicy
from gridshift.simulator.policies.fcfs import FCFSPolicy


def test_fcfs_blocks_when_head_does_not_fit() -> None:
    # Machine has 4 GPUs
    # Job 0 requests 8 GPUs (cannot fit)
    # Job 1 requests 2 GPUs (could fit)
    cluster = Cluster(machines=[Machine("m0", total_gpus=4, total_cpu=32.0, total_memory=128.0)])

    job0 = CanonicalJob(
        job_id="blocked_head",
        submit_time=0.0,
        requested_gpus=8,
        requested_cpu=16.0,
        requested_memory=64.0,
        observed_runtime=60.0,
    )
    job1 = CanonicalJob(
        job_id="fittable_behind",
        submit_time=10.0,
        requested_gpus=2,
        requested_cpu=8.0,
        requested_memory=32.0,
        observed_runtime=30.0,
    )

    policy = FCFSPolicy()
    decisions = policy.select_jobs([job0, job1], cluster)
    # FCFS must refuse to bypass job0
    assert len(decisions) == 0


def test_backfill_skips_unfittable_and_schedules_fittable() -> None:
    cluster = Cluster(machines=[Machine("m0", total_gpus=4, total_cpu=32.0, total_memory=128.0)])

    job0 = CanonicalJob(
        job_id="blocked_head",
        submit_time=0.0,
        requested_gpus=8,
        requested_cpu=16.0,
        requested_memory=64.0,
        observed_runtime=60.0,
    )
    job1 = CanonicalJob(
        job_id="fittable_behind",
        submit_time=10.0,
        requested_gpus=2,
        requested_cpu=8.0,
        requested_memory=32.0,
        observed_runtime=30.0,
    )

    policy = BackfillPolicy()
    decisions = policy.select_jobs([job0, job1], cluster)
    # Backfill should skip job0 and schedule job1 on m0
    assert len(decisions) == 1
    assert decisions[0].job.job_id == "fittable_behind"
    assert decisions[0].machine_id == "m0"
