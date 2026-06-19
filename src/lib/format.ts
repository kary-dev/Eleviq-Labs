export function money(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0);
}

export function compact(n: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n || 0);
}

export function date(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Estimated payout for a clip given views and a per-1k rate */
export function estPayout(views: number, ratePerThousand: number): number {
  return Math.round(((views / 1000) * ratePerThousand) * 100) / 100;
}

/** Views a creator must reach (per campaign) before they can be paid out. */
export const PAYOUT_VIEW_THRESHOLD = 20000;

/** Progress toward the per-campaign payout threshold. */
export function payoutProgress(views: number) {
  const v = Math.max(0, views || 0);
  return {
    views: v,
    threshold: PAYOUT_VIEW_THRESHOLD,
    pct: Math.min(100, Math.round((v / PAYOUT_VIEW_THRESHOLD) * 100)),
    eligible: v >= PAYOUT_VIEW_THRESHOLD,
    remaining: Math.max(0, PAYOUT_VIEW_THRESHOLD - v),
  };
}
