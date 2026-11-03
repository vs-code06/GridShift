"""Application settings loaded from environment / .env file.

Uses ``pydantic-settings`` so every value can be overridden via an
environment variable prefixed with ``GRIDSHIFT_``.
"""

from __future__ import annotations

from pathlib import Path

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class GridShiftSettings(BaseSettings):
    """Central configuration for the GridShift scheduler."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── MongoDB ──────────────────────────────────────────────────────────
    mongo_uri: str = Field(
        default="mongodb://localhost:27017",
        validation_alias=AliasChoices("MONGODB_URI", "GRIDSHIFT_MONGODB_URI", "GRIDSHIFT_MONGO_URI", "mongo_uri"),
        description="MongoDB connection URI.",
    )
    mongo_db_name: str = Field(
        default="gridshift",
        validation_alias=AliasChoices("MONGODB_DATABASE", "GRIDSHIFT_MONGODB_DATABASE", "GRIDSHIFT_MONGO_DB_NAME", "mongo_db_name"),
        description="MongoDB database name.",
    )

    # ── API ──────────────────────────────────────────────────────────────
    api_host: str = Field(
        default="0.0.0.0",
        validation_alias=AliasChoices("API_HOST", "GRIDSHIFT_API_HOST", "api_host"),
        description="API listen address.",
    )
    api_port: int = Field(
        default=8000,
        validation_alias=AliasChoices("API_PORT", "GRIDSHIFT_API_PORT", "api_port"),
        description="API listen port.",
    )

    # ── Data directories ─────────────────────────────────────────────────
    data_dir_raw: Path = Field(
        default=Path("data/raw"),
        validation_alias=AliasChoices("DATA_RAW_DIR", "GRIDSHIFT_DATA_DIR_RAW", "data_dir_raw"),
        description="Directory for raw trace files.",
    )
    data_dir_processed: Path = Field(
        default=Path("data/processed"),
        validation_alias=AliasChoices("DATA_PROCESSED_DIR", "GRIDSHIFT_DATA_DIR_PROCESSED", "data_dir_processed"),
        description="Directory for processed/canonical data.",
    )
    data_dir_artifacts: Path = Field(
        default=Path("artifacts"),
        validation_alias=AliasChoices("ARTIFACTS_DIR", "GRIDSHIFT_DATA_DIR_ARTIFACTS", "data_dir_artifacts"),
        description="Directory for generated reports and artifacts.",
    )

    # ── Simulation defaults ──────────────────────────────────────────────
    sim_num_machines: int = Field(
        default=10,
        validation_alias=AliasChoices("DEFAULT_NUM_MACHINES", "GRIDSHIFT_SIM_NUM_MACHINES", "sim_num_machines"),
        description="Default number of machines in a simulated cluster.",
    )
    sim_gpus_per_machine: int = Field(
        default=8,
        validation_alias=AliasChoices("DEFAULT_GPUS_PER_MACHINE", "GRIDSHIFT_SIM_GPUS_PER_MACHINE", "sim_gpus_per_machine"),
        description="GPUs per machine.",
    )
    sim_cpu_per_machine: int = Field(
        default=64,
        validation_alias=AliasChoices("DEFAULT_CPU_PER_MACHINE", "GRIDSHIFT_SIM_CPU_PER_MACHINE", "sim_cpu_per_machine"),
        description="CPU cores per machine.",
    )
    sim_memory_per_machine: int = Field(
        default=256,
        validation_alias=AliasChoices("DEFAULT_MEMORY_PER_MACHINE", "GRIDSHIFT_SIM_MEMORY_PER_MACHINE", "sim_memory_per_machine"),
        description="Memory (GiB) per machine.",
    )

    # ── Forecast settings ────────────────────────────────────────────────
    forecast_horizon_minutes: int = Field(
        default=30,
        validation_alias=AliasChoices("FORECAST_HORIZON_MINUTES", "GRIDSHIFT_FORECAST_HORIZON_MINUTES", "forecast_horizon_minutes"),
        description="Forecast look-ahead horizon in minutes.",
    )
    forecast_interval_minutes: int = Field(
        default=5,
        validation_alias=AliasChoices("FORECAST_INTERVAL_MINUTES", "GRIDSHIFT_FORECAST_INTERVAL_MINUTES", "forecast_interval_minutes"),
        description="Forecast granularity in minutes.",
    )

    # ── PPO / RL settings ────────────────────────────────────────────────
    ppo_candidate_k: int = Field(
        default=10,
        validation_alias=AliasChoices("PPO_CANDIDATE_K", "GRIDSHIFT_PPO_CANDIDATE_K", "ppo_candidate_k"),
        description="Number of candidate actions to evaluate per step.",
    )
    ppo_training_timesteps: int = Field(
        default=100_000,
        validation_alias=AliasChoices("PPO_TRAINING_TIMESTEPS", "GRIDSHIFT_PPO_TRAINING_TIMESTEPS", "ppo_training_timesteps"),
        description="Total PPO training timesteps.",
    )
    ppo_num_seeds: int = Field(
        default=5,
        validation_alias=AliasChoices("PPO_NUM_SEEDS", "GRIDSHIFT_PPO_NUM_SEEDS", "ppo_num_seeds"),
        description="Number of random seeds for PPO robustness runs.",
    )


    # ── Compatibility aliases ──────────────────────────────────────────
    @property
    def MONGODB_URI(self) -> str:
        return self.mongo_uri

    @property
    def MONGODB_DATABASE(self) -> str:
        return self.mongo_db_name

    @property
    def API_HOST(self) -> str:
        return self.api_host

    @property
    def API_PORT(self) -> int:
        return self.api_port

    @property
    def DATA_RAW_DIR(self) -> str:
        return str(self.data_dir_raw)

    @property
    def DATA_PROCESSED_DIR(self) -> str:
        return str(self.data_dir_processed)

    @property
    def ARTIFACTS_DIR(self) -> str:
        return str(self.data_dir_artifacts)

    @property
    def DEFAULT_NUM_MACHINES(self) -> int:
        return self.sim_num_machines

    @property
    def DEFAULT_GPUS_PER_MACHINE(self) -> int:
        return self.sim_gpus_per_machine

    @property
    def DEFAULT_CPU_PER_MACHINE(self) -> float:
        return self.sim_cpu_per_machine

    @property
    def DEFAULT_MEMORY_PER_MACHINE(self) -> float:
        return self.sim_memory_per_machine

    @property
    def FORECAST_HORIZON_MINUTES(self) -> int:
        return self.forecast_horizon_minutes

    @property
    def FORECAST_INTERVAL_MINUTES(self) -> int:
        return self.forecast_interval_minutes

    @property
    def PPO_CANDIDATE_K(self) -> int:
        return self.ppo_candidate_k

    @property
    def PPO_TRAINING_TIMESTEPS(self) -> int:
        return self.ppo_training_timesteps

    @property
    def PPO_NUM_SEEDS(self) -> int:
        return self.ppo_num_seeds


# Module-level singleton for convenience.
settings = GridShiftSettings()


def get_settings() -> GridShiftSettings:
    """Return the cached application settings instance."""
    return settings
