"use client";

import Link from "next/link";
import { BellIcon } from "@/components/icons";

export function AdminTopBar({ unreadCount = 0 }: { unreadCount?: number }) {
  return (
    <div className="fixed right-4 top-2.5 z-50 hidden items-center lg:flex lg:right-6 lg:top-3.5">
      <Link
        href="/admin/notifications"
        className="relative flex h-11 w-11 items-center justify-center rounded-xl text-fg/70 transition hover:bg-surface-2 hover:text-fg"
        title="Notifications"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Link>
    </div>
  );
}
