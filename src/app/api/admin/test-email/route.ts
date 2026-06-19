import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { sendAdminEmail } from "@/lib/email";

export async function POST() {
  await requireAdmin();
  try {
    await sendAdminEmail({
      subject: "Test email from Eleviq Labs",
      title: "Test notification",
      body: "If you see this, email notifications are working correctly.",
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[test-email]", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
