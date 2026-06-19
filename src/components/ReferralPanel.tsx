"use client";

import { useState, useTransition, useEffect } from "react";
import { generateReferralCode, applyReferralCode } from "@/app/(creator)/actions";
import { CopyField } from "@/components/CopyField";
import { GiftIcon, CheckIcon } from "@/components/icons";

export function ReferralPanel({
  initialCode,
  alreadyReferred,
  hasEarned,
}: {
  initialCode: string | null;
  alreadyReferred: boolean;
  hasEarned: boolean;
}) {
  const [code, setCode] = useState<string | null>(initialCode);
  const [genPending, startGen] = useTransition();

  const [origin, setOrigin] = useState("https://eleviq-labs.vercel.app");
  useEffect(() => setOrigin(window.location.origin), []);
  const link = code ? `${origin}/auth?ref=${code}` : "";

  const generate = () =>
    startGen(async () => {
      const c = await generateReferralCode();
      setCode(c);
    });

  return (
    <div className="space-y-6">
      {/* Your referral code */}
      <div className="card p-6">
        <h2 className="font-display text-xl font-bold">Your referral code</h2>

        {code ? (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="min-w-0 max-w-full break-all rounded-xl border border-border bg-surface-2 px-4 py-2.5 font-mono text-sm font-bold tracking-wider text-accent sm:text-lg sm:tracking-widest">
                {code}
              </span>
              <span className="pill bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
                <CheckIcon className="h-3.5 w-3.5" /> Active
              </span>
            </div>
            <CopyField value={link} label="Your referral link" />
          </div>
        ) : (
          <div className="mt-3">
            <p className="text-sm text-muted">You haven&apos;t created a referral code yet.</p>
            <button onClick={generate} disabled={genPending} className="btn-accent mt-4">
              <GiftIcon className="h-4 w-4" />
              {genPending ? "Generating…" : "Generate referral code"}
            </button>
          </div>
        )}
      </div>

      {/* Were you referred? */}
      <div className="card p-6">
        <h2 className="font-display text-xl font-bold">Were you referred?</h2>
        <p className="mt-2 text-sm text-muted">
          Enter the referral code that was shared with you. Codes only work for new accounts
          that haven&apos;t earned rewards yet.
        </p>
        <ApplyForm alreadyReferred={alreadyReferred} hasEarned={hasEarned} />
      </div>
    </div>
  );
}

function ApplyForm({ alreadyReferred, hasEarned }: { alreadyReferred: boolean; hasEarned: boolean }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    alreadyReferred
      ? { ok: true, message: "You've already applied a referral code." }
      : hasEarned
      ? { ok: false, message: "Codes only work for new accounts that haven't earned rewards yet." }
      : null
  );

  const locked = alreadyReferred || hasEarned;

  const submit = (formData: FormData) => {
    start(async () => {
      const r = await applyReferralCode(formData);
      setResult(r);
    });
  };

  return (
    <div className="mt-4">
      <form action={submit} className="flex flex-col gap-2 sm:flex-row">
        <input
          name="code"
          disabled={locked || pending}
          placeholder="Enter referral code"
          className="input uppercase tracking-widest"
          autoCapitalize="characters"
        />
        <button disabled={locked || pending} className="btn-accent shrink-0">
          {pending ? "Applying…" : "Apply code"}
        </button>
      </form>
      {result && (
        <p className={`mt-2.5 text-sm ${result.ok ? "text-emerald-400" : "text-rose-400"}`}>
          {result.message}
        </p>
      )}
    </div>
  );
}
