"""Export utilities for saving experiment results and comparison summaries."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pandas as pd


def export_experiment_results(
    data: dict[str, Any],
    output_path: str | Path,
) -> None:
    """Save an experiment dictionary to a JSON file."""
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def export_job_outcomes_parquet(
    job_outcomes: list[dict[str, Any]],
    output_path: str | Path,
) -> None:
    """Save list of job outcome records to a compressed Parquet file."""
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    df = pd.DataFrame(job_outcomes)
    df.to_parquet(path, index=False)

