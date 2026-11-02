import React, { useState } from 'react';

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
  id: `node-${i}`,
  totalGpus: 8,
  allocatedGpus: i < 3 ? 6 : i < 7 ? 4 : 2,
  totalCpu: 64,
  allocatedCpu: i < 3 ? 48 : i < 7 ? 32 : 16,
  totalMem: 256,
  allocatedMem: i < 3 ? 192 : i < 7 ? 128 : 64,
  runningJobs: i < 3 ? 3 : i < 7 ? 2 : 1,
}));

const mockQueue = [
  { id: 'task_00142', submitTime: '10:14:02', gpus: 4, cpu: 16, mem: 64, age: '142s' },
  { id: 'task_00143', submitTime: '10:14:45', gpus: 2, cpu: 8, mem: 32, age: '99s' },
  { id: 'task_00144', submitTime: '10:15:10', gpus: 1, cpu: 4, mem: 16, age: '74s' },
  { id: 'task_00145', submitTime: '10:15:32', gpus: 8, cpu: 32, mem: 128, age: '52s' },
  { id: 'task_00146', submitTime: '10:16:01', gpus: 2, cpu: 8, mem: 32, age: '23s' },
];

export default function Simulation() {
  const [filterPolicy, setFilterPolicy] = useState('backfill');

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cluster Simulation State</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time inspection of node capacity, waiting queue, and running allocations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Policy View:</span>
          <select
            value={filterPolicy}
            onChange={(e) => setFilterPolicy(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-sky-500 font-medium"
          >
            <option value="fcfs">Strict FCFS</option>
            <option value="backfill">FCFS Backfilling</option>
            <option value="ppo">PPO Agent</option>
          </select>
        </div>
      </div>

      {/* Cluster Node Grid */}
      <div>
        <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center justify-between">
          <span>Cluster Compute Nodes (10 Machines)</span>
          <span className="text-xs text-slate-500 font-normal">Uniform: 8 GPUs • 64 CPU • 256 GB RAM per node</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {mockMachines.map((m) => {
            const gpuPct = Math.round((m.allocatedGpus / m.totalGpus) * 100);
            return (
              <div
                key={m.id}
                className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs hover:border-slate-300 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-slate-800">{m.id}</span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    {m.runningJobs} running
                  </span>
                </div>

                {/* GPU Utilization Bar */}
                <div className="space-y-1.5 mt-3">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">GPUs</span>
                    <span className="font-semibold text-slate-700">
                      {m.allocatedGpus}/{m.totalGpus} ({gpuPct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        gpuPct >= 75 ? 'bg-amber-500' : gpuPct >= 50 ? 'bg-sky-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${gpuPct}%` }}
                    />
                  </div>
                </div>

                {/* CPU Utilization Bar */}
                <div className="space-y-1.5 mt-2.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">CPU</span>
                    <span className="font-semibold text-slate-700">
                      {m.allocatedCpu}/{m.totalCpu} cores
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${Math.round((m.allocatedCpu / m.totalCpu) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* RAM */}
                <div className="flex justify-between text-[10px] text-slate-400 mt-2.5 pt-2 border-t border-slate-100">
                  <span>Free RAM</span>
                  <span className="font-mono">{m.totalMem - m.allocatedMem} GiB</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Waiting Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Waiting Job Queue (Top Candidates)</h2>
            <p className="text-xs text-slate-500">Jobs eligible for scheduling decisions under best-fit placement.</p>
          </div>
          <span className="text-xs bg-sky-50 text-sky-700 px-2.5 py-1 rounded-full font-medium">
            5 Jobs Waiting
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Priority / Index</th>
                <th className="py-2.5 px-4 font-semibold">Job ID</th>
                <th className="py-2.5 px-4 font-semibold">Submitted</th>
                <th className="py-2.5 px-4 font-semibold">Req GPUs</th>
                <th className="py-2.5 px-4 font-semibold">Req CPU</th>
                <th className="py-2.5 px-4 font-semibold">Req RAM</th>
                <th className="py-2.5 px-4 font-semibold">Queue Age</th>
                <th className="py-2.5 px-4 font-semibold">Feasibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {mockQueue.map((job, idx) => (
                <tr key={job.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 px-4 text-slate-400 font-bold">#{idx}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-800">{job.id}</td>
                  <td className="py-2.5 px-4 text-slate-500">{job.submitTime}</td>
                  <td className="py-2.5 px-4 font-semibold text-sky-600">{job.gpus} GPUs</td>
                  <td className="py-2.5 px-4 text-slate-600">{job.cpu} cores</td>
                  <td className="py-2.5 px-4 text-slate-600">{job.mem} GB</td>
                  <td className="py-2.5 px-4 text-amber-600">{job.age}</td>
                  <td className="py-2.5 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-sans font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      FITTABLE
                    </span>
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
