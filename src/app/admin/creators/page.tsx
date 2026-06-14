import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";
import { money, compact, date } from "@/lib/format";
import { UsersIcon } from "@/components/icons";

export default async function AdminCreators() {
  const creators = await prisma.user.findMany({
    where: { role: "CREATOR" },
    include: {
      submissions: { select: { status: true, views: true, payout: true } },
      socialAccounts: { select: { id: true } },
      _count: { select: { participations: true, referrals: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader title="Creators" subtitle={`${creators.length} registered creators on Eleviq Labs.`} />

      {creators.length === 0 ? (
        <EmptyState icon={<UsersIcon className="h-7 w-7" />} title="No creators yet" />
      ) : (
        <div className="card overflow-hidden">
          <div className="hidden grid-cols-12 gap-3 border-b border-border px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted sm:grid">
            <div className="col-span-4">Creator</div>
            <div className="col-span-2 text-center">Clips</div>
            <div className="col-span-2 text-center">Views</div>
            <div className="col-span-2 text-center">Earned</div>
            <div className="col-span-2 text-right">Joined</div>
          </div>
          <div className="divide-y divide-border">
            {creators.map((c) => {
              const approved = c.submissions.filter((s) => s.status === "APPROVED");
              const views = c.submissions.reduce((a, s) => a + s.views, 0);
              const earned = approved.reduce((a, s) => a + s.payout, 0);
              const pending = c.submissions.filter((s) => s.status === "PENDING").length;
              return (
                <div key={c.id} className="grid grid-cols-2 items-center gap-3 px-5 py-4 sm:grid-cols-12">
                  <div className="col-span-2 flex items-center gap-3 sm:col-span-4">
                    {c.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.image} alt="" className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-accent/15 text-sm font-bold text-accent">
                        {(c.name ?? "E").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{c.name ?? "Creator"}</p>
                      <p className="truncate text-xs text-muted">{c.email}</p>
                    </div>
                  </div>
                  <div className="text-center text-sm sm:col-span-2">
                    <span className="font-semibold">{c.submissions.length}</span>
                    {pending > 0 && <span className="ml-1 text-xs text-amber-400">({pending} pending)</span>}
                  </div>
                  <div className="hidden text-center text-sm font-semibold sm:col-span-2 sm:block">{compact(views)}</div>
                  <div className="text-right text-sm font-semibold text-accent sm:col-span-2 sm:text-center">{money(earned)}</div>
                  <div className="hidden text-right text-xs text-muted sm:col-span-2 sm:block">{date(c.createdAt)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
