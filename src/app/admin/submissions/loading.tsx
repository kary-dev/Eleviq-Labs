export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-2 h-8 w-40 rounded-lg bg-surface-2" />
      <div className="mb-8 h-4 w-64 rounded bg-surface-2" />
      <div className="mb-4 flex gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-9 w-24 rounded-xl bg-surface-2" />
        ))}
      </div>
      <div className="mb-6 h-10 w-56 rounded-xl bg-surface-2" />
      <div className="grid gap-5 md:grid-cols-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card p-5">
            <div className="mb-3 h-5 w-3/4 rounded bg-surface-2" />
            <div className="h-4 w-1/2 rounded bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
