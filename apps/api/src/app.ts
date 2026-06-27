import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";
import { config } from "./config.js";
import { errorHandler, notFound } from "./middleware/error-handler.js";
import { authRoutes } from "./routes/auth.routes.js";
import { healthRoutes } from "./routes/health.routes.js";
import { transactionRoutes } from "./routes/transaction.routes.js";
import { transferRoutes } from "./routes/transfer.routes.js";
import { walletRoutes } from "./routes/wallet.routes.js";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const openApiPath = path.resolve(dirname, "../../../openapi.yaml");
const openApiDocument = YAML.parse(readFileSync(openApiPath, "utf8"));

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(
    helmet({
      contentSecurityPolicy: false
    })
  );
  app.use(cors({ origin: config.corsOrigin === "*" ? true : config.corsOrigin }));
  app.use(express.json({ limit: "1mb" }));
  app.use(
    pinoHttp({
      transport:
        config.nodeEnv === "development"
          ? {
              target: "pino-pretty",
              options: { colorize: true, singleLine: true }
            }
          : undefined
    })
  );
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 180,
      standardHeaders: "draft-8",
      legacyHeaders: false
    })
  );

  app.get("/", (_req, res) => {
    res.json({
      name: "Paytm Wallet P2P API",
      docs: "/api/docs",
      health: "/api/health"
    });
  });

  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
  app.get("/api/openapi.yaml", (_req, res) => {
    res.type("yaml").send(readFileSync(openApiPath, "utf8"));
  });
  app.use("/api/health", healthRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/wallet", walletRoutes);
  app.use("/api/transfer", transferRoutes);
  app.use("/api/transactions", transactionRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
