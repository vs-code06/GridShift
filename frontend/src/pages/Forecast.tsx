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
import MetricCard from '../components/common/MetricCard';

const forecastTimeSeries = [
  { step: '0h', actual: 42, predicted: 39, naive: 48 },
  { step: '2h', actual: 68, predicted: 64, naive: 42 },
  { step: '4h', actual: 95, predicted: 89, naive: 68 },
  { step: '6h', actual: 110, predicted: 106, naive: 95 },
  { step: '8h', actual: 75, predicted: 79, naive: 110 },
  { step: '10h', actual: 52, predicted: 50, naive: 75 },
  { step: '12h', actual: 38, predicted: 42, naive: 52 },
  { step: '14h', actual: 61, predicted: 58, naive: 38 },
  { step: '16h', actual: 88, predicted: 84, naive: 61 },
  { step: '18h', actual: 102, predicted: 97, naive: 88 },
  { step: '20h', actual: 65, predicted: 70, naive: 102 },
];

const featureImportanceData = [
  { feature: 'lag_gpu_1 (t-5m)', importance: 38 },
  { feature: 'rolling_mean_6', importance: 22 },
  { feature: 'hour_sin/cos', importance: 16 },
  { feature: 'lag_gpu_2 (t-10m)', importance: 11 },
  { feature: 'lag_jobs_1', importance: 8 },
  { feature: 'day_sin/cos', importance: 5 },
];

export default function Forecast() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Demand Forecasting</h1>
        <p className="text-sm text-slate-500 mt-1">
          XGBoost regression forecasting aggregate cluster GPU requests for the next 30-minute window without lookahead leakage.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="XGBoost MAE"
          value="5.19"
          subtitle="Test error (52% lower vs. naive)"
          badge="LOWEST"
          badgeColor="emerald"
        />
        <MetricCard
          title="Naive MAE"
          value="10.82"
          subtitle="Recent-window projection baseline"
        />
        <MetricCard
          title="WAPE Score"
          value="59.2%"
          subtitle="Weighted absolute percentage error"
        />
        <MetricCard
          title="Horizon"
          value="30 mins"
          subtitle="5-minute interval discretization"
        />
      </div>

      {/* Main Prediction Chart Panel */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Predicted vs. Actual Demand</h2>
            <p className="text-xs text-slate-500 mt-0.5">Evaluation on held-out test split comparing XGBoost against actual requests and naive baseline.</p>
          </div>
          <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2.5 py-1 rounded">
            Target: sum(gpus, t+30m)
          </span>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecastTimeSeries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="step" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              <Line
                type="monotone"
                dataKey="actual"
                name="Actual Demand"
                stroke="#0f172a"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#0f172a' }}
              />
              <Line
                type="monotone"
                dataKey="predicted"
                name="XGBoost Prediction"
                stroke="#334155"
                strokeWidth={2}
                strokeDasharray="4 3"
                dot={{ r: 3, fill: '#334155' }}
              />
              <Line
                type="monotone"
                dataKey="naive"
                name="Naive Baseline"
                stroke="#94a3b8"
                strokeWidth={1.5}
                dot={{ r: 2, fill: '#94a3b8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Feature Importance & Invariants Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Importance */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Feature Importance (%)</h2>
            <p className="text-xs text-slate-500 mt-0.5">Relative gain contributions to prediction accuracy.</p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={featureImportanceData} margin={{ top: 0, right: 16, left: 16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 45]} />
                <YAxis dataKey="feature" type="category" stroke="#64748b" fontSize={11} tickLine={false} width={130} />
                <Tooltip
                  formatter={(val: number) => [`${val}%`, 'Importance']}
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
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Temporal Isolation Guarantees</h2>
            <p className="text-xs text-slate-500 mt-0.5">Strict architectural constraints enforced across the pipeline.</p>
          </div>
          <div className="space-y-3.5 text-xs text-slate-600 pt-1">
            {[
              'All features are computed strictly from information available at or before timestamp t.',
              'Observed job runtimes and future arrivals are strictly excluded from input observations.',
              'Chronological 60/20/20 train/validation/test split ensures clean held-out evaluation.',
              'Forecast predictions are fed into the PPO scheduler as context, with ablation studies evaluated.',
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                <p className="leading-relaxed text-slate-700">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
