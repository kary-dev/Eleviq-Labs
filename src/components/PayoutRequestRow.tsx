"use client";

import { useTransition, useState } from "react";
import { approvePayoutRequest, rejectPayoutRequest, markPayoutRequestPaid } from "@/app/admin/actions";
import { money, date } from "@/lib/format";
import { CheckIcon, XIcon } from "@/components/icons";

type BankAccount = {
  accountHolder: string;
  accountNumber: string;
  routingNumber: string | null;
  bankName: string | null;
  paypalEmail: string | null;
  upiId: string | null;
  country: string;
} | null;

type Request = {
  id: string;
  amount: number;
  status: string;
  note: string | null;
  createdAt: Date | string;
  user: { name: string | null; email: string | null; bankAccount: BankAccount };
};

export function PayoutRequestRow({ request: r }: { request: Request }) {
  const [pending, start] = useTransition();
  const [rejectNote, setRejectNote] = useState("");
  const [showReject, setShowReject] = useState(false);
  const bank = r.user.bankAccount;

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{r.user.name ?? r.user.email}</p>
          <p className="text-xs text-muted">{r.user.email} · {date(r.createdAt)}</p>
          {r.note && <p className="mt-1 text-sm text-muted">{r.note}</p>}
        </div>
        <p className="font-display text-2xl font-bold text-accent">{money(r.amount)}</p>
      </div>

      {bank ? (
        <div className="mt-3 rounded-lg border border-border bg-surface-2/50 px-3 py-2.5 text-xs space-y-0.5">
          <p><span className="text-muted">Holder:</span> <span className="font-medium">{bank.accountHolder}</span></p>
          {bank.paypalEmail ? (
            <p><span className="text-muted">PayPal:</span> <span className="font-medium">{bank.paypalEmail}</span></p>
          ) : bank.upiId ? (
            <p><span className="text-muted">UPI:</span> <span className="font-medium font-mono">{bank.upiId}</span></p>
          ) : (
            <>
              <p><span className="text-muted">Account:</span> <span className="font-medium font-mono">{bank.accountNumber}</span>{bank.routingNumber && <> · <span className="text-muted">IFSC:</span> <span className="font-mono">{bank.routingNumber}</span></>}</p>
              {bank.bankName && <p><span className="text-muted">Bank:</span> <span className="font-medium">{bank.bankName}</span></p>}
            </>
          )}
        </div>
      ) : (
        <p className="mt-2 text-xs text-rose-400">No bank/PayPal details on file</p>
      )}

      {r.status === "APPROVED" ? (
        <div className="mt-3 flex gap-2">
          <button
            disabled={pending}
            onClick={() => start(() => markPayoutRequestPaid(r.id))}
            className="btn-accent flex-1"
          >
            Mark as Paid
          </button>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {showReject ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Rejection reason (optional)"
                className="input flex-1 text-sm"
              />
              <div className="flex gap-2">
                <button
                  disabled={pending}
                  onClick={() => start(async () => { await rejectPayoutRequest(r.id, rejectNote); setShowReject(false); })}
                  className="btn-ghost flex-1 !text-rose-400 sm:flex-none"
                >
                  Confirm
                </button>
                <button onClick={() => setShowReject(false)} className="btn-ghost flex-1 sm:flex-none">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                disabled={pending}
                onClick={() => start(() => approvePayoutRequest(r.id))}
                className="btn-accent flex-1"
              >
                <CheckIcon className="h-4 w-4" /> Approve
              </button>
              <button
                disabled={pending}
                onClick={() => setShowReject(true)}
                className="btn-ghost !text-rose-400"
              >
                <XIcon className="h-4 w-4" /> Reject
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
