"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { estPayout } from "@/lib/format";
import type { Platform } from "@prisma/client";

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

export async function addClip(formData: FormData) {
  const userId = await uid();
  const campaignId = String(formData.get("campaignId") ?? "");
  const platform = String(formData.get("platform") ?? "") as Platform;
  const url = String(formData.get("url") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim() || null;
  const views = parseInt(String(formData.get("views") ?? "0"), 10) || 0;

  if (!campaignId || !url || !platform) throw new Error("Missing fields");

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new Error("Campaign not found");

  await prisma.participation.upsert({
    where: { userId_campaignId: { userId, campaignId } },
    update: {},
    create: { userId, campaignId },
  });

  await prisma.submission.create({
    data: {
      userId,
      campaignId,
      platform,
      url,
      title,
      views,
      status: "PENDING",
      payout: estPayout(views, campaign.ratePerThousand),
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/campaigns");
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
