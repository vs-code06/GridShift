"""Observation space builder and state normalisation for the RL environment.

Constructs a structured feature vector representing queue state, top-K candidate
jobs, per-machine cluster capacity, running-job totals, and near-term GPU
demand forecasts.
"""

from __future__ import annotations

import numpy as np

from ..data.schemas import CanonicalJob
from ..simulator.cluster import Cluster


def build_observation(
    queue: list[CanonicalJob],
    cluster: Cluster,
    current_time: float,
    candidate_k: int = 10,
    forecast_demand: float = 0.0,
    forecast_age: float = 0.0,
    max_queue_size: int = 100,
    max_job_age: float = 3600.0,
) -> np.ndarray:
    """Construct a flattened, normalised float32 observation vector.

    Layout
    ------
    1. Queue summary (4 dims):
       [len(queue) / max_q, sum_gpus / total_cluster_gpus, sum_cpu / total_cluster_cpu, sum_mem / total_cluster_mem]
    2. Candidate jobs (candidate_k * 4 dims):
       For each of first K jobs in queue:
       [normalized_age, req_gpus / max_machine_gpus, req_cpu / max_machine_cpu, req_mem / max_machine_mem]
       Padded with zeros if fewer than K jobs exist.
    3. Cluster state (len(machines) * 4 dims):
       For each machine:
       [free_gpus / total_gpus, free_cpu / total_cpu, free_mem / total_mem, node_utilization]
    4. Running jobs summary (3 dims):
       [total_running_gpus / total_cluster_gpus, total_running_cpu / total_cluster_cpu, running_count / 100]
    5. Forecast context (2 dims):
       [forecast_demand / total_cluster_gpus, min(forecast_age / 1800.0, 1.0)]

    Returns
    -------
    np.ndarray
        1D float32 array bounded in [0, 1].
    """
    total_gpus = max(1, sum(m.total_gpus for m in cluster.machines))
    total_cpu = max(1.0, sum(m.total_cpu for m in cluster.machines))
    total_mem = max(1.0, sum(m.total_memory for m in cluster.machines))

    max_node_gpus = max(1, max(m.total_gpus for m in cluster.machines))
    max_node_cpu = max(1.0, max(m.total_cpu for m in cluster.machines))
    max_node_mem = max(1.0, max(m.total_memory for m in cluster.machines))

    # 1. Queue summary
    q_len = min(len(queue), max_queue_size) / float(max_queue_size)
    q_gpus = min(sum(j.requested_gpus for j in queue), total_gpus * 4) / float(total_gpus * 4)
    q_cpu = min(sum(j.requested_cpu for j in queue), total_cpu * 4) / float(total_cpu * 4)
    q_mem = min(sum(j.requested_memory for j in queue), total_mem * 4) / float(total_mem * 4)
    queue_summary = [q_len, q_gpus, q_cpu, q_mem]

    # 2. Candidate jobs (first K)
    candidate_features = []
    for i in range(candidate_k):
        if i < len(queue):
            job = queue[i]
            age = max(0.0, current_time - job.submit_time)
            norm_age = min(age / max_job_age, 1.0)
            norm_gpus = min(job.requested_gpus / max_node_gpus, 1.0)
            norm_cpu = min(job.requested_cpu / max_node_cpu, 1.0)
            norm_mem = min(job.requested_memory / max_node_mem, 1.0)
            candidate_features.extend([norm_age, norm_gpus, norm_cpu, norm_mem])
        else:
            candidate_features.extend([0.0, 0.0, 0.0, 0.0])

    # 3. Cluster state per node
    cluster_features = []
    for m in cluster.machines:
        f_gpu = m.free_gpus() / float(m.total_gpus)
        f_cpu = m.free_cpu() / float(m.total_cpu)
        f_mem = m.free_memory() / float(m.total_memory)
        util = m.utilization()
        cluster_features.extend([f_gpu, f_cpu, f_mem, util])

    # 4. Running jobs summary
    alloc_gpus = sum(m.allocated_gpus for m in cluster.machines) / float(total_gpus)
    alloc_cpu = sum(m.allocated_cpu for m in cluster.machines) / float(total_cpu)
    running_cnt = min(sum(len(m.running_jobs) for m in cluster.machines), 100) / 100.0
    running_summary = [alloc_gpus, alloc_cpu, running_cnt]

    # 5. Forecast context
    norm_forecast = min(forecast_demand / float(total_gpus), 2.0) / 2.0
    norm_forecast_age = min(max(0.0, forecast_age) / 1800.0, 1.0)
    forecast_features = [norm_forecast, norm_forecast_age]

    obs = np.array(
        queue_summary + candidate_features + cluster_features + running_summary + forecast_features,
        dtype=np.float32,
    )
    return obs


def get_observation_dim(num_machines: int, candidate_k: int = 10) -> int:
    """Calculate the total length of the flattened observation vector."""
    # 4 (queue summary) + 4 * candidate_k + 4 * num_machines + 3 (running) + 2 (forecast)
    return 4 + (4 * candidate_k) + (4 * num_machines) + 3 + 2
