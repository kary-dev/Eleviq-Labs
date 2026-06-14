import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { ProofPanel } from "@/components/ProofPanel";

export default async function DemographicsPage() {
  const user = await requireUser();

  const [submissions, proofs] = await Promise.all([
    prisma.submission.findMany({
      where: { userId: user.id },
      include: { campaign: { select: { title: true, brand: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.demographicProof.findMany({
      where: { userId: user.id },
      include: { campaign: { select: { title: true, brand: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Demographic Verification"
        subtitle="Submit proof of your views and audience demographics for your campaigns."
      />
      <ProofPanel submissions={submissions} proofs={proofs} />
    </>
  );
}
