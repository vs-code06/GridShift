import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Overview', icon: '📊' },
  { to: '/workload', label: 'Workload Explorer', icon: '📁' },
  { to: '/simulation', label: 'Simulation', icon: '⚙️' },
  { to: '/forecast', label: 'Forecast', icon: '📈' },
  { to: '/experiments', label: 'Experiments', icon: '🧪' },
  { to: '/jobs', label: 'Job Details', icon: '📋' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-slate-100 min-h-screen flex flex-col shadow-xl">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-500 flex items-center justify-center text-xl shadow-lg shadow-sky-500/20">
            ⚡
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">GridShift</h1>
            <p className="text-xs text-sky-400 font-medium">Adaptive GPU Scheduler</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 m-3 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs text-slate-400">
        <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
          <span>Simulation Engine</span>
          <span className="text-emerald-400 text-[10px] bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800">
            ACTIVE
          </span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-400">
          Trace-driven PPO + XGBoost discrete-event scheduler.
        </p>
      </div>

      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between items-center">
        <span>v0.1.0 Research MVP</span>
        <span className="text-slate-600 font-mono">MIT</span>
      </div>
    </aside>
  );
}

