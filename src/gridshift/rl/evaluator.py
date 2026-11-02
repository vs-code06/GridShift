"""Multi-seed evaluation harness for the PPO scheduling policy."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Sequence

import numpy as np
import torch
from sb3_contrib import MaskablePPO

from ..data.schemas import CanonicalJob
from ..forecasting.predictor import ForecastPredictor
from ..simulator.metrics import SchedulingMetrics
from .env import SchedulingEnv

if not torch.cuda.is_available():
    torch.set_num_threads(1)

logger = logging.getLogger(__name__)


def evaluate_ppo_policy(
    model: MaskablePPO | str | Path,
    test_jobs: list[CanonicalJob],
    cluster_config: dict[str, Any],
    candidate_k: int = 10,
    forecast_predictor: ForecastPredictor | None = None,
    seeds: Sequence[int] = (42, 43, 44),
    deterministic: bool = True,
) -> dict[str, Any]:
    """Evaluate a trained PPO policy across multiple evaluation seeds.

    Parameters
    ----------
    model:
        Loaded MaskablePPO instance or path to saved checkpoint.
    test_jobs:
        Held-out canonical jobs for testing.
    cluster_config:
        Cluster node configuration.
    candidate_k:
        Candidate set size.
    forecast_predictor:
        Optional demand forecaster.
    seeds:
        List of random seeds to evaluate.
    deterministic:
        Whether to select argmax actions (recommended for evaluation).

    Returns
    -------
    dict[str, Any]
        Dictionary with per-seed runs and aggregated mean ± std statistics.
    """
    if isinstance(model, (str, Path)):
        loaded_model = MaskablePPO.load(str(model))
    else:
        loaded_model = model

    seed_results: list[dict[str, Any]] = []

    for seed in seeds:
        env = SchedulingEnv(
            jobs=test_jobs,
            cluster_config=cluster_config,
            candidate_k=candidate_k,
            forecast_predictor=forecast_predictor,
            seed=seed,
        )

        obs, _ = env.reset(seed=seed)
        terminated = False
        truncated = False
        total_reward = 0.0
        steps = 0
        max_steps = max(1000, len(test_jobs) * 4)

        while not (terminated or truncated) and steps < max_steps:
            action_mask = env.action_masks()
            action, _ = loaded_model.predict(
                obs,
                action_masks=action_mask,
                deterministic=deterministic,
            )
            obs, reward, terminated, truncated, _ = env.step(int(action))
            total_reward += reward
            steps += 1

        metrics: SchedulingMetrics = env.compute_metrics()
        seed_results.append(
            {
                "seed": seed,
                "total_reward": round(total_reward, 4),
                "avg_wait": round(metrics.avg_wait, 4),
                "p95_wait": round(metrics.p95_wait, 4),
                "gpu_utilization": round(metrics.gpu_utilization, 4),
                "throughput": round(metrics.throughput, 4),
                "fragmentation_events": metrics.fragmentation_events,
                "constraint_violations": metrics.constraint_violations,
                "completed_jobs": metrics.completed_jobs,
                "total_jobs": metrics.total_jobs,
            }
        )

    # Compute aggregated mean and std
    avg_waits = [r["avg_wait"] for r in seed_results]
    p95_waits = [r["p95_wait"] for r in seed_results]
    utils = [r["gpu_utilization"] for r in seed_results]
    throughputs = [r["throughput"] for r in seed_results]

    summary = {
        "seeds": list(seeds),
        "mean_avg_wait": round(float(np.mean(avg_waits)), 4),
        "std_avg_wait": round(float(np.std(avg_waits)), 4),
        "mean_p95_wait": round(float(np.mean(p95_waits)), 4),
        "std_p95_wait": round(float(np.std(p95_waits)), 4),
        "mean_gpu_utilization": round(float(np.mean(utils)), 4),
        "std_gpu_utilization": round(float(np.std(utils)), 4),
        "mean_throughput": round(float(np.mean(throughputs)), 4),
        "std_throughput": round(float(np.std(throughputs)), 4),
        "seed_runs": seed_results,
    }

    return summary
