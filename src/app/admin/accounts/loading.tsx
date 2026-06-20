export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-2 h-8 w-44 rounded-lg bg-surface-2" />
      <div className="mb-8 h-4 w-72 rounded bg-surface-2" />
      <div className="card divide-y divide-border">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-4">
            <div className="h-10 w-10 shrink-0 rounded-full bg-surface-2" />
            <div className="flex-1">
              <div className="mb-1.5 h-4 w-36 rounded bg-surface-2" />
              <div className="h-3 w-24 rounded bg-surface-2" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-20 rounded-xl bg-surface-2" />
              <div className="h-8 w-20 rounded-xl bg-surface-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
