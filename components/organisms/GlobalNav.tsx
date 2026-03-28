'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTour } from '../providers/TourProvider';

export function GlobalNav() {
  const pathname = usePathname();
  const { isTourCompleted } = useTour();

  const showGlowingBadge = pathname === '/shop' && !isTourCompleted;

  return (
    <nav aria-label="Primary navigation" className="flex items-center gap-4">
      <Link
        href="/admin/dashboard"
        className="relative inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
      >
        <span className="material-symbols-outlined notranslate text-sm" aria-hidden="true" translate="no">
          query_stats
        </span>
        Dashboard
        {showGlowingBadge && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
        )}
      </Link>
      <Link
        href="/benchmarks"
        className="relative inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-500/30"
      >
        <span className="material-symbols-outlined notranslate text-sm text-cyan-500" aria-hidden="true" translate="no">
          bolt
        </span>
        Runtime Duel
        <span className="absolute -top-1 -right-1 flex h-3 w-3 motion-reduce:hidden" aria-hidden="true">
          <span className="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
        </span>
      </Link>
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-bold text-white transition-all hover:brightness-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
      >
        <span className="material-symbols-outlined notranslate text-sm" aria-hidden="true" translate="no">
          shopping_bag
        </span>
        Enter Shop
      </Link>
    </nav>
  );
}
