"""PPO-based scheduling policy wrapper for the simulator."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import numpy as np
import torch
from sb3_contrib import MaskablePPO

if not torch.cuda.is_available():
    torch.set_num_threads(1)

from ...data.schemas import CanonicalJob
from ..cluster import Cluster
from ..placement import place_job
from .base import SchedulingDecision, SchedulingPolicy
from ...rl.action_mask import compute_action_mask
from ...rl.observation import build_observation

logger = logging.getLogger(__name__)


class PPOPolicy(SchedulingPolicy):
    """Scheduling policy driven by a trained PPO agent checkpoint.

    Uses observation features and action masks to query the policy,
    selecting jobs and delegating placement to the best-fit layer.
    """

    def __init__(
        self,
        checkpoint_path: str | Path,
        candidate_k: int = 10,
        deterministic: bool = True,
    ) -> None:
        self._checkpoint_path = Path(checkpoint_path)
        self._candidate_k = candidate_k
        self._deterministic = deterministic

        self._model = MaskablePPO.load(str(self._checkpoint_path))
        # Infer candidate_k directly from the model's action space (which is K + 1)
        if hasattr(self._model.action_space, "n"):
            self._candidate_k = int(self._model.action_space.n) - 1
        else:
            self._candidate_k = candidate_k
        logger.info(
            "Loaded PPO policy checkpoint from %s (candidate_k=%d)",
            self._checkpoint_path,
            self._candidate_k,
        )

    @property
    def name(self) -> str:
        return "ppo"

    def select_jobs(
        self,
        queue: list[CanonicalJob],
        cluster: Cluster,
        context: dict[str, Any] | None = None,
    ) -> list[SchedulingDecision]:
        if not queue:
            return []

        ctx = context or {}
        current_time = ctx.get("current_time", queue[0].submit_time)
        forecast_demand = ctx.get("forecast_demand", 0.0)
        forecast_age = ctx.get("forecast_age", 0.0)

        # Build observation
        obs = build_observation(
            queue=queue,
            cluster=cluster,
            current_time=current_time,
            candidate_k=self._candidate_k,
            forecast_demand=forecast_demand,
            forecast_age=forecast_age,
        )

        # Build action mask
        mask = compute_action_mask(queue, cluster, candidate_k=self._candidate_k)

        # Query model
        action, _ = self._model.predict(
            obs,
            action_masks=mask,
            deterministic=self._deterministic,
        )
        action_idx = int(action)

        # Action K is WAIT
        if action_idx >= self._candidate_k or action_idx >= len(queue):
            return []

        selected_job = queue[action_idx]
        target_machine = place_job(selected_job, cluster)
        if target_machine is not None:
            return [SchedulingDecision(job=selected_job, machine_id=target_machine)]

        return []
