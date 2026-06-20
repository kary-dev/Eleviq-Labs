import { Suspense } from "react";
import { requireUser } from "@/lib/session";
import { PageHeader, EmptyState } from "@/components/ui";
import { CampaignCard } from "@/components/CampaignCard";
import { MegaphoneIcon } from "@/components/icons";
import { cachedUserCampaigns } from "@/lib/queries";

// addClip re-fetches the post via Instagram scraping, which can be slow.
export const maxDuration = 60;

async function CampaignsList({ userId }: { userId: string }) {
  const participations = await cachedUserCampaigns(userId)();
  const active = participations.filter((p) => p.campaign.status === "ACTIVE");
  const past = participations.filter((p) => p.campaign.status !== "ACTIVE");

  if (participations.length === 0) {
    return (
      <EmptyState
        icon={<MegaphoneIcon className="h-7 w-7" />}
        title="You haven't joined any campaigns yet"
        body="Head to Home and add a clip to an active campaign to join it."
      />
    );
  }

  return (
    <div className="space-y-9">
      {active.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-lg font-bold">Active</h2>
          <div className="grid gap-5 md:grid-cols-2">
            {active.map((p) => (
              <CampaignCard key={p.campaignId} campaign={p.campaign} joined />
            ))}
          </div>
        </section>
      )}
      {past.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-lg font-bold">Past campaigns</h2>
          <div className="grid gap-5 md:grid-cols-2">
            {past.map((p) => (
              <CampaignCard key={p.campaignId} campaign={p.campaign} joined />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function CampaignsListSkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="card p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-xl bg-surface-2" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-36 animate-pulse rounded bg-surface-2" />
              <div className="h-3 w-24 animate-pulse rounded bg-surface-2" />
            </div>
          </div>
          <div className="h-3 w-full animate-pulse rounded bg-surface-2" />
        </div>
      ))}
    </div>
  );
}

export default async function CampaignsPage() {
  const user = await requireUser();

  return (
    <>
      <PageHeader
        title="My Campaigns"
        subtitle="Every campaign you've joined, with your earnings so far."
      />
      <Suspense fallback={<CampaignsListSkeleton />}>
        <CampaignsList userId={user.id!} />
      </Suspense>
    </>
  );
}
