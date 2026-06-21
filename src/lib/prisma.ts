import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Small pool (3 conns) = fast cold start + low memory on Hostinger.
// connect_timeout=10 + pool_timeout=10 makes failures fast (fail in 10s,
// not 60s) so a bad connection doesn't block the entire page for a minute.
function buildDatabaseUrl() {
  const base = process.env.DATABASE_URL ?? "";
  if (!base) return base;
  const sep = base.includes("?") ? "&" : "?";
  // Only add params if not already present
  const hasLimit = base.includes("connection_limit");
  const hasConnect = base.includes("connect_timeout");
  const params = [
    !hasLimit && "connection_limit=3",
    !hasConnect && "connect_timeout=10&pool_timeout=10",
  ]
    .filter(Boolean)
    .join("&");
  return params ? `${base}${sep}${params}` : base;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: { db: { url: buildDatabaseUrl() } },
  });

// Always cache on globalThis — reuses the same connection pool across hot-reloads
// in dev AND across requests in production. Without this, production creates a
// fresh PrismaClient (and a new 15-20s DB connection) on every request.
globalForPrisma.prisma = prisma;
