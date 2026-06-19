import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { PageHeader, EmptyState, StatusPill } from "@/components/ui";
import { PayoutRequestRow } from "@/components/PayoutRequestRow";
import { WalletIcon } from "@/components/icons";
import { money, date } from "@/lib/format";

export default async function AdminPayoutsPage() {
  await requireAdmin();

  const requests = await prisma.payoutRequest.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
          bankAccount: {
            select: {
              accountHolder: true,
              accountNumber: true,
              routingNumber: true,
              bankName: true,
              paypalEmail: true,
              upiId: true,
              country: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const pending = requests.filter((r) => r.status === "PENDING" || r.status === "APPROVED");
  const processed = requests.filter((r) => r.status === "PAID" || r.status === "REJECTED");

  return (
    <>
      <PageHeader title="Payout Requests" subtitle={`${pending.length} pending withdrawal requests.`} />

      <div className="mb-6 rounded-xl border border-border bg-surface-2/50 px-5 py-4 text-sm">
        <p className="mb-2 font-semibold">Payment flow</p>
        <ol className="space-y-1 text-muted list-decimal list-inside">
          <li>Click <strong className="text-fg">Approve</strong> → request status flips to APPROVED</li>
          <li>Copy the bank / PayPal details shown on the row</li>
          <li>Send money manually via your bank or PayPal</li>
          <li>Come back → click <strong className="text-fg">Mark as Paid</strong> → creator gets notified</li>
        </ol>
      </div>

      {requests.length === 0 ? (
        <EmptyState icon={<WalletIcon className="h-7 w-7" />} title="No payout requests yet" />
      ) : (
        <div className="space-y-8">
          {pending.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-base font-semibold">Pending</h2>
              <div className="space-y-3">
                {pending.map((r) => (
                  <PayoutRequestRow key={r.id} request={r} />
                ))}
              </div>
            </section>
          )}

          {processed.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-base font-semibold">Processed</h2>
              <div className="card divide-y divide-border">
                {processed.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{r.user.name ?? r.user.email}</p>
                      <p className="truncate text-xs text-muted">{date(r.createdAt)}{r.adminNote ? ` · ${r.adminNote}` : ""}</p>
                    </div>
                    <div className="ml-auto flex shrink-0 items-center gap-2">
                      <span className="font-display font-bold text-accent">{money(r.amount)}</span>
                      <StatusPill status={r.status} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}
