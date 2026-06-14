import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatusPill } from "@/components/ui";
import { BankForm } from "@/components/BankForm";

export default async function BankPage() {
  const user = await requireUser();
  const bank = await prisma.bankAccount.findUnique({ where: { userId: user.id } });

  return (
    <>
      <PageHeader
        title="Bank Account"
        subtitle="Add where you'd like to receive your campaign payouts."
        action={bank ? <StatusPill status="VERIFIED" /> : undefined}
      />
      <BankForm bank={bank} />
    </>
  );
}
