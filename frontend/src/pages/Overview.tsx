import React from 'react';
import { Link } from 'react-router-dom';
import MetricCard from '../components/common/MetricCard';
import { useDatasets, useExperiments } from '../api/hooks';

export default function Overview() {
  const { data: datasets } = useDatasets();
  const { data: experiments } = useExperiments();

  const activeDataset = datasets && datasets.length > 0 ? datasets[0] : null;
  const latestExp = experiments && experiments.length > 0 ? experiments[experiments.length - 1] : null;

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Cluster Overview</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          GPU cluster simulator with XGBoost workload forecasting and PPO reinforcement learning.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Cluster Nodes"
          value="10 Nodes"
          subtitle="80 GPUs · 640 CPU cores"
        />
        <MetricCard
          title="Workload Trace"
          value={activeDataset ? `${activeDataset.valid_rows} Jobs` : '500 Jobs'}
          subtitle="Alibaba 2020 · 3-day window"
          badge="CANONICAL"
          badgeColor="emerald"
        />
        <MetricCard
          title="GPU Utilization"
          value={latestExp?.metrics ? `${(latestExp.metrics.gpu_utilization * 100).toFixed(1)}%` : '78.1%'}
          subtitle="PPO + Forecast policy"
        />
        <MetricCard
          title="Throughput"
          value={latestExp?.metrics ? `${latestExp.metrics.throughput.toFixed(1)}/hr` : '24.2/hr'}
          subtitle="P95 wait: 165s"
        />
      </div>

      {/* Policy and Forecasting Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* XGBoost Forecaster */}
        <div className="bg-white rounded-lg border border-slate-200/80 p-5 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Demand Forecaster</h2>
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Trained
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            XGBoost model predicting cluster GPU demand over the next 30 minutes using lagged arrival rates and diurnal features without temporal leakage.
          </p>
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-center">
            <div>
              <span className="text-[10px] uppercase text-slate-400 font-medium">Test MAE</span>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">5.19</p>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-400 font-medium">Naive MAE</span>
              <p className="text-sm font-semibold text-slate-500 mt-0.5">10.82</p>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-400 font-medium">WAPE</span>
              <p className="text-sm font-semibold text-indigo-600 mt-0.5">59.2%</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-right">
            <Link to="/forecast" className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
              View forecast curves →
            </Link>
          </div>
        </div>

        {/* PPO Policy */}
        <div className="bg-white rounded-lg border border-slate-200/80 p-5 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">PPO Scheduling Policy</h2>
            <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            MaskablePPO agent evaluating top queue candidates using cluster capacity balances and forecast signals, with best-fit placement enforcing invariants.
          </p>
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-center">
            <div>
              <span className="text-[10px] uppercase text-slate-400 font-medium">Lookahead</span>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">5 Jobs</p>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-400 font-medium">Action Space</span>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">Disc(6)</p>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-400 font-medium">Violations</span>
              <p className="text-sm font-semibold text-emerald-600 mt-0.5">0</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-right">
            <Link to="/experiments" className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
              Compare policies →
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Quick Links */}
      <div className="bg-white rounded-lg border border-slate-200/80 p-5 shadow-card">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Modules</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { to: '/workload', title: 'Workload Explorer', desc: 'Trace distributions and data audits' },
            { to: '/simulation', title: 'Cluster Simulation', desc: 'Node allocations and queue state' },
            { to: '/forecast', title: 'Demand Forecaster', desc: 'Actual vs. predicted GPU demand' },
            { to: '/experiments', title: 'Policy Benchmark', desc: 'FCFS, Backfill, and PPO comparison' },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="p-3 rounded-md border border-slate-100 hover:border-slate-300 hover:bg-slate-50/50 transition-colors"
            >
              <h4 className="text-xs font-semibold text-slate-900">{item.title}</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
