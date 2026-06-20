import { Suspense } from "react";
import { requireUser } from "@/lib/session";
import { PageHeader, EmptyState } from "@/components/ui";
import { NotificationsClient } from "@/components/NotificationsClient";
import { ClockIcon } from "@/components/icons";
import { cachedUserNotifications } from "@/lib/queries";

async function NotificationsContent({ userId }: { userId: string }) {
  const notifications = await cachedUserNotifications(userId)();

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={<ClockIcon className="h-7 w-7" />}
        title="No notifications yet"
        body="Activity updates will appear here."
      />
    );
  }

  return <NotificationsClient notifications={notifications} />;
}

function NotificationsSkeleton() {
  return (
    <div className="card divide-y divide-border">
      {[...Array(7)].map((_, i) => (
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

export default async function NotificationsPage() {
  const user = await requireUser();

  return (
    <>
      <PageHeader title="Notifications" subtitle="Updates from Eleviq Labs." />
      <Suspense fallback={<NotificationsSkeleton />}>
        <NotificationsContent userId={user.id!} />
      </Suspense>
    </>
  );
}
