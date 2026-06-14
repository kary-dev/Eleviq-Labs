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
