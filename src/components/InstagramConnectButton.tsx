"use client";

import { InstagramIcon, CheckIcon } from "@/components/icons";

export function InstagramConnectButton({ connected }: { connected: boolean }) {
  if (connected) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2/50 px-4 py-3 text-sm">
        <CheckIcon className="h-4 w-4 text-accent" />
        <span className="font-semibold">Instagram Analytics connected</span>
        <span className="ml-auto text-xs text-muted">Real view counts active</span>
      </div>
    );
  }

  return (
    <a
      href="/api/auth/instagram/connect"
      className="btn-accent flex items-center justify-center gap-2 w-full"
    >
      <InstagramIcon className="h-4 w-4" />
      Connect Instagram Analytics
    </a>
  );
}
