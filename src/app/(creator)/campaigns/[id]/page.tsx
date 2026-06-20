import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard, EmptyState } from "@/components/ui";
import { CampaignClipsClient } from "@/components/CampaignClipsClient";
import { ArrowLeftIcon, MegaphoneIcon } from "@/components/icons";
import { money, compact } from "@/lib/format";
import { cachedCampaign } from "@/lib/queries";

// Refreshing live views (Instagram scraping) can take a while.
export const maxDuration = 60;

type Campaign = NonNullable<Awaited<ReturnType<ReturnType<typeof cachedCampaign>>>>;

async function CampaignClips({ userId, campaignId }: { userId: string; campaignId: string }) {
  const subs = await prisma.submission.findMany({
    where: { userId, campaignId },
    include: { viewHistory: { orderBy: { recordedAt: "asc" }, take: 20 } },
    orderBy: { createdAt: "desc" },
  });

  const pending = subs.filter((s) => s.status === "PENDING");
  const approved = subs.filter((s) => s.status === "APPROVED");
  const rejected = subs.filter((s) => s.status === "REJECTED");

  const totalViews = subs.reduce((a, s) => a + s.views, 0);
  const earned = approved.reduce((a, s) => a + s.payout, 0);

  return (
    <>
      <div className="mb-9 grid gap-4 sm:grid-cols-3">
        <StatCard label="Clips" value={subs.length} hint={`${pending.length} pending`} />
        <StatCard label="Total Views" value={compact(totalViews)} hint="Live, from your clips" />
        <StatCard label="Earned" value={money(earned)} hint="From approved clips" />
      </div>

      {subs.length === 0 ? (
        <EmptyState
          icon={<MegaphoneIcon className="h-7 w-7" />}
          title="No clips for this campaign yet"
          body="Add a clip from your dashboard to start earning on this campaign."
        />
      ) : (
        <CampaignClipsClient
          campaignId={campaignId}
          pending={pending.map((s) => ({ ...s, viewHistory: s.viewHistory ?? [] }))}
          approved={approved.map((s) => ({ ...s, viewHistory: s.viewHistory ?? [] }))}
          rejected={rejected.map((s) => ({ ...s, viewHistory: s.viewHistory ?? [] }))}
        />
      )}
    </>
  );
}

function ClipsSkeleton() {
  return (
    <>
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

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  // Fast: campaign metadata from cache (~5ms on hit)
  const campaign = await cachedCampaign(id)();
  if (!campaign) notFound();

  return (
    <>
      <Link href="/campaigns" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowLeftIcon className="h-4 w-4" /> Back to campaigns
      </Link>

      <PageHeader
        title={campaign.title}
        subtitle={`${campaign.brand} · ${money(campaign.ratePerThousand)} / 1,000 views`}
      />

      <Suspense fallback={<ClipsSkeleton />}>
        <CampaignClips userId={user.id!} campaignId={id} />
      </Suspense>
    </>
  );
}
