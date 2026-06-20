export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-2 h-8 w-32 rounded-lg bg-surface-2" />
      <div className="mb-8 h-4 w-56 rounded bg-surface-2" />
      <div className="mb-4 h-10 w-64 rounded-xl bg-surface-2" />
      <div className="card overflow-hidden">
        <div className="hidden border-b border-border px-5 py-3 sm:grid sm:grid-cols-12 gap-3">
          {[4, 2, 2, 2, 2].map((cols, i) => (
            <div key={i} className={`col-span-${cols} h-3 rounded bg-surface-2`} />
          ))}
        </div>
        <div className="divide-y divide-border">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-4">
              <div className="h-9 w-9 shrink-0 rounded-full bg-surface-2" />
              <div className="flex-1">
                <div className="mb-1.5 h-4 w-40 rounded bg-surface-2" />
                <div className="h-3 w-28 rounded bg-surface-2" />
              </div>
              <div className="h-4 w-16 rounded bg-surface-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
