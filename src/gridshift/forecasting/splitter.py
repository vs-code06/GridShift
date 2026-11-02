"""Chronological data splitting for time-series forecasting."""

from __future__ import annotations

import pandas as pd


def chronological_split(
    df: pd.DataFrame,
    train_frac: float = 0.6,
    val_frac: float = 0.2,
    test_frac: float = 0.2,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Split a DataFrame chronologically into train, validation, and test sets.

    Parameters
    ----------
    df:
        Feature matrix sorted chronologically.
    train_frac:
        Fraction of samples for the training set (default: 0.6).
    val_frac:
        Fraction of samples for the validation set (default: 0.2).
    test_frac:
        Fraction of samples for the test set (default: 0.2).

    Returns
    -------
    tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]
        (train_df, val_df, test_df) partitioned strictly by time.
    """
    total = len(df)
    if total == 0:
        return df.copy(), df.copy(), df.copy()

    train_end = int(total * train_frac)
    val_end = int(total * (train_frac + val_frac))

    train_df = df.iloc[:train_end].copy().reset_index(drop=True)
    val_df = df.iloc[train_end:val_end].copy().reset_index(drop=True)
    test_df = df.iloc[val_end:].copy().reset_index(drop=True)

    return train_df, val_df, test_df

