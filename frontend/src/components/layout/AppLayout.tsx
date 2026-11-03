import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import Sidebar from './Sidebar';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 flex flex-col md:flex-row font-sans">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Clean, quiet top header */}
        <header className="h-14 border-b border-slate-200/80 bg-white px-6 sm:px-8 flex items-center justify-between sticky top-0 z-10 shrink-0">
          {/* Left: Cluster Telemetry Status */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-semibold text-slate-900">10 Nodes Online</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500">80 GPUs Active</span>
          </div>

          {/* Right: Simulation Action */}
          <Link
            to="/simulation"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Simulation</span>
          </Link>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full px-6 sm:px-8 py-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
