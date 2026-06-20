export default function DashboardLoading() {
  return (
    <>
      {/* Welcome */}
      <div className="mb-7">
        <div className="mb-2 h-8 w-64 animate-pulse rounded-lg bg-surface-2" />
        <div className="h-4 w-80 animate-pulse rounded bg-surface-2" />
      </div>

      {/* Discord banner */}
      <div className="mb-7 h-20 animate-pulse rounded-2xl bg-surface-2" />

      {/* Stats */}
      <div className="mb-9 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card p-5">
            <div className="mb-3 h-3 w-16 animate-pulse rounded bg-surface-2" />
            <div className="mb-2 h-8 w-24 animate-pulse rounded bg-surface-2" />
            <div className="h-3 w-36 animate-pulse rounded bg-surface-2" />
          </div>
        ))}
      </div>

      {/* Campaigns */}
      <section className="mb-9">
        <div className="mb-4">
          <div className="mb-2 h-6 w-40 animate-pulse rounded bg-surface-2" />
          <div className="h-3 w-64 animate-pulse rounded bg-surface-2" />
        </div>
        <div className="card divide-y divide-border">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="h-10 w-10 animate-pulse rounded-xl bg-surface-2" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 animate-pulse rounded bg-surface-2" />
                <div className="h-3 w-32 animate-pulse rounded bg-surface-2" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent clips */}
      <section>
        <div className="mb-4">
          <div className="mb-2 h-6 w-32 animate-pulse rounded bg-surface-2" />
          <div className="h-3 w-56 animate-pulse rounded bg-surface-2" />
        </div>
        <div className="card divide-y divide-border">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="h-12 w-12 animate-pulse rounded-lg bg-surface-2" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-56 animate-pulse rounded bg-surface-2" />
                <div className="h-3 w-36 animate-pulse rounded bg-surface-2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
