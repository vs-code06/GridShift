"""GridShift — Data Ingestion CLI.

Loads raw workload trace files, validates and transforms them into
the canonical job schema, and saves processed data as Parquet.
"""

import sys
from pathlib import Path

import click
from rich.console import Console
from rich.table import Table

# Add src to path for development
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from gridshift.config import get_settings
from gridshift.data.loader import load_trace_file, validate_dataframe
from gridshift.data.transformer import FieldMapping, transform_trace
from gridshift.data.audit import generate_audit_report, save_audit_report
from gridshift.data.schemas import DatasetMetadata

console = Console()


@click.command()
@click.argument("trace_file", type=click.Path(exists=True))
@click.option(
    "--output-dir",
    type=click.Path(),
    default=None,
    help="Output directory for processed files. Defaults to DATA_PROCESSED_DIR.",
)
@click.option(
    "--time-start",
    type=float,
    default=None,
    help="Start of time range filter (epoch seconds).",
)
@click.option(
    "--time-end",
    type=float,
    default=None,
    help="End of time range filter (epoch seconds).",
)
@click.option(
    "--mapping-file",
    type=click.Path(exists=True),
    default=None,
    help="JSON file with field mapping configuration.",
)
def main(
    trace_file: str,
    output_dir: str | None,
    time_start: float | None,
    time_end: float | None,
    mapping_file: str | None,
) -> None:
    """Ingest and validate a GPU workload trace file.

    TRACE_FILE is the path to the raw CSV or Parquet trace file.
    """
    settings = get_settings()
    output_path = Path(output_dir) if output_dir else Path(settings.DATA_PROCESSED_DIR)
    output_path.mkdir(parents=True, exist_ok=True)

    console.print(f"\n[bold blue]GridShift Data Ingestion[/bold blue]")
    console.print(f"  Source: {trace_file}")
    console.print(f"  Output: {output_path}\n")

    # Step 1: Load raw data
    console.print("[yellow]Step 1:[/yellow] Loading trace file...")
    df = load_trace_file(trace_file)
    console.print(f"  Loaded {len(df):,} rows, {len(df.columns)} columns")

    # Step 2: Validate
    console.print("[yellow]Step 2:[/yellow] Validating data...")
    validation = validate_dataframe(df, required_columns=list(df.columns))
    console.print(f"  Valid: {validation.valid_rows:,} | Excluded: {validation.excluded_rows:,}")

    # Step 3: Transform
    console.print("[yellow]Step 3:[/yellow] Transforming to canonical schema...")
    if mapping_file:
        import json

        with open(mapping_file) as f:
            mapping_data = json.load(f)
        mapping = FieldMapping(**mapping_data)
    else:
        # Use default mapping — user should customize
        mapping = FieldMapping()

    jobs, transform_report = transform_trace(df, mapping)

    if time_start or time_end:
        from gridshift.data.transformer import filter_time_range

        jobs = filter_time_range(jobs, time_start, time_end)
        console.print(f"  Time-filtered to {len(jobs):,} jobs")

    console.print(f"  Canonical jobs: {len(jobs):,}")

    # Step 4: Audit report
    console.print("[yellow]Step 4:[/yellow] Generating audit report...")
    metadata = DatasetMetadata(
        dataset_id=Path(trace_file).stem,
        source_file=trace_file,
        total_rows=len(df),
        valid_rows=len(jobs),
        excluded_rows=len(df) - len(jobs),
    )
    report = generate_audit_report(jobs, metadata)
    report_path = output_path / f"{metadata.dataset_id}_audit.json"
    save_audit_report(report, str(report_path))
    console.print(f"  Report saved: {report_path}")

    # Step 5: Save processed data
    console.print("[yellow]Step 5:[/yellow] Saving processed data...")
    import pandas as pd

    jobs_df = pd.DataFrame([j.model_dump() for j in jobs])
    parquet_path = output_path / f"{metadata.dataset_id}_canonical.parquet"
    jobs_df.to_parquet(parquet_path, index=False)
    console.print(f"  Saved: {parquet_path}")

    # Summary table
    summary = Table(title="Ingestion Summary")
    summary.add_column("Metric", style="cyan")
    summary.add_column("Value", style="green")
    summary.add_row("Total raw rows", f"{len(df):,}")
    summary.add_row("Canonical jobs", f"{len(jobs):,}")
    summary.add_row("Excluded rows", f"{len(df) - len(jobs):,}")
    summary.add_row("Output file", str(parquet_path))
    console.print(summary)

    console.print("\n[bold green]✓ Ingestion complete![/bold green]\n")


if __name__ == "__main__":
    main()

