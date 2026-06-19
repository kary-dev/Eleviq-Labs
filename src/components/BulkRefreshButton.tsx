"use client";

import { useTransition, useState } from "react";
import { bulkRefreshClips } from "@/app/admin/actions";
import { RefreshIcon } from "@/components/icons";

export function BulkRefreshButton() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ refreshed: number; autoRejected: number } | null>(null);

  return (
    <div className="flex items-center gap-3">
      {result && (
        <p className="text-sm text-muted">
          Refreshed {result.refreshed} · Auto-rejected {result.autoRejected}
        </p>
      )}
      <button
        disabled={pending}
        onClick={() => start(async () => {
          const r = await bulkRefreshClips();
          setResult(r);
        })}
        className="btn-ghost"
      >
        <RefreshIcon className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
        {pending ? "Refreshing…" : "Bulk Refresh"}
      </button>
    </div>
  );
}
