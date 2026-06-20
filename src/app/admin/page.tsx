import { Suspense } from "react";
import Link from "next/link";
import { PageHeader, StatCard, EmptyState } from "@/components/ui";
import { AdminReviewCard } from "@/components/AdminReviewCard";
import { CheckIcon } from "@/components/icons";
import { money } from "@/lib/format";
import { getAdminStats, getAdminPendingSubmissions } from "@/lib/queries";

async function AdminStats() {
  const { creatorCount, approvedAgg, campaignCount, paidAgg } = await getAdminStats();
  const pending = await getAdminPendingSubmissions();
  return (
    <div className="mb-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Pending Review" value={pending.length} hint="Clips awaiting approval" />
      <StatCard label="Creators" value={creatorCount} />
      <StatCard label="Active Campaigns" value={campaignCount} />
      <StatCard label="Total Paid Out" value={money(paidAgg._sum.amount ?? 0)} hint="Across all creators" />
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="mb-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card p-5">
          <div className="mb-2 h-3 w-24 rounded bg-surface-2" />
          <div className="h-8 w-20 rounded-lg bg-surface-2" />
        </div>
      ))}
    </div>
  );
}

async function PendingSubmissionsSection() {
  const pending = await getAdminPendingSubmissions();
  return pending.length === 0 ? (
    <EmptyState icon={<CheckIcon className="h-7 w-7" />} title="Nothing to review" body="All caught up — no pending submissions right now." />
  ) : (
    <div className="grid gap-5 md:grid-cols-2">
      {pending.map((s) => (
        <AdminReviewCard key={s.id} sub={s} />
      ))}
    </div>
  );
}

function SubmissionsSkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-2 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card p-5">
          <div className="mb-3 h-5 w-3/4 rounded bg-surface-2" />
          <div className="h-4 w-1/2 rounded bg-surface-2" />
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <>
      <PageHeader title="Admin Dashboard" subtitle="Review submissions, manage creators, and approve payouts." />

      <Suspense fallback={<StatsSkeleton />}>
        <AdminStats />
      </Suspense>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold">Pending Submissions</h2>
            <p className="text-sm text-muted">Clips submitted by creators, awaiting your review.</p>
          </div>
          <Link href="/admin/submissions" className="btn-ghost">View all</Link>
        </div>
        <Suspense fallback={<SubmissionsSkeleton />}>
          <PendingSubmissionsSection />
        </Suspense>
      </section>
    </>
  );
}
