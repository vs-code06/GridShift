"""GridShift — Simulation Runner CLI.

Runs scheduling experiments with configurable policies and cluster configurations.
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
from gridshift.data.schemas import CanonicalJob
from gridshift.simulator.cluster import Cluster
from gridshift.simulator.event_loop import EventLoop
from gridshift.simulator.policies.fcfs import FCFSPolicy
from gridshift.simulator.policies.backfill import BackfillPolicy

console = Console()

POLICIES = {
    "fcfs": FCFSPolicy,
    "backfill": BackfillPolicy,
}


@click.command()
@click.argument("dataset_path", type=click.Path(exists=True))
@click.option(
    "--policy",
    type=click.Choice(["fcfs", "backfill", "ppo"]),
    default="backfill",
    help="Scheduling policy to use.",
)
@click.option("--num-machines", type=int, default=None, help="Number of cluster machines.")
@click.option("--gpus", type=int, default=None, help="GPUs per machine.")
@click.option("--cpu", type=float, default=None, help="CPU cores per machine.")
@click.option("--memory", type=float, default=None, help="Memory (GB) per machine.")
@click.option("--seed", type=int, default=42, help="Random seed for determinism.")
@click.option(
    "--output",
    type=click.Path(),
    default=None,
    help="Output path for results JSON.",
)
def main(
    dataset_path: str,
    policy: str,
    num_machines: int | None,
    gpus: int | None,
    cpu: float | None,
    memory: float | None,
    seed: int,
    output: str | None,
) -> None:
    """Run a scheduling simulation on a processed dataset.

    DATASET_PATH is the path to the canonical Parquet file.
    """
    settings = get_settings()

    n_machines = num_machines or settings.DEFAULT_NUM_MACHINES
    n_gpus = gpus or settings.DEFAULT_GPUS_PER_MACHINE
    n_cpu = cpu or settings.DEFAULT_CPU_PER_MACHINE
    n_memory = memory or settings.DEFAULT_MEMORY_PER_MACHINE

    console.print(f"\n[bold blue]GridShift Simulation[/bold blue]")
    console.print(f"  Dataset: {dataset_path}")
    console.print(f"  Policy: {policy}")
    console.print(f"  Cluster: {n_machines} machines × {n_gpus} GPUs / {n_cpu} CPU / {n_memory} GB")
    console.print(f"  Seed: {seed}\n")

    # Load jobs
    console.print("[yellow]Loading dataset...[/yellow]")
    df = pd.read_parquet(dataset_path)
    jobs = [CanonicalJob(**row) for row in df.to_dict("records")]
    console.print(f"  Loaded {len(jobs):,} jobs")

    # Create cluster
    cluster = Cluster.create_default(
        num_machines=n_machines,
        gpus_per_machine=n_gpus,
        cpu_per_machine=n_cpu,
        memory_per_machine=n_memory,
    )

    # Create policy
    if policy == "ppo":
        console.print("[red]PPO policy requires a trained checkpoint. Use train_ppo.py first.[/red]")
        raise SystemExit(1)

    scheduling_policy = POLICIES[policy]()

    # Run simulation
    console.print(f"[yellow]Running {policy.upper()} simulation...[/yellow]")
    event_loop = EventLoop(
        jobs=jobs,
        cluster=cluster,
        policy=scheduling_policy,
        seed=seed,
    )
    result = event_loop.run()

    # Display results
    metrics = result.metrics
    results_table = Table(title=f"Simulation Results — {policy.upper()}")
    results_table.add_column("Metric", style="cyan")
    results_table.add_column("Value", style="green")
    results_table.add_row("Average Wait", f"{metrics.avg_wait:.2f}s")
    results_table.add_row("P95 Wait", f"{metrics.p95_wait:.2f}s")
    results_table.add_row("GPU Utilization", f"{metrics.gpu_utilization:.2%}")
    results_table.add_row("Throughput", f"{metrics.throughput:.2f} jobs/hr")
    results_table.add_row("Fragmentation Events", str(metrics.fragmentation_events))
    results_table.add_row("Constraint Violations", str(metrics.constraint_violations))
    results_table.add_row("Completed Jobs", f"{metrics.completed_jobs}/{metrics.total_jobs}")
    console.print(results_table)

    # Save results
    if output:
        output_path = Path(output)
    else:
        output_path = (
            Path(settings.ARTIFACTS_DIR)
            / "experiments"
            / "results"
            / f"{policy}_seed{seed}_results.json"
        )
    output_path.parent.mkdir(parents=True, exist_ok=True)

    results_data = {
        "policy": policy,
        "seed": seed,
        "cluster_config": {
            "num_machines": n_machines,
            "gpus_per_machine": n_gpus,
            "cpu_per_machine": n_cpu,
            "memory_per_machine": n_memory,
        },
        "dataset": dataset_path,
        "metrics": {
            "avg_wait": metrics.avg_wait,
            "p95_wait": metrics.p95_wait,
            "gpu_utilization": metrics.gpu_utilization,
            "throughput": metrics.throughput,
            "fragmentation_events": metrics.fragmentation_events,
            "constraint_violations": metrics.constraint_violations,
            "total_jobs": metrics.total_jobs,
            "completed_jobs": metrics.completed_jobs,
            "simulation_duration": metrics.simulation_duration,
        },
    }

    with open(output_path, "w") as f:
        json.dump(results_data, f, indent=2)
    console.print(f"\n[green]Results saved to {output_path}[/green]\n")


if __name__ == "__main__":
    main()

