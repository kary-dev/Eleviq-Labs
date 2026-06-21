import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/Sidebar";
import { CreatorTopBar } from "@/components/CreatorTopBar";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { UnreadBadge } from "@/components/UnreadBadge";

export default async function CreatorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/auth");
  if (session.user.role === "ADMIN") redirect("/admin");

  const badge = <UnreadBadge userId={session.user.id!} />;

  return (
    <div className="min-h-screen lg:pl-72">
      <Sidebar user={session.user} variant="creator" badge={badge} />
      <CreatorTopBar badge={badge} />
      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
        <RealtimeRefresh />
        {children}
      </main>
    </div>
  );
}
