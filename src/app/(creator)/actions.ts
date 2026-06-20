"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { estPayout } from "@/lib/format";
import { extractShortcode } from "@/lib/instagram";
import {
  getProfileFor,
  getPostFor,
  normalizeHandleFor,
  isValidPostUrl,
  platformHasProvider,
  registerMockBio,
  clearMockBio,
  providerMode,
} from "@/lib/social";
import type { Platform } from "@prisma/client";
import { notifyAdmins } from "@/lib/adminNotifications";

const PLATFORM_LABEL: Record<string, string> = {
  INSTAGRAM: "Instagram", YOUTUBE: "YouTube", X: "X", TIKTOK: "TikTok",
};

async function uid() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function joinCampaign(campaignId: string) {
  const userId = await uid();
  await prisma.participation.upsert({
    where: { userId_campaignId: { userId, campaignId } },
    update: {},
    create: { userId, campaignId },
  });
  revalidatePath("/campaigns");
  revalidatePath("/dashboard");
  revalidateTag("campaigns");
  revalidateTag(`participations-${userId}`);
}

export type ClipPreview = {
  ok: boolean;
  message?: string;
  ownerUsername?: string;
  ownedByYou?: boolean;
};

/** Verified handles (lowercased) for the current user on a platform. */
async function verifiedHandles(userId: string, platform: Platform): Promise<Set<string>> {
  const accts = await prisma.socialAccount.findMany({
    where: { userId, platform, verificationStatus: "APPROVED" },
    select: { handle: true },
  });
  return new Set(accts.map((a) => a.handle.toLowerCase()));
}

/** Admin-approved canonical account ids (e.g. YouTube channelId) for the current user. */
async function verifiedIds(userId: string, platform: Platform): Promise<Set<string>> {
  const accts = await prisma.socialAccount.findMany({
    where: { userId, platform, verificationStatus: "APPROVED", igUserId: { not: null } },
    select: { igUserId: true },
  });
  return new Set(accts.map((a) => a.igUserId!).filter(Boolean));
}

/** True if the post (by owner handle or owner id) belongs to a verified account. */
async function ownsPost(
  userId: string,
  platform: Platform,
  ownerHandle: string | null,
  ownerId: string | null
): Promise<boolean> {
  if (platform === "YOUTUBE") {
    if (!ownerId) return false;
    return (await verifiedIds(userId, platform)).has(ownerId);
  }
  if (!ownerHandle) return false;
  return (await verifiedHandles(userId, platform)).has(ownerHandle.toLowerCase());
}

/**
 * Resolves the post's owner from its URL and tells the UI whether it belongs to
 * one of the creator's verified accounts. Stats are fetched at submit / refresh.
 */
export async function fetchClipPreview(platform: Platform, url: string): Promise<ClipPreview> {
  const userId = await uid();
  const clean = url.trim();
  if (!platformHasProvider(platform)) return { ok: false, message: "Enter the views manually for this platform." };
  if (!isValidPostUrl(platform, clean)) {
    return { ok: false, message: `Paste a valid ${PLATFORM_LABEL[platform]} link.` };
  }

  const post = await getPostFor(platform, clean);
  if (!post) return { ok: false, message: "Couldn't read that post. Check the link and try again." };

  const ownedByYou = await ownsPost(userId, platform, post.ownerHandle, post.ownerId);
  const ownerLabel = post.ownerHandle ? `@${post.ownerHandle}` : "that channel";

  return {
    ok: true,
    ownerUsername: post.ownerHandle ?? post.ownerId ?? "",
    ownedByYou,
    message: ownedByYou
      ? undefined
      : `This post is from ${ownerLabel}, which isn't a verified account on your profile.`,
  };
}

export type AddClipResult = { ok: true } | { ok: false; message: string };

export async function addClip(formData: FormData): Promise<AddClipResult> {
  const userId = await uid();
  const campaignId = String(formData.get("campaignId") ?? "");
  const url = String(formData.get("url") ?? "").trim();
  const platform = (String(formData.get("platform") ?? "INSTAGRAM") as Platform);
  if (!campaignId || !url) return { ok: false, message: "Missing fields." };

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) return { ok: false, message: "Campaign not found." };

  // Block re-submitting the same clip while it's still pending or approved.
  // A rejected clip can be re-added (it won't match below).
  const dupKey = platform === "INSTAGRAM" ? extractShortcode(url) : url.trim().toLowerCase();
  if (dupKey) {
    const active = await prisma.submission.findMany({
      where: { userId, status: { in: ["PENDING", "APPROVED"] } },
      select: { url: true, platform: true },
    });
    const clash = active.some((s) => {
      const k = s.platform === "INSTAGRAM" ? extractShortcode(s.url) : s.url.trim().toLowerCase();
      return !!k && k === dupKey;
    });
    if (clash) {
      return { ok: false, message: "This clip is already pending or approved." };
    }
  }

  const join = () =>
    prisma.participation.upsert({
      where: { userId_campaignId: { userId, campaignId } },
      update: {},
      create: { userId, campaignId },
    });

  const label = PLATFORM_LABEL[platform] ?? platform;

  if (platformHasProvider(platform)) {
    // Auto: re-fetch server-side (never trust client stats) and verify ownership.
    const hasAccount =
      (await verifiedHandles(userId, platform)).size > 0 || (await verifiedIds(userId, platform)).size > 0;
    if (!hasAccount) {
      return { ok: false, message: `Verify a ${label} account first (Social Verification).` };
    }
    if (!isValidPostUrl(platform, url)) {
      return { ok: false, message: `Paste a valid ${label} link.` };
    }
    const post = await getPostFor(platform, url);
    if (!post) return { ok: false, message: "Couldn't read that post — check the link." };
    if (!(await ownsPost(userId, platform, post.ownerHandle, post.ownerId))) {
      const who = post.ownerHandle ? `@${post.ownerHandle}` : "that channel";
      return { ok: false, message: `That post belongs to ${who}, not a verified account of yours.` };
    }

    await join();
    await prisma.submission.create({
      data: {
        userId, campaignId, platform, url,
        title: post.title?.slice(0, 120) ?? null,
        views: post.views,
        thumbnailUrl: post.thumbnailUrl,
        ownerHandle: post.ownerHandle,
        lastSyncedAt: new Date(),
        status: "PENDING",
        payout: estPayout(post.views, campaign.ratePerThousand),
      },
    });
  } else {
    // Manual platforms (X): views entered by hand. Require a verified account.
    const verified = await prisma.socialAccount.findFirst({
      where: { userId, platform, verified: true },
      select: { id: true },
    });
    if (!verified) {
      return { ok: false, message: `Verify a ${label} account first (Social Verification).` };
    }
    const views = parseInt(String(formData.get("views") ?? "0"), 10) || 0;
    const title = String(formData.get("title") ?? "").trim() || null;

    await join();
    await prisma.submission.create({
      data: {
        userId, campaignId, platform, url, title, views,
        status: "PENDING",
        payout: estPayout(views, campaign.ratePerThousand),
      },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/campaigns");
  revalidatePath("/earnings");
  revalidateTag(`submissions-${userId}`);
  revalidateTag(`participations-${userId}`);
  revalidateTag("campaigns");
  notifyAdmins("clip_submitted", "New clip submitted", `A creator submitted a clip for review.`, "/admin/submissions").catch(() => {});
  return { ok: true };
}

/** Re-fetches the live view count for a submission (any provider platform). */
/** Creator flags a clip whose fetched views look wrong. Admin reviews it. */
export async function requestViewRecheck(formData: FormData): Promise<{ ok: boolean; message: string }> {
  const userId = await uid();
  const submissionId = String(formData.get("submissionId") ?? "");
  const claimedRaw = String(formData.get("claimedViews") ?? "").replace(/[^0-9]/g, "");
  const claimedViews = claimedRaw ? parseInt(claimedRaw, 10) : null;
  const note = String(formData.get("note") ?? "").trim().slice(0, 300) || null;
  const file = formData.get("screenshot") as File | null;

  const sub = await prisma.submission.findFirst({ where: { id: submissionId, userId }, select: { id: true } });
  if (!sub) return { ok: false, message: "Clip not found." };

  let disputeScreenshot: string | null = null;
  if (file && file.size > 0) {
    if (file.size > 10 * 1024 * 1024) return { ok: false, message: "Screenshot too large (max 10 MB)." };
    const { putFile } = await import("@/lib/storage");
    const blob = await putFile(`disputes/${sub.id}-${Date.now()}-${file.name}`, file);
    disputeScreenshot = blob.url;
  }

  await prisma.submission.update({
    where: { id: sub.id },
    data: { viewsDisputed: true, claimedViews, disputeNote: note, disputeScreenshot },
  });
  revalidatePath("/campaigns");
  revalidatePath("/dashboard");
  revalidateTag(`submissions-${userId}`);
  return { ok: true, message: "Sent to admin for a recheck." };
}

function computeTier(approvedViews: number): string {
  if (approvedViews >= 1_000_000) return "GOLD";
  if (approvedViews >= 100_000) return "SILVER";
  return "BRONZE";
}

export async function refreshClipViews(submissionId: string) {
  const userId = await uid();
  const [sub, user] = await Promise.all([
    prisma.submission.findFirst({
      where: { id: submissionId, userId },
      include: { campaign: { select: { ratePerThousand: true, minViews: true } } },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { metaAccessToken: true, metaIgAccountId: true } }),
  ]);
  if (!sub) throw new Error("Not found");
  if (!platformHasProvider(sub.platform)) return;

  let views: number | null = null;

  if (sub.platform === "INSTAGRAM" && user?.metaAccessToken && user?.metaIgAccountId) {
    const { getPostPlaysFromGraph } = await import("@/lib/instagram-graph");
    views = await getPostPlaysFromGraph(user.metaIgAccountId, sub.url, user.metaAccessToken);
  }

  if (views === null) {
    const post = await getPostFor(sub.platform, sub.url);
    if (!post) return;
    views = post.views;
  }

  // Record view history snapshot
  await prisma.viewHistory.create({ data: { submissionId: sub.id, views } });

  // Auto-reject PENDING clips that fall below campaign minimum
  if (sub.status === "PENDING" && sub.campaign.minViews > 0 && views < sub.campaign.minViews) {
    await prisma.submission.update({
      where: { id: sub.id },
      data: {
        views,
        status: "REJECTED",
        rejectReason: `Views (${views.toLocaleString()}) below campaign minimum (${sub.campaign.minViews.toLocaleString()})`,
        reviewedAt: new Date(),
        lastSyncedAt: new Date(),
      },
    });
  } else {
    await prisma.submission.update({
      where: { id: sub.id },
      data: {
        views,
        lastSyncedAt: new Date(),
        payout: sub.status === "APPROVED" ? estPayout(views, sub.campaign.ratePerThousand) : sub.payout,
      },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/earnings");
  revalidateTag(`submissions-${userId}`);
}

/** Re-fetches live views for all of the user's clips in a campaign. */
export async function refreshCampaignClips(campaignId: string) {
  const userId = await uid();
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { ratePerThousand: true, minViews: true },
  });
  if (!campaign) return;

  const [subs, user] = await Promise.all([
    prisma.submission.findMany({
      where: { userId, campaignId, platform: { in: ["INSTAGRAM", "YOUTUBE", "TIKTOK"] } },
      select: { id: true, url: true, platform: true, status: true, payout: true },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { metaAccessToken: true, metaIgAccountId: true } }),
  ]);

  const graphConnected = !!(user?.metaAccessToken && user?.metaIgAccountId);

  for (const sub of subs) {
    try {
      let views: number | null = null;

      if (sub.platform === "INSTAGRAM" && graphConnected) {
        const { getPostPlaysFromGraph } = await import("@/lib/instagram-graph");
        views = await getPostPlaysFromGraph(user!.metaIgAccountId!, sub.url, user!.metaAccessToken!);
      }

      if (views === null) {
        const post = await getPostFor(sub.platform, sub.url);
        if (!post) continue;
        views = post.views;
      }

      await prisma.viewHistory.create({ data: { submissionId: sub.id, views } });

      if (sub.status === "PENDING" && campaign.minViews > 0 && views < campaign.minViews) {
        await prisma.submission.update({
          where: { id: sub.id },
          data: { views, status: "REJECTED", rejectReason: `Views below campaign minimum (${campaign.minViews.toLocaleString()})`, reviewedAt: new Date() },
        });
      } else {
        await prisma.submission.update({
          where: { id: sub.id },
          data: { views, lastSyncedAt: new Date(), payout: sub.status === "APPROVED" ? estPayout(views, campaign.ratePerThousand) : sub.payout },
        });
      }
    } catch {
      // Skip clips that fail to refresh
    }
  }

  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath("/campaigns");
  revalidatePath("/dashboard");
  revalidatePath("/earnings");
  revalidateTag(`submissions-${userId}`);
  revalidateTag("campaigns");
}

// --- Payout requests --------------------------------------------------------

export type PayoutRequestResult = { ok: boolean; message: string };

export async function requestPayout(formData: FormData): Promise<PayoutRequestResult> {
  const userId = await uid();
  const amountRaw = parseFloat(String(formData.get("amount") ?? "0"));
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!amountRaw || amountRaw <= 0) return { ok: false, message: "Enter a valid amount." };

  // Check no pending request already exists
  const existing = await prisma.payoutRequest.findFirst({
    where: { userId, status: "PENDING" },
  });
  if (existing) return { ok: false, message: "You already have a pending payout request." };

  await prisma.payoutRequest.create({ data: { userId, amount: amountRaw, note } });
  revalidatePath("/earnings");
  notifyAdmins("payout_request", "New payout request", `A creator requested a withdrawal of $${amountRaw.toFixed(2)}.`, "/admin/payouts").catch(() => {});
  return { ok: true, message: "Payout request submitted." };
}

// --- Notifications ----------------------------------------------------------

export async function markAllNotificationsRead() {
  const userId = await uid();
  await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  revalidatePath("/notifications");
  revalidateTag(`notifications-${userId}`);
}

export async function markNotificationRead(id: string) {
  const userId = await uid();
  await prisma.notification.updateMany({ where: { id, userId }, data: { read: true } });
  revalidatePath("/notifications");
  revalidateTag(`notifications-${userId}`);
}

// --- Leaderboard opt-in -----------------------------------------------------

export async function setLeaderboardOptIn(optIn: boolean) {
  const userId = await uid();
  await prisma.user.update({ where: { id: userId }, data: { leaderboardOptIn: optIn } });
  revalidatePath("/leaderboard");
}

export async function verifyAccount(formData: FormData) {
  const userId = await uid();
  const platform = String(formData.get("platform") ?? "") as Platform;
  const handle = String(formData.get("handle") ?? "").trim().replace(/^@/, "");
  const url = String(formData.get("url") ?? "").trim() || null;
  const method = String(formData.get("method") ?? "").trim() || null;
  if (!platform || !handle) throw new Error("Missing fields");

  // Don't add the same account again while it's pending or approved (idempotent).
  const existing = await prisma.socialAccount.findFirst({
    where: { userId, platform, handle, verificationStatus: { in: ["PENDING_REVIEW", "APPROVED"] } },
    select: { id: true },
  });
  if (existing) {
    revalidatePath("/social");
    revalidateTag(`social-${userId}`);
    return;
  }

  await prisma.socialAccount.create({
    // Goes to admin review before it can be used for clips.
    data: { userId, platform, handle, url, verified: false, verificationStatus: "PENDING_REVIEW", method },
  });
  revalidatePath("/social");
  revalidatePath("/dashboard");
  revalidateTag(`social-${userId}`);
}

export async function removeSocial(id: string) {
  const userId = await uid();
  await prisma.socialAccount.deleteMany({ where: { id, userId } });
  revalidatePath("/social");
  revalidateTag(`social-${userId}`);
}

// --- Bio-code verification (Instagram / YouTube / TikTok) -------------------

const PROFILE_URL: Record<string, (h: string) => string> = {
  INSTAGRAM: (h) => `https://instagram.com/${h}`,
  YOUTUBE: (h) => `https://youtube.com/@${h}`,
  X: (h) => `https://x.com/${h}`,
  TIKTOK: (h) => `https://tiktok.com/@${h}`,
};

export type StartVerifyResult =
  | { ok: true; accountId: string; code: string; handle: string; platform: Platform; isProfessional: boolean; avatarUrl: string | null; followers: number }
  | { ok: false; message: string };

/**
 * Step 1: creator enters their username/handle. We fetch the profile to confirm
 * it exists, snapshot it, generate a 6-char code, and ask them to put it in
 * their bio / channel description. Returns the code + account id to check.
 */
export async function startVerification(formData: FormData): Promise<StartVerifyResult> {
  const userId = await uid();
  const platform = String(formData.get("platform") ?? "INSTAGRAM") as Platform;
  const label = PLATFORM_LABEL[platform] ?? platform;
  if (!platformHasProvider(platform)) {
    return { ok: false, message: `${label} can't be auto-verified — add it manually.` };
  }
  const handle = normalizeHandleFor(platform, String(formData.get("handle") ?? ""));
  if (!handle) return { ok: false, message: `Enter your ${label} username.` };

  const profile = await getProfileFor(platform, handle);
  if (!profile) return { ok: false, message: `We couldn't find that ${label} account.` };
  if (profile.isPrivate) return { ok: false, message: "Your account is private — make it public to verify." };
  if (platform === "INSTAGRAM" && process.env.REQUIRE_PROFESSIONAL_IG === "true" && !profile.isProfessional) {
    return {
      ok: false,
      message:
        "This looks like a personal account. First switch to a Professional account on Instagram (Settings → Account type and tools → Switch to professional account), then verify again.",
    };
  }

  // Block any handle already claimed (pending or approved) — by you or anyone else.
  const taken = await prisma.socialAccount.findFirst({
    where: { platform, handle, verificationStatus: { in: ["PENDING_REVIEW", "APPROVED"] } },
    select: { id: true, userId: true },
  });
  if (taken) {
    return {
      ok: false,
      message:
        taken.userId === userId
          ? `You've already verified this ${label} account.`
          : "That account is already verified by another creator.",
    };
  }

  const code = randomCode(6);
  const method = String(formData.get("method") ?? "bio") === "link" ? "link" : "bio";
  const loginEmail = String(formData.get("loginEmail") ?? "").trim() || null;
  const loginUsername = String(formData.get("loginUsername") ?? "").trim() || null;
  const loginPassword = String(formData.get("loginPassword") ?? "").trim() || null;

  const snapshot = {
    avatarUrl: profile.avatarUrl, followers: profile.followers,
    isProfessional: profile.isProfessional, igUserId: profile.canonicalId,
    url: (PROFILE_URL[platform] ?? PROFILE_URL.INSTAGRAM)(handle),
    loginEmail, loginUsername, loginPassword,
  };

  const existing = await prisma.socialAccount.findFirst({
    where: { userId, platform, handle },
    select: { id: true },
  });

  const acct = existing
    ? await prisma.socialAccount.update({ where: { id: existing.id }, data: { verifyCode: code, method, verified: false, ...snapshot } })
    : await prisma.socialAccount.create({ data: { userId, platform, handle, method, verified: false, verifyCode: code, ...snapshot } });

  registerMockBio(platform, handle, code);

  revalidatePath("/social");
  revalidateTag(`social-${userId}`);
  return {
    ok: true, accountId: acct.id, code, handle, platform,
    isProfessional: profile.isProfessional, avatarUrl: profile.avatarUrl, followers: profile.followers,
  };
}

/** Step 2: re-fetch the profile and confirm the code is in the bio/description. */
export async function checkVerification(socialAccountId: string): Promise<{ ok: boolean; message: string }> {
  const userId = await uid();
  const acct = await prisma.socialAccount.findFirst({ where: { id: socialAccountId, userId } });
  if (!acct || !acct.verifyCode) return { ok: false, message: "Start verification first." };
  const platform = acct.platform;
  const label = PLATFORM_LABEL[platform] ?? platform;

  const profile = await getProfileFor(platform, acct.handle);
  if (!profile) return { ok: false, message: "Couldn't load your profile. Try again." };

  if (profile.isPrivate || !profile.bio.trim()) {
    return {
      ok: false,
      message: `We couldn't read your ${platform === "YOUTUBE" ? "channel description" : "bio"}. Make it public if needed, ensure ${acct.verifyCode} is saved there, then re-check.`,
    };
  }

  if (!profile.bio.toUpperCase().includes(acct.verifyCode.toUpperCase())) {
    return {
      ok: false,
      message: `Code not found yet. Add ${acct.verifyCode} to your ${label} ${platform === "YOUTUBE" ? "channel description" : "bio"}, save, then re-check.`,
    };
  }

  await prisma.socialAccount.update({
    where: { id: acct.id },
    data: {
      // Bio code matched — now awaiting admin review. Not usable for clips yet.
      verified: false, verificationStatus: "PENDING_REVIEW", verifyCode: null,
      avatarUrl: profile.avatarUrl, followers: profile.followers,
      isProfessional: profile.isProfessional, igUserId: profile.canonicalId,
    },
  });
  clearMockBio(platform, acct.handle);

  revalidatePath("/social");
  revalidatePath("/dashboard");
  revalidateTag(`social-${userId}`);
  notifyAdmins("account_pending", "New account for review", `A creator's ${label} account is awaiting verification.`, "/admin/accounts").catch(() => {});
  return { ok: true, message: `${label} account sent for admin review. You can submit clips once it's approved.` };
}

export async function submitProof(formData: FormData) {
  const userId = await uid();
  const campaignId = String(formData.get("campaignId") ?? "");
  const submissionId = String(formData.get("submissionId") ?? "") || null;
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim() || null;
  if (!campaignId || !imageUrl) throw new Error("Missing fields");

  await prisma.demographicProof.create({
    data: { userId, campaignId, submissionId, imageUrl, note, status: "PENDING" },
  });
  revalidatePath("/demographics");
  revalidateTag(`demographics-${userId}`);
}

// --- Demographic verification -----------------------------------------------

export type AiExtractResult =
  | { ok: true; countryData: { country: string; views: number }[]; totalViews: number | null; imageUrl: string }
  | { ok: false; message: string };

/** Upload screenshot file, run Gemini AI to extract country view data. */
export async function aiExtractDemographics(formData: FormData): Promise<AiExtractResult> {
  await uid();
  const file = formData.get("screenshot") as File | null;
  if (!file || !file.size) return { ok: false, message: "No file provided." };
  if (file.size > 10 * 1024 * 1024) return { ok: false, message: "File too large (max 10 MB)." };

  try {
    const [{ putFile }, { extractDemographicsFromBytes }] = await Promise.all([
      import("@/lib/storage"),
      import("@/lib/ai-vision"),
    ]);

    const bytes = await file.arrayBuffer();

    const blob = await putFile(`demographics/${Date.now()}-${file.name}`, file);

    const result = await extractDemographicsFromBytes(bytes, file.type || "image/jpeg");
    return { ok: true, countryData: result.countryData, totalViews: result.totalViews, imageUrl: blob.url };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "AI extraction failed";
    return { ok: false, message: msg };
  }
}

export type SubmitDemoResult = { ok: true } | { ok: false; message: string };

/** Submit a demographic proof (AI-confirmed or manual) for admin review. */
export async function submitDemographicProof(formData: FormData): Promise<SubmitDemoResult> {
  const userId = await uid();
  const method = String(formData.get("method") ?? "manual");
  const aiResultRaw = String(formData.get("aiResult") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim() || null;
  const socialAccountId = String(formData.get("socialAccountId") ?? "").trim() || null;
  const file = formData.get("screenshot") as File | null;

  let imageUrl: string | null = null;
  if (file && file.size > 0) {
    if (file.size > 10 * 1024 * 1024) return { ok: false, message: "Screenshot too large (max 10 MB)." };
    const { putFile } = await import("@/lib/storage");
    const blob = await putFile(`demographics/${userId}-${Date.now()}-${file.name}`, file);
    imageUrl = blob.url;
  }

  await prisma.demographicProof.create({
    data: { userId, socialAccountId, imageUrl, note, method, aiResult: aiResultRaw, status: "PENDING" },
  });

  revalidatePath("/demographics");
  revalidateTag(`demographics-${userId}`);
  notifyAdmins("proof_pending", "New demographic proof", "A creator submitted a demographic proof for review.", "/admin/demographics").catch(() => {});
  return { ok: true };
}

export async function saveBank(formData: FormData) {
  const userId = await uid();
  const accountHolder = String(formData.get("accountHolder") ?? "").trim();
  const method = String(formData.get("method") ?? "bank");
  const accountNumber = method === "bank" ? String(formData.get("accountNumber") ?? "").trim() : "";
  const routingNumber = method === "bank" ? String(formData.get("routingNumber") ?? "").trim() || null : null;
  const bankName = method === "bank" ? String(formData.get("bankName") ?? "").trim() || null : null;
  const paypalEmail = method === "paypal" ? String(formData.get("paypalEmail") ?? "").trim() || null : null;
  const upiId = method === "upi" ? String(formData.get("upiId") ?? "").trim() || null : null;
  const country = "IN";
  if (!accountHolder || (!accountNumber && !paypalEmail && !upiId)) throw new Error("Missing fields");

  await prisma.bankAccount.upsert({
    where: { userId },
    update: { accountHolder, accountNumber, routingNumber, bankName, country, paypalEmail, upiId },
    create: { userId, accountHolder, accountNumber, routingNumber, bankName, country, paypalEmail, upiId },
  });
  revalidatePath("/bank");
  revalidatePath("/admin/creators");
  revalidatePath(`/admin/creators/${userId}`);
  revalidatePath("/admin/payouts");
}

// --- Referrals --------------------------------------------------------------

// Readable code: no ambiguous characters (0/O, 1/I/L).
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function randomCode(len = 6) {
  let out = "";
  for (let i = 0; i < len; i++) out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return out;
}

/** Creates a unique referral code for the current user (no-op if they already have one). */
export async function updateProfile(formData: FormData): Promise<{ ok: boolean; message: string }> {
  const userId = await uid();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, message: "Name cannot be empty." };
  await prisma.user.update({ where: { id: userId }, data: { name } });
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true, message: "Profile updated." };
}

export async function generateReferralCode() {
  const userId = await uid();
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } });
  if (me?.referralCode) return me.referralCode;

  // Retry until we land a code not already taken.
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = randomCode();
    const clash = await prisma.user.findUnique({ where: { referralCode: code }, select: { id: true } });
    if (clash) continue;
    await prisma.user.update({ where: { id: userId }, data: { referralCode: code } });
    revalidatePath("/referrals");
    return code;
  }
  throw new Error("Could not generate a unique code, please try again");
}

export type ApplyResult = { ok: boolean; message: string };

async function redeemReferralCode(userId: string, code: string): Promise<ApplyResult> {
  code = code.trim().toUpperCase();
  if (!code) return { ok: false, message: "Enter a referral code." };

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, referredById: true },
  });
  if (!me) return { ok: false, message: "Account not found." };
  if (me.referredById) return { ok: false, message: "You've already applied a referral code." };

  const earned = await prisma.submission.count({ where: { userId, status: "APPROVED" } });
  if (earned > 0) return { ok: false, message: "Codes only work for new accounts that haven't earned rewards yet." };

  const owner = await prisma.user.findUnique({ where: { referralCode: code }, select: { id: true } });
  if (!owner) return { ok: false, message: "That referral code isn't valid." };
  if (owner.id === userId) return { ok: false, message: "You can't apply your own code." };

  await prisma.user.update({ where: { id: userId }, data: { referredById: owner.id } });
  revalidatePath("/referrals");
  return { ok: true, message: "Referral code applied — your earnings boost is active!" };
}

/** Redeems a referral code shared with the current (new) creator. */
export async function applyReferralCode(formData: FormData): Promise<ApplyResult> {
  const userId = await uid();
  return redeemReferralCode(userId, String(formData.get("code") ?? ""));
}

/** Auto-applies a referral code passed as a URL param after OAuth sign-in. */
export async function applyReferralCodeByString(code: string): Promise<ApplyResult> {
  const userId = await uid();
  return redeemReferralCode(userId, code);
}
