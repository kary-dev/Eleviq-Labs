export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-2 h-8 w-52 rounded-lg bg-surface-2" />
      <div className="mb-8 h-4 w-64 rounded bg-surface-2" />
      <div className="grid gap-5 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5">
            <div className="mb-3 h-5 w-3/4 rounded bg-surface-2" />
            <div className="mb-4 h-40 w-full rounded-xl bg-surface-2" />
            <div className="flex gap-2">
              <div className="h-8 w-24 rounded-xl bg-surface-2" />
              <div className="h-8 w-24 rounded-xl bg-surface-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
