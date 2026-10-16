export function TableLayoutSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header/Title Card Skeleton */}
      <div className="h-28 bg-slate-200/80 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 p-6 sm:p-8 flex flex-col justify-center">
        <div className="h-6 bg-slate-300 dark:bg-white/10 rounded-xl w-1/3 mb-2.5" />
        <div className="h-4 bg-slate-300/60 dark:bg-white/5 rounded-lg w-1/2" />
      </div>

      {/* Large Table Block Skeleton */}
      <div className="h-[60vh] bg-slate-200/80 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 p-6 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Table Header Row */}
          <div className="flex items-center gap-4 pb-4 border-b border-slate-300 dark:border-white/10">
            <div className="h-4 bg-slate-300 dark:bg-white/10 rounded w-12" />
            <div className="h-4 bg-slate-300 dark:bg-white/10 rounded w-1/4" />
            <div className="h-4 bg-slate-300 dark:bg-white/10 rounded w-1/4" />
            <div className="h-4 bg-slate-300 dark:bg-white/10 rounded w-1/4" />
            <div className="h-4 bg-slate-300 dark:bg-white/10 rounded w-1/6" />
          </div>

          {/* Table Body Simulated Rows */}
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-200 dark:border-white/5">
              <div className="h-4 bg-slate-300/60 dark:bg-white/5 rounded w-12" />
              <div className="h-4 bg-slate-300/60 dark:bg-white/5 rounded w-1/4" />
              <div className="h-4 bg-slate-300/60 dark:bg-white/5 rounded w-1/4" />
              <div className="h-4 bg-slate-300/60 dark:bg-white/5 rounded w-1/4" />
              <div className="h-4 bg-slate-300/60 dark:bg-white/5 rounded w-1/6" />
            </div>
          ))}
        </div>

        {/* Table Footer / Pagination */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-300 dark:border-white/10">
          <div className="h-4 bg-slate-300/60 dark:bg-white/5 rounded w-32" />
          <div className="h-8 bg-slate-300 dark:bg-white/10 rounded-xl w-28" />
        </div>
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
      <TableLayoutSkeleton />
    </main>
  );
}
