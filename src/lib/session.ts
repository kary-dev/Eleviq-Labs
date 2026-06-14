import { redirect } from "next/navigation";
import { auth } from "@/auth";

/** Returns the current session user or redirects to /auth. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/auth");
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}
