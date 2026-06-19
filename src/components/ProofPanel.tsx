"use client";

import { useState, useTransition } from "react";
import { submitProof } from "@/app/(creator)/actions";
import { StatusPill } from "@/components/ui";
import { UploadIcon, EyeIcon } from "@/components/icons";
import { date } from "@/lib/format";

type Submission = { id: string; title: string | null; url: string; campaignId: string; campaign: { title: string; brand: string } };
type Proof = { id: string; imageUrl: string; note: string | null; status: string; createdAt: Date | string; campaign: { title: string; brand: string } };

export function ProofPanel({ submissions, proofs }: { submissions: Submission[]; proofs: Proof[] }) {
  const [pending, start] = useTransition();
  const [sel, setSel] = useState(submissions[0]?.id ?? "");
  const [ok, setOk] = useState(false);

  const current = submissions.find((s) => s.id === sel);

  const submit = (formData: FormData) => {
    if (current) {
      formData.set("campaignId", current.campaignId);
      formData.set("submissionId", current.id);
    }
    start(async () => {
      await submitProof(formData);
      setOk(true);
      setTimeout(() => setOk(false), 1800);
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Submit form */}
      <div className="card p-5 lg:col-span-2">
        <h3 className="font-display text-lg font-bold">Submit proof of views</h3>
        <p className="mt-1 text-sm text-muted">Upload a screenshot of your post's analytics/audience demographics.</p>

        {submissions.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border p-4 text-sm text-muted">
            Add a clip first — proofs are linked to your submitted clips.
          </div>
        ) : (
          <form action={submit} className="mt-4 space-y-3">
            <div>
              <label className="label">Clip</label>
              <select value={sel} onChange={(e) => setSel(e.target.value)} className="input">
                {submissions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.campaign.brand} — {s.title || s.url.slice(0, 30)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Proof screenshot URL</label>
              <input name="imageUrl" required placeholder="https://… link to screenshot" className="input" />
            </div>
            <div>
              <label className="label">Note (optional)</label>
              <textarea name="note" rows={2} placeholder="e.g. 62% US audience, 18–24" className="input resize-none" />
            </div>
            <button disabled={pending} className="btn-accent w-full">
              <UploadIcon className="h-4 w-4" /> {pending ? "Submitting…" : ok ? "Submitted ✓" : "Submit proof"}
            </button>
          </form>
        )}
      </div>

      {/* Proof list */}
      <div className="lg:col-span-3">
        <h3 className="mb-3 font-display text-lg font-bold">Your submitted proofs</h3>
        {proofs.length === 0 ? (
          <div className="card grid place-items-center px-6 py-12 text-center">
            <p className="font-semibold">Nothing submitted yet</p>
            <p className="mt-1.5 max-w-sm text-sm text-muted">
              Once you upload a proof, it'll show up here with its review status.
            </p>
          </div>
        ) : (
          <div className="card divide-y divide-border">
            {proofs.map((p) => (
              <div key={p.id} className="flex items-center gap-4 px-4 py-3.5">
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-surface-2 text-muted">
                  <EyeIcon className="h-[18px] w-[18px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.campaign.brand} — {p.campaign.title}</p>
                  <p className="truncate text-xs text-muted">{p.note ?? p.imageUrl} · {date(p.createdAt)}</p>
                </div>
                <a href={p.imageUrl} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline">View</a>
                <StatusPill status={p.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
