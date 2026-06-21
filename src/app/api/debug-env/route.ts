import { auth } from "@/auth";
import { decode } from "@auth/core/jwt";
import { cookies } from "next/headers";

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

  // Check which cookies are present
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll().map((c) => c.name);
  const secureName = "__Secure-authjs.session-token";
  const devName = "authjs.session-token";
  const sessionCookie = cookieStore.get(secureName) ?? cookieStore.get(devName);

  // Try to decode the JWT manually
  let decodeResult: Record<string, unknown> = {};
  try {
    if (sessionCookie && process.env.AUTH_SECRET) {
      const token = await decode({
        token: sessionCookie.value,
        secret: process.env.AUTH_SECRET,
        salt: sessionCookie.name,
      });
      decodeResult = {
        decodeOk: !!token,
        tokenId: String((token as Record<string, unknown>)?.id ?? "").slice(0, 8) || null,
        tokenRole: (token as Record<string, unknown>)?.role ?? null,
        tokenSub: !!(token as Record<string, unknown>)?.sub,
      };
    } else {
      decodeResult = { decodeOk: false, reason: sessionCookie ? "no AUTH_SECRET" : "no session cookie" };
    }
  } catch (e) {
    decodeResult = { decodeOk: false, error: String(e) };
  }

  return Response.json({
    hasAuthSecret: !!process.env.AUTH_SECRET,
    secretFirst4: process.env.AUTH_SECRET?.slice(0, 4) ?? "none",
    cookieNames: allCookies.filter((n) => n.includes("authjs")),
    sessionCookieName: sessionCookie?.name ?? null,
    ...sessionInfo,
    decode: decodeResult,
  });
}
