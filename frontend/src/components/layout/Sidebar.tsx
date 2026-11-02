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

export default function Sidebar() {
  return (
    <aside className="w-56 bg-white border-r border-zinc-200/80 min-h-screen flex flex-col p-4">
      <div className="flex items-center gap-2 px-2 py-3 mb-4">
        <div className="w-5 h-5 rounded bg-zinc-900 flex items-center justify-center text-white text-[11px] font-bold">
          G
        </div>
        <span className="font-semibold text-sm tracking-tight text-zinc-900">GridShift</span>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `block px-3 py-2 text-xs rounded-md transition-colors ${
                isActive
                  ? 'text-zinc-900 bg-zinc-100 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
