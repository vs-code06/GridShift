"""Evaluation metrics and reporting for workload demand forecasters."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, root_mean_squared_error
import xgboost as xgb

from .trainer import get_feature_columns


def compute_wape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Compute Weighted Absolute Percentage Error (WAPE).

    WAPE = sum(|y_true - y_pred|) / sum(|y_true|)
    Avoids division-by-zero problems common to MAPE when actual values are 0.
    """
    denom = float(np.sum(np.abs(y_true)))
    if denom == 0.0:
        return 0.0
    return float(np.sum(np.abs(y_true - y_pred)) / denom)


def evaluate_forecast(
    model: xgb.XGBRegressor | None,
    test_df: pd.DataFrame,
    predictions: np.ndarray | None = None,
    model_name: str = "model",
) -> dict[str, Any]:
    """Compute forecast evaluation metrics (MAE, RMSE, WAPE) on test data.

    Parameters
    ----------
    model:
        Trained model (optional if precomputed *predictions* provided).
    test_df:
        Test set DataFrame with target column ``target_gpu_demand``.
    predictions:
        Pre-computed predictions (e.g. from baseline).
    model_name:
        Identifying name for logging and reports.

    Returns
    -------
    dict[str, Any]
        Dictionary with metrics and sample summaries.
    """
    target_col = "target_gpu_demand"
    y_true = test_df[target_col].values.astype(float)

    if predictions is None:
        if model is None:
            raise ValueError("Either model or predictions must be provided.")
        feature_cols = get_feature_columns(test_df)
        X_test = test_df[feature_cols]
        y_pred = model.predict(X_test).astype(float)
    else:
        y_pred = predictions.astype(float)

    # Force predictions to non-negative (demand cannot be negative)
    y_pred = np.clip(y_pred, 0.0, None)

    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(root_mean_squared_error(y_true, y_pred))
    wape = compute_wape(y_true, y_pred)

    result = {
        "model_name": model_name,
        "mae": round(mae, 4),
        "rmse": round(rmse, 4),
        "wape": round(wape, 4),
        "test_samples": len(test_df),
        "mean_actual": round(float(np.mean(y_true)), 4) if len(y_true) > 0 else 0.0,
        "mean_predicted": round(float(np.mean(y_pred)), 4) if len(y_pred) > 0 else 0.0,
    }
    return result


def save_evaluation_report(report: dict[str, Any], output_path: str | Path) -> None:
    """Save evaluation dictionary as formatted JSON."""
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
