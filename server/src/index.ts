import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { initDb, closeDb } from "./db";
import { config } from "./config";
import { logger } from "./logger";
import { createLoginLimiter, createRegisterLimiter } from "./middleware/rateLimit";
import authRoutes from "./routes/auth";
import profileRoutes from "./routes/profile";
import friendsRoutes from "./routes/friends";

export function createApp(dbPath?: string) {
  initDb(dbPath);

  const app = express();

  // Request logging (redact session cookies from logs)
  app.use(pinoHttp({
    logger,
    redact: ["req.headers.cookie", "req.headers['set-cookie']"],
  }));

  // CORS — allow frontend with credentials
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type"],
    })
  );

  app.use(cookieParser());
  app.use(express.json());

  // Health check
  app.get("/v1/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Rate limiting on auth endpoints
  app.use("/v1/auth/login", createLoginLimiter());
  app.use("/v1/auth/register", createRegisterLimiter());

  // Routes
  app.use("/v1/auth", authRoutes);
  app.use("/v1/profile", profileRoutes);
  app.use("/v1/friends", friendsRoutes);

  // 404 catch-all — always return JSON
  app.use((_req, res) => {
    res.status(404).json({ error: true, message: "Not found" });
  });

  // Global error handler — always return JSON
  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      const status = (err as any).status || (err as any).statusCode || 500;
      logger.error({ err }, "Unhandled error");
      res
        .status(status)
        .json({
          error: true,
          message: status < 500 ? err.message : "An unexpected error occurred",
        });
    }
  );

  return app;
}

// Start server when run directly
function startServer() {
  const app = createApp();
  const server = app.listen(config.port, () => {
    logger.info(`Server running on http://localhost:${config.port}`);
  });

  // Graceful shutdown
  const shutdown = (signal: string) => {
    logger.info(`${signal} received - shutting down`);
    server.close(() => {
      closeDb();
      process.exit(0);
    });
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

// Works with both CommonJS (require.main) and direct execution
if (require.main === module) {
  startServer();
}
