import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard, EmptyState, StatusPill } from "@/components/ui";
import { EditCampaignButton, CampaignStatusToggle } from "@/components/CampaignForm";
import { PLATFORMS, PlatformKey } from "@/lib/platforms";
import { money, compact, date } from "@/lib/format";
import { ArrowLeftIcon, MegaphoneIcon } from "@/components/icons";

export default async function AdminCampaignDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) notFound();

  const subs = await prisma.submission.findMany({
    where: { campaignId: id },
    include: { user: { select: { name: true, email: true, image: true } } },
    orderBy: { createdAt: "desc" },
  });

  const pending = subs.filter((s) => s.status === "PENDING");
  const approved = subs.filter((s) => s.status === "APPROVED");
  const rejected = subs.filter((s) => s.status === "REJECTED");

  const totalViews = subs.reduce((a, s) => a + s.views, 0);
  const paidOut = approved.reduce((a, s) => a + s.payout, 0);
  const creators = new Set(subs.map((s) => s.userId)).size;

  return (
    <>
      <Link href="/admin/campaigns" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowLeftIcon className="h-4 w-4" /> Back to campaigns
      </Link>

      <PageHeader
        title={campaign.title}
        subtitle={`${campaign.brand} · ${money(campaign.ratePerThousand)} / 1,000 views`}
        action={
          <div className="flex items-center gap-2">
            <EditCampaignButton campaign={campaign} />
            <CampaignStatusToggle id={campaign.id} status={campaign.status} />
          </div>
        }
      />

      <div className="mb-9 grid gap-4 sm:grid-cols-4">
        <StatCard label="Clips" value={subs.length} hint={`${pending.length} pending`} />
        <StatCard label="Creators" value={creators} hint="Submitted to this campaign" />
        <StatCard label="Total Views" value={compact(totalViews)} hint="Across all clips" />
        <StatCard label="Total Paid Out" value={money(paidOut)} hint={`${approved.length} approved clips`} />
      </div>

      {subs.length === 0 ? (
        <EmptyState
          icon={<MegaphoneIcon className="h-7 w-7" />}
          title="No clips submitted yet"
          body="When creators submit clips to this campaign, they'll appear here."
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

type Row = {
  id: string;
  platform: string;
  url: string;
  title: string | null;
  views: number;
  status: string;
  payout: number;
  rejectReason: string | null;
  createdAt: Date;
  user: { name: string | null; email: string | null; image: string | null };
};

function ClipSection({ title, items }: { title: string; items: Row[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="mb-4 font-display text-lg font-bold">
        {title} <span className="text-muted">· {items.length}</span>
      </h2>
      <div className="card divide-y divide-border">
        {items.map((s) => {
          const { Icon, label } = PLATFORMS[s.platform as PlatformKey] ?? PLATFORMS.INSTAGRAM;
          return (
            <div key={s.id} className="flex items-center gap-4 px-4 py-3.5">
              <span title={label} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-surface-2 text-muted">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <a href={s.url} target="_blank" rel="noreferrer" className="block truncate text-sm font-semibold hover:text-accent">
                  {s.title || s.url}
                </a>
                <p className="truncate text-xs text-muted">
                  {s.user.name ?? s.user.email ?? "Unknown creator"} · {date(s.createdAt)}
                  {s.status === "REJECTED" && s.rejectReason ? ` · ${s.rejectReason}` : ""}
                </p>
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold">{compact(s.views)}</p>
                <p className="text-[11px] text-muted">views</p>
              </div>
              <div className="w-20 text-right">
                <p className="text-sm font-semibold text-accent">{money(s.payout)}</p>
              </div>
              <StatusPill status={s.status} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
