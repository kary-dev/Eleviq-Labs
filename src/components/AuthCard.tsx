"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { DiscordIcon } from "@/components/icons";

export function AuthCard({
  discordEnabled,
  devEnabled,
}: {
  discordEnabled: boolean;
  devEnabled: boolean;
}) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState<string | null>(null);
  const [showDev, setShowDev] = useState(false);

  const discord = async () => {
    setLoading("discord");
    await signIn("discord", { redirectTo: "/dashboard" });
  };

  const devLogin = async (email: string) => {
    setLoading(email);
    await signIn("dev", { email, redirectTo: "/dashboard" });
  };

  return (
    <div className="card w-full max-w-md p-7 sm:p-9">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold">
          <span className="bg-gradient-to-r from-accent to-fg bg-clip-text text-transparent">
            Eleviq
          </span>{" "}
          Labs
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          {mode === "signin" ? "Log in to your creator dashboard" : "Set up your creator account"}
        </p>
      </div>

      <div className="mt-7 space-y-3">
        {discordEnabled ? (
          <button onClick={discord} disabled={!!loading} className="btn-accent w-full py-3">
            <DiscordIcon className="h-5 w-5" />
            {loading === "discord"
              ? "Redirecting…"
              : mode === "signin"
              ? "Sign in with Discord"
              : "Sign up with Discord"}
          </button>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-surface-2/40 p-3 text-center text-xs text-muted">
            Discord login isn’t configured yet. Add <code className="text-fg">AUTH_DISCORD_ID</code> &{" "}
            <code className="text-fg">AUTH_DISCORD_SECRET</code> in <code className="text-fg">.env</code>.
          </div>
        )}

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="btn-ghost w-full py-3"
        >
          {mode === "signin" ? "Sign Up" : "Already have an account? Sign In"}
        </button>
      </div>

      {devEnabled && (
        <div className="mt-6 border-t border-border pt-5">
          {!showDev ? (
            <button onClick={() => setShowDev(true)} className="w-full text-center text-xs text-muted hover:text-fg">
              Continue without Discord (dev) →
            </button>
          ) : (
            <div className="space-y-2">
              <p className="label mb-2">Dev quick login</p>
              <button onClick={() => devLogin("creator@eleviqlabs.com")} disabled={!!loading} className="btn-soft w-full justify-between">
                <span>👤 Demo Creator</span>
                <span className="text-xs text-muted">creator@eleviqlabs.com</span>
              </button>
              <button onClick={() => devLogin("admin@eleviqlabs.com")} disabled={!!loading} className="btn-soft w-full justify-between">
                <span>🛠️ Admin</span>
                <span className="text-xs text-muted">admin@eleviqlabs.com</span>
              </button>
            </div>
          )}
        </div>
      )}

      <p className="mt-6 text-center text-xs text-muted">
        By continuing you agree to our{" "}
        <a href="#" className="text-accent hover:underline">
          Privacy Policy
        </a>
      </p>
    </div>
  );
}
