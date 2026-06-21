import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Eleviq Labs — Get your content seen at scale",
  description:
    "Eleviq Labs connects short-form creators with brand campaigns. Post content, rack up views, get paid.",
};

export default function LandingPage() {
  return (
    <div
      style={{ background: "#0a0a0a", color: "#ffffff", fontFamily: "inherit" }}
      className="min-h-screen"
    >
      {/* ─── NAV ─── */}
      <nav
        style={{ borderBottom: "1px solid #1a1a1a" }}
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-5 md:px-12"
      >
        <span
          style={{ fontWeight: 800, fontSize: "1.125rem", letterSpacing: "-0.02em" }}
        >
          ELEVIQ <span style={{ color: "#ef4444" }}>LABS</span>
        </span>

        <div className="hidden items-center gap-8 text-sm md:flex" style={{ color: "#888" }}>
          <a href="#how-it-works" className="transition-colors hover:text-white">How it works</a>
          <a href="#creators" className="transition-colors hover:text-white">Creators</a>
          <a href="#brands" className="transition-colors hover:text-white">Brands</a>
          <a
            href="https://discord.gg/N2BJXwnHfa"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-white"
          >
            Discord
          </a>
        </div>

        <a
          href="/auth"
          style={{
            background: "#ef4444",
            color: "#fff",
            padding: "0.5rem 1.25rem",
            borderRadius: "0.375rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            textDecoration: "none",
            transition: "background 0.15s",
          }}
        >
          Get started
        </a>
      </nav>

      {/* ─── HERO ─── */}
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-20 md:px-12 md:pt-32">
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "#1a0a0a",
            border: "1px solid #3f1515",
            borderRadius: "999px",
            padding: "0.375rem 1rem",
            fontSize: "0.8rem",
            color: "#ef4444",
            marginBottom: "2rem",
            fontWeight: 500,
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#ef4444",
              display: "inline-block",
            }}
          />
          Campaigns now open
        </div>

        <h1
          style={{
            fontSize: "clamp(2.75rem, 7vw, 5.5rem)",
            fontWeight: 900,
            lineHeight: 1.0,
            letterSpacing: "-0.04em",
            marginBottom: "1.5rem",
          }}
        >
          Get your content
          <br />
          seen{" "}
          <span style={{ color: "#ef4444" }}>at scale.</span>
        </h1>

        <p
          style={{
            fontSize: "1.125rem",
            color: "#888",
            maxWidth: "36rem",
            lineHeight: 1.6,
            marginBottom: "2.5rem",
          }}
        >
          We connect short-form creators with brand campaigns that pay per view.
          One job — get you seen.
        </p>

        <div className="flex flex-wrap gap-4">
          <a
            href="/auth"
            style={{
              background: "#ef4444",
              color: "#fff",
              padding: "0.875rem 2rem",
              borderRadius: "0.5rem",
              fontWeight: 700,
              fontSize: "1rem",
              textDecoration: "none",
              letterSpacing: "-0.01em",
            }}
          >
            Start earning →
          </a>
          <a
            href="#how-it-works"
            style={{
              background: "transparent",
              color: "#fff",
              padding: "0.875rem 2rem",
              borderRadius: "0.5rem",
              fontWeight: 600,
              fontSize: "1rem",
              textDecoration: "none",
              border: "1px solid #333",
            }}
          >
            How it works
          </a>
        </div>

        {/* Stats */}
        <div
          style={{ borderTop: "1px solid #1a1a1a", marginTop: "5rem", paddingTop: "3rem" }}
          className="grid grid-cols-2 gap-8 sm:grid-cols-3"
        >
          {[
            { value: "₹/1K", label: "Per 1,000 views" },
            { value: "20K+", label: "Views to unlock payout" },
            { value: "Real-time", label: "View tracking" },
          ].map((s) => (
            <div key={s.label}>
              <p
                style={{
                  fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  color: "#ef4444",
                  lineHeight: 1,
                }}
              >
                {s.value}
              </p>
              <p style={{ fontSize: "0.875rem", color: "#555", marginTop: "0.4rem" }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section
        id="how-it-works"
        style={{ borderTop: "1px solid #1a1a1a" }}
        className="mx-auto max-w-6xl px-6 py-24 md:px-12"
      >
        <p style={{ fontSize: "0.75rem", color: "#ef4444", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "1rem" }}>
          How it works
        </p>
        <h2
          style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            marginBottom: "4rem",
          }}
        >
          Three steps from signup
          <br />
          to <span style={{ color: "#ef4444" }}>payout.</span>
        </h2>

        <div className="grid gap-px sm:grid-cols-3" style={{ background: "#1a1a1a" }}>
          {[
            {
              step: "01",
              title: "Pick a campaign",
              body: "Browse active brand campaigns and join the ones that match your content style.",
            },
            {
              step: "02",
              title: "Submit your clip",
              body: "Post on Instagram, TikTok, or YouTube — paste the link and we verify your views automatically.",
            },
            {
              step: "03",
              title: "Get paid",
              body: "Earn per 1,000 views on approved clips. Hit the threshold and request your payout.",
            },
          ].map((item) => (
            <div
              key={item.step}
              style={{ background: "#0a0a0a", padding: "2.5rem 2rem" }}
            >
              <span
                style={{
                  fontSize: "3rem",
                  fontWeight: 900,
                  color: "#1f1f1f",
                  letterSpacing: "-0.04em",
                  display: "block",
                  marginBottom: "1.5rem",
                  lineHeight: 1,
                }}
              >
                {item.step}
              </span>
              <h3
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  marginBottom: "0.75rem",
                  letterSpacing: "-0.02em",
                }}
              >
                {item.title}
              </h3>
              <p style={{ fontSize: "0.9rem", color: "#666", lineHeight: 1.6 }}>
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FOR CREATORS ─── */}
      <section
        id="creators"
        style={{ borderTop: "1px solid #1a1a1a" }}
        className="mx-auto max-w-6xl px-6 py-24 md:px-12"
      >
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <p style={{ fontSize: "0.75rem", color: "#ef4444", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "1rem" }}>
              For creators
            </p>
            <h2
              style={{
                fontSize: "clamp(2rem, 4vw, 3rem)",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
                marginBottom: "1.5rem",
              }}
            >
              Your content.
              <br />
              Your <span style={{ color: "#ef4444" }}>earnings.</span>
            </h2>
            <p style={{ color: "#666", lineHeight: 1.7, marginBottom: "2.5rem" }}>
              No minimum follower count. No hidden fees. Just real campaigns, real views,
              and real money deposited to your account.
            </p>

            <ul style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {[
                "Performance payouts — earn more as views grow",
                "Instagram, TikTok & YouTube supported",
                "Real-time earnings dashboard",
                "Payout via bank transfer",
                "Referral bonuses for bringing in creators",
              ].map((item) => (
                <li
                  key={item}
                  style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", fontSize: "0.9rem", color: "#aaa" }}
                >
                  <span style={{ color: "#ef4444", marginTop: "2px", flexShrink: 0 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>

            <a
              href="/auth"
              style={{
                display: "inline-block",
                marginTop: "2.5rem",
                background: "#ef4444",
                color: "#fff",
                padding: "0.875rem 2rem",
                borderRadius: "0.5rem",
                fontWeight: 700,
                fontSize: "0.9375rem",
                textDecoration: "none",
              }}
            >
              Join as a creator →
            </a>
          </div>

          {/* Mock earnings card */}
          <div
            style={{
              background: "#111",
              border: "1px solid #222",
              borderRadius: "1rem",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #1a1a1a" }}>
              <p style={{ fontSize: "0.75rem", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Earnings overview
              </p>
            </div>
            {[
              { campaign: "Brand Drop", views: "12,400 views", amount: "+₹124.00", status: "Approved", color: "#22c55e" },
              { campaign: "Summer Launch", views: "8,200 views", amount: "+₹82.00", status: "Approved", color: "#22c55e" },
              { campaign: "App Promo", views: "Pending review", amount: "—", status: "Pending", color: "#f59e0b" },
            ].map((row) => (
              <div
                key={row.campaign}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "1rem 1.5rem",
                  borderBottom: "1px solid #161616",
                }}
              >
                <div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>{row.campaign}</p>
                  <p style={{ fontSize: "0.75rem", color: "#555", marginTop: "2px" }}>{row.views}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "0.9375rem", fontWeight: 800, color: "#ef4444", letterSpacing: "-0.02em" }}>
                    {row.amount}
                  </p>
                  <p style={{ fontSize: "0.7rem", color: row.color, marginTop: "2px" }}>{row.status}</p>
                </div>
              </div>
            ))}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "1.25rem 1.5rem",
                background: "#0f0f0f",
              }}
            >
              <span style={{ fontSize: "0.875rem", color: "#555" }}>Total earned</span>
              <span
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 900,
                  color: "#ef4444",
                  letterSpacing: "-0.03em",
                }}
              >
                ₹206.00
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOR BRANDS ─── */}
      <section
        id="brands"
        style={{ borderTop: "1px solid #1a1a1a", background: "#0d0d0d" }}
        className="px-6 py-24 md:px-12"
      >
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <p style={{ fontSize: "0.75rem", color: "#ef4444", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "1rem" }}>
                For brands
              </p>
              <h2
                style={{
                  fontSize: "clamp(2rem, 4vw, 3rem)",
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.05,
                  marginBottom: "1.5rem",
                }}
              >
                Performance UGC
                <br />
                <span style={{ color: "#ef4444" }}>at scale.</span>
              </h2>
              <p style={{ color: "#666", lineHeight: 1.7, marginBottom: "2.5rem" }}>
                Launch a campaign in minutes. Real creators, real content, real views —
                and you only pay for results.
              </p>
              <a
                href="mailto:eleviqlabs@gmail.com"
                style={{
                  display: "inline-block",
                  background: "transparent",
                  color: "#fff",
                  padding: "0.875rem 2rem",
                  borderRadius: "0.5rem",
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  textDecoration: "none",
                  border: "1px solid #333",
                }}
              >
                Contact us to launch →
              </a>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#1a1a1a" }}>
              {[
                {
                  title: "Real view tracking",
                  body: "Views pulled directly from platform APIs — no self-reported numbers.",
                },
                {
                  title: "Verified creators",
                  body: "Every creator links their account. You see exactly who's posting what.",
                },
                {
                  title: "Budget control",
                  body: "Set a campaign budget and a per-1K-views rate. Pay only for performance.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  style={{ background: "#0d0d0d", padding: "1.75rem 2rem" }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#ef4444",
                        flexShrink: 0,
                        marginTop: "6px",
                      }}
                    />
                    <div>
                      <p style={{ fontWeight: 700, marginBottom: "0.375rem", fontSize: "0.9375rem" }}>
                        {item.title}
                      </p>
                      <p style={{ fontSize: "0.875rem", color: "#555", lineHeight: 1.6 }}>{item.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── DISCORD CTA ─── */}
      <section style={{ borderTop: "1px solid #1a1a1a" }} className="px-6 py-24 md:px-12">
        <div className="mx-auto max-w-6xl">
          <a
            href="https://discord.gg/N2BJXwnHfa"
            target="_blank"
            rel="noreferrer"
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "2rem",
              background: "#111827",
              border: "1px solid #1e3a5f",
              borderRadius: "1rem",
              padding: "2.5rem",
              textDecoration: "none",
              transition: "border-color 0.15s",
            }}
          >
            <svg width="48" height="48" viewBox="0 0 127.14 96.36" fill="#5865F2" style={{ flexShrink: 0 }}>
              <path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2a68.68 68.68 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15ZM42.45 65.69C36.18 65.69 31 60 31 53s5-12.74 11.43-12.74S54 46 53.89 53s-5.05 12.69-11.44 12.69Zm42.24 0C78.41 65.69 73.25 60 73.25 53s5-12.74 11.44-12.74S96.23 46 96.12 53s-5.04 12.69-11.43 12.69Z" />
            </svg>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 800, fontSize: "1.25rem", letterSpacing: "-0.02em", color: "#fff" }}>
                Join the Eleviq Labs Discord
              </p>
              <p style={{ fontSize: "0.9rem", color: "#666", marginTop: "0.25rem" }}>
                Campaign drops, creator support, and payout updates — all in one place.
              </p>
            </div>
            <span style={{ color: "#5865F2", fontWeight: 600, fontSize: "0.9rem", flexShrink: 0 }}>
              Join now →
            </span>
          </a>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section
        style={{ borderTop: "1px solid #1a1a1a", textAlign: "center" }}
        className="px-6 py-28 md:px-12"
      >
        <div className="mx-auto max-w-2xl">
          <h2
            style={{
              fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
              fontWeight: 900,
              letterSpacing: "-0.05em",
              lineHeight: 1.0,
              marginBottom: "1.25rem",
            }}
          >
            Ready to start
            <br />
            <span style={{ color: "#ef4444" }}>earning?</span>
          </h2>
          <p style={{ color: "#555", marginBottom: "2.5rem", fontSize: "1.0625rem" }}>
            Sign in with Discord and join your first campaign in under 2 minutes.
          </p>
          <a
            href="/auth"
            style={{
              display: "inline-block",
              background: "#ef4444",
              color: "#fff",
              padding: "1rem 2.5rem",
              borderRadius: "0.5rem",
              fontWeight: 800,
              fontSize: "1.0625rem",
              textDecoration: "none",
              letterSpacing: "-0.01em",
            }}
          >
            Get started free →
          </a>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer
        style={{ borderTop: "1px solid #1a1a1a" }}
        className="px-6 py-8 md:px-12"
      >
        <div
          className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4"
          style={{ fontSize: "0.8125rem", color: "#444" }}
        >
          <span style={{ fontWeight: 800, color: "#666", letterSpacing: "-0.02em" }}>
            ELEVIQ <span style={{ color: "#ef4444" }}>LABS</span>
          </span>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <a href="/auth" style={{ color: "#444", textDecoration: "none" }} className="transition-colors hover:text-white">Sign in</a>
            <a href="https://discord.gg/N2BJXwnHfa" target="_blank" rel="noreferrer" style={{ color: "#444", textDecoration: "none" }} className="transition-colors hover:text-white">Discord</a>
            <a href="mailto:eleviqlabs@gmail.com" style={{ color: "#444", textDecoration: "none" }} className="transition-colors hover:text-white">Contact</a>
          </div>
          <span>© {new Date().getFullYear()} Eleviq Labs</span>
        </div>
      </footer>
    </div>
  );
}
