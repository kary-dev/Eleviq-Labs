# Eleviq Labs

A UGC creator campaign platform — brands run clipping campaigns, creators submit short-form clips, and admins review, approve, and pay out. Built with **Next.js 15 (App Router), TypeScript, Tailwind CSS, Prisma + SQLite, and Auth.js (Discord)**.

Monochrome black / dark-grey / white brand with an electric-violet accent, and full **dark / light mode**.

---

## Features

### Creator app (7 pages)
1. **Home** — welcome, Join-Discord CTA, live stats (posts / views / earned), active campaigns with **Add Clip**, recent submissions.
2. **My Campaigns** — every campaign you've joined (active + past).
3. **Earnings** — totals, available-to-withdraw, pending, payout history, approved-clip breakdown.
4. **Social Verification** — connect & verify Instagram, YouTube, X (Twitter), TikTok (multiple per platform).
5. **Demographic Verification** — submit proof-of-views screenshots per clip, track review status.
6. **Bank Account** — bank transfer or PayPal payout details.
7. **Referrals** — personal referral code + link, copy button, referred-users list and bonuses.

Plus: **dark/light toggle** (persisted), **Discord login/signup**, **logout**.

### Admin panel
- **Dashboard** — pending-review count, creator count, active campaigns, approved payouts. Live **pending submissions queue** with inline **Approve / Reject** (editable verified views → auto-calculated payout).
- **Creators** — table of every creator with clips, views, earnings.
- **Submissions** — all clips filtered by Pending / Approved / Rejected.
- **Campaigns** — create new campaigns and end/reactivate existing ones.

Approving a clip sets it `APPROVED`, computes the payout (`$rate × views ÷ 1000`), creates a payout record, and bumps the campaign's used budget.

---

## Quick start

```bash
npm install          # install deps (also runs prisma generate)
npm run db:push      # create the SQLite database from the schema
npm run db:seed      # load demo campaigns, a creator and an admin
npm run dev          # http://localhost:3000
```

### Admin access
Sign in with Discord. Any account whose email is `eleviqlabs@gmail.com` (or is
listed in the `ADMIN_EMAILS` env var, comma-separated) is promoted to **ADMIN**
on sign-in and can reach `/admin`.

---

## Enabling real Discord login

1. Go to <https://discord.com/developers/applications> → **New Application**.
2. **OAuth2** tab → copy the **Client ID** and **Client Secret**.
3. **OAuth2 → Redirects** → add: `http://localhost:3000/api/auth/callback/discord`
   (and your production URL's equivalent when you deploy).
4. Put the values in `.env`:
   ```env
   AUTH_DISCORD_ID="your-client-id"
   AUTH_DISCORD_SECRET="your-client-secret"
   AUTH_SECRET="run: npx auth secret"
   NEXTAUTH_URL="http://localhost:3000"
   ```
5. Restart `npm run dev`. The Discord button activates automatically.

New Discord sign-ups are created as **CREATOR**. To make someone an admin, change their
`role` to `ADMIN` (e.g. via `npm run db:studio`).

---

## Project structure

```
prisma/
  schema.prisma         # User/role, Campaign, Submission, SocialAccount,
                        # DemographicProof, BankAccount, Payout, Referral
  seed.ts               # demo data
src/
  auth.ts               # Auth.js (Discord + dev login), Prisma adapter, JWT/role
  auth.config.ts        # edge-safe config: route protection + session→role mapping
  middleware.ts         # protects /dashboard…/admin by role
  app/
    auth/               # sign in / sign up landing
    (creator)/          # the 7 creator pages + server actions
    admin/              # admin dashboard, creators, submissions, campaigns + actions
    api/auth/[...nextauth]/
  components/           # Logo, Sidebar, theme, cards, dialogs, icons
  lib/                  # prisma client, session guards, formatters, platform meta
```

## Useful scripts
- `npm run db:studio` — browse/edit the database in Prisma Studio.
- `npm run db:seed` — reset demo data.
- `npm run build` — production build.

## Brand / logo
The "ELEVIQ LABS" wordmark is rendered as type in `src/components/Logo.tsx` so it stays
crisp at any size and adapts to dark/light automatically. To use your image instead,
drop it in `public/` and swap the `Logo` component's contents for an `<Image>`.

## Notes
- SQLite is used for zero-config local dev. For production, switch the Prisma
  `datasource` to PostgreSQL and update `DATABASE_URL`.
- Social verification and proof review are modeled end-to-end; "verification" is
  simulated (no third-party API calls) so the flow is fully usable out of the box.
