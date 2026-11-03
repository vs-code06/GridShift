import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutGrid,
  Activity,
  Cpu,
  TrendingUp,
  GitCompare,
  Layers,
  Database,
  PanelLeftClose,
  PanelLeft,
  Menu,
  X,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Overview', icon: LayoutGrid },
  { to: '/workload', label: 'Workload Explorer', icon: Activity },
  { to: '/simulation', label: 'Cluster Simulation', icon: Cpu },
  { to: '/forecast', label: 'Demand Forecaster', icon: TrendingUp },
  { to: '/models', label: 'Model Comparison', icon: GitCompare },
  { to: '/experiments', label: 'Policy Experiments', icon: Layers },
  { to: '/jobs', label: 'Job Inspector', icon: Database },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop Clean Minimalist Sidebar: Distinct, Premium, Uncluttered */}
      <aside
        className={`hidden md:flex flex-col border-r border-slate-200/90 bg-[#fafbfc] min-h-screen shrink-0 sticky top-0 h-screen select-none transition-all duration-200 z-20 ${
          collapsed ? 'w-16' : 'w-56'
        }`}
      >
        {/* Brand Header */}
        <div
          className={`flex items-center h-14 border-b border-slate-200/70 px-4 ${
            collapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          {!collapsed ? (
            <>
              <NavLink to="/" className="flex items-center gap-2.5 group">
                <span className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:bg-slate-800 transition-colors">
                  ❖
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm tracking-tight text-slate-900">
                    GridShift
                  </span>
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-600">
                    PAI
                  </span>
                </div>
              </NavLink>
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="w-8 h-8 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 flex items-center justify-center transition-colors"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Clean, Uncluttered Navigation Links */}
        <nav className={`flex-1 py-4 space-y-1 overflow-y-auto ${collapsed ? 'px-2' : 'px-3'}`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  collapsed
                    ? `w-10 h-10 mx-auto flex items-center justify-center rounded-lg transition-all ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
                      }`
                    : `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-all ${
                        isActive
                          ? 'bg-slate-900 text-white font-medium shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-normal'
                      }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-opacity ${
                        isActive ? 'text-white opacity-100' : 'text-slate-500 opacity-80'
                      }`}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Scheduling Delta Footer Card (Faithful to Stitch Reclaim Delta Reference) */}
        <div className="p-3 border-t border-slate-200/70 mt-auto">
          {!collapsed ? (
            <div className="p-3 rounded-lg bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                <span>Scheduling Delta</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-sm font-bold text-emerald-600 font-mono mt-0.5">
                +63.0% <span className="text-[10px] font-normal text-slate-500 font-sans">vs FCFS</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-1 flex items-center justify-between">
                <span>10 Nodes · 80 GPUs</span>
                <span className="text-emerald-600 font-medium">Active</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-1">
              <span
                className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100"
                title="Scheduling Delta: +63.0% vs FCFS (10 Nodes Active)"
              />
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 h-14 bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <span className="font-bold text-base text-slate-900">❖</span>
          <span className="font-semibold text-sm tracking-tight text-slate-900">GridShift</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 border-r border-slate-200">
            <div className="h-14 flex items-center justify-between px-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-slate-900">❖</span>
                <span className="font-semibold text-sm text-slate-900">GridShift</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-md text-xs ${
                        isActive
                          ? 'bg-black text-white font-medium'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
