import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Edge-safe middleware: only reads the JWT session, no DB access.
export default NextAuth(authConfig).auth;

export const config = {
  // Run on everything except static assets & the auth API
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|ico)$).*)"],
};
