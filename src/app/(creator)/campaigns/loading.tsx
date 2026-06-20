export default function Loading() {
  return (
    <>
      <div className="mb-7">
        <div className="mb-2 h-8 w-44 animate-pulse rounded-lg bg-surface-2" />
        <div className="h-4 w-80 animate-pulse rounded bg-surface-2" />
      </div>
      <div className="space-y-9">
        <section>
          <div className="mb-4 h-6 w-16 animate-pulse rounded bg-surface-2" />
          <div className="grid gap-5 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="card p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-10 w-10 animate-pulse rounded-xl bg-surface-2" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-36 animate-pulse rounded bg-surface-2" />
                    <div className="h-3 w-24 animate-pulse rounded bg-surface-2" />
                  </div>
                </div>
                <div className="mb-2 h-3 w-full animate-pulse rounded bg-surface-2" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-surface-2" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
