import type { ReactNode } from "react";
import { StatusPill } from "@/components/ui";
import { PLATFORMS, PlatformKey } from "@/lib/platforms";
import { money, compact, date } from "@/lib/format";

export type SubmissionData = {
  id: string;
  platform: string;
  url: string;
  title: string | null;
  views: number;
  status: string;
  payout: number;
  rejectReason: string | null;
  createdAt: Date | string;
  viewsDisputed?: boolean;
  campaign?: { title: string; brand: string };
  user?: { name: string | null; email: string | null; image: string | null };
};

export function SubmissionRow({
  s,
  showCampaign = true,
  actions,
  footerAction,
}: {
  s: SubmissionData;
  showCampaign?: boolean;
  actions?: ReactNode;
  footerAction?: ReactNode;
}) {
  const { Icon, label } = PLATFORMS[s.platform as PlatformKey] ?? PLATFORMS.TIKTOK;
  return (
    <div>
      <div className="flex items-center gap-3 px-4 py-3.5">
        <span title={label} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-surface-2 text-muted">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <a href={s.url} target="_blank" rel="noreferrer" className="block truncate text-sm font-semibold hover:text-accent">
            {s.title || s.url}
          </a>
          <p className="truncate text-xs text-muted">
            {showCampaign && s.campaign ? `${s.campaign.brand} · ${s.campaign.title} · ` : ""}
            {date(s.createdAt)}
            {s.status === "REJECTED" && s.rejectReason ? ` · ${s.rejectReason}` : ""}
          </p>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold">{compact(s.views)}</p>
            <p className="text-[11px] text-muted">views</p>
          </div>
          <p className="text-sm font-semibold text-accent">{money(s.payout)}</p>
          <StatusPill status={s.status} />
          {actions}
        </div>
      </div>
      {footerAction && <div className="pb-3 pl-[64px] pr-4">{footerAction}</div>}
    </div>
  );
}
