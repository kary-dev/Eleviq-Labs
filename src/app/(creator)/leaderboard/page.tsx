import { Suspense } from "react";
import { requireUser } from "@/lib/session";
import { PageHeader, EmptyState } from "@/components/ui";
import { LeaderboardClient } from "@/components/LeaderboardClient";
import { UsersIcon } from "@/components/icons";
import { getLeaderboard } from "@/lib/queries";
import { prisma } from "@/lib/prisma";

async function LeaderboardContent({ userId }: { userId: string }) {
  const [leaders, me] = await Promise.all([
    getLeaderboard(),
    prisma.user.findUnique({ where: { id: userId }, select: { leaderboardOptIn: true, tier: true } }),
  ]);

  const ranked = leaders
    .map((c) => ({
      id: c.id,
      name: c.name ?? "Creator",
      image: c.image,
      tier: c.tier,
      views: c.submissions.reduce((a, s) => a + s.views, 0),
      earned: c.submissions.reduce((a, s) => a + s.payout, 0),
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 50);

  if (ranked.length === 0) {
    return (
      <EmptyState
        icon={<UsersIcon className="h-7 w-7" />}
        title="No creators on the leaderboard yet"
        body="Opt in below to appear on the leaderboard."
      />
    );
  }

  return (
    <LeaderboardClient
      leaders={ranked}
      currentUserId={userId}
      optedIn={me?.leaderboardOptIn ?? false}
    />
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="card divide-y divide-border">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
          <div className="w-6 shrink-0">
            <div className="h-4 w-5 animate-pulse rounded bg-surface-2" />
          </div>
          <div className="h-9 w-9 animate-pulse rounded-full bg-surface-2 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-36 animate-pulse rounded bg-surface-2" />
            <div className="h-3 w-20 animate-pulse rounded bg-surface-2" />
          </div>
          <div className="h-4 w-24 animate-pulse rounded bg-surface-2" />
        </div>
      ))}
    </div>
  );
}

export default async function LeaderboardPage() {
  const user = await requireUser();

  return (
    <>
      <PageHeader title="Leaderboard" subtitle="Top creators ranked by total approved views." />
      <Suspense fallback={<LeaderboardSkeleton />}>
        <LeaderboardContent userId={user.id!} />
      </Suspense>
    </>
  );
}
