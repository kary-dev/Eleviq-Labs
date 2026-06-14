"use server";

import { prisma } from "@/lib/prisma";
import { instagram, normalizeHandle } from "@/lib/instagram";
import { hashPassword, generatePassword } from "@/lib/password";

const EMAIL_DOMAIN = "creators.eleviqlabs.com";

export type CreateLoginResult =
  | { ok: true; email: string; password: string; username: string }
  | { ok: false; message: string; alreadyRegistered?: boolean };

/**
 * Instant Instagram sign-up. Fetches the profile by username, validates it
 * (exists, public, professional, not already registered), then generates
 * login credentials and creates the account. The Instagram account is created
 * unverified — the creator finishes ownership verification (bio code) after
 * signing in, before they can submit clips.
 */
export async function createInstagramLogin(formData: FormData): Promise<CreateLoginResult> {
  const handle = normalizeHandle(String(formData.get("handle") ?? ""));
  if (!handle) return { ok: false, message: "Enter your Instagram username." };

  const profile = await instagram().getProfile(handle);
  if (!profile) return { ok: false, message: "We couldn't find that Instagram account." };
  if (profile.isPrivate) return { ok: false, message: "Make your account public so we can verify it." };
  if (!profile.isProfessional) {
    return { ok: false, message: "Switch to a Professional (Business or Creator) account on Instagram, then try again." };
  }

  const email = `${handle}@${EMAIL_DOMAIN}`;

  // Already registered?
  const existing = await prisma.user.findFirst({
    where: { OR: [{ username: handle }, { email }] },
    select: { id: true },
  });
  if (existing) {
    return { ok: false, alreadyRegistered: true, message: "This account is already registered. Sign in with your email and password instead." };
  }

  const password = generatePassword();

  await prisma.user.create({
    data: {
      name: profile.fullName ?? handle,
      email,
      image: profile.avatarUrl,
      username: handle,
      passwordHash: hashPassword(password),
      role: "CREATOR",
      socialAccounts: {
        create: {
          platform: "INSTAGRAM",
          handle,
          method: "link",
          verified: false,
          url: `https://instagram.com/${handle}`,
          avatarUrl: profile.avatarUrl,
          followers: profile.followers,
          isProfessional: profile.isProfessional,
          igUserId: profile.userId,
        },
      },
    },
  });

  return { ok: true, email, password, username: handle };
}
