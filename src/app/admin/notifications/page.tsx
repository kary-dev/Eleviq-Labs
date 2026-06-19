import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";
import { AdminNotificationsClient } from "@/components/AdminNotificationsClient";
import { BellIcon } from "@/components/icons";

export default async function AdminNotificationsPage() {
  const user = await requireAdmin();

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <>
      <PageHeader title="Notifications" subtitle="Activity alerts from creators." />
      {notifications.length === 0 ? (
        <EmptyState icon={<BellIcon className="h-7 w-7" />} title="No notifications yet" body="You'll be notified when creators submit clips, accounts, proofs, or payout requests." />
      ) : (
        <AdminNotificationsClient notifications={notifications} />
      )}
    </>
  );
}
