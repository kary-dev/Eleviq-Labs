import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

const providers = [];

// Discord OAuth — only enabled when credentials are configured
if (process.env.AUTH_DISCORD_ID && process.env.AUTH_DISCORD_SECRET) {
  providers.push(
    Discord({
      clientId: process.env.AUTH_DISCORD_ID,
      clientSecret: process.env.AUTH_DISCORD_SECRET,
    })
  );
}

// Dev login — lets you sign in as a seeded user without Discord keys.
if (process.env.ENABLE_DEV_LOGIN === "true") {
  providers.push(
    Credentials({
      id: "dev",
      name: "Dev Login",
      credentials: { email: { label: "Email", type: "email" } },
      async authorize(creds) {
        const email = (creds?.email as string)?.toLowerCase().trim();
        if (!email) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      // On sign-in, persist id + role into the token
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: "CREATOR" | "ADMIN" }).role ?? "CREATOR";
      }
      // Refresh role from DB if missing (e.g. OAuth first login)
      if (token.id && !token.role) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.id as string } });
        if (dbUser) token.role = dbUser.role;
      }
      // Promote configured emails to ADMIN. Set ADMIN_EMAILS to a comma-separated
      // list (e.g. "you@gmail.com,team@eleviqlabs.com"). Matches the signed-in email.
      const adminEmails = (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      const email = String(token.email ?? "").toLowerCase();
      if (email && adminEmails.includes(email) && token.role !== "ADMIN") {
        token.role = "ADMIN";
        if (token.id) {
          await prisma.user
            .update({ where: { id: token.id as string }, data: { role: "ADMIN" } })
            .catch(() => {});
        }
      }
      return token;
    },
    // `session` callback is inherited from authConfig (edge-safe, shared with middleware)
  },
});
