import { NextRequest, NextResponse } from "next/server";
import { jwtDecrypt } from "jose";
import { hkdf } from "@panva/hkdf";

async function decodeSessionCookie(cookieValue: string, secret: string, cookieName: string) {
  // Derive the encryption key exactly as @auth/core does:
  // hkdf(sha256, secret, salt=cookieName, info="Auth.js Generated Encryption Key (cookieName)", 64)
  const key = await hkdf(
    "sha256",
    secret,
    cookieName,
    `Auth.js Generated Encryption Key (${cookieName})`,
    64
  );
  const { payload } = await jwtDecrypt(cookieValue, key, { clockTolerance: 15 });
  return payload;
}

async function getToken(req: NextRequest) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;

  const secureName = "__Secure-authjs.session-token";
  const devName = "authjs.session-token";
  const cookie = req.cookies.get(secureName) ?? req.cookies.get(devName);
  if (!cookie) return null;

  try {
    return await decodeSessionCookie(cookie.value, secret, cookie.name);
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const { pathname } = req.nextUrl;

  // app.eleviqlabs.com OR localhost/dev → full app
  const isAppDomain =
    host.startsWith("app.") ||
    host.includes("localhost") ||
    host.includes("127.0.0.1");

  // ── eleviqlabs.com — landing page only ──
  if (!isAppDomain) {
    const PUBLIC = ["/", "/brands", "/privacy"];
    const isPublic = PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/"));
    if (!isPublic) {
      return NextResponse.redirect(`https://app.eleviqlabs.com${pathname}`);
    }
    return NextResponse.next();
  }

  // ── app.eleviqlabs.com — full auth logic ──
  const token = await getToken(req);
  const isLoggedIn = !!(token?.sub || (token as Record<string, unknown>)?.id);
  const role = (token as Record<string, unknown>)?.role ?? "CREATOR";

  if (pathname === "/__mw_test") {
    return new Response(
      JSON.stringify({ mwVersion: "v7", host, isAppDomain, isLoggedIn, role }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  const isAuthPage = pathname === "/auth";
  const isAdminArea = pathname.startsWith("/admin");
  const isProtected =
    isAdminArea ||
    ["/dashboard", "/campaigns", "/earnings", "/social", "/demographics", "/bank", "/referrals"].some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );

  if (pathname === "/") {
    const dest = isLoggedIn ? (role === "ADMIN" ? "/admin" : "/dashboard") : "/auth";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  if (isAuthPage) {
    if (isLoggedIn) {
      const dest = role === "ADMIN" ? "/admin" : "/dashboard";
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  if (isAdminArea) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/auth", req.url));
    if (role !== "ADMIN") return NextResponse.redirect(new URL("/dashboard", req.url));
    return NextResponse.next();
  }

  if (isProtected) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/auth", req.url));
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|ico)$).*)"],
};
