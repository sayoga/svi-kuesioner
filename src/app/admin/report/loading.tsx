export function ReportTableSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header/Title Card Skeleton */}
      <div className="h-24 bg-white dark:bg-[#121212] rounded-3xl border border-slate-200/80 dark:border-white/5 p-6 flex flex-col justify-center shadow-xs">
        <div className="h-6 bg-slate-200 dark:bg-white/10 rounded-xl w-1/3 mb-2.5" />
        <div className="h-4 bg-slate-100 dark:bg-white/5 rounded-lg w-1/2" />
      </div>

      {/* Large Master Report Table Block Skeleton */}
      <div className="h-[60vh] bg-white dark:bg-[#121212] rounded-3xl border border-slate-200/80 dark:border-white/5 p-6 flex flex-col justify-between shadow-xs">
        <div className="space-y-4">
          {/* Table Header Row */}
          <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
            <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-12" />
            <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-1/5" />
            <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-1/5" />
            <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-1/5" />
            <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-1/5" />
          </div>

          {/* Table Body Simulated Rows */}
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-50 dark:border-white/5">
              <div className="h-4 bg-slate-100 dark:bg-white/5 rounded w-12" />
              <div className="h-4 bg-slate-100 dark:bg-white/5 rounded w-1/5" />
              <div className="h-4 bg-slate-100 dark:bg-white/5 rounded w-1/5" />
              <div className="h-4 bg-slate-100 dark:bg-white/5 rounded w-1/5" />
              <div className="h-4 bg-slate-100 dark:bg-white/5 rounded w-1/5" />
            </div>
          ))}
        </div>

        {/* Table Footer / Summary row */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
          <div className="h-4 bg-slate-100 dark:bg-white/5 rounded w-36" />
          <div className="h-8 bg-slate-200 dark:bg-white/10 rounded-2xl w-32" />
        </div>
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
      <ReportTableSkeleton />
    </main>
  );
}
