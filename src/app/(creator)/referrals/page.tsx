import { Suspense } from "react";
import { requireUser } from "@/lib/session";
import { PageHeader, StatCard } from "@/components/ui";
import { ReferralPanel } from "@/components/ReferralPanel";
import { date, money } from "@/lib/format";
import { cachedUserReferrals } from "@/lib/queries";

async function ReferralsContent({ userId }: { userId: string }) {
  const [me, approvedCount, commissions] = await cachedUserReferrals(userId)();

  const referrals = me?.referrals ?? [];
  const hasEarned = approvedCount > 0;
  const referralEarned = commissions.reduce((a, p) => a + p.amount, 0);
  const referralPending = commissions.filter((p) => p.status === "PENDING").reduce((a, p) => a + p.amount, 0);

  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Creators Referred" value={referrals.length} />
        <StatCard
          label="Referral Earnings"
          value={money(referralEarned)}
          hint={referralPending > 0 ? `${money(referralPending)} pending` : "Lifetime commissions"}
        />
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

function ReferralsSkeleton() {
  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card p-5">
            <div className="mb-3 h-3 w-28 animate-pulse rounded bg-surface-2" />
            <div className="mb-2 h-8 w-16 animate-pulse rounded bg-surface-2" />
            <div className="h-3 w-36 animate-pulse rounded bg-surface-2" />
          </div>
        ))}
      </div>
      <div className="card p-6 space-y-4">
        <div className="h-5 w-36 animate-pulse rounded bg-surface-2" />
        <div className="h-10 w-full animate-pulse rounded-lg bg-surface-2" />
        <div className="h-4 w-64 animate-pulse rounded bg-surface-2" />
      </div>
    </>
  );
}

export default async function ReferralsPage() {
  const user = await requireUser();

  return (
    <>
      <PageHeader
        title="Referral Codes"
        subtitle="Share your personal referral link to earn 10% of your friends' view rewards. Referred creators enjoy a 10% earnings boost for their first 10 days."
      />
      <Suspense fallback={<ReferralsSkeleton />}>
        <ReferralsContent userId={user.id!} />
      </Suspense>
    </>
  );
}
