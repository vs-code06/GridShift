"""Unit tests for RL reward calculation."""

import pytest

from gridshift.data.schemas import CanonicalJob
from gridshift.rl.reward import RewardWeights, calculate_step_reward
from gridshift.simulator.cluster import Cluster


def test_zero_reward_when_idle_and_empty() -> None:
    cluster = Cluster.create_default(num_machines=2, gpus=8)
    reward = calculate_step_reward(
        queue=[],
        cluster=cluster,
        current_time=100.0,
        jobs_completed_this_step=0,
        has_feasible_waiting_job=False,
    )
    assert reward == 0.0


def test_completion_reward_scales() -> None:
    cluster = Cluster.create_default(num_machines=2, gpus=8)
    reward_1 = calculate_step_reward(
        queue=[],
        cluster=cluster,
        current_time=100.0,
        jobs_completed_this_step=1,
    )
    reward_3 = calculate_step_reward(
        queue=[],
        cluster=cluster,
        current_time=100.0,
        jobs_completed_this_step=3,
    )
    assert reward_1 == 1.0
    assert reward_3 == 3.0


def test_queue_wait_penalty_increases_with_wait_time() -> None:
    cluster = Cluster.create_default(num_machines=2, gpus=8)
    job = CanonicalJob(
        job_id="j1",
        submit_time=0.0,
        requested_gpus=4,
        requested_cpu=16,
        requested_memory=64,
        observed_runtime=100,
    )
    # Short wait: current_time = 60s
    short_wait_reward = calculate_step_reward(
        queue=[job],
        cluster=cluster,
        current_time=60.0,
    )
    # Long wait: current_time = 3600s
    long_wait_reward = calculate_step_reward(
        queue=[job],
        cluster=cluster,
        current_time=3600.0,
    )
    assert short_wait_reward < 0.0
    assert long_wait_reward < short_wait_reward


def test_idle_penalty_applied_when_backlog_is_feasible() -> None:
    cluster = Cluster.create_default(num_machines=2, gpus=8)
    reward_infeasible = calculate_step_reward(
        queue=[],
        cluster=cluster,
        current_time=100.0,
        has_feasible_waiting_job=False,
    )
    reward_feasible = calculate_step_reward(
        queue=[],
        cluster=cluster,
        current_time=100.0,
        has_feasible_waiting_job=True,
    )
    # All 16 GPUs are free, so idle_ratio = 1.0 -> penalty = -0.1
    assert reward_infeasible == 0.0
    assert reward_feasible == pytest.approx(-0.1, abs=1e-5)


def test_custom_reward_weights() -> None:
    cluster = Cluster.create_default(num_machines=2, gpus=8)
    custom_weights = RewardWeights(
        completion_reward_weight=5.0,
        idle_penalty_weight=0.5,
    )
    reward = calculate_step_reward(
        queue=[],
        cluster=cluster,
        current_time=100.0,
        jobs_completed_this_step=2,
        has_feasible_waiting_job=True,
        weights=custom_weights,
    )
    # 2 * 5.0 - 0.5 * 1.0 = 9.5
    assert reward == pytest.approx(9.5, abs=1e-5)

