import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

const pool = globalForPrisma.pool ?? new Pool({
  connectionString: databaseUrl,
  max: 10,                      // CONTEXT.md 결정: 최대 10개 연결
  idleTimeoutMillis: 30000,    // 30초 후 유휴 연결 종료
  connectionTimeoutMillis: 2000, // 2초 대기 후 타임아웃
});
const adapter = new PrismaPg(pool);

export const db = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "development"
    ? ['query', 'error', 'warn']  // 개발 환경: 모든 로그
    : ['error'],                   // 프로덕션: 에러만
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
  globalForPrisma.pool = pool;
}

// Export pool for health check monitoring
export { pool };
