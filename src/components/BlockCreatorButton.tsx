"use client";

import { useTransition } from "react";
import { blockCreator, unblockCreator } from "@/app/admin/actions";

export function BlockCreatorButton({ userId, banned }: { userId: string; banned: boolean }) {
  const [pending, start] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => start(() => banned ? unblockCreator(userId) : blockCreator(userId))}
      className={`btn-ghost text-sm ${banned ? "!text-emerald-400 hover:!text-emerald-300" : "!text-rose-400 hover:!text-rose-300"}`}
    >
      {pending ? "…" : banned ? "Unban creator" : "Ban creator"}
    </button>
  );
}
