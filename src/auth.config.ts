import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe base config shared by middleware and the full server-side auth.
 * No database/adapter imports here so it can run in the edge runtime.
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth",
  },
  providers: [], // real providers are added in src/auth.ts (Node runtime)
  callbacks: {
    /**
     * Maps the JWT (id + role, baked in at sign-in) onto the session.
     * Lives here so BOTH middleware (edge) and server-side auth expose the role.
     * No DB access — edge-safe.
     */
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? session.user.id;
        session.user.role = (token.role as "CREATOR" | "ADMIN") ?? "CREATOR";
      }
      return session;
    },
    /**
     * Gatekeeps routes. Runs in middleware.
     * - /admin requires ADMIN role
     * - /dashboard, /campaigns, etc. require any logged-in user
     */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;
      const { pathname } = nextUrl;

      const isAuthPage = pathname === "/auth";
      const isAdminArea = pathname.startsWith("/admin");
      const isProtected =
        isAdminArea ||
        ["/dashboard", "/campaigns", "/earnings", "/social", "/demographics", "/bank", "/referrals"].some(
          (p) => pathname === p || pathname.startsWith(p + "/")
        );

      if (isAuthPage) {
        if (isLoggedIn) {
          const dest = role === "ADMIN" ? "/admin" : "/dashboard";
          return Response.redirect(new URL(dest, nextUrl));
        }
        return true;
      }

      if (isAdminArea) {
        if (!isLoggedIn) return false;
        if (role !== "ADMIN") return Response.redirect(new URL("/dashboard", nextUrl));
        return true;
      }

      if (isProtected) return isLoggedIn;

      return true;
    },
  },
} satisfies NextAuthConfig;
