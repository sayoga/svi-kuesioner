export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Form Overview Skeleton */}
      <div className="h-28 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 flex flex-col justify-center">
        <div className="h-6 bg-white/10 rounded-lg w-1/3 mb-2.5" />
        <div className="h-4 bg-white/5 rounded-lg w-1/2" />
      </div>

      {/* 4 Metric Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-32 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 bg-white/10 rounded w-20" />
              <div className="h-8 w-8 bg-white/10 rounded-xl" />
            </div>
            <div className="h-8 bg-white/15 rounded-lg w-16" />
          </div>
        ))}
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 flex flex-col justify-between">
          <div className="h-5 bg-white/10 rounded w-40" />
          <div className="h-56 bg-white/5 rounded-lg" />
        </div>
        <div className="h-80 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 flex flex-col justify-between">
          <div className="h-5 bg-white/10 rounded w-40" />
          <div className="h-56 bg-white/5 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
      <DashboardSkeleton />
    </main>
  );
}
