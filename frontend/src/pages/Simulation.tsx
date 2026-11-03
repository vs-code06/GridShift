import React, { useState } from 'react';
import { Server, Zap, Clock, Activity, Cpu, CheckCircle2, AlertCircle } from 'lucide-react';
import MetricCard from '../components/common/MetricCard';

interface MockMachine {
  id: string;
  totalGpus: number;
  allocatedGpus: number;
  totalCpu: number;
  allocatedCpu: number;
  totalMem: number;
  allocatedMem: number;
  runningJobs: number;
}

const mockMachines: MockMachine[] = Array.from({ length: 10 }, (_, i) => ({
  id: `node-${String(i).padStart(2, '0')}`,
  totalGpus: 8,
  allocatedGpus: i < 3 ? 6 : i < 6 ? 4 : i < 9 ? 2 : 1,
  totalCpu: 64,
  allocatedCpu: i < 3 ? 48 : i < 6 ? 32 : i < 9 ? 16 : 8,
  totalMem: 256,
  allocatedMem: i < 3 ? 192 : i < 6 ? 128 : i < 9 ? 64 : 32,
  runningJobs: i < 3 ? 3 : i < 6 ? 2 : 1,
}));

const mockQueue = [
  { id: 'task_00142', submitTime: '10:14:02', gpus: 4, cpu: 16, mem: 64, age: '142s', feasible: true },
  { id: 'task_00143', submitTime: '10:14:45', gpus: 2, cpu: 8, mem: 32, age: '99s', feasible: true },
  { id: 'task_00144', submitTime: '10:15:10', gpus: 1, cpu: 4, mem: 16, age: '74s', feasible: true },
  { id: 'task_00145', submitTime: '10:15:32', gpus: 8, cpu: 32, mem: 128, age: '52s', feasible: false },
  { id: 'task_00146', submitTime: '10:16:01', gpus: 2, cpu: 8, mem: 32, age: '23s', feasible: true },
];

export default function Simulation() {
  const [filterPolicy, setFilterPolicy] = useState('ppo');

  const totalGpus = mockMachines.reduce((s, m) => s + m.totalGpus, 0);
  const allocatedGpus = mockMachines.reduce((s, m) => s + m.allocatedGpus, 0);
  const utilPct = Math.round((allocatedGpus / totalGpus) * 100);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-7xl">
      {/* 1. Hero Simulation Header Card: Raised Surface, Depth & Cohesion */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[11px] font-mono tracking-wider uppercase mb-1.5">
            <span className="text-slate-400 font-semibold">DISCRETE-EVENT ENGINE</span>
            <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              SIMULATOR ACTIVE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-sans">
            Cluster Simulation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Real-time discrete-event inspection of node accelerator allocations, pending queue lookahead, and live policy decisions.
          </p>
        </div>

        {/* Policy Selector & Telemetry */}
        <div className="flex items-center gap-3 shrink-0 self-start md:self-center font-mono text-xs">
          <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Active Policy</div>
            <select
              value={filterPolicy}
              onChange={(e) => setFilterPolicy(e.target.value)}
              className="font-semibold text-slate-900 bg-transparent focus:outline-none cursor-pointer mt-0.5 text-xs"
            >
              <option value="ppo">Maskable PPO Agent</option>
              <option value="backfill">Conservative Backfill</option>
              <option value="fcfs">Strict FCFS</option>
            </select>
          </div>
          <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Cluster Capacity</div>
            <div className="font-semibold text-slate-900 mt-0.5">10 Nodes · 80 GPUs</div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="GPU Utilization"
          value={`${utilPct}%`}
          subtitle={`${allocatedGpus} of ${totalGpus} GPUs active`}
          icon={<Zap className="w-3.5 h-3.5" />}
        />
        <MetricCard
          title="Active Jobs"
          value="18"
          subtitle="Across 10 compute nodes"
          icon={<Server className="w-3.5 h-3.5" />}
        />
        <MetricCard
          title="Waiting Queue"
          value="5 Jobs"
          subtitle="4 feasible under current capacity"
          badge="K=5 LOOKAHEAD"
          badgeColor="indigo"
          icon={<Clock className="w-3.5 h-3.5" />}
        />
        <MetricCard
          title="Mean Wait Time"
          value="52.8s"
          subtitle="P95 latency: 165.0s"
          icon={<Activity className="w-3.5 h-3.5" />}
        />
      </div>

      {/* Compute Nodes Panel */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 mb-4 sm:mb-5 gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-slate-900">Compute Node Topology</h2>
            <p className="text-xs text-slate-500 mt-0.5">10 Machines · 8 GPUs, 64 Cores, 256 GB RAM each</p>
          </div>
          <span className="text-xs font-mono text-slate-600 bg-slate-100 px-3 py-1 rounded-md border border-slate-200 self-start sm:self-auto">
            Total Capacity: 80 GPUs
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {mockMachines.map((m) => {
            const gpuPct = Math.round((m.allocatedGpus / m.totalGpus) * 100);
            return (
              <div
                key={m.id}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all space-y-2.5 shadow-2xs"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-slate-900">{m.id}</span>
                  <span className="text-slate-600 text-[10px] font-semibold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {m.runningJobs} {m.runningJobs === 1 ? 'job' : 'jobs'}
                  </span>
                </div>

                {/* GPU Meter */}
                <div>
                  <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                    <span>GPU: {m.allocatedGpus}/8</span>
                    <span className="font-semibold text-slate-900">{gpuPct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        gpuPct >= 75 ? 'bg-slate-900' : gpuPct >= 50 ? 'bg-slate-700' : 'bg-slate-500'
                      }`}
                      style={{ width: `${gpuPct}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-100">
                  <span>CPU: {m.allocatedCpu}/64</span>
                  <span>{m.totalMem - m.allocatedMem}G free</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Candidate Queue Panel */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-slate-900">
              Candidate Queue (Lookahead K=5)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Top candidate jobs evaluated by the scheduler placement layer.</p>
          </div>
          <span className="text-xs text-slate-500 font-mono">PPO Action Masking Active</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[500px]">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Task ID</th>
                <th className="py-3 px-4">Submit Time</th>
                <th className="py-3 px-4 text-center">GPUs</th>
                <th className="py-3 px-4 text-center">CPU</th>
                <th className="py-3 px-4 text-center">Memory</th>
                <th className="py-3 px-4 text-right">Queue Age</th>
                <th className="py-3 px-4 text-center">Feasibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockQueue.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-900">{job.id}</td>
                  <td className="py-3 px-4 text-slate-600 font-mono">{job.submitTime}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {job.gpus} GPU
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-slate-600">{job.cpu} cores</td>
                  <td className="py-3 px-4 text-center text-slate-600">{job.mem} GB</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-600">{job.age}</td>
                  <td className="py-3 px-4 text-center">
                    {job.feasible ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Fittable
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                        <AlertCircle className="w-3 h-3" /> Action Masked
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
