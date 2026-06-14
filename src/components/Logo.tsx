import Link from "next/link";

/** Eleviq logo mark — an orange rounded square with an upward chevron ("elevate"). */
export function EleviqMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" role="img">
      <rect width="32" height="32" rx="9" fill="rgb(var(--accent))" />
      <path
        d="M8 21l8-10 8 10"
        fill="none"
        stroke="rgb(var(--accent-fg))"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Eleviq Labs lockup — the logo mark followed by the "ELEVIQ / LABS" wordmark,
 * built from type so it stays crisp at any size & theme.
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
  const scale =
    size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-lg";
  const markSize = size === "lg" ? "h-10 w-10" : size === "sm" ? "h-7 w-7" : "h-9 w-9";

  const wordmark = stacked ? (
    <div className="flex flex-col leading-none">
      <span className={`font-display font-extrabold tracking-[0.28em] ${scale}`}>
        ELEVIQ
      </span>
      <span className="mt-1 text-[0.62em] font-medium tracking-[0.55em] text-muted">
        LABS
      </span>
    </div>
  ) : (
    <span className="font-display font-extrabold tracking-[0.18em]">
      ELEVIQ <span className="text-muted font-medium tracking-[0.3em]">LABS</span>
    </span>
  );

  const inner = (
    <>
      <EleviqMark className={`${markSize} shrink-0`} />
      {wordmark}
    </>
  );

  if (!href) return <div className="flex select-none items-center gap-2.5 text-fg">{inner}</div>;

  return (
    <Link
      href={href}
      className="flex select-none items-center gap-2.5 text-fg transition-opacity hover:opacity-80"
    >
      {inner}
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
