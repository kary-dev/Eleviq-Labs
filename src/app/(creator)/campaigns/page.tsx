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
          <Section title="Active" items={active} />
          {past.length > 0 && <Section title="Past campaigns" items={past} />}
        </div>
      )}
    </>
  );
}

function Section({
  title,
  items,
}: {
  title: string;
  items: { campaign: any; campaignId: string }[];
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
