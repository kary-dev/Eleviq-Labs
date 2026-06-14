"use client";

import Link from "next/link";
import { useState } from "react";

const LOGO_SRC = "/eleviq-logo.png";

/**
 * Eleviq Labs logo. Renders the official brand image (public/eleviq-logo.png)
 * when present, and falls back to a crisp typographic ELEVIQ / LABS wordmark
 * otherwise — so the header never shows a broken image.
 */
export function Logo({
  href = "/dashboard",
  size = "md",
  stacked = true,
}: {
  href?: string | null;
  size?: "sm" | "md" | "lg";
  stacked?: boolean;
}) {
  const [imgOk, setImgOk] = useState(true);
  const h = size === "lg" ? "h-12" : size === "sm" ? "h-7" : "h-9";
  const scale = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-lg";

  const wordmark = stacked ? (
    <div className="flex flex-col items-center leading-none">
      <span className={`font-display font-extrabold tracking-[0.3em] ${scale}`}>ELEVIQ</span>
      <span className="mt-1.5 text-[0.5em] font-semibold tracking-[0.6em] text-muted">LABS</span>
    </div>
  ) : (
    <span className="font-display font-extrabold tracking-[0.2em]">
      ELEVIQ <span className="font-semibold tracking-[0.32em] text-muted">LABS</span>
    </span>
  );

  const content = imgOk ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_SRC}
      alt="Eleviq Labs"
      className={`logo-img w-auto ${h}`}
      onError={() => setImgOk(false)}
    />
  ) : (
    wordmark
  );

  if (!href) return <div className="select-none text-fg">{content}</div>;

  return (
    <Link href={href} className="select-none text-fg transition-opacity hover:opacity-80">
      {content}
    </Link>
  );
}

/** Compact mark used as a favicon-style badge */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <div
      className={`grid h-9 w-9 place-items-center rounded-xl border border-border bg-surface-2 font-display text-sm font-extrabold tracking-tighter text-fg ${className}`}
    >
      E
    </div>
  );
}
