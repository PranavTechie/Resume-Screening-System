import React from 'react';

interface StatusBadgeProps {
  status?: 'Ready' | 'Processing' | 'Error';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status = 'Ready', className = '' }) => {
  if (status === 'Processing') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 shrink-0 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
        <span>Processing</span>
      </span>
    );
  }

  if (status === 'Error') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 shrink-0 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
        <span>Error</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shrink-0 ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
      <span>Ready</span>
    </span>
  );
};
