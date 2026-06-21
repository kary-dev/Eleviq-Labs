import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Pool tuned for Hostinger shared hosting with 2 PM2 workers.
// connection_limit=10 per worker (20 total) handles ~8 parallel Suspense
// queries per page without pool exhaustion.
// pool_timeout=30 gives enough headroom on cold start.
// connect_timeout=10 keeps initial connection failures fast.
function buildDatabaseUrl() {
  const base = process.env.DATABASE_URL ?? "";
  if (!base) return base;
  const sep = base.includes("?") ? "&" : "?";
  const hasLimit = base.includes("connection_limit");
  const hasConnect = base.includes("connect_timeout");
  const params = [
    !hasLimit && "connection_limit=10",
    !hasConnect && "connect_timeout=10&pool_timeout=30",
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
