export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-2 h-8 w-52 rounded-lg bg-surface-2" />
      <div className="mb-8 h-4 w-80 rounded bg-surface-2" />
      <div className="mb-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5">
            <div className="mb-2 h-3 w-24 rounded bg-surface-2" />
            <div className="h-8 w-20 rounded-lg bg-surface-2" />
          </div>
        ))}
      </div>
      <div className="mb-4 h-6 w-40 rounded bg-surface-2" />
      <div className="grid gap-5 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5">
            <div className="mb-3 h-5 w-3/4 rounded bg-surface-2" />
            <div className="h-4 w-1/2 rounded bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
