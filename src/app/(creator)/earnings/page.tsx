import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard, EmptyState, StatusPill } from "@/components/ui";
import { SubmissionRow } from "@/components/SubmissionRow";
import { money, compact, date } from "@/lib/format";
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
  const available = totalEarned - paid;

  return (
    <>
      <PageHeader title="Earnings" subtitle="Your payouts across all campaigns — past and pending." />

      <div className="mb-9 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Earned" value={money(totalEarned)} hint="From approved clips" />
        <StatCard label="Available to Withdraw" value={money(Math.max(0, available))} hint={`${money(paid)} paid out`} />
        <StatCard label="Pending Review" value={money(pendingSubs._sum.payout ?? 0)} hint={`${pendingSubs._count} clips awaiting approval`} />
      </div>

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
