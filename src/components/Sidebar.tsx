"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/theme";
import {
  HomeIcon, MegaphoneIcon, WalletIcon, ShieldIcon, ChartIcon, BankIcon,
  GiftIcon, DiscordIcon, LogoutIcon, UsersIcon, SettingsIcon, TrophyIcon, BellIcon,
} from "@/components/icons";

const CREATOR_NAV = [
  { href: "/dashboard", label: "Home", Icon: HomeIcon },
  { href: "/campaigns", label: "My Campaigns", Icon: MegaphoneIcon },
  { href: "/earnings", label: "Earnings", Icon: WalletIcon },
  { href: "/social", label: "Social Verification", Icon: ShieldIcon },
  { href: "/demographics", label: "Demographic Verification", Icon: ChartIcon },
  { href: "/bank", label: "Bank Account", Icon: BankIcon },
  { href: "/referrals", label: "Referrals", Icon: GiftIcon },
];

const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard", Icon: HomeIcon },
  { href: "/admin/creators", label: "Creators", Icon: UsersIcon },
  { href: "/admin/submissions", label: "Submissions", Icon: MegaphoneIcon },
  { href: "/admin/accounts", label: "Account Reviews", Icon: ShieldIcon },
  { href: "/admin/demographics", label: "Demographic Reviews", Icon: ChartIcon },
  { href: "/admin/campaigns", label: "Campaigns", Icon: ChartIcon },
  { href: "/admin/payouts", label: "Payout Requests", Icon: WalletIcon },
  { href: "/admin/settings", label: "Settings", Icon: SettingsIcon },
];

export function Sidebar({
  user,
  variant = "creator",
  discordUrl = "https://discord.gg/N2BJXwnHfa",
  unreadCount = 0,
}: {
  user: { name?: string | null; email?: string | null; image?: string | null; role?: string };
  variant?: "creator" | "admin";
  discordUrl?: string;
  unreadCount?: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const nav = variant === "admin" ? ADMIN_NAV : CREATOR_NAV;

  const NavLinks = (
    <nav className="flex-1 space-y-1">
      {nav.map(({ href, label, Icon }) => {
        const active = pathname === href || (href !== "/admin" && pathname.startsWith(href + "/"));
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              active ? "bg-accent/15 text-accent ring-1 ring-accent/25" : "text-muted hover:bg-surface-2 hover:text-fg"
            }`}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-bg/80 px-4 py-3 backdrop-blur lg:hidden">
        <Logo href={variant === "admin" ? "/admin" : "/dashboard"} size="sm" stacked={false} />
        <div className="flex items-center gap-1">
          {variant === "creator" && (
            <Link href="/leaderboard" className="relative flex h-10 w-10 items-center justify-center rounded-xl text-fg/70 hover:bg-surface-2 hover:text-fg" title="Leaderboard">
              <TrophyIcon className="h-5 w-5" />
            </Link>
          )}
          <Link
            href={variant === "creator" ? "/notifications" : "/admin/notifications"}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-fg/70 hover:bg-surface-2 hover:text-fg"
            title="Notifications"
          >
            <BellIcon className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
          <ThemeToggle />
          <button onClick={() => setOpen(!open)} className="btn-ghost h-10 w-10 !p-0" aria-label="Menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border bg-surface/95 p-4 backdrop-blur transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-2 py-3">
          <Logo href={variant === "admin" ? "/admin" : "/dashboard"} size="md" />
          <ThemeToggle className="hidden lg:flex" />
        </div>

        {variant === "admin" && (
          <span className="mx-2 mb-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent ring-1 ring-accent/25">
            Admin Panel
          </span>
        )}

        <div className="mt-2 flex-1 overflow-y-auto">{NavLinks}</div>

        {variant === "creator" && (
          <a
            href={discordUrl}
            target="_blank"
            rel="noreferrer"
            className="mb-3 flex items-center gap-3 rounded-xl bg-[#5865F2]/15 px-3 py-2.5 text-sm font-semibold text-[#7984f5] ring-1 ring-[#5865F2]/30 transition hover:bg-[#5865F2]/25"
          >
            <DiscordIcon className="h-[18px] w-[18px]" />
            Join our Discord
          </a>
        )}

        {/* User footer */}
        <div className="rounded-xl border border-border bg-surface-2/60 p-3">
          <div className="flex items-center gap-3">
            {variant === "creator" ? (
              <Link href="/settings" onClick={() => setOpen(false)} className="flex min-w-0 flex-1 items-center gap-3 hover:opacity-80 transition">
                <Avatar user={user} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{user.name ?? "Creator"}</p>
                  <p className="truncate text-xs text-muted">{user.email}</p>
                </div>
              </Link>
            ) : (
              <>
                <Avatar user={user} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{user.name ?? "Admin"}</p>
                  <p className="truncate text-xs text-muted">{user.email}</p>
                </div>
              </>
            )}
            <button
              onClick={() => signOut({ redirectTo: "/auth" })}
              className="btn-ghost h-9 w-9 !p-0"
              aria-label="Log out"
              title="Log out"
            >
              <LogoutIcon className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {open && <div onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-black/50 lg:hidden" />}
    </>
  );
}

function Avatar({ user }: { user: { name?: string | null; image?: string | null } }) {
  if (user.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={user.image} alt="" className="h-9 w-9 rounded-full object-cover" />;
  }
  const initials = (user.name ?? "E").slice(0, 1).toUpperCase();
  return <div className="grid h-9 w-9 place-items-center rounded-full bg-accent/20 text-sm font-bold text-accent">{initials}</div>;
}
