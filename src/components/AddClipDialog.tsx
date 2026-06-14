"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { addClip } from "@/app/(creator)/actions";
import { PLATFORMS, PlatformKey } from "@/lib/platforms";
import { estPayout, compact, money } from "@/lib/format";
import { PlusIcon, XIcon, UploadIcon } from "@/components/icons";

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
  const [views, setViews] = useState(0);
  const [platform, setPlatform] = useState<PlatformKey>(
    (campaign.platforms.split(",")[0] as PlatformKey) ?? "TIKTOK"
  );
  const [pending, start] = useTransition();
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

  const allowed = campaign.platforms.split(",").filter(Boolean) as PlatformKey[];

  const submit = (formData: FormData) => {
    start(async () => {
      await addClip(formData);
      setDone(true);
      setTimeout(() => {
        setOpen(false);
        setDone(false);
        setViews(0);
      }, 1200);
    });
  };

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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !pending && setOpen(false)} />
          <div className="card relative z-10 w-full max-w-lg p-6">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h3 className="font-display text-lg font-bold">Add a clip</h3>
                <p className="text-sm text-muted">{campaign.brand} — {campaign.title}</p>
              </div>
              <button onClick={() => setOpen(false)} className="btn-ghost h-9 w-9 !p-0"><XIcon className="h-4 w-4" /></button>
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
              <form action={submit} className="space-y-4">
                <input type="hidden" name="campaignId" value={campaign.id} />
                <input type="hidden" name="platform" value={platform} />

                <div>
                  <label className="label">Platform</label>
                  <div className="flex flex-wrap gap-2">
                    {allowed.map((p) => {
                      const { Icon, label } = PLATFORMS[p];
                      const active = platform === p;
                      return (
                        <button
                          type="button"
                          key={p}
                          onClick={() => setPlatform(p)}
                          className={`btn ${active ? "btn-accent" : "btn-ghost"} !px-3 !py-2`}
                        >
                          <Icon className="h-4 w-4" /> {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="label">Post URL</label>
                  <input name="url" required placeholder={PLATFORMS[platform].placeholder} className="input" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Title (optional)</label>
                    <input name="title" placeholder="Clip title" className="input" />
                  </div>
                  <div>
                    <label className="label">Current views</label>
                    <input
                      name="views"
                      type="number"
                      min={0}
                      value={views || ""}
                      onChange={(e) => setViews(parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className="input"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2/50 px-4 py-3 text-sm">
                  <span className="text-muted">Est. payout at {compact(views)} views</span>
                  <span className="font-display text-lg font-bold text-accent">
                    {money(estPayout(views, campaign.ratePerThousand))}
                  </span>
                </div>

                <button disabled={pending} className="btn-accent w-full py-3">
                  {pending ? "Submitting…" : "Submit clip for review"}
                </button>
                <p className="text-center text-xs text-muted">
                  Final payout is confirmed after admin approval at {money(campaign.ratePerThousand)} / 1,000 views.
                </p>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
