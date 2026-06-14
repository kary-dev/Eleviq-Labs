"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { createInstagramLogin, type CreateLoginResult } from "@/app/auth/actions";
import { CopyField } from "@/components/CopyField";
import { DiscordIcon, InstagramIcon, CheckIcon, ArrowLeftIcon } from "@/components/icons";

type View = "main" | "ig" | "creds" | "email";

export function AuthCard({ discordEnabled }: { discordEnabled: boolean }) {
  const [view, setView] = useState<View>("main");
  const [loading, setLoading] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  // instant sign-up
  const [handle, setHandle] = useState("");
  const [creds, setCreds] = useState<{ email: string; password: string; username: string } | null>(null);

  // email sign-in
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const discord = async () => {
    setLoading("discord");
    await signIn("discord", { redirectTo: "/dashboard" });
  };

  const igSignup = () => {
    setError("");
    const fd = new FormData();
    fd.set("handle", handle);
    start(async () => {
      const r: CreateLoginResult = await createInstagramLogin(fd);
      if (r.ok) {
        setCreds({ email: r.email, password: r.password, username: r.username });
        setView("creds");
      } else {
        if (r.alreadyRegistered) { setEmail(`${handle.replace(/^@/, "")}@creators.eleviqlabs.com`); setView("email"); }
        setError(r.message);
      }
    });
  };

  const emailSignin = (e: string, p: string) => {
    setError("");
    start(async () => {
      const res = await signIn("credentials", { email: e, password: p, redirect: false });
      if (res?.error) setError("Email or password is incorrect.");
      else window.location.href = "/dashboard";
    });
  };

  return (
    <div className="card w-full max-w-md p-7 sm:p-9">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold">
          <span className="bg-gradient-to-r from-accent to-fg bg-clip-text text-transparent">Eleviq</span> Labs
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          {view === "creds" ? "Save your login details" : view === "email" ? "Sign in with your email" : view === "ig" ? "Sign up with Instagram" : "Sign in to your creator account"}
        </p>
      </div>

      {/* MAIN */}
      {view === "main" && (
        <div className="mt-7 space-y-3">
          <button onClick={() => setView("ig")} disabled={!!loading} className="btn-accent w-full py-3">
            <InstagramIcon className="h-5 w-5" /> Sign up with Instagram
          </button>

          {discordEnabled && (
            <button onClick={discord} disabled={!!loading} className="btn-ghost w-full py-3">
              <DiscordIcon className="h-5 w-5" />
              {loading === "discord" ? "Redirecting…" : "Continue with Discord"}
            </button>
          )}

          <button onClick={() => setView("email")} className="w-full py-2 text-center text-sm text-muted hover:text-fg">
            Already have a login? Sign in with email →
          </button>
        </div>
      )}

      {/* INSTAGRAM SIGN-UP */}
      {view === "ig" && (
        <div className="mt-7 space-y-3">
          <div>
            <label className="label">Instagram username</label>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@yourhandle"
              className="input"
              autoFocus
            />
            <p className="mt-1.5 text-xs text-muted">
              We'll check it's a public Professional account, then create your Eleviq Labs login.
            </p>
          </div>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <button onClick={igSignup} disabled={pending || !handle.trim()} className="btn-accent w-full py-3">
            {pending ? "Checking your account…" : "Create my login"}
          </button>
          <BackBtn onClick={() => { setView("main"); setError(""); }} />
        </div>
      )}

      {/* GENERATED CREDENTIALS */}
      {view === "creds" && creds && (
        <div className="mt-6">
          <div className="rounded-2xl border border-accent/30 bg-accent/[0.06] p-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-accent">
              <CheckIcon className="h-4 w-4" /> Generated login details
            </p>
            <div className="space-y-3">
              <CopyField label="Email" value={creds.email} />
              <CopyField label="Password" value={creds.password} />
              <CopyField label="Username / handle" value={creds.username} />
            </div>
            <p className="mt-3 text-xs text-muted">
              Save these somewhere safe — you'll use them to sign in and finish verifying your account.
            </p>
          </div>
          <button onClick={() => emailSignin(creds.email, creds.password)} disabled={pending} className="btn-accent mt-4 w-full py-3">
            {pending ? "Signing you in…" : "I've saved them — sign me in"}
          </button>
        </div>
      )}

      {/* EMAIL SIGN-IN */}
      {view === "email" && (
        <div className="mt-7 space-y-3">
          <div>
            <label className="label">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@creators.eleviqlabs.com" className="input" />
          </div>
          <div>
            <label className="label">Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" className="input" />
          </div>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <button onClick={() => emailSignin(email, password)} disabled={pending || !email || !password} className="btn-accent w-full py-3">
            {pending ? "Signing in…" : "Sign in"}
          </button>
          <BackBtn onClick={() => { setView("main"); setError(""); }} />
        </div>
      )}

      <p className="mt-6 text-center text-xs text-muted">
        By continuing you agree to our{" "}
        <a href="#" className="text-accent hover:underline">Privacy Policy</a>
      </p>
    </div>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex w-full items-center justify-center gap-1.5 py-1 text-sm text-muted hover:text-fg">
      <ArrowLeftIcon className="h-4 w-4" /> Back
    </button>
  );
}
