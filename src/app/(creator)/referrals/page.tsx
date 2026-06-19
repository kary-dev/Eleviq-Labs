import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard } from "@/components/ui";
import { ReferralPanel } from "@/components/ReferralPanel";
import { date, money } from "@/lib/format";

export default async function ReferralsPage() {
  const sessionUser = await requireUser();

  const [me, approvedCount, commissions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        referralCode: true,
        referredById: true,
        referrals: { orderBy: { createdAt: "desc" }, select: { id: true, name: true, createdAt: true, image: true } },
      },
    }),
    prisma.submission.count({ where: { userId: sessionUser.id, status: "APPROVED" } }),
    prisma.payout.findMany({
      where: { userId: sessionUser.id, note: { startsWith: "ref:" } },
      select: { amount: true, status: true },
    }),
  ]);

  const referrals = me?.referrals ?? [];
  const hasEarned = approvedCount > 0;
  const referralEarned = commissions.reduce((a, p) => a + p.amount, 0);
  const referralPending = commissions.filter((p) => p.status === "PENDING").reduce((a, p) => a + p.amount, 0);

  return (
    <>
      <PageHeader
        title="Referral Codes"
        subtitle="Share your personal referral link to earn 10% of your friends' view rewards. Referred creators enjoy a 10% earnings boost for their first 10 days."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Creators Referred" value={referrals.length} />
        <StatCard label="Referral Earnings" value={money(referralEarned)} hint={referralPending > 0 ? `${money(referralPending)} pending` : "Lifetime commissions"} />
        <StatCard label="Reward Share" value="10%" hint="of your referrals' view rewards" />
      </div>

      <ReferralPanel
        initialCode={me?.referralCode ?? null}
        alreadyReferred={!!me?.referredById}
        hasEarned={hasEarned}
      />

      {referrals.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-4 font-display text-lg font-bold">Creators you referred</h2>
          <div className="card divide-y divide-border">
            {referrals.map((r) => {
              const daysLeft = Math.ceil(10 - (Date.now() - new Date(r.createdAt).getTime()) / 86_400_000);
              const boostActive = daysLeft > 0;
              return (
                <div key={r.id} className="flex items-center gap-4 px-4 py-3.5">
                  {r.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.image} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-accent/15 text-sm font-bold text-accent">
                      {(r.name ?? "E").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{r.name ?? "Creator"}</p>
                    <p className="truncate text-xs text-muted">Joined {date(r.createdAt)}</p>
                  </div>
                  {boostActive ? (
                    <span className="pill bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
                      +10% · {daysLeft}d left
                    </span>
                  ) : (
                    <span className="pill bg-surface-2 text-muted">Boost ended</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
