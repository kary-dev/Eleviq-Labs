import { Suspense } from "react";
import Link from "next/link";
import { PageHeader, EmptyState, StatusPill } from "@/components/ui";
import { AdminReviewCard } from "@/components/AdminReviewCard";
import { DisputeRow } from "@/components/DisputeRow";
import { BulkRefreshButton } from "@/components/BulkRefreshButton";
import { SubmissionCampaignFilter } from "@/components/SubmissionCampaignFilter";
import { PLATFORMS, PlatformKey } from "@/lib/platforms";
import { money, compact, date } from "@/lib/format";
import { getAdminSubmissions, getAdminCampaignsList } from "@/lib/queries";

const TABS = ["PENDING", "APPROVED", "REJECTED", "DISPUTED"] as const;

async function SubmissionsContent({
  status,
  campaignId,
}: {
  status: (typeof TABS)[number];
  campaignId?: string;
}) {
  const [subs, campaigns] = await Promise.all([
    getAdminSubmissions(status, campaignId),
    getAdminCampaignsList(),
  ]);

  return (
    <>
      <div className="mb-6">
        <SubmissionCampaignFilter campaigns={campaigns} />
      </div>

      {subs.length === 0 ? (
        <EmptyState title={`No ${status.toLowerCase()} submissions`} />
      ) : status === "PENDING" ? (
        <div className="grid gap-5 md:grid-cols-2">
          {subs.map((s) => (
            <AdminReviewCard key={s.id} sub={s} />
          ))}
        </div>
      ) : status === "DISPUTED" ? (
        <div className="space-y-3">
          {subs.map((s) => (
            <DisputeRow
              key={s.id}
              sub={{
                id: s.id,
                platform: s.platform,
                url: s.url,
                title: s.title,
                views: s.views,
                claimedViews: s.claimedViews,
                disputeNote: s.disputeNote,
                disputeScreenshot: s.disputeScreenshot ?? null,
                status: s.status,
                creator: s.user.name ?? s.user.email ?? "Unknown",
                campaign: `${s.campaign.brand} · ${s.campaign.title}`,
              }}
            />
          ))}
        </div>
      ) : (
        <div className="card divide-y divide-border">
          {subs.map((s) => {
            const { Icon } = PLATFORMS[s.platform as PlatformKey] ?? PLATFORMS.TIKTOK;
            return (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-surface-2 text-muted">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <a href={s.url} target="_blank" rel="noreferrer" className="block truncate text-sm font-semibold hover:text-accent">
                    {s.title || s.url}
                  </a>
                  <p className="truncate text-xs text-muted">
                    {s.user.name ?? s.user.email} · {s.campaign.brand} · {date(s.createdAt)}
                    {s.status === "REJECTED" && s.rejectReason ? ` · ${s.rejectReason}` : ""}
                  </p>
                </div>
                <div className="ml-auto flex shrink-0 items-center gap-3">
                  <span className="hidden text-sm font-semibold sm:block">{compact(s.views)}</span>
                  <span className="text-sm font-semibold text-accent">{money(s.payout)}</span>
                  <StatusPill status={s.status} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function SubmissionsSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 h-10 w-56 rounded-xl bg-surface-2" />
      <div className="grid gap-5 md:grid-cols-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card p-5">
            <div className="mb-3 h-5 w-3/4 rounded bg-surface-2" />
            <div className="h-4 w-1/2 rounded bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function AdminSubmissions({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; campaignId?: string }>;
}) {
  const { status, campaignId } = await searchParams;
  const active = (TABS.includes(status as any) ? status : "PENDING") as (typeof TABS)[number];

  return (
    <>
      <PageHeader
        title="Submissions"
        subtitle="Every clip submitted across all campaigns."
        action={<BulkRefreshButton />}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <Link
            key={t}
            href={`/admin/submissions?status=${t}${campaignId ? `&campaignId=${campaignId}` : ""}`}
            className={`btn ${active === t ? "btn-accent" : "btn-ghost"}`}
          >
            {t.charAt(0) + t.slice(1).toLowerCase()}
          </Link>
        ))}
      </div>

      <Suspense key={`${active}-${campaignId}`} fallback={<SubmissionsSkeleton />}>
        <SubmissionsContent status={active} campaignId={campaignId} />
      </Suspense>
    </>
  );
}
