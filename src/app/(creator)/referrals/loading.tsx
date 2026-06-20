export default function Loading() {
  return (
    <>
      <div className="mb-7">
        <div className="mb-2 h-8 w-40 animate-pulse rounded-lg bg-surface-2" />
        <div className="h-4 w-96 animate-pulse rounded bg-surface-2" />
      </div>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card p-5">
            <div className="mb-3 h-3 w-28 animate-pulse rounded bg-surface-2" />
            <div className="mb-2 h-8 w-16 animate-pulse rounded bg-surface-2" />
            <div className="h-3 w-36 animate-pulse rounded bg-surface-2" />
          </div>
        ))}
      </div>
      <div className="card p-6 space-y-4">
        <div className="h-5 w-36 animate-pulse rounded bg-surface-2" />
        <div className="h-10 w-full animate-pulse rounded-lg bg-surface-2" />
        <div className="h-4 w-64 animate-pulse rounded bg-surface-2" />
      </div>
    </>
  );
}
