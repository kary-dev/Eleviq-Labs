import { Suspense } from "react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";
import { DemographicsAccountSection } from "@/components/DemographicsAccountSection";
import { ChartIcon, CheckIcon } from "@/components/icons";
import {
  getSiteSettings,
  cachedUserSocialAccountsForDemo,
  cachedUserDemographicProofs,
} from "@/lib/queries";

async function DemographicsVerification({ userId }: { userId: string }) {
  const [settingsOrNull, accounts, proofs] = await Promise.all([
    getSiteSettings(),
    cachedUserSocialAccountsForDemo(userId)(),
    cachedUserDemographicProofs(userId)(),
  ]);

  const settings =
    settingsOrNull ??
    (await prisma.siteSettings.create({
      data: { id: "singleton", demographicVerificationEnabled: false },
    }));

  const proofMap: Record<string, { status: string; method: string | null }> = {};
  for (const p of proofs) {
    if (p.socialAccountId && !proofMap[p.socialAccountId]) {
      proofMap[p.socialAccountId] = { status: p.status, method: p.method };
    }
  }

  if (!settings.demographicVerificationEnabled) {
    return (
      <EmptyState
        icon={<ChartIcon className="h-7 w-7" />}
        title="Coming soon"
        body="Demographic verification isn't enabled yet. Check back later."
      />
    );
  }

  return <DemographicsAccountSection accounts={accounts} proofMap={proofMap} />;
}

function DemographicsSkeleton() {
  return (
    <div className="card divide-y divide-border">
      {[0, 1].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <div className="h-10 w-10 animate-pulse rounded-full bg-surface-2" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-44 animate-pulse rounded bg-surface-2" />
            <div className="h-3 w-28 animate-pulse rounded bg-surface-2" />
          </div>
          <div className="h-8 w-20 animate-pulse rounded-xl bg-surface-2" />
        </div>
      ))}
    </div>
  );
}

export default async function DemographicsPage() {
  const user = await requireUser();

  return (
    <>
      <PageHeader
        title="Demographic Verification"
        subtitle="Verify your audience demographics to unlock bonus payouts."
      />

      {/* ── How it works ─────────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="mb-3 font-display text-base font-semibold">How it works</h2>
        <div className="card p-5">
          <ol className="space-y-3">
            {[
              {
                n: 1,
                title: "Open your analytics",
                body: "Go to your Instagram / TikTok / YouTube app → Insights → Audience → Top countries (or equivalent).",
              },
              {
                n: 2,
                title: "Take a screenshot",
                body: "Capture the country breakdown screen showing your audience split.",
              },
              {
                n: 3,
                title: "Click Verify next to your account below",
                body: "Upload the screenshot, enter the country data shown, and submit for admin review.",
              },
              {
                n: 4,
                title: "Wait for approval",
                body: "Admin reviews and approves. Once approved your profile is eligible for demographic bonus payouts.",
              },
            ].map(({ n, title, body }) => (
              <li key={n} className="flex gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent/15 text-xs font-bold text-accent">
                  {n}
                </span>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="mt-0.5 text-sm text-muted">{body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-4 flex items-start gap-2 rounded-lg bg-accent/8 px-4 py-3">
            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <p className="text-sm text-muted">
              <span className="font-semibold text-fg">No analytics access?</span>{" "}
              Click Verify and choose &ldquo;I don&apos;t have demographics&rdquo; — you can still
              attach a screenshot explaining why.
            </p>
          </div>
        </div>
      </section>

      {/* ── Per-account verification — streamed in ───────────────── */}
      <section>
        <h2 className="mb-3 font-display text-base font-semibold">Demographic Verification</h2>
        <Suspense fallback={<DemographicsSkeleton />}>
          <DemographicsVerification userId={user.id} />
        </Suspense>
      </section>
    </>
  );
}
