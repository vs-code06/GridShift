"""Forecast feature ablation experiment framework."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from ..data.schemas import CanonicalJob
from ..forecasting.predictor import ForecastPredictor
from ..rl.evaluator import evaluate_ppo_policy
from ..rl.trainer import train_ppo_agent

logger = logging.getLogger(__name__)


def run_forecast_ablation(
    train_jobs: list[CanonicalJob],
    test_jobs: list[CanonicalJob],
    cluster_config: dict[str, Any],
    forecast_model_path: str | Path | None = None,
    candidate_k: int = 10,
    timesteps: int = 5000,
    seeds: tuple[int, ...] = (42, 43, 44),
    output_dir: str | Path | None = None,
) -> dict[str, Any]:
    """Execute ablation comparing PPO with vs without forecast features.

    Parameters
    ----------
    train_jobs:
        Training workload subset.
    test_jobs:
        Held-out evaluation workload.
    cluster_config:
        Cluster specifications.
    forecast_model_path:
        Path to XGBoost forecast model.
    candidate_k:
        Queue candidate size.
    timesteps:
        Training timesteps for each model variant.
    seeds:
        Evaluation seeds.
    output_dir:
        Directory to save checkpoints and reports.

    Returns
    -------
    dict[str, Any]
        Comparative dictionary showing metrics for both variants.
    """
    out = Path(output_dir) if output_dir else Path("artifacts/experiments/ablation")
    out.mkdir(parents=True, exist_ok=True)

    # 1. Train PPO without forecast
    logger.info("Ablation 1/2: Training PPO WITHOUT forecast features...")
    model_no_fc, _ = train_ppo_agent(
        train_jobs=train_jobs,
        cluster_config=cluster_config,
        candidate_k=candidate_k,
        forecast_predictor=None,
        total_timesteps=timesteps,
        seed=seeds[0],
        output_checkpoint_path=out / "ppo_no_forecast.zip",
    )

    eval_no_fc = evaluate_ppo_policy(
        model=model_no_fc,
        test_jobs=test_jobs,
        cluster_config=cluster_config,
        candidate_k=candidate_k,
        forecast_predictor=None,
        seeds=seeds,
    )

    # 2. Train PPO with forecast
    predictor = None
    if forecast_model_path and Path(forecast_model_path).exists():
        predictor = ForecastPredictor(model_path=forecast_model_path)

    logger.info("Ablation 2/2: Training PPO WITH forecast features...")
    model_with_fc, _ = train_ppo_agent(
        train_jobs=train_jobs,
        cluster_config=cluster_config,
        candidate_k=candidate_k,
        forecast_predictor=predictor,
        total_timesteps=timesteps,
        seed=seeds[0],
        output_checkpoint_path=out / "ppo_with_forecast.zip",
    )

    eval_with_fc = evaluate_ppo_policy(
        model=model_with_fc,
        test_jobs=test_jobs,
        cluster_config=cluster_config,
        candidate_k=candidate_k,
        forecast_predictor=predictor,
        seeds=seeds,
    )

    delta_avg_wait = eval_with_fc["mean_avg_wait"] - eval_no_fc["mean_avg_wait"]
    delta_util = eval_with_fc["mean_gpu_utilization"] - eval_no_fc["mean_gpu_utilization"]

    return {
        "timesteps": timesteps,
        "evaluation_seeds": list(seeds),
        "without_forecast": eval_no_fc,
        "with_forecast": eval_with_fc,
        "deltas": {
            "avg_wait_change_sec": round(delta_avg_wait, 4),
            "gpu_utilization_change": round(delta_util, 4),
            "forecast_helps_wait": delta_avg_wait < 0,
            "forecast_helps_util": delta_util > 0,
        },
    }
