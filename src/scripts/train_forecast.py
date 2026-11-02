"""GridShift — XGBoost Forecaster Training CLI.

Trains an XGBoost model to predict aggregate GPU demand over the next
forecast window, using only features available at prediction time.
"""

import sys
import json
from pathlib import Path

import click
import pandas as pd
from rich.console import Console
from rich.table import Table

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from gridshift.config import get_settings
from gridshift.forecasting.features import build_forecast_features
from gridshift.forecasting.splitter import chronological_split
from gridshift.forecasting.trainer import train_xgboost, train_naive_baseline
from gridshift.forecasting.evaluator import evaluate_forecast, save_evaluation_report

console = Console()


@click.command()
@click.argument("dataset_path", type=click.Path(exists=True))
@click.option(
    "--horizon",
    type=int,
    default=None,
    help="Forecast horizon in minutes.",
)
@click.option(
    "--interval",
    type=int,
    default=None,
    help="Time discretization interval in minutes.",
)
@click.option(
    "--output-dir",
    type=click.Path(),
    default=None,
    help="Directory to save model and reports.",
)
def main(
    dataset_path: str,
    horizon: int | None,
    interval: int | None,
    output_dir: str | None,
) -> None:
    """Train the GPU demand forecaster.

    DATASET_PATH is the path to the canonical Parquet file.
    """
    settings = get_settings()
    horizon_min = horizon or settings.FORECAST_HORIZON_MINUTES
    interval_min = interval or settings.FORECAST_INTERVAL_MINUTES
    out_path = Path(output_dir) if output_dir else Path(settings.ARTIFACTS_DIR) / "forecasting"
    out_path.mkdir(parents=True, exist_ok=True)

    console.print(f"\n[bold blue]GridShift Forecast Training[/bold blue]")
    console.print(f"  Dataset: {dataset_path}")
    console.print(f"  Horizon: {horizon_min} minutes")
    console.print(f"  Interval: {interval_min} minutes\n")

    # Load data
    console.print("[yellow]Step 1:[/yellow] Loading dataset...")
    df = pd.read_parquet(dataset_path)
    console.print(f"  Loaded {len(df):,} jobs")

    # Build features
    console.print("[yellow]Step 2:[/yellow] Building time-series features...")
    features_df = build_forecast_features(
        df,
        interval_minutes=interval_min,
        horizon_minutes=horizon_min,
    )
    console.print(f"  Generated {len(features_df):,} samples with {len(features_df.columns)} features")

    # Split chronologically
    console.print("[yellow]Step 3:[/yellow] Splitting chronologically (60/20/20)...")
    train_df, val_df, test_df = chronological_split(features_df)
    console.print(f"  Train: {len(train_df):,} | Val: {len(val_df):,} | Test: {len(test_df):,}")

    # Train naive baseline
    console.print("[yellow]Step 4:[/yellow] Training naive baseline...")
    naive_predictions = train_naive_baseline(test_df)

    # Train XGBoost
    console.print("[yellow]Step 5:[/yellow] Training XGBoost...")
    model, training_config = train_xgboost(train_df, val_df)

    # Save model
    model_path = out_path / "models" / "xgboost_forecast.json"
    model_path.parent.mkdir(parents=True, exist_ok=True)
    model.save_model(str(model_path))
    console.print(f"  Model saved: {model_path}")

    # Evaluate
    console.print("[yellow]Step 6:[/yellow] Evaluating on held-out test set...")
    xgb_eval = evaluate_forecast(model, test_df, model_name="XGBoost")
    naive_eval = evaluate_forecast(None, test_df, predictions=naive_predictions, model_name="Naive")

    # Display comparison
    comparison = Table(title="Forecast Evaluation — Test Set")
    comparison.add_column("Metric", style="cyan")
    comparison.add_column("XGBoost", style="green")
    comparison.add_column("Naive Baseline", style="yellow")
    comparison.add_row("MAE", f"{xgb_eval['mae']:.4f}", f"{naive_eval['mae']:.4f}")
    comparison.add_row("RMSE", f"{xgb_eval['rmse']:.4f}", f"{naive_eval['rmse']:.4f}")
    comparison.add_row("WAPE", f"{xgb_eval['wape']:.4f}", f"{naive_eval['wape']:.4f}")
    console.print(comparison)

    # Save report
    report = {
        "horizon_minutes": horizon_min,
        "interval_minutes": interval_min,
        "dataset": dataset_path,
        "split_sizes": {
            "train": len(train_df),
            "val": len(val_df),
            "test": len(test_df),
        },
        "xgboost": xgb_eval,
        "naive": naive_eval,
        "training_config": training_config,
    }
    report_path = out_path / "forecast_evaluation.json"
    save_evaluation_report(report, str(report_path))
    console.print(f"\n[green]Report saved to {report_path}[/green]\n")


if __name__ == "__main__":
    main()

