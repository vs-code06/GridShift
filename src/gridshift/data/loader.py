"""Trace-file loading and basic validation utilities.

Supports CSV and Parquet files, with automatic format detection and
chunked reading for large files.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Sequence

import pandas as pd

from .schemas import ValidationReport

logger = logging.getLogger(__name__)

# Default chunk size for large-file reading (rows).
_DEFAULT_CHUNK_SIZE: int = 500_000


def load_trace_file(
    path: str | Path,
    file_format: str = "auto",
    chunk_size: int | None = None,
) -> pd.DataFrame:
    """Read a trace file into a :class:`pandas.DataFrame`.

    Parameters
    ----------
    path:
        Filesystem path to the trace file.
    file_format:
        ``"csv"``, ``"parquet"``, or ``"auto"`` (detect by extension).
    chunk_size:
        If set, CSV files are read in chunks of this many rows and
        concatenated.  Ignored for Parquet files.

    Returns
    -------
    pd.DataFrame
        The loaded trace data.

    Raises
    ------
    ValueError
        If the format cannot be determined or is unsupported.
    FileNotFoundError
        If *path* does not exist.
    """
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"Trace file not found: {path}")

    fmt = _resolve_format(path, file_format)

    if fmt == "csv":
        return _read_csv(path, chunk_size)
    if fmt == "parquet":
        return pd.read_parquet(path)

    raise ValueError(f"Unsupported file format: {fmt!r}")


def validate_dataframe(
    df: pd.DataFrame,
    required_columns: Sequence[str],
) -> ValidationReport:
    """Run basic quality checks on a raw :class:`~pandas.DataFrame`.

    Checks performed:
    1. Missing required columns → all rows excluded.
    2. Null / NaN values in required columns → those rows excluded.
    3. Numeric columns with negative values → those rows excluded.

    Parameters
    ----------
    df:
        The DataFrame to validate.
    required_columns:
        Column names that must be present and non-null.

    Returns
    -------
    ValidationReport
        A summary of validation results.
    """
    total_rows = len(df)
    exclusion_reasons: dict[str, int] = {}

    # 1. Missing columns ---------------------------------------------------
    missing_cols = set(required_columns) - set(df.columns)
    if missing_cols:
        reason = f"missing_columns:{','.join(sorted(missing_cols))}"
        exclusion_reasons[reason] = total_rows
        return ValidationReport(
            total_rows=total_rows,
            valid_rows=0,
            excluded_rows=total_rows,
            exclusion_reasons=exclusion_reasons,
            field_distributions={},
        )

    valid_mask = pd.Series(True, index=df.index)

    # 2. Null values in required columns -----------------------------------
    for col in required_columns:
        nulls = df[col].isna()
        n_null = int(nulls.sum())
        if n_null > 0:
            exclusion_reasons[f"null:{col}"] = n_null
            valid_mask &= ~nulls

    # 3. Negative values in numeric required columns -----------------------
    for col in required_columns:
        if pd.api.types.is_numeric_dtype(df[col]):
            negatives = df[col] < 0
            n_neg = int(negatives.sum())
            if n_neg > 0:
                exclusion_reasons[f"negative:{col}"] = n_neg
                valid_mask &= ~negatives

    valid_rows = int(valid_mask.sum())
    excluded_rows = total_rows - valid_rows

    # Field distributions for valid rows -----------------------------------
    field_distributions = _compute_distributions(df.loc[valid_mask], required_columns)

    return ValidationReport(
        total_rows=total_rows,
        valid_rows=valid_rows,
        excluded_rows=excluded_rows,
        exclusion_reasons=exclusion_reasons,
        field_distributions=field_distributions,
    )


# ── Private helpers ──────────────────────────────────────────────────────────


def _resolve_format(path: Path, file_format: str) -> str:
    """Determine the file format from *file_format* or extension."""
    if file_format != "auto":
        return file_format.lower()
    suffix = path.suffix.lower()
    if suffix in {".csv", ".tsv", ".txt"}:
        return "csv"
    if suffix in {".parquet", ".pq"}:
        return "parquet"
    raise ValueError(
        f"Cannot auto-detect format for extension {suffix!r}.  "
        "Pass file_format='csv' or file_format='parquet' explicitly."
    )


def _read_csv(path: Path, chunk_size: int | None) -> pd.DataFrame:
    """Read a CSV file, optionally in chunks."""
    if chunk_size is not None and chunk_size > 0:
        logger.info("Reading %s in chunks of %d rows", path, chunk_size)
        chunks: list[pd.DataFrame] = []
        for chunk in pd.read_csv(path, chunksize=chunk_size):
            chunks.append(chunk)
        return pd.concat(chunks, ignore_index=True)
    return pd.read_csv(path)


def _compute_distributions(
    df: pd.DataFrame,
    columns: Sequence[str],
) -> dict[str, Any]:
    """Return min / max / mean / median for numeric columns in *columns*."""
    distributions: dict[str, Any] = {}
    for col in columns:
        if col not in df.columns:
            continue
        if pd.api.types.is_numeric_dtype(df[col]):
            distributions[col] = {
                "min": float(df[col].min()) if len(df) > 0 else None,
                "max": float(df[col].max()) if len(df) > 0 else None,
                "mean": float(df[col].mean()) if len(df) > 0 else None,
                "median": float(df[col].median()) if len(df) > 0 else None,
            }
        else:
            distributions[col] = {
                "unique": int(df[col].nunique()),
                "top": str(df[col].mode().iloc[0]) if len(df) > 0 else None,
            }
    return distributions
