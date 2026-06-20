import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// Always cache on globalThis — reuses the same connection pool across hot-reloads
// in dev AND across requests in production. Without this, production creates a
// fresh PrismaClient (and a new 15-20s DB connection) on every request.
globalForPrisma.prisma = prisma;
