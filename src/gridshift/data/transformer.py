"""Trace transformation: map raw columns → canonical schema.

The :class:`FieldMapping` model describes how source columns correspond to
:class:`~gridshift.data.schemas.CanonicalJob` fields.  The
:func:`transform_trace` function applies the mapping, normalises units,
filters invalid rows, and returns a list of canonical jobs together with a
:class:`~gridshift.data.schemas.ValidationReport`.
"""

from __future__ import annotations

import logging
from typing import Any

import numpy as np
import pandas as pd
from pydantic import BaseModel, Field

from .schemas import CanonicalJob, ValidationReport

logger = logging.getLogger(__name__)


class FieldMapping(BaseModel):
    """Mapping of source DataFrame columns → canonical field names.

    Only ``job_id``, ``submit_time``, ``requested_gpus``, and
    ``observed_runtime`` are mandatory.  ``requested_cpu`` and
    ``requested_memory`` fall back to ``0.0`` if the source has no
    corresponding column.
    """

    job_id: str = Field(..., description="Source column for job_id.")
    submit_time: str = Field(..., description="Source column for submit_time.")
    requested_gpus: str = Field(..., description="Source column for requested_gpus.")
    requested_cpu: str | None = Field(
        default=None,
        description="Source column for requested_cpu (defaults to 0).",
    )
    requested_memory: str | None = Field(
        default=None,
        description="Source column for requested_memory (defaults to 0).",
    )
    observed_runtime: str = Field(
        ...,
        description="Source column for observed_runtime.",
    )
    submit_time_unit: str = Field(
        default="s",
        description="Unit of submit_time column: 's', 'ms', 'us', or 'ns'.",
    )
    runtime_unit: str = Field(
        default="s",
        description="Unit of observed_runtime column: 's', 'ms', 'min', or 'h'.",
    )


def transform_trace(
    df: pd.DataFrame,
    mapping: FieldMapping,
) -> tuple[list[CanonicalJob], ValidationReport]:
    """Apply *mapping* to *df* and return canonical jobs + validation report.

    Parameters
    ----------
    df:
        Raw trace DataFrame.
    mapping:
        Column mapping and unit metadata.

    Returns
    -------
    tuple[list[CanonicalJob], ValidationReport]
        Canonical jobs that passed validation, and the validation report.
    """
    total_rows = len(df)
    exclusion_reasons: dict[str, int] = {}
    field_distributions: dict[str, Any] = {}

    # ── rename columns to canonical names ────────────────────────────────
    rename_map: dict[str, str] = {
        mapping.job_id: "job_id",
        mapping.submit_time: "submit_time",
        mapping.requested_gpus: "requested_gpus",
        mapping.observed_runtime: "observed_runtime",
    }
    if mapping.requested_cpu is not None:
        rename_map[mapping.requested_cpu] = "requested_cpu"
    if mapping.requested_memory is not None:
        rename_map[mapping.requested_memory] = "requested_memory"

    # Only rename columns that actually exist in the DataFrame.
    rename_map = {k: v for k, v in rename_map.items() if k in df.columns}
    work = df.rename(columns=rename_map).copy()

    # Fill defaults for optional columns.
    if "requested_cpu" not in work.columns:
        work["requested_cpu"] = 0.0
    if "requested_memory" not in work.columns:
        work["requested_memory"] = 0.0

    # ── normalise units ──────────────────────────────────────────────────
    work["submit_time"] = normalize_timestamps(
        work["submit_time"], unit=mapping.submit_time_unit
    )
    work["observed_runtime"] = _normalize_runtime(
        work["observed_runtime"], unit=mapping.runtime_unit
    )

    # ── coerce types ─────────────────────────────────────────────────────
    work["job_id"] = work["job_id"].astype(str)
    for col in ("submit_time", "requested_cpu", "requested_memory", "observed_runtime"):
        work[col] = pd.to_numeric(work[col], errors="coerce")
    work["requested_gpus"] = pd.to_numeric(work["requested_gpus"], errors="coerce")

    # ── filter invalid rows ──────────────────────────────────────────────
    valid_mask = pd.Series(True, index=work.index)

    # Nulls
    required = [
        "job_id",
        "submit_time",
        "requested_gpus",
        "requested_cpu",
        "requested_memory",
        "observed_runtime",
    ]
    for col in required:
        nulls = work[col].isna()
        n_null = int(nulls.sum())
        if n_null > 0:
            exclusion_reasons[f"null:{col}"] = n_null
            valid_mask &= ~nulls

    # GPUs must be ≥ 1
    bad_gpus = work["requested_gpus"] < 1
    n_bad = int(bad_gpus.sum())
    if n_bad > 0:
        exclusion_reasons["requested_gpus<1"] = n_bad
        valid_mask &= ~bad_gpus

    # Non-negative numeric fields
    for col in ("requested_cpu", "requested_memory", "observed_runtime"):
        neg = work[col] < 0
        n_neg = int(neg.sum())
        if n_neg > 0:
            exclusion_reasons[f"negative:{col}"] = n_neg
            valid_mask &= ~neg

    valid_df = work.loc[valid_mask]
    valid_rows = len(valid_df)
    excluded_rows = total_rows - valid_rows

    # ── compute distributions on valid data ──────────────────────────────
    for col in ("requested_gpus", "requested_cpu", "requested_memory", "observed_runtime"):
        if col in valid_df.columns and len(valid_df) > 0:
            field_distributions[col] = {
                "min": float(valid_df[col].min()),
                "max": float(valid_df[col].max()),
                "mean": float(valid_df[col].mean()),
                "median": float(valid_df[col].median()),
            }

    report = ValidationReport(
        total_rows=total_rows,
        valid_rows=valid_rows,
        excluded_rows=excluded_rows,
        exclusion_reasons=exclusion_reasons,
        field_distributions=field_distributions,
    )

    # ── build CanonicalJob list ──────────────────────────────────────────
    jobs: list[CanonicalJob] = []
    for _, row in valid_df.iterrows():
        jobs.append(
            CanonicalJob(
                job_id=str(row["job_id"]),
                submit_time=float(row["submit_time"]),
                requested_gpus=int(row["requested_gpus"]),
                requested_cpu=float(row["requested_cpu"]),
                requested_memory=float(row["requested_memory"]),
                observed_runtime=float(row["observed_runtime"]),
            )
        )

    logger.info(
        "Transformed %d / %d rows into canonical jobs.", valid_rows, total_rows
    )
    return jobs, report


def normalize_timestamps(series: pd.Series, unit: str = "s") -> pd.Series:
    """Convert a timestamp series to epoch seconds.

    Parameters
    ----------
    series:
        Pandas Series of numeric timestamps.
    unit:
        Source unit — ``'s'``, ``'ms'``, ``'us'``, or ``'ns'``.

    Returns
    -------
    pd.Series
        Timestamps in epoch seconds (float64).
    """
    multipliers = {"s": 1.0, "ms": 1e-3, "us": 1e-6, "ns": 1e-9}
    if unit not in multipliers:
        raise ValueError(
            f"Unsupported timestamp unit {unit!r}. Choose from {list(multipliers)}."
        )
    return series.astype(np.float64) * multipliers[unit]


def filter_time_range(
    jobs: list[CanonicalJob],
    start: float,
    end: float,
) -> list[CanonicalJob]:
    """Return only jobs whose ``submit_time`` is in ``[start, end]``.

    Parameters
    ----------
    jobs:
        List of canonical jobs.
    start:
        Inclusive lower bound (epoch seconds).
    end:
        Inclusive upper bound (epoch seconds).

    Returns
    -------
    list[CanonicalJob]
        Filtered jobs.
    """
    return [j for j in jobs if start <= j.submit_time <= end]


# ── Private helpers ──────────────────────────────────────────────────────────


def _normalize_runtime(series: pd.Series, unit: str = "s") -> pd.Series:
    """Convert runtime values to seconds."""
    multipliers = {"s": 1.0, "ms": 1e-3, "min": 60.0, "h": 3600.0}
    if unit not in multipliers:
        raise ValueError(
            f"Unsupported runtime unit {unit!r}. Choose from {list(multipliers)}."
        )
    return series.astype(np.float64) * multipliers[unit]
