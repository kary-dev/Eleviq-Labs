"use client";

import { useState, useTransition } from "react";
import { saveBank } from "@/app/(creator)/actions";
import { CheckIcon } from "@/components/icons";

type Bank = {
  accountHolder: string;
  accountNumber: string;
  routingNumber: string | null;
  bankName: string | null;
  country: string;
  paypalEmail: string | null;
} | null;

export function BankForm({ bank }: { bank: Bank }) {
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [method, setMethod] = useState<"bank" | "paypal">(bank?.paypalEmail && !bank?.accountNumber ? "paypal" : "bank");

  const submit = (formData: FormData) => {
    start(async () => {
      await saveBank(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <div className="card max-w-2xl p-6">
      <div className="mb-5 flex gap-2">
        <button onClick={() => setMethod("bank")} className={`btn ${method === "bank" ? "btn-accent" : "btn-ghost"}`}>Bank transfer</button>
        <button onClick={() => setMethod("paypal")} className={`btn ${method === "paypal" ? "btn-accent" : "btn-ghost"}`}>PayPal</button>
      </div>

      <form action={submit} className="space-y-4">
        <div>
          <label className="label">Account holder name</label>
          <input name="accountHolder" required defaultValue={bank?.accountHolder ?? ""} placeholder="Full name" className="input" />
        </div>

        {method === "bank" ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Account number</label>
                <input name="accountNumber" defaultValue={bank?.accountNumber ?? ""} placeholder="••••••••" className="input" />
              </div>
              <div>
                <label className="label">Routing / sort code</label>
                <input name="routingNumber" defaultValue={bank?.routingNumber ?? ""} placeholder="000000000" className="input" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Bank name</label>
                <input name="bankName" defaultValue={bank?.bankName ?? ""} placeholder="Bank" className="input" />
              </div>
              <div>
                <label className="label">Country</label>
                <input name="country" defaultValue={bank?.country ?? "US"} placeholder="US" className="input" />
              </div>
            </div>
            <input type="hidden" name="paypalEmail" value="" />
          </>
        ) : (
          <>
            <div>
              <label className="label">PayPal email</label>
              <input name="paypalEmail" type="email" defaultValue={bank?.paypalEmail ?? ""} placeholder="you@email.com" className="input" />
            </div>
            <input type="hidden" name="accountNumber" value="" />
          </>
        )}

        <button disabled={pending} className="btn-accent w-full py-3">
          {saved ? <><CheckIcon className="h-4 w-4" /> Saved</> : pending ? "Saving…" : "Save payout details"}
        </button>
        <p className="text-center text-xs text-muted">🔒 Your payout details are stored securely and only used to pay you.</p>
      </form>
    </div>
  );
}
