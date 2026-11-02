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
  const pageSize = 10;

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const handleGpuChange = (val: string) => {
    setFilterGpu(val);
    setCurrentPage(1);
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Job Execution Details</h1>
        <p className="text-sm text-slate-500 mt-1">
          Detailed inspection of per-job scheduling outcomes, node placements, and lifecycle runtimes.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="w-full sm:max-w-xs">
          <input
            type="text"
            placeholder="Search by Job ID or node..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-medium text-slate-500">GPU Request:</span>
          <select
            value={filterGpu}
            onChange={(e) => handleGpuChange(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 text-slate-700 rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
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
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Job ID</th>
                  <th className="py-3 px-4">Wait Time</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Machine</th>
                  <th className="py-3 px-4">GPUs</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {paginatedJobs.length > 0 ? (
                  paginatedJobs.map((j) => {
                    const isSelected = selectedJob?.jobId === j.jobId;
                    return (
                      <tr
                        key={j.jobId}
                        onClick={() => setSelectedJob(j)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-slate-100 font-semibold' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3 px-4 font-sans text-slate-900 font-medium">{j.jobId}</td>
                        <td className="py-3 px-4 text-slate-700">{j.waitTime}s</td>
                        <td className="py-3 px-4 text-slate-500">{j.duration}s</td>
                        <td className="py-3 px-4 text-slate-700 font-sans">{j.machine}</td>
                        <td className="py-3 px-4">
                          <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] font-sans font-semibold border border-slate-200">
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
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-sans text-xs">
                      No jobs matching criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div>
              Showing <span className="font-semibold text-slate-900">{filtered.length > 0 ? startIndex + 1 : 0}</span> to{' '}
              <span className="font-semibold text-slate-900">{Math.min(startIndex + pageSize, filtered.length)}</span> of{' '}
              <span className="font-semibold text-slate-900">{filtered.length}</span> jobs
            </div>

            <div className="flex items-center gap-1.5 font-medium">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 transition-colors"
              >
                Previous
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
                className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Selected Job Inspector Card */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs h-fit space-y-5">
          {selectedJob ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{selectedJob.jobId}</h3>
                  <span className="text-xs text-slate-400">Canonical Record Detail</span>
                </div>
                <StatusBadge status={selectedJob.status} />
              </div>

              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Resource Allocation
                </span>
                <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">GPUs</span>
                    <p className="text-base font-bold text-slate-900 mt-0.5">{selectedJob.gpus}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">CPUs</span>
                    <p className="text-base font-bold text-slate-900 mt-0.5">{selectedJob.cpu}c</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
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
                  <span className="text-slate-400">Assigned Machine:</span>
                  <span className="font-semibold text-slate-900 font-mono">{selectedJob.machine}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-400">Placement Policy:</span>
                  <span className="font-medium text-slate-900">Best-Fit Residual</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-400">Capacity Violation:</span>
                  <span className="font-medium text-emerald-700">None (Passed)</span>
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
