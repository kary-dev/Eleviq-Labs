"use client";

import { useOptimistic, useTransition } from "react";
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
  clip_approved: "bg-emerald-500",
  proof_approved: "bg-emerald-500",
  account_approved: "bg-emerald-500",
  payout_sent: "bg-accent",
  campaign_live: "bg-accent",
  clip_rejected: "bg-rose-500",
  proof_rejected: "bg-rose-500",
  account_rejected: "bg-rose-500",
  payout_rejected: "bg-rose-500",
};

type Action = { type: "all" } | { type: "one"; id: string };

export function NotificationsClient({ notifications }: { notifications: Notif[] }) {
  const [, start] = useTransition();
  const [items, dispatch] = useOptimistic(
    notifications,
    (state: Notif[], action: Action) => {
      if (action.type === "all") return state.map((n) => ({ ...n, read: true }));
      return state.map((n) => (n.id === action.id ? { ...n, read: true } : n));
    }
  );

  const unread = items.filter((n) => !n.read).length;

  function handleMarkAll() {
    start(async () => {
      dispatch({ type: "all" });
      await markAllNotificationsRead();
    });
  }

  function handleDismiss(id: string) {
    start(async () => {
      dispatch({ type: "one", id });
      await markNotificationRead(id);
    });
  }

  return (
    <div>
      {unread > 0 && (
        <div className="mb-4 flex justify-end">
          <button onClick={handleMarkAll} className="btn-ghost text-sm">
            Mark all as read
          </button>
        </div>
      )}

      <div className="card divide-y divide-border">
        {items.map((n) => (
          <NotifRow key={n.id} n={n} onDismiss={() => handleDismiss(n.id)} />
        ))}
      </div>
    </div>
  );
}

function NotifRow({ n, onDismiss }: { n: Notif; onDismiss: () => void }) {
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
          onClick={(e) => { e.preventDefault(); onDismiss(); }}
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
