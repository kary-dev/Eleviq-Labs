import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/Sidebar";
import { AdminTopBar } from "@/components/AdminTopBar";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { UnreadBadge } from "@/components/UnreadBadge";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/auth");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const badge = <UnreadBadge userId={session.user.id!} />;

  return (
    <div className="min-h-screen lg:pl-72">
      <Sidebar user={session.user} variant="admin" badge={badge} />
      <AdminTopBar badge={badge} />
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <RealtimeRefresh />
        {children}
      </main>
    </div>
  );
}
