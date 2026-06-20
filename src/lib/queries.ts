import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// ── Shared (non-user-specific) ────────────────────────────────────────────────

export const getActiveCampaigns = unstable_cache(
  async () =>
    prisma.campaign.findMany({ where: { status: "ACTIVE" }, orderBy: { createdAt: "desc" } }),
  ["active-campaigns"],
  { revalidate: 60, tags: ["campaigns"] }
);

export const getSiteSettings = unstable_cache(
  async () => prisma.siteSettings.findFirst({ where: { id: "singleton" } }),
  ["site-settings"],
  { revalidate: 300, tags: ["site-settings"] }
);

// ── Per-user factory helpers ──────────────────────────────────────────────────
// Each factory creates an unstable_cache bound to the user's ID so that
// revalidateTag(`submissions-${userId}`) etc. only purges that user's entry.

export const cachedUserSubmissions = (userId: string) =>
  unstable_cache(
    async () =>
      prisma.submission.findMany({
        where: { userId },
        include: { campaign: { select: { title: true, brand: true } } },
        orderBy: { createdAt: "desc" },
      }),
    [`submissions-${userId}`],
    { revalidate: 30, tags: [`submissions-${userId}`] }
  );

export const cachedUserParticipations = (userId: string) =>
  unstable_cache(
    async () =>
      prisma.participation.findMany({ where: { userId }, select: { campaignId: true } }),
    [`participations-${userId}`],
    { revalidate: 60, tags: [`participations-${userId}`] }
  );

export const cachedUserPaidAgg = (userId: string) =>
  unstable_cache(
    async () =>
      prisma.submission.aggregate({
        where: { userId, status: "APPROVED" },
        _sum: { payout: true, views: true },
      }),
    [`paid-agg-${userId}`],
    { revalidate: 30, tags: [`submissions-${userId}`] }
  );

export const cachedUserSocialAccounts = (userId: string) =>
  unstable_cache(
    async () =>
      prisma.socialAccount.findMany({
        where: { userId, verificationStatus: { in: ["PENDING_REVIEW", "APPROVED"] } },
        orderBy: { createdAt: "desc" },
      }),
    [`social-${userId}`],
    { revalidate: 60, tags: [`social-${userId}`] }
  );

export const cachedUserSocialAccountsForDemo = (userId: string) =>
  unstable_cache(
    async () =>
      prisma.socialAccount.findMany({
        where: { userId, verificationStatus: { not: "NONE" } },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          platform: true,
          handle: true,
          followers: true,
          verificationStatus: true,
        },
      }),
    [`social-demo-${userId}`],
    { revalidate: 60, tags: [`social-${userId}`] }
  );

export const cachedUserDemographicProofs = (userId: string) =>
  unstable_cache(
    async () =>
      prisma.demographicProof.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { socialAccountId: true, status: true, method: true },
      }),
    [`demo-proofs-${userId}`],
    { revalidate: 60, tags: [`demographics-${userId}`] }
  );

// Notification badge count — short TTL, invalidated when notifications are read
export const cachedUnreadCount = (userId: string) =>
  unstable_cache(
    async () => prisma.notification.count({ where: { userId, read: false } }),
    [`unread-count-${userId}`],
    { revalidate: 30, tags: [`notifications-${userId}`] }
  );

// ── Per-request deduplication ─────────────────────────────────────────────────
// React cache() ensures multiple Suspense components in one render share the
// same promise instead of triggering separate unstable_cache lookups.

export const getSubmissions = cache((userId: string) =>
  cachedUserSubmissions(userId)()
);
