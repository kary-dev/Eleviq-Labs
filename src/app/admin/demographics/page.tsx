import { Suspense } from "react";
import { PageHeader, EmptyState } from "@/components/ui";
import { DemographicReviewCard } from "@/components/DemographicReviewCard";
import { ChartIcon } from "@/components/icons";
import { getAdminPendingProofs } from "@/lib/queries";

async function ProofsList() {
  const proofs = await getAdminPendingProofs();

  return proofs.length === 0 ? (
    <EmptyState icon={<ChartIcon className="h-7 w-7" />} title="No proofs pending" />
  ) : (
    <div className="grid gap-5 md:grid-cols-2">
      {proofs.map((p) => (
        <DemographicReviewCard key={p.id} proof={p} />
      ))}
    </div>
  );
}

function ProofsSkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-2 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card p-5">
          <div className="mb-3 h-5 w-3/4 rounded bg-surface-2" />
          <div className="mb-4 h-40 w-full rounded-xl bg-surface-2" />
          <div className="flex gap-2">
            <div className="h-8 w-24 rounded-xl bg-surface-2" />
            <div className="h-8 w-24 rounded-xl bg-surface-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminDemographicsPage() {
  return (
    <>
      <PageHeader title="Demographic Reviews" subtitle="Audience data awaiting approval." />
      <Suspense fallback={<ProofsSkeleton />}>
        <ProofsList />
      </Suspense>
    </>
  );
}
