export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-2 h-8 w-36 rounded-lg bg-surface-2" />
      <div className="mb-8 h-4 w-72 rounded bg-surface-2" />
      <div className="card divide-y divide-border">
        <div className="flex items-center justify-between gap-6 px-5 py-4">
          <div className="flex-1">
            <div className="mb-2 h-5 w-52 rounded bg-surface-2" />
            <div className="h-4 w-80 rounded bg-surface-2" />
          </div>
          <div className="h-8 w-16 rounded-full bg-surface-2" />
        </div>
      </div>
    </div>
  );
}
