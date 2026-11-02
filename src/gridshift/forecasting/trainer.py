"""Training routines for XGBoost demand forecaster and naive baseline."""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
import xgboost as xgb


def get_feature_columns(df: pd.DataFrame) -> list[str]:
    """Identify feature columns in the forecast DataFrame."""
    exclude = {"bin", "timestamp", "gpu_demand", "job_count", "avg_gpu_per_job", "target_gpu_demand"}
    return [col for col in df.columns if col not in exclude]


def train_xgboost(
    train_df: pd.DataFrame,
    val_df: pd.DataFrame,
    hyperparams: dict[str, Any] | None = None,
) -> tuple[xgb.XGBRegressor, dict[str, Any]]:
    """Train an XGBoost regressor on time-series features with validation early-stopping.

    Parameters
    ----------
    train_df:
        Training partition containing feature and target columns.
    val_df:
        Validation partition used for early stopping.
    hyperparams:
        Optional dictionary of XGBoost hyperparameters.

    Returns
    -------
    tuple[xgb.XGBRegressor, dict[str, Any]]
        The fitted model and its configuration summary.
    """
    feature_cols = get_feature_columns(train_df)
    target_col = "target_gpu_demand"

    params: dict[str, Any] = {
        "n_estimators": 200,
        "max_depth": 5,
        "learning_rate": 0.05,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
        "random_state": 42,
        "objective": "reg:squarederror",
    }
    if hyperparams:
        params.update(hyperparams)

    X_train = train_df[feature_cols]
    y_train = train_df[target_col]

    X_val = val_df[feature_cols]
    y_val = val_df[target_col]

    model = xgb.XGBRegressor(**params, early_stopping_rounds=15)
    model.fit(
        X_train,
        y_train,
        eval_set=[(X_val, y_val)],
        verbose=False,
    )

    training_config = {
        "hyperparameters": params,
        "feature_columns": feature_cols,
        "best_iteration": getattr(model, "best_iteration", None),
        "train_samples": len(train_df),
        "val_samples": len(val_df),
    }

    return model, training_config


def train_naive_baseline(
    test_df: pd.DataFrame,
    lag_column: str = "lag_gpu_1",
    horizon_steps: int = 6,
) -> np.ndarray:
    """Produce naive predictions by projecting recent demand forward over the horizon.

    Parameters
    ----------
    test_df:
        Test set DataFrame containing the lag column.
    lag_column:
        Column representing immediate previous demand (default: 'lag_gpu_1').
    horizon_steps:
        Number of steps in the horizon to scale the single-bin demand.

    Returns
    -------
    np.ndarray
        Array of baseline predicted demands.
    """
    if lag_column in test_df.columns:
        # Scale immediate previous bin demand across the horizon window
        return (test_df[lag_column].values * horizon_steps).astype(float)
    return np.zeros(len(test_df), dtype=float)

