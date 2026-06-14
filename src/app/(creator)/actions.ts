"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { estPayout } from "@/lib/format";
import {
  instagram,
  normalizeHandle,
  extractShortcode,
  MOCK_BIO_REGISTER,
} from "@/lib/instagram";
import type { Platform } from "@prisma/client";

async function uid() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

function isInstagramUrl(url: string) {
  return /instagram\.com\//i.test(url);
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
  views?: number;
  caption?: string | null;
  thumbnailUrl?: string | null;
  ownedByYou?: boolean;
};

/** Verified Instagram handles for the current user (lowercased). */
async function verifiedIgHandles(userId: string): Promise<Set<string>> {
  const accts = await prisma.socialAccount.findMany({
    where: { userId, platform: "INSTAGRAM", verified: true },
    select: { handle: true },
  });
  return new Set(accts.map((a) => a.handle.toLowerCase()));
}

/**
 * Fetches a post's details from its URL so the creator doesn't type them in,
 * and tells the UI whether it belongs to one of their verified accounts.
 */
export async function fetchClipPreview(url: string): Promise<ClipPreview> {
  const userId = await uid();
  const clean = url.trim();
  if (!isInstagramUrl(clean) || !extractShortcode(clean)) {
    return { ok: false, message: "Paste a valid Instagram post or reel link." };
  }

  const post = await instagram().getPost(clean);
  if (!post) return { ok: false, message: "Couldn't fetch that post. Check the link and try again." };

  const handles = await verifiedIgHandles(userId);
  const ownedByYou = handles.has(post.ownerUsername.toLowerCase());

  return {
    ok: true,
    ownerUsername: post.ownerUsername,
    views: post.views,
    caption: post.caption,
    thumbnailUrl: post.thumbnailUrl,
    ownedByYou,
    message: ownedByYou ? undefined : `This post is from @${post.ownerUsername}, which isn't a verified account on your profile.`,
  };
}

export async function addClip(formData: FormData) {
  const userId = await uid();
  const campaignId = String(formData.get("campaignId") ?? "");
  const url = String(formData.get("url") ?? "").trim();
  if (!campaignId || !url) throw new Error("Missing fields");

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new Error("Campaign not found");

  // Gate: must have at least one verified Instagram account.
  const handles = await verifiedIgHandles(userId);
  if (handles.size === 0) {
    throw new Error("Verify an Instagram account first (Social Verification).");
  }

  if (!isInstagramUrl(url) || !extractShortcode(url)) {
    throw new Error("Only Instagram post/reel links are supported.");
  }

  // Re-fetch server-side (never trust client-sent stats) and verify ownership.
  const post = await instagram().getPost(url);
  if (!post) throw new Error("Couldn't fetch that post — check the link.");
  if (!handles.has(post.ownerUsername.toLowerCase())) {
    throw new Error(`That post belongs to @${post.ownerUsername}, not a verified account of yours.`);
  }

  await prisma.participation.upsert({
    where: { userId_campaignId: { userId, campaignId } },
    update: {},
    create: { userId, campaignId },
  });

  await prisma.submission.create({
    data: {
      userId,
      campaignId,
      platform: "INSTAGRAM",
      url,
      title: post.caption?.slice(0, 120) ?? null,
      views: post.views,
      thumbnailUrl: post.thumbnailUrl,
      ownerHandle: post.ownerUsername,
      lastSyncedAt: new Date(),
      status: "PENDING",
      payout: estPayout(post.views, campaign.ratePerThousand),
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/campaigns");
  revalidatePath("/earnings");
}

/** Re-fetches the live view count for a submission. */
export async function refreshClipViews(submissionId: string) {
  const userId = await uid();
  const sub = await prisma.submission.findFirst({
    where: { id: submissionId, userId },
    include: { campaign: { select: { ratePerThousand: true } } },
  });
  if (!sub) throw new Error("Not found");

  const post = await instagram().getPost(sub.url);
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

export async function verifyAccount(formData: FormData) {
  const userId = await uid();
  const platform = String(formData.get("platform") ?? "") as Platform;
  const handle = String(formData.get("handle") ?? "").trim().replace(/^@/, "");
  const url = String(formData.get("url") ?? "").trim() || null;
  const method = String(formData.get("method") ?? "").trim() || null;
  if (!platform || !handle) throw new Error("Missing fields");

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

// --- Instagram bio verification --------------------------------------------

export type StartVerifyResult =
  | { ok: true; accountId: string; code: string; handle: string; isProfessional: boolean; avatarUrl: string | null; followers: number }
  | { ok: false; message: string };

/**
 * Step 1: creator enters their IG username. We fetch the profile to confirm it
 * exists, snapshot it, generate a 6-char code, and ask them to put it in their
 * bio. Returns the code + account id to display/check.
 */
export async function startInstagramVerification(formData: FormData): Promise<StartVerifyResult> {
  const userId = await uid();
  const handle = normalizeHandle(String(formData.get("handle") ?? ""));
  if (!handle) return { ok: false, message: "Enter your Instagram username." };

  const profile = await instagram().getProfile(handle);
  if (!profile) return { ok: false, message: "We couldn't find that Instagram account." };
  if (profile.isPrivate) return { ok: false, message: "Your account is private — make it public to verify." };

  // Don't let two creators claim the same handle.
  const taken = await prisma.socialAccount.findFirst({
    where: { platform: "INSTAGRAM", handle, verified: true, NOT: { userId } },
    select: { id: true },
  });
  if (taken) return { ok: false, message: "That account is already verified by another creator." };

  const code = randomCode(6);
  const snapshot = {
    avatarUrl: profile.avatarUrl, followers: profile.followers,
    isProfessional: profile.isProfessional, igUserId: profile.userId,
    url: `https://instagram.com/${handle}`,
  };

  const existing = await prisma.socialAccount.findFirst({
    where: { userId, platform: "INSTAGRAM", handle },
    select: { id: true },
  });

  const acct = existing
    ? await prisma.socialAccount.update({
        where: { id: existing.id },
        data: { verifyCode: code, method: "bio", verified: false, ...snapshot },
      })
    : await prisma.socialAccount.create({
        data: { userId, platform: "INSTAGRAM", handle, method: "bio", verified: false, verifyCode: code, ...snapshot },
      });

  // In mock mode the provider can't read a real bio, so register the code to
  // make the "Check bio" step succeed for end-to-end testing.
  if (instagram().mode === "mock") MOCK_BIO_REGISTER.set(handle, code);

  revalidatePath("/social");
  return {
    ok: true, accountId: acct.id, code, handle,
    isProfessional: profile.isProfessional, avatarUrl: profile.avatarUrl, followers: profile.followers,
  };
}

/**
 * Step 2: re-fetch the profile and confirm the code is present in the bio.
 */
export async function checkInstagramBio(socialAccountId: string): Promise<{ ok: boolean; message: string }> {
  const userId = await uid();
  const acct = await prisma.socialAccount.findFirst({ where: { id: socialAccountId, userId } });
  if (!acct || !acct.verifyCode) return { ok: false, message: "Start verification first." };

  const profile = await instagram().getProfile(acct.handle);
  if (!profile) return { ok: false, message: "Couldn't load your profile. Try again." };

  if (!profile.biography.toUpperCase().includes(acct.verifyCode.toUpperCase())) {
    return { ok: false, message: `Code not found in your bio yet. Add ${acct.verifyCode} to your Instagram bio, save, then re-check.` };
  }

  await prisma.socialAccount.update({
    where: { id: acct.id },
    data: {
      verified: true, verifiedAt: new Date(), verifyCode: null,
      avatarUrl: profile.avatarUrl, followers: profile.followers,
      isProfessional: profile.isProfessional, igUserId: profile.userId,
    },
  });
  if (instagram().mode === "mock") MOCK_BIO_REGISTER.delete(acct.handle);

  revalidatePath("/social");
  revalidatePath("/dashboard");
  return { ok: true, message: "Instagram account verified! You can now submit clips." };
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
