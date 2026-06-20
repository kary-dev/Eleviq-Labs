import { Suspense } from "react";
import { requireUser } from "@/lib/session";
import { PageHeader, StatusPill } from "@/components/ui";
import { BankForm } from "@/components/BankForm";
import { cachedUserBank } from "@/lib/queries";

async function BankContent({ userId }: { userId: string }) {
  const bank = await cachedUserBank(userId)();

  return (
    <>
      {bank && (
        <div className="mb-4">
          <StatusPill status="VERIFIED" />
        </div>
      )}
      <BankForm bank={bank} />
    </>
  );
}

function BankSkeleton() {
  return (
    <div className="card p-6 space-y-5">
      {[0, 1, 2, 3].map((i) => (
        <div key={i}>
          <div className="mb-1.5 h-3 w-28 animate-pulse rounded bg-surface-2" />
          <div className="h-10 w-full animate-pulse rounded-lg bg-surface-2" />
        </div>
      ))}
      <div className="h-10 w-full animate-pulse rounded-lg bg-surface-2" />
    </div>
  );
}

export default async function BankPage() {
  const user = await requireUser();

  return (
    <>
      <PageHeader
        title="Bank Account"
        subtitle="Add where you'd like to receive your campaign payouts."
      />
      <Suspense fallback={<BankSkeleton />}>
        <BankContent userId={user.id!} />
      </Suspense>
    </>
  );
}
