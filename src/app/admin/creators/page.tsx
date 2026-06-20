import { Suspense } from "react";
import Link from "next/link";
import { PageHeader, EmptyState } from "@/components/ui";
import { money, compact, date } from "@/lib/format";
import { UsersIcon } from "@/components/icons";
import { CreatorSearchInput } from "@/components/CreatorSearchInput";
import { getAdminCreators } from "@/lib/queries";

async function CreatorsList({ q }: { q?: string }) {
  const creators = await getAdminCreators(q);

  return creators.length === 0 ? (
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
            <Link
              key={c.id}
              href={`/admin/creators/${c.id}`}
              className="flex items-center gap-3 px-5 py-4 transition hover:bg-surface-2/50 sm:grid sm:grid-cols-12"
            >
              {c.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.image} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover sm:hidden" />
              ) : (
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent/15 text-sm font-bold text-accent sm:hidden">
                  {(c.name ?? "E").slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="hidden sm:col-span-4 sm:flex sm:items-center sm:gap-3">
                {c.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image} alt="" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-accent/15 text-sm font-bold text-accent">
                    {(c.name ?? "E").slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {c.name ?? "Creator"}
                    {c.banned && <span className="ml-1.5 text-xs text-rose-400">Banned</span>}
                  </p>
                  <p className="truncate text-xs text-muted">{c.email}</p>
                </div>
              </div>
              <div className="min-w-0 flex-1 sm:hidden">
                <p className="truncate text-sm font-semibold">
                  {c.name ?? "Creator"}
                  {c.banned && <span className="ml-1.5 text-xs text-rose-400">Banned</span>}
                </p>
                <p className="truncate text-xs text-muted">{c.submissions.length} clips · {compact(views)} views</p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-accent sm:hidden">{money(earned)}</p>
              <div className="hidden text-center text-sm sm:col-span-2 sm:block">
                <span className="font-semibold">{c.submissions.length}</span>
                {pending > 0 && <span className="ml-1 text-xs text-amber-400">({pending})</span>}
              </div>
              <div className="hidden text-center text-sm font-semibold sm:col-span-2 sm:block">{compact(views)}</div>
              <div className="hidden text-center text-sm font-semibold text-accent sm:col-span-2 sm:block">{money(earned)}</div>
              <div className="hidden text-right text-xs text-muted sm:col-span-2 sm:block">{date(c.createdAt)}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function CreatorsListSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="divide-y divide-border">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-4">
            <div className="h-9 w-9 shrink-0 rounded-full bg-surface-2" />
            <div className="flex-1">
              <div className="mb-1.5 h-4 w-40 rounded bg-surface-2" />
              <div className="h-3 w-28 rounded bg-surface-2" />
            </div>
            <div className="h-4 w-16 rounded bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function AdminCreators({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  return (
    <>
      <PageHeader
        title="Creators"
        subtitle={q ? `Results for "${q}"` : "All creators on Eleviq Labs."}
        action={
          <a href="/api/admin/export?type=creators" className="btn-ghost text-sm">
            Export CSV
          </a>
        }
      />
      <div className="mb-4">
        <CreatorSearchInput />
      </div>
      <Suspense key={q ?? ""} fallback={<CreatorsListSkeleton />}>
        <CreatorsList q={q} />
      </Suspense>
    </>
  );
}
