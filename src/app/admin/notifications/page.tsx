import { Suspense } from "react";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";
import { AdminNotificationsClient } from "@/components/AdminNotificationsClient";
import { BellIcon } from "@/components/icons";

async function NotificationsContent({ userId }: { userId: string }) {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={<BellIcon className="h-7 w-7" />}
        title="No notifications yet"
        body="You'll be notified when creators submit clips, accounts, proofs, or payout requests."
      />
    );
  }

  return <AdminNotificationsClient notifications={notifications} />;
}

function NotificationsSkeleton() {
  return (
    <div className="card divide-y divide-border">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-3.5">
          <div className="h-9 w-9 animate-pulse rounded-xl bg-surface-2 shrink-0" />
          <div className="flex-1 space-y-2 pt-0.5">
            <div className="h-4 w-48 animate-pulse rounded bg-surface-2" />
            <div className="h-3 w-64 animate-pulse rounded bg-surface-2" />
            <div className="h-3 w-20 animate-pulse rounded bg-surface-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function AdminNotificationsPage() {
  const user = await requireAdmin();

  return (
    <>
      <PageHeader title="Notifications" subtitle="Activity alerts from creators." />
      <Suspense fallback={<NotificationsSkeleton />}>
        <NotificationsContent userId={user.id!} />
      </Suspense>
    </>
  );
}
