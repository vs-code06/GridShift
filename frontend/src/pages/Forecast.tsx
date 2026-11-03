import React from 'react';
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
import { Zap, TrendingUp, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import MetricCard from '../components/common/MetricCard';

const forecastTimeSeries = [
  { step: '00:00', actual: 142, predicted: 138, naive: 155 },
  { step: '02:00', actual: 95, predicted: 102, naive: 142 },
  { step: '04:00', actual: 68, predicted: 74, naive: 95 },
  { step: '06:00', actual: 110, predicted: 105, naive: 68 },
  { step: '08:00', actual: 185, predicted: 178, naive: 110 },
  { step: '10:00', actual: 230, predicted: 224, naive: 185 },
  { step: '12:00', actual: 215, predicted: 208, naive: 230 },
  { step: '14:00', actual: 245, predicted: 239, naive: 215 },
  { step: '16:00', actual: 260, predicted: 252, naive: 245 },
  { step: '18:00', actual: 210, predicted: 216, naive: 260 },
  { step: '20:00', actual: 175, predicted: 170, naive: 210 },
  { step: '22:00', actual: 150, predicted: 146, naive: 175 },
];

const featureImportanceData = [
  { feature: 'lag_gpu_1 (t-5m)', importance: 34.2 },
  { feature: 'rolling_mean_gpu_6', importance: 18.5 },
  { feature: 'hour_sin / cos', importance: 14.1 },
  { feature: 'lag_gpu_2 (t-10m)', importance: 9.8 },
  { feature: 'rolling_std_gpu_6', importance: 8.3 },
  { feature: 'lag_jobs_1', importance: 6.4 },
  { feature: 'day_sin / cos', importance: 5.1 },
  { feature: 'lag_gpu_12 (t-1h)', importance: 3.6 },
];

export default function Forecast() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-7xl">
      {/* 1. Hero Forecasting Header Card: Raised Surface, Depth & Cohesion */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[11px] font-mono tracking-wider uppercase mb-1.5">
            <span className="text-slate-400 font-semibold">GRADIENT BOOSTED FORESIGHT</span>
            <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              INFERENCE LATENCY 0.9 µS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-sans">
            Workload Demand Forecasting
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            XGBoost regression predicting aggregate cluster GPU requests for the forward 30-minute window using 19 historical lag features without future lookahead leakage.
          </p>
        </div>

        {/* Forecaster Telemetry Badges */}
        <div className="flex items-center gap-3 shrink-0 self-start md:self-center font-mono text-xs">
          <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Prediction Target</div>
            <div className="font-semibold text-slate-900 mt-0.5">sum(gpus, t+30m)</div>
          </div>
          <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Feature Lags</div>
            <div className="font-semibold text-slate-900 mt-0.5">19 Temporal Steps</div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="XGBoost RMSE"
          value="72.18"
          subtitle="41.1% lower error vs naive (122.4)"
          badge="LOWEST RMSE"
          badgeColor="emerald"
          icon={<TrendingUp className="w-3.5 h-3.5" />}
        />
        <MetricCard
          title="XGBoost MAE"
          value="42.41"
          subtitle="Held-out test split (2,154 intervals)"
          badge="TEST SPLIT"
          badgeColor="emerald"
          icon={<Zap className="w-3.5 h-3.5" />}
        />
        <MetricCard
          title="WAPE Score"
          value="28.7%"
          subtitle="44.6% error reduction vs Naive (51.8%)"
          badge="-44.6%"
          badgeColor="emerald"
          icon={<ShieldCheck className="w-3.5 h-3.5" />}
        />
        <MetricCard
          title="Inference Latency"
          value="0.9 µs"
          subtitle="Sub-microsecond (<0.001 ms / step)"
          badge="REAL-TIME"
          badgeColor="emerald"
          icon={<Clock className="w-3.5 h-3.5" />}
        />
      </div>

      {/* Main Prediction Chart Panel */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-slate-900">
              Predicted vs. Actual GPU Demand (Held-Out Test Set)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluation on 24-hour continuous window from the test split comparing XGBoost against actual requests and naive baseline.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
            5-min Intervals
          </span>
        </div>

        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecastTimeSeries} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="step" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[50, 300]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Line
                type="monotone"
                dataKey="actual"
                name="Actual Cluster Demand (GPUs)"
                stroke="#0f172a"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#0f172a' }}
              />
              <Line
                type="monotone"
                dataKey="predicted"
                name="XGBoost Prediction"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="4 3"
                dot={{ r: 3, fill: '#3b82f6' }}
              />
              <Line
                type="monotone"
                dataKey="naive"
                name="Naive Persistence Baseline"
                stroke="#94a3b8"
                strokeWidth={1.5}
                dot={{ r: 2, fill: '#94a3b8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Feature Importance & Invariants Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Feature Importance */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-slate-900">
              Feature Importance Contributions (%)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Relative gain contributions to XGBoost prediction accuracy on 100k jobs.
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={featureImportanceData}
                margin={{ top: 0, right: 16, left: 24, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 40]} />
                <YAxis dataKey="feature" type="category" stroke="#64748b" fontSize={10} tickLine={false} width={130} />
                <Tooltip
                  formatter={(val: number) => [`${val}%`, 'Importance Gain']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="importance" fill="#0f172a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Validation & Leakage Guarantees */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-slate-900">
              Temporal Isolation & Safety Guarantees
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Strict architectural constraints enforced across the pipeline.
            </p>
          </div>
          <div className="space-y-3 text-xs text-slate-600 pt-1">
            {[
              'All 19 features computed strictly from information available at or before timestamp t.',
              'Future job arrival timestamps and observed runtimes are strictly excluded from input observations.',
              'Chronological 60/20/20 split (6,462 train / 2,154 val / 2,154 test intervals) prevents temporal leakage.',
              'Inference latency of 0.9 µs allows 100,000 evaluations inside the RL loop in under 90 milliseconds.',
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/70 border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-slate-700">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
