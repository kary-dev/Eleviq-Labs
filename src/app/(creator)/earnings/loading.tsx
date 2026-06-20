export default function Loading() {
  return (
    <>
      <div className="mb-7">
        <div className="mb-2 h-8 w-32 animate-pulse rounded-lg bg-surface-2" />
        <div className="h-4 w-72 animate-pulse rounded bg-surface-2" />
      </div>
      <div className="mb-9 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card p-5">
            <div className="mb-3 h-3 w-20 animate-pulse rounded bg-surface-2" />
            <div className="mb-2 h-8 w-24 animate-pulse rounded bg-surface-2" />
            <div className="h-3 w-32 animate-pulse rounded bg-surface-2" />
          </div>
        ))}
      </div>
      <section className="mb-9">
        <div className="card p-5">
          <div className="mb-1 flex items-center justify-between">
            <div className="h-6 w-40 animate-pulse rounded bg-surface-2" />
            <div className="h-6 w-20 animate-pulse rounded-full bg-surface-2" />
          </div>
          <div className="mb-4 h-4 w-72 animate-pulse rounded bg-surface-2" />
          <div className="h-2.5 w-full animate-pulse rounded-full bg-surface-2" />
          <div className="mt-2 h-3 w-40 animate-pulse rounded bg-surface-2" />
        </div>
      </section>
      <section className="mb-9">
        <div className="mb-4 h-6 w-36 animate-pulse rounded bg-surface-2" />
        <div className="card divide-y divide-border">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5">
              <div className="h-9 w-9 animate-pulse rounded-xl bg-surface-2" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 animate-pulse rounded bg-surface-2" />
                <div className="h-3 w-24 animate-pulse rounded bg-surface-2" />
              </div>
              <div className="h-5 w-16 animate-pulse rounded bg-surface-2" />
            </div>
          ))}
        </div>
      </section>
      <section>
        <div className="mb-4 h-6 w-36 animate-pulse rounded bg-surface-2" />
        <div className="card divide-y divide-border">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="h-12 w-12 animate-pulse rounded-lg bg-surface-2" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-56 animate-pulse rounded bg-surface-2" />
                <div className="h-3 w-36 animate-pulse rounded bg-surface-2" />
              </div>
              <div className="h-5 w-16 animate-pulse rounded bg-surface-2" />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
