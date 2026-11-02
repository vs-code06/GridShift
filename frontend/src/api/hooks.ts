import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from './client';
import type { ExperimentConfig } from '../types';

export function useDatasets() {
  return useQuery({
    queryKey: ['datasets'],
    queryFn: () => api.getDatasets().then((r) => r.data),
  });
}

export function useDataset(id: string) {
  return useQuery({
    queryKey: ['datasets', id],
    queryFn: () => api.getDataset(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useImportDataset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.importDataset,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['datasets'] }),
  });
}

export function useExperiments() {
  return useQuery({
    queryKey: ['experiments'],
    queryFn: () => api.getExperiments().then((r) => r.data),
    refetchInterval: 4000,
  });
}

export function useExperiment(id: string) {
  return useQuery({
    queryKey: ['experiments', id],
    queryFn: () => api.getExperiment(id).then((r) => r.data),
    enabled: !!id,
    refetchInterval: (query) =>
      query.state.data?.status === 'running' ? 2000 : false,
  });
}

export function useCreateExperiment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: ExperimentConfig) =>
      api.createExperiment(config).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['experiments'] }),
  });
}

export function useExperimentJobs(id: string, page = 1, limit = 50) {
  return useQuery({
    queryKey: ['experiments', id, 'jobs', page, limit],
    queryFn: () => api.getExperimentJobs(id, page, limit).then((r) => r.data),
    enabled: !!id,
  });
}

export function useExperimentTimeline(id: string) {
  return useQuery({
    queryKey: ['experiments', id, 'timeline'],
    queryFn: () => api.getExperimentTimeline(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useForecastResults(datasetId: string) {
  return useQuery({
    queryKey: ['forecasts', datasetId],
    queryFn: () => api.getForecastResults(datasetId).then((r) => r.data),
    enabled: !!datasetId,
  });
}

