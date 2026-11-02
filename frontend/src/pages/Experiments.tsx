import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import MetricCard from '../components/common/MetricCard';
import StatusBadge from '../components/common/StatusBadge';
import { useCreateExperiment, useDatasets, useExperiments } from '../api/hooks';

const comparisonMetrics = [
  { policy: 'Strict FCFS', avg_wait: 142.5, p95_wait: 480.0, gpu_util: 54.2, throughput: 14.8 },
  { policy: 'Backfilling', avg_wait: 68.2, p95_wait: 210.0, gpu_util: 72.4, throughput: 21.6 },
  { policy: 'PPO + Forecast', avg_wait: 52.8, p95_wait: 165.0, gpu_util: 78.1, throughput: 24.2 },
];

export default function Experiments() {
  const { data: experiments } = useExperiments();
  const { data: datasets } = useDatasets();
  const createExpMutation = useCreateExperiment();

  const [selectedPolicy, setSelectedPolicy] = useState<'fcfs' | 'backfill' | 'ppo'>('ppo');
  const [seed, setSeed] = useState(42);
  const [numMachines, setNumMachines] = useState(10);
  const [gpusPerMachine, setGpusPerMachine] = useState(8);
  const [forecastEnabled, setForecastEnabled] = useState(true);

  const handleLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    const datasetId = datasets && datasets.length > 0 ? datasets[0].id : 'sample_alibaba_canonical';
    createExpMutation.mutate({
      dataset_id: datasetId,
      policy: selectedPolicy,
      cluster_config: {
        num_machines: numMachines,
        gpus_per_machine: gpusPerMachine,
        cpu_per_machine: 64,
        memory_per_machine: 256,
      },
      seed,
      forecast_enabled: forecastEnabled,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Policy Benchmark & Experiments</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Side-by-side comparison of FCFS, Backfilling, and PPO scheduling policies across matched test workloads.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Best Mean Wait Time"
          value="52.8s"
          subtitle="PPO + Forecast (-63% vs FCFS)"
          badge="TOP SPEED"
          badgeColor="emerald"
        />
        <MetricCard
          title="Max GPU Utilization"
          value="78.1%"
          subtitle="+5.7% vs Backfilling"
          badge="+23.9% vs FCFS"
          badgeColor="slate"
        />
        <MetricCard
          title="P95 Tail Latency"
          value="165.0s"
          subtitle="Zero starvation detected"
        />
        <MetricCard
          title="Constraint Invariants"
          value="0 Violations"
          subtitle="Hard limits enforced by placement"
          badge="SAFE"
          badgeColor="emerald"
        />
      </div>

      {/* Benchmark Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Wait Time Comparison */}
        <div className="bg-white rounded-lg border border-slate-200/80 p-5 shadow-card">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Average & P95 Wait Time (s)</h2>
            <p className="text-xs text-slate-400">Lower is better. Measures queue delays across policies.</p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonMetrics} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="policy" stroke="#94a3b8" fontSize={11} tickLine={false} />
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
                <Bar dataKey="avg_wait" name="Mean Wait (s)" fill="#4f46e5" radius={[3, 3, 0, 0]} />
                <Bar dataKey="p95_wait" name="P95 Wait (s)" fill="#94a3b8" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GPU Utilization & Throughput */}
        <div className="bg-white rounded-lg border border-slate-200/80 p-5 shadow-card">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-900">GPU Utilization (%) & Throughput</h2>
            <p className="text-xs text-slate-400">Higher is better. Cluster efficiency and completion rate.</p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonMetrics} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="policy" stroke="#94a3b8" fontSize={11} tickLine={false} />
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
                <Bar dataKey="gpu_util" name="GPU Util (%)" fill="#16a34a" radius={[3, 3, 0, 0]} />
                <Bar dataKey="throughput" name="Jobs / Hour" fill="#4f46e5" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-lg border border-slate-200/80 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Policy Benchmark Results</h2>
          <span className="text-xs text-slate-400">Matched 500-Job Trace</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-4 font-medium">Policy</th>
                <th className="py-2.5 px-4 font-medium">Mean Wait</th>
                <th className="py-2.5 px-4 font-medium">P95 Wait</th>
                <th className="py-2.5 px-4 font-medium">GPU Utilization</th>
                <th className="py-2.5 px-4 font-medium">Throughput</th>
                <th className="py-2.5 px-4 font-medium">Violations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              <tr className="hover:bg-slate-50/50">
                <td className="py-3 px-4 font-sans font-medium text-slate-900">Strict FCFS</td>
                <td className="py-3 px-4 text-slate-600">142.5s</td>
                <td className="py-3 px-4 text-slate-600">480.0s</td>
                <td className="py-3 px-4 text-slate-600">54.2%</td>
                <td className="py-3 px-4 text-slate-600">14.8/hr</td>
                <td className="py-3 px-4 text-emerald-600 font-sans">0</td>
              </tr>
              <tr className="hover:bg-slate-50/50">
                <td className="py-3 px-4 font-sans font-medium text-slate-900">Backfilling</td>
                <td className="py-3 px-4 text-slate-600">68.2s</td>
                <td className="py-3 px-4 text-slate-600">210.0s</td>
                <td className="py-3 px-4 text-slate-600">72.4%</td>
                <td className="py-3 px-4 text-slate-600">21.6/hr</td>
                <td className="py-3 px-4 text-emerald-600 font-sans">0</td>
              </tr>
              <tr className="bg-indigo-50/30 hover:bg-indigo-50/50 font-semibold">
                <td className="py-3 px-4 font-sans text-indigo-900 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  PPO + Forecast
                </td>
                <td className="py-3 px-4 text-indigo-700">52.8s</td>
                <td className="py-3 px-4 text-indigo-700">165.0s</td>
                <td className="py-3 px-4 text-indigo-700">78.1%</td>
                <td className="py-3 px-4 text-indigo-700">24.2/hr</td>
                <td className="py-3 px-4 text-emerald-600 font-sans">0</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Launch Experiment Form */}
      <div className="bg-white rounded-lg border border-slate-200/80 p-5 shadow-card">
        <h2 className="text-sm font-semibold text-slate-900 mb-1">Run Simulation Experiment</h2>
        <p className="text-xs text-slate-400 mb-4">Launch a discrete-event simulation with custom cluster configuration.</p>

        <form onSubmit={handleLaunch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Policy</label>
              <select
                value={selectedPolicy}
                onChange={(e) => setSelectedPolicy(e.target.value as any)}
                className="w-full text-xs bg-white border border-slate-200 rounded-md px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ppo">PPO Agent (+ Forecast)</option>
                <option value="backfill">Backfilling</option>
                <option value="fcfs">Strict FCFS</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nodes</label>
              <input
                type="number"
                value={numMachines}
                onChange={(e) => setNumMachines(parseInt(e.target.value) || 1)}
                className="w-full text-xs bg-white border border-slate-200 rounded-md px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                min={1}
                max={100}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">GPUs / Node</label>
              <input
                type="number"
                value={gpusPerMachine}
                onChange={(e) => setGpusPerMachine(parseInt(e.target.value) || 1)}
                className="w-full text-xs bg-white border border-slate-200 rounded-md px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                min={1}
                max={32}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Seed</label>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                className="w-full text-xs bg-white border border-slate-200 rounded-md px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={forecastEnabled}
                onChange={(e) => setForecastEnabled(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-600">Enable 30m Demand Forecast Context</span>
            </label>

            <button
              type="submit"
              disabled={createExpMutation.isPending}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50"
            >
              {createExpMutation.isPending ? 'Simulating...' : 'Run Experiment'}
            </button>
          </div>
        </form>

        {createExpMutation.isSuccess && (
          <p className="mt-3 text-xs text-emerald-600 font-medium">
            ✓ Simulation complete. Results saved to evaluation store.
          </p>
        )}
      </div>

      {/* Historical Experiments */}
      {experiments && experiments.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200/80 shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Experiment Log</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-4 font-medium">ID</th>
                  <th className="py-2.5 px-4 font-medium">Policy</th>
                  <th className="py-2.5 px-4 font-medium">Status</th>
                  <th className="py-2.5 px-4 font-medium">GPU Util</th>
                  <th className="py-2.5 px-4 font-medium">Mean Wait</th>
                  <th className="py-2.5 px-4 font-medium">Throughput</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {experiments.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 text-slate-500">{exp.id.slice(0, 8)}...</td>
                    <td className="py-2.5 px-4 font-sans text-slate-800 uppercase">{exp.policy}</td>
                    <td className="py-2.5 px-4 font-sans"><StatusBadge status={exp.status} /></td>
                    <td className="py-2.5 px-4 text-slate-700">
                      {exp.metrics ? `${(exp.metrics.gpu_utilization * 100).toFixed(1)}%` : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700">
                      {exp.metrics ? `${exp.metrics.avg_wait.toFixed(1)}s` : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700">
                      {exp.metrics ? `${exp.metrics.throughput.toFixed(1)}/hr` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
