export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-2 h-8 w-44 rounded-lg bg-surface-2" />
      <div className="mb-8 h-4 w-48 rounded bg-surface-2" />
      <div className="mb-6 h-28 w-full rounded-xl bg-surface-2" />
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="h-4 w-36 rounded bg-surface-2" />
              <div className="ml-auto h-6 w-20 rounded-lg bg-surface-2" />
            </div>
            <div className="h-3 w-48 rounded bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
