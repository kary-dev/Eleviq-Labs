import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/Sidebar";
import { CreatorTopBar } from "@/components/CreatorTopBar";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { cachedUnreadCount } from "@/lib/queries";

export default async function CreatorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/auth");
  if (session.user.role === "ADMIN") redirect("/admin");

  // Fire in background — don't block the initial render on a DB round-trip.
  // Cache warms up; the next router.refresh() (SSE) picks up the real count.
  void cachedUnreadCount(session.user.id!)();

  return (
    <div className="min-h-screen lg:pl-72">
      <Sidebar user={session.user} variant="creator" unreadCount={0} />
      <CreatorTopBar />
      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
        <RealtimeRefresh />
        {children}
      </main>
    </div>
  );
}
