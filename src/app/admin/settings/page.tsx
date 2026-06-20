import { requireAdmin } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { getSiteSettings } from "@/lib/queries";
import { DemographicsToggleForm } from "@/components/DemographicsToggleForm";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getSiteSettings();

  return (
    <>
      <PageHeader title="Site Settings" subtitle="Global toggles that affect all creators." />

      <div className="card divide-y divide-border">
        <div className="flex items-center justify-between gap-6 px-5 py-4">
          <div className="min-w-0">
            <p className="font-semibold">Demographic Verification</p>
            <p className="mt-0.5 text-sm text-muted">
              When enabled, creators see the Demographic Verification page and can submit audience screenshots for review.
            </p>
          </div>
          <DemographicsToggleForm enabled={settings?.demographicVerificationEnabled ?? false} />
        </div>
      </div>
    </>
  );
}
