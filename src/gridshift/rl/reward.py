"""Reward formulation for the scheduling RL agent.

Follows the PRD specification:
- Queue-wait penalty: discourages jobs from remaining queued unnecessarily.
- GPU-idle penalty while backlog exists: penalises leaving capacity idle when feasible jobs are waiting.
- Completion/throughput reward: rewards useful work completing.
- Hard constraints enforced via action masking rather than soft reward penalties.
"""

from __future__ import annotations

from dataclasses import dataclass

from ..data.schemas import CanonicalJob
from ..simulator.cluster import Cluster


@dataclass
class RewardWeights:
    """Configurable weights for reward components."""

    queue_wait_weight: float = 0.05
    idle_penalty_weight: float = 0.1
    completion_reward_weight: float = 1.0
    fairness_penalty_weight: float = 0.02


def calculate_step_reward(
    queue: list[CanonicalJob],
    cluster: Cluster,
    current_time: float,
    jobs_completed_this_step: int = 0,
    has_feasible_waiting_job: bool = False,
    weights: RewardWeights | None = None,
) -> float:
    """Calculate the scalar reward for a single environment step.

    Parameters
    ----------
    queue:
        Current jobs remaining in queue.
    cluster:
        Current cluster state.
    current_time:
        Current simulation clock time.
    jobs_completed_this_step:
        Count of jobs that completed since the last step.
    has_feasible_waiting_job:
        True if at least one queued job could fit on some machine right now.
    weights:
        Optional weight overrides.

    Returns
    -------
    float
        Normalized scalar reward.
    """
    if weights is None:
        weights = RewardWeights()

    reward = 0.0

    # 1. Completion reward (throughput encouragement)
    reward += weights.completion_reward_weight * float(jobs_completed_this_step)

    # 2. Queue wait penalty (normalized by job count and maximum reference age)
    if queue:
        total_wait_sec = sum(max(0.0, current_time - j.submit_time) for j in queue)
        # Normalize total wait by 3600 seconds (1 hour per job)
        norm_wait = total_wait_sec / (3600.0 * max(1, len(queue)))
        reward -= weights.queue_wait_weight * min(norm_wait, 5.0)

        # Fairness penalty based on oldest waiting job
        max_wait_sec = max(max(0.0, current_time - j.submit_time) for j in queue)
        norm_max_wait = max_wait_sec / 3600.0
        reward -= weights.fairness_penalty_weight * min(norm_max_wait, 5.0)

    # 3. GPU idle penalty while backlog can fit
    if has_feasible_waiting_job:
        total_gpus = max(1, sum(m.total_gpus for m in cluster.machines))
        free_gpus = sum(m.free_gpus() for m in cluster.machines)
        idle_ratio = free_gpus / float(total_gpus)
        reward -= weights.idle_penalty_weight * idle_ratio

    return float(reward)
