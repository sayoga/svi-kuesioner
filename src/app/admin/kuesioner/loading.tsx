export function FormBuilderSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Form Settings / Title Header Skeleton */}
      <div className="h-32 bg-white dark:bg-[#121212] rounded-3xl border border-slate-200/80 dark:border-white/5 p-6 flex flex-col justify-between shadow-xs">
        <div>
          <div className="h-6 bg-slate-200 dark:bg-white/10 rounded-xl w-1/3 mb-3" />
          <div className="h-4 bg-slate-100 dark:bg-white/5 rounded-lg w-2/3" />
        </div>
        <div className="flex items-center gap-3 pt-2">
          <div className="h-4 bg-slate-100 dark:bg-white/5 rounded w-24" />
          <div className="h-6 bg-slate-200 dark:bg-white/10 rounded-full w-12" />
        </div>
      </div>

      {/* Repeating Question Cards Skeletons (3 items with gap-6) */}
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-28 bg-white dark:bg-[#121212] rounded-3xl border border-slate-200/80 dark:border-white/5 p-6 flex flex-col justify-between shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 bg-slate-200 dark:bg-white/10 rounded-full" />
                <div className="h-5 bg-slate-200 dark:bg-white/10 rounded-xl w-48" />
              </div>
              <div className="h-6 bg-slate-200 dark:bg-white/10 rounded-xl w-24" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 bg-slate-100 dark:bg-white/5 rounded w-32" />
              <div className="h-4 bg-slate-100 dark:bg-white/5 rounded w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <main className="p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto">
      <FormBuilderSkeleton />
    </main>
  );
}
