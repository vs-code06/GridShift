import React, { useState } from 'react';
import StatusBadge from '../components/common/StatusBadge';

interface MockJobRecord {
  jobId: string;
  submitTime: string;
  startTime: string;
  completionTime: string;
  waitTime: number;
  duration: number;
  machine: string;
  gpus: number;
  cpu: number;
  mem: number;
  status: 'completed' | 'running' | 'pending';
}

const mockJobsData: MockJobRecord[] = Array.from({ length: 30 }, (_, i) => {
  const gpus = [1, 2, 4, 8][i % 4];
  const wait = (i * 11 + 17) % 210;
  const dur = ((i * 37 + 45) % 180) + 30;
  return {
    jobId: `task_${(i + 1).toString().padStart(5, '0')}`,
    submitTime: `2020-03-01 0${(i % 12) + 1}:00:00`,
    startTime: `2020-03-01 0${(i % 12) + 1}:${String(Math.floor(wait / 60)).padStart(2, '0')}:${String(wait % 60).padStart(2, '0')}`,
    completionTime: `2020-03-01 0${(i % 12) + 1}:${String(Math.floor((wait + dur) / 60)).padStart(2, '0')}:${String((wait + dur) % 60).padStart(2, '0')}`,
    waitTime: wait,
    duration: dur,
    machine: `node-${String(i % 10).padStart(2, '0')}`,
    gpus,
    cpu: gpus * 8,
    mem: gpus * 32,
    status: i === 0 ? 'running' : 'completed',
  };
});

export default function JobDetails() {
  const [search, setSearch] = useState('');
  const [filterGpu, setFilterGpu] = useState('all');
  const [selectedJob, setSelectedJob] = useState<MockJobRecord | null>(mockJobsData[0]);

  const filtered = mockJobsData.filter((j) => {
    const matchSearch = j.jobId.toLowerCase().includes(search.toLowerCase()) || j.machine.includes(search);
    const matchGpu = filterGpu === 'all' || j.gpus.toString() === filterGpu;
    return matchSearch && matchGpu;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Job Details & Execution Trace</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Per-job placement decisions, wait times, and resource allocations.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-lg border border-slate-200/80 p-4 shadow-card flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:max-w-xs">
          <input
            type="text"
            placeholder="Search Job ID or node..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500">GPU Request:</span>
          <select
            value={filterGpu}
            onChange={(e) => setFilterGpu(e.target.value)}
            className="text-xs bg-white border border-slate-200 text-slate-700 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Sizes</option>
            <option value="1">1 GPU</option>
            <option value="2">2 GPUs</option>
            <option value="4">4 GPUs</option>
            <option value="8">8 GPUs</option>
          </select>
        </div>
      </div>

      {/* Split Table and Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table Column */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200/80 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Job ID</th>
                  <th className="py-2.5 px-4 font-medium">Queue Wait</th>
                  <th className="py-2.5 px-4 font-medium">Duration</th>
                  <th className="py-2.5 px-4 font-medium">Node</th>
                  <th className="py-2.5 px-4 font-medium">GPUs</th>
                  <th className="py-2.5 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {filtered.map((j) => {
                  const isSelected = selectedJob?.jobId === j.jobId;
                  return (
                    <tr
                      key={j.jobId}
                      onClick={() => setSelectedJob(j)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-indigo-50/50 font-semibold' : 'hover:bg-slate-50/60'
                      }`}
                    >
                      <td className="py-3 px-4 font-sans text-slate-900">{j.jobId}</td>
                      <td className="py-3 px-4 text-slate-600">{j.waitTime}s</td>
                      <td className="py-3 px-4 text-slate-500">{j.duration}s</td>
                      <td className="py-3 px-4 text-slate-600 font-sans">{j.machine}</td>
                      <td className="py-3 px-4 text-indigo-600 font-semibold">{j.gpus} GPU</td>
                      <td className="py-3 px-4 font-sans">
                        <StatusBadge status={j.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400">
            Showing {filtered.length} jobs
          </div>
        </div>

        {/* Selected Job Card */}
        <div className="bg-white rounded-lg border border-slate-200/80 p-5 shadow-card h-fit">
          {selectedJob ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">{selectedJob.jobId}</h3>
                  <span className="text-xs text-slate-400">Execution Details</span>
                </div>
                <StatusBadge status={selectedJob.status} />
              </div>

              <div>
                <span className="text-[10px] font-medium uppercase text-slate-400">Resources</span>
                <div className="grid grid-cols-3 gap-2 mt-1.5 text-center">
                  <div className="p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400">GPUs</span>
                    <p className="text-sm font-semibold text-slate-900">{selectedJob.gpus}</p>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400">CPUs</span>
                    <p className="text-sm font-semibold text-slate-900">{selectedJob.cpu}c</p>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400">RAM</span>
                    <p className="text-sm font-semibold text-slate-900">{selectedJob.mem}G</p>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-medium uppercase text-slate-400">Timestamps</span>
                <div className="space-y-1.5 mt-1.5 text-xs text-slate-600 font-mono">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400 font-sans">Submit:</span>
                    <span>{selectedJob.submitTime}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400 font-sans">Start:</span>
                    <span>{selectedJob.startTime}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400 font-sans">Complete:</span>
                    <span>{selectedJob.completionTime}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Assigned Node:</span>
                  <span className="font-semibold text-slate-800">{selectedJob.machine}</span>
                </div>
                <div className="flex justify-between text-slate-500 mt-1">
                  <span>Placement:</span>
                  <span className="text-indigo-600 font-medium">Best-Fit Residual</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-8">Select a job to view details</p>
          )}
        </div>
      </div>
    </div>
  );
}
