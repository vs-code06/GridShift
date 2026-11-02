"""Single experiment runner for baseline and learned policies."""

from __future__ import annotations

import copy
import logging
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

from ..data.schemas import CanonicalJob
from ..simulator.cluster import Cluster
from ..simulator.event_loop import EventLoop
from ..simulator.metrics import SchedulingMetrics
from ..simulator.policies.backfill import BackfillPolicy
from ..simulator.policies.base import SchedulingPolicy
from ..simulator.policies.fcfs import FCFSPolicy
from ..simulator.policies.ppo_policy import PPOPolicy

logger = logging.getLogger(__name__)


@dataclass
class ExperimentResult:
    """Aggregated output from a single policy experiment."""

    policy_name: str
    seed: int
    metrics: SchedulingMetrics
    completed_jobs_count: int
    total_jobs_count: int
    cluster_config: dict[str, Any]
    timeline_events_count: int


def run_policy_experiment(
    jobs: list[CanonicalJob],
    policy: SchedulingPolicy | str,
    cluster_config: dict[str, Any],
    seed: int = 42,
    ppo_checkpoint: str | Path | None = None,
    candidate_k: int = 10,
) -> ExperimentResult:
    """Execute a single scheduling experiment deterministically.

    Parameters
    ----------
    jobs:
        Canonical jobs to simulate.
    policy:
        Policy instance or string identifier ('fcfs', 'backfill', 'ppo').
    cluster_config:
        Dictionary containing cluster dimensions (num_machines, gpus_per_machine, etc.).
    seed:
        Random seed for the run.
    ppo_checkpoint:
        Path to checkpoint if policy is 'ppo'.
    candidate_k:
        Queue candidate lookahead for PPO.

    Returns
    -------
    ExperimentResult
        Result containing metrics, job counts, and configuration.
    """
    n_machines = cluster_config.get("num_machines", 10)
    gpus = cluster_config.get("gpus_per_machine", 8)
    cpu = float(cluster_config.get("cpu_per_machine", 64.0))
    memory = float(cluster_config.get("memory_per_machine", 256.0))

    cluster = Cluster.create_default(
        num_machines=n_machines,
        gpus=gpus,
        cpu=cpu,
        memory=memory,
    )

    if isinstance(policy, str):
        pol_lower = policy.lower()
        if pol_lower == "fcfs":
            active_policy: SchedulingPolicy = FCFSPolicy()
        elif pol_lower == "backfill":
            active_policy = BackfillPolicy()
        elif pol_lower == "ppo":
            if not ppo_checkpoint:
                raise ValueError("PPO policy requires 'ppo_checkpoint' path.")
            active_policy = PPOPolicy(checkpoint_path=ppo_checkpoint, candidate_k=candidate_k)
        else:
            raise ValueError(f"Unknown policy name: {policy}")
    else:
        active_policy = policy

    sim = EventLoop(
        jobs=jobs,
        cluster=cluster,
        policy=active_policy,
        seed=seed,
    )
    result = sim.run()

    return ExperimentResult(
        policy_name=active_policy.name,
        seed=seed,
        metrics=result.metrics,
        completed_jobs_count=len(result.completed_jobs),
        total_jobs_count=len(jobs),
        cluster_config=cluster_config,
        timeline_events_count=len(result.timeline_events),
    )

