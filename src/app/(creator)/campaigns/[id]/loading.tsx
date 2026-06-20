import Link from "next/link";
import { ArrowLeftIcon } from "@/components/icons";

export default function Loading() {
  return (
    <>
      <Link href="/campaigns" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowLeftIcon className="h-4 w-4" /> Back to campaigns
      </Link>

      <div className="mb-7">
        <div className="mb-2 h-8 w-64 animate-pulse rounded-lg bg-surface-2" />
        <div className="h-4 w-48 animate-pulse rounded bg-surface-2" />
      </div>

      <div className="mb-9 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card p-5">
            <div className="mb-3 h-3 w-16 animate-pulse rounded bg-surface-2" />
            <div className="mb-2 h-8 w-20 animate-pulse rounded bg-surface-2" />
            <div className="h-3 w-28 animate-pulse rounded bg-surface-2" />
          </div>
        ))}
      </div>

      <div className="card divide-y divide-border">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <div className="h-12 w-12 animate-pulse rounded-lg bg-surface-2 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-56 animate-pulse rounded bg-surface-2" />
              <div className="h-3 w-36 animate-pulse rounded bg-surface-2" />
            </div>
            <div className="h-6 w-16 animate-pulse rounded-full bg-surface-2" />
          </div>
        ))}
      </div>
    </>
  );
}
