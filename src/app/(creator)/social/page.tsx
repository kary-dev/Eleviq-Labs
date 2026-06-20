import { Suspense } from "react";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { SocialVerifyWizard } from "@/components/SocialVerifyWizard";
import { cachedUserSocialAccounts } from "@/lib/queries";

// Instagram scraping (Apify sync runs) can take longer than the default limit.
export const maxDuration = 60;

async function SocialAccounts({ userId }: { userId: string }) {
  const accounts = await cachedUserSocialAccounts(userId)();
  return <SocialVerifyWizard accounts={accounts} />;
}

function SocialSkeleton() {
  return (
    <div className="card divide-y divide-border">
      {[0, 1].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <div className="h-10 w-10 animate-pulse rounded-full bg-surface-2" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 animate-pulse rounded bg-surface-2" />
            <div className="h-3 w-24 animate-pulse rounded bg-surface-2" />
          </div>
          <div className="h-8 w-20 animate-pulse rounded-xl bg-surface-2" />
        </div>
      ))}
    </div>
  );
}

export default async function SocialPage() {
  const user = await requireUser();

  return (
    <>
      <PageHeader
        title="Social Verification"
        subtitle="Verify your social media accounts to start submitting content."
      />

      <Suspense fallback={<SocialSkeleton />}>
        <SocialAccounts userId={user.id} />
      </Suspense>

      <div className="card mt-8 p-5">
        <h3 className="font-semibold">Why we ask you to link accounts</h3>
        <ul className="mt-3 space-y-1.5 text-sm text-muted">
          <li>• Confirms the handles you post from really belong to you</li>
          <li>• Keeps copycats and fake submissions out of campaigns</li>
          <li>• Unlocks clip submissions once at least one account is linked</li>
          <li>• Link as many handles as you like across each platform</li>
        </ul>
      </div>
    </>
  );
}
