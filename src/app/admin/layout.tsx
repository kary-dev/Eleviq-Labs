import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/Sidebar";
import { AdminTopBar } from "@/components/AdminTopBar";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { cachedUnreadCount } from "@/lib/queries";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/auth");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  // Fire in background — don't block the initial render on a DB round-trip.
  // Cache warms up; the next router.refresh() (SSE) picks up the real count.
  void cachedUnreadCount(session.user.id!)();

  return (
    <div className="min-h-screen lg:pl-72">
      <Sidebar user={session.user} variant="admin" unreadCount={0} />
      <AdminTopBar />
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <RealtimeRefresh />
        {children}
      </main>
    </div>
  );
}
