import { Suspense } from "react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard, EmptyState, StatusPill } from "@/components/ui";
import { SubmissionRow } from "@/components/SubmissionRow";
import { ReportViewsButton } from "@/components/ReportViewsButton";
import { PayoutRequestButton } from "@/components/PayoutRequestButton";
import { money, date, payoutProgress, PAYOUT_VIEW_THRESHOLD } from "@/lib/format";
import { WalletIcon } from "@/components/icons";

async function EarningsContent({ userId }: { userId: string }) {
  const [approved, pendingSubs, payoutRequests, activePayoutReq] = await Promise.all([
    prisma.submission.findMany({
      where: { userId, status: "APPROVED" },
      include: { campaign: { select: { title: true, brand: true, ratePerThousand: true } } },
      orderBy: { reviewedAt: "desc" },
    }),
    prisma.submission.aggregate({
      where: { userId, status: "PENDING" },
      _sum: { payout: true },
      _count: true,
    }),
    prisma.payoutRequest.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.payoutRequest.findFirst({
      where: { userId, status: { in: ["PENDING", "APPROVED"] } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const paid = payoutRequests.filter((p) => p.status === "PAID").reduce((a, p) => a + p.amount, 0);

  const totalViews = approved.reduce((a, s) => a + s.views, 0);
  const paidViews = approved.filter((s) => s.paidAt).reduce((a, s) => a + s.views, 0);
  const elig = payoutProgress(totalViews - paidViews);

  // Available = live views × campaign rate for clips not yet paid out.
  const unpaidEarned = approved
    .filter((s) => !s.paidAt)
    .reduce((a, s) => a + (s.views / 1000) * s.campaign.ratePerThousand, 0);
  const lockedEarned = elig.eligible ? 0 : unpaidEarned;
  const available = elig.eligible ? unpaidEarned : 0;

  return (
    <>
      <div className="mb-9 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Paid Out" value={money(paid)} hint="Lifetime withdrawals" />
        <StatCard
          label="Available to Withdraw"
          value={money(available)}
          hint={lockedEarned > 0 ? `${money(lockedEarned)} locked · reach 20k views to unlock` : `${money(paid)} paid out`}
        />
        <StatCard label="Pending Review" value={money(pendingSubs._sum.payout ?? 0)} hint={`${pendingSubs._count} clips awaiting approval`} />
      </div>

      {elig.eligible && available > 0 && (
        <div className="mb-9">
          {activePayoutReq ? (
            <div className="card p-5 flex items-center gap-4">
              <WalletIcon className="h-5 w-5 shrink-0 text-muted" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Payout request {activePayoutReq.status === "APPROVED" ? "approved" : "pending"}</p>
                <p className="text-xs text-muted">
                  {money(activePayoutReq.amount)} · {activePayoutReq.status === "APPROVED" ? "Being processed shortly" : "Awaiting admin review"}
                </p>
              </div>
              <span className={`pill shrink-0 text-xs ${activePayoutReq.status === "APPROVED" ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25" : "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25"}`}>
                {activePayoutReq.status === "APPROVED" ? "Approved" : "Pending"}
              </span>
            </div>
          ) : (
            <PayoutRequestButton available={available} />
          )}
        </div>
      )}

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

      <section className="mb-9">
        <h2 className="mb-4 font-display text-lg font-bold">Payout history</h2>
        {payoutRequests.length === 0 ? (
          <EmptyState icon={<WalletIcon className="h-7 w-7" />} title="No payouts yet" body="Your withdrawal requests will appear here." />
        ) : (
          <div className="card divide-y divide-border">
            {payoutRequests.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3.5">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-surface-2 text-muted">
                  <WalletIcon className="h-[18px] w-[18px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.note ?? "Withdrawal request"}</p>
                  <p className="text-xs text-muted">{date(p.createdAt)}</p>
                </div>
                <div className="ml-auto flex shrink-0 items-center gap-2">
                  <p className="font-display font-bold text-accent">{money(p.amount)}</p>
                  <StatusPill status={p.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-display text-lg font-bold">Approved clips</h2>
        {approved.length === 0 ? (
          <EmptyState title="No approved clips yet" body="Once an admin approves a clip, its payout shows here." />
        ) : (
          <div className="card divide-y divide-border">
            {approved.map((s) => (
              <SubmissionRow
                key={s.id}
                s={s}
                actions={
                  <span className="hidden sm:inline-flex">
                    <ReportViewsButton submissionId={s.id} disputed={s.viewsDisputed} variant="modal" />
                  </span>
                }
                footerAction={
                  <div className="sm:hidden">
                    <ReportViewsButton submissionId={s.id} disputed={s.viewsDisputed} variant="expand" />
                  </div>
                }
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function EarningsSkeleton() {
  return (
    <>
      <div className="mb-9 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card p-5">
            <div className="mb-3 h-3 w-20 animate-pulse rounded bg-surface-2" />
            <div className="mb-2 h-8 w-24 animate-pulse rounded bg-surface-2" />
            <div className="h-3 w-32 animate-pulse rounded bg-surface-2" />
          </div>
        ))}
      </div>
      <section className="mb-9">
        <div className="card p-5">
          <div className="mb-4 h-6 w-40 animate-pulse rounded bg-surface-2" />
          <div className="h-2.5 w-full animate-pulse rounded-full bg-surface-2" />
        </div>
      </section>
    </>
  );
}

export default async function EarningsPage() {
  const user = await requireUser();

  return (
    <>
      <PageHeader title="Earnings" subtitle="Your payouts across all campaigns — past and pending." />
      <Suspense fallback={<EarningsSkeleton />}>
        <EarningsContent userId={user.id!} />
      </Suspense>
    </>
  );
}
