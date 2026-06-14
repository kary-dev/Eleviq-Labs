import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard, EmptyState } from "@/components/ui";
import { CopyField } from "@/components/CopyField";
import { GiftIcon } from "@/components/icons";
import { date, money } from "@/lib/format";

const REFERRAL_BONUS = 10; // $ per referred creator (illustrative)

export default async function ReferralsPage() {
  const sessionUser = await requireUser();

  const me = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    include: { referrals: { orderBy: { createdAt: "desc" } } },
  });

  const code = me?.referralCode ?? "ELEVIQ";
  const link = `https://app.eleviqlabs.com/auth?ref=${code}`;
  const referrals = me?.referrals ?? [];
  const earned = referrals.length * REFERRAL_BONUS;

  return (
    <>
      <PageHeader title="Referrals" subtitle="Invite creators and earn when they join and start clipping." />

      <div className="mb-7 grid gap-4 sm:grid-cols-3">
        <StatCard label="Referrals" value={referrals.length} />
        <StatCard label="Referral Earnings" value={money(earned)} hint={`${money(REFERRAL_BONUS)} per active creator`} />
        <StatCard label="Your Code" value={<span className="font-mono text-xl">{code}</span>} />
      </div>

      <div className="card mb-7 p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent/15 text-accent">
            <GiftIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold">Share your link</h3>
            <p className="text-sm text-muted">You both earn a bonus when they post their first approved clip.</p>
          </div>
        </div>
        <CopyField value={link} label="Your referral link" />
      </div>

      <section>
        <h2 className="mb-4 font-display text-lg font-bold">People you referred</h2>
        {referrals.length === 0 ? (
          <EmptyState icon={<GiftIcon className="h-7 w-7" />} title="No referrals yet" body="Share your link to start earning referral bonuses." />
        ) : (
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
                <span className="font-display font-bold text-accent">+{money(REFERRAL_BONUS)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
