"use client";

import { useState } from "react";
import { CampaignCard } from "./CampaignCard";

type Campaign = {
  id: string;
  title: string;
  brand: string;
  description: string;
  thumbnail: string | null;
  status: string;
  ratePerThousand: number;
  budget: number;
  totalBudgetUsed: number;
  budgetPaused: boolean;
  minViews: number;
  platforms: string;
  endsAt: Date | string | null;
  createdAt: Date | string;
};

const PLATFORMS = ["INSTAGRAM", "YOUTUBE", "TIKTOK", "X"];

export function CampaignSearch({
  campaigns,
  joinedIds,
}: {
  campaigns: Campaign[];
  joinedIds: Set<string>;
}) {
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState("ALL");

  const filtered = campaigns.filter((c) => {
    const matchesQuery =
      !query ||
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.brand.toLowerCase().includes(query.toLowerCase());
    const matchesPlatform =
      platform === "ALL" || c.platforms.split(",").includes(platform);
    return matchesQuery && matchesPlatform;
  });

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search campaigns…"
          className="input w-full sm:flex-1 sm:min-w-48"
        />
        <div className="flex flex-wrap gap-1.5">
          {["ALL", ...PLATFORMS].map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`btn-ghost text-sm ${platform === p ? "!bg-accent/15 !text-accent ring-1 ring-accent/25" : ""}`}
            >
              {p === "ALL" ? "All" : p.charAt(0) + p.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted">No campaigns match your filters.</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {filtered.map((c) => (
            <CampaignCard key={c.id} campaign={c} joined={joinedIds.has(c.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
