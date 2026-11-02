import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import MetricCard from '../components/common/MetricCard';
import { useDatasets, useImportDataset } from '../api/hooks';

// Sample arrival data over time intervals
const arrivalTimeSeries = [
  { time: '00:00', arrivals: 18, gpus_requested: 34 },
  { time: '04:00', arrivals: 12, gpus_requested: 22 },
  { time: '08:00', arrivals: 42, gpus_requested: 96 },
  { time: '12:00', arrivals: 58, gpus_requested: 132 },
  { time: '16:00', arrivals: 49, gpus_requested: 110 },
  { time: '20:00', arrivals: 31, gpus_requested: 68 },
  { time: '24:00', arrivals: 20, gpus_requested: 44 },
];

const gpuDistributionData = [
  { gpus: '1 GPU', count: 200, percentage: '40%' },
  { gpus: '2 GPUs', count: 150, percentage: '30%' },
  { gpus: '4 GPUs', count: 100, percentage: '20%' },
  { gpus: '8 GPUs', count: 50, percentage: '10%' },
];

export default function WorkloadExplorer() {
  const { data: datasets, isLoading } = useDatasets();
  const importMutation = useImportDataset();
  const [importPath, setImportPath] = useState('data/raw/sample_alibaba_trace.csv');

  const active = datasets && datasets.length > 0 ? datasets[0] : null;

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importPath) return;
    importMutation.mutate({ file_path: importPath });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Workload Explorer</h1>
          <p className="text-sm text-slate-500 mt-1">
            Alibaba GPU Trace 2020 ingestion profile, resource request distributions, and data provenance.
          </p>
        </div>
      </div>

      {/* Dataset Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Trace Jobs"
          value={active ? `${active.total_rows.toLocaleString()}` : '500'}
          subtitle="Processed canonical records"
          icon="📦"
        />
        <MetricCard
          title="Valid Rate"
          value={
            active && active.total_rows > 0
              ? `${((active.valid_rows / active.total_rows) * 100).toFixed(1)}%`
              : '100.0%'
          }
          subtitle="Passed invariant checks"
          icon="✅"
          badge="AUDITED"
          badgeColor="emerald"
        />
        <MetricCard
          title="Excluded Rows"
          value={active ? `${active.excluded_rows}` : '0'}
          subtitle="Missing or <= 0 GPU requests"
          icon="🧹"
        />
        <MetricCard
          title="Canonical Schema"
          value="v1.0"
          subtitle="Whole-number GPU, epoch timestamps"
          icon="📐"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Arrival Timeline */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
          <h2 className="text-sm font-semibold text-slate-900 mb-1">Job Arrival Intensity</h2>
          <p className="text-xs text-slate-500 mb-4">Arrival count and aggregate requested GPUs over time bins.</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={arrivalTimeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="arrivals"
                  name="Job Arrivals"
                  stroke="#0284c7"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="gpus_requested"
                  name="Requested GPUs"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GPU Distribution */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
          <h2 className="text-sm font-semibold text-slate-900 mb-1">Requested GPU Distribution</h2>
          <p className="text-xs text-slate-500 mb-4">Frequency of jobs requesting 1, 2, 4, or 8 whole GPUs.</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gpuDistributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="gpus" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" name="Job Count" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Dataset Import Tool */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
        <h2 className="text-sm font-semibold text-slate-900 mb-2">Import / Re-ingest Trace File</h2>
        <p className="text-xs text-slate-500 mb-4">
          Provide a relative or absolute path to an Alibaba GPU trace CSV/Parquet file.
        </p>
        <form onSubmit={handleImport} className="flex gap-3 max-w-xl">
          <input
            type="text"
            value={importPath}
            onChange={(e) => setImportPath(e.target.value)}
            className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-mono"
            placeholder="data/raw/trace.csv"
          />
          <button
            type="submit"
            disabled={importMutation.isPending}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
          >
            {importMutation.isPending ? 'Validating...' : 'Ingest & Validate'}
          </button>
        </form>
        {importMutation.isSuccess && (
          <p className="text-xs text-emerald-600 mt-2 font-medium">
            ✓ Successfully ingested and normalized {importMutation.data.data.valid_rows} jobs!
          </p>
        )}
      </div>
    </div>
  );
}

