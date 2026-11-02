"""Data-quality audit report generation.

Produces a JSON-serialisable dictionary summarising field distributions,
statistics, and any exclusion reasons recorded during ingestion.
"""

from __future__ import annotations

import json
import logging
import statistics
from pathlib import Path
from typing import Any

from .schemas import CanonicalJob, DatasetMetadata

logger = logging.getLogger(__name__)


def generate_audit_report(
    jobs: list[CanonicalJob],
    metadata: DatasetMetadata,
) -> dict[str, Any]:
    """Produce a data-quality audit report.

    Parameters
    ----------
    jobs:
        The list of validated canonical jobs.
    metadata:
        Provenance metadata for the ingested dataset.

    Returns
    -------
    dict[str, Any]
        A JSON-serialisable audit report.
    """
    report: dict[str, Any] = {
        "dataset_id": metadata.dataset_id,
        "source_file": metadata.source_file,
        "schema_version": metadata.schema_version,
        "created_at": metadata.created_at.isoformat(),
        "row_counts": {
            "total_rows": metadata.total_rows,
            "valid_rows": metadata.valid_rows,
            "excluded_rows": metadata.excluded_rows,
        },
        "field_mappings": metadata.field_mappings,
    }

    if not jobs:
        report["distributions"] = {}
        report["summary_statistics"] = {}
        return report

    # ── compute per-field distributions ──────────────────────────────────
    gpu_vals = [j.requested_gpus for j in jobs]
    cpu_vals = [j.requested_cpu for j in jobs]
    mem_vals = [j.requested_memory for j in jobs]
    runtime_vals = [j.observed_runtime for j in jobs]
    submit_vals = [j.submit_time for j in jobs]

    report["distributions"] = {
        "requested_gpus": _numeric_summary(gpu_vals),
        "requested_cpu": _numeric_summary(cpu_vals),
        "requested_memory": _numeric_summary(mem_vals),
        "observed_runtime": _numeric_summary(runtime_vals),
        "submit_time": _numeric_summary(submit_vals),
    }

    report["summary_statistics"] = {
        "total_jobs": len(jobs),
        "time_span_seconds": max(submit_vals) - min(submit_vals) if len(submit_vals) > 1 else 0.0,
        "unique_users": len({j.user for j in jobs if j.user is not None}),
        "unique_queues": len({j.queue for j in jobs if j.queue is not None}),
    }

    if metadata.date_range_start:
        report["date_range_start"] = metadata.date_range_start.isoformat()
    if metadata.date_range_end:
        report["date_range_end"] = metadata.date_range_end.isoformat()

    return report


def save_audit_report(report: dict[str, Any], output_path: str | Path) -> None:
    """Persist an audit report as pretty-printed JSON.

    Parameters
    ----------
    report:
        The audit report dictionary (must be JSON-serialisable).
    output_path:
        Destination file path.  Parent directories are created if needed.
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(report, indent=2, default=str))
    logger.info("Audit report saved to %s", output_path)


# ── Private helpers ──────────────────────────────────────────────────────────


def _numeric_summary(values: list[float | int]) -> dict[str, float | int | None]:
    """Return min, max, mean, median, and stdev for a list of numbers."""
    if not values:
        return {"min": None, "max": None, "mean": None, "median": None, "stdev": None}
    return {
        "min": min(values),
        "max": max(values),
        "mean": statistics.mean(values),
        "median": statistics.median(values),
        "stdev": statistics.stdev(values) if len(values) >= 2 else 0.0,
    }
