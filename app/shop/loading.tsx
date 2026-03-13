/**
 * Skeleton orchestration mirroring the ProductCard structure to maintain 
 * layout stability (CLS) and meet WCAG 2.1 AA accessibility triggers 
 * during Edge-to-Client hydration.
 */
export default function Loading() {
  return (
    <div className="animate-pulse" role="status" aria-label="Loading products">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex flex-col bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden h-[460px] border border-slate-200 dark:border-slate-800">
            <div className="h-64 w-full bg-slate-200 dark:bg-slate-800" />
            <div className="p-4 flex flex-col flex-1 gap-4">
              <div className="flex justify-between gap-4 mt-2">
                <div className="h-6 w-2/3 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded shrink-0" />
              </div>
              <div className="space-y-2 flex-1 mt-2">
                <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-4 w-4/5 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded mt-2" />
              <div className="mt-auto h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Loading products...</span>
    </div>
  );
}
