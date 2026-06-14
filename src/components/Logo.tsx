import Link from "next/link";

/**
 * Eleviq Labs wordmark — the stacked "ELEVIQ / LABS" lockup from the brand logo,
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

  const inner = stacked ? (
    <div className="flex flex-col items-center leading-none">
      <span className={`font-display font-extrabold tracking-[0.3em] ${scale}`}>
        ELEVIQ
      </span>
      <span className="mt-1.5 text-[0.5em] font-semibold tracking-[0.6em] text-muted">
        LABS
      </span>
    </div>
  ) : (
    <span className="font-display font-extrabold tracking-[0.2em]">
      ELEVIQ <span className="text-muted font-semibold tracking-[0.32em]">LABS</span>
    </span>
  );

  if (!href) return <div className="select-none text-fg">{inner}</div>;

  return (
    <Link href={href} className="select-none text-fg transition-opacity hover:opacity-80">
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
