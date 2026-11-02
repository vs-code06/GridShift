"""Unit tests for forecasting feature generation, splitting, and evaluation."""

from __future__ import annotations

import numpy as np
import pandas as pd
import pytest

from gridshift.forecasting.evaluator import compute_wape, evaluate_forecast
from gridshift.forecasting.features import build_forecast_features
from gridshift.forecasting.splitter import chronological_split
from gridshift.forecasting.trainer import train_naive_baseline, train_xgboost


@pytest.fixture
def sample_jobs_df() -> pd.DataFrame:
    # 200 jobs over 10 hours (36,000 seconds)
    np.random.seed(42)
    n = 200
    submits = np.sort(np.random.uniform(0, 36000, n))
    gpus = np.random.choice([1, 2, 4, 8], n)
    return pd.DataFrame(
        {
            "job_id": [f"job_{i}" for i in range(n)],
            "submit_time": submits,
            "requested_gpus": gpus,
            "requested_cpu": gpus * 4.0,
            "requested_memory": gpus * 16.0,
            "observed_runtime": np.random.uniform(30, 300, n),
        }
    )


def test_build_forecast_features(sample_jobs_df: pd.DataFrame) -> None:
    features = build_forecast_features(
        sample_jobs_df,
        interval_minutes=5,
        horizon_minutes=30,
        lags=(1, 2, 3),
    )
    assert not features.empty
    assert "target_gpu_demand" in features.columns
    assert "lag_gpu_1" in features.columns
    assert "hour_sin" in features.columns
    assert "hour_cos" in features.columns
    # Check no NaNs
    assert features["target_gpu_demand"].isna().sum() == 0


def test_chronological_split(sample_jobs_df: pd.DataFrame) -> None:
    features = build_forecast_features(sample_jobs_df, interval_minutes=5, horizon_minutes=30)
    train, val, test = chronological_split(features, train_frac=0.6, val_frac=0.2, test_frac=0.2)

    assert len(train) > 0
    assert len(val) > 0
    assert len(test) > 0
    assert len(train) + len(val) + len(test) == len(features)
    # Temporal order check: train timestamps < val timestamps < test timestamps
    assert train["timestamp"].max() <= val["timestamp"].min()
    assert val["timestamp"].max() <= test["timestamp"].min()


def test_train_xgboost_and_eval(sample_jobs_df: pd.DataFrame) -> None:
    features = build_forecast_features(sample_jobs_df, interval_minutes=5, horizon_minutes=30)
    train, val, test = chronological_split(features, 0.6, 0.2, 0.2)

    model, cfg = train_xgboost(train, val, hyperparams={"n_estimators": 10, "max_depth": 3})
    assert model is not None
    assert "feature_columns" in cfg

    eval_res = evaluate_forecast(model, test, model_name="XGBoost_Test")
    assert "mae" in eval_res
    assert "rmse" in eval_res
    assert "wape" in eval_res
    assert eval_res["mae"] >= 0.0


def test_wape_computation() -> None:
    y_true = np.array([10.0, 20.0, 30.0])
    y_pred = np.array([12.0, 18.0, 33.0])
    # |10-12| + |20-18| + |30-33| = 2 + 2 + 3 = 7
    # sum(|y_true|) = 60
    # wape = 7 / 60
    assert round(compute_wape(y_true, y_pred), 4) == round(7.0 / 60.0, 4)
