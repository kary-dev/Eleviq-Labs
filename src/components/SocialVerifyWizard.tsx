"use client";

import { useMemo, useState, useTransition } from "react";
import {
  verifyAccount, removeSocial,
  startVerification, checkVerification,
} from "@/app/(creator)/actions";
import { PLATFORMS, PLATFORM_KEYS, PlatformKey } from "@/lib/platforms";
import { CopyField } from "@/components/CopyField";
import {
  CheckIcon, XIcon, KeyIcon, ShieldIcon, ArrowLeftIcon, SparkleIcon, PlusIcon,
} from "@/components/icons";

type Account = {
  id: string; platform: string; handle: string;
  url: string | null; verified: boolean; method?: string | null;
  verificationStatus?: string | null;
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
const cleanHandle = (h: string) => h.trim().replace(/^@+/, "");

// Human-friendly generated password, e.g. "SolarPrime48?" (stored as a record).
const genPassword = () => {
  const a = ["Solar", "Lunar", "Nova", "Pixel", "Echo", "Vivid", "Prime", "Hyper", "Neon", "Aero", "Volt", "Zephyr"];
  const b = ["Prime", "Wave", "Pulse", "Flux", "Spark", "Drift", "Core", "Shift", "Bloom", "Crest"];
  const sym = "!?#$%&";
  const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
  return `${pick(a)}${pick(b)}${Math.floor(10 + Math.random() * 90)}${pick(sym.split(""))}`;
};

/* =====================================================================
   Top-level: shows the platform grid, or the wizard for one platform.
   ===================================================================== */

export function SocialVerifyWizard({ accounts }: { accounts: Account[] }) {
  const [verifying, setVerifying] = useState<PlatformKey | null>(null);

  if (verifying) {
    return <VerifyFlow platform={verifying} onExit={() => setVerifying(null)} />;
  }

  return (
    <div className="grid gap-7 md:grid-cols-2">
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
  const approvedCount = accounts.filter((a) => a.verificationStatus === "APPROVED").length;
  const pendingCount = accounts.filter((a) => a.verificationStatus === "PENDING_REVIEW").length;

  const summary =
    approvedCount > 0
      ? `${approvedCount} verified${pendingCount ? ` · ${pendingCount} in review` : ""}`
      : pendingCount > 0
      ? `${pendingCount} in review`
      : "Not verified";

  return (
    <div className="card flex flex-col p-7">
      <div className="flex items-center gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-xl border border-border bg-surface-2">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-lg font-bold">{label}</h3>
          <p className={`text-xs ${approvedCount > 0 ? "text-emerald-400" : pendingCount > 0 ? "text-amber-400" : "text-muted"}`}>
            {summary}
          </p>
        </div>
        {approvedCount > 0 && (
          <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
            <CheckIcon className="h-4 w-4" />
          </span>
        )}
      </div>

      {accounts.length > 0 && (
        <div className="mt-6 space-y-3">
          {accounts.map((a) => {
            const approved = a.verificationStatus === "APPROVED";
            return (
            <div
              key={a.id}
              className="flex items-center gap-2 rounded-xl border border-border bg-surface-2/50 px-4 py-3 text-sm"
            >
              <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${approved ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
                {approved ? <CheckIcon className="h-3.5 w-3.5" /> : <ShieldIcon className="h-3.5 w-3.5" />}
              </span>
              <span className="min-w-0 flex-1 truncate">
                <span className="font-medium">@{cleanHandle(a.handle)}</span>
                <span className={`ml-1.5 text-xs ${approved ? "text-muted" : "text-amber-400"}`}>
                  · {approved ? "Verified" : "Pending admin review"}
                </span>
              </span>
              <RemoveBtn id={a.id} />
            </div>
            );
          })}
        </div>
      )}

      <button onClick={onAdd} className="btn-ghost mt-7 w-full">
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
              onVerified={(h) => { setDoneHandle(h); setStage("done"); }}
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
    : stage === "done" ? "Sent for review"
    : method === "link" ? "Set up an Eleviq sign-in"
    : "Verify through your bio";
  const subtitle =
    stage === "method" ? `Choose how you want to prove this ${label} account is yours.`
    : stage === "done" ? "An admin will review and approve this account shortly."
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
  platform, pending, onBack, onFinish, onVerified,
}: {
  platform: PlatformKey; pending: boolean;
  onBack: () => void; onFinish: (handle: string) => void; onVerified: (handle: string) => void;
}) {
  const hasProvider = platform !== "X";

  const [handle, setHandle] = useState("");
  const [creds, setCreds] = useState<{ email: string; username: string; password: string } | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [started, setStarted] = useState(false);
  const [busy, start] = useTransition();
  const [error, setError] = useState("");

  const working = pending || busy;

  const make = () => {
    setError("");
    const u = cleanHandle(handle).toLowerCase();
    if (!u) return;
    const generated = { username: u, email: `${u}@creators.eleviqlabs.com`, password: genPassword() };
    if (!hasProvider) {
      setCreds(generated);
      setCode(rand(6));
      setStarted(true);
      return;
    }
    const fd = new FormData();
    fd.set("platform", platform);
    fd.set("handle", u);
    fd.set("method", "link");
    fd.set("loginEmail", generated.email);
    fd.set("loginUsername", generated.username);
    fd.set("loginPassword", generated.password);
    start(async () => {
      const r = await startVerification(fd);
      if (!r.ok) { setError(r.message); return; }
      setCreds(generated);
      setAccountId(r.accountId);
      setCode(r.code);
      setStarted(true);
    });
  };

  const check = () => {
    setError("");
    if (!hasProvider) { onFinish(handle); return; }
    if (!accountId) return;
    start(async () => {
      const r = await checkVerification(accountId);
      if (!r.ok) { setError(r.message); return; }
      onVerified(cleanHandle(handle));
    });
  };

  return (
    <div className="space-y-3">
      <Step n={1} done={started} title="Your handle" desc={`Your ${PLATFORMS[platform].label} username — we build a login from it.`}>
        {!started ? (
          <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="@yourhandle"
                className="input"
              />
              <button disabled={!cleanHandle(handle) || working} onClick={make} className="btn-accent shrink-0">
                {working ? "Creating…" : "Create my login"}
              </button>
            </div>
            {error && <p className="text-sm text-rose-400">{error}</p>}
          </div>
        ) : (
          <LockedValue
            value={"@" + cleanHandle(handle)}
            onEdit={() => { setStarted(false); setAccountId(null); setCreds(null); setError(""); }}
          />
        )}
      </Step>

      <Step n={2} locked={!started} title="Review your credentials" desc="Saved to your account — keep them somewhere safe.">
        {started && creds && (
          <div className="space-y-3">
            <CopyField label="Email" value={creds.email} />
            <CopyField label="Username" value={creds.username} />
            <CopyField label="Password" value={creds.password} />
          </div>
        )}
      </Step>

      <Step n={3} locked={!started} title="Add the code to your bio" desc="Paste it anywhere in your profile bio, then save.">
        {started && (
          <div className="space-y-3">
            <CopyField label="Verification code" value={code} />
            <ol className="space-y-1.5 text-sm text-muted">
              <li>1. Open your {PLATFORMS[platform].label} profile and edit your bio.</li>
              <li>2. Paste the code above and save your changes.</li>
              <li>3. Come back and verify — you can remove it afterwards.</li>
            </ol>
          </div>
        )}
      </Step>

      <Step n={4} locked={!started} title="Verify" desc="We'll scan your profile for the code.">
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

/* ---------------- step 2b: bio code ---------------- */

function BioFlow({
  platform, pending, onBack, onFinish, onVerified,
}: {
  platform: PlatformKey; pending: boolean;
  onBack: () => void; onFinish: (handle: string) => void; onVerified: (handle: string) => void;
}) {
  const hasProvider = platform !== "X";

  const [handle, setHandle] = useState("");
  const [started, setStarted] = useState(false);

  // Real verification flow state (Instagram / YouTube / TikTok)
  const [accountId, setAccountId] = useState<string | null>(null);
  const [realCode, setRealCode] = useState("");
  const [busy, start] = useTransition();
  const [error, setError] = useState("");
  const [info, setInfo] = useState<{ followers: number } | null>(null);

  // Simulated (X) code
  const simCode = useMemo(() => (started && !hasProvider ? rand(6) : ""), [started, hasProvider]);
  const code = hasProvider ? realCode : simCode;

  const getCode = () => {
    setError("");
    if (!hasProvider) { setStarted(true); return; }
    const fd = new FormData();
    fd.set("platform", platform);
    fd.set("handle", cleanHandle(handle));
    start(async () => {
      const r = await startVerification(fd);
      if (!r.ok) { setError(r.message); return; }
      setAccountId(r.accountId);
      setRealCode(r.code);
      setInfo({ followers: r.followers });
      setStarted(true);
    });
  };

  const check = () => {
    setError("");
    if (!hasProvider) { onFinish(handle); return; }
    if (!accountId) return;
    start(async () => {
      const r = await checkVerification(accountId);
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
                Found @{cleanHandle(handle)} · {info.followers.toLocaleString()} followers
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
      <span className="grid h-16 w-16 place-items-center rounded-full bg-amber-500/15 text-amber-400">
        <ShieldIcon className="h-8 w-8" />
      </span>
      <h3 className="mt-4 font-display text-xl font-bold">Sent for admin review</h3>
      <p className="mt-1.5 flex items-center gap-2 text-sm text-muted">
        <Icon className="h-4 w-4" /> @{handle} on {label} is awaiting approval.
      </p>
      <p className="mt-1 max-w-sm text-sm text-muted">
        An admin will review your account. Once approved, you can submit clips from it to any campaign.
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
