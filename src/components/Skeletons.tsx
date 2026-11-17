import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Reusable primitive Skeleton loader using Tailwind's `animate-pulse` and neutral gray tones.
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className = '', ...props }) => (
  <div
    className={`animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded-md ${className}`}
    {...props}
  />
);

/**
 * Skeleton loader for a single Job Card.
 */
export const JobCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl p-5 sm:p-6 shadow-xs animate-pulse flex flex-col justify-between space-y-6">
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3.5 w-24 rounded-md" />
          <Skeleton className="h-5 w-3/4 rounded-lg" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      {/* Description Snippet */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-4/5 rounded" />
        <Skeleton className="h-3 w-2/3 rounded" />
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        <Skeleton className="h-5 w-16 rounded-md" />
        <Skeleton className="h-5 w-20 rounded-md" />
        <Skeleton className="h-5 w-14 rounded-md" />
      </div>
    </div>

    {/* Footer */}
    <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
      <Skeleton className="h-4 w-28 rounded-md" />
      <Skeleton className="h-8 w-24 rounded-xl" />
    </div>
  </div>
);

/**
 * Skeleton loader for a single Resume Card.
 */
export const ResumeCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl p-5 sm:p-6 shadow-xs animate-pulse flex flex-col justify-between space-y-6">
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
        </div>
        <Skeleton className="w-6 h-6 rounded-lg" />
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 pt-1">
        <Skeleton className="h-6 w-24 rounded-lg" />
        <Skeleton className="h-6 w-24 rounded-lg" />
      </div>

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        <Skeleton className="h-5 w-14 rounded-md" />
        <Skeleton className="h-5 w-18 rounded-md" />
        <Skeleton className="h-5 w-16 rounded-md" />
      </div>
    </div>

    {/* Footer buttons */}
    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-neutral-100 dark:border-neutral-800">
      <Skeleton className="h-8 rounded-xl" />
      <Skeleton className="h-8 rounded-xl" />
      <Skeleton className="h-8 rounded-xl" />
    </div>
  </div>
);

export interface ListSkeletonProps {
  count?: number;
  layout?: 'grid' | 'stack';
}

/**
 * Reusable Job List Skeleton view for rendering multiple Job card placeholders.
 */
export const JobListSkeleton: React.FC<ListSkeletonProps> = ({ count = 3, layout = 'grid' }) => {
  const items = Array.from({ length: count });

  if (layout === 'stack') {
    return (
      <div className="space-y-4">
        {items.map((_, i) => (
          <JobCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((_, i) => (
        <JobCardSkeleton key={i} />
      ))}
    </div>
  );
};

/**
 * Reusable Resume List Skeleton view for rendering multiple Resume card placeholders.
 */
export const ResumeListSkeleton: React.FC<ListSkeletonProps> = ({ count = 3, layout = 'grid' }) => {
  const items = Array.from({ length: count });

  if (layout === 'stack') {
    return (
      <div className="space-y-4">
        {items.map((_, i) => (
          <ResumeCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((_, i) => (
        <ResumeCardSkeleton key={i} />
      ))}
    </div>
  );
};

/**
 * Skeleton loader for Analysis rows or candidate screening results.
 */
export const AnalysisRowSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl p-5 sm:p-6 shadow-xs animate-pulse flex flex-col md:flex-row md:items-center justify-between gap-6">
    <div className="space-y-3 flex-1">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-40 rounded-md" />
          <Skeleton className="h-3 w-28 rounded" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Skeleton className="h-6 w-32 rounded-lg" />
        <Skeleton className="h-6 w-36 rounded-lg" />
        <Skeleton className="h-6 w-28 rounded-lg" />
      </div>

      <Skeleton className="h-12 w-full rounded-xl" />
    </div>

    <div className="flex flex-wrap md:flex-col items-stretch gap-2 shrink-0 w-full sm:w-36">
      <Skeleton className="h-8 rounded-xl" />
      <Skeleton className="h-8 rounded-xl" />
      <Skeleton className="h-8 rounded-xl" />
    </div>
  </div>
);

