import { Suspense } from "react";
import { PageHeader, EmptyState } from "@/components/ui";
import { AccountReviewRow } from "@/components/AccountReviewRow";
import { ShieldIcon } from "@/components/icons";
import { getAdminPendingAccounts } from "@/lib/queries";

export const maxDuration = 60;

async function AccountsList() {
  const pending = await getAdminPendingAccounts();

  return pending.length === 0 ? (
    <EmptyState
      icon={<ShieldIcon className="h-7 w-7" />}
      title="No accounts awaiting review"
      body="When a creator passes bio verification, their account shows up here for approval."
    />
  ) : (
    <div className="card divide-y divide-border">
      {pending.map((a) => (
        <AccountReviewRow
          key={a.id}
          account={{
            id: a.id,
            platform: a.platform,
            handle: a.handle,
            url: a.url,
            avatarUrl: a.avatarUrl,
            followers: a.followers,
            isProfessional: a.isProfessional,
            method: a.method,
            userName: a.user.name,
            userEmail: a.user.email,
          }}
        />
      ))}
    </div>
  );
}

function AccountsSkeleton() {
  return (
    <div className="card divide-y divide-border animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-4">
          <div className="h-10 w-10 shrink-0 rounded-full bg-surface-2" />
          <div className="flex-1">
            <div className="mb-1.5 h-4 w-36 rounded bg-surface-2" />
            <div className="h-3 w-24 rounded bg-surface-2" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-20 rounded-xl bg-surface-2" />
            <div className="h-8 w-20 rounded-xl bg-surface-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminAccountsPage() {
  return (
    <>
      <PageHeader
        title="Account Reviews"
        subtitle="Approve or reject creator social accounts awaiting verification."
      />
      <Suspense fallback={<AccountsSkeleton />}>
        <AccountsList />
      </Suspense>
    </>
  );
}
