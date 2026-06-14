import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard } from "@/components/ui";
import { ReferralPanel } from "@/components/ReferralPanel";
import { date } from "@/lib/format";

export default async function ReferralsPage() {
  const sessionUser = await requireUser();

  const [me, approvedCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        referralCode: true,
        referredById: true,
        referrals: { orderBy: { createdAt: "desc" }, select: { id: true, name: true, createdAt: true } },
      },
    }),
    prisma.submission.count({ where: { userId: sessionUser.id, status: "APPROVED" } }),
  ]);

  const referrals = me?.referrals ?? [];
  const hasEarned = approvedCount > 0;

  return (
    <>
      <PageHeader
        title="Referral Codes"
        subtitle="Share your personal referral link to earn 10% of your friends' view rewards. Referred creators enjoy a 10% earnings boost for their first 10 days."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard label="Creators Referred" value={referrals.length} />
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
            {referrals.map((r) => (
              <div key={r.id} className="flex items-center gap-4 px-4 py-3.5">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-accent/15 text-sm font-bold text-accent">
                  {(r.name ?? "E").slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{r.name ?? "Creator"}</p>
                  <p className="truncate text-xs text-muted">Joined {date(r.createdAt)}</p>
                </div>
                <span className="pill bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">+10% boost</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
