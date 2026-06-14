import { ReactNode } from "react";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="card p-5">
      <p className="label">{label}</p>
      <p className="stat-value">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function EmptyState({ title, body, icon }: { title: string; body?: string; icon?: ReactNode }) {
  return (
    <div className="card grid place-items-center px-6 py-14 text-center">
      {icon && <div className="mb-3 text-muted">{icon}</div>}
      <p className="font-semibold">{title}</p>
      {body && <p className="mt-1.5 max-w-sm text-sm text-muted">{body}</p>}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25",
  APPROVED: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25",
  REJECTED: "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/25",
  PAID: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25",
  ACTIVE: "bg-accent/15 text-accent ring-1 ring-accent/30",
  ENDED: "bg-surface-2 text-muted ring-1 ring-border",
  DRAFT: "bg-surface-2 text-muted ring-1 ring-border",
  VERIFIED: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25",
};

export function StatusPill({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? "bg-surface-2 text-muted ring-1 ring-border";
  return <span className={`pill ${cls}`}>{status.charAt(0) + status.slice(1).toLowerCase()}</span>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card p-5 sm:p-6 ${className}`}>{children}</div>;
}
