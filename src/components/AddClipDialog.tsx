"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { addClip, fetchClipPreview, type ClipPreview } from "@/app/(creator)/actions";
import { estPayout, compact, money } from "@/lib/format";
import { PlusIcon, XIcon, UploadIcon, CheckIcon, EyeIcon, InstagramIcon } from "@/components/icons";

type Campaign = {
  id: string;
  title: string;
  brand: string;
  ratePerThousand: number;
  platforms: string;
};

export function AddClipDialog({
  campaign,
  trigger = "button",
}: {
  campaign: Campaign;
  trigger?: "button" | "block";
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<ClipPreview | null>(null);
  const [fetching, startFetch] = useTransition();
  const [pending, startSubmit] = useTransition();
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const reset = () => {
    setUrl("");
    setPreview(null);
    setError("");
    setDone(false);
  };

  const doFetch = (value: string) => {
    const v = value.trim();
    if (!v || !/instagram\.com\//i.test(v)) {
      setPreview(null);
      return;
    }
    setError("");
    startFetch(async () => {
      const p = await fetchClipPreview(v);
      setPreview(p);
    });
  };

  const submit = () => {
    if (!preview?.ok || !preview.ownedByYou) return;
    const fd = new FormData();
    fd.set("campaignId", campaign.id);
    fd.set("url", url.trim());
    setError("");
    startSubmit(async () => {
      try {
        await addClip(fd);
        setDone(true);
        setTimeout(() => {
          setOpen(false);
          reset();
        }, 1300);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't submit this clip.");
      }
    });
  };

  const canSubmit = !!preview?.ok && !!preview.ownedByYou && !pending;

  return (
    <>
      {trigger === "block" ? (
        <button onClick={() => setOpen(true)} className="btn-accent w-full">
          <PlusIcon className="h-4 w-4" /> Add Clip
        </button>
      ) : (
        <button onClick={() => setOpen(true)} className="btn-accent">
          <PlusIcon className="h-4 w-4" /> Add Clip
        </button>
      )}

      {open && mounted && createPortal(
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !pending && (setOpen(false), reset())} />
          <div className="card relative z-10 w-full max-w-lg p-6">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h3 className="font-display text-lg font-bold">Add a clip</h3>
                <p className="text-sm text-muted">{campaign.brand} — {campaign.title}</p>
              </div>
              <button onClick={() => { setOpen(false); reset(); }} className="btn-ghost h-9 w-9 !p-0"><XIcon className="h-4 w-4" /></button>
            </div>

            {done ? (
              <div className="grid place-items-center py-10 text-center">
                <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
                  <UploadIcon className="h-6 w-6" />
                </div>
                <p className="font-semibold">Submitted for review</p>
                <p className="text-sm text-muted">Your clip is now pending admin approval.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="label flex items-center gap-1.5">
                    <InstagramIcon className="h-3.5 w-3.5" /> Instagram post / reel link
                  </label>
                  <input
                    value={url}
                    onChange={(e) => { setUrl(e.target.value); setPreview(null); }}
                    onBlur={(e) => doFetch(e.target.value)}
                    onPaste={(e) => setTimeout(() => doFetch((e.target as HTMLInputElement).value), 0)}
                    placeholder="https://instagram.com/reel/…"
                    className="input"
                  />
                  <p className="mt-1.5 text-xs text-muted">
                    Paste the link — we fetch the views and details automatically.
                  </p>
                </div>

                {fetching && (
                  <div className="rounded-xl border border-border bg-surface-2/50 px-4 py-3 text-sm text-muted">
                    Fetching post details…
                  </div>
                )}

                {!fetching && preview && !preview.ok && (
                  <p className="text-sm text-rose-400">{preview.message}</p>
                )}

                {!fetching && preview?.ok && (
                  <div className="overflow-hidden rounded-xl border border-border bg-surface-2/50">
                    <div className="flex gap-3 p-3">
                      {preview.thumbnailUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={preview.thumbnailUrl} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-sm font-semibold">
                          @{preview.ownerUsername}
                          {preview.ownedByYou ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400">
                              <CheckIcon className="h-3.5 w-3.5" /> verified
                            </span>
                          ) : (
                            <span className="text-rose-400">· not your account</span>
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted">{preview.caption ?? "—"}</p>
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted">
                          <EyeIcon className="h-3.5 w-3.5" /> {compact(preview.views ?? 0)} views
                        </p>
                      </div>
                    </div>
                    {!preview.ownedByYou && (
                      <p className="border-t border-border bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
                        {preview.message}
                      </p>
                    )}
                  </div>
                )}

                {preview?.ok && preview.ownedByYou && (
                  <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2/50 px-4 py-3 text-sm">
                    <span className="text-muted">Est. payout at {compact(preview.views ?? 0)} views</span>
                    <span className="font-display text-lg font-bold text-accent">
                      {money(estPayout(preview.views ?? 0, campaign.ratePerThousand))}
                    </span>
                  </div>
                )}

                {error && <p className="text-sm text-rose-400">{error}</p>}

                <button disabled={!canSubmit} onClick={submit} className="btn-accent w-full py-3">
                  {pending ? "Submitting…" : "Submit clip for review"}
                </button>
                <p className="text-center text-xs text-muted">
                  Final payout is confirmed after admin approval at {money(campaign.ratePerThousand)} / 1,000 views.
                </p>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
