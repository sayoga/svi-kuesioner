export function UsersTableSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header/Title Card Skeleton */}
      <div className="h-44 bg-slate-200/80 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 p-6 sm:p-8 flex flex-col justify-between">
        <div>
          <div className="h-5 bg-slate-300 dark:bg-white/10 rounded-full w-36 mb-3" />
          <div className="h-7 bg-slate-300 dark:bg-white/10 rounded-xl w-64 mb-2" />
          <div className="h-4 bg-slate-300/60 dark:bg-white/5 rounded-lg w-96" />
        </div>
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-300/40 dark:border-white/5">
          <div className="h-10 bg-slate-300/50 dark:bg-white/5 rounded-xl" />
          <div className="h-10 bg-slate-300/50 dark:bg-white/5 rounded-xl" />
          <div className="h-10 bg-slate-300/50 dark:bg-white/5 rounded-xl" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="h-[50vh] bg-slate-200/80 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 p-6 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b border-slate-300 dark:border-white/10">
            <div className="h-4 bg-slate-300 dark:bg-white/10 rounded w-1/4" />
            <div className="h-4 bg-slate-300 dark:bg-white/10 rounded w-1/4" />
            <div className="h-4 bg-slate-300 dark:bg-white/10 rounded w-1/6" />
            <div className="h-4 bg-slate-300 dark:bg-white/10 rounded w-1/6" />
            <div className="h-4 bg-slate-300 dark:bg-white/10 rounded w-16" />
          </div>

          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 py-3 border-b border-slate-200 dark:border-white/5"
            >
              <div className="h-8 w-8 rounded-2xl bg-slate-300/80 dark:bg-white/10 shrink-0" />
              <div className="h-4 bg-slate-300/60 dark:bg-white/5 rounded w-1/4" />
              <div className="h-4 bg-slate-300/60 dark:bg-white/5 rounded w-1/4" />
              <div className="h-4 bg-slate-300/60 dark:bg-white/5 rounded w-1/6" />
              <div className="h-4 bg-slate-300/60 dark:bg-white/5 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
      <UsersTableSkeleton />
    </main>
  );
}
