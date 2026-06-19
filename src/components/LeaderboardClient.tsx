"use client";

import { useTransition } from "react";
import { setLeaderboardOptIn } from "@/app/(creator)/actions";
import { money, compact } from "@/lib/format";

type Leader = {
  id: string;
  name: string;
  image: string | null;
  tier: string;
  views: number;
  earned: number;
};

const TIER_STYLE: Record<string, string> = {
  GOLD: "bg-yellow-500/15 text-yellow-400",
  SILVER: "bg-slate-400/15 text-slate-400",
  BRONZE: "bg-orange-500/15 text-orange-400",
};

const RANK_STYLE = ["text-yellow-400 font-bold", "text-slate-400 font-bold", "text-orange-400 font-bold"];

export function LeaderboardClient({
  leaders,
  currentUserId,
  optedIn,
}: {
  leaders: Leader[];
  currentUserId: string;
  optedIn: boolean;
}) {
  const [pending, start] = useTransition();

  return (
    <div>
      {/* Opt-in toggle */}
      <div className="mb-6 flex items-center justify-between rounded-xl border border-border bg-surface-2/50 px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Appear on leaderboard</p>
          <p className="text-xs text-muted">Opt in to show your rank publicly.</p>
        </div>
        <button
          disabled={pending}
          onClick={() => start(() => setLeaderboardOptIn(!optedIn))}
          className={`relative h-6 w-11 rounded-full transition-colors ${optedIn ? "bg-accent" : "bg-surface-2 ring-1 ring-border"}`}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${optedIn ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>

      <div className="card divide-y divide-border">
        {leaders.map((creator, i) => {
          const isMe = creator.id === currentUserId;
          return (
            <div key={creator.id} className={`flex items-center gap-4 px-4 py-3.5 ${isMe ? "bg-accent/5" : ""}`}>
              <span className={`w-6 shrink-0 text-center text-sm ${RANK_STYLE[i] ?? "text-muted"}`}>
                {i + 1}
              </span>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent overflow-hidden">
                {creator.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={creator.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  creator.name.slice(0, 1).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold">{creator.name}{isMe ? " (you)" : ""}</p>
                  <span className={`pill shrink-0 text-[10px] ${TIER_STYLE[creator.tier] ?? ""}`}>{creator.tier}</span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold">{compact(creator.views)}</p>
                <p className="text-xs text-muted">{money(creator.earned)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
