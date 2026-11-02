import axios from 'axios';
import type {
  DatasetInfo,
  ExperimentRun,
  ExperimentConfig,
  JobOutcome,
  ForecastResult,
  TimelineEvent,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export const importDataset = (data: {
  file_path: string;
  time_range_start?: number;
  time_range_end?: number;
  dataset_name?: string;
}) => api.post<DatasetInfo>('/datasets/import', data);

export const getDatasets = () => api.get<DatasetInfo[]>('/datasets');

export const getDataset = (id: string) => api.get<DatasetInfo>(`/datasets/${id}`);

export const createExperiment = (config: ExperimentConfig) =>
  api.post<ExperimentRun>('/experiments', config);

export const getExperiments = () => api.get<ExperimentRun[]>('/experiments');

export const getExperiment = (id: string) => api.get<ExperimentRun>(`/experiments/${id}`);

export const getExperimentJobs = (id: string, page = 1, limit = 50) =>
  api.get<{ jobs: JobOutcome[]; total: number; page: number; limit: number }>(
    `/experiments/${id}/jobs`,
    { params: { page, limit } }
  );

export const getExperimentTimeline = (id: string) =>
  api.get<TimelineEvent[]>(`/experiments/${id}/timeline`);

export const getForecastResults = (datasetId: string) =>
  api.get<ForecastResult>(`/forecasts/${datasetId}`);

export default api;

