"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/app/(creator)/actions";
import { CheckIcon } from "@/components/icons";

export function SettingsForm({ name, email, image }: { name: string; email: string; image: string | null }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = (fd: FormData) => {
    start(async () => {
      const res = await updateProfile(fd);
      setMsg({ ok: res.ok, text: res.message });
      setTimeout(() => setMsg(null), 3000);
    });
  };

  return (
    <div className="max-w-xl space-y-6">
      <div className="card p-6">
        <h2 className="mb-4 font-display text-base font-semibold">Profile</h2>

        {image && (
          <div className="mb-4 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" className="h-14 w-14 rounded-full object-cover" />
            <div>
              <p className="text-sm font-semibold">{email}</p>
              <p className="text-xs text-muted">Profile picture set via Discord OAuth</p>
            </div>
          </div>
        )}

        <form action={submit} className="space-y-4">
          <div>
            <label className="label">Display name</label>
            <input name="name" required defaultValue={name} placeholder="Your name" className="input" maxLength={60} />
          </div>
          <div>
            <label className="label">Email</label>
            <input value={email} disabled className="input opacity-50 cursor-not-allowed" readOnly />
            <p className="mt-1 text-xs text-muted">Email is set by your login provider and cannot be changed here.</p>
          </div>
          {msg && (
            <p className={`text-sm ${msg.ok ? "text-emerald-400" : "text-rose-400"}`}>{msg.text}</p>
          )}
          <button disabled={pending} className="btn-accent">
            {pending ? "Saving…" : <><CheckIcon className="h-4 w-4" /> Save changes</>}
          </button>
        </form>
      </div>
    </div>
  );
}
