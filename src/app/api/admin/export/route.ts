import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function csv(rows: string[][]): string {
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const type = req.nextUrl.searchParams.get("type") ?? "submissions";

  let body = "";
  let filename = "export.csv";

  if (type === "submissions") {
    const subs = await prisma.submission.findMany({
      include: {
        user: { select: { name: true, email: true } },
        campaign: { select: { title: true, brand: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    body = csv([
      ["ID", "Creator", "Email", "Campaign", "Platform", "URL", "Views", "Payout", "Status", "Created"],
      ...subs.map((s) => [
        s.id, s.user.name ?? "", s.user.email ?? "", `${s.campaign.brand} - ${s.campaign.title}`,
        s.platform, s.url, String(s.views), String(s.payout), s.status, s.createdAt.toISOString(),
      ]),
    ]);
    filename = "submissions.csv";

  } else if (type === "creators") {
    const creators = await prisma.user.findMany({
      where: { role: "CREATOR" },
      include: { submissions: { select: { status: true, views: true, payout: true } } },
      orderBy: { createdAt: "desc" },
    });
    body = csv([
      ["ID", "Name", "Email", "Tier", "Total Clips", "Approved Clips", "Total Views", "Total Earned", "Banned", "Joined"],
      ...creators.map((c) => {
        const approved = c.submissions.filter((s) => s.status === "APPROVED");
        return [
          c.id, c.name ?? "", c.email ?? "", c.tier,
          String(c.submissions.length), String(approved.length),
          String(c.submissions.reduce((a, s) => a + s.views, 0)),
          String(approved.reduce((a, s) => a + s.payout, 0)),
          String(c.banned), c.createdAt.toISOString(),
        ];
      }),
    ]);
    filename = "creators.csv";

  } else if (type === "demographics") {
    const proofs = await prisma.demographicProof.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    body = csv([
      ["ID", "Creator", "Email", "Method", "Status", "Created"],
      ...proofs.map((p) => [
        p.id, p.user.name ?? "", p.user.email ?? "", p.method ?? "", p.status, p.createdAt.toISOString(),
      ]),
    ]);
    filename = "demographics.csv";
  }

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
