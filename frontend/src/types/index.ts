export interface CanonicalJob {
  job_id: string;
  submit_time: number;
  requested_gpus: number;
  requested_cpu: number;
  requested_memory: number;
  observed_runtime: number;
}

export interface Machine {
  machine_id: string;
  total_gpus: number;
  total_cpu: number;
  total_memory: number;
  allocated_gpus: number;
  allocated_cpu: number;
  allocated_memory: number;
  running_jobs: string[];
}

export interface ClusterConfig {
  num_machines: number;
  gpus_per_machine: number;
  cpu_per_machine: number;
  memory_per_machine: number;
}

export interface SchedulingMetrics {
  avg_wait: number;
  p95_wait: number;
  gpu_utilization: number;
  throughput: number;
  fragmentation_events: number;
  constraint_violations: number;
  total_jobs: number;
  completed_jobs: number;
  simulation_duration: number;
}

export interface DatasetInfo {
  id: string;
  source_file: string;
  date_range_start?: string;
  date_range_end?: string;
  total_rows: number;
  valid_rows: number;
  excluded_rows: number;
  created_at: string;
}

export interface ExperimentConfig {
  dataset_id: string;
  policy: 'fcfs' | 'backfill' | 'ppo';
  cluster_config: ClusterConfig;
  ppo_config?: {
    checkpoint_path?: string;
    candidate_k: number;
    seed: number;
  };
  seed: number;
  forecast_enabled: boolean;
}

export interface ExperimentRun {
  id: string;
  policy: string;
  dataset_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  seed: number;
  cluster_config: ClusterConfig;
  metrics?: SchedulingMetrics;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface JobOutcome {
  job_id: string;
  submit_time: number;
  start_time: number;
  completion_time: number;
  wait_time: number;
  assigned_machine: string;
  requested_gpus: number;
  requested_cpu: number;
  requested_memory: number;
}

export interface ForecastResult {
  horizon_minutes?: number;
  interval_minutes?: number;
  mae?: number;
  rmse?: number;
  wape?: number;
  xgboost?: {
    mae: number;
    rmse: number;
    wape: number;
    test_samples: number;
    mean_actual: number;
    mean_predicted: number;
  };
  naive?: {
    mae: number;
    rmse: number;
    wape: number;
  };
  timestamps?: number[];
  actual?: number[];
  predicted?: number[];
}

export interface TimelineEvent {
  timestamp: number;
  event_type: string;
  job_id?: string;
  machine_id?: string;
  details?: Record<string, unknown>;
}

