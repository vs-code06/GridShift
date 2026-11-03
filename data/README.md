# GridShift — Data Directory

## Dataset: Alibaba Cluster Trace GPU 2020

### Source
- **Repository:** [Alibaba Cluster Trace - GPU 2020](https://github.com/alibaba/clusterdata/tree/master/cluster-trace-gpu-v2020)
- **Type:** Historical production workload trace from Alibaba GPU clusters
- **License:** Check the repository for current license/terms before use

### Description
This dataset contains GPU job scheduling traces from Alibaba's production clusters,
collected in 2020. It includes job submission times, resource requests (GPU, CPU, memory),
and execution metadata.

### Usage in GridShift
- We use a **100,000-job production slice** (~37.5 days) extracted directly from Alibaba PAI's `pai_task_table.csv`
- The trace is replayed through our simulator — it is NOT a live feed
- Job runtimes are replayed as-is (simplifying assumption documented in the PRD)

### Files
- `raw/` — Original trace files (CSV/Parquet) downloaded from the repository
- `processed/` — Cleaned, validated, and normalized Parquet files in canonical schema

### Canonical Schema
| Field | Type | Description |
|-------|------|-------------|
| `job_id` | string | Unique job identifier |
| `submit_time` | float | Epoch seconds when job was submitted |
| `requested_gpus` | int | Number of GPU units requested (≥1) |
| `requested_cpu` | float | CPU cores requested |
| `requested_memory` | float | Memory in GB requested |
| `observed_runtime` | float | Actual runtime in seconds (simulator-only, hidden from policy) |

### Field Mappings
Document the mapping from source trace columns to canonical fields here after
inspecting the actual trace files.

```
# Example mapping (update after trace exploration):
# source_column → canonical_field
# task_name → job_id
# start_time → submit_time
# plan_gpu → requested_gpus
# plan_cpu → requested_cpu
# plan_mem → requested_memory
# (end_time - start_time) → observed_runtime
```

### Exclusions
Document any rows excluded during preprocessing:
- Rows with missing GPU requests
- Rows with zero or negative resource values
- Rows outside the selected time range

### Reproducibility
- All preprocessing steps are implemented in `src/gridshift/data/`
- Run `gridshift-ingest` to reproduce the canonical dataset from raw files
- Random seeds and configurations are logged for each experiment

