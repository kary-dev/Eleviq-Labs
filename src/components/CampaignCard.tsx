import { AddClipDialog } from "@/components/AddClipDialog";
import { JoinButton } from "@/components/JoinButton";
import { StatusPill } from "@/components/ui";
import { PLATFORMS, PlatformKey } from "@/lib/platforms";
import { money, compact, payoutProgress } from "@/lib/format";

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
};

export function CampaignCard({
  campaign,
  joined,
  views = 0,
}: {
  campaign: CampaignCardData;
  joined?: boolean;
  /** The creator's approved views on this campaign (drives payout eligibility). */
  views?: number;
}) {
  const pct = Math.min(100, Math.round((campaign.totalBudgetUsed / campaign.budget) * 100));
  const plats = campaign.platforms.split(",").filter(Boolean) as PlatformKey[];
  const ended = campaign.status === "ENDED";
  const prog = payoutProgress(views);

  return (
    <div className="card flex flex-col p-5">
      <div className="flex items-start gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-border bg-surface-2 text-2xl">
          {campaign.thumbnail ?? "🎬"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">{campaign.brand}</p>
            <StatusPill status={campaign.status} />
            {joined && <span className="pill bg-accent/10 text-accent">Joined</span>}
          </div>
          <h3 className="mt-0.5 truncate font-display text-lg font-bold">{campaign.title}</h3>
        </div>
        <div className="text-right">
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

      {/* Payout progress — eligible at 20,000 views on this campaign */}
      {joined && (
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-muted">Payout progress</span>
            <span className={prog.eligible ? "font-medium text-emerald-400" : "text-muted"}>
              {prog.views.toLocaleString("en-US")} / {prog.threshold.toLocaleString("en-US")} views
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-2">
            <div
              className={`h-full rounded-full transition-all ${prog.eligible ? "bg-emerald-500" : "bg-accent"}`}
              style={{ width: `${prog.pct}%` }}
            />
          </div>
          <p className={`mt-1 text-xs ${prog.eligible ? "text-emerald-400" : "text-muted"}`}>
            {prog.eligible
              ? "✓ Eligible for payout"
              : `${prog.remaining.toLocaleString("en-US")} more views to unlock payout`}
          </p>
        </div>
      )}

      <div className="mt-5">
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
