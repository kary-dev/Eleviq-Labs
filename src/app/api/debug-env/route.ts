import { auth } from "@/auth";

export async function GET() {
  let sessionInfo: Record<string, unknown> = { error: null };
  try {
    const session = await auth();
    sessionInfo = {
      hasSession: !!session,
      hasUser: !!session?.user,
      role: session?.user?.role ?? null,
      userId: (session?.user?.id ?? "").slice(0, 8) || null,
    };
  } catch (e) {
    sessionInfo = { error: String(e) };
  }

  return Response.json({
    hasAuthSecret: !!process.env.AUTH_SECRET,
    secretLength: process.env.AUTH_SECRET?.length ?? 0,
    secretFirst4: process.env.AUTH_SECRET?.slice(0, 4) ?? "none",
    ...sessionInfo,
  });
}
