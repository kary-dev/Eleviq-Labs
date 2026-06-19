"use client";

import { useEffect } from "react";
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

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await refreshCampaignClips(campaignId);
        router.refresh();
      } catch (e) {
        console.error(e);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [campaignId, router]);

  return (
    <div className="space-y-9">
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
                  <span className="hidden sm:inline-flex">
                    <ReportViewsButton submissionId={s.id} disputed={s.viewsDisputed} variant="modal" />
                  </span>
                </>
              }
              footerAction={
                <div className="sm:hidden">
                  <ReportViewsButton submissionId={s.id} disputed={s.viewsDisputed} variant="expand" />
                </div>
              }
            />
          </div>
        ))}
      </div>
    </section>
  );
}
