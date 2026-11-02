"""Side-by-side policy comparison runner."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from ..data.schemas import CanonicalJob
from .experiment import ExperimentResult, run_policy_experiment

logger = logging.getLogger(__name__)


def compare_policies(
    test_jobs: list[CanonicalJob],
    cluster_config: dict[str, Any],
    ppo_checkpoint: str | Path | None = None,
    seed: int = 42,
    candidate_k: int = 10,
) -> dict[str, Any]:
    """Run baseline policies and PPO on identical test workloads and compare outcomes.

    Parameters
    ----------
    test_jobs:
        Identical held-out job sequence used for all policies.
    cluster_config:
        Fixed cluster specification.
    ppo_checkpoint:
        Optional path to trained PPO checkpoint.
    seed:
        Shared random seed.
    candidate_k:
        Lookahead queue size.

    Returns
    -------
    dict[str, Any]
        Structured comparison containing per-policy metrics and delta analysis.
    """
    logger.info("Running comparison on %d test jobs (seed=%d)...", len(test_jobs), seed)

    # 1. Run strict FCFS
    fcfs_res = run_policy_experiment(
        jobs=test_jobs,
        policy="fcfs",
        cluster_config=cluster_config,
        seed=seed,
    )

    # 2. Run Backfilling
    backfill_res = run_policy_experiment(
        jobs=test_jobs,
        policy="backfill",
        cluster_config=cluster_config,
        seed=seed,
    )

    # 3. Run PPO if checkpoint provided
    ppo_res: ExperimentResult | None = None
    if ppo_checkpoint and Path(ppo_checkpoint).exists():
        ppo_res = run_policy_experiment(
            jobs=test_jobs,
            policy="ppo",
            cluster_config=cluster_config,
            seed=seed,
            ppo_checkpoint=ppo_checkpoint,
            candidate_k=candidate_k,
        )

    comparison_rows = [
        _format_result_dict(fcfs_res),
        _format_result_dict(backfill_res),
    ]
    if ppo_res:
        comparison_rows.append(_format_result_dict(ppo_res))

    return {
        "cluster_config": cluster_config,
        "seed": seed,
        "num_test_jobs": len(test_jobs),
        "results": comparison_rows,
    }


def _format_result_dict(res: ExperimentResult) -> dict[str, Any]:
    m = res.metrics
    return {
        "policy": res.policy_name,
        "seed": res.seed,
        "avg_wait_sec": round(m.avg_wait, 2),
        "p95_wait_sec": round(m.p95_wait, 2),
        "gpu_utilization": round(m.gpu_utilization, 4),
        "throughput_jobs_hr": round(m.throughput, 2),
        "fragmentation_events": m.fragmentation_events,
        "constraint_violations": m.constraint_violations,
        "completed_jobs": m.completed_jobs,
        "total_jobs": m.total_jobs,
    }

