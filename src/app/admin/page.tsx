import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard, EmptyState } from "@/components/ui";
import { AdminReviewCard } from "@/components/AdminReviewCard";
import { money, compact } from "@/lib/format";
import { CheckIcon } from "@/components/icons";

export default async function AdminDashboard() {
  const [pending, creatorCount, approvedAgg, campaignCount, paidAgg] = await Promise.all([
    prisma.submission.findMany({
      where: { status: "PENDING" },
      include: {
        campaign: { select: { title: true, brand: true, ratePerThousand: true } },
        user: { select: { name: true, email: true, image: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.count({ where: { role: "CREATOR" } }),
    prisma.submission.aggregate({ where: { status: "APPROVED" }, _sum: { payout: true } }),
    prisma.campaign.count({ where: { status: "ACTIVE" } }),
    prisma.payout.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
  ]);

  return (
    <>
      <PageHeader title="Admin Dashboard" subtitle="Review submissions, manage creators, and approve payouts." />

      <div className="mb-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending Review" value={pending.length} hint="Clips awaiting approval" />
        <StatCard label="Creators" value={creatorCount} />
        <StatCard label="Active Campaigns" value={campaignCount} />
        <StatCard label="Approved Payouts" value={money(approvedAgg._sum.payout ?? 0)} hint={`${money(paidAgg._sum.amount ?? 0)} paid out`} />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold">Pending Submissions</h2>
            <p className="text-sm text-muted">Clips submitted by creators, awaiting your review.</p>
          </div>
          <Link href="/admin/submissions" className="btn-ghost">View all</Link>
        </div>

        {pending.length === 0 ? (
          <EmptyState icon={<CheckIcon className="h-7 w-7" />} title="Nothing to review" body="All caught up — no pending submissions right now." />
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {pending.map((s) => (
              <AdminReviewCard key={s.id} sub={s} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
