"""Unit tests for the custom Gymnasium scheduling environment."""

from __future__ import annotations

import numpy as np
import pytest

from gridshift.data.schemas import CanonicalJob
from gridshift.rl.action_mask import compute_action_mask
from gridshift.rl.env import SchedulingEnv
from gridshift.rl.observation import build_observation, get_observation_dim
from gridshift.rl.reward import calculate_step_reward
from gridshift.simulator.cluster import Cluster, Machine


def test_observation_dimensions() -> None:
    dim = get_observation_dim(num_machines=5, candidate_k=10)
    # 4 (queue) + 4 * 10 (candidates) + 4 * 5 (nodes) + 3 (running) + 2 (forecast) = 4 + 40 + 20 + 3 + 2 = 69
    assert dim == 69


def test_action_mask_logic(small_cluster: Cluster) -> None:
    # 3 nodes with 4 GPUs each
    job_fits = CanonicalJob(
        job_id="fits",
        submit_time=0.0,
        requested_gpus=2,
        requested_cpu=8.0,
        requested_memory=32.0,
        observed_runtime=60.0,
    )
    job_too_big = CanonicalJob(
        job_id="too_big",
        submit_time=1.0,
        requested_gpus=8,
        requested_cpu=64.0,
        requested_memory=256.0,
        observed_runtime=60.0,
    )

    mask = compute_action_mask([job_fits, job_too_big], small_cluster, candidate_k=5)
    # Shape is K + 1 = 6
    assert mask.shape == (6,)
    # Index 0 (job_fits) must be True
    assert bool(mask[0]) is True
    # Index 1 (job_too_big) must be False
    assert bool(mask[1]) is False
    # Indices 2, 3, 4 (empty slots) must be False
    assert bool(mask[2]) is False
    assert bool(mask[3]) is False
    assert bool(mask[4]) is False
    # Index 5 (WAIT) must ALWAYS be True
    assert bool(mask[5]) is True


def test_environment_lifecycle(mini_jobs: list[CanonicalJob]) -> None:
    env = SchedulingEnv(
        jobs=mini_jobs,
        cluster_config={"num_machines": 3, "gpus_per_machine": 4, "cpu_per_machine": 32, "memory_per_machine": 128},
        candidate_k=5,
    )

    obs, info = env.reset(seed=42)
    assert isinstance(obs, np.ndarray)
    assert obs.shape == env.observation_space.shape
    assert np.all(obs >= 0.0) and np.all(obs <= 1.0)
    assert "queue_len" in info

    mask = env.action_masks()
    assert mask.shape == (6,)
    assert bool(mask[-1]) is True  # WAIT

    # Take an action
    valid_actions = np.where(mask)[0]
    action = int(valid_actions[0])

    next_obs, reward, terminated, truncated, step_info = env.step(action)
    assert isinstance(reward, float)
    assert next_obs.shape == env.observation_space.shape
    assert isinstance(terminated, bool)
    assert isinstance(truncated, bool)


def test_environment_full_rollout(mini_jobs: list[CanonicalJob]) -> None:
    """Agent running random valid actions finishes the trace."""
    env = SchedulingEnv(
        jobs=mini_jobs,
        cluster_config={"num_machines": 3, "gpus_per_machine": 4, "cpu_per_machine": 32, "memory_per_machine": 128},
        candidate_k=5,
    )

    obs, info = env.reset(seed=42)
    terminated = False
    steps = 0
    max_steps = 1000

    while not terminated and steps < max_steps:
        mask = env.action_masks()
        valid_actions = np.where(mask)[0]
        # Prefer scheduling a job (action < K) if available, else WAIT
        job_actions = [a for a in valid_actions if a < 5]
        action = job_actions[0] if job_actions else 5

        obs, reward, terminated, truncated, info = env.step(action)
        steps += 1

    assert terminated is True
    metrics = env.compute_metrics()
    assert metrics.completed_jobs > 0
    assert metrics.constraint_violations == 0
