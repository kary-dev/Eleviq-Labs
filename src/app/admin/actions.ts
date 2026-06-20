"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { estPayout } from "@/lib/format";
import { publish } from "@/lib/sse-bus";

async function ensureAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Forbidden");
}

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/submissions");
  revalidatePath("/admin/creators");
  revalidateTag("admin-submissions");
  revalidateTag("admin-stats");
}

async function createNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  link?: string
) {
  await prisma.notification.create({ data: { userId, type, title, body, link } });
  publish(userId);
}

function computeTier(approvedViews: number): string {
  if (approvedViews >= 1_000_000) return "GOLD";
  if (approvedViews >= 100_000) return "SILVER";
  return "BRONZE";
}

export async function approveSubmission(id: string) {
  await ensureAdmin();
  const sub = await prisma.submission.findUnique({ where: { id }, include: { campaign: true } });
  if (!sub) throw new Error("Not found");

  const basePayout = estPayout(sub.views, sub.campaign.ratePerThousand);

  // Check referral boost (10% for referred creators within first 10 days)
  const creator = await prisma.user.findUnique({
    where: { id: sub.userId },
    select: { referredById: true, createdAt: true, name: true },
  });
  const daysSinceJoin = creator
    ? (Date.now() - new Date(creator.createdAt).getTime()) / 86_400_000
    : Infinity;
  const hasReferralBoost = !!(creator?.referredById && daysSinceJoin <= 10);
  const payout = hasReferralBoost
    ? Math.round(basePayout * 1.1 * 100) / 100
    : basePayout;
  const referrerBonus = hasReferralBoost
    ? Math.round(basePayout * 0.1 * 100) / 100
    : 0;

  const newBudgetUsed = sub.campaign.totalBudgetUsed + payout;
  const budgetDepleted = newBudgetUsed >= sub.campaign.budget;

  await prisma.$transaction([
    prisma.submission.update({
      where: { id },
      data: { status: "APPROVED", payout, reviewedAt: new Date(), rejectReason: null },
    }),
    prisma.campaign.update({
      where: { id: sub.campaignId },
      data: {
        totalBudgetUsed: { increment: payout },
        ...(budgetDepleted ? { budgetPaused: true, status: "ENDED" } : {}),
      },
    }),
    prisma.payout.create({
      data: { userId: sub.userId, amount: payout, status: "PENDING", note: `${sub.campaign.brand} — ${sub.campaign.title}` },
    }),
  ]);

  // Referrer commission payout (10% of base payout)
  if (referrerBonus > 0 && creator?.referredById) {
    await prisma.payout.create({
      data: {
        userId: creator.referredById,
        amount: referrerBonus,
        status: "PENDING",
        note: `ref:${sub.userId}:${sub.campaign.brand} — ${sub.campaign.title}`,
      },
    });
  }

  // Update creator tier
  const approvedViews = await prisma.submission.aggregate({
    where: { userId: sub.userId, status: "APPROVED" },
    _sum: { views: true },
  });
  const tier = computeTier(approvedViews._sum.views ?? 0);
  await prisma.user.update({ where: { id: sub.userId }, data: { tier } });

  const boostNote = hasReferralBoost ? " (+10% referral boost)" : "";
  await createNotification(
    sub.userId,
    "clip_approved",
    "Clip approved!",
    `Your clip for "${sub.campaign.brand} — ${sub.campaign.title}" was approved. You earned $${payout.toFixed(2)}${boostNote}.`,
    `/campaigns/${sub.campaignId}`
  );

  revalidateTag(`submissions-${sub.userId}`);
  revalidateTag(`notifications-${sub.userId}`);
  revalidateAdmin();
}

export async function rejectSubmission(id: string, reason: string) {
  await ensureAdmin();
  const sub = await prisma.submission.findUnique({
    where: { id },
    include: { campaign: { select: { brand: true, title: true, id: true } } },
  });
  if (!sub) return;

  await prisma.submission.update({
    where: { id },
    data: { status: "REJECTED", reviewedAt: new Date(), payout: 0, rejectReason: reason || "Did not meet campaign guidelines" },
  });

  await createNotification(
    sub.userId,
    "clip_rejected",
    "Clip rejected",
    `Your clip for "${sub.campaign.brand} — ${sub.campaign.title}" was rejected. ${reason ? `Reason: ${reason}` : ""}`.trim(),
    `/campaigns/${sub.campaign.id}`
  );

  revalidateTag(`submissions-${sub.userId}`);
  revalidateTag(`notifications-${sub.userId}`);
  revalidateAdmin();
}

export async function updateViews(id: string, views: number) {
  await ensureAdmin();
  const sub = await prisma.submission.findUnique({ where: { id }, include: { campaign: true } });
  if (!sub) return;
  await prisma.submission.update({
    where: { id },
    data: {
      views,
      payout: sub.status === "APPROVED" ? estPayout(views, sub.campaign.ratePerThousand) : sub.payout,
      viewsDisputed: false, claimedViews: null, disputeNote: null,
    },
  });
  await createNotification(
    sub.userId,
    "views_updated",
    "View count updated",
    `Your view count for "${sub.campaign.brand} — ${sub.campaign.title}" was corrected to ${views.toLocaleString()} views.`,
    `/campaigns/${sub.campaignId}`
  );
  revalidateTag(`submissions-${sub.userId}`);
  revalidateTag(`notifications-${sub.userId}`);
  revalidateAdmin();
}

export async function resolveViewDispute(id: string) {
  await ensureAdmin();
  const sub = await prisma.submission.findUnique({
    where: { id },
    include: { campaign: { select: { brand: true, title: true, id: true } } },
  });
  if (!sub) return;
  await prisma.submission.update({
    where: { id },
    data: { viewsDisputed: false, claimedViews: null, disputeNote: null },
  });
  await createNotification(
    sub.userId,
    "dispute_resolved",
    "View dispute resolved",
    `Your view dispute for "${sub.campaign.brand} — ${sub.campaign.title}" was reviewed. The fetched count was confirmed as accurate.`,
    `/campaigns/${sub.campaign.id}`
  );
  revalidateTag(`submissions-${sub.userId}`);
  revalidateTag(`notifications-${sub.userId}`);
  revalidateAdmin();
}

export async function markPayoutPaid(id: string) {
  await ensureAdmin();
  await prisma.payout.update({ where: { id }, data: { status: "PAID", paidAt: new Date() } });

  const payout = await prisma.payout.findUnique({ where: { id }, select: { userId: true, amount: true } });
  if (payout) {
    await createNotification(
      payout.userId,
      "payout_sent",
      "Payout sent!",
      `$${payout.amount.toFixed(2)} has been sent to your bank account.`,
      "/earnings"
    );
    // Mark all linked submissions as paid
    await prisma.submission.updateMany({
      where: { userId: payout.userId, status: "APPROVED", paidAt: null },
      data: { paidAt: new Date() },
    });
  }

  revalidatePath("/admin/creators");
  revalidatePath("/admin");
  revalidateTag("admin-payouts");
  revalidateTag("admin-stats");
}

export async function reviewProof(id: string, status: "APPROVED" | "REJECTED") {
  await ensureAdmin();
  await prisma.demographicProof.update({ where: { id }, data: { status } });
  revalidatePath("/admin");
}

export async function approveDemographicProof(id: string) {
  await ensureAdmin();
  const proof = await prisma.demographicProof.findUnique({
    where: { id },
    select: { userId: true },
  });
  await prisma.demographicProof.update({
    where: { id },
    data: { status: "APPROVED", approvedByAdminAt: new Date() },
  });
  if (proof) {
    await createNotification(
      proof.userId,
      "proof_approved",
      "Demographics approved!",
      "Your demographic verification was approved. You're now eligible for bonus payouts.",
      "/demographics"
    );
  }
  revalidatePath("/admin/demographics");
  revalidatePath("/demographics");
  revalidateTag("admin-demographics");
  if (proof) revalidateTag(`demographics-${proof.userId}`);
}

export async function rejectDemographicProof(id: string) {
  await ensureAdmin();
  const proof = await prisma.demographicProof.findUnique({
    where: { id },
    select: { userId: true },
  });
  await prisma.demographicProof.update({
    where: { id },
    data: { status: "REJECTED" },
  });
  if (proof) {
    await createNotification(
      proof.userId,
      "proof_rejected",
      "Demographics rejected",
      "Your demographic proof was rejected. Please resubmit with a clearer screenshot.",
      "/demographics"
    );
  }
  revalidatePath("/admin/demographics");
  revalidatePath("/demographics");
  revalidateTag("admin-demographics");
  if (proof) revalidateTag(`demographics-${proof.userId}`);
}

export async function approveAccount(id: string) {
  await ensureAdmin();
  const acct = await prisma.socialAccount.findUnique({
    where: { id },
    select: { userId: true, platform: true, handle: true },
  });
  await prisma.socialAccount.update({
    where: { id },
    data: { verificationStatus: "APPROVED", verified: true, verifiedAt: new Date() },
  });
  if (acct) {
    await createNotification(
      acct.userId,
      "account_approved",
      "Account verified!",
      `@${acct.handle} on ${acct.platform} has been approved. You can now submit clips.`,
      "/social"
    );
  }
  revalidatePath("/admin/accounts");
  revalidatePath("/social");
  revalidatePath("/dashboard");
  revalidateTag("admin-accounts");
  if (acct) revalidateTag(`social-${acct.userId}`);
}

export async function rejectAccount(id: string) {
  await ensureAdmin();
  const acct = await prisma.socialAccount.findUnique({
    where: { id },
    select: { userId: true, platform: true, handle: true },
  });
  await prisma.socialAccount.update({
    where: { id },
    data: { verificationStatus: "REJECTED", verified: false },
  });
  if (acct) {
    await createNotification(
      acct.userId,
      "account_rejected",
      "Account verification rejected",
      `@${acct.handle} on ${acct.platform} was rejected. Contact support if you think this is a mistake.`,
      "/social"
    );
  }
  revalidatePath("/admin/accounts");
  revalidatePath("/social");
  revalidateTag("admin-accounts");
  if (acct) revalidateTag(`social-${acct.userId}`);
}

function parseCampaignFormData(formData: FormData, platforms: string[]) {
  const endsAtRaw = String(formData.get("endsAt") ?? "").trim();
  return {
    title: String(formData.get("title") ?? "").trim(),
    brand: String(formData.get("brand") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    thumbnail: String(formData.get("thumbnail") ?? "🎬").trim() || "🎬",
    ratePerThousand: parseFloat(String(formData.get("ratePerThousand") ?? "1.5")) || 1.5,
    budget: parseFloat(String(formData.get("budget") ?? "1000")) || 1000,
    minViews: parseInt(String(formData.get("minViews") ?? "0"), 10) || 0,
    platforms: platforms.length ? platforms.join(",") : "INSTAGRAM,YOUTUBE,X,TIKTOK",
    endsAt: endsAtRaw ? new Date(endsAtRaw) : null,
  };
}

export async function createCampaign(formData: FormData) {
  await ensureAdmin();
  const platforms = formData.getAll("platforms").map(String);
  const campaign = await prisma.campaign.create({
    data: { ...parseCampaignFormData(formData, platforms), status: "ACTIVE" },
  });

  // Notify all creators of new campaign
  const creators = await prisma.user.findMany({
    where: { role: "CREATOR", banned: false },
    select: { id: true },
  });
  await prisma.notification.createMany({
    data: creators.map((c) => ({
      userId: c.id,
      type: "campaign_live",
      title: "New campaign live!",
      body: `${campaign.brand} — ${campaign.title} is now live. Submit a clip to earn.`,
      link: "/dashboard",
    })),
  });

  revalidatePath("/admin/campaigns");
  revalidatePath("/dashboard");
  revalidateTag("admin-campaigns");
  revalidateTag("campaigns");
}

export async function setCampaignStatus(id: string, status: "ACTIVE" | "ENDED" | "DRAFT") {
  await ensureAdmin();
  await prisma.campaign.update({ where: { id }, data: { status, ...(status === "ACTIVE" ? { budgetPaused: false } : {}) } });
  revalidatePath("/admin/campaigns");
  revalidatePath("/dashboard");
  revalidateTag("admin-campaigns");
  revalidateTag("campaigns");
}

export async function updateCampaign(id: string, formData: FormData) {
  await ensureAdmin();
  const platforms = formData.getAll("platforms").map(String);
  await prisma.campaign.update({
    where: { id },
    data: parseCampaignFormData(formData, platforms),
  });
  revalidatePath("/admin/campaigns");
  revalidatePath(`/admin/campaigns/${id}`);
  revalidatePath("/dashboard");
  revalidateTag("admin-campaigns");
  revalidateTag("campaigns");
}

// --- Bulk clip refresh -------------------------------------------------------

export async function bulkRefreshClips() {
  await ensureAdmin();
  const { getPostFor, platformHasProvider } = await import("@/lib/social");
  const { estPayout } = await import("@/lib/format");

  const subs = await prisma.submission.findMany({
    where: { status: "PENDING" },
    include: { campaign: { select: { ratePerThousand: true, minViews: true } } },
  });

  // Fetch all posts in parallel — each Apify run is independent so they can
  // run concurrently instead of waiting one-by-one (saves N×30s → ~30s).
  const fetched = await Promise.allSettled(
    subs.map(async (sub) => {
      if (!platformHasProvider(sub.platform)) return null;
      const post = await getPostFor(sub.platform, sub.url);
      if (!post) return null;
      return { sub, post };
    })
  );

  let refreshed = 0;
  let autoRejected = 0;

  for (const result of fetched) {
    if (result.status !== "fulfilled" || !result.value) continue;
    const { sub, post } = result.value;
    const views = post.views;
    try {
      await prisma.viewHistory.create({ data: { submissionId: sub.id, views } });

      if (sub.campaign.minViews > 0 && views < sub.campaign.minViews) {
        await prisma.submission.update({
          where: { id: sub.id },
          data: { views, status: "REJECTED", rejectReason: `Views (${views}) below campaign minimum (${sub.campaign.minViews})`, reviewedAt: new Date() },
        });
        autoRejected++;
      } else {
        await prisma.submission.update({
          where: { id: sub.id },
          data: { views, lastSyncedAt: new Date(), payout: estPayout(views, sub.campaign.ratePerThousand) },
        });
        refreshed++;
      }
    } catch {
      // Skip failed DB writes
    }
  }

  revalidateAdmin();
  return { refreshed, autoRejected };
}

// --- Creator management ------------------------------------------------------

export async function blockCreator(userId: string) {
  await ensureAdmin();
  await prisma.user.update({ where: { id: userId }, data: { banned: true, bannedAt: new Date() } });
  revalidatePath("/admin/creators");
  revalidateTag("admin-creators");
}

export async function unblockCreator(userId: string) {
  await ensureAdmin();
  await prisma.user.update({ where: { id: userId }, data: { banned: false, bannedAt: null } });
  revalidatePath("/admin/creators");
  revalidateTag("admin-creators");
}

// --- Payout requests ---------------------------------------------------------

export async function approvePayoutRequest(id: string) {
  await ensureAdmin();
  const req = await prisma.payoutRequest.findUnique({ where: { id }, select: { userId: true, amount: true } });
  if (!req) return;

  await prisma.payoutRequest.update({ where: { id }, data: { status: "APPROVED", processedAt: new Date() } });
  await createNotification(
    req.userId,
    "payout_sent",
    "Payout approved!",
    `Your withdrawal request of $${req.amount.toFixed(2)} has been approved and will be processed shortly.`,
    "/earnings"
  );
  revalidatePath("/admin/payouts");
  revalidateTag("admin-payouts");
}

export async function rejectPayoutRequest(id: string, note: string) {
  await ensureAdmin();
  const req = await prisma.payoutRequest.findUnique({ where: { id }, select: { userId: true, amount: true } });
  if (!req) return;

  await prisma.payoutRequest.update({ where: { id }, data: { status: "REJECTED", adminNote: note, processedAt: new Date() } });
  await createNotification(
    req.userId,
    "payout_rejected",
    "Payout request rejected",
    `Your withdrawal request of $${req.amount.toFixed(2)} was rejected. ${note ? `Reason: ${note}` : "Contact support for details."}`.trim(),
    "/earnings"
  );
  revalidatePath("/admin/payouts");
  revalidateTag("admin-payouts");
}

export async function markPayoutRequestPaid(id: string) {
  await ensureAdmin();
  const req = await prisma.payoutRequest.findUnique({ where: { id }, select: { userId: true, amount: true } });
  if (!req) return;

  const now = new Date();

  await prisma.payoutRequest.update({ where: { id }, data: { status: "PAID", processedAt: now } });

  // Mark all pending Payout ledger entries as PAID
  await prisma.payout.updateMany({
    where: { userId: req.userId, status: "PENDING" },
    data: { status: "PAID", paidAt: now },
  });

  // Stamp submissions so they're excluded from future "available" calculations
  await prisma.submission.updateMany({
    where: { userId: req.userId, status: "APPROVED", paidAt: null },
    data: { paidAt: now },
  });

  await createNotification(
    req.userId,
    "payout_sent",
    "Payment sent!",
    `$${req.amount.toFixed(2)} has been sent to your bank account.`,
    "/earnings"
  );

  revalidatePath("/admin/payouts");
  revalidatePath("/earnings");
  revalidatePath("/dashboard");
  revalidateTag("admin-payouts");
  revalidateTag("admin-stats");
  revalidateTag(`submissions-${req.userId}`);
}

// --- Site settings ----------------------------------------------------------

export async function getSiteSettings() {
  return prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", demographicVerificationEnabled: false },
  });
}

export async function setSiteSettings(data: { demographicVerificationEnabled?: boolean }) {
  await ensureAdmin();
  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });
  revalidatePath("/admin/settings");
  revalidatePath("/demographics");
  revalidateTag("site-settings");
}
