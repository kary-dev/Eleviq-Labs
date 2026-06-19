import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatusPill } from "@/components/ui";
import { money, compact, date } from "@/lib/format";
import { ArrowLeftIcon } from "@/components/icons";
import { BlockCreatorButton } from "@/components/BlockCreatorButton";

export default async function AdminCreatorProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const creator = await prisma.user.findUnique({
    where: { id },
    include: {
      socialAccounts: { select: { id: true, platform: true, handle: true, verificationStatus: true, followers: true } },
      submissions: {
        include: { campaign: { select: { title: true, brand: true } } },
        orderBy: { createdAt: "desc" },
      },
      demographicProofs: { orderBy: { createdAt: "desc" }, select: { id: true, status: true, method: true, createdAt: true } },
      payoutRequests: { orderBy: { createdAt: "desc" } },
      bankAccount: true,
    },
  });

  if (!creator || creator.role !== "CREATOR") notFound();

  const approved = creator.submissions.filter((s) => s.status === "APPROVED");
  const totalViews = creator.submissions.reduce((a, s) => a + s.views, 0);
  const totalEarned = approved.reduce((a, s) => a + s.payout, 0);

  return (
    <>
      <Link href="/admin/creators" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowLeftIcon className="h-4 w-4" /> Back to creators
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {creator.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={creator.image} alt="" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <div className="grid h-14 w-14 place-items-center rounded-full bg-accent/15 text-xl font-bold text-accent">
              {(creator.name ?? "C").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold">{creator.name ?? "Creator"}</h1>
              <span className={`pill text-xs ${creator.tier === "GOLD" ? "bg-yellow-500/15 text-yellow-400" : creator.tier === "SILVER" ? "bg-slate-400/15 text-slate-400" : "bg-orange-500/15 text-orange-400"}`}>
                {creator.tier}
              </span>
              {creator.banned && <span className="pill bg-rose-500/15 text-rose-400">BANNED</span>}
            </div>
            <p className="text-sm text-muted">{creator.email}</p>
            <p className="text-xs text-muted">Joined {date(creator.createdAt)}</p>
          </div>
        </div>
        <BlockCreatorButton userId={creator.id} banned={creator.banned} />
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total clips", value: creator.submissions.length },
          { label: "Approved", value: approved.length },
          { label: "Total views", value: compact(totalViews) },
          { label: "Total earned", value: money(totalEarned) },
        ].map(({ label, value }) => (
          <div key={label} className="card p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
            <p className="mt-1 font-display text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Social accounts */}
        <section>
          <h2 className="mb-3 font-display text-base font-semibold">Social Accounts</h2>
          {creator.socialAccounts.length === 0 ? (
            <p className="text-sm text-muted">No accounts.</p>
          ) : (
            <div className="card divide-y divide-border">
              {creator.socialAccounts.map((a) => (
                <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">@{a.handle}</p>
                    <p className="text-xs text-muted">{a.platform} · {a.followers?.toLocaleString() ?? "—"} followers</p>
                  </div>
                  <StatusPill status={a.verificationStatus === "PENDING_REVIEW" ? "PENDING" : a.verificationStatus} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Demographics */}
        <section>
          <h2 className="mb-3 font-display text-base font-semibold">Demographic Proofs</h2>
          {creator.demographicProofs.length === 0 ? (
            <p className="text-sm text-muted">No proofs.</p>
          ) : (
            <div className="card divide-y divide-border">
              {creator.demographicProofs.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{p.method === "no_demographics" ? "No demographics" : "Demographic proof"}</p>
                    <p className="text-xs text-muted">{date(p.createdAt)}</p>
                  </div>
                  <StatusPill status={p.status} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Submissions */}
      <section className="mt-8">
        <h2 className="mb-3 font-display text-base font-semibold">All Clips</h2>
        {creator.submissions.length === 0 ? (
          <p className="text-sm text-muted">No clips.</p>
        ) : (
          <div className="card divide-y divide-border">
            {creator.submissions.map((s) => (
              <div key={s.id} className="flex items-center gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <a href={s.url} target="_blank" rel="noreferrer" className="block truncate text-sm font-semibold hover:text-accent">
                    {s.title || s.url}
                  </a>
                  <p className="truncate text-xs text-muted">{s.campaign.brand} · {s.campaign.title} · {date(s.createdAt)}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold">{compact(s.views)}</span>
                <span className="shrink-0 text-sm font-semibold text-accent">{money(s.payout)}</span>
                <StatusPill status={s.status} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bank */}
      {creator.bankAccount && (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-base font-semibold">Bank Details</h2>
          <div className="card p-4 text-sm space-y-1">
            <p><span className="text-muted">Name:</span> {creator.bankAccount.accountHolder}</p>
            {creator.bankAccount.paypalEmail ? (
              <p><span className="text-muted">PayPal:</span> {creator.bankAccount.paypalEmail}</p>
            ) : creator.bankAccount.upiId ? (
              <p><span className="text-muted">UPI:</span> <span className="font-mono">{creator.bankAccount.upiId}</span></p>
            ) : (
              <>
                {creator.bankAccount.accountNumber && <p><span className="text-muted">Account:</span> <span className="font-mono">{creator.bankAccount.accountNumber}</span></p>}
                {creator.bankAccount.routingNumber && <p><span className="text-muted">IFSC / Branch:</span> <span className="font-mono">{creator.bankAccount.routingNumber}</span></p>}
                <p><span className="text-muted">Bank:</span> {creator.bankAccount.bankName ?? "—"}</p>
              </>
            )}
          </div>
        </section>
      )}
    </>
  );
}
