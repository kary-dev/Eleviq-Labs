import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard, EmptyState } from "@/components/ui";
import { SubmissionRow } from "@/components/SubmissionRow";
import { RefreshClipsButton } from "@/components/RefreshClipsButton";
import { ArrowLeftIcon, MegaphoneIcon } from "@/components/icons";
import { money, compact } from "@/lib/format";

// Refreshing live views (Instagram scraping) can take a while.
export const maxDuration = 60;

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) notFound();

  const subs = await prisma.submission.findMany({
    where: { userId: user.id, campaignId: id },
    orderBy: { createdAt: "desc" },
  });

  const pending = subs.filter((s) => s.status === "PENDING");
  const approved = subs.filter((s) => s.status === "APPROVED");
  const rejected = subs.filter((s) => s.status === "REJECTED");

  const totalViews = subs.reduce((a, s) => a + s.views, 0);
  const earned = approved.reduce((a, s) => a + s.payout, 0);

  return (
    <>
      <Link href="/campaigns" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowLeftIcon className="h-4 w-4" /> Back to campaigns
      </Link>

      <PageHeader
        title={campaign.title}
        subtitle={`${campaign.brand} · ${money(campaign.ratePerThousand)} / 1,000 views`}
        action={subs.length > 0 ? <RefreshClipsButton campaignId={id} /> : undefined}
      />

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
        <div className="space-y-9">
          <ClipSection title="Pending review" items={pending} />
          <ClipSection title="Approved" items={approved} />
          <ClipSection title="Rejected" items={rejected} />
        </div>
      )}
    </>
  );
}

function ClipSection({ title, items }: { title: string; items: any[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="mb-4 font-display text-lg font-bold">
        {title} <span className="text-muted">· {items.length}</span>
      </h2>
      <div className="card divide-y divide-border">
        {items.map((s) => (
          <SubmissionRow key={s.id} s={s} showCampaign={false} />
        ))}
      </div>
    </section>
  );
}
