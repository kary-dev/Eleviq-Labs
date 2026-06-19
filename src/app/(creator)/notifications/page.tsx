import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";
import { NotificationsClient } from "@/components/NotificationsClient";
import { ClockIcon } from "@/components/icons";

export default async function NotificationsPage() {
  const user = await requireUser();

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <>
      <PageHeader title="Notifications" subtitle="Updates from Eleviq Labs." />
      {notifications.length === 0 ? (
        <EmptyState icon={<ClockIcon className="h-7 w-7" />} title="No notifications yet" body="Activity updates will appear here." />
      ) : (
        <NotificationsClient notifications={notifications} />
      )}
    </>
  );
}
