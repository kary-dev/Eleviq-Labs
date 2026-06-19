import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";
import { LeaderboardClient } from "@/components/LeaderboardClient";
import { UsersIcon } from "@/components/icons";

export default async function LeaderboardPage() {
  const user = await requireUser();

  const [leaders, me] = await Promise.all([
    prisma.user.findMany({
      where: { role: "CREATOR", leaderboardOptIn: true, banned: false },
      select: {
        id: true,
        name: true,
        image: true,
        tier: true,
        submissions: { where: { status: "APPROVED" }, select: { views: true, payout: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findUnique({ where: { id: user.id }, select: { leaderboardOptIn: true, tier: true } }),
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

  return (
    <>
      <PageHeader title="Leaderboard" subtitle="Top creators ranked by total approved views." />
      {ranked.length === 0 ? (
        <EmptyState
          icon={<UsersIcon className="h-7 w-7" />}
          title="No creators on the leaderboard yet"
          body="Opt in below to appear on the leaderboard."
        />
      ) : (
        <LeaderboardClient
          leaders={ranked}
          currentUserId={user.id}
          optedIn={me?.leaderboardOptIn ?? false}
        />
      )}
    </>
  );
}
