import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";
import { AccountReviewRow } from "@/components/AccountReviewRow";
import { ShieldIcon } from "@/components/icons";

export const maxDuration = 60;

export default async function AdminAccountsPage() {
  await requireAdmin();

  const pending = await prisma.socialAccount.findMany({
    where: { verificationStatus: "PENDING_REVIEW" },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <PageHeader
        title="Account Reviews"
        subtitle="Approve or reject creator social accounts awaiting verification."
      />

      {pending.length === 0 ? (
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
      )}
    </>
  );
}
