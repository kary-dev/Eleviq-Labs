export default function Loading() {
  return (
    <>
      <div className="mb-7">
        <div className="mb-2 h-8 w-40 animate-pulse rounded-lg bg-surface-2" />
        <div className="h-4 w-72 animate-pulse rounded bg-surface-2" />
      </div>
      <div className="card p-6 space-y-5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i}>
            <div className="mb-1.5 h-3 w-28 animate-pulse rounded bg-surface-2" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-surface-2" />
          </div>
        ))}
        <div className="h-10 w-full animate-pulse rounded-lg bg-surface-2" />
      </div>
    </>
  );
}
