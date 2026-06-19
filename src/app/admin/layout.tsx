import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/Sidebar";
import { AdminTopBar } from "@/components/AdminTopBar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/auth");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id!, read: false },
  });

  return (
    <div className="min-h-screen lg:pl-72">
      <Sidebar user={session.user} variant="admin" unreadCount={unreadCount} />
      <AdminTopBar unreadCount={unreadCount} />
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">{children}</main>
    </div>
  );
}
