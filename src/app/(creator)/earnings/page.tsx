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

  // Eligibility is based on TOTAL approved views across the account.
  const totalViews = approved.reduce((a, s) => a + s.views, 0);
  const elig = payoutProgress(totalViews);
  const lockedEarned = elig.eligible ? 0 : totalEarned;
  const available = elig.eligible ? Math.max(0, totalEarned - paid) : 0;

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

      {/* Payout eligibility — total views across the account must reach 20,000 */}
      <section className="mb-9">
        <div className="card p-5">
          <div className="mb-1 flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold">Payout eligibility</h2>
            <span className={`pill ${elig.eligible ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25" : "bg-surface-2 text-muted ring-1 ring-border"}`}>
              {elig.eligible ? "Eligible" : "Locked"}
            </span>
          </div>
          <p className="mb-4 text-sm text-muted">
            You can withdraw earnings once your total views reach {PAYOUT_VIEW_THRESHOLD.toLocaleString("en-US")}.
          </p>
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="text-muted">Total views</span>
            <span className={elig.eligible ? "font-medium text-emerald-400" : "text-muted"}>
              {elig.views.toLocaleString("en-US")} / {elig.threshold.toLocaleString("en-US")}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
            <div
              className={`h-full rounded-full transition-all ${elig.eligible ? "bg-emerald-500" : "bg-accent"}`}
              style={{ width: `${elig.pct}%` }}
            />
          </div>
          <p className={`mt-2 text-xs ${elig.eligible ? "text-emerald-400" : "text-muted"}`}>
            {elig.eligible
              ? "✓ Eligible for payout"
              : `${elig.remaining.toLocaleString("en-US")} more views to unlock payout`}
          </p>
        </div>
      </section>

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
