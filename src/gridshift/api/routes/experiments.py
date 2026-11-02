"""Experiment orchestration routes."""

from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pandas as pd
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query

from ...data.schemas import CanonicalJob
from ...evaluation.experiment import run_policy_experiment
from ..dependencies import StorageManager, get_storage
from ..models import (
    CreateExperimentRequest,
    ExperimentRunResponse,
    JobOutcomeModel,
    PaginatedJobsResponse,
    SchedulingMetricsModel,
    TimelineEventModel,
)

router = APIRouter(prefix="/experiments", tags=["experiments"])


def _execute_simulation_task(
    exp_id: str,
    req: CreateExperimentRequest,
    parquet_path: str,
    storage: StorageManager,
) -> None:
    """Synchronous simulation execution running in background thread pool."""
    try:
        df = pd.read_parquet(parquet_path)
        jobs = [CanonicalJob(**r) for r in df.to_dict("records")]

        cluster_cfg = req.cluster_config.model_dump()
        ppo_chk = req.ppo_config.checkpoint_path if req.ppo_config else None
        k = req.ppo_config.candidate_k if req.ppo_config else 10

        exp_result = run_policy_experiment(
            jobs=jobs,
            policy=req.policy,
            cluster_config=cluster_cfg,
            seed=req.seed,
            ppo_checkpoint=ppo_chk,
            candidate_k=k,
        )

        m = exp_result.metrics
        metrics_dict = {
            "avg_wait": m.avg_wait,
            "p95_wait": m.p95_wait,
            "gpu_utilization": m.gpu_utilization,
            "throughput": m.throughput,
            "fragmentation_events": m.fragmentation_events,
            "constraint_violations": m.constraint_violations,
            "total_jobs": m.total_jobs,
            "completed_jobs": m.completed_jobs,
            "simulation_duration": m.simulation_duration,
        }

        # Save completed experiment state
        now_iso = datetime.now(timezone.utc).isoformat()
        exp_record = {
            "id": exp_id,
            "policy": req.policy,
            "dataset_id": req.dataset_id,
            "status": "completed",
            "seed": req.seed,
            "cluster_config": cluster_cfg,
            "metrics": metrics_dict,
            "error_message": None,
            "created_at": now_iso,
            "completed_at": now_iso,
        }
        asyncio.run(storage.save_experiment(exp_id, exp_record))

    except Exception as e:
        now_iso = datetime.now(timezone.utc).isoformat()
        exp_record = {
            "id": exp_id,
            "policy": req.policy,
            "dataset_id": req.dataset_id,
            "status": "failed",
            "seed": req.seed,
            "cluster_config": req.cluster_config.model_dump(),
            "metrics": None,
            "error_message": str(e),
            "created_at": now_iso,
            "completed_at": now_iso,
        }
        asyncio.run(storage.save_experiment(exp_id, exp_record))


@router.post("", response_model=ExperimentRunResponse)
async def create_experiment(
    req: CreateExperimentRequest,
    background_tasks: BackgroundTasks,
    storage: StorageManager = Depends(get_storage),
) -> ExperimentRunResponse:
    """Create and start a new scheduling experiment."""
    ds = await storage.get_dataset(req.dataset_id)
    if ds is None:
        raise HTTPException(status_code=404, detail=f"Dataset not found: {req.dataset_id}")

    parquet_path = ds.get("parquet_path")
    if not parquet_path or not Path(parquet_path).exists():
        raise HTTPException(status_code=404, detail=f"Dataset parquet file missing: {parquet_path}")

    exp_id = f"exp_{uuid.uuid4().hex[:8]}"
    now_iso = datetime.now(timezone.utc).isoformat()

    initial_record = {
        "id": exp_id,
        "policy": req.policy,
        "dataset_id": req.dataset_id,
        "status": "running",
        "seed": req.seed,
        "cluster_config": req.cluster_config.model_dump(),
        "metrics": None,
        "error_message": None,
        "created_at": now_iso,
        "completed_at": None,
    }
    await storage.save_experiment(exp_id, initial_record)

    # Launch simulation in background
    background_tasks.add_task(
        _execute_simulation_task,
        exp_id,
        req,
        parquet_path,
        storage,
    )

    return ExperimentRunResponse(**initial_record)


@router.get("", response_model=list[ExperimentRunResponse])
async def list_experiments(
    storage: StorageManager = Depends(get_storage),
) -> list[ExperimentRunResponse]:
    """List all experiment runs."""
    exps = await storage.list_experiments()
    return [ExperimentRunResponse(**e) for e in exps]


@router.get("/{exp_id}", response_model=ExperimentRunResponse)
async def get_experiment(
    exp_id: str,
    storage: StorageManager = Depends(get_storage),
) -> ExperimentRunResponse:
    """Get metadata and metrics for an experiment run."""
    exp = await storage.get_experiment(exp_id)
    if exp is None:
        raise HTTPException(status_code=404, detail=f"Experiment not found: {exp_id}")
    return ExperimentRunResponse(**exp)


@router.get("/{exp_id}/jobs", response_model=PaginatedJobsResponse)
async def get_experiment_jobs(
    exp_id: str,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=500),
    storage: StorageManager = Depends(get_storage),
) -> PaginatedJobsResponse:
    """Retrieve paginated job outcomes for a completed run."""
    jobs = storage.get_job_outcomes(exp_id)
    total = len(jobs)
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    page_jobs = jobs[start_idx:end_idx]

    return PaginatedJobsResponse(
        jobs=[JobOutcomeModel(**j) for j in page_jobs],
        total=total,
        page=page,
        limit=limit,
    )


@router.get("/{exp_id}/timeline", response_model=list[TimelineEventModel])
async def get_experiment_timeline(
    exp_id: str,
    storage: StorageManager = Depends(get_storage),
) -> list[TimelineEventModel]:
    """Retrieve raw event timeline for simulation visualization."""
    events = storage.get_timeline(exp_id)
    return [TimelineEventModel(**e) for e in events]

