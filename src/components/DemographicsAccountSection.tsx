"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DemographicWizard } from "./DemographicWizard";
import { StatusPill } from "./ui";
import {
  InstagramIcon,
  YoutubeIcon,
  TiktokIcon,
  XSocialIcon,
  ChartIcon,
} from "./icons";

type Account = {
  id: string;
  platform: string;
  handle: string;
  followers: number | null;
  verificationStatus: string;
};

type ProofInfo = {
  status: string;
  method: string | null;
};

const PLATFORM_ICON: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  INSTAGRAM: InstagramIcon,
  YOUTUBE: YoutubeIcon,
  TIKTOK: TiktokIcon,
  X: XSocialIcon,
};

const PLATFORM_LABEL: Record<string, string> = {
  INSTAGRAM: "Instagram",
  YOUTUBE: "YouTube",
  TIKTOK: "TikTok",
  X: "X (Twitter)",
};

const ACCT_STATUS_LABEL: Record<string, string> = {
  NONE: "Not started",
  PENDING_REVIEW: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

export function DemographicsAccountSection({
  accounts,
  proofMap,
}: {
  accounts: Account[];
  proofMap: Record<string, ProofInfo>;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [, startRefresh] = useTransition();

  function handleSelect(id: string) {
    setSelectedId(selectedId === id ? null : id);
  }

  function handleDone() {
    startRefresh(() => {
      router.refresh();
    });
  }

  const selectedAccount = accounts.find((a) => a.id === selectedId);

  return (
    <div className="space-y-4">
      {/* Account list */}
      <div className="card divide-y divide-border">
        {accounts.map((acct) => {
          const Icon = PLATFORM_ICON[acct.platform] ?? ChartIcon;
          const proof = proofMap[acct.id];
          const isOpen = selectedId === acct.id;

          return (
            <div key={acct.id}>
              <div className="flex items-center gap-3 px-4 py-3.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-surface-2 text-muted">
                  <Icon className="h-[18px] w-[18px]" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">@{acct.handle}</p>
                  <p className="text-xs text-muted">
                    {PLATFORM_LABEL[acct.platform] ?? acct.platform}
                    {acct.followers != null
                      ? ` · ${acct.followers.toLocaleString()} followers`
                      : ""}
                  </p>
                </div>

                {/* Demographic proof status */}
                <div className="flex shrink-0 items-center gap-2">
                  {proof ? (
                    <StatusPill status={proof.status} />
                  ) : (
                    <span className="pill bg-surface-2 text-muted ring-1 ring-border">
                      Not submitted
                    </span>
                  )}
                  {isOpen ? (
                    <button onClick={() => handleSelect(acct.id)} className="btn-ghost text-sm !text-accent">
                      Close
                    </button>
                  ) : !proof || proof.status === "REJECTED" ? (
                    <button onClick={() => handleSelect(acct.id)} className="btn-ghost text-sm">
                      {proof?.status === "REJECTED" ? "Resubmit" : "Verify"}
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Inline wizard for this account */}
              {isOpen && (
                <div className="border-t border-border bg-surface-2/40 px-4 pb-5 pt-4">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted">
                    Demographic verification for @{acct.handle}
                  </p>
                  <DemographicWizard accountId={acct.id} onDone={handleDone} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {accounts.length === 0 && (
        <div className="card px-5 py-6 text-sm text-muted">
          No accounts connected yet.{" "}
          <a href="/social" className="text-accent hover:underline">
            Go to Social Verification
          </a>{" "}
          to add one.
        </div>
      )}
    </div>
  );
}
