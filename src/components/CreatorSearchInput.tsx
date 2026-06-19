"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export function CreatorSearchInput() {
  const router = useRouter();
  const params = useSearchParams();
  const [, start] = useTransition();

  return (
    <input
      type="search"
      defaultValue={params.get("q") ?? ""}
      placeholder="Search by name or email…"
      className="input max-w-xs text-sm"
      onChange={(e) => {
        const q = e.target.value.trim();
        start(() => {
          const p = new URLSearchParams();
          if (q) p.set("q", q);
          router.push(`/admin/creators${q ? `?${p}` : ""}`);
        });
      }}
    />
  );
}
