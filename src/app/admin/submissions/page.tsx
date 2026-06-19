import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState, StatusPill } from "@/components/ui";
import { AdminReviewCard } from "@/components/AdminReviewCard";
import { DisputeRow } from "@/components/DisputeRow";
import { BulkRefreshButton } from "@/components/BulkRefreshButton";
import { SubmissionCampaignFilter } from "@/components/SubmissionCampaignFilter";
import { PLATFORMS, PlatformKey } from "@/lib/platforms";
import { money, compact, date } from "@/lib/format";

const TABS = ["PENDING", "APPROVED", "REJECTED", "DISPUTED"] as const;

export default async function AdminSubmissions({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; campaignId?: string }>;
}) {
  const { status, campaignId } = await searchParams;
  const active = (TABS.includes(status as any) ? status : "PENDING") as (typeof TABS)[number];

  const [subs, campaigns] = await Promise.all([
    prisma.submission.findMany({
      where: {
        ...(active === "DISPUTED" ? { viewsDisputed: true } : { status: active }),
        ...(campaignId ? { campaignId } : {}),
      },
      include: {
        campaign: { select: { title: true, brand: true, ratePerThousand: true } },
        user: { select: { name: true, email: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.campaign.findMany({ select: { id: true, title: true, brand: true }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <>
      <PageHeader
        title="Submissions"
        subtitle="Every clip submitted across all campaigns."
        action={<BulkRefreshButton />}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <Link key={t} href={`/admin/submissions?status=${t}${campaignId ? `&campaignId=${campaignId}` : ""}`} className={`btn ${active === t ? "btn-accent" : "btn-ghost"}`}>
            {t.charAt(0) + t.slice(1).toLowerCase()}
          </Link>
        ))}
      </div>
      <div className="mb-6">
        <SubmissionCampaignFilter campaigns={campaigns} />
      </div>

      {subs.length === 0 ? (
        <EmptyState title={`No ${active.toLowerCase()} submissions`} />
      ) : active === "PENDING" ? (
        <div className="grid gap-5 md:grid-cols-2">
          {subs.map((s) => (
            <AdminReviewCard key={s.id} sub={s} />
          ))}
        </div>
      ) : active === "DISPUTED" ? (
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
