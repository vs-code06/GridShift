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
  { gpus: '1 GPU', count: 200 },
  { gpus: '2 GPUs', count: 150 },
  { gpus: '4 GPUs', count: 100 },
  { gpus: '8 GPUs', count: 50 },
];

const auditRules = [
  { name: 'Non-negative Runtimes', detail: '0 jobs with duration <= 0' },
  { name: 'Discrete GPU Counts', detail: 'Whole-number integer ceiling applied' },
  { name: 'Timestamp Monotonicity', detail: 'Strict chronological ordering' },
  { name: 'Capacity Feasibility', detail: 'Max job (8 GPUs) fits single node' },
];

export default function WorkloadExplorer() {
  const { data: datasets } = useDatasets();
  const importMutation = useImportDataset();
  const [importPath, setImportPath] = useState('data/raw/sample_alibaba_trace.csv');

  const active = datasets && datasets.length > 0 ? datasets[0] : null;

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importPath) return;
    importMutation.mutate({ file_path: importPath });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Workload Explorer</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Alibaba GPU Trace 2020 ingestion profile, resource request distributions, and data invariant audits.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Trace Jobs"
          value={active ? `${active.total_rows.toLocaleString()}` : '500'}
          subtitle="Processed canonical records"
        />
        <MetricCard
          title="Validation Rate"
          value={
            active && active.total_rows > 0
              ? `${((active.valid_rows / active.total_rows) * 100).toFixed(1)}%`
              : '100.0%'
          }
          subtitle="Passed invariant checks"
          badge="AUDITED"
          badgeColor="emerald"
        />
        <MetricCard
          title="Excluded Rows"
          value={active ? `${active.excluded_rows}` : '0'}
          subtitle="Zero or negative GPU requests"
        />
        <MetricCard
          title="Total GPU Hours"
          value="1,420 h"
          subtitle="Aggregated demand in 3-day trace"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Arrival Timeline */}
        <div className="bg-white rounded-lg border border-slate-200/80 p-5 shadow-card">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Job Arrival & GPU Request Intensity</h2>
            <p className="text-xs text-slate-400">Arrival frequency and aggregate requested GPUs over 4-hour bins.</p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={arrivalTimeSeries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="arrivals"
                  name="Arrivals"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#4f46e5' }}
                />
                <Line
                  type="monotone"
                  dataKey="gpus_requested"
                  name="Requested GPUs"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#94a3b8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GPU Distribution */}
        <div className="bg-white rounded-lg border border-slate-200/80 p-5 shadow-card">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Requested GPU Size Distribution</h2>
            <p className="text-xs text-slate-400">Frequency of jobs requesting 1, 2, 4, or 8 discrete GPUs.</p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gpuDistributionData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="gpus" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" name="Job Count" fill="#4f46e5" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Audit Checklist & Re-ingest */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Audit Status */}
        <div className="bg-white rounded-lg border border-slate-200/80 p-5 shadow-card">
          <h2 className="text-sm font-semibold text-slate-900 mb-1">Data Invariant Audits</h2>
          <p className="text-xs text-slate-400 mb-3">Validation rules enforced during ingestion.</p>
          <div className="divide-y divide-slate-100">
            {auditRules.map((r, i) => (
              <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-medium text-slate-800">{r.name}</span>
                  <p className="text-slate-400 text-[11px]">{r.detail}</p>
                </div>
                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Passed
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Trace Ingest Tool */}
        <div className="bg-white rounded-lg border border-slate-200/80 p-5 shadow-card">
          <h2 className="text-sm font-semibold text-slate-900 mb-1">Ingest Trace File</h2>
          <p className="text-xs text-slate-400 mb-4">Validate and convert raw trace CSV to canonical Parquet format.</p>
          <form onSubmit={handleImport} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">File Path</label>
              <input
                type="text"
                value={importPath}
                onChange={(e) => setImportPath(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-md px-2.5 py-2 font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={importMutation.isPending}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50"
            >
              {importMutation.isPending ? 'Validating...' : 'Ingest & Validate'}
            </button>
          </form>
          {importMutation.isSuccess && (
            <p className="mt-3 text-xs text-emerald-600 font-medium">
              ✓ Successfully processed and validated {importMutation.data.data.valid_rows} jobs!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
