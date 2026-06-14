import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard, EmptyState, StatusPill } from "@/components/ui";
import { SubmissionRow } from "@/components/SubmissionRow";
import { money, compact, date, payoutProgress, PAYOUT_VIEW_THRESHOLD } from "@/lib/format";
import { WalletIcon } from "@/components/icons";

export default async function EarningsPage() {
  const user = await requireUser();

  const [approved, pendingSubs, payouts] = await Promise.all([
    prisma.submission.findMany({
      where: { userId: user.id, status: "APPROVED" },
      include: { campaign: { select: { title: true, brand: true } } },
      orderBy: { reviewedAt: "desc" },
    }),
    prisma.submission.aggregate({
      where: { userId: user.id, status: "PENDING" },
      _sum: { payout: true },
      _count: true,
    }),
    prisma.payout.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
  ]);

  const totalEarned = approved.reduce((a, s) => a + s.payout, 0);
  const paid = payouts.filter((p) => p.status === "PAID").reduce((a, p) => a + p.amount, 0);

  // Group approved clips per campaign to apply the 20,000-view payout threshold.
  const byCampaign = new Map<string, { title: string; brand: string; views: number; payout: number }>();
  for (const s of approved) {
    const cur = byCampaign.get(s.campaignId) ?? { title: s.campaign.title, brand: s.campaign.brand, views: 0, payout: 0 };
    cur.views += s.views;
    cur.payout += s.payout;
    byCampaign.set(s.campaignId, cur);
  }
  const campaignRows = [...byCampaign.values()].sort((a, b) => b.views - a.views);

  // Only earnings from campaigns past the view threshold can be withdrawn.
  const eligibleEarned = campaignRows.filter((c) => c.views >= PAYOUT_VIEW_THRESHOLD).reduce((a, c) => a + c.payout, 0);
  const lockedEarned = totalEarned - eligibleEarned;
  const available = Math.max(0, eligibleEarned - paid);

  return (
    <>
      <PageHeader title="Earnings" subtitle="Your payouts across all campaigns — past and pending." />

      <div className="mb-9 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Earned" value={money(totalEarned)} hint="From approved clips" />
        <StatCard
          label="Available to Withdraw"
          value={money(available)}
          hint={lockedEarned > 0 ? `${money(lockedEarned)} locked · ${money(paid)} paid out` : `${money(paid)} paid out`}
        />
        <StatCard label="Pending Review" value={money(pendingSubs._sum.payout ?? 0)} hint={`${pendingSubs._count} clips awaiting approval`} />
      </div>

      {/* Payout eligibility — reach 20,000 views per campaign to unlock */}
      {campaignRows.length > 0 && (
        <section className="mb-9">
          <h2 className="mb-4 font-display text-lg font-bold">Payout eligibility</h2>
          <p className="mb-4 -mt-2 text-sm text-muted">
            Earnings unlock once a campaign reaches {PAYOUT_VIEW_THRESHOLD.toLocaleString("en-US")} views.
          </p>
          <div className="card divide-y divide-border">
            {campaignRows.map((c) => {
              const prog = payoutProgress(c.views);
              return (
                <div key={c.title} className="px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{c.title}</p>
                      <p className="text-xs text-muted">{c.brand}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-accent">{money(c.payout)}</p>
                      <p className={`text-[11px] ${prog.eligible ? "text-emerald-400" : "text-muted"}`}>
                        {prog.eligible ? "Unlocked" : "Locked"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-muted">Views</span>
                      <span className={prog.eligible ? "font-medium text-emerald-400" : "text-muted"}>
                        {prog.views.toLocaleString("en-US")} / {prog.threshold.toLocaleString("en-US")}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className={`h-full rounded-full transition-all ${prog.eligible ? "bg-emerald-500" : "bg-accent"}`}
                        style={{ width: `${prog.pct}%` }}
                      />
                    </div>
                    {!prog.eligible && (
                      <p className="mt-1 text-xs text-muted">
                        {prog.remaining.toLocaleString("en-US")} more views to unlock payout
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Payout history */}
      <section className="mb-9">
        <h2 className="mb-4 font-display text-lg font-bold">Payout history</h2>
        {payouts.length === 0 ? (
          <EmptyState icon={<WalletIcon className="h-7 w-7" />} title="No payouts yet" body="Earnings from approved clips will appear here." />
        ) : (
          <div className="card divide-y divide-border">
            {payouts.map((p) => (
              <div key={p.id} className="flex items-center gap-4 px-4 py-3.5">
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-surface-2 text-muted">
                  <WalletIcon className="h-[18px] w-[18px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.note ?? "Campaign payout"}</p>
                  <p className="text-xs text-muted">{date(p.createdAt)}</p>
                </div>
                <p className="font-display font-bold text-accent">{money(p.amount)}</p>
                <StatusPill status={p.status} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Approved clips breakdown */}
      <section>
        <h2 className="mb-4 font-display text-lg font-bold">Approved clips</h2>
        {approved.length === 0 ? (
          <EmptyState title="No approved clips yet" body="Once an admin approves a clip, its payout shows here." />
        ) : (
          <div className="card divide-y divide-border">
            {approved.map((s) => (
              <SubmissionRow key={s.id} s={s} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
