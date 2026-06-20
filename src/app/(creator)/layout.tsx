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

  const unreadCount = await cachedUnreadCount(session.user.id!)();

  return (
    <div className="min-h-screen lg:pl-72">
      <Sidebar user={session.user} variant="creator" unreadCount={unreadCount} />
      <CreatorTopBar unreadCount={unreadCount} />
      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
        <RealtimeRefresh />
        {children}
      </main>
    </div>
  );
}
