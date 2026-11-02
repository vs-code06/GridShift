import React from 'react';

const statusConfig: Record<string, { label: string; dot: string; text: string }> = {
  completed: {
    label: 'Completed',
    dot: 'bg-emerald-500',
    text: 'text-zinc-700',
  },
  running: {
    label: 'Running',
    dot: 'bg-blue-600',
    text: 'text-blue-700 font-medium',
  },
  pending: {
    label: 'Pending',
    dot: 'bg-zinc-400',
    text: 'text-zinc-600',
  },
  failed: {
    label: 'Failed',
    dot: 'bg-rose-500',
    text: 'text-rose-700',
  },
};

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = statusConfig[status.toLowerCase()] || {
    label: status,
    dot: 'bg-zinc-400',
    text: 'text-zinc-600',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
