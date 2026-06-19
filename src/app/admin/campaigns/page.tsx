import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState, StatusPill } from "@/components/ui";
import { NewCampaignButton, CampaignStatusToggle } from "@/components/CampaignForm";
import { PLATFORMS, PlatformKey } from "@/lib/platforms";
import { money, compact } from "@/lib/format";
import { ChartIcon } from "@/components/icons";

function daysLeft(endsAt: Date | null): number | null {
  if (!endsAt) return null;
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return null;
  return Math.ceil(ms / 86_400_000);
}

export default async function AdminCampaigns() {
  const campaigns = await prisma.campaign.findMany({
    include: { _count: { select: { submissions: true, participations: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader
        title="Campaigns"
        subtitle="Create and manage brand campaigns."
        action={<NewCampaignButton />}
      />

      {campaigns.length === 0 ? (
        <EmptyState icon={<ChartIcon className="h-7 w-7" />} title="No campaigns yet" body="Create your first campaign to get creators clipping." />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {campaigns.map((c) => {
            const pct = Math.min(100, Math.round((c.totalBudgetUsed / c.budget) * 100));
            const plats = c.platforms.split(",").filter(Boolean) as PlatformKey[];
            const days = daysLeft(c.endsAt);
            return (
              <div key={c.id} className="card relative p-5 transition hover:border-accent/40">
                <Link
                  href={`/admin/campaigns/${c.id}`}
                  aria-label={`Open ${c.title}`}
                  className="absolute inset-0 z-0"
                />
                <div className="flex items-start gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-border bg-surface-2 text-xl">
                    {c.thumbnail ?? "🎬"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-xs uppercase tracking-wider text-muted">{c.brand}</p>
                      <StatusPill status={c.status} />
                      {c.status !== "ENDED" && days !== null && (
                        <span className={`pill text-xs ${days <= 3 ? "bg-rose-500/15 text-rose-400" : days <= 7 ? "bg-amber-500/15 text-amber-400" : "bg-surface-2 text-muted"}`}>
                          {days}d left
                        </span>
                      )}
                    </div>
                    <h3 className="truncate font-display font-bold">{c.title}</h3>
                  </div>
                  <p className="shrink-0 font-display font-bold text-accent">{money(c.ratePerThousand)}<span className="text-[11px] text-muted">/1k</span></p>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  {plats.map((p) => {
                    const { Icon } = PLATFORMS[p];
                    return (
                      <span key={p} className="grid h-7 w-7 place-items-center rounded-lg border border-border bg-surface-2 text-muted">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                    );
                  })}
                  <span className="ml-auto text-xs text-muted">{c._count.submissions} clips · {c._count.participations} creators</span>
                </div>

                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-muted">
                    <span>Budget used</span>
                    <span>{money(c.totalBudgetUsed)} / {money(c.budget)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="relative z-10 mt-4 flex justify-end">
                  <CampaignStatusToggle id={c.id} status={c.status} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
