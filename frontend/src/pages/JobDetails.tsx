import React, { useState } from 'react';
import { Search, Copy, Check, Database, Filter, Server, ShieldCheck } from 'lucide-react';
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

const mockJobsData: MockJobRecord[] = Array.from({ length: 48 }, (_, i) => {
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
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const pageSize = 10;

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const handleGpuChange = (val: string) => {
    setFilterGpu(val);
    setCurrentPage(1);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const filtered = mockJobsData.filter((j) => {
    const matchSearch = j.jobId.toLowerCase().includes(search.toLowerCase()) || j.machine.includes(search);
    const matchGpu = filterGpu === 'all' || j.gpus.toString() === filterGpu;
    return matchSearch && matchGpu;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedJobs = filtered.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-7xl">
      {/* 1. Hero Job Inspector Header Card: Raised Surface, Depth & Cohesion */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[11px] font-mono tracking-wider uppercase mb-1.5">
            <span className="text-slate-400 font-semibold">TRACE TELEMETRY</span>
            <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              JOB INSPECTOR READY
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-sans">
            Job Inspector
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Granular per-job inspection of scheduling outcomes, accelerator placements, wait queue delays, and runtime lifecycles.
          </p>
        </div>

        {/* Telemetry Match Badges */}
        <div className="flex items-center gap-3 shrink-0 self-start md:self-center font-mono text-xs">
          <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Filtered Jobs</div>
            <div className="font-semibold text-slate-900 mt-0.5">{filtered.length} Jobs Matched</div>
          </div>
          <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Cluster Source</div>
            <div className="font-semibold text-slate-900 mt-0.5">Alibaba PAI-100k</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search task ID or node..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-8 py-2 text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
          />
          {search && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-start gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">GPU Size:</span>
          <select
            value={filterGpu}
            onChange={(e) => handleGpuChange(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 text-slate-800 rounded-lg px-3 py-1.5 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="all">All Sizes</option>
            <option value="1">1 GPU</option>
            <option value="2">2 GPUs</option>
            <option value="4">4 GPUs</option>
            <option value="8">8 GPUs</option>
          </select>
        </div>
      </div>

      {/* Split Table and Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table Column with Pagination */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Task ID</th>
                  <th className="py-3 px-4">Wait Time</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Machine</th>
                  <th className="py-3 px-4">GPUs</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {paginatedJobs.length > 0 ? (
                  paginatedJobs.map((j) => {
                    const isSelected = selectedJob?.jobId === j.jobId;
                    return (
                      <tr
                        key={j.jobId}
                        onClick={() => setSelectedJob(j)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-slate-100/80 font-semibold' : 'hover:bg-slate-50/50'
                        }`}
                      >
                        <td className="py-3 px-4 font-sans text-slate-900 font-medium">
                          <div className="flex items-center gap-2">
                            <span>{j.jobId}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(j.jobId);
                              }}
                              className="text-slate-400 hover:text-slate-700 transition-colors"
                              title="Copy Job ID"
                            >
                              {copiedId === j.jobId ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-700">{j.waitTime}s</td>
                        <td className="py-3 px-4 text-slate-500">{j.duration}s</td>
                        <td className="py-3 px-4 text-slate-700 font-sans">{j.machine}</td>
                        <td className="py-3 px-4">
                          <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] font-sans font-semibold border border-slate-200">
                            {j.gpus} GPU
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-sans">
                          <StatusBadge status={j.status} />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-sans text-xs">
                      No jobs matching criteria "{search}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-3.5 bg-slate-50/80 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Showing <span className="font-semibold text-slate-900">{filtered.length > 0 ? startIndex + 1 : 0}</span> to{' '}
              <span className="font-semibold text-slate-900">{Math.min(startIndex + pageSize, filtered.length)}</span> of{' '}
              <span className="font-semibold text-slate-900">{filtered.length}</span> jobs
            </div>

            <div className="flex items-center gap-1 font-medium">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 transition-colors text-xs"
              >
                Prev
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded text-xs transition-colors ${
                      currentPage === page
                        ? 'bg-slate-900 text-white font-semibold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200/70'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 transition-colors text-xs"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Selected Job Inspector Card */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs h-fit space-y-5">
          {selectedJob ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm font-mono">{selectedJob.jobId}</h3>
                  <button
                    onClick={() => handleCopy(selectedJob.jobId)}
                    className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
                    title="Copy Job ID"
                  >
                    {copiedId === selectedJob.jobId ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <StatusBadge status={selectedJob.status} />
              </div>

              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Resource Allocation
                </span>
                <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">GPUs</span>
                    <p className="text-base font-bold text-slate-900 mt-0.5">{selectedJob.gpus}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">CPUs</span>
                    <p className="text-base font-bold text-slate-900 mt-0.5">{selectedJob.cpu}c</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">RAM</span>
                    <p className="text-base font-bold text-slate-900 mt-0.5">{selectedJob.mem}G</p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Lifecycle Timestamps
                </span>
                <div className="space-y-2 mt-2 text-xs font-mono">
                  <div className="flex justify-between py-1 bg-slate-50 px-2.5 rounded border border-slate-100">
                    <span className="text-slate-400 font-sans">Submit Time:</span>
                    <span className="text-slate-800">{selectedJob.submitTime}</span>
                  </div>
                  <div className="flex justify-between py-1 bg-slate-50 px-2.5 rounded border border-slate-100">
                    <span className="text-slate-400 font-sans">Start Time:</span>
                    <span className="text-slate-800">{selectedJob.startTime}</span>
                  </div>
                  <div className="flex justify-between py-1 bg-slate-50 px-2.5 rounded border border-slate-100">
                    <span className="text-slate-400 font-sans">Completion:</span>
                    <span className="text-slate-800">{selectedJob.completionTime}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-xs space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Server className="w-3 h-3" /> Machine:
                  </span>
                  <span className="font-semibold text-slate-900 font-mono">{selectedJob.machine}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-400">Placement Policy:</span>
                  <span className="font-medium text-slate-900">Best-Fit Residual</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> Constraint Status:
                  </span>
                  <span className="font-semibold text-emerald-700">0 Violations</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-8">Select a job from the table to view details.</p>
          )}
        </div>
      </div>
    </div>
  );
}
