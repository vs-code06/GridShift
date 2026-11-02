import React from 'react';
import { Link } from 'react-router-dom';
import MetricCard from '../components/common/MetricCard';
import StatusBadge from '../components/common/StatusBadge';
import { useDatasets, useExperiments } from '../api/hooks';

export default function Overview() {
  const { data: datasets, isLoading: datasetsLoading } = useDatasets();
  const { data: experiments, isLoading: expsLoading } = useExperiments();

  const activeDataset = datasets && datasets.length > 0 ? datasets[0] : null;
  const latestExp = experiments && experiments.length > 0 ? experiments[experiments.length - 1] : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cluster & Scheduler Overview</h1>
        <p className="text-sm text-slate-500 mt-1">
          Trace-driven research prototype for intelligent GPU job scheduling with demand forecasting and PPO.
        </p>
      </div>

      {/* Top metrics row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Cluster Nodes"
          value="10 Nodes"
          subtitle="80 GPUs • 640 CPU cores • 2.5 TiB RAM"
          icon="🖥️"
        />
        <MetricCard
          title="Active Trace"
          value={activeDataset ? `${activeDataset.valid_rows} Jobs` : 'Sample Alibaba'}
          subtitle={activeDataset ? activeDataset.id : '500 Jobs • 3-day window'}
          icon="📊"
          badge="CANONICAL"
          badgeColor="emerald"
        />
        <MetricCard
          title="GPU Utilization"
          value={latestExp?.metrics ? `${(latestExp.metrics.gpu_utilization * 100).toFixed(1)}%` : '11.6%'}
          subtitle={latestExp ? `Latest: ${latestExp.policy.toUpperCase()}` : 'Baseline Backfill'}
          icon="⚡"
        />
        <MetricCard
          title="Throughput"
          value={latestExp?.metrics ? `${latestExp.metrics.throughput.toFixed(1)}/hr` : '6.9/hr'}
          subtitle={latestExp?.metrics ? `P95 wait: ${latestExp.metrics.p95_wait.toFixed(0)}s` : 'Completed: 500/500'}
          icon="⏱️"
        />
      </div>

      {/* Model & Architecture Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <span>📈</span> ML Forecaster (XGBoost)
            </h2>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 font-medium">
              TRAINED
            </span>
          </div>
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            Estimates aggregate GPU demand over the next 30 minutes from lagged job arrivals, arrival rates, and cyclical calendar signals without future leakage.
          </p>
          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Test MAE</p>
              <p className="text-base font-bold text-slate-800 mt-0.5">5.19</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Naive MAE</p>
              <p className="text-base font-bold text-amber-600 mt-0.5">10.82</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">WAPE</p>
              <p className="text-base font-bold text-emerald-600 mt-0.5">59.2%</p>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Link to="/forecast" className="text-xs font-semibold text-sky-600 hover:text-sky-700">
              Inspect forecast curves →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <span>🤖</span> RL Policy (PPO + Masking)
            </h2>
            <span className="text-xs bg-sky-50 text-sky-700 px-2.5 py-0.5 rounded-full border border-sky-200 font-medium">
              READY
            </span>
          </div>
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            MaskablePPO agent evaluates candidate queue jobs using cluster resource balances and demand forecast features, with best-fit placement enforcing capacity invariants.
          </p>
          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Lookahead K</p>
              <p className="text-base font-bold text-slate-800 mt-0.5">5 Jobs</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Action Space</p>
              <p className="text-base font-bold text-slate-800 mt-0.5">Discrete(6)</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Violations</p>
              <p className="text-base font-bold text-emerald-600 mt-0.5">0</p>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Link to="/experiments" className="text-xs font-semibold text-sky-600 hover:text-sky-700">
              Run policy benchmark →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Action Nav Grid */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Research & Evaluation Areas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/workload"
            className="group block p-4 rounded-lg border border-slate-200/60 hover:border-sky-300 hover:bg-sky-50/40 transition-all"
          >
            <div className="text-2xl mb-2">📁</div>
            <h3 className="text-sm font-semibold text-slate-900 group-hover:text-sky-700">Workload Explorer</h3>
            <p className="text-xs text-slate-500 mt-1">Arrival patterns, GPU request distributions & data audits.</p>
          </Link>
          <Link
            to="/simulation"
            className="group block p-4 rounded-lg border border-slate-200/60 hover:border-sky-300 hover:bg-sky-50/40 transition-all"
          >
            <div className="text-2xl mb-2">⚙️</div>
            <h3 className="text-sm font-semibold text-slate-900 group-hover:text-sky-700">Cluster Simulation</h3>
            <p className="text-xs text-slate-500 mt-1">Node utilization, waiting queue inspection, and live allocations.</p>
          </Link>
          <Link
            to="/forecast"
            className="group block p-4 rounded-lg border border-slate-200/60 hover:border-sky-300 hover:bg-sky-50/40 transition-all"
          >
            <div className="text-2xl mb-2">📈</div>
            <h3 className="text-sm font-semibold text-slate-900 group-hover:text-sky-700">Demand Forecaster</h3>
            <p className="text-xs text-slate-500 mt-1">Predicted vs actual GPU load, error metrics, and lag features.</p>
          </Link>
          <Link
            to="/experiments"
            className="group block p-4 rounded-lg border border-slate-200/60 hover:border-sky-300 hover:bg-sky-50/40 transition-all"
          >
            <div className="text-2xl mb-2">🧪</div>
            <h3 className="text-sm font-semibold text-slate-900 group-hover:text-sky-700">Policy Benchmark</h3>
            <p className="text-xs text-slate-500 mt-1">Side-by-side comparison of FCFS, Backfill, and PPO agent.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

