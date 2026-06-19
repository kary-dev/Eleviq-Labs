import Link from "next/link";
import { AddClipDialog } from "@/components/AddClipDialog";
import { JoinButton } from "@/components/JoinButton";
import { StatusPill } from "@/components/ui";
import { PLATFORMS, PlatformKey } from "@/lib/platforms";
import { money, compact } from "@/lib/format";

export type CampaignCardData = {
  id: string;
  title: string;
  brand: string;
  description: string;
  thumbnail: string | null;
  status: string;
  ratePerThousand: number;
  budget: number;
  totalBudgetUsed: number;
  minViews: number;
  platforms: string;
  endsAt?: Date | string | null;
};

function daysLeft(endsAt: Date | string | null | undefined): number | null {
  if (!endsAt) return null;
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return null;
  return Math.ceil(ms / 86_400_000);
}

export function CampaignCard({
  campaign,
  joined,
}: {
  campaign: CampaignCardData;
  joined?: boolean;
}) {
  const pct = Math.min(100, Math.round((campaign.totalBudgetUsed / campaign.budget) * 100));
  const plats = campaign.platforms.split(",").filter(Boolean) as PlatformKey[];
  const ended = campaign.status === "ENDED";
  const days = daysLeft(campaign.endsAt);

  return (
    <div className="card relative flex flex-col p-5 transition hover:border-accent/40">
      {/* Stretched link overlay: makes the whole card clickable without an
          onClick handler (this is a Server Component). Buttons below sit above
          it via relative z-10 so they stay independently clickable. */}
      <Link
        href={`/campaigns/${campaign.id}`}
        aria-label={`Open ${campaign.title}`}
        className="absolute inset-0 z-0"
      />
      <div className="flex items-start gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-border bg-surface-2 text-2xl">
          {campaign.thumbnail ?? "🎬"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">{campaign.brand}</p>
            <StatusPill status={campaign.status} />
            {joined && <span className="pill bg-accent/10 text-accent">Joined</span>}
            {!ended && days !== null && (
              <span className={`pill ${days <= 3 ? "bg-rose-500/15 text-rose-400" : days <= 7 ? "bg-amber-500/15 text-amber-400" : "bg-surface-2 text-muted"}`}>
                {days}d left
              </span>
            )}
          </div>
          <h3 className="mt-0.5 truncate font-display text-lg font-bold">{campaign.title}</h3>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-lg font-bold text-accent">{money(campaign.ratePerThousand)}</p>
          <p className="text-[11px] text-muted">/ 1k views</p>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-muted">{campaign.description}</p>

      <div className="mt-4 flex items-center gap-2">
        {plats.map((p) => {
          const { Icon, label } = PLATFORMS[p];
          return (
            <span key={p} title={label} className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-surface-2 text-muted">
              <Icon className="h-4 w-4" />
            </span>
          );
        })}
        {campaign.minViews > 0 && (
          <span className="ml-auto text-xs text-muted">Min {compact(campaign.minViews)} views</span>
        )}
      </div>

      {/* Budget bar */}
      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs text-muted">
          <span>Budget used</span>
          <span>{money(campaign.totalBudgetUsed)} / {money(campaign.budget)}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="relative z-10 mt-5">
        {ended ? (
          <button disabled className="btn-soft w-full">Campaign ended</button>
        ) : joined ? (
          <AddClipDialog campaign={campaign} trigger="block" />
        ) : (
          <JoinButton campaignId={campaign.id} />
        )}
      </div>
    </div>
  );
}
