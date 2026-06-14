import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Eleviq Labs...");

  // --- Users ---------------------------------------------------------------
  const admin = await prisma.user.upsert({
    where: { email: "admin@eleviqlabs.com" },
    update: { role: "ADMIN" },
    create: {
      email: "admin@eleviqlabs.com",
      name: "Eleviq Admin",
      role: "ADMIN",
      referralCode: "ELEVIQ-ADMIN",
    },
  });

  const creator = await prisma.user.upsert({
    where: { email: "creator@eleviqlabs.com" },
    update: {},
    create: {
      email: "creator@eleviqlabs.com",
      name: "Demo Creator",
      role: "CREATOR",
      referralCode: "ELEVIQ-CREATOR",
      image: "https://cdn.discordapp.com/embed/avatars/2.png",
    },
  });

  const creator2 = await prisma.user.upsert({
    where: { email: "maya@eleviqlabs.com" },
    update: {},
    create: {
      email: "maya@eleviqlabs.com",
      name: "Maya Rivers",
      role: "CREATOR",
      referralCode: "ELEVIQ-MAYA",
      referredById: creator.id,
      image: "https://cdn.discordapp.com/embed/avatars/4.png",
    },
  });

  // --- Social accounts -----------------------------------------------------
  await prisma.socialAccount.deleteMany({ where: { userId: creator.id } });
  await prisma.socialAccount.createMany({
    data: [
      { userId: creator.id, platform: "INSTAGRAM", handle: "@democreator", url: "https://instagram.com/democreator", verified: true },
      { userId: creator.id, platform: "TIKTOK", handle: "@democreator", url: "https://tiktok.com/@democreator", verified: true },
    ],
  });

  // --- Campaigns -----------------------------------------------------------
  const campaignSeed = [
    {
      title: "Launch Hype: Nova Energy",
      brand: "Nova Drinks",
      description: "Clip our launch trailer and hype the new Nova Energy flavor. Fast cuts, high energy. Best clips get bonus payouts.",
      thumbnail: "⚡",
      ratePerThousand: 2.0,
      budget: 5000,
      totalBudgetUsed: 820,
      minViews: 1000,
      discordUrl: "https://discord.gg/eleviq",
      platforms: "INSTAGRAM,TIKTOK,YOUTUBE",
      status: "ACTIVE" as const,
    },
    {
      title: "Pulse Headphones Drop",
      brand: "Pulse Audio",
      description: "Showcase the Pulse ANC headphones. Unboxing, sound tests, lifestyle clips all welcome.",
      thumbnail: "🎧",
      ratePerThousand: 1.75,
      budget: 3000,
      totalBudgetUsed: 410,
      minViews: 500,
      discordUrl: "https://discord.gg/eleviq",
      platforms: "INSTAGRAM,TIKTOK,X",
      status: "ACTIVE" as const,
    },
    {
      title: "Skyline Mobile App",
      brand: "Skyline",
      description: "Show off the Skyline travel-planning app. Demo a trip being planned in under 30s.",
      thumbnail: "✈️",
      ratePerThousand: 2.5,
      budget: 4000,
      totalBudgetUsed: 3950,
      minViews: 2000,
      discordUrl: "https://discord.gg/eleviq",
      platforms: "YOUTUBE,TIKTOK",
      status: "ENDED" as const,
    },
  ];

  // Reset campaigns/submissions for idempotent seed
  await prisma.submission.deleteMany();
  await prisma.participation.deleteMany();
  await prisma.demographicProof.deleteMany();
  await prisma.campaign.deleteMany();

  const campaigns = [];
  for (const c of campaignSeed) {
    campaigns.push(await prisma.campaign.create({ data: c }));
  }
  const [nova, pulse, skyline] = campaigns;

  // --- Participations -------------------------------------------------------
  await prisma.participation.createMany({
    data: [
      { userId: creator.id, campaignId: nova.id },
      { userId: creator.id, campaignId: pulse.id },
      { userId: creator.id, campaignId: skyline.id },
      { userId: creator2.id, campaignId: nova.id },
    ],
  });

  // --- Submissions ----------------------------------------------------------
  await prisma.submission.createMany({
    data: [
      // Demo creator
      { userId: creator.id, campaignId: nova.id, platform: "TIKTOK", url: "https://tiktok.com/@democreator/video/1", title: "Nova launch edit", views: 84200, status: "APPROVED", payout: 168.4, reviewedAt: new Date() },
      { userId: creator.id, campaignId: nova.id, platform: "INSTAGRAM", url: "https://instagram.com/reel/abc", title: "Nova reel v2", views: 12400, status: "PENDING" },
      { userId: creator.id, campaignId: pulse.id, platform: "TIKTOK", url: "https://tiktok.com/@democreator/video/2", title: "Pulse unboxing", views: 5300, status: "PENDING" },
      { userId: creator.id, campaignId: skyline.id, platform: "YOUTUBE", url: "https://youtube.com/shorts/xyz", title: "Skyline 30s demo", views: 41000, status: "APPROVED", payout: 102.5, reviewedAt: new Date() },
      { userId: creator.id, campaignId: pulse.id, platform: "X", url: "https://x.com/democreator/status/1", title: "Pulse thread clip", views: 800, status: "REJECTED", rejectReason: "Below minimum views & audio muted", reviewedAt: new Date() },
      // Maya
      { userId: creator2.id, campaignId: nova.id, platform: "INSTAGRAM", url: "https://instagram.com/reel/maya1", title: "Nova aesthetic reel", views: 23000, status: "PENDING" },
    ],
  });

  // --- Payouts --------------------------------------------------------------
  await prisma.payout.deleteMany();
  await prisma.payout.createMany({
    data: [
      { userId: creator.id, amount: 168.4, status: "PAID", note: "Nova Energy — TikTok", paidAt: new Date(Date.now() - 86400000 * 7) },
      { userId: creator.id, amount: 102.5, status: "PENDING", note: "Skyline — YouTube" },
    ],
  });

  console.log("✅ Seed complete.");
  console.log("   Admin   : admin@eleviqlabs.com  (role ADMIN)");
  console.log("   Creator : creator@eleviqlabs.com (role CREATOR)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
