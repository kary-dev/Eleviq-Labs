export default function DemographicsLoading() {
  return (
    <>
      {/* Page header */}
      <div className="mb-7">
        <div className="mb-2 h-8 w-64 animate-pulse rounded-lg bg-surface-2" />
        <div className="h-4 w-80 animate-pulse rounded bg-surface-2" />
      </div>

      {/* How it works card */}
      <section className="mb-8">
        <div className="mb-3 h-5 w-28 animate-pulse rounded bg-surface-2" />
        <div className="card p-5 space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="h-6 w-6 animate-pulse rounded-full bg-surface-2 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-40 animate-pulse rounded bg-surface-2" />
                <div className="h-3 w-full animate-pulse rounded bg-surface-2" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Verification section */}
      <section>
        <div className="mb-3 h-5 w-48 animate-pulse rounded bg-surface-2" />
        <div className="card divide-y divide-border">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="h-10 w-10 animate-pulse rounded-full bg-surface-2" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-44 animate-pulse rounded bg-surface-2" />
                <div className="h-3 w-28 animate-pulse rounded bg-surface-2" />
              </div>
              <div className="h-8 w-20 animate-pulse rounded-xl bg-surface-2" />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
