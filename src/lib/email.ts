import { Resend } from "resend";

const FROM = "Eleviq Labs <onboarding@resend.dev>";

export async function sendAdminEmail({
  subject,
  title,
  body,
  link,
}: {
  subject: string;
  title: string;
  body: string;
  link?: string;
}) {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  if (!process.env.RESEND_API_KEY || !ADMIN_EMAIL) return;
  const resend = new Resend(process.env.RESEND_API_KEY);

  const linkHtml = link
    ? `<p style="margin-top:16px"><a href="https://eleviq-labs.vercel.app${link}" style="background:#e63946;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">View in Admin Panel →</a></p>`
    : "";

  const result = await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <p style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#888;margin-bottom:4px">Eleviq Labs</p>
        <h2 style="font-size:20px;font-weight:700;margin:0 0 8px">${title}</h2>
        <p style="color:#555;font-size:14px;line-height:1.6;margin:0">${body}</p>
        ${linkHtml}
        <p style="margin-top:32px;font-size:12px;color:#aaa">This is an automated notification from Eleviq Labs admin panel.</p>
      </div>
    `,
  });
  if (result.error) {
    console.error("[email] Resend error:", result.error);
  } else {
    console.log("[email] Sent to", ADMIN_EMAIL, "id:", result.data?.id);
  }
}
