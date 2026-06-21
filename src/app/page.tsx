import Link from "next/link";
import {
  MegaphoneIcon,
  WalletIcon,
  ChartIcon,
  CheckIcon,
  UsersIcon,
  SparkleIcon,
  DiscordIcon,
} from "@/components/icons";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="font-display text-lg font-bold tracking-tight">
            Eleviq <span className="text-accent">Labs</span>
          </span>
          <div className="flex items-center gap-3">
            <a href="/auth" className="btn-ghost text-sm">Sign in</a>
            <a href="/auth" className="btn-accent text-sm">Get started</a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-24 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm text-accent">
          <SparkleIcon className="h-3.5 w-3.5" />
          UGC creator campaigns — now open
        </div>
        <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
          Make the clips.
          <br />
          <span className="text-accent">Keep the earnings.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
          Eleviq Labs connects short-form creators with brand campaigns. Post content, rack up views, get paid — no agencies, no guesswork.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a href="/auth" className="btn-accent px-6 py-3 text-base">Start earning →</a>
          <a href="#how-it-works" className="btn-ghost px-6 py-3 text-base">How it works</a>
        </div>

        {/* Stats strip */}
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-3 gap-px overflow-hidden rounded-2xl border border-border bg-border">
          {[
            { value: "₹/1K views", label: "Performance payout" },
            { value: "20K", label: "Views to unlock payout" },
            { value: "Real-time", label: "View tracking" },
          ].map((s) => (
            <div key={s.label} className="bg-surface px-6 py-5 text-center">
              <p className="font-display text-2xl font-bold text-accent">{s.value}</p>
              <p className="mt-1 text-xs text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-border bg-surface-2/40 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-3 text-center font-display text-3xl font-bold sm:text-4xl">How it works</h2>
          <p className="mb-14 text-center text-muted">Three steps from signup to payout.</p>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                step: "01",
                icon: <MegaphoneIcon className="h-6 w-6 text-accent" />,
                title: "Pick a campaign",
                body: "Browse active brand campaigns and join the ones that match your content style.",
              },
              {
                step: "02",
                icon: <UsersIcon className="h-6 w-6 text-accent" />,
                title: "Submit your clip",
                body: "Post on Instagram, TikTok, or YouTube — paste the link and we verify your views automatically.",
              },
              {
                step: "03",
                icon: <WalletIcon className="h-6 w-6 text-accent" />,
                title: "Get paid",
                body: "Earn per 1,000 views on approved clips. Hit 20K total views and request your first payout.",
              },
            ].map((item) => (
              <div key={item.step} className="card p-7">
                <span className="mb-4 block font-display text-4xl font-extrabold text-accent/20">{item.step}</span>
                <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl border border-border bg-surface-2">
                  {item.icon}
                </div>
                <h3 className="mb-2 font-semibold">{item.title}</h3>
                <p className="text-sm text-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For creators */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">For creators</p>
              <h2 className="mb-5 font-display text-3xl font-bold sm:text-4xl">Your content, your earnings</h2>
              <p className="mb-8 text-muted">
                No minimum follower count. No hidden fees. Just real campaigns, real views, and real money deposited to your account.
              </p>
              <ul className="space-y-3">
                {[
                  "Performance-based payouts — earn more as views grow",
                  "Multiple platforms: Instagram, TikTok, YouTube",
                  "Real-time earnings dashboard",
                  "Payout via bank transfer or PayPal",
                  "Referral bonuses for bringing in other creators",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <a href="/auth" className="btn-accent mt-10 inline-flex">Join as a creator →</a>
            </div>
            <div className="card divide-y divide-border overflow-hidden">
              {[
                { label: "Campaign: Brand Drop", views: "12,400 views", payout: "+₹124.00", status: "Approved" },
                { label: "Campaign: Summer Launch", views: "8,200 views", payout: "+₹82.00", status: "Approved" },
                { label: "Campaign: App Promo", views: "Pending review", payout: "—", status: "Pending" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold">{row.label}</p>
                    <p className="text-xs text-muted">{row.views}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-accent">{row.payout}</p>
                    <p className={`text-xs ${row.status === "Approved" ? "text-emerald-400" : "text-amber-400"}`}>
                      {row.status}
                    </p>
                  </div>
                </div>
              ))}
              <div className="bg-surface-2/60 px-5 py-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Total earned</span>
                  <span className="font-display font-bold text-accent">₹206.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For brands */}
      <section className="border-t border-border bg-surface-2/40 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <div className="order-last lg:order-first">
              <div className="card space-y-4 p-6">
                {[
                  { icon: <ChartIcon className="h-5 w-5 text-accent" />, title: "Real view tracking", body: "Views pulled directly from platform APIs — no self-reported numbers." },
                  { icon: <UsersIcon className="h-5 w-5 text-accent" />, title: "Verified creators", body: "Every creator links their account. You see exactly who's posting what." },
                  { icon: <WalletIcon className="h-5 w-5 text-accent" />, title: "Budget control", body: "Set a campaign budget and a per-1K-views rate. Pay only for performance." },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-surface-2">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="mt-0.5 text-xs text-muted">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">For brands</p>
              <h2 className="mb-5 font-display text-3xl font-bold sm:text-4xl">Performance UGC at scale</h2>
              <p className="mb-8 text-muted">
                Launch a campaign in minutes. Real creators, real content, real views — and you only pay for results.
              </p>
              <a href="mailto:eleviqlabs@gmail.com" className="btn-accent inline-flex">Contact us to launch →</a>
            </div>
          </div>
        </div>
      </section>

      {/* Discord CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <a
            href="https://discord.gg/N2BJXwnHfa"
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center gap-5 rounded-3xl border border-[#5865F2]/30 bg-[#5865F2]/10 p-12 text-center transition hover:bg-[#5865F2]/15 sm:flex-row sm:text-left"
          >
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[#5865F2]/20 text-[#7984f5]">
              <DiscordIcon className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <p className="font-display text-xl font-bold">Join the Eleviq Labs Discord</p>
              <p className="mt-1 text-muted">Campaign drops, creator support, and payout updates — all in one place.</p>
            </div>
            <span className="btn-ghost shrink-0 border-[#5865F2]/40 text-[#7984f5]">Join now →</span>
          </a>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border bg-surface-2/40 py-24 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="mb-4 font-display text-4xl font-extrabold sm:text-5xl">Ready to start earning?</h2>
          <p className="mb-10 text-lg text-muted">Sign in with Discord and join your first campaign in under 2 minutes.</p>
          <a href="/auth" className="btn-accent px-8 py-3.5 text-base">Get started free →</a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 text-sm text-muted">
          <span className="font-display font-bold">Eleviq <span className="text-accent">Labs</span></span>
          <div className="flex gap-6">
            <a href="/auth" className="transition hover:text-foreground">Sign in</a>
            <a href="https://discord.gg/N2BJXwnHfa" target="_blank" rel="noreferrer" className="transition hover:text-foreground">Discord</a>
            <a href="mailto:eleviqlabs@gmail.com" className="transition hover:text-foreground">Contact</a>
          </div>
          <span>© {new Date().getFullYear()} Eleviq Labs</span>
        </div>
      </footer>
    </div>
  );
}
