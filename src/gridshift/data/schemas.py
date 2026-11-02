"""Pydantic schemas for workload trace data.

These models define the canonical representation of GPU cluster jobs and
the metadata / validation reports produced during ingestion.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, Field


class CanonicalJob(BaseModel):
    """A single GPU cluster job normalised to the GridShift canonical schema.

    ``observed_runtime`` is the *ground-truth* duration used by the simulator
    to schedule ``JOB_COMPLETION`` events.  Scheduling policies must **never**
    see this field — it is excluded from the default ``model_dump()`` via
    ``exclude=True`` on the field itself and must be accessed explicitly.
    """

    job_id: str = Field(
        ...,
        description="Unique job identifier.",
    )
    submit_time: float = Field(
        ...,
        description="Epoch seconds when the job was submitted.",
    )
    requested_gpus: int = Field(
        ...,
        ge=1,
        description="Number of GPUs requested (≥ 1).",
    )
    requested_cpu: float = Field(
        ...,
        ge=0.0,
        description="CPU cores requested.",
    )
    requested_memory: float = Field(
        ...,
        ge=0.0,
        description="Memory (GiB) requested.",
    )
    observed_runtime: float = Field(
        ...,
        ge=0.0,
        description=(
            "Actual runtime in seconds.  Used only by the simulator — "
            "hidden from scheduling policies."
        ),
    )

    # ── optional metadata ────────────────────────────────────────────────
    user: str | None = Field(default=None, description="Submitting user.")
    queue: str | None = Field(default=None, description="Submission queue.")
    job_name: str | None = Field(default=None, description="Human-readable job name.")
    exit_code: int | None = Field(default=None, description="Process exit code.")
    metadata: dict[str, Any] | None = Field(
        default=None,
        description="Arbitrary extra metadata.",
    )


class DatasetMetadata(BaseModel):
    """Provenance record for an ingested trace dataset."""

    dataset_id: str = Field(..., description="Unique dataset identifier.")
    source_file: str = Field(..., description="Path or URI of the original file.")
    date_range_start: datetime | None = Field(
        default=None,
        description="Earliest submit_time in the dataset.",
    )
    date_range_end: datetime | None = Field(
        default=None,
        description="Latest submit_time in the dataset.",
    )
    total_rows: int = Field(..., ge=0, description="Total rows in the raw file.")
    valid_rows: int = Field(..., ge=0, description="Rows that passed validation.")
    excluded_rows: int = Field(..., ge=0, description="Rows excluded during validation.")
    schema_version: str = Field(
        default="1.0",
        description="Version of the canonical schema used.",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp when this metadata record was created.",
    )
    field_mappings: dict[str, str] = Field(
        default_factory=dict,
        description="Mapping of source column names → canonical field names.",
    )


class ValidationReport(BaseModel):
    """Summary of data-quality checks performed during ingestion."""

    total_rows: int = Field(..., ge=0, description="Total rows examined.")
    valid_rows: int = Field(..., ge=0, description="Rows passing all checks.")
    excluded_rows: int = Field(..., ge=0, description="Rows that failed validation.")
    exclusion_reasons: dict[str, int] = Field(
        default_factory=dict,
        description="Reason string → count of excluded rows.",
    )
    field_distributions: dict[str, Any] = Field(
        default_factory=dict,
        description="Per-field summary statistics (min, max, mean, etc.).",
    )
