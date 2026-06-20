import { cache } from "react";
import { unstable_cache } from "next/cache";
import { SubmissionStatus } from "@prisma/client";
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

// ── Creator page queries ──────────────────────────────────────────────────────

export const cachedUserCampaigns = (userId: string) =>
  unstable_cache(
    async () =>
      prisma.participation.findMany({
        where: { userId },
        include: { campaign: true },
        orderBy: { createdAt: "desc" },
      }),
    [`campaigns-full-${userId}`],
    { revalidate: 60, tags: [`participations-${userId}`, "campaigns"] }
  );

export const getLeaderboard = unstable_cache(
  async () =>
    prisma.user.findMany({
      where: { role: "CREATOR", leaderboardOptIn: true, banned: false },
      select: {
        id: true,
        name: true,
        image: true,
        tier: true,
        submissions: { where: { status: "APPROVED" }, select: { views: true, payout: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
  ["leaderboard"],
  { revalidate: 120, tags: ["leaderboard", "admin-creators"] }
);

export const cachedUserNotifications = (userId: string) =>
  unstable_cache(
    async () =>
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    [`notifications-list-${userId}`],
    { revalidate: 30, tags: [`notifications-${userId}`] }
  );

export const cachedUserBank = (userId: string) =>
  unstable_cache(
    async () => prisma.bankAccount.findUnique({ where: { userId } }),
    [`bank-${userId}`],
    { revalidate: 300, tags: [`bank-${userId}`] }
  );

export const cachedUserReferrals = (userId: string) =>
  unstable_cache(
    async () =>
      Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            referralCode: true,
            referredById: true,
            referrals: {
              orderBy: { createdAt: "desc" },
              select: { id: true, name: true, createdAt: true, image: true },
            },
          },
        }),
        prisma.submission.count({ where: { userId, status: "APPROVED" } }),
        prisma.payout.findMany({
          where: { userId, note: { startsWith: "ref:" } },
          select: { amount: true, status: true },
        }),
      ]),
    [`referrals-${userId}`],
    { revalidate: 120, tags: [`referrals-${userId}`, `submissions-${userId}`] }
  );

export const cachedCampaign = (id: string) =>
  unstable_cache(
    async () => prisma.campaign.findUnique({ where: { id } }),
    [`campaign-${id}`],
    { revalidate: 60, tags: [`campaign-${id}`, "campaigns"] }
  );

// ── Admin queries (global, not per-user) ──────────────────────────────────────

export const getAdminStats = unstable_cache(
  async () => {
    const [creatorCount, approvedAgg, campaignCount, paidAgg] = await Promise.all([
      prisma.user.count({ where: { role: "CREATOR" } }),
      prisma.submission.aggregate({ where: { status: "APPROVED" }, _sum: { payout: true } }),
      prisma.campaign.count({ where: { status: "ACTIVE" } }),
      prisma.payoutRequest.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
    ]);
    return { creatorCount, approvedAgg, campaignCount, paidAgg };
  },
  ["admin-stats"],
  { revalidate: 60, tags: ["admin-stats"] }
);

export const getAdminPendingSubmissions = unstable_cache(
  async () =>
    prisma.submission.findMany({
      where: { status: "PENDING" },
      include: {
        campaign: { select: { title: true, brand: true, ratePerThousand: true } },
        user: { select: { name: true, email: true, image: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
  ["admin-pending-submissions"],
  { revalidate: 30, tags: ["admin-submissions"] }
);

export const getAdminSubmissions = unstable_cache(
  async (status: string, campaignId?: string) =>
    prisma.submission.findMany({
      where: {
        ...(status === "DISPUTED" ? { viewsDisputed: true } : { status: status as SubmissionStatus }),
        ...(campaignId ? { campaignId } : {}),
      },
      include: {
        campaign: { select: { title: true, brand: true, ratePerThousand: true } },
        user: { select: { name: true, email: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ["admin-submissions-filtered"],
  { revalidate: 30, tags: ["admin-submissions"] }
);

export const getAdminCampaignsList = unstable_cache(
  async () =>
    prisma.campaign.findMany({
      select: { id: true, title: true, brand: true },
      orderBy: { createdAt: "desc" },
    }),
  ["admin-campaigns-list"],
  { revalidate: 60, tags: ["admin-campaigns"] }
);

export const getAdminAllCampaigns = unstable_cache(
  async () =>
    prisma.campaign.findMany({
      include: { _count: { select: { submissions: true, participations: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ["admin-all-campaigns"],
  { revalidate: 60, tags: ["admin-campaigns", "campaigns"] }
);

export const getAdminCreators = unstable_cache(
  async (q?: string) =>
    prisma.user.findMany({
      where: {
        role: "CREATOR",
        ...(q
          ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] }
          : {}),
      },
      include: {
        submissions: { select: { status: true, views: true, payout: true } },
        socialAccounts: { select: { id: true } },
        _count: { select: { participations: true, referrals: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ["admin-creators"],
  { revalidate: 60, tags: ["admin-creators"] }
);

export const getAdminPendingAccounts = unstable_cache(
  async () =>
    prisma.socialAccount.findMany({
      where: { verificationStatus: "PENDING_REVIEW" },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ["admin-pending-accounts"],
  { revalidate: 30, tags: ["admin-accounts"] }
);

export const getAdminPendingProofs = unstable_cache(
  async () =>
    prisma.demographicProof.findMany({
      where: { status: "PENDING" },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ["admin-pending-proofs"],
  { revalidate: 30, tags: ["admin-demographics"] }
);

export const getAdminPayoutRequests = unstable_cache(
  async () =>
    prisma.payoutRequest.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            bankAccount: {
              select: {
                accountHolder: true,
                accountNumber: true,
                routingNumber: true,
                bankName: true,
                paypalEmail: true,
                upiId: true,
                country: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ["admin-payout-requests"],
  { revalidate: 30, tags: ["admin-payouts"] }
);
