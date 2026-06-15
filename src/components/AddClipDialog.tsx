"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { addClip, fetchClipPreview, type ClipPreview } from "@/app/(creator)/actions";
import { PLATFORMS, PLATFORM_KEYS, PlatformKey } from "@/lib/platforms";
import { estPayout, compact, money } from "@/lib/format";
import { PlusIcon, XIcon, UploadIcon, CheckIcon } from "@/components/icons";

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
  // Fixed display order: Instagram, YouTube, X, TikTok (PLATFORM_KEYS order).
  const allowed = (campaign.platforms.split(",").filter(Boolean) as PlatformKey[])
    .slice()
    .sort((a, b) => PLATFORM_KEYS.indexOf(a) - PLATFORM_KEYS.indexOf(b));

  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<PlatformKey>(allowed[0] ?? "INSTAGRAM");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [views, setViews] = useState(0);
  const [preview, setPreview] = useState<ClipPreview | null>(null);
  const [fetching, startFetch] = useTransition();
  const [pending, startSubmit] = useTransition();
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [mounted, setMounted] = useState(false);

  const auto = platform !== "X";

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
    setTitle("");
    setViews(0);
    setPreview(null);
    setError("");
    setDone(false);
  };

  const switchPlatform = (p: PlatformKey) => {
    setPlatform(p);
    setUrl("");
    setPreview(null);
    setError("");
  };

  const doFetch = (value: string) => {
    if (!auto) return;
    const v = value.trim();
    if (!v) {
      setPreview(null);
      return;
    }
    setError("");
    startFetch(async () => {
      const p = await fetchClipPreview(platform, v);
      setPreview(p);
    });
  };

  const submit = () => {
    const fd = new FormData();
    fd.set("campaignId", campaign.id);
    fd.set("platform", platform);
    fd.set("url", url.trim());
    if (auto) {
      if (!preview?.ok || !preview.ownedByYou) return;
    } else {
      if (!url.trim() || views <= 0) return;
      fd.set("title", title.trim());
      fd.set("views", String(views));
    }
    setError("");
    startSubmit(async () => {
      try {
        const r = await addClip(fd);
        if (!r.ok) { setError(r.message); return; }
        setDone(true);
        setTimeout(() => {
          setOpen(false);
          reset();
        }, 1300);
      } catch {
        setError("Couldn't submit this clip. Please try again.");
      }
    });
  };

  const canSubmit = auto
    ? !!preview?.ok && !!preview.ownedByYou && !pending
    : !!url.trim() && views > 0 && !pending;

  const PlatIcon = PLATFORMS[platform].Icon;

  return (
    <>
      <button onClick={() => setOpen(true)} className={trigger === "block" ? "btn-accent w-full" : "btn-accent"}>
        <PlusIcon className="h-4 w-4" /> Add Clip
      </button>

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
                {/* Platform picker */}
                {allowed.length > 1 && (
                  <div>
                    <label className="label">Platform</label>
                    <div className="flex flex-wrap gap-2">
                      {allowed.map((p) => {
                        const { Icon, label } = PLATFORMS[p];
                        const active = p === platform;
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => switchPlatform(p)}
                            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                              active
                                ? "border-accent/70 bg-accent/15 text-fg ring-2 ring-accent/20"
                                : "border-border bg-surface-2/60 text-muted hover:text-fg"
                            }`}
                          >
                            <Icon className="h-4 w-4" /> {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="label flex items-center gap-1.5">
                    <PlatIcon className="h-3.5 w-3.5" /> {PLATFORMS[platform].label} link
                  </label>
                  <input
                    value={url}
                    onChange={(e) => { setUrl(e.target.value); if (auto) setPreview(null); }}
                    onBlur={(e) => doFetch(e.target.value)}
                    onPaste={(e) => setTimeout(() => doFetch((e.target as HTMLInputElement).value), 0)}
                    placeholder={PLATFORMS[platform].placeholder}
                    className="input"
                  />
                  <p className="mt-1.5 text-xs text-muted">
                    {auto
                      ? "Paste the link — we check it belongs to a verified account of yours."
                      : "Paste the link, then enter the current view count below."}
                  </p>
                </div>

                {/* Instagram: username + ownership check only */}
                {auto && fetching && (
                  <div className="rounded-xl border border-border bg-surface-2/50 px-4 py-3 text-sm text-muted">
                    Checking the account…
                  </div>
                )}
                {auto && !fetching && preview && !preview.ok && (
                  <p className="text-sm text-rose-400">{preview.message}</p>
                )}
                {auto && !fetching && preview?.ok && (
                  <div className="rounded-xl border border-border bg-surface-2/50 px-4 py-3">
                    <div className="flex items-center gap-1.5 text-sm font-semibold">
                      @{preview.ownerUsername}
                      {preview.ownedByYou ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400">
                          <CheckIcon className="h-3.5 w-3.5" /> verified account
                        </span>
                      ) : (
                        <span className="text-rose-400">· not your account</span>
                      )}
                    </div>
                    {!preview.ownedByYou && (
                      <p className="mt-1 text-xs text-rose-400">{preview.message}</p>
                    )}
                  </div>
                )}

                {/* Non-Instagram: manual title + views */}
                {!auto && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Title (optional)</label>
                      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Clip title" className="input" />
                    </div>
                    <div>
                      <label className="label">Current views</label>
                      <input
                        type="number"
                        min={0}
                        value={views || ""}
                        onChange={(e) => setViews(parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="input"
                      />
                    </div>
                  </div>
                )}

                {!auto && views > 0 && (
                  <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2/50 px-4 py-3 text-sm">
                    <span className="text-muted">Est. payout at {compact(views)} views</span>
                    <span className="font-display text-lg font-bold text-accent">
                      {money(estPayout(views, campaign.ratePerThousand))}
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
