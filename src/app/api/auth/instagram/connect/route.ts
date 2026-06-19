import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/auth", process.env.NEXTAUTH_URL!));
  }

  const params = new URLSearchParams({
    client_id: process.env.INSTAGRAM_APP_ID!,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/instagram/callback`,
    scope: [
      "instagram_basic",
      "instagram_manage_insights",
      "pages_show_list",
      "pages_read_engagement",
      "business_management",
    ].join(","),
    response_type: "code",
    state: session.user.id, // userId as state — verified in callback via session
  });

  return NextResponse.redirect(
    `https://www.facebook.com/dialog/oauth?${params.toString()}`
  );
}
