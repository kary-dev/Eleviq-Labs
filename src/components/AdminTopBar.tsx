"use client";

import React from "react";
import Link from "next/link";
import { BellIcon } from "@/components/icons";

export function AdminTopBar({ badge }: { badge?: React.ReactNode }) {
  return (
    <div className="fixed right-4 top-2.5 z-50 hidden items-center lg:flex lg:right-6 lg:top-3.5">
      <Link
        href="/admin/notifications"
        className="relative flex h-11 w-11 items-center justify-center rounded-xl text-fg/70 transition hover:bg-surface-2 hover:text-fg"
        title="Notifications"
      >
        <BellIcon className="h-6 w-6" />
        {badge}
      </Link>
    </div>
  );
}
