"use client";

import { useTransition } from "react";
import { markAllNotificationsRead, markNotificationRead } from "@/app/(creator)/actions";
import { date } from "@/lib/format";

type Notif = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  link: string | null;
  createdAt: Date | string;
};

const TYPE_COLOR: Record<string, string> = {
  clip_submitted: "bg-accent",
  account_pending: "bg-amber-400",
  proof_pending: "bg-amber-400",
  payout_request: "bg-emerald-500",
  clip_approved: "bg-emerald-500",
  clip_rejected: "bg-rose-500",
};

export function AdminNotificationsClient({ notifications }: { notifications: Notif[] }) {
  const [pending, start] = useTransition();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div>
      {unread > 0 && (
        <div className="mb-4 flex justify-end">
          <button
            disabled={pending}
            onClick={() => start(() => markAllNotificationsRead())}
            className="btn-ghost text-sm"
          >
            Mark all as read
          </button>
        </div>
      )}

      <div className="card divide-y divide-border">
        {notifications.map((n) => (
          <AdminNotifRow key={n.id} n={n} />
        ))}
      </div>
    </div>
  );
}

function AdminNotifRow({ n }: { n: Notif }) {
  const [, start] = useTransition();
  const dot = TYPE_COLOR[n.type] ?? "bg-muted";

  const inner = (
    <div className={`flex gap-3 px-4 py-3.5 transition ${!n.read ? "bg-accent/5" : ""}`}>
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot} ${n.read ? "opacity-30" : ""}`} />
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${n.read ? "text-muted" : ""}`}>{n.title}</p>
        {n.body && <p className="mt-0.5 text-sm text-muted">{n.body}</p>}
        <p className="mt-1 text-xs text-muted">{date(n.createdAt)}</p>
      </div>
      {!n.read && (
        <button
          onClick={(e) => { e.preventDefault(); start(() => markNotificationRead(n.id)); }}
          className="shrink-0 self-start text-xs text-muted hover:text-fg"
        >
          Dismiss
        </button>
      )}
    </div>
  );

  if (n.link) {
    return <a href={n.link} className="block hover:bg-surface-2/50">{inner}</a>;
  }
  return <div>{inner}</div>;
}
