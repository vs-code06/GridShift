"""GridShift — PPO Training CLI.

Trains a PPO agent to select jobs from the waiting queue using
cluster state and demand forecast features.
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

console = Console()


@click.command()
@click.argument("dataset_path", type=click.Path(exists=True))
@click.option("--timesteps", type=int, default=None, help="Total training timesteps.")
@click.option("--seed", type=int, default=42, help="Random seed.")
@click.option("--num-machines", type=int, default=None, help="Number of cluster machines.")
@click.option("--gpus", type=int, default=None, help="GPUs per machine.")
@click.option("--cpu", type=float, default=None, help="CPU cores per machine.")
@click.option("--memory", type=float, default=None, help="Memory (GB) per machine.")
@click.option("--candidate-k", type=int, default=None, help="Number of candidate jobs in action space.")
@click.option("--forecast/--no-forecast", default=True, help="Include forecast features in observation.")
@click.option("--forecast-model", type=click.Path(exists=True), default=None, help="Path to XGBoost model.")
@click.option("--output-dir", type=click.Path(), default=None, help="Directory for checkpoints.")
def main(
    dataset_path: str,
    timesteps: int | None,
    seed: int,
    num_machines: int | None,
    gpus: int | None,
    cpu: float | None,
    memory: float | None,
    candidate_k: int | None,
    forecast: bool,
    forecast_model: str | None,
    output_dir: str | None,
) -> None:
    """Train a PPO scheduling agent.

    DATASET_PATH is the path to the canonical Parquet file.
    """
    settings = get_settings()

    n_machines = num_machines or settings.DEFAULT_NUM_MACHINES
    n_gpus = gpus or settings.DEFAULT_GPUS_PER_MACHINE
    n_cpu = cpu or settings.DEFAULT_CPU_PER_MACHINE
    n_memory = memory or settings.DEFAULT_MEMORY_PER_MACHINE
    k = candidate_k or settings.PPO_CANDIDATE_K
    total_timesteps = timesteps or settings.PPO_TRAINING_TIMESTEPS

    out_path = Path(output_dir) if output_dir else Path(settings.ARTIFACTS_DIR) / "rl" / "checkpoints"
    out_path.mkdir(parents=True, exist_ok=True)

    console.print(f"\n[bold blue]GridShift PPO Training[/bold blue]")
    console.print(f"  Dataset: {dataset_path}")
    console.print(f"  Cluster: {n_machines} machines × {n_gpus} GPUs")
    console.print(f"  Candidate K: {k}")
    console.print(f"  Forecast: {'enabled' if forecast else 'disabled'}")
    console.print(f"  Timesteps: {total_timesteps:,}")
    console.print(f"  Seed: {seed}\n")

    # Load jobs
    console.print("[yellow]Step 1:[/yellow] Loading dataset...")
    df = pd.read_parquet(dataset_path)
    jobs_data = df.to_dict("records")
    console.print(f"  Loaded {len(jobs_data):,} jobs")

    # Import RL components
    from gridshift.data.schemas import CanonicalJob
    from gridshift.simulator.cluster import Cluster
    from gridshift.rl.env import SchedulingEnv
    from gridshift.forecasting.predictor import ForecastPredictor

    jobs = [CanonicalJob(**row) for row in jobs_data]

    # Create cluster config
    cluster_config = {
        "num_machines": n_machines,
        "gpus_per_machine": n_gpus,
        "cpu_per_machine": n_cpu,
        "memory_per_machine": n_memory,
    }

    # Set up forecast predictor
    predictor = None
    if forecast and forecast_model:
        predictor = ForecastPredictor(model_path=forecast_model)
    elif forecast:
        console.print("[yellow]Warning: Forecast enabled but no model path given. Forecast features will be zero.[/yellow]")

    # Create environment
    console.print("[yellow]Step 2:[/yellow] Creating Gymnasium environment...")
    env = SchedulingEnv(
        jobs=jobs,
        cluster_config=cluster_config,
        candidate_k=k,
        forecast_predictor=predictor,
        seed=seed,
    )

    # Train PPO
    console.print("[yellow]Step 3:[/yellow] Training PPO agent...")
    from sb3_contrib import MaskablePPO
    from stable_baselines3.common.callbacks import EvalCallback

    model = MaskablePPO(
        "MlpPolicy",
        env,
        learning_rate=3e-4,
        n_steps=min(2048, max(64, len(jobs))),
        batch_size=64,
        n_epochs=10,
        gamma=0.99,
        verbose=1,
        seed=seed,
    )

    model.learn(
        total_timesteps=total_timesteps,
        progress_bar=True,
    )

    # Save checkpoint
    checkpoint_name = f"ppo_{'forecast' if forecast else 'noforecast'}_seed{seed}"
    checkpoint_path = out_path / checkpoint_name
    model.save(str(checkpoint_path))
    console.print(f"\n[green]Checkpoint saved: {checkpoint_path}.zip[/green]")

    # Save training config
    config = {
        "dataset": dataset_path,
        "cluster_config": cluster_config,
        "candidate_k": k,
        "forecast_enabled": forecast,
        "forecast_model": forecast_model,
        "seed": seed,
        "total_timesteps": total_timesteps,
        "hyperparameters": {
            "learning_rate": 3e-4,
            "n_steps": 2048,
            "batch_size": 64,
            "n_epochs": 10,
            "gamma": 0.99,
        },
        "checkpoint_path": str(checkpoint_path) + ".zip",
    }

    config_path = out_path / f"{checkpoint_name}_config.json"
    with open(config_path, "w") as f:
        json.dump(config, f, indent=2)
    console.print(f"[green]Config saved: {config_path}[/green]\n")


if __name__ == "__main__":
    main()

