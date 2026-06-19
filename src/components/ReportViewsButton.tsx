"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { requestViewRecheck } from "@/app/(creator)/actions";
import { XIcon } from "@/components/icons";

function ReportForm({
  submissionId,
  onClose,
  onSent,
}: {
  submissionId: string;
  onClose?: () => void;
  onSent: () => void;
}) {
  const [claimed, setClaimed] = useState("");
  const [note, setNote] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    const fd = new FormData();
    fd.set("submissionId", submissionId);
    fd.set("claimedViews", claimed);
    fd.set("note", note);
    const file = fileRef.current?.files?.[0];
    if (file) fd.set("screenshot", file);
    start(async () => {
      const r = await requestViewRecheck(fd);
      if (r.ok) onSent();
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-muted">Tell us the correct view count (from your Instagram Insights):</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={claimed}
          onChange={(e) => setClaimed(e.target.value)}
          inputMode="numeric"
          placeholder="Real views, e.g. 1052"
          className="input !py-1.5 text-sm"
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional)"
          className="input !py-1.5 text-sm"
        />
      </div>
      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted transition hover:border-amber-500/40 hover:text-amber-400">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        {fileName ? (
          <span className="truncate text-amber-400">{fileName}</span>
        ) : (
          <span>Attach Insights screenshot <span className="text-[10px]">(optional, max 10 MB)</span></span>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
      </label>
      <div className="flex gap-2">
        <button disabled={pending} onClick={submit} className="btn-accent !px-3 !py-1.5 text-xs">
          {pending ? "Sending…" : "Request recheck"}
        </button>
        {onClose && (
          <button onClick={onClose} className="btn-ghost !px-3 !py-1.5 text-xs">Cancel</button>
        )}
      </div>
    </div>
  );
}

export function ReportViewsButton({
  submissionId,
  disputed,
  variant = "expand",
}: {
  submissionId: string;
  disputed?: boolean;
  variant?: "expand" | "modal";
}) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(disputed ?? false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => { if (disputed) setSent(true); }, [disputed]);

  useEffect(() => {
    if (!open || variant !== "modal") return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open, variant]);

  if (sent) {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
        ⏳ Recheck requested
      </span>
    );
  }

  const triggerBtn = (
    <button
      onClick={() => setOpen(true)}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2/60 px-2.5 py-1 text-xs font-medium text-muted transition hover:border-amber-500/40 hover:text-amber-400"
    >
      ⚠ Report
    </button>
  );

  /* ── Modal variant (desktop) ── */
  if (variant === "modal") {
    return (
      <>
        {triggerBtn}
        {open && mounted && createPortal(
          <div className="fixed inset-0 z-50 grid place-items-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <div className="card relative z-10 w-full max-w-md p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-base font-bold">Request view recheck</h3>
                <button onClick={() => setOpen(false)} className="btn-ghost h-8 w-8 !p-0">
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
              <ReportForm
                submissionId={submissionId}
                onClose={() => setOpen(false)}
                onSent={() => { setSent(true); setOpen(false); }}
              />
            </div>
          </div>,
          document.body
        )}
      </>
    );
  }

  /* ── Expand variant (mobile, below row) ── */
  if (!open) return triggerBtn;

  return (
    <div className="w-full rounded-lg border border-border bg-surface-2/50 p-2.5">
      <ReportForm
        submissionId={submissionId}
        onClose={() => setOpen(false)}
        onSent={() => setSent(true)}
      />
    </div>
  );
}
