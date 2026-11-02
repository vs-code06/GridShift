"""Pydantic API request and response models."""

from __future__ import annotations

from typing import Any, Literal
from pydantic import BaseModel, Field


# ── Dataset Models ────────────────────────────────────────────────────────────

class ImportDatasetRequest(BaseModel):
    file_path: str = Field(..., description="Path to raw CSV or Parquet trace file.")
    time_range_start: float | None = Field(None, description="Optional start time in epoch seconds.")
    time_range_end: float | None = Field(None, description="Optional end time in epoch seconds.")
    dataset_name: str | None = Field(None, description="Optional human-readable name.")


class DatasetSummaryResponse(BaseModel):
    id: str
    source_file: str
    date_range_start: str | None = None
    date_range_end: str | None = None
    total_rows: int
    valid_rows: int
    excluded_rows: int
    created_at: str


# ── Experiment Models ─────────────────────────────────────────────────────────

class ClusterConfigModel(BaseModel):
    num_machines: int = Field(default=10, ge=1)
    gpus_per_machine: int = Field(default=8, ge=1)
    cpu_per_machine: float = Field(default=64.0, ge=1.0)
    memory_per_machine: float = Field(default=256.0, ge=1.0)


class PPOConfigModel(BaseModel):
    checkpoint_path: str | None = None
    candidate_k: int = 10
    seed: int = 42


class CreateExperimentRequest(BaseModel):
    dataset_id: str
    policy: Literal["fcfs", "backfill", "ppo"]
    cluster_config: ClusterConfigModel = Field(default_factory=ClusterConfigModel)
    ppo_config: PPOConfigModel | None = None
    seed: int = 42
    forecast_enabled: bool = False


class SchedulingMetricsModel(BaseModel):
    avg_wait: float
    p95_wait: float
    gpu_utilization: float
    throughput: float
    fragmentation_events: int
    constraint_violations: int
    total_jobs: int
    completed_jobs: int
    simulation_duration: float


class ExperimentRunResponse(BaseModel):
    id: str
    policy: str
    dataset_id: str
    status: Literal["pending", "running", "completed", "failed"]
    seed: int
    cluster_config: dict[str, Any]
    metrics: SchedulingMetricsModel | None = None
    error_message: str | None = None
    created_at: str
    completed_at: str | None = None


class JobOutcomeModel(BaseModel):
    job_id: str
    submit_time: float
    start_time: float
    completion_time: float
    wait_time: float
    assigned_machine: str
    requested_gpus: int
    requested_cpu: float
    requested_memory: float


class PaginatedJobsResponse(BaseModel):
    jobs: list[JobOutcomeModel]
    total: int
    page: int
    limit: int


class TimelineEventModel(BaseModel):
    timestamp: float
    event_type: str
    job_id: str | None = None
    machine_id: str | None = None
    details: dict[str, Any] = Field(default_factory=dict)
