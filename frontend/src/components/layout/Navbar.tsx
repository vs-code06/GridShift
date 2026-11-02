import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Overview' },
  { to: '/workload', label: 'Workload' },
  { to: '/simulation', label: 'Simulation' },
  { to: '/forecast', label: 'Forecast' },
  { to: '/experiments', label: 'Experiments' },
  { to: '/jobs', label: 'Job Details' },
];

export default function Navbar() {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Nav */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                G
              </div>
              <div>
                <span className="font-bold text-sm tracking-tight text-slate-900 block leading-tight">GridShift</span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide block leading-tight">GPU Cluster Scheduler</span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex items-center space-x-1.5">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      isActive
                        ? 'text-white bg-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Right Status */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-slate-700">Cluster Online</span>
              <span className="text-slate-300">|</span>
              <span className="font-mono text-slate-500 text-[11px]">80 GPUs</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
