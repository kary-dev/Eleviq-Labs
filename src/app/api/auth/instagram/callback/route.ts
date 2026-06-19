import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { exchangeCodeForToken, getInstagramAccountId } from "@/lib/instagram-graph";

const BASE = process.env.NEXTAUTH_URL!;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${BASE}/dashboard?ig_error=denied`);
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(`${BASE}/auth`);
  }

  const tokens = await exchangeCodeForToken(code);
  if (!tokens) {
    return NextResponse.redirect(`${BASE}/dashboard?ig_error=token`);
  }

  const igInfo = await getInstagramAccountId(tokens.accessToken);
  if (!igInfo) {
    return NextResponse.redirect(`${BASE}/dashboard?ig_error=no_ig_account`);
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      metaAccessToken: igInfo.pageAccessToken,
      metaIgAccountId: igInfo.igAccountId,
    },
  });

  return NextResponse.redirect(`${BASE}/dashboard?ig_connected=1`);
}
