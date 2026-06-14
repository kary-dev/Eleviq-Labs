import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { StatCard, EmptyState } from "@/components/ui";
import { CampaignCard } from "@/components/CampaignCard";
import { SubmissionRow } from "@/components/SubmissionRow";
import { DiscordIcon, MegaphoneIcon } from "@/components/icons";
import { money, compact } from "@/lib/format";

export default async function DashboardPage() {
  const user = await requireUser();

  const [activeCampaigns, submissions, participations, paidAgg] = await Promise.all([
    prisma.campaign.findMany({ where: { status: "ACTIVE" }, orderBy: { createdAt: "desc" } }),
    prisma.submission.findMany({
      where: { userId: user.id },
      include: { campaign: { select: { title: true, brand: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.participation.findMany({ where: { userId: user.id }, select: { campaignId: true } }),
    prisma.submission.aggregate({
      where: { userId: user.id, status: "APPROVED" },
      _sum: { payout: true, views: true },
    }),
  ]);

  const joinedIds = new Set(participations.map((p) => p.campaignId));
  const totalViews = submissions.reduce((a, s) => a + s.views, 0);
  const totalEarned = paidAgg._sum.payout ?? 0;

  return (
    <>
      {/* Welcome */}
      <div className="mb-7">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
        </h1>
        <p className="mt-1.5 text-sm text-muted">Pick a live campaign, submit your clip, and earn as the views roll in.</p>
      </div>

      {/* Join Discord banner */}
      <a
        href="https://discord.gg/N2BJXwnHfa"
        target="_blank"
        rel="noreferrer"
        className="mb-7 flex items-center justify-between gap-4 rounded-2xl border border-[#5865F2]/30 bg-[#5865F2]/10 p-5 transition hover:bg-[#5865F2]/15"
      >
        <div className="flex items-center gap-4">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#5865F2]/20 text-[#7984f5]">
            <DiscordIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">Join the Eleviq Labs Discord</p>
            <p className="text-sm text-muted">Get campaign drops, support, and payout updates first.</p>
          </div>
        </div>
        <span className="btn-accent hidden sm:inline-flex">Join now</span>
      </a>

      {/* Stats */}
      <div className="mb-9 grid gap-4 sm:grid-cols-3">
        <StatCard label="Posts" value={submissions.length} hint={`${submissions.filter((s) => s.status === "PENDING").length} pending review`} />
        <StatCard label="Total Views" value={compact(totalViews)} />
        <StatCard label="Total Earned" value={money(totalEarned)} hint="From approved clips" />
      </div>

      {/* Active campaigns */}
      <section className="mb-9">
        <div className="mb-4">
          <h2 className="font-display text-xl font-bold">Active Campaigns</h2>
          <p className="text-sm text-muted">Select a campaign and add a clip to start earning.</p>
        </div>
        {activeCampaigns.length === 0 ? (
          <EmptyState
            icon={<MegaphoneIcon className="h-7 w-7" />}
            title="No active campaigns right now"
            body="New brand campaigns roll out regularly — check back soon."
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {activeCampaigns.map((c) => (
              <CampaignCard key={c.id} campaign={c} joined={joinedIds.has(c.id)} />
            ))}
          </div>
        )}
      </section>

      {/* Recent submissions */}
      <section>
        <div className="mb-4">
          <h2 className="font-display text-xl font-bold">Recent Clips</h2>
          <p className="text-sm text-muted">Your latest submissions across all campaigns.</p>
        </div>
        {submissions.length === 0 ? (
          <EmptyState title="No clips yet" body="Add your first clip from an active campaign above." />
        ) : (
          <div className="card divide-y divide-border">
            {submissions.slice(0, 6).map((s) => (
              <SubmissionRow key={s.id} s={s} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
