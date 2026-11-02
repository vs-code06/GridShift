"""Time-series feature engineering for GPU demand forecasting.

Constructs aggregate demand samples from job submission streams with
lagged demand, arrival counts, cyclical calendar features, and forward-looking
target demand over a configured forecast horizon.

All features are strictly computed from past events to eliminate temporal leakage.
"""

from __future__ import annotations

import math
from typing import Sequence

import numpy as np
import pandas as pd


def build_forecast_features(
    jobs_df: pd.DataFrame,
    interval_minutes: int = 5,
    horizon_minutes: int = 30,
    lags: Sequence[int] = (1, 2, 3, 6, 12, 24),
) -> pd.DataFrame:
    """Transform canonical jobs into a time-series feature matrix.

    Parameters
    ----------
    jobs_df:
        DataFrame containing at least ``submit_time`` and ``requested_gpus``.
    interval_minutes:
        Duration of each discrete time bin in minutes (default: 5).
    horizon_minutes:
        Forward prediction window duration in minutes (default: 30).
    lags:
        Lag steps (in units of *interval_minutes*) to compute as features.

    Returns
    -------
    pd.DataFrame
        DataFrame where each row is a time interval with lag features,
        time-of-day features, and the target future GPU demand.
    """
    if jobs_df.empty:
        return pd.DataFrame()

    df = jobs_df.copy()
    interval_sec = interval_minutes * 60
    horizon_steps = max(1, horizon_minutes // interval_minutes)

    # Bin each job into a discrete interval based on submit_time
    min_time = df["submit_time"].min()
    df["bin"] = ((df["submit_time"] - min_time) // interval_sec).astype(int)

    # Aggregate by time bin
    agg = (
        df.groupby("bin")
        .agg(
            gpu_demand=("requested_gpus", "sum"),
            job_count=("job_id", "count"),
            avg_gpu_per_job=("requested_gpus", "mean"),
        )
        .reset_index()
    )

    # Reindex to fill empty bins with 0
    max_bin = int(df["bin"].max())
    full_bins = pd.DataFrame({"bin": np.arange(0, max_bin + 1)})
    merged = pd.merge(full_bins, agg, on="bin", how="left").fillna(
        {"gpu_demand": 0.0, "job_count": 0, "avg_gpu_per_job": 0.0}
    )

    merged["timestamp"] = min_time + merged["bin"] * interval_sec

    # ── Target: forward sum of GPU demand over the horizon ────────────────────
    # Target at bin t is sum of demand from (t + 1) to (t + horizon_steps)
    # Using backward rolling sum shifted backward
    indexer = pd.api.indexers.FixedForwardWindowIndexer(window_size=horizon_steps)
    # Target excludes current bin t, so we shift forward by 1 before summing forward
    merged["target_gpu_demand"] = (
        merged["gpu_demand"].shift(-1).rolling(window=indexer, min_periods=1).sum()
    )

    # ── Lag features ─────────────────────────────────────────────────────────
    for lag in lags:
        merged[f"lag_gpu_{lag}"] = merged["gpu_demand"].shift(lag)
        merged[f"lag_jobs_{lag}"] = merged["job_count"].shift(lag)

    # Rolling statistics over past 6 and 12 intervals
    merged["rolling_mean_gpu_6"] = merged["gpu_demand"].shift(1).rolling(6, min_periods=1).mean()
    merged["rolling_std_gpu_6"] = (
        merged["gpu_demand"].shift(1).rolling(6, min_periods=1).std().fillna(0.0)
    )
    merged["rolling_mean_gpu_12"] = merged["gpu_demand"].shift(1).rolling(12, min_periods=1).mean()

    # ── Cyclical calendar features ───────────────────────────────────────────
    # Derive hour and day of week from timestamp
    hours = (merged["timestamp"] / 3600.0) % 24.0
    merged["hour_sin"] = np.sin(2 * np.pi * hours / 24.0)
    merged["hour_cos"] = np.cos(2 * np.pi * hours / 24.0)

    days = (merged["timestamp"] / (3600.0 * 24.0)) % 7.0
    merged["day_sin"] = np.sin(2 * np.pi * days / 7.0)
    merged["day_cos"] = np.cos(2 * np.pi * days / 7.0)

    # Drop rows that have NaN due to lags or incomplete future target
    max_lag = max(lags) if lags else 1
    valid_mask = (
        merged["bin"] >= max_lag
    ) & merged["target_gpu_demand"].notna() & (
        merged["bin"] <= (max_bin - horizon_steps)
    )

    features_df = merged[valid_mask].reset_index(drop=True)
    return features_df
