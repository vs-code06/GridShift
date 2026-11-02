"""Unit tests for data schemas and validation."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from gridshift.data.schemas import CanonicalJob, DatasetMetadata, ValidationReport


def test_canonical_job_valid() -> None:
    job = CanonicalJob(
        job_id="test_job_1",
        submit_time=100.0,
        requested_gpus=2,
        requested_cpu=8.0,
        requested_memory=32.0,
        observed_runtime=120.0,
    )
    assert job.job_id == "test_job_1"
    assert job.requested_gpus == 2
    assert job.requested_cpu == 8.0
    assert job.requested_memory == 32.0
    assert job.observed_runtime == 120.0


def test_canonical_job_zero_or_negative_gpus_rejected() -> None:
    with pytest.raises(ValidationError):
        CanonicalJob(
            job_id="bad_job",
            submit_time=0.0,
            requested_gpus=0,  # Must be >= 1
            requested_cpu=4.0,
            requested_memory=16.0,
            observed_runtime=60.0,
        )

    with pytest.raises(ValidationError):
        CanonicalJob(
            job_id="bad_job_2",
            submit_time=0.0,
            requested_gpus=-1,
            requested_cpu=4.0,
            requested_memory=16.0,
            observed_runtime=60.0,
        )


def test_canonical_job_negative_runtime_rejected() -> None:
    with pytest.raises(ValidationError):
        CanonicalJob(
            job_id="bad_job_3",
            submit_time=0.0,
            requested_gpus=1,
            requested_cpu=4.0,
            requested_memory=16.0,
            observed_runtime=-10.0,
        )


def test_dataset_metadata_defaults() -> None:
    meta = DatasetMetadata(
        dataset_id="alibaba_2020",
        source_file="trace.csv",
        total_rows=1000,
        valid_rows=950,
        excluded_rows=50,
    )
    assert meta.dataset_id == "alibaba_2020"
    assert meta.total_rows == 1000
    assert meta.valid_rows == 950
    assert meta.excluded_rows == 50
    assert meta.schema_version == "1.0"

