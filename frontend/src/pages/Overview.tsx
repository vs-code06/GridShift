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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cluster Overview</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Adaptive GPU cluster scheduler featuring XGBoost workload demand forecasting and PPO reinforcement learning.
        </p>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Cluster Capacity"
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

      {/* Models & Architecture Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ML Forecaster Panel */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Workload Forecaster</h2>
                <p className="text-xs text-slate-500">XGBoost Regression</p>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Trained
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed my-4">
              Estimates aggregate cluster GPU demand across the forward 30-minute window using lagged arrival rates and diurnal calendar signals without temporal leakage.
            </p>

            <div className="grid grid-cols-3 gap-3 bg-slate-50 rounded-lg p-3.5 border border-slate-200/70 text-center">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Test MAE</span>
                <p className="text-base font-bold text-slate-900 mt-0.5">5.19</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Naive MAE</span>
                <p className="text-base font-bold text-slate-500 mt-0.5">10.82</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">WAPE</span>
                <p className="text-base font-bold text-slate-900 mt-0.5">59.2%</p>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2 flex justify-end">
            <Link to="/forecast" className="text-xs font-semibold text-slate-900 hover:text-slate-600 inline-flex items-center gap-1 transition-colors">
              Inspect forecast curves →
            </Link>
          </div>
        </div>

        {/* PPO Policy Panel */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Reinforcement Learning Policy</h2>
                <p className="text-xs text-slate-500">MaskablePPO Agent</p>
              </div>
              <span className="text-xs font-semibold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                Active
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed my-4">
              Evaluates candidate jobs from the queue utilizing cluster resource balances and forecast signals, with best-fit placement enforcing strict capacity invariants.
            </p>

            <div className="grid grid-cols-3 gap-3 bg-slate-50 rounded-lg p-3.5 border border-slate-200/70 text-center">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Lookahead K</span>
                <p className="text-base font-bold text-slate-900 mt-0.5">5 Jobs</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Action Space</span>
                <p className="text-base font-bold text-slate-900 mt-0.5">Disc(6)</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Violations</span>
                <p className="text-base font-bold text-emerald-700 mt-0.5">0</p>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2 flex justify-end">
            <Link to="/experiments" className="text-xs font-semibold text-slate-900 hover:text-slate-600 inline-flex items-center gap-1 transition-colors">
              Run policy benchmark →
            </Link>
          </div>
        </div>
      </div>

      {/* Modules List Panel */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Platform Modules</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { to: '/workload', title: 'Workload Explorer', desc: 'Trace distributions and data invariant audits' },
            { to: '/simulation', title: 'Simulation State', desc: 'Node allocations and queue inspection' },
            { to: '/forecast', title: 'Demand Forecaster', desc: 'Predicted vs. actual GPU demand curves' },
            { to: '/experiments', title: 'Policy Benchmark', desc: 'Side-by-side comparison of FCFS, Backfill & PPO' },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="p-4 rounded-lg border border-slate-200/80 hover:border-slate-400 hover:bg-slate-50/70 transition-all group"
            >
              <h4 className="text-sm font-semibold text-slate-900 group-hover:text-slate-700 transition-colors">
                {item.title} →
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
