"use client";

import { useTransition } from "react";

export function SettingsToggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: (val: boolean) => Promise<void>;
}) {
  const [pending, start] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => start(() => onToggle(!enabled))}
      aria-checked={enabled}
      role="switch"
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60 ${
        enabled ? "bg-accent" : "bg-surface-2 ring-1 ring-border"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
