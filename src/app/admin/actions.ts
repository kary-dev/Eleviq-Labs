"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { estPayout } from "@/lib/format";

async function ensureAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Forbidden");
}

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/submissions");
  revalidatePath("/admin/creators");
}

export async function approveSubmission(id: string) {
  await ensureAdmin();
  const sub = await prisma.submission.findUnique({ where: { id }, include: { campaign: true } });
  if (!sub) throw new Error("Not found");

  const payout = estPayout(sub.views, sub.campaign.ratePerThousand);

  await prisma.$transaction([
    prisma.submission.update({
      where: { id },
      data: { status: "APPROVED", payout, reviewedAt: new Date(), rejectReason: null },
    }),
    prisma.campaign.update({
      where: { id: sub.campaignId },
      data: { totalBudgetUsed: { increment: payout } },
    }),
    prisma.payout.create({
      data: { userId: sub.userId, amount: payout, status: "PENDING", note: `${sub.campaign.brand} — ${sub.campaign.title}` },
    }),
  ]);

  revalidateAdmin();
}

export async function rejectSubmission(id: string, reason: string) {
  await ensureAdmin();
  await prisma.submission.update({
    where: { id },
    data: { status: "REJECTED", reviewedAt: new Date(), payout: 0, rejectReason: reason || "Did not meet campaign guidelines" },
  });
  revalidateAdmin();
}

export async function updateViews(id: string, views: number) {
  await ensureAdmin();
  const sub = await prisma.submission.findUnique({ where: { id }, include: { campaign: true } });
  if (!sub) return;
  await prisma.submission.update({
    where: { id },
    data: { views, payout: sub.status === "APPROVED" ? estPayout(views, sub.campaign.ratePerThousand) : sub.payout },
  });
  revalidateAdmin();
}

export async function markPayoutPaid(id: string) {
  await ensureAdmin();
  await prisma.payout.update({ where: { id }, data: { status: "PAID", paidAt: new Date() } });
  revalidatePath("/admin/creators");
  revalidatePath("/admin");
}

export async function reviewProof(id: string, status: "APPROVED" | "REJECTED") {
  await ensureAdmin();
  await prisma.demographicProof.update({ where: { id }, data: { status } });
  revalidatePath("/admin");
}

export async function createCampaign(formData: FormData) {
  await ensureAdmin();
  const platforms = formData.getAll("platforms").map(String);
  await prisma.campaign.create({
    data: {
      title: String(formData.get("title") ?? "").trim(),
      brand: String(formData.get("brand") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      thumbnail: String(formData.get("thumbnail") ?? "🎬").trim() || "🎬",
      ratePerThousand: parseFloat(String(formData.get("ratePerThousand") ?? "1.5")) || 1.5,
      budget: parseFloat(String(formData.get("budget") ?? "1000")) || 1000,
      minViews: parseInt(String(formData.get("minViews") ?? "0"), 10) || 0,
      platforms: platforms.length ? platforms.join(",") : "INSTAGRAM,YOUTUBE,X,TIKTOK",
      status: "ACTIVE",
    },
  });
  revalidatePath("/admin/campaigns");
  revalidatePath("/dashboard");
}

export async function setCampaignStatus(id: string, status: "ACTIVE" | "ENDED" | "DRAFT") {
  await ensureAdmin();
  await prisma.campaign.update({ where: { id }, data: { status } });
  revalidatePath("/admin/campaigns");
  revalidatePath("/dashboard");
}
