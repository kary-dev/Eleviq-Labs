import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { SocialVerifyWizard } from "@/components/SocialVerifyWizard";
import { cachedUserSocialAccounts } from "@/lib/queries";

// Instagram scraping (Apify sync runs) can take longer than the default limit.
export const maxDuration = 60;

export default async function SocialPage() {
  const user = await requireUser();
  const accounts = await cachedUserSocialAccounts(user.id)();

  return (
    <>
      <PageHeader
        title="Social Verification"
        subtitle="Verify your social media accounts to start submitting content."
      />

      <SocialVerifyWizard accounts={accounts} />

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
