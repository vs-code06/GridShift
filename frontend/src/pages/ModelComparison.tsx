import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { TrendingUp, Layers, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';

const forecastingData = [
  {
    name: 'XGBoost Regressor',
    shortName: 'XGBoost',
    family: 'Gradient Boosted Decision Trees',
    rmse: 72.18,
    mae: 42.41,
    wape: '28.7%',
    latency: '0.9 µs (0.0009 ms)',
    status: 'selected',
    statusLabel: 'Selected',
    color: '#0f172a',
  },
  {
    name: 'Random Forest',
    shortName: 'Random Forest',
    family: 'Bagged Tree Ensemble (100 Trees)',
    rmse: 73.19,
    mae: 43.54,
    wape: '29.5%',
    latency: '6.8 µs (0.0068 ms)',
    status: 'rejected',
    statusLabel: 'Rejected',
    color: '#475569',
  },
  {
    name: 'HistGradientBoosting',
    shortName: 'HistGradientBoost',
    family: 'Histogram Binned Trees',
    rmse: 74.55,
    mae: 45.71,
    wape: '30.9%',
    latency: '3.1 µs (0.0031 ms)',
    status: 'rejected',
    statusLabel: 'Rejected',
    color: '#64748b',
  },
  {
    name: 'Deep Learning (LSTM / Transformers)',
    shortName: 'LSTM / DL',
    family: 'Recurrent & Attention Networks',
    rmse: 76.00,
    mae: 46.20,
    wape: '31.5%',
    latency: '3,500 µs (3.5 ms)',
    status: 'excluded',
    statusLabel: 'Excluded',
    color: '#94a3b8',
  },
  {
    name: 'Ridge Regression',
    shortName: 'Ridge (Linear)',
    family: 'L2 Regularized Linear Model',
    rmse: 77.33,
    mae: 47.50,
    wape: '32.1%',
    latency: '0.3 µs (0.0003 ms)',
    status: 'rejected',
    statusLabel: 'Rejected',
    color: '#cbd5e1',
  },
  {
    name: 'Naive Persistence Baseline',
    shortName: 'Naive Baseline',
    family: 'Lagged Identity Projection',
    rmse: 122.44,
    mae: 76.51,
    wape: '51.8%',
    latency: '<0.1 µs',
    status: 'baseline',
    statusLabel: 'Baseline',
    color: '#e2e8f0',
  },
];

const policyData = [
  {
    name: 'Maskable PPO + Forecast',
    type: 'Reinforcement Learning',
    avgWait: '52.8s',
    gpuUtil: '78.1%',
    violations: '0',
    status: 'selected',
    statusLabel: 'Selected',
    waitNum: 52.8,
  },
  {
    name: 'Maskable PPO w/o Forecast',
    type: 'Ablation RL Policy',
    avgWait: '61.4s',
    gpuUtil: '75.3%',
    violations: '0',
    status: 'ablation',
    statusLabel: 'Ablation',
    waitNum: 61.4,
  },
  {
    name: 'Conservative Backfilling (Slurm)',
    type: 'Heuristic Baseline',
    avgWait: '68.2s',
    gpuUtil: '72.4%',
    violations: '0',
    status: 'baseline',
    statusLabel: 'Baseline',
    waitNum: 68.2,
  },
  {
    name: 'Strict FCFS',
    type: 'Queue Baseline',
    avgWait: '142.5s',
    gpuUtil: '54.2%',
    violations: '0',
    status: 'rejected',
    statusLabel: 'Rejected',
    waitNum: 142.5,
  },
  {
    name: 'Deep Q-Networks (DQN)',
    type: 'Off-Policy RL',
    avgWait: 'N/A',
    gpuUtil: 'N/A',
    violations: '>12%',
    status: 'rejected',
    statusLabel: 'Rejected',
    waitNum: 0,
  },
];

export default function ModelComparison() {
  const [activeTab, setActiveTab] = useState<'forecasting' | 'policies' | 'decisions'>('forecasting');

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-7xl">
      {/* 1. Hero Model Comparison Header Card: Raised Surface, Depth & Cohesion */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[11px] font-mono tracking-wider uppercase mb-1.5">
            <span className="text-slate-400 font-semibold">BENCHMARK MATRIX</span>
            <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              EVALUATION VERIFIED
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-sans">
            Model Comparison
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Comparative telemetry, error distributions, and selection rationale across forecasting regressors and RL scheduling policies.
          </p>
        </div>

        {/* Clean Segmented Tabs embedded in card */}
        <div className="flex items-center bg-slate-100/80 p-1 rounded-lg border border-slate-200/80 text-xs font-medium self-start md:self-center shrink-0">
          <button
            onClick={() => setActiveTab('forecasting')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'forecasting'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Forecasting Models
          </button>
          <button
            onClick={() => setActiveTab('policies')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'policies'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Scheduling Policies
          </button>
          <button
            onClick={() => setActiveTab('decisions')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'decisions'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Architecture Decisions
          </button>
        </div>
      </div>

      {/* TAB 1: Demand Forecasters */}
      {activeTab === 'forecasting' && (
        <div className="space-y-6">
          {/* Comparison Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-600" />
                Workload Demand Forecasting Benchmark (100k Trace)
              </h2>
              <span className="text-xs font-mono text-slate-500">Target: 30-min Horizon</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Model</th>
                    <th className="py-3 px-4 text-right">Test RMSE</th>
                    <th className="py-3 px-4 text-right">Test MAE</th>
                    <th className="py-3 px-4 text-right">WAPE</th>
                    <th className="py-3 px-4 text-right">Inference Latency</th>
                    <th className="py-3 px-4 text-center">Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {forecastingData.map((m) => (
                    <tr
                      key={m.name}
                      className={m.status === 'selected' ? 'bg-slate-50/70 font-medium' : 'hover:bg-slate-50/50'}
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{m.name}</div>
                        <div className="text-[11px] text-slate-500">{m.family}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-900">
                        {m.rmse.toFixed(2)}
                        {m.status === 'selected' && (
                          <span className="ml-1 text-[10px] text-emerald-600 font-bold">★ Best</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">{m.mae.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">{m.wape}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">{m.latency}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            m.status === 'selected'
                              ? 'bg-emerald-100 text-emerald-800'
                              : m.status === 'excluded'
                              ? 'bg-rose-100 text-rose-800'
                              : m.status === 'baseline'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {m.statusLabel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Simple Visual Comparison Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Test RMSE Comparison (Lower is Better)
            </h3>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={forecastingData} margin={{ top: 8, right: 8, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="shortName"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[50, 130]} />
                  <Tooltip
                    formatter={(val: number) => [`${val} GPUs`, 'Test RMSE']}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="rmse" radius={[4, 4, 0, 0]}>
                    {forecastingData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.status === 'selected' ? '#0f172a' : '#94a3b8'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Concise Rationale Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Why XGBoost Was Selected
              </h4>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li><strong>Lowest RMSE (72.18):</strong> Heavily penalizes large underprediction errors, preventing oversubscription.</li>
                <li><strong>Sub-microsecond latency (0.9 µs):</strong> 100,000 queries inside simulation take under 90 milliseconds.</li>
                <li><strong>Compact JSON (128 KB):</strong> Runs in production without PyTorch or CUDA dependencies.</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-slate-400" />
                Why Alternatives Were Rejected
              </h4>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li><strong>Ridge (Linear):</strong> Cannot capture non-linear diurnal cycles or bursts (+6.6% higher RMSE).</li>
                <li><strong>Random Forest:</strong> 7.5x slower inference (6.8 µs) and 48 MB RAM slows RL training.</li>
                <li><strong>Deep Learning (LSTM):</strong> 3,800x slower (3.5 ms per forward pass), adding ~6 min delay per episode.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Scheduling Policies */}
      {activeTab === 'policies' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-600" />
                Cluster Scheduling Policy Benchmark
              </h2>
              <span className="text-xs font-mono text-slate-500">Cluster: 10 Nodes · 80 GPUs</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Policy Strategy</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-right">Avg Wait Time</th>
                    <th className="py-3 px-4 text-right">GPU Utilization</th>
                    <th className="py-3 px-4 text-center">Violations</th>
                    <th className="py-3 px-4 text-center">Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {policyData.map((p) => (
                    <tr
                      key={p.name}
                      className={p.status === 'selected' ? 'bg-slate-50/70 font-medium' : 'hover:bg-slate-50/50'}
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900">{p.name}</td>
                      <td className="py-3 px-4 text-slate-500">{p.type}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-900">{p.avgWait}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-900">{p.gpuUtil}</td>
                      <td className="py-3 px-4 text-center font-mono">
                        <span className={p.violations === '0' ? 'text-emerald-700' : 'text-rose-600'}>
                          {p.violations}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            p.status === 'selected'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'ablation'
                              ? 'bg-slate-100 text-slate-700'
                              : p.status === 'baseline'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {p.statusLabel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Why Maskable PPO Was Chosen
              </h4>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li><strong>Provable Capacity Safety:</strong> Invalid job placements are masked out before softmax, guaranteeing 0 constraint violations.</li>
                <li><strong>Demand Foresight:</strong> Forecaster signals allow the agent to anticipate surges and hold back capacity for burst jobs.</li>
                <li><strong>Lowest Wait Time:</strong> 52.8s average wait (-63% vs FCFS, -22% vs Backfilling).</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-slate-400" />
                Why Alternatives Were Rejected
              </h4>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li><strong>Strict FCFS:</strong> Head-of-line blocking stalls queues while nodes remain idle (142.5s wait).</li>
                <li><strong>Slurm Backfill:</strong> Myopic greedy heuristic that cannot anticipate forward demand spikes.</li>
                <li><strong>DQN:</strong> Q-value overestimation diverges with dynamic candidate subsets.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Architecture Decisions */}
      {activeTab === 'decisions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <ShieldCheck className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-bold text-slate-900">Workload Forecaster Decision</h3>
            </div>
            <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong>Decision:</strong> We selected <strong>XGBoost Regressor</strong> trained on 19 temporal lag and diurnal features across 10,770 intervals.
              </p>
              <p>
                <strong>Why:</strong> Minimizes test RMSE (72.18) to avoid severe underprediction risks, while operating with sub-microsecond C++ latency (0.9 µs) inside high-frequency RL simulation loops.
              </p>
              <p>
                <strong>Alternatives:</strong> Ridge failed to model non-linear bursts (WAPE 32.1%). Random Forest was 7.5x slower with a 48 MB RAM footprint. Deep Learning (LSTM) introduced a 3.5 ms bottleneck without beating GBDTs on tabular data.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <ShieldCheck className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-bold text-slate-900">Scheduling Policy Decision</h3>
            </div>
            <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong>Decision:</strong> We selected <strong>Maskable PPO</strong> conditioned on cluster resource states and XGBoost 30-min demand predictions.
              </p>
              <p>
                <strong>Why:</strong> Invalid action masking provides a mathematical guarantee of 0 constraint violations. Conditioning on the forecaster enables proactive resource reservation during demand bursts.
              </p>
              <p>
                <strong>Alternatives:</strong> Strict FCFS caused 142.5s wait times due to head-of-line blocking. Heuristic Slurm backfilling is myopic and cannot plan ahead. DQN is unstable with dynamic candidate queue sets.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
