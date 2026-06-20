import { prisma } from "@/lib/prisma";
import { sendAdminEmail } from "@/lib/email";
import { publish } from "@/lib/sse-bus";

export async function notifyAdmins(
  type: string,
  title: string,
  body: string,
  link?: string
) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  if (admins.length === 0) return;
  await prisma.notification.createMany({
    data: admins.map((a) => ({ userId: a.id, type, title, body, link: link ?? null })),
  });
  for (const admin of admins) publish(admin.id);
  await sendAdminEmail({ subject: title, title, body, link }).catch((e) => console.error("[email] send failed:", e));
}
