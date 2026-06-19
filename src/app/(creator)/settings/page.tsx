import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { SettingsForm } from "@/components/SettingsForm";

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your profile and account preferences." />
      <SettingsForm name={user.name ?? ""} email={user.email ?? ""} image={user.image ?? null} />
    </>
  );
}
