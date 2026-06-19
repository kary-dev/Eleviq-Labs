"use client";

import { useState, useTransition } from "react";
import { updateViews, resolveViewDispute } from "@/app/admin/actions";
import { PLATFORMS, PlatformKey } from "@/lib/platforms";
import { compact } from "@/lib/format";

type Dispute = {
  id: string;
  platform: string;
  url: string;
  title: string | null;
  views: number;
  claimedViews: number | null;
  disputeNote: string | null;
  disputeScreenshot: string | null;
  status: string;
  creator: string;
  campaign: string;
};

export function DisputeRow({ sub }: { sub: Dispute }) {
  const { Icon, label } = PLATFORMS[sub.platform as PlatformKey] ?? PLATFORMS.INSTAGRAM;
  const [views, setViews] = useState(String(sub.claimedViews ?? sub.views));
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="card flex items-center gap-2 p-4 text-sm text-emerald-400">
        Dispute resolved for {sub.title || sub.url}.
      </div>
    );
  }

  const setCorrect = () => {
    const n = parseInt(views.replace(/[^0-9]/g, ""), 10);
    if (Number.isNaN(n)) return;
    start(async () => { await updateViews(sub.id, n); setDone(true); });
  };
  const dismiss = () => start(async () => { await resolveViewDispute(sub.id); setDone(true); });

  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <span title={label} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-surface-2 text-muted">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <a href={sub.url} target="_blank" rel="noreferrer" className="block truncate text-sm font-semibold hover:text-accent">
            {sub.title || sub.url}
          </a>
          <p className="truncate text-xs text-muted">{sub.creator} &middot; {sub.campaign} &middot; {sub.status}</p>
          <p className="mt-1 text-xs">
            <span className="text-muted">Fetched: </span><span className="font-semibold">{compact(sub.views)}</span>
            {sub.claimedViews != null && (
              <>
                <span className="text-muted"> &middot; Creator says: </span>
                <span className="font-semibold text-amber-400">{compact(sub.claimedViews)}</span>
              </>
            )}
          </p>
          {sub.disputeNote && (
            <p className="mt-1 text-xs text-muted">&quot;{sub.disputeNote}&quot;</p>
          )}
          {sub.disputeScreenshot && (
            <a href={sub.disputeScreenshot} target="_blank" rel="noreferrer" className="mt-2 block">
              <img
                src={sub.disputeScreenshot}
                alt="Insights screenshot"
                className="max-h-48 rounded-lg border border-border object-contain"
              />
              <span className="mt-0.5 block text-[10px] text-muted">View full screenshot</span>
            </a>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          value={views}
          onChange={(e) => setViews(e.target.value)}
          inputMode="numeric"
          className="input !py-1.5 text-sm sm:max-w-[160px]"
          placeholder="Correct views"
        />
        <button disabled={pending} onClick={setCorrect} className="btn-accent !py-1.5 text-xs">
          {pending ? "Saving..." : "Set correct views"}
        </button>
        <button disabled={pending} onClick={dismiss} className="btn-ghost !py-1.5 text-xs">
          Fetched was right (dismiss)
        </button>
      </div>
    </div>
  );
}
