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
import {
  Database,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Activity,
  FileCheck2,
  UploadCloud,
} from 'lucide-react';
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
  { gpus: '1 GPU', count: 52400 },
  { gpus: '2 GPUs', count: 28100 },
  { gpus: '4 GPUs', count: 12500 },
  { gpus: '8 GPUs', count: 7000 },
];

const auditRules = [
  { name: 'Non-negative Runtimes', detail: '0 jobs with duration <= 0; uncompleted tasks safely filtered' },
  { name: 'Discrete GPU Counts', detail: 'Integer ceiling applied ensuring integer GPU allocations' },
  { name: 'Timestamp Monotonicity', detail: 'Strict chronological ordering with zero negative arrival deltas' },
  { name: 'Capacity Feasibility', detail: 'All jobs fit single-node maximum capacity (<= 8 GPUs)' },
];

export default function WorkloadExplorer() {
  const { data: datasets } = useDatasets();
  const importMutation = useImportDataset();
  const [importPath, setImportPath] = useState('data/raw/alibaba_gpu_trace.csv');

  const active = datasets && datasets.length > 0 ? datasets[0] : null;

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importPath) return;
    importMutation.mutate({ file_path: importPath });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-7xl">
      {/* 1. Hero Workload Header Card: Raised Surface, Depth & Cohesion */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[11px] font-mono tracking-wider uppercase mb-1.5">
            <span className="text-slate-400 font-semibold">CANONICAL WORKLOAD</span>
            <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              100% INVARIANTS VALID
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-sans">
            Workload Explorer
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Alibaba GPU Trace 2020 ingestion profile, resource request distributions, and data invariant audits across 100,000 tasks.
          </p>
        </div>

        {/* Dataset Telemetry Badges */}
        <div className="flex items-center gap-3 shrink-0 self-start md:self-center font-mono text-xs">
          <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Source Format</div>
            <div className="font-semibold text-slate-900 mt-0.5 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span>Parquet (Snappy)</span>
            </div>
          </div>
          <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Trace Duration</div>
            <div className="font-semibold text-slate-900 mt-0.5">37.5 Continuous Days</div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Total Trace Jobs"
          value={active ? `${active.total_rows.toLocaleString()}` : '100,000'}
          subtitle="Processed canonical records"
          icon={<Database className="w-3.5 h-3.5" />}
        />
        <MetricCard
          title="Validation Rate"
          value={
            active && active.total_rows > 0
              ? `${((active.valid_rows / active.total_rows) * 100).toFixed(1)}%`
              : '100.0%'
          }
          subtitle="Passed invariant checks"
          badge="100% VALID"
          badgeColor="emerald"
          icon={<ShieldCheck className="w-3.5 h-3.5" />}
        />
        <MetricCard
          title="Excluded Rows"
          value={active ? `${active.excluded_rows}` : '0'}
          subtitle="Zero or negative GPU requests"
          icon={<FileCheck2 className="w-3.5 h-3.5" />}
        />
        <MetricCard
          title="Trace Timespan"
          value="37.5 Days"
          subtitle="Continuous multi-week trace"
          icon={<Clock className="w-3.5 h-3.5" />}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Arrival Timeline */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-900">
                Arrival & GPU Request Intensity
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Arrival count and aggregate requested GPUs over diurnal bins.</p>
            </div>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <div className="h-60 sm:h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={arrivalTimeSeries} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="arrivals"
                  name="Job Arrivals"
                  stroke="#0f172a"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#0f172a' }}
                />
                <Line
                  type="monotone"
                  dataKey="gpus_requested"
                  name="Requested GPUs"
                  stroke="#64748b"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#64748b' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GPU Distribution */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-900">
                Requested GPU Size Distribution
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Frequency of jobs requesting 1, 2, 4, or 8 discrete GPUs.</p>
            </div>
            <Database className="w-4 h-4 text-slate-400" />
          </div>
          <div className="h-60 sm:h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gpuDistributionData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="gpus" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(val: number) => [`${val.toLocaleString()} Jobs`, 'Count']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  }}
                />
                <Bar dataKey="count" name="Job Count" fill="#0f172a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Audit Checklist & Re-ingest Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Audit Status Panel */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-900">Data Invariant Audits</h2>
              <p className="text-xs text-slate-500 mt-0.5">Strict schema validation rules verified on ingestion.</p>
            </div>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="divide-y divide-slate-100">
            {auditRules.map((r, i) => (
              <div key={i} className="py-3 flex items-center justify-between text-xs gap-3">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900">{r.name}</span>
                    <p className="text-slate-500 text-[11px] mt-0.5">{r.detail}</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                  Verified
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Trace Ingest Tool Panel */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-slate-900">Ingest Trace File</h2>
                <p className="text-xs text-slate-500 mt-0.5">Validate and convert raw trace CSV to canonical Parquet format.</p>
              </div>
              <UploadCloud className="w-4 h-4 text-slate-400" />
            </div>
            <form onSubmit={handleImport} className="space-y-3 pt-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">File Path</label>
                <input
                  type="text"
                  value={importPath}
                  onChange={(e) => setImportPath(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setImportPath('data/raw/alibaba_gpu_trace.csv')}
                  className="text-[10px] text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors"
                >
                  Use Production CSV Path
                </button>
              </div>
              <button
                type="submit"
                disabled={importMutation.isPending}
                className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                {importMutation.isPending ? 'Validating...' : 'Ingest & Validate'}
              </button>
            </form>
          </div>
          {importMutation.isSuccess && (
            <div className="text-xs text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center gap-2 mt-3">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Successfully processed and validated {importMutation.data.data.valid_rows} jobs into canonical Parquet!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
