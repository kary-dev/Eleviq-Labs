"use client";

import { useState, useTransition } from "react";
import { requestPayout } from "@/app/(creator)/actions";
import { WalletIcon } from "@/components/icons";

export function PayoutRequestButton({ available }: { available: number }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(available.toFixed(2));
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, start] = useTransition();

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-accent" disabled={available <= 0}>
        <WalletIcon className="h-4 w-4" />
        Request Payout
      </button>
    );
  }

  return (
    <div className="card p-5 space-y-4">
      <h3 className="font-display font-bold">Request Payout</h3>
      <div>
        <label className="label">Amount ($)</label>
        <input
          type="number"
          step="0.01"
          min="1"
          max={available}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="input"
        />
      </div>
      <div>
        <label className="label">Note (optional)</label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. PayPal to myemail@example.com"
          className="input"
        />
      </div>
      {error && <p className="text-sm text-rose-400">{error}</p>}
      {success && <p className="text-sm text-emerald-400">{success}</p>}
      <div className="flex gap-2">
        <button
          disabled={pending || !!success}
          onClick={() => {
            setError("");
            const fd = new FormData();
            fd.set("amount", amount);
            fd.set("note", note);
            start(async () => {
              const res = await requestPayout(fd);
              if (res.ok) { setSuccess(res.message); }
              else { setError(res.message); }
            });
          }}
          className="btn-accent flex-1"
        >
          {pending ? "Submitting…" : "Submit Request"}
        </button>
        <button onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
      </div>
    </div>
  );
}
