# Deploying Eleviq Labs to Vercel

This app uses **Next.js 15 + Prisma + NextAuth (Discord)**. Production runs on
**Vercel** with a **Neon Postgres** database. SQLite is local-only — it cannot
run on Vercel's serverless filesystem.

---

## 1. Create the database (Neon)

1. Go to <https://neon.tech> and create a free project.
2. Copy the **connection string** (the pooled one, ending in `?sslmode=require`).
   It looks like:
   `postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require`
3. Keep it handy — it becomes `DATABASE_URL`.

## 2. Push the code to GitHub

From this folder:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<you>/eleviq-labs.git
git push -u origin main
```

> `.env` and `dev.db` are gitignored, so no secrets are committed.

## 3. Import into Vercel

1. <https://vercel.com/new> → import the GitHub repo.
2. Framework preset: **Next.js** (auto-detected). Leave build settings default —
   the `build` script already runs `prisma generate && prisma db push && next build`,
   which creates the schema in Neon on first deploy.

## 4. Set environment variables in Vercel

Project → **Settings → Environment Variables** (Production + Preview):

| Name | Value |
|------|-------|
| `DATABASE_URL` | your Neon connection string |
| `AUTH_SECRET` | run `npx auth secret` and paste the result |
| `AUTH_TRUST_HOST` | `true` |
| `AUTH_DISCORD_ID` | your Discord client ID |
| `AUTH_DISCORD_SECRET` | your Discord client secret |
| `ENABLE_DEV_LOGIN` | `false` |

> `AUTH_URL` is **not** required — `trustHost` lets NextAuth auto-detect the
> Vercel domain.

## 5. Update Discord OAuth redirect

In <https://discord.com/developers/applications> → your app → **OAuth2 →
Redirects**, add:

```
https://YOUR-APP.vercel.app/api/auth/callback/discord
```

## 6. Deploy & seed

1. Trigger a deploy (push to `main` or click **Redeploy**). The build pushes the
   schema to Neon automatically.
2. (Optional) Seed demo data + an admin account. Run **locally** with the Neon
   URL in your `.env`:
   ```bash
   npm run db:seed
   ```

## Security checklist

- [ ] Generated a fresh `AUTH_SECRET` (the repo default is a dev placeholder).
- [ ] **Rotate the Discord client secret** — the dev value was stored in plaintext.
- [ ] `ENABLE_DEV_LOGIN=false` in production (dev login bypasses Discord).
