import "dotenv/config";

export const config = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl:
    process.env.DATABASE_URL ?? "postgres://wallet:wallet@localhost:5432/wallet",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  jwtSecret:
    process.env.JWT_SECRET ??
    "local-development-secret-change-before-production",
  nodeEnv: process.env.NODE_ENV ?? "development",
  corsOrigin: process.env.CORS_ORIGIN ?? "*"
};
