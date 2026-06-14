"use client";

import { useTransition } from "react";
import { joinCampaign } from "@/app/(creator)/actions";
import { PlusIcon } from "@/components/icons";

export function JoinButton({ campaignId }: { campaignId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => start(() => joinCampaign(campaignId))}
      disabled={pending}
      className="btn-accent w-full py-2.5"
    >
      {pending ? (
        "Joining…"
      ) : (
        <>
          <PlusIcon className="h-4 w-4" /> Join Campaign
        </>
      )}
    </button>
  );
}
