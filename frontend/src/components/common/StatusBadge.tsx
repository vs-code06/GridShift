import React from 'react';

const statusConfig: Record<string, { label: string; class: string; dot: string }> = {
  pending: {
    label: 'Pending',
    class: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-400',
  },
  running: {
    label: 'Running',
    class: 'bg-sky-50 text-sky-700 border-sky-200 animate-pulse',
    dot: 'bg-sky-500',
  },
  completed: {
    label: 'Completed',
    class: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  failed: {
    label: 'Failed',
    class: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
  },
};

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = statusConfig[status.toLowerCase()] || {
    label: status,
    class: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.class}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
