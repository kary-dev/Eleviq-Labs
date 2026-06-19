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
  upiId: string | null;
} | null;

export function BankForm({ bank }: { bank: Bank }) {
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [method, setMethod] = useState<"bank" | "upi" | "paypal">(
    bank?.paypalEmail && !bank?.accountNumber && !bank?.upiId ? "paypal" :
    bank?.upiId && !bank?.accountNumber ? "upi" : "bank"
  );

  const submit = (formData: FormData) => {
    formData.set("method", method);
    start(async () => {
      await saveBank(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <div className="card max-w-2xl p-6">
      <div className="mb-5 flex flex-wrap gap-2">
        <button type="button" onClick={() => setMethod("bank")} className={`btn ${method === "bank" ? "btn-accent" : "btn-ghost"}`}>Bank transfer</button>
        <button type="button" onClick={() => setMethod("upi")} className={`btn ${method === "upi" ? "btn-accent" : "btn-ghost"}`}>UPI</button>
        <button type="button" onClick={() => setMethod("paypal")} className={`btn ${method === "paypal" ? "btn-accent" : "btn-ghost"}`}>PayPal</button>
      </div>

      <form action={submit} className="space-y-4">
        <div>
          <label className="label">Account holder name</label>
          <input name="accountHolder" required defaultValue={bank?.accountHolder ?? ""} placeholder="Full name" className="input" />
        </div>

        {method === "bank" && (
          <>
            <div>
              <label className="label">Account number</label>
              <input name="accountNumber" defaultValue={bank?.accountNumber ?? ""} placeholder="••••••••••••" className="input" minLength={10} maxLength={16} pattern="\d{10,16}" title="10–16 digits" inputMode="numeric" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">IFSC / Branch code</label>
                <input name="routingNumber" defaultValue={bank?.routingNumber ?? ""} placeholder="SBIN0001234" className="input" />
              </div>
              <div>
                <label className="label">Bank name</label>
                <input name="bankName" defaultValue={bank?.bankName ?? ""} placeholder="State Bank of India" className="input" />
              </div>
            </div>
          </>
        )}

        {method === "upi" && (
          <div>
            <label className="label">UPI ID</label>
            <input name="upiId" defaultValue={bank?.upiId ?? ""} placeholder="name@upi or phone@bank" className="input" />
            <p className="mt-1.5 text-xs text-muted">e.g. kartik@okicici · 9876543210@paytm · kartik@ybl</p>
          </div>
        )}

        {method === "paypal" && (
          <div>
            <label className="label">PayPal email</label>
            <input name="paypalEmail" type="email" defaultValue={bank?.paypalEmail ?? ""} placeholder="you@email.com" className="input" />
          </div>
        )}

        <button disabled={pending} className="btn-accent w-full py-3">
          {saved ? <><CheckIcon className="h-4 w-4" /> Saved</> : pending ? "Saving…" : "Save payout details"}
        </button>
        <p className="text-center text-xs text-muted">🔒 Your payout details are stored securely and only used to pay you.</p>
      </form>
    </div>
  );
}
