"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Campaign = { id: string; title: string; brand: string };

export function SubmissionCampaignFilter({ campaigns }: { campaigns: Campaign[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("campaignId") ?? "";

  const update = (campaignId: string) => {
    const p = new URLSearchParams(params.toString());
    if (campaignId) p.set("campaignId", campaignId);
    else p.delete("campaignId");
    router.push(`/admin/submissions?${p.toString()}`);
  };

  return (
    <select
      value={current}
      onChange={(e) => update(e.target.value)}
      className="input max-w-xs text-sm"
    >
      <option value="">All campaigns</option>
      {campaigns.map((c) => (
        <option key={c.id} value={c.id}>{c.brand} — {c.title}</option>
      ))}
    </select>
  );
}
