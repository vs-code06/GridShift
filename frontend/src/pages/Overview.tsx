import React from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, ShieldCheck, ArrowRight, Cpu, Zap, Activity, Play } from 'lucide-react';

// Continuous 24h timeline: GPU allocation vs 30-min ML forecast against 80 GPU ceiling
const timelineData = [
  { time: '00:00', actual: 52, forecast: 50, maxCap: 80 },
  { time: '02:00', actual: 49, forecast: 48, maxCap: 80 },
  { time: '04:00', actual: 47, forecast: 48, maxCap: 80 },
  { time: '06:00', actual: 51, forecast: 50, maxCap: 80 },
  { time: '08:00', actual: 57, forecast: 56, maxCap: 80 },
  { time: '10:00', actual: 64, forecast: 63, maxCap: 80 },
  { time: '12:00', actual: 67, forecast: 66, maxCap: 80 },
  { time: '14:00', actual: 65, forecast: 64, maxCap: 80 },
  { time: '16:30 (Now)', actual: 62, forecast: 63, maxCap: 80, isNow: true },
  { time: '18:00', actual: 63, forecast: 64, maxCap: 80 },
  { time: '20:00', actual: 58, forecast: 59, maxCap: 80 },
  { time: '22:00', actual: 55, forecast: 55, maxCap: 80 },
  { time: '24:00', actual: 52, forecast: 51, maxCap: 80 },
];

// 10 Physical Compute Nodes: 8 GPUs, 64 vCPUs, 256 GB RAM each (62 Active / 18 Available GPUs total)
interface NodeState {
  id: string;
  jobs: string;
  slots: ('active' | 'available')[];
  mem: string;
  cpu: string;
}

const leftNodes: NodeState[] = [
  {
    id: 'node-01',
    jobs: '3 jobs',
    slots: ['active', 'active', 'active', 'active', 'active', 'active', 'active', 'available'],
    mem: '192 GB',
    cpu: '56 vCPU',
  },
  {
    id: 'node-03',
    jobs: '4 jobs',
    slots: ['active', 'active', 'active', 'active', 'active', 'active', 'active', 'active'],
    mem: '256 GB',
    cpu: '64 vCPU',
  },
  {
    id: 'node-05',
    jobs: '2 jobs',
    slots: ['active', 'active', 'active', 'active', 'active', 'active', 'available', 'available'],
    mem: '192 GB',
    cpu: '48 vCPU',
  },
  {
    id: 'node-07',
    jobs: '2 jobs',
    slots: ['active', 'active', 'active', 'active', 'active', 'active', 'available', 'available'],
    mem: '192 GB',
    cpu: '48 vCPU',
  },
  {
    id: 'node-09',
    jobs: '2 jobs',
    slots: ['active', 'active', 'active', 'active', 'active', 'available', 'available', 'available'],
    mem: '160 GB',
    cpu: '40 vCPU',
  },
];

const rightNodes: NodeState[] = [
  {
    id: 'node-02',
    jobs: '3 jobs',
    slots: ['active', 'active', 'active', 'active', 'active', 'active', 'active', 'available'],
    mem: '192 GB',
    cpu: '56 vCPU',
  },
  {
    id: 'node-04',
    jobs: '1 job',
    slots: ['active', 'active', 'active', 'active', 'active', 'available', 'available', 'available'],
    mem: '160 GB',
    cpu: '40 vCPU',
  },
  {
    id: 'node-06',
    jobs: '3 jobs',
    slots: ['active', 'active', 'active', 'active', 'active', 'active', 'active', 'available'],
    mem: '192 GB',
    cpu: '56 vCPU',
  },
  {
    id: 'node-08',
    jobs: '4 jobs',
    slots: ['active', 'active', 'active', 'active', 'active', 'active', 'active', 'active'],
    mem: '256 GB',
    cpu: '64 vCPU',
  },
  {
    id: 'node-10',
    jobs: '1 job',
    slots: ['active', 'active', 'active', 'available', 'available', 'available', 'available', 'available'],
    mem: '96 GB',
    cpu: '24 vCPU',
  },
];

export default function Overview() {
  return (
    <div className="w-full space-y-6 max-w-[1360px]">
      {/* 1. Hero Overview Card: Raised Surface, Depth & Cohesion */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[11px] font-mono tracking-wider uppercase mb-1.5">
            <span className="text-slate-400 font-semibold">PAI 100K TRACE DATASET</span>
            <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              AUTO-SCHEDULING ACTIVE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-sans">
            Cluster Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Autonomous reinforcement learning scheduling using Maskable PPO with XGBoost demand foresight across 80 heterogeneous compute accelerators.
          </p>
        </div>

        {/* Real Dual-Model Badges */}
        <div className="flex items-center gap-3 shrink-0 self-start md:self-center font-mono text-xs">
          <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Scheduler</div>
            <div className="font-semibold text-slate-900 mt-0.5">Maskable PPO (K=5)</div>
          </div>
          <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Demand Forecaster</div>
            <div className="font-semibold text-slate-900 mt-0.5">XGBoost (30m Horizon)</div>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Strip (Canonical 100k Benchmark Metrics) */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 overflow-hidden">
        {/* Metric 1 */}
        <div className="p-4 sm:p-5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            GPU SATURATION
          </div>
          <div className="flex items-baseline mt-1.5">
            <span className="text-3xl font-light tracking-tight text-slate-900 font-sans">
              78.1%
            </span>
            <span className="text-xs font-mono text-slate-400 ml-1.5">
              / 80.0% cap
            </span>
          </div>
          <div className="text-[11px] font-mono text-emerald-600 font-medium mt-1">
            +5.7% vs backfilling (72.4%)
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 sm:p-5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            MEAN QUEUE WAIT
          </div>
          <div className="flex items-baseline mt-1.5">
            <span className="text-3xl font-light tracking-tight text-slate-900 font-sans">
              52.8s
            </span>
            <span className="text-xs font-mono text-slate-400 ml-1.5">
              p50
            </span>
          </div>
          <div className="text-[11px] font-mono text-emerald-600 font-medium mt-1">
            -63.0% vs strict FCFS
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 sm:p-5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            ACTIVE CAPACITY
          </div>
          <div className="flex items-baseline mt-1.5">
            <span className="text-3xl font-light tracking-tight text-slate-900 font-sans">
              62
            </span>
            <span className="text-xs font-mono text-slate-400 ml-1.5">
              / 80 GPUs
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1">
            18 Standby · 640 Cores
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 sm:p-5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            TRACE WORKLOAD
          </div>
          <div className="flex items-baseline mt-1.5">
            <span className="text-3xl font-light tracking-tight text-slate-900 font-sans">
              100,000
            </span>
            <span className="text-xs font-mono text-slate-400 ml-1.5">
              tasks
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1">
            0 Violations · 37.5d Trace
          </div>
        </div>
      </div>

      {/* 3. Demand & Saturation Timeline Panel */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Demand &amp; Saturation Timeline
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuous GPU allocation vs 30-minute machine learning forecast
            </p>
          </div>
          <div className="flex items-center gap-5 text-xs font-mono text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-[2px] bg-slate-900"></span>
              Allocated (62 GPUs)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-[2px] border-b border-dashed border-blue-500"></span>
              30m ML Forecast (63 GPUs)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-[2px] border-b border-dotted border-slate-300"></span>
              Max Cap (80 GPUs)
            </span>
          </div>
        </div>

        {/* Timeline AreaChart */}
        <div className="h-64 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={timelineData}
              margin={{ top: 16, right: 24, left: 24, bottom: 4 }}
            >
              <defs>
                <linearGradient id="allocatedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0f172a" stopOpacity={0.08} />
                  <stop offset="95%" stopColor="#0f172a" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="time"
                ticks={['00:00', '04:00', '08:00', '12:00', '16:30 (Now)', '20:00', '24:00']}
                tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                stroke="#e2e8f0"
                tickLine={false}
              />
              <YAxis
                domain={[0, 88]}
                ticks={[20, 40, 60, 80]}
                width={68}
                tickFormatter={(v) => `${v} GPU`}
                tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                stroke="#e2e8f0"
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const actualVal = payload[0]?.value as number;
                    const forecastVal = payload[1]?.value as number;
                    return (
                      <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-md font-mono text-xs space-y-1">
                        <div className="text-slate-900 font-semibold border-b border-slate-100 pb-1">
                          {label}
                        </div>
                        <div className="flex items-center justify-between gap-4 text-slate-800">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-[2px] bg-slate-900" />
                            <span>Allocated:</span>
                          </span>
                          <span className="font-bold">{actualVal} / 80 GPUs ({Math.round((actualVal / 80) * 100)}%)</span>
                        </div>
                        {forecastVal !== undefined && (
                          <div className="flex items-center justify-between gap-4 text-blue-600">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-[2px] bg-blue-500" />
                              <span>30m Forecast:</span>
                            </span>
                            <span className="font-semibold">{forecastVal} GPUs</span>
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 flex justify-between">
                          <span>Capacity Headroom:</span>
                          <span className="text-emerald-700 font-medium">{80 - actualVal} GPUs Free</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine
                y={80}
                stroke="#cbd5e1"
                strokeDasharray="2 2"
              />
              <ReferenceLine
                x="16:30 (Now)"
                stroke="#cbd5e1"
                strokeDasharray="3 3"
              />
              <ReferenceDot
                x="16:30 (Now)"
                y={62}
                r={4.5}
                fill="#0f172a"
                stroke="#ffffff"
                strokeWidth={2}
              />
              <Area
                type="natural"
                dataKey="actual"
                name="Allocated"
                stroke="#0f172a"
                strokeWidth={1.75}
                fill="url(#allocatedGrad)"
              />
              <Area
                type="natural"
                dataKey="forecast"
                name="30m ML Forecast"
                stroke="#3b82f6"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="none"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Compute Topology Panel: 10 Nodes with Discrete GPU Accelerator Slots */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Compute Topology
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              10 physical machines • 8 GPUs · 64 vCPUs · 256 GB RAM each
            </p>
          </div>
          <div className="flex items-center gap-5 text-xs font-mono text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-slate-900"></span>
              Active (62)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-slate-200"></span>
              Available (18)
            </span>
          </div>
        </div>

        {/* 2-Column Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-14 gap-y-3 pt-1">
          {/* Left Column: Nodes 01, 03, 05, 07, 09 */}
          <div className="space-y-3">
            {leftNodes.map((node) => (
              <div
                key={node.id}
                className="flex items-center justify-between py-1.5 text-xs font-mono border-b border-slate-50 last:border-none"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-900 w-16">{node.id}</span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60 w-12 text-center">
                    SXM4
                  </span>
                  {/* 8 GPU Slot Blocks */}
                  <div className="flex items-center gap-1">
                    {node.slots.map((state, sIdx) => (
                      <span
                        key={sIdx}
                        className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[2px] transition-colors ${
                          state === 'active'
                            ? 'bg-slate-900'
                            : 'bg-slate-200'
                        }`}
                        title={`GPU ${sIdx}: ${state}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Resource Stats (Memory & vCPU allocation) */}
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="text-slate-500 w-16 text-right">{node.mem}</span>
                  <span className="text-slate-700 font-medium w-16 text-right">{node.cpu}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Nodes 02, 04, 06, 08, 10 */}
          <div className="space-y-3">
            {rightNodes.map((node) => (
              <div
                key={node.id}
                className="flex items-center justify-between py-1.5 text-xs font-mono border-b border-slate-50 last:border-none"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-900 w-16">{node.id}</span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60 w-12 text-center">
                    SXM4
                  </span>
                  {/* 8 GPU Slot Blocks */}
                  <div className="flex items-center gap-1">
                    {node.slots.map((state, sIdx) => (
                      <span
                        key={sIdx}
                        className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[2px] transition-colors ${
                          state === 'active'
                            ? 'bg-slate-900'
                            : 'bg-slate-200'
                        }`}
                        title={`GPU ${sIdx}: ${state}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Resource Stats (Memory & vCPU allocation) */}
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="text-slate-500 w-16 text-right">{node.mem}</span>
                  <span className="text-slate-700 font-medium w-16 text-right">{node.cpu}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Dual-Stage Intelligent Scheduling Architecture (Replaces unbuilt benchmark table) */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Dual-Stage Scheduling Architecture
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Production ML models trained and validated on canonical Alibaba PAI cluster telemetry
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-600 font-medium">
            ● All Models Operational
          </span>
        </div>

        {/* 2 Balanced Architecture Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 pt-1">
          {/* Stage 1: XGBoost Forecaster */}
          <div className="p-4 sm:p-5 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50/80 transition-colors flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-xs text-slate-900">
                    Stage 1: Workload Demand Forecaster
                  </span>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  XGBoost Regressor
                </span>
              </div>

              <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                Estimates aggregate cluster GPU demand across the forward 30-minute window using 19 temporal lags and cyclical diurnal features without future lookahead leakage.
              </p>

              {/* Telemetry Metrics */}
              <div className="grid grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-slate-200/60 text-center font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Test MAE</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">5.19</span>
                  <span className="text-[9px] text-emerald-600 font-semibold block">-52% vs Naive (10.82)</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">WAPE</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">28.7%</span>
                  <span className="text-[9px] text-slate-400 block">Relative Error</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Latency</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">0.9 µs</span>
                  <span className="text-[9px] text-slate-400 block">Real-time Inference</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Link
                to="/forecast"
                className="text-xs font-semibold text-slate-900 hover:text-slate-600 inline-flex items-center gap-1 transition-colors"
              >
                Inspect forecast curves <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Stage 2: Maskable PPO Agent */}
          <div className="p-4 sm:p-5 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50/80 transition-colors flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-xs text-slate-900">
                    Stage 2: Reinforcement Learning Placement
                  </span>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Maskable PPO Agent
                </span>
              </div>

              <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                Evaluates candidate queue jobs using cluster resource balances and demand foresight, applying strict invalid-placement action masking to eliminate capacity violations.
              </p>

              {/* Telemetry Metrics */}
              <div className="grid grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-slate-200/60 text-center font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Lookahead K</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">5 Jobs</span>
                  <span className="text-[9px] text-slate-400 block">Queue Horizon</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Action Masking</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">Discrete(6)</span>
                  <span className="text-[9px] text-emerald-600 font-semibold block">0 Invariant Violations</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Mean Wait</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">52.8s</span>
                  <span className="text-[9px] text-emerald-600 font-semibold block">-63.0% vs FCFS (142s)</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Link
                to="/simulation"
                className="text-xs font-semibold text-slate-900 hover:text-slate-600 inline-flex items-center gap-1 transition-colors"
              >
                Launch policy simulator <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
