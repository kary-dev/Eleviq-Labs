"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { refreshCampaignClips } from "@/app/(creator)/actions";
import { SubmissionRow } from "@/components/SubmissionRow";
import type { SubmissionData } from "@/components/SubmissionRow";
import { ReportViewsButton } from "@/components/ReportViewsButton";
import { Sparkline } from "@/components/Sparkline";

type SubmissionWithHistory = SubmissionData & { viewHistory?: { views: number }[] };

export function CampaignClipsClient({
  campaignId,
  pending,
  approved,
  rejected,
}: {
  campaignId: string;
  pending: SubmissionWithHistory[];
  approved: SubmissionWithHistory[];
  rejected: SubmissionWithHistory[];
}) {
  const router = useRouter();
  const [pending_, startRefresh] = useTransition();
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  function handleRefresh() {
    startRefresh(async () => {
      await refreshCampaignClips(campaignId);
      router.refresh();
      setLastRefreshed(new Date());
    });
  }

  return (
    <div className="space-y-9">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">
          {lastRefreshed
            ? `Updated ${lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
            : "Press refresh to update view counts"}
        </span>
        <button
          onClick={handleRefresh}
          disabled={pending_}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2/60 px-3 py-1.5 text-xs font-medium text-muted transition hover:border-accent/40 hover:text-accent disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 ${pending_ ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {pending_ ? "Refreshing…" : "Refresh views"}
        </button>
      </div>

      <ClipSection title="Pending review" items={pending} />
      <ClipSection title="Approved" items={approved} />
      <ClipSection title="Rejected" items={rejected} />
    </div>
  );
}

function ClipSection({ title, items }: { title: string; items: SubmissionWithHistory[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="mb-4 font-display text-lg font-bold">
        {title} <span className="text-muted">· {items.length}</span>
      </h2>
      <div className="card divide-y divide-border">
        {items.map((s) => (
          <div key={s.id} className="relative px-1">
            <SubmissionRow
              s={s}
              showCampaign={false}
              actions={
                <>
                  {s.viewHistory && s.viewHistory.length >= 2 && (
                    <Sparkline values={s.viewHistory.map((h) => h.views)} className="shrink-0 text-accent/60" />
                  )}
                  {s.status !== "REJECTED" && (
                    <span className="hidden sm:inline-flex">
                      <ReportViewsButton submissionId={s.id} disputed={s.viewsDisputed} variant="modal" />
                    </span>
                  )}
                </>
              }
              footerAction={
                s.status === "REJECTED" ? null : (
                  <div className="sm:hidden">
                    <ReportViewsButton submissionId={s.id} disputed={s.viewsDisputed} variant="expand" />
                  </div>
                )
              }
            />
          </div>
        ))}
      </div>
    </section>
  );
}
