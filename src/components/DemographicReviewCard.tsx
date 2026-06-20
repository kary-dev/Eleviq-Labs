"use client";

import { useTransition, useState } from "react";
import { approveDemographicProof, rejectDemographicProof } from "@/app/admin/actions";
import { date } from "@/lib/format";
import { CheckIcon, XIcon, EyeIcon } from "@/components/icons";

type CountryEntry = { country: string; views: number };

type Proof = {
  id: string;
  imageUrl: string | null;
  note: string | null;
  method: string | null;
  aiResult: string | null;
  createdAt: Date | string;
  user: { name: string | null; email: string | null };
};

export function DemographicReviewCard({ proof }: { proof: Proof }) {
  const [, start] = useTransition();
  const [dismissed, setDismissed] = useState(false);

  let countryData: CountryEntry[] = [];
  let totalViews: number | null = null;
  if (proof.aiResult) {
    try {
      const parsed = JSON.parse(proof.aiResult);
      countryData = parsed.countryData ?? [];
      totalViews = parsed.totalViews ?? null;
    } catch {}
  }

  const noDemo = proof.method === "no_demographics";

  if (dismissed) return null;

  return (
    <div className="card flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{proof.user.name ?? "Unknown creator"}</p>
          <p className="truncate text-xs text-muted">{proof.user.email ?? ""}</p>
          <p className="mt-0.5 text-[11px] text-muted">{date(proof.createdAt)}</p>
        </div>
        <span className={`pill shrink-0 ${noDemo ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400"}`}>
          {noDemo ? "No demographics" : "Manual"}
        </span>
      </div>

      {/* Screenshot */}
      {proof.imageUrl && (
        <a href={proof.imageUrl} target="_blank" rel="noreferrer" className="group relative block overflow-hidden rounded-lg border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={proof.imageUrl} alt="Demographic screenshot" loading="lazy" decoding="async" className="w-full object-cover" style={{ maxHeight: 200 }} />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
            <EyeIcon className="h-6 w-6 text-white" />
          </div>
        </a>
      )}

      {/* Country data */}
      {countryData.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">Country breakdown</p>
          <div className="space-y-1">
            {countryData.slice(0, 8).map((c) => (
              <div key={c.country} className="flex items-center justify-between text-sm">
                <span className="truncate text-muted">{c.country}</span>
                <span className="ml-3 shrink-0 font-semibold">{c.views.toLocaleString()}</span>
              </div>
            ))}
            {countryData.length > 8 && (
              <p className="text-xs text-muted">+{countryData.length - 8} more</p>
            )}
          </div>
          {totalViews != null && (
            <p className="mt-2 text-xs text-muted">Total: <span className="font-semibold text-fg">{totalViews.toLocaleString()}</span></p>
          )}
        </div>
      )}

      {/* Note */}
      {proof.note && (
        <p className="rounded-lg bg-surface-2 px-3 py-2 text-sm text-muted">{proof.note}</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => { setDismissed(true); start(() => approveDemographicProof(proof.id)); }}
          className="btn-accent flex-1"
        >
          <CheckIcon className="h-4 w-4" /> Approve
        </button>
        <button
          onClick={() => { setDismissed(true); start(() => rejectDemographicProof(proof.id)); }}
          className="btn-ghost hover:!text-rose-400"
        >
          <XIcon className="h-4 w-4" /> Reject
        </button>
      </div>
    </div>
  );
}
