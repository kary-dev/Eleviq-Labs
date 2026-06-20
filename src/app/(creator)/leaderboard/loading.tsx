export default function Loading() {
  return (
    <>
      <div className="mb-7">
        <div className="mb-2 h-8 w-40 animate-pulse rounded-lg bg-surface-2" />
        <div className="h-4 w-64 animate-pulse rounded bg-surface-2" />
      </div>
      <div className="card divide-y divide-border">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            <div className="w-6 shrink-0">
              <div className="h-4 w-5 animate-pulse rounded bg-surface-2" />
            </div>
            <div className="h-9 w-9 animate-pulse rounded-full bg-surface-2 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-36 animate-pulse rounded bg-surface-2" />
              <div className="h-3 w-20 animate-pulse rounded bg-surface-2" />
            </div>
            <div className="h-4 w-24 animate-pulse rounded bg-surface-2" />
          </div>
        ))}
      </div>
    </>
  );
}
