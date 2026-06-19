"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { createCampaign, updateCampaign, setCampaignStatus } from "@/app/admin/actions";
import { PLATFORM_KEYS, PLATFORMS } from "@/lib/platforms";
import { PlusIcon, XIcon } from "@/components/icons";

export function NewCampaignButton() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [plats, setPlats] = useState<string[]>([...PLATFORM_KEYS]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const toggle = (p: string) =>
    setPlats((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));

  const submit = (formData: FormData) => {
    plats.forEach((p) => formData.append("platforms", p));
    start(async () => {
      await createCampaign(formData);
      setOpen(false);
    });
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-accent">
        <PlusIcon className="h-4 w-4" /> New Campaign
      </button>

      {open && mounted && createPortal(
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !pending && setOpen(false)} />
          <div className="card relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">New campaign</h3>
              <button onClick={() => setOpen(false)} className="btn-ghost h-9 w-9 !p-0"><XIcon className="h-4 w-4" /></button>
            </div>
            <form action={submit} className="space-y-4">
              <div className="grid grid-cols-[1fr_5rem] gap-3">
                <div>
                  <label className="label">Brand</label>
                  <input name="brand" required placeholder="Brand name" className="input" />
                </div>
                <div>
                  <label className="label">Emoji</label>
                  <input name="thumbnail" defaultValue="🎬" maxLength={2} className="input text-center" />
                </div>
              </div>
              <div>
                <label className="label">Title</label>
                <input name="title" required placeholder="Campaign title" className="input" />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea name="description" rows={3} required placeholder="What should creators clip?" className="input resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">$ / 1k views</label>
                  <input name="ratePerThousand" type="number" step="0.1" defaultValue="1.5" className="input" />
                </div>
                <div>
                  <label className="label">Budget</label>
                  <input name="budget" type="number" defaultValue="2000" className="input" />
                </div>
                <div>
                  <label className="label">Min views</label>
                  <input name="minViews" type="number" defaultValue="500" className="input" />
                </div>
              </div>
              <div>
                <label className="label">End date <span className="text-muted font-normal">(optional)</span></label>
                <input name="endsAt" type="date" className="input" />
              </div>
              <div>
                <label className="label">Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORM_KEYS.map((p) => {
                    const { Icon, label } = PLATFORMS[p];
                    const on = plats.includes(p);
                    return (
                      <button type="button" key={p} onClick={() => toggle(p)} className={`btn ${on ? "btn-accent" : "btn-ghost"} !px-3 !py-2`}>
                        <Icon className="h-4 w-4" /> {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button disabled={pending} className="btn-accent w-full py-3">
                {pending ? "Creating…" : "Create campaign"}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export function CampaignStatusToggle({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  const next = status === "ACTIVE" ? "ENDED" : "ACTIVE";
  return (
    <button
      disabled={pending}
      onClick={() => start(() => setCampaignStatus(id, next as "ACTIVE" | "ENDED"))}
      className="btn-ghost !px-3 !py-1.5 text-xs"
    >
      {pending ? "…" : status === "ACTIVE" ? "End campaign" : "Reactivate"}
    </button>
  );
}

type CampaignEditData = {
  id: string;
  title: string;
  brand: string;
  description: string;
  thumbnail: string | null;
  ratePerThousand: number;
  budget: number;
  minViews: number;
  platforms: string;
  endsAt: Date | string | null;
};

export function EditCampaignButton({ campaign }: { campaign: CampaignEditData }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [plats, setPlats] = useState<string[]>(campaign.platforms.split(",").filter(Boolean));
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const toggle = (p: string) =>
    setPlats((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));

  const submit = (formData: FormData) => {
    plats.forEach((p) => formData.append("platforms", p));
    start(async () => {
      await updateCampaign(campaign.id, formData);
      setOpen(false);
    });
  };

  const endsAtValue = campaign.endsAt
    ? new Date(campaign.endsAt).toISOString().split("T")[0]
    : "";

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-ghost !px-3 !py-1.5 text-xs">
        Edit
      </button>

      {open && mounted && createPortal(
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !pending && setOpen(false)} />
          <div className="card relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">Edit campaign</h3>
              <button onClick={() => setOpen(false)} className="btn-ghost h-9 w-9 !p-0"><XIcon className="h-4 w-4" /></button>
            </div>
            <form action={submit} className="space-y-4">
              <div className="grid grid-cols-[1fr_5rem] gap-3">
                <div>
                  <label className="label">Brand</label>
                  <input name="brand" required defaultValue={campaign.brand} className="input" />
                </div>
                <div>
                  <label className="label">Emoji</label>
                  <input name="thumbnail" defaultValue={campaign.thumbnail ?? "🎬"} maxLength={2} className="input text-center" />
                </div>
              </div>
              <div>
                <label className="label">Title</label>
                <input name="title" required defaultValue={campaign.title} className="input" />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea name="description" rows={3} required defaultValue={campaign.description} className="input resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">$ / 1k views</label>
                  <input name="ratePerThousand" type="number" step="0.1" defaultValue={campaign.ratePerThousand} className="input" />
                </div>
                <div>
                  <label className="label">Budget</label>
                  <input name="budget" type="number" defaultValue={campaign.budget} className="input" />
                </div>
                <div>
                  <label className="label">Min views</label>
                  <input name="minViews" type="number" defaultValue={campaign.minViews} className="input" />
                </div>
              </div>
              <div>
                <label className="label">End date <span className="text-muted font-normal">(optional)</span></label>
                <input name="endsAt" type="date" defaultValue={endsAtValue} className="input" />
              </div>
              <div>
                <label className="label">Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORM_KEYS.map((p) => {
                    const { Icon, label } = PLATFORMS[p];
                    const on = plats.includes(p);
                    return (
                      <button type="button" key={p} onClick={() => toggle(p)} className={`btn ${on ? "btn-accent" : "btn-ghost"} !px-3 !py-2`}>
                        <Icon className="h-4 w-4" /> {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button disabled={pending} className="btn-accent w-full py-3">
                {pending ? "Saving…" : "Save changes"}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
