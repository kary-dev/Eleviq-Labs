"use client";

import { useTransition } from "react";
import { refreshCampaignClips } from "@/app/(creator)/actions";
import { RefreshIcon } from "@/components/icons";

export function RefreshClipsButton({ campaignId }: { campaignId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => start(() => refreshCampaignClips(campaignId))}
      disabled={pending}
      className="btn-ghost"
    >
      <RefreshIcon className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
      {pending ? "Refreshing live views…" : "Refresh live views"}
    </button>
  );
}
