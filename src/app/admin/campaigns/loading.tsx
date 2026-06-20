export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-2 h-8 w-40 rounded-lg bg-surface-2" />
      <div className="mb-8 h-4 w-64 rounded bg-surface-2" />
      <div className="grid gap-5 md:grid-cols-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card p-5">
            <div className="mb-3 flex gap-3">
              <div className="h-12 w-12 shrink-0 rounded-2xl bg-surface-2" />
              <div className="flex-1">
                <div className="mb-2 h-3 w-24 rounded bg-surface-2" />
                <div className="h-5 w-40 rounded bg-surface-2" />
              </div>
            </div>
            <div className="mt-4 h-2 w-full rounded-full bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
