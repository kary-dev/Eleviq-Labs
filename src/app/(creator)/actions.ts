"use server";

import { revalidatePath } from "next/cache";
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
    where: { userId, platform, verified: true },
    select: { handle: true },
  });
  return new Set(accts.map((a) => a.handle.toLowerCase()));
}

/** Verified canonical account ids (e.g. YouTube channelId) for the current user. */
async function verifiedIds(userId: string, platform: Platform): Promise<Set<string>> {
  const accts = await prisma.socialAccount.findMany({
    where: { userId, platform, verified: true, igUserId: { not: null } },
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
  return { ok: true };
}

/** Re-fetches the live view count for a submission (any provider platform). */
export async function refreshClipViews(submissionId: string) {
  const userId = await uid();
  const sub = await prisma.submission.findFirst({
    where: { id: submissionId, userId },
    include: { campaign: { select: { ratePerThousand: true } } },
  });
  if (!sub) throw new Error("Not found");
  if (!platformHasProvider(sub.platform)) return;

  const post = await getPostFor(sub.platform, sub.url);
  if (!post) return;

  await prisma.submission.update({
    where: { id: sub.id },
    data: {
      views: post.views,
      lastSyncedAt: new Date(),
      // Keep payout in sync for approved clips; pending payout is recomputed on approval.
      payout: sub.status === "APPROVED" ? estPayout(post.views, sub.campaign.ratePerThousand) : sub.payout,
    },
  });
  revalidatePath("/dashboard");
  revalidatePath("/earnings");
}

/** Re-fetches live views for all of the user's clips in a campaign (where a
 *  provider exists), and recomputes each clip's payout from the live count. */
export async function refreshCampaignClips(campaignId: string) {
  const userId = await uid();
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { ratePerThousand: true },
  });
  if (!campaign) return;

  const subs = await prisma.submission.findMany({
    where: { userId, campaignId, platform: { in: ["INSTAGRAM", "YOUTUBE", "TIKTOK"] } },
    select: { id: true, url: true, platform: true },
  });

  for (const sub of subs) {
    try {
      const post = await getPostFor(sub.platform, sub.url);
      if (!post) continue;
      await prisma.submission.update({
        where: { id: sub.id },
        data: {
          views: post.views,
          lastSyncedAt: new Date(),
          payout: estPayout(post.views, campaign.ratePerThousand),
        },
      });
    } catch {
      // Skip clips that fail to refresh; keep the last known views.
    }
  }

  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath("/campaigns");
  revalidatePath("/dashboard");
  revalidatePath("/earnings");
}

export async function verifyAccount(formData: FormData) {
  const userId = await uid();
  const platform = String(formData.get("platform") ?? "") as Platform;
  const handle = String(formData.get("handle") ?? "").trim().replace(/^@/, "");
  const url = String(formData.get("url") ?? "").trim() || null;
  const method = String(formData.get("method") ?? "").trim() || null;
  if (!platform || !handle) throw new Error("Missing fields");

  // Don't add an already-verified account again (idempotent).
  const existing = await prisma.socialAccount.findFirst({
    where: { userId, platform, handle, verified: true },
    select: { id: true },
  });
  if (existing) {
    revalidatePath("/social");
    return;
  }

  await prisma.socialAccount.create({
    data: { userId, platform, handle, url, verified: true, method },
  });
  revalidatePath("/social");
  revalidatePath("/dashboard");
}

export async function removeSocial(id: string) {
  const userId = await uid();
  await prisma.socialAccount.deleteMany({ where: { id, userId } });
  revalidatePath("/social");
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

  // Block any handle that's already verified — by you or by someone else.
  const taken = await prisma.socialAccount.findFirst({
    where: { platform, handle, verified: true },
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
      verified: true, verifiedAt: new Date(), verifyCode: null,
      avatarUrl: profile.avatarUrl, followers: profile.followers,
      isProfessional: profile.isProfessional, igUserId: profile.canonicalId,
    },
  });
  clearMockBio(platform, acct.handle);

  revalidatePath("/social");
  revalidatePath("/dashboard");
  return { ok: true, message: `${label} account verified! You can now submit clips.` };
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
}

export async function saveBank(formData: FormData) {
  const userId = await uid();
  const accountHolder = String(formData.get("accountHolder") ?? "").trim();
  const accountNumber = String(formData.get("accountNumber") ?? "").trim();
  const routingNumber = String(formData.get("routingNumber") ?? "").trim() || null;
  const bankName = String(formData.get("bankName") ?? "").trim() || null;
  const country = String(formData.get("country") ?? "US").trim();
  const paypalEmail = String(formData.get("paypalEmail") ?? "").trim() || null;
  if (!accountHolder || (!accountNumber && !paypalEmail)) throw new Error("Missing fields");

  await prisma.bankAccount.upsert({
    where: { userId },
    update: { accountHolder, accountNumber, routingNumber, bankName, country, paypalEmail },
    create: { userId, accountHolder, accountNumber, routingNumber, bankName, country, paypalEmail },
  });
  revalidatePath("/bank");
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

/** Redeems a referral code shared with the current (new) creator. */
export async function applyReferralCode(formData: FormData): Promise<ApplyResult> {
  const userId = await uid();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!code) return { ok: false, message: "Enter a referral code." };

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, referredById: true, referralCode: true, _count: { select: { submissions: true } } },
  });
  if (!me) return { ok: false, message: "Account not found." };
  if (me.referredById) return { ok: false, message: "You've already applied a referral code." };

  // Only new accounts that haven't earned rewards yet can redeem.
  const earned = await prisma.submission.count({ where: { userId, status: "APPROVED" } });
  if (earned > 0) return { ok: false, message: "Codes only work for new accounts that haven't earned rewards yet." };

  const owner = await prisma.user.findUnique({ where: { referralCode: code }, select: { id: true } });
  if (!owner) return { ok: false, message: "That referral code isn't valid." };
  if (owner.id === userId) return { ok: false, message: "You can't apply your own code." };

  await prisma.user.update({ where: { id: userId }, data: { referredById: owner.id } });
  revalidatePath("/referrals");
  return { ok: true, message: "Referral code applied — your earnings boost is active!" };
}
