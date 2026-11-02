import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  badge?: string;
  badgeColor?: 'emerald' | 'amber' | 'sky' | 'slate';
}

export default function MetricCard({
  title,
  value,
  subtitle,
  icon,
  badge,
  badgeColor = 'sky',
}: MetricCardProps) {
  const badgeClasses = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    sky: 'bg-sky-50 text-sky-700 border-sky-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  }[badgeColor];

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 hover:border-slate-300 transition-all">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
        {icon && <span className="text-xl opacity-80">{icon}</span>}
        {badge && (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${badgeClasses}`}>
            {badge}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
}

