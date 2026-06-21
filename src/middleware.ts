import { NextRequest, NextResponse } from "next/server";
import { decode } from "@auth/core/jwt";

async function getToken(req: NextRequest) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;

  // Production HTTPS uses __Secure- prefix; dev doesn't
  const secureCookie = req.cookies.get("__Secure-authjs.session-token");
  const devCookie = req.cookies.get("authjs.session-token");
  const cookie = secureCookie ?? devCookie;
  if (!cookie) return null;

  try {
    return await decode({ token: cookie.value, secret, salt: cookie.name });
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const token = await getToken(req);
  const isLoggedIn = !!(token?.sub ?? (token as Record<string, unknown>)?.id);
  const role = (token as Record<string, unknown>)?.role ?? "CREATOR";
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname === "/auth";
  const isAdminArea = pathname.startsWith("/admin");
  const isProtected =
    isAdminArea ||
    ["/dashboard", "/campaigns", "/earnings", "/social", "/demographics", "/bank", "/referrals"].some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );

  if (pathname === "/" || isAuthPage) {
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
