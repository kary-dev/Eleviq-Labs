import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";
import { DemographicReviewCard } from "@/components/DemographicReviewCard";
import { ChartIcon } from "@/components/icons";

export default async function AdminDemographicsPage() {
  await requireAdmin();

  const proofs = await prisma.demographicProof.findMany({
    where: { status: "PENDING" },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <PageHeader
        title="Demographic Reviews"
        subtitle="Audience data awaiting approval."
      />

      {proofs.length === 0 ? (
        <EmptyState icon={<ChartIcon className="h-7 w-7" />} title="No proofs pending" />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {proofs.map((p) => (
            <DemographicReviewCard key={p.id} proof={p} />
          ))}
        </div>
      )}
    </>
  );
}
