"""Dataset management routes."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException

from ...data.audit import generate_audit_report
from ...data.loader import load_trace_file
from ...data.schemas import CanonicalJob, DatasetMetadata
from ...data.transformer import FieldMapping, filter_time_range, transform_trace
from ..dependencies import StorageManager, get_storage
from ..models import DatasetSummaryResponse, ImportDatasetRequest

router = APIRouter(prefix="/datasets", tags=["datasets"])


@router.post("/import", response_model=DatasetSummaryResponse)
async def import_dataset(
    req: ImportDatasetRequest,
    storage: StorageManager = Depends(get_storage),
) -> DatasetSummaryResponse:
    """Ingest, validate, and register a trace file."""
    file_path = Path(req.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {req.file_path}")

    try:
        df = load_trace_file(str(file_path))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {e}")

    dataset_id = req.dataset_name or f"dataset_{uuid.uuid4().hex[:8]}"

    # Transform to canonical jobs
    mapping = FieldMapping()
    jobs, report = transform_trace(df, mapping)

    if req.time_range_start is not None or req.time_range_end is not None:
        jobs = filter_time_range(jobs, req.time_range_start, req.time_range_end)

    if not jobs:
        raise HTTPException(status_code=400, detail="No valid jobs after transformation/filtering.")

    # Save processed Parquet file
    out_dir = Path("data/processed")
    out_dir.mkdir(parents=True, exist_ok=True)
    parquet_path = out_dir / f"{dataset_id}.parquet"

    import pandas as pd
    jobs_df = pd.DataFrame([j.model_dump() for j in jobs])
    jobs_df.to_parquet(parquet_path, index=False)

    now_iso = datetime.now(timezone.utc).isoformat()
    min_time = min(j.submit_time for j in jobs)
    max_time = max(j.submit_time for j in jobs)

    dataset_record = {
        "id": dataset_id,
        "source_file": str(file_path),
        "parquet_path": str(parquet_path),
        "date_range_start": str(min_time),
        "date_range_end": str(max_time),
        "total_rows": len(df),
        "valid_rows": len(jobs),
        "excluded_rows": len(df) - len(jobs),
        "created_at": now_iso,
    }

    await storage.save_dataset(dataset_id, dataset_record)
    return DatasetSummaryResponse(**dataset_record)


@router.get("", response_model=list[DatasetSummaryResponse])
async def list_datasets(
    storage: StorageManager = Depends(get_storage),
) -> list[DatasetSummaryResponse]:
    """List all registered datasets."""
    datasets = await storage.list_datasets()
    return [DatasetSummaryResponse(**d) for d in datasets]


@router.get("/{dataset_id}", response_model=DatasetSummaryResponse)
async def get_dataset(
    dataset_id: str,
    storage: StorageManager = Depends(get_storage),
) -> DatasetSummaryResponse:
    """Get metadata for a specific dataset."""
    ds = await storage.get_dataset(dataset_id)
    if ds is None:
        raise HTTPException(status_code=404, detail=f"Dataset not found: {dataset_id}")
    return DatasetSummaryResponse(**ds)
