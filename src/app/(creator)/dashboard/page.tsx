import { Suspense } from "react";
import { requireUser } from "@/lib/session";
import { StatCard, EmptyState } from "@/components/ui";
import { CampaignSearch } from "@/components/CampaignSearch";
import { SubmissionRow } from "@/components/SubmissionRow";
import { ReportViewsButton } from "@/components/ReportViewsButton";
import { ReferralAutoApply } from "@/components/ReferralAutoApply";
import { DiscordIcon } from "@/components/icons";
import { money, compact, payoutProgress } from "@/lib/format";
import {
  getActiveCampaigns,
  getSubmissions,
  cachedUserParticipations,
  cachedUserPaidAgg,
} from "@/lib/queries";

// addClip re-fetches the post via Instagram scraping, which can be slow.
export const maxDuration = 60;

// ── Async sub-components (streamed in independently) ──────────────────────────

async function DashboardStats({ userId }: { userId: string }) {
  const [submissions, paidAgg] = await Promise.all([
    getSubmissions(userId),
    cachedUserPaidAgg(userId)(),
  ]);
  const approved = submissions.filter((s) => s.status === "APPROVED");
  const totalViews = approved.reduce((a, s) => a + s.views, 0);
  const paidViews = approved.filter((s) => s.paidAt).reduce((a, s) => a + s.views, 0);
  const totalEarned = paidAgg._sum.payout ?? 0;
  const viewsElig = payoutProgress(totalViews - paidViews);

  return (
    <div className="mb-9 grid gap-4 sm:grid-cols-3">
      <StatCard
        label="Posts"
        value={submissions.length}
        hint={`${submissions.filter((s) => s.status === "PENDING").length} pending review`}
      />
      <StatCard
        label="Total Views"
        value={`${compact(totalViews - paidViews)} / 20K`}
        hint={
          viewsElig.eligible
            ? "✓ Eligible for payout"
            : `${compact(viewsElig.remaining)} more views to unlock payout`
        }
      />
      <StatCard label="Total Earned" value={money(totalEarned)} hint="From approved clips" />
    </div>
  );
}

async function ActiveCampaignsSection({ userId }: { userId: string }) {
  const [activeCampaigns, participations] = await Promise.all([
    getActiveCampaigns(),
    cachedUserParticipations(userId)(),
  ]);
  const joinedIds = new Set(participations.map((p) => p.campaignId));

  return (
    <section className="mb-9">
      <div className="mb-4">
        <h2 className="font-display text-xl font-bold">Active Campaigns</h2>
        <p className="text-sm text-muted">Select a campaign and add a clip to start earning.</p>
      </div>
      {activeCampaigns.length === 0 ? (
        <EmptyState
          title="No active campaigns right now"
          body="New brand campaigns roll out regularly — check back soon."
        />
      ) : (
        <CampaignSearch campaigns={activeCampaigns} joinedIds={joinedIds} />
      )}
    </section>
  );
}

async function RecentClipsSection({ userId }: { userId: string }) {
  const submissions = await getSubmissions(userId);

  return (
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
            <SubmissionRow
              key={s.id}
              s={s}
              actions={
                s.status !== "REJECTED" ? (
                  <span className="hidden sm:inline-flex">
                    <ReportViewsButton submissionId={s.id} disputed={s.viewsDisputed} variant="modal" />
                  </span>
                ) : undefined
              }
              footerAction={
                s.status !== "REJECTED" ? (
                  <div className="sm:hidden">
                    <ReportViewsButton submissionId={s.id} disputed={s.viewsDisputed} variant="expand" />
                  </div>
                ) : undefined
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ── Skeleton fallbacks ────────────────────────────────────────────────────────

function StatsSkeleton() {
  return (
    <div className="mb-9 grid gap-4 sm:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="card p-5">
          <div className="mb-3 h-3 w-16 animate-pulse rounded bg-surface-2" />
          <div className="mb-2 h-8 w-24 animate-pulse rounded bg-surface-2" />
          <div className="h-3 w-36 animate-pulse rounded bg-surface-2" />
        </div>
      ))}
    </div>
  );
}

function CampaignsSkeleton() {
  return (
    <section className="mb-9">
      <div className="mb-4">
        <div className="mb-2 h-6 w-40 animate-pulse rounded bg-surface-2" />
        <div className="h-3 w-64 animate-pulse rounded bg-surface-2" />
      </div>
      <div className="card divide-y divide-border">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <div className="h-10 w-10 animate-pulse rounded-xl bg-surface-2" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 animate-pulse rounded bg-surface-2" />
              <div className="h-3 w-32 animate-pulse rounded bg-surface-2" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ClipsSkeleton() {
  return (
    <section>
      <div className="mb-4">
        <div className="mb-2 h-6 w-32 animate-pulse rounded bg-surface-2" />
        <div className="h-3 w-56 animate-pulse rounded bg-surface-2" />
      </div>
      <div className="card divide-y divide-border">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <div className="h-12 w-12 animate-pulse rounded-lg bg-surface-2" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-56 animate-pulse rounded bg-surface-2" />
              <div className="h-3 w-36 animate-pulse rounded bg-surface-2" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Page shell (renders instantly — only needs JWT decode) ────────────────────

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const [user, { ref }] = await Promise.all([requireUser(), searchParams]);

  return (
    <>
      {ref && <ReferralAutoApply code={ref} />}

      {/* Welcome */}
      <div className="mb-7">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Pick a live campaign, submit your clip, and earn as the views roll in.
        </p>
      </div>

      {/* Join Discord banner */}
      <a
        href="https://discord.gg/8pNRbsEzx"
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

      {/* Stats — streamed in */}
      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats userId={user.id} />
      </Suspense>

      {/* Active campaigns — streamed in */}
      <Suspense fallback={<CampaignsSkeleton />}>
        <ActiveCampaignsSection userId={user.id} />
      </Suspense>

      {/* Recent clips — streamed in */}
      <Suspense fallback={<ClipsSkeleton />}>
        <RecentClipsSection userId={user.id} />
      </Suspense>
    </>
  );
}
