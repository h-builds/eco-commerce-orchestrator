import React from 'react';

export function ProductSkeleton() {
  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-[2rem] bg-white/40 dark:bg-slate-900/40 p-1 shadow-lg ring-1 ring-slate-200/50 dark:ring-slate-800/50">
      {/* Aspect Ratio Container for Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.75rem] bg-slate-200 dark:bg-slate-800 animate-pulse">
        {/* Top Badges Skeleton */}
        <div className="absolute left-4 top-4 z-10 flex flex-col gap-2">
          <div className="h-6 w-16 rounded-full bg-slate-300 dark:bg-slate-700 animate-pulse" />
        </div>
        <div className="absolute right-4 top-4 z-10">
          <div className="h-6 w-12 rounded-full bg-slate-300 dark:bg-slate-700 animate-pulse" />
        </div>
      </div>

      {/* Content Area Skeleton */}
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2 flex-grow">
            <div className="h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>
          <div className="h-4 w-12 rounded bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0" />
        </div>

        {/* Dynamic Pricing Metrics Skeleton */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
          <div className="flex flex-col gap-1 w-full">
            <div className="h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="flex justify-between items-center mt-1">
              <div className="h-8 w-24 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <div className="h-8 w-24 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
