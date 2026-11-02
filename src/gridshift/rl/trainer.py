"""PPO Training loop for the GPU cluster scheduling agent."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import torch
from sb3_contrib import MaskablePPO

# Set single thread on CPU to avoid sandbox thread pool contention on macOS
if not torch.cuda.is_available():
    torch.set_num_threads(1)

from ..data.schemas import CanonicalJob
from ..forecasting.predictor import ForecastPredictor
from .env import SchedulingEnv
from .reward import RewardWeights

logger = logging.getLogger(__name__)


def train_ppo_agent(
    train_jobs: list[CanonicalJob],
    cluster_config: dict[str, Any],
    candidate_k: int = 10,
    forecast_predictor: ForecastPredictor | None = None,
    reward_weights: RewardWeights | None = None,
    total_timesteps: int = 10000,
    learning_rate: float = 3e-4,
    seed: int = 42,
    output_checkpoint_path: str | Path | None = None,
) -> tuple[MaskablePPO, dict[str, Any]]:
    """Train a MaskablePPO agent on historical workload traces.

    Parameters
    ----------
    train_jobs:
        Chronological training jobs.
    cluster_config:
        Cluster node configuration.
    candidate_k:
        Size of candidate action set.
    forecast_predictor:
        Optional demand predictor.
    reward_weights:
        Optional reward weight configuration.
    total_timesteps:
        Total environment interaction steps.
    learning_rate:
        PPO learning rate.
    seed:
        Random seed.
    output_checkpoint_path:
        Optional path to save model checkpoint (.zip).

    Returns
    -------
    tuple[MaskablePPO, dict[str, Any]]
        Trained model instance and configuration metadata.
    """
    env = SchedulingEnv(
        jobs=train_jobs,
        cluster_config=cluster_config,
        candidate_k=candidate_k,
        forecast_predictor=forecast_predictor,
        reward_weights=reward_weights,
        seed=seed,
    )

    hyperparams = {
        "learning_rate": learning_rate,
        "n_steps": min(2048, max(64, len(train_jobs))),
        "batch_size": 64,
        "n_epochs": 10,
        "gamma": 0.99,
        "clip_range": 0.2,
        "verbose": 0,
        "seed": seed,
    }

    model = MaskablePPO("MlpPolicy", env, **hyperparams)
    logger.info("Starting PPO training for %d timesteps (seed=%d)...", total_timesteps, seed)
    model.learn(total_timesteps=total_timesteps)

    if output_checkpoint_path:
        out_path = Path(output_checkpoint_path)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        model.save(str(out_path))
        logger.info("Saved PPO checkpoint to %s", out_path)

    metadata = {
        "hyperparameters": hyperparams,
        "total_timesteps": total_timesteps,
        "candidate_k": candidate_k,
        "cluster_config": cluster_config,
        "seed": seed,
        "has_forecast": forecast_predictor is not None,
    }

    return model, metadata
