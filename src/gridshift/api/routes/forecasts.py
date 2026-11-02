"""Forecasting API routes."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from ..dependencies import StorageManager, get_storage

router = APIRouter(prefix="/forecasts", tags=["forecasts"])


@router.get("/{dataset_id}")
async def get_forecast_results(
    dataset_id: str,
    storage: StorageManager = Depends(get_storage),
) -> dict[str, Any]:
    """Retrieve forecast error metrics and prediction curves for a dataset."""
    report_file = Path("artifacts/forecasting/forecast_evaluation.json")
    if report_file.exists():
        try:
            with open(report_file, encoding="utf-8") as f:
                data = json.load(f)
            return data
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to read forecast report: {e}")

    # Fallback default response if model not yet trained
    return {
        "status": "not_trained",
        "message": "Forecast model not yet trained. Run gridshift-train-forecast first.",
        "dataset_id": dataset_id,
        "mae": 0.0,
        "rmse": 0.0,
        "wape": 0.0,
        "timestamps": [],
        "actual": [],
        "predicted": [],
    }

