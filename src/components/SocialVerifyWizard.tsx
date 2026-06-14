"use client";

import { useMemo, useState, useTransition } from "react";
import {
  verifyAccount, removeSocial,
  startInstagramVerification, checkInstagramBio,
} from "@/app/(creator)/actions";
import { PLATFORMS, PLATFORM_KEYS, PlatformKey } from "@/lib/platforms";
import { CopyField } from "@/components/CopyField";
import {
  CheckIcon, XIcon, KeyIcon, ShieldIcon, ArrowLeftIcon, SparkleIcon, PlusIcon,
} from "@/components/icons";

type Account = {
  id: string; platform: string; handle: string;
  url: string | null; verified: boolean; method?: string | null;
};

type Method = "link" | "bio";
type Stage = "method" | "form" | "done";

const PROFILE_BASE: Record<PlatformKey, string> = {
  INSTAGRAM: "https://instagram.com/",
  YOUTUBE: "https://youtube.com/@",
  X: "https://x.com/",
  TIKTOK: "https://tiktok.com/@",
};

const rand = (n: number) => {
  const c = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: n }, () => c[Math.floor(Math.random() * c.length)]).join("");
};
const otp = () => String(Math.floor(100000 + Math.random() * 900000));
const cleanHandle = (h: string) => h.trim().replace(/^@+/, "");

/* =====================================================================
   Top-level: shows the platform grid, or the wizard for one platform.
   ===================================================================== */

export function SocialVerifyWizard({ accounts }: { accounts: Account[] }) {
  const [verifying, setVerifying] = useState<PlatformKey | null>(null);

  if (verifying) {
    return <VerifyFlow platform={verifying} onExit={() => setVerifying(null)} />;
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {PLATFORM_KEYS.map((p) => (
        <PlatformCard
          key={p}
          platform={p}
          accounts={accounts.filter((a) => a.platform === p)}
          onAdd={() => setVerifying(p)}
        />
      ))}
    </div>
  );
}

/* ---------------- platform card (landing) ---------------- */

function PlatformCard({
  platform, accounts, onAdd,
}: {
  platform: PlatformKey; accounts: Account[]; onAdd: () => void;
}) {
  const { label, Icon } = PLATFORMS[platform];
  const verified = accounts.length > 0;

  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-surface-2">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-lg font-bold">{label}</h3>
          <p className={`text-xs ${verified ? "text-emerald-400" : "text-muted"}`}>
            {verified ? `${accounts.length} verified` : "Not verified"}
          </p>
        </div>
        {verified && (
          <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
            <CheckIcon className="h-4 w-4" />
          </span>
        )}
      </div>

      {accounts.length > 0 && (
        <div className="mt-4 space-y-2">
          {accounts.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-2 rounded-xl border border-border bg-surface-2/50 px-3 py-2 text-sm"
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
                <CheckIcon className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1 truncate">
                <span className="font-medium">@{cleanHandle(a.handle)}</span>
                {a.method && (
                  <span className="ml-1.5 text-xs text-muted">
                    · {a.method === "bio" ? "Bio code" : "Instant sign-in"}
                  </span>
                )}
              </span>
              <RemoveBtn id={a.id} />
            </div>
          ))}
        </div>
      )}

      <button onClick={onAdd} className="btn-ghost mt-4 w-full">
        <PlusIcon className="h-4 w-4" /> Add Account
      </button>
    </div>
  );
}

/* =====================================================================
   The wizard, scoped to a single platform.
   ===================================================================== */

function VerifyFlow({ platform, onExit }: { platform: PlatformKey; onExit: () => void }) {
  const [stage, setStage] = useState<Stage>("method");
  const [method, setMethod] = useState<Method>("link");
  const [doneHandle, setDoneHandle] = useState("");
  const [pending, start] = useTransition();

  const finish = (handle: string) => {
    const cleaned = cleanHandle(handle);
    const fd = new FormData();
    fd.set("platform", platform);
    fd.set("handle", cleaned);
    fd.set("url", PROFILE_BASE[platform] + cleaned);
    fd.set("method", method);
    start(async () => {
      await verifyAccount(fd);
      setDoneHandle(cleaned);
      setStage("done");
    });
  };

  return (
    <div className="space-y-4">
      <button
        onClick={onExit}
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
      >
        <ArrowLeftIcon className="h-4 w-4" /> Back to accounts
      </button>

      <div className="card overflow-hidden">
        <WizardHeader platform={platform} stage={stage} method={method} />

        <div className="p-5 sm:p-7">
          {stage === "method" && (
            <MethodStep onPick={(m) => { setMethod(m); setStage("form"); }} />
          )}

          {stage === "form" && method === "link" && (
            <LinkFlow
              platform={platform}
              pending={pending}
              onBack={() => setStage("method")}
              onFinish={finish}
            />
          )}

          {stage === "form" && method === "bio" && (
            <BioFlow
              platform={platform}
              pending={pending}
              onBack={() => setStage("method")}
              onFinish={finish}
              onVerified={(h) => { setDoneHandle(h); setStage("done"); }}
            />
          )}

          {stage === "done" && (
            <DoneStep
              platform={platform}
              handle={doneHandle}
              onAgain={() => { setStage("method"); setMethod("link"); }}
              onExit={onExit}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- header / progress ---------------- */

function WizardHeader({
  platform, stage, method,
}: {
  platform: PlatformKey; stage: Stage; method: Method;
}) {
  const { label } = PLATFORMS[platform];
  const step = stage === "method" ? 1 : 2;
  const title =
    stage === "method" ? "Confirm it's really you"
    : stage === "done" ? "You're verified"
    : method === "link" ? "Set up an Eleviq sign-in"
    : "Verify through your bio";
  const subtitle =
    stage === "method" ? `Choose how you want to prove this ${label} account is yours.`
    : stage === "done" ? "This handle is now linked to your account."
    : method === "link" ? "We'll generate credentials and confirm them with a one-time code."
    : "Drop a one-time code in your bio and we'll match it.";

  return (
    <div className="border-b border-border bg-surface-2/40 px-5 py-5 text-center sm:px-7">
      <p className="label mb-1 !text-accent">Step {step} of 2 · {label}</p>
      <h2 className="font-display text-xl font-bold sm:text-2xl">{title}</h2>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-muted">{subtitle}</p>
      <div className="mx-auto mt-4 h-1 w-44 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: step === 1 ? "50%" : "100%" }}
        />
      </div>
    </div>
  );
}

/* ---------------- step 1: method ---------------- */

function MethodStep({ onPick }: { onPick: (m: Method) => void }) {
  return (
    <div>
      <p className="label">How do you want to verify?</p>
      <div className="grid gap-3">
        <MethodCard
          icon={<KeyIcon className="h-5 w-5" />}
          title="Instant sign-in"
          body="Generate an Eleviq Labs login and confirm it with a one-time code. Fastest way in."
          badge="Recommended"
          onClick={() => onPick("link")}
        />
        <MethodCard
          icon={<ShieldIcon className="h-5 w-5" />}
          title="Bio code"
          body="Add a short code to your profile bio and we'll match it to prove ownership."
          onClick={() => onPick("bio")}
        />
      </div>
    </div>
  );
}

function MethodCard({
  icon, title, body, badge, onClick,
}: {
  icon: React.ReactNode; title: string; body: string; badge?: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-4 rounded-2xl border border-border bg-surface-2/40 p-4 text-left transition hover:border-accent/60 hover:bg-accent/[0.06]"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
        {icon}
      </span>
      <span className="flex-1">
        <span className="flex items-center gap-2">
          <span className="font-semibold">{title}</span>
          {badge && (
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent">
              {badge}
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-sm text-muted">{body}</span>
      </span>
      <span className="text-muted transition group-hover:translate-x-0.5 group-hover:text-accent">→</span>
    </button>
  );
}

/* ---------------- step 2a: instant sign-in ---------------- */

function LinkFlow({
  platform, pending, onBack, onFinish,
}: {
  platform: PlatformKey; pending: boolean;
  onBack: () => void; onFinish: (handle: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [emailOk, setEmailOk] = useState(false);
  const [handle, setHandle] = useState("");
  const [handleOk, setHandleOk] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const creds = useMemo(() => {
    if (!handleOk) return null;
    const h = cleanHandle(handle).toLowerCase();
    return {
      login: `${h}.${platform.toLowerCase()}@creators.eleviqlabs.com`,
      password: `${rand(4)}-${rand(4)}-${rand(4)}`.toLowerCase(),
    };
  }, [handleOk, handle, platform]);

  const expectedOtp = useMemo(() => (creds ? otp() : ""), [creds]);

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <div className="space-y-3">
      <Step n={1} done={emailOk} title="Add your email" desc="Where we'll send account and payout updates.">
        {!emailOk ? (
          <div className="space-y-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input"
            />
            <button
              disabled={!validEmail}
              onClick={() => setEmailOk(true)}
              className="btn-accent w-full sm:w-auto"
            >
              Continue
            </button>
          </div>
        ) : (
          <LockedValue value={email} onEdit={() => { setEmailOk(false); setHandleOk(false); }} />
        )}
      </Step>

      <Step
        n={2}
        done={handleOk}
        locked={!emailOk}
        title="Add your handle"
        desc={`Your ${PLATFORMS[platform].label} username — we build your login from it.`}
      >
        {!handleOk ? (
          <div className="space-y-2">
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@yourhandle"
              className="input"
            />
            <button
              disabled={!cleanHandle(handle)}
              onClick={() => setHandleOk(true)}
              className="btn-accent w-full sm:w-auto"
            >
              Generate credentials
            </button>
          </div>
        ) : (
          <LockedValue value={"@" + cleanHandle(handle)} onEdit={() => setHandleOk(false)} />
        )}
      </Step>

      <Step
        n={3}
        done={!!creds}
        locked={!handleOk}
        title="Review your credentials"
        desc="Save these — you'll use them to sign in to Eleviq Labs."
      >
        {creds && (
          <div className="space-y-3">
            <CopyField label="Sign-in email" value={creds.login} />
            <CopyField label="Password" value={creds.password} />
          </div>
        )}
      </Step>

      <Step
        n={4}
        locked={!creds}
        title="Confirm with a one-time code"
        desc="Enter the code to finish verifying."
      >
        {creds && (
          <div className="space-y-2">
            <div className="rounded-xl border border-accent/30 bg-accent/[0.07] px-3.5 py-2.5 text-sm">
              <span className="text-muted">Demo mode — your code is </span>
              <span className="font-mono font-semibold tracking-widest text-accent">{expectedOtp}</span>
            </div>
            <input
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(""); }}
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              className="input font-mono tracking-[0.4em]"
            />
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <button
              disabled={pending}
              onClick={() => {
                if (code.trim() !== expectedOtp) { setError("That code doesn't match. Try again."); return; }
                onFinish(handle);
              }}
              className="btn-accent w-full"
            >
              {pending ? "Verifying…" : "Verify & finish"}
            </button>
          </div>
        )}
      </Step>

      <BackRow onBack={onBack} />
    </div>
  );
}

/* ---------------- step 2b: bio code ---------------- */

function BioFlow({
  platform, pending, onBack, onFinish, onVerified,
}: {
  platform: PlatformKey; pending: boolean;
  onBack: () => void; onFinish: (handle: string) => void; onVerified: (handle: string) => void;
}) {
  const isInstagram = platform === "INSTAGRAM";

  const [handle, setHandle] = useState("");
  const [started, setStarted] = useState(false);

  // Real Instagram flow state
  const [accountId, setAccountId] = useState<string | null>(null);
  const [realCode, setRealCode] = useState("");
  const [busy, start] = useTransition();
  const [error, setError] = useState("");
  const [info, setInfo] = useState<{ followers: number; isProfessional: boolean } | null>(null);

  // Simulated (non-IG) code
  const simCode = useMemo(() => (started && !isInstagram ? rand(6) : ""), [started, isInstagram]);
  const code = isInstagram ? realCode : simCode;

  const getCode = () => {
    setError("");
    if (!isInstagram) { setStarted(true); return; }
    const fd = new FormData();
    fd.set("handle", cleanHandle(handle));
    start(async () => {
      const r = await startInstagramVerification(fd);
      if (!r.ok) { setError(r.message); return; }
      setAccountId(r.accountId);
      setRealCode(r.code);
      setInfo({ followers: r.followers, isProfessional: r.isProfessional });
      setStarted(true);
    });
  };

  const check = () => {
    setError("");
    if (!isInstagram) { onFinish(handle); return; }
    if (!accountId) return;
    start(async () => {
      const r = await checkInstagramBio(accountId);
      if (!r.ok) { setError(r.message); return; }
      onVerified(cleanHandle(handle));
    });
  };

  const working = pending || busy;

  return (
    <div className="space-y-3">
      <Step n={1} done={started} title="Tell us the handle" desc={`The ${PLATFORMS[platform].label} account you want to verify.`}>
        {!started ? (
          <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="@yourhandle"
                className="input"
              />
              <button
                disabled={!cleanHandle(handle) || working}
                onClick={getCode}
                className="btn-accent shrink-0"
              >
                {working ? "Checking…" : "Get my code"}
              </button>
            </div>
            {error && <p className="text-sm text-rose-400">{error}</p>}
          </div>
        ) : (
          <LockedValue value={"@" + cleanHandle(handle)} onEdit={() => { setStarted(false); setAccountId(null); setError(""); }} />
        )}
      </Step>

      <Step n={2} locked={!started} title="Add the code to your bio" desc="Paste it anywhere in your profile bio, then save.">
        {started && (
          <div className="space-y-3">
            {info && (
              <p className="text-xs text-muted">
                Found @{cleanHandle(handle)} · {info.followers.toLocaleString()} followers ·{" "}
                {info.isProfessional ? "Professional account" : "Personal account"}
              </p>
            )}
            <CopyField label="Verification code" value={code} />
            <ol className="space-y-1.5 text-sm text-muted">
              <li>1. Open your {PLATFORMS[platform].label} profile and edit your bio.</li>
              <li>2. Paste the code above and save your changes.</li>
              <li>3. Come back and tap verify — you can remove it afterwards.</li>
            </ol>
          </div>
        )}
      </Step>

      <Step n={3} locked={!started} title="Check my bio" desc="We'll scan your profile for the code.">
        {started && (
          <div className="space-y-2">
            <button disabled={working} onClick={check} className="btn-accent w-full">
              {working ? "Checking your bio…" : "I've added it — verify now"}
            </button>
            {error && <p className="text-sm text-rose-400">{error}</p>}
          </div>
        )}
      </Step>

      <BackRow onBack={onBack} />
    </div>
  );
}

/* ---------------- done ---------------- */

function DoneStep({
  platform, handle, onAgain, onExit,
}: {
  platform: PlatformKey; handle: string; onAgain: () => void; onExit: () => void;
}) {
  const { label, Icon } = PLATFORMS[platform];
  return (
    <div className="grid place-items-center py-6 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
        <CheckIcon className="h-8 w-8" />
      </span>
      <h3 className="mt-4 font-display text-xl font-bold">Account verified</h3>
      <p className="mt-1.5 flex items-center gap-2 text-sm text-muted">
        <Icon className="h-4 w-4" /> @{handle} on {label} is linked.
      </p>
      <p className="mt-1 max-w-sm text-sm text-muted">
        You can now submit clips from this account to any campaign.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <button onClick={onAgain} className="btn-accent">
          <SparkleIcon className="h-4 w-4" /> Add another {label}
        </button>
        <button onClick={onExit} className="btn-ghost">Back to accounts</button>
      </div>
    </div>
  );
}

/* ---------------- shared bits ---------------- */

function Step({
  n, title, desc, children, done, locked,
}: {
  n: number; title: string; desc: string;
  children?: React.ReactNode; done?: boolean; locked?: boolean;
}) {
  return (
    <div className={`rounded-2xl border border-border p-4 transition ${locked ? "opacity-50" : "bg-surface-2/30"}`}>
      <div className="flex items-start gap-3">
        <span
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-bold ${
            done ? "bg-emerald-500/15 text-emerald-400" : "bg-accent text-accent-fg"
          }`}
        >
          {done ? <CheckIcon className="h-4 w-4" /> : n}
        </span>
        <div className="flex-1">
          <p className="font-semibold leading-tight">{title}</p>
          <p className="mt-0.5 text-sm text-muted">{desc}</p>
        </div>
      </div>
      {!locked && children && <div className="mt-3 pl-10">{children}</div>}
      {locked && <p className="mt-2 pl-10 text-sm text-muted">Finish the step above to continue.</p>}
    </div>
  );
}

function LockedValue({ value, onEdit }: { value: string; onEdit: () => void }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2/50 px-3.5 py-2.5 text-sm">
      <CheckIcon className="h-4 w-4 text-emerald-400" />
      <span className="flex-1 truncate font-medium">{value}</span>
      <button onClick={onEdit} className="text-xs text-muted hover:text-fg">Edit</button>
    </div>
  );
}

function BackRow({ onBack }: { onBack: () => void }) {
  return (
    <button onClick={onBack} className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
      <ArrowLeftIcon className="h-4 w-4" /> Choose a different method
    </button>
  );
}

function RemoveBtn({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => start(() => removeSocial(id))}
      disabled={pending}
      className="text-muted hover:text-rose-400"
      aria-label="Remove account"
    >
      <XIcon className="h-4 w-4" />
    </button>
  );
}
