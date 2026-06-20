"use client";

import { useTransition, useState } from "react";
import { approveAccount, rejectAccount } from "@/app/admin/actions";
import { PLATFORMS, PlatformKey } from "@/lib/platforms";
import { compact } from "@/lib/format";
import { CheckIcon, XIcon } from "@/components/icons";

type ReviewAccount = {
  id: string;
  platform: string;
  handle: string;
  url: string | null;
  avatarUrl: string | null;
  followers: number | null;
  isProfessional: boolean | null;
  method: string | null;
  userName: string | null;
  userEmail: string | null;
};

export function AccountReviewRow({ account }: { account: ReviewAccount }) {
  const [, start] = useTransition();
  const [dismissed, setDismissed] = useState(false);
  const { Icon, label } = PLATFORMS[account.platform as PlatformKey] ?? PLATFORMS.INSTAGRAM;

  if (dismissed) return null;

  return (
    <div className="flex items-center gap-4 px-4 py-3.5">
      <span title={label} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-surface-2 text-muted">
        <Icon className="h-[18px] w-[18px]" />
      </span>

      <div className="min-w-0 flex-1">
        <a
          href={account.url ?? "#"}
          target="_blank"
          rel="noreferrer"
          className="block truncate text-sm font-semibold hover:text-accent"
        >
          @{account.handle}
        </a>
        <p className="truncate text-xs text-muted">
          {account.userName ?? "—"} · {account.userEmail ?? "—"}
        </p>
        <p className="truncate text-[11px] text-muted">
          {label}
          {account.followers != null ? ` · ${compact(account.followers)} followers` : ""}
          {account.isProfessional ? " · Professional" : ""}
          {account.method ? ` · ${account.method === "bio" ? "Bio code" : "Instant"}` : ""}
        </p>
      </div>

      <div className="flex shrink-0 gap-2">
        <button
          onClick={() => { setDismissed(true); start(() => approveAccount(account.id)); }}
          className="btn-accent !px-3 !py-2"
          title="Approve"
        >
          <CheckIcon className="h-4 w-4" /> <span className="hidden sm:inline">Approve</span>
        </button>
        <button
          onClick={() => { setDismissed(true); start(() => rejectAccount(account.id)); }}
          className="btn-ghost !px-3 !py-2 hover:!text-rose-400"
          title="Reject"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
