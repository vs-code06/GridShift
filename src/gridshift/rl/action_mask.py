"""Action masking for the scheduling reinforcement learning agent.

In our discrete action space of size (K + 1):
- Actions 0 through K - 1 correspond to selecting candidate job index i from the queue.
- Action K represents WAIT (let time advance to the next event).

An action i in [0, K-1] is valid if and only if:
1. i < len(queue)
2. job[i] can fit on at least one machine in the cluster.

Action K (WAIT) is always valid.
"""

from __future__ import annotations

import numpy as np

from ..data.schemas import CanonicalJob
from ..simulator.cluster import Cluster
from ..simulator.placement import place_job


def compute_action_mask(
    queue: list[CanonicalJob],
    cluster: Cluster,
    candidate_k: int = 10,
) -> np.ndarray:
    """Compute boolean action mask of shape (candidate_k + 1,).

    Parameters
    ----------
    queue:
        Current waiting queue of canonical jobs.
    cluster:
        Current cluster state.
    candidate_k:
        Number of candidate slots in action space.

    Returns
    -------
    np.ndarray
        Boolean array of dtype bool and length (candidate_k + 1).
    """
    mask = np.zeros(candidate_k + 1, dtype=bool)

    # Check candidates 0..K-1
    for i in range(min(len(queue), candidate_k)):
        job = queue[i]
        # Valid if there exists at least one feasible machine in cluster
        target_machine = place_job(job, cluster)
        if target_machine is not None:
            mask[i] = True

    # WAIT action (index K) is always valid
    mask[candidate_k] = True

    return mask

