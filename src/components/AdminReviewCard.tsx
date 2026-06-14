"use client";

import { useState, useTransition } from "react";
import { approveSubmission, rejectSubmission, updateViews } from "@/app/admin/actions";
import { PLATFORMS, PlatformKey } from "@/lib/platforms";
import { money, estPayout, compact, date } from "@/lib/format";
import { CheckIcon, XIcon, LinkIcon } from "@/components/icons";

type Sub = {
  id: string;
  platform: string;
  url: string;
  title: string | null;
  views: number;
  createdAt: Date | string;
  campaign: { title: string; brand: string; ratePerThousand: number };
  user: { name: string | null; email: string | null; image: string | null };
};

export function AdminReviewCard({ sub }: { sub: Sub }) {
  const { Icon, label } = PLATFORMS[sub.platform as PlatformKey] ?? PLATFORMS.TIKTOK;
  const [views, setViews] = useState(sub.views);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();
  const [resolved, setResolved] = useState<null | "APPROVED" | "REJECTED">(null);

  const approve = () =>
    start(async () => {
      if (views !== sub.views) await updateViews(sub.id, views);
      await approveSubmission(sub.id);
      setResolved("APPROVED");
    });

  const reject = () =>
    start(async () => {
      await rejectSubmission(sub.id, reason);
      setResolved("REJECTED");
    });

  if (resolved) {
    return (
      <div className={`card flex items-center gap-3 p-4 ${resolved === "APPROVED" ? "text-emerald-400" : "text-rose-400"}`}>
        {resolved === "APPROVED" ? <CheckIcon className="h-5 w-5" /> : <XIcon className="h-5 w-5" />}
        <span className="text-sm font-semibold">
          {sub.title || sub.url} {resolved === "APPROVED" ? "approved" : "rejected"}
        </span>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-start gap-3">
        {sub.user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sub.user.image} alt="" className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="grid h-10 w-10 place-items-center rounded-full bg-accent/15 text-sm font-bold text-accent">
            {(sub.user.name ?? "E").slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{sub.user.name ?? "Creator"}</p>
          <p className="truncate text-xs text-muted">{sub.user.email}</p>
        </div>
        <span className="pill bg-surface-2 text-muted ring-1 ring-border">
          <Icon className="h-3.5 w-3.5" /> {label}
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-surface-2/50 p-3">
        <p className="text-xs text-muted">{sub.campaign.brand} · {sub.campaign.title} · {date(sub.createdAt)}</p>
        <a href={sub.url} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1.5 text-sm font-medium text-accent hover:underline">
          <LinkIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">{sub.title || sub.url}</span>
        </a>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <label className="label">Verified views</label>
          <input
            type="number"
            min={0}
            value={views || ""}
            onChange={(e) => setViews(parseInt(e.target.value) || 0)}
            className="input"
          />
        </div>
        <div>
          <label className="label">Payout</label>
          <div className="input flex items-center font-display font-bold text-accent">
            {money(estPayout(views, sub.campaign.ratePerThousand))}
          </div>
        </div>
      </div>

      {rejecting ? (
        <div className="mt-4 space-y-2">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for rejection (shown to creator)"
            className="input"
          />
          <div className="flex gap-2">
            <button disabled={pending} onClick={reject} className="btn bg-rose-500/90 text-white hover:bg-rose-500 flex-1">
              Confirm rejection
            </button>
            <button onClick={() => setRejecting(false)} className="btn-ghost">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex gap-2">
          <button disabled={pending} onClick={approve} className="btn-accent flex-1">
            <CheckIcon className="h-4 w-4" /> {pending ? "…" : "Approve"}
          </button>
          <button disabled={pending} onClick={() => setRejecting(true)} className="btn-ghost flex-1">
            <XIcon className="h-4 w-4" /> Reject
          </button>
        </div>
      )}
    </div>
  );
}
