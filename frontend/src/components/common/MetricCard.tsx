import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badge?: string;
  badgeColor?: 'emerald' | 'amber' | 'slate';
}

const badgeStyles = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function MetricCard({
  title,
  value,
  subtitle,
  badge,
  badgeColor = 'slate',
}: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200/80 p-5 shadow-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-500">{title}</span>
        {badge && (
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${badgeStyles[badgeColor]}`}>
            {badge}
          </span>
        )}
      </div>
      <div className="text-2xl font-semibold text-slate-900 tracking-tight">{value}</div>
      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
}
