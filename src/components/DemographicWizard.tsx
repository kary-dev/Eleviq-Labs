"use client";

import { useState, useTransition, useRef } from "react";
import { submitDemographicProof } from "@/app/(creator)/actions";
import { UploadIcon, CheckIcon, ChartIcon } from "@/components/icons";

type CountryEntry = { country: string; views: number };
type Panel = "choice" | "upload" | "data" | "no_demo" | "done";

export function DemographicWizard({ accountId, onDone }: { accountId: string; onDone?: () => void }) {
  const [panel, setPanel] = useState<Panel>("choice");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitPending, startSubmit] = useTransition();
  const [manualRows, setManualRows] = useState<CountryEntry[]>([{ country: "", views: 0 }]);
  const [manualNote, setManualNote] = useState("");
  const [noDemoNote, setNoDemoNote] = useState("");
  const [submitError, setSubmitError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > 10 * 1024 * 1024) {
      setSubmitError("Screenshot too large — max 10 MB.");
      e.target.value = "";
      return;
    }
    setSubmitError("");
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  function handleSubmitData() {
    const validRows = manualRows.filter((r) => r.country.trim());
    const total = validRows.reduce((s, r) => s + r.views, 0);
    if (Math.abs(total - 100) > 0.5) {
      setSubmitError(`Country percentages must sum to 100% (currently ${total.toFixed(1)}%).`);
      return;
    }
    setSubmitError("");
    startSubmit(async () => {
      const fd = new FormData();
      fd.set("method", "manual");
      fd.set("socialAccountId", accountId);
      fd.set("aiResult", JSON.stringify({ countryData: validRows, totalViews: null }));
      fd.set("note", manualNote || validRows.map((r) => `${r.country}: ${r.views}`).join(", "));
      if (file) fd.set("screenshot", file);
      const res = await submitDemographicProof(fd);
      if (!res.ok) { setSubmitError(res.message); return; }
      setPanel("done");
      onDone?.();
    });
  }

  function handleSubmitNoDemo() {
    setSubmitError("");
    startSubmit(async () => {
      const fd = new FormData();
      fd.set("method", "no_demographics");
      fd.set("socialAccountId", accountId);
      fd.set("note", noDemoNote || "Creator does not have access to demographic analytics.");
      if (file) fd.set("screenshot", file);
      const res = await submitDemographicProof(fd);
      if (!res.ok) { setSubmitError(res.message); return; }
      setPanel("done");
      onDone?.();
    });
  }

  function reset() {
    setPanel("choice");
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setManualRows([{ country: "", views: 0 }]);
    setManualNote("");
    setNoDemoNote("");
    setSubmitError("");
  }

  // ---------- choice ----------
  if (panel === "choice") {
    return (
      <div className="card p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent">
            <ChartIcon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold">Demographic Verification</h2>
            <p className="text-sm text-muted">Submit your profile audience country breakdown for review.</p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setPanel("upload")}
            className="card w-full p-4 text-left transition hover:border-accent/40"
          >
            <p className="font-semibold">I have my demographics</p>
            <p className="mt-0.5 text-sm text-muted">Upload a screenshot from your analytics and enter country data.</p>
          </button>

          <button
            onClick={() => setPanel("no_demo")}
            className="card w-full p-4 text-left transition hover:border-border/60"
          >
            <p className="font-semibold text-muted">I don&apos;t have demographics</p>
            <p className="mt-0.5 text-sm text-muted">Let admin know — you can still submit a note explaining why.</p>
          </button>
        </div>
      </div>
    );
  }

  // ---------- upload screenshot ----------
  if (panel === "upload") {
    return (
      <div className="card p-6">
        <PanelHeader step={1} title="Upload Screenshot" onBack={() => setPanel("choice")} />

        <p className="mb-4 text-sm text-muted">
          Upload your profile analytics screenshot showing the country audience breakdown (optional — helps admin verify).
        </p>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={`flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition hover:border-accent/60 hover:bg-accent/5 ${
            file ? "border-accent/40 bg-accent/5" : "border-border"
          }`}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Preview" className="max-h-48 rounded-lg object-contain" />
          ) : (
            <>
              <UploadIcon className="h-8 w-8 text-muted" />
              <span className="text-sm text-muted">Click to choose a screenshot</span>
              <span className="text-xs text-muted">PNG, JPG, WEBP · max 10 MB</span>
            </>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
        {file && (
          <p className="mt-1.5 text-xs text-muted">
            {file.name} · {(file.size / 1024).toFixed(0)} KB
            <button onClick={() => fileRef.current?.click()} className="ml-2 text-accent hover:underline">Change</button>
          </p>
        )}

        <button onClick={() => setPanel("data")} className="btn-accent mt-5 w-full">
          Continue
        </button>
      </div>
    );
  }

  // ---------- enter data ----------
  if (panel === "data") {
    return (
      <div className="card p-6">
        <PanelHeader step={2} title="Enter Country Data" onBack={() => setPanel("upload")} />

        <p className="mb-4 text-sm text-muted">
          Enter the country audience breakdown from your profile analytics.
        </p>

        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Your screenshot" className="mb-4 max-h-32 w-full rounded-lg border border-border object-contain" />
        )}

        <div className="space-y-3">
          <div>
            <label className="label">Country data</label>
            <div className="space-y-2">
              {manualRows.map((row, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={row.country}
                    onChange={(e) => {
                      const next = [...manualRows];
                      next[i] = { ...next[i], country: e.target.value };
                      setManualRows(next);
                    }}
                    placeholder="Country"
                    className="input flex-1"
                  />
                  <input
                    type="number"
                    step="any"
                    value={row.views || ""}
                    onChange={(e) => {
                      const next = [...manualRows];
                      next[i] = { ...next[i], views: parseFloat(e.target.value) || 0 };
                      setManualRows(next);
                    }}
                    placeholder="Views / %"
                    className="input w-28"
                  />
                  {manualRows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setManualRows(manualRows.filter((_, j) => j !== i))}
                      className="btn-ghost !px-2 text-muted hover:!text-rose-400"
                    >x</button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setManualRows([...manualRows, { country: "", views: 0 }])}
              className="btn-ghost mt-2 text-sm"
            >
              + Add row
            </button>
          </div>

          <div>
            <label className="label">Note (optional)</label>
            <textarea
              value={manualNote}
              onChange={(e) => setManualNote(e.target.value)}
              rows={2}
              placeholder="e.g. from Instagram Insights, week of June 2025"
              className="input resize-none"
            />
          </div>
        </div>

        {submitError && <p className="mt-3 text-sm text-rose-400">{submitError}</p>}

        <button
          disabled={submitPending || manualRows.every((r) => !r.country.trim())}
          onClick={handleSubmitData}
          className="btn-accent mt-5 w-full"
        >
          <UploadIcon className="h-4 w-4" />
          {submitPending ? "Submitting..." : "Submit for review"}
        </button>
      </div>
    );
  }

  // ---------- no demographics ----------
  if (panel === "no_demo") {
    return (
      <div className="card p-6">
        <PanelHeader step={1} title="No Demographics" onBack={() => setPanel("choice")} />

        <p className="mb-4 text-sm text-muted">
          Let admin know you don&apos;t have access to demographic analytics. Attach a screenshot as proof (e.g. showing a personal account with no insights access).
        </p>

        <div className="space-y-3">
          <div>
            <label className="label">Screenshot proof (optional)</label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={`flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-5 text-center transition hover:border-accent/60 hover:bg-accent/5 ${
                file ? "border-accent/40 bg-accent/5" : "border-border"
              }`}
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Preview" className="max-h-36 rounded-lg object-contain" />
              ) : (
                <>
                  <UploadIcon className="h-7 w-7 text-muted" />
                  <span className="text-sm text-muted">Click to attach screenshot</span>
                </>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            {file && (
              <p className="mt-1 text-xs text-muted">
                {file.name} · {(file.size / 1024).toFixed(0)} KB
                <button onClick={() => fileRef.current?.click()} className="ml-2 text-accent hover:underline">Change</button>
              </p>
            )}
          </div>

          <div>
            <label className="label">Reason (optional)</label>
            <textarea
              value={noDemoNote}
              onChange={(e) => setNoDemoNote(e.target.value)}
              rows={2}
              placeholder="e.g. My account is a personal account without access to insights"
              className="input resize-none"
            />
          </div>
        </div>

        {submitError && <p className="mt-3 text-sm text-rose-400">{submitError}</p>}

        <button
          disabled={submitPending}
          onClick={handleSubmitNoDemo}
          className="btn-accent mt-5 w-full"
        >
          {submitPending ? "Submitting..." : "Submit to admin"}
        </button>
      </div>
    );
  }

  // ---------- done ----------
  return (
    <div className="card flex flex-col items-center gap-4 p-10 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent/15 text-accent">
        <CheckIcon className="h-7 w-7" />
      </span>
      <h2 className="font-display text-xl font-bold">Submitted for review</h2>
      <p className="max-w-sm text-sm text-muted">
        Admin will review your submission and respond here once done.
      </p>
      <button onClick={reset} className="btn-ghost">Submit another</button>
    </div>
  );
}

function PanelHeader({ step, title, onBack }: { step: number; title: string; onBack: () => void }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <button onClick={onBack} className="btn-ghost !px-2" aria-label="Back">back</button>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted">Step {step}</p>
        <h2 className="font-display text-lg font-bold">{title}</h2>
      </div>
    </div>
  );
}
