export { auth as middleware } from "@/auth";

export const config = {
  // Run on everything except static assets & the auth API
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|ico)$).*)"],
};
