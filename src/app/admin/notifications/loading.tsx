export default function Loading() {
  return (
    <>
      <div className="mb-7">
        <div className="mb-2 h-8 w-40 animate-pulse rounded-lg bg-surface-2" />
        <div className="h-4 w-56 animate-pulse rounded bg-surface-2" />
      </div>
      <div className="card divide-y divide-border">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3.5">
            <div className="h-9 w-9 animate-pulse rounded-xl bg-surface-2 shrink-0" />
            <div className="flex-1 space-y-2 pt-0.5">
              <div className="h-4 w-48 animate-pulse rounded bg-surface-2" />
              <div className="h-3 w-64 animate-pulse rounded bg-surface-2" />
              <div className="h-3 w-20 animate-pulse rounded bg-surface-2" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
