import React, { useState } from 'react';

interface MockJobRecord {
  jobId: string;
  submitTime: string;
  startTime: string;
  completionTime: string;
  waitTime: string;
  machine: string;
  gpus: number;
  cpu: number;
  mem: number;
  status: 'completed' | 'running' | 'queued';
}

const mockJobsData: MockJobRecord[] = Array.from({ length: 25 }, (_, i) => {
  const gpus = [1, 2, 4, 8][i % 4];
  const wait = (i * 7 + 12) % 180;
  return {
    jobId: `task_${(i + 1).toString().padStart(5, '0')}`,
    submitTime: `2020-03-01 0${(i % 12) + 1}:00:00`,
    startTime: `2020-03-01 0${(i % 12) + 1}:${Math.floor(wait / 60)}:${wait % 60}`,
    completionTime: `2020-03-01 0${(i % 12) + 2}:15:00`,
    waitTime: `${wait}s`,
    machine: `node-${i % 10}`,
    gpus,
    cpu: gpus * 4,
    mem: gpus * 16,
    status: 'completed',
  };
});

export default function JobDetails() {
  const [search, setSearch] = useState('');
  const [filterGpu, setFilterGpu] = useState('all');

  const filtered = mockJobsData.filter((j) => {
    const matchSearch = j.jobId.toLowerCase().includes(search.toLowerCase()) || j.machine.includes(search);
    const matchGpu = filterGpu === 'all' || j.gpus.toString() === filterGpu;
    return matchSearch && matchGpu;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Job Execution History</h1>
        <p className="text-sm text-slate-500 mt-1">
          Detailed inspection of per-job scheduling outcomes, placement decisions, and waiting times.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex-1 w-full sm:max-w-xs">
          <input
            type="text"
            placeholder="Search Job ID or node..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 font-mono"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">GPU Request:</span>
          <select
            value={filterGpu}
            onChange={(e) => setFilterGpu(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium"
          >
            <option value="all">All Sizes</option>
            <option value="1">1 GPU</option>
            <option value="2">2 GPUs</option>
            <option value="4">4 GPUs</option>
            <option value="8">8 GPUs</option>
          </select>
        </div>
      </div>

      {/* Job Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Job ID</th>
                <th className="py-2.5 px-4 font-semibold">Submitted</th>
                <th className="py-2.5 px-4 font-semibold">Started</th>
                <th className="py-2.5 px-4 font-semibold">Queue Wait</th>
                <th className="py-2.5 px-4 font-semibold">Machine</th>
                <th className="py-2.5 px-4 font-semibold">Resources</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filtered.map((j) => (
                <tr key={j.jobId} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 px-4 font-semibold text-slate-800">{j.jobId}</td>
                  <td className="py-2.5 px-4 text-slate-500">{j.submitTime}</td>
                  <td className="py-2.5 px-4 text-slate-500">{j.startTime}</td>
                  <td className="py-2.5 px-4 font-semibold text-sky-600">{j.waitTime}</td>
                  <td className="py-2.5 px-4 text-slate-700">{j.machine}</td>
                  <td className="py-2.5 px-4 text-slate-600">
                    {j.gpus} GPUs • {j.cpu}c • {j.mem}G
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-sans font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      COMPLETED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filtered.length} of {mockJobsData.length} recorded jobs</span>
          <span className="font-mono text-[11px]">Zero constraint violations logged</span>
        </div>
      </div>
    </div>
  );
}
