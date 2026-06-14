import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";
import { CampaignCard } from "@/components/CampaignCard";
import { MegaphoneIcon } from "@/components/icons";

export default async function CampaignsPage() {
  const user = await requireUser();

  const participations = await prisma.participation.findMany({
    where: { userId: user.id },
    include: { campaign: true },
    orderBy: { createdAt: "desc" },
  });

  // Earnings per campaign
  const earnings = await prisma.submission.groupBy({
    by: ["campaignId"],
    where: { userId: user.id, status: "APPROVED" },
    _sum: { payout: true, views: true },
  });
  const earnMap = new Map(earnings.map((e) => [e.campaignId, e._sum]));

  const active = participations.filter((p) => p.campaign.status === "ACTIVE");
  const past = participations.filter((p) => p.campaign.status !== "ACTIVE");

  return (
    <>
      <PageHeader
        title="My Campaigns"
        subtitle="Every campaign you've joined, with your earnings so far."
      />

      {participations.length === 0 ? (
        <EmptyState
          icon={<MegaphoneIcon className="h-7 w-7" />}
          title="You haven't joined any campaigns yet"
          body="Head to Home and add a clip to an active campaign to join it."
        />
      ) : (
        <div className="space-y-9">
          <Section title="Active" items={active} earnMap={earnMap} />
          {past.length > 0 && <Section title="Past campaigns" items={past} earnMap={earnMap} />}
        </div>
      )}
    </>
  );
}

function Section({
  title,
  items,
  earnMap,
}: {
  title: string;
  items: { campaign: any; campaignId: string }[];
  earnMap: Map<string, { payout: number | null; views: number | null } | undefined>;
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="mb-4 font-display text-lg font-bold">{title}</h2>
      <div className="grid gap-5 md:grid-cols-2">
        {items.map((p) => (
          <CampaignCard key={p.campaignId} campaign={p.campaign} joined />
        ))}
      </div>
    </section>
  );
}
