"""GridShift — Policy Evaluation and Benchmark CLI.

Compares FCFS, Backfilling, and PPO on identical test workloads.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import click
import pandas as pd
from rich.console import Console
from rich.table import Table

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from gridshift.config import get_settings
from gridshift.data.schemas import CanonicalJob
from gridshift.evaluation.comparator import compare_policies
from gridshift.evaluation.export import export_experiment_results

console = Console()


@click.command()
@click.argument("dataset_path", type=click.Path(exists=True))
@click.option("--ppo-checkpoint", type=click.Path(exists=True), default=None, help="PPO checkpoint path (.zip).")
@click.option("--num-machines", type=int, default=None, help="Number of machines.")
@click.option("--gpus", type=int, default=None, help="GPUs per machine.")
@click.option("--cpu", type=float, default=None, help="CPU cores per machine.")
@click.option("--memory", type=float, default=None, help="Memory (GB) per machine.")
@click.option("--seed", type=int, default=42, help="Evaluation seed.")
@click.option("--output", type=click.Path(), default=None, help="Output JSON path.")
def main(
    dataset_path: str,
    ppo_checkpoint: str | None,
    num_machines: int | None,
    gpus: int | None,
    cpu: float | None,
    memory: float | None,
    seed: int,
    output: str | None,
) -> None:
    """Run fair policy comparisons on test dataset."""
    settings = get_settings()

    n_machines = num_machines or settings.DEFAULT_NUM_MACHINES
    n_gpus = gpus or settings.DEFAULT_GPUS_PER_MACHINE
    n_cpu = cpu or settings.DEFAULT_CPU_PER_MACHINE
    n_memory = memory or settings.DEFAULT_MEMORY_PER_MACHINE

    console.print(f"\n[bold blue]GridShift Fair Policy Comparison[/bold blue]")
    console.print(f"  Dataset: {dataset_path}")
    console.print(f"  Cluster: {n_machines} machines × {n_gpus} GPUs / {n_cpu} CPU / {n_memory} GB")
    console.print(f"  PPO Checkpoint: {ppo_checkpoint or 'None (baselines only)'}")
    console.print(f"  Seed: {seed}\n")

    df = pd.read_parquet(dataset_path)
    jobs = [CanonicalJob(**r) for r in df.to_dict("records")]
    console.print(f"Loaded {len(jobs):,} test jobs")

    cluster_config = {
        "num_machines": n_machines,
        "gpus_per_machine": n_gpus,
        "cpu_per_machine": n_cpu,
        "memory_per_machine": n_memory,
    }

    comparison = compare_policies(
        test_jobs=jobs,
        cluster_config=cluster_config,
        ppo_checkpoint=ppo_checkpoint,
        seed=seed,
    )

    table = Table(title="Fair Policy Comparison Results")
    table.add_column("Policy", style="cyan")
    table.add_column("Avg Wait (s)", justify="right")
    table.add_column("P95 Wait (s)", justify="right")
    table.add_column("GPU Util", justify="right")
    table.add_column("Throughput (jobs/hr)", justify="right")
    table.add_column("Fragmentation", justify="right")
    table.add_column("Violations", justify="right")
    table.add_column("Completed", justify="right")

    for row in comparison["results"]:
        table.add_row(
            row["policy"].upper(),
            f"{row['avg_wait_sec']:.2f}",
            f"{row['p95_wait_sec']:.2f}",
            f"{row['gpu_utilization']:.2%}",
            f"{row['throughput_jobs_hr']:.2f}",
            str(row["fragmentation_events"]),
            str(row["constraint_violations"]),
            f"{row['completed_jobs']}/{row['total_jobs']}",
        )

    console.print(table)

    out_file = output or "artifacts/experiments/results/comparison_summary.json"
    export_experiment_results(comparison, out_file)
    console.print(f"\n[green]Comparison results saved to {out_file}[/green]\n")


if __name__ == "__main__":
    main()
