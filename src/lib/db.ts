import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

// Lazy initialization to avoid issues during build time
function getPool(): Pool {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return globalForPrisma.pool ?? new Pool({
    connectionString: databaseUrl,
    max: 10,                      // CONTEXT.md 결정: 최대 10개 연결
    idleTimeoutMillis: 30000,    // 30초 후 유휴 연결 종료
    connectionTimeoutMillis: 2000, // 2초 대기 후 타임아웃
  });
}

function getPrismaClient(): PrismaClient {
  if (!databaseUrl) {
    // Return a dummy client during build if DATABASE_URL is not set
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return new PrismaClient({
        log: ['error'],
      });
    }
    throw new Error("DATABASE_URL environment variable is not set");
  }
  
  const pool = getPool();
  const adapter = new PrismaPg(pool);
  
  return globalForPrisma.prisma ?? new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development"
      ? ['query', 'error', 'warn']  // 개발 환경: 모든 로그
      : ['error'],                   // 프로덕션: 에러만
  });
}

export const db = getPrismaClient();

// Store in global for hot reload during development
if (process.env.NODE_ENV !== "production" && databaseUrl) {
  globalForPrisma.prisma = db;
}
