import React, { useState } from 'react';
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
  const [filterPolicy, setFilterPolicy] = useState('backfill');

  const totalGpus = mockMachines.reduce((s, m) => s + m.totalGpus, 0);
  const allocatedGpus = mockMachines.reduce((s, m) => s + m.allocatedGpus, 0);
  const utilPct = Math.round((allocatedGpus / totalGpus) * 100);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Cluster Simulation State</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time inspection of node capacity, waiting queue, and running allocations.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-medium text-slate-500">Policy:</span>
          <select
            value={filterPolicy}
            onChange={(e) => setFilterPolicy(e.target.value)}
            className="text-xs bg-white border border-slate-300 text-slate-800 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
          >
            <option value="fcfs">Strict FCFS</option>
            <option value="backfill">Backfill</option>
            <option value="ppo">PPO Agent</option>
          </select>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard title="GPU Utilization" value={`${utilPct}%`} subtitle={`${allocatedGpus} of ${totalGpus} GPUs active`} />
        <MetricCard title="Active Jobs" value="18" subtitle="Across 10 compute nodes" />
        <MetricCard title="Waiting in Queue" value="5 Jobs" subtitle="4 immediately fittable" />
        <MetricCard title="Mean Wait" value="78s" subtitle="P95 latency: 142s" />
      </div>

      {/* Compute Nodes Panel */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 mb-4 sm:mb-5 gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-slate-900">Compute Nodes</h2>
            <p className="text-xs text-slate-500 mt-0.5">10 Machines · 8 GPUs, 64 Cores, 256 GB RAM each</p>
          </div>
          <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2.5 py-1 rounded self-start sm:self-auto">
            Capacity: 80 GPUs
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {mockMachines.map((m) => {
            const gpuPct = Math.round((m.allocatedGpus / m.totalGpus) * 100);
            return (
              <div
                key={m.id}
                className="p-3.5 rounded-lg border border-slate-200/80 bg-slate-50/70 hover:bg-slate-100/60 transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-slate-900">{m.id}</span>
                  <span className="text-slate-500 text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    {m.runningJobs}j
                  </span>
                </div>

                {/* GPU Meter */}
                <div>
                  <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                    <span>GPU: {m.allocatedGpus}/8</span>
                    <span className="font-semibold text-slate-800">{gpuPct}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-slate-800 transition-all duration-300"
                      style={{ width: `${gpuPct}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-200/60">
                  <span>CPU: {m.allocatedCpu}/64</span>
                  <span>{m.totalMem - m.allocatedMem}G free</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Waiting Job Queue Panel */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-slate-900">Waiting Job Queue</h2>
            <p className="text-xs text-slate-500 mt-0.5">Top candidate jobs eligible for placement decisions.</p>
          </div>
          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            5 Jobs Waiting
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[550px]">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Job ID</th>
                <th className="py-3 px-4">Submitted</th>
                <th className="py-3 px-4">GPUs</th>
                <th className="py-3 px-4">CPU</th>
                <th className="py-3 px-4">RAM</th>
                <th className="py-3 px-4">Wait Age</th>
                <th className="py-3 px-4 text-right">Feasibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {mockQueue.map((job, idx) => (
                <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 text-slate-400">#{idx + 1}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900 font-sans">{job.id}</td>
                  <td className="py-3 px-4 text-slate-500">{job.submitTime}</td>
                  <td className="py-3 px-4 text-slate-900 font-semibold">{job.gpus} GPU</td>
                  <td className="py-3 px-4 text-slate-600">{job.cpu}c</td>
                  <td className="py-3 px-4 text-slate-600">{job.mem} GB</td>
                  <td className="py-3 px-4 text-slate-800">{job.age}</td>
                  <td className="py-3 px-4 text-right font-sans">
                    {job.feasible ? (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        Fittable
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                        Wait for node
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
