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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Cluster Simulation</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Current node allocations, resource utilization, and waiting job queue.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Policy:</label>
          <select
            value={filterPolicy}
            onChange={(e) => setFilterPolicy(e.target.value)}
            className="text-xs bg-white border border-slate-200 text-slate-700 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="fcfs">Strict FCFS</option>
            <option value="backfill">Backfill</option>
            <option value="ppo">PPO Agent</option>
          </select>
        </div>
      </div>

      {/* Cluster Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard title="GPU Utilization" value={`${utilPct}%`} subtitle={`${allocatedGpus} of ${totalGpus} GPUs in use`} />
        <MetricCard title="Active Jobs" value="18" subtitle="Across 10 compute nodes" />
        <MetricCard title="Waiting in Queue" value="5 Jobs" subtitle="4 immediately fittable" />
        <MetricCard title="Average Queue Wait" value="78s" subtitle="P95: 142s" />
      </div>

      {/* Node Grid */}
      <div className="bg-white rounded-lg border border-slate-200/80 p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Compute Nodes (10 Machines)</h2>
          <span className="text-xs text-slate-400">8 GPUs · 64 CPU · 256 GB RAM each</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {mockMachines.map((m) => {
            const gpuPct = Math.round((m.allocatedGpus / m.totalGpus) * 100);
            return (
              <div
                key={m.id}
                className="p-3 rounded-md border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-semibold text-slate-800">{m.id}</span>
                  <span className="text-[10px] text-slate-500">{m.runningJobs} running</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>GPU</span>
                      <span>{m.allocatedGpus}/8 ({gpuPct}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                        style={{ width: `${gpuPct}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>CPU</span>
                      <span>{m.allocatedCpu}/64</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-slate-400 transition-all duration-300"
                        style={{ width: `${Math.round((m.allocatedCpu / m.totalCpu) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Waiting Job Queue Table */}
      <div className="bg-white rounded-lg border border-slate-200/80 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Waiting Job Queue</h2>
            <p className="text-xs text-slate-400 mt-0.5">Top candidate jobs eligible for placement decisions.</p>
          </div>
          <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded">
            5 Jobs Waiting
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-4 font-medium">Index</th>
                <th className="py-2.5 px-4 font-medium">Job ID</th>
                <th className="py-2.5 px-4 font-medium">Submitted</th>
                <th className="py-2.5 px-4 font-medium">GPUs</th>
                <th className="py-2.5 px-4 font-medium">CPU</th>
                <th className="py-2.5 px-4 font-medium">RAM</th>
                <th className="py-2.5 px-4 font-medium">Queue Age</th>
                <th className="py-2.5 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {mockQueue.map((job, idx) => (
                <tr key={job.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 px-4 text-slate-400">#{idx + 1}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-800">{job.id}</td>
                  <td className="py-2.5 px-4 text-slate-500">{job.submitTime}</td>
                  <td className="py-2.5 px-4 text-indigo-600 font-semibold">{job.gpus} GPU</td>
                  <td className="py-2.5 px-4 text-slate-600">{job.cpu}c</td>
                  <td className="py-2.5 px-4 text-slate-600">{job.mem} GB</td>
                  <td className="py-2.5 px-4 text-slate-700">{job.age}</td>
                  <td className="py-2.5 px-4 font-sans">
                    {job.feasible ? (
                      <span className="text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                        Fittable
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded">
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
