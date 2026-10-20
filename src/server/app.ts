import { Hono } from "hono";
import { appLogger } from "./middleware/logger";
import {
  apiRateLimiter,
  authRateLimiter,
  aiChatRateLimiter,
} from "./middleware/rate-limiter";
import { authRoutes } from "./routes/auth.routes";
import { publicRoutes } from "./routes/public.routes";
import { parentRoutes } from "./routes/parent.routes";
import { adminRoutes } from "./routes/admin.routes";

export const apiApp = new Hono()
  .basePath("/api")
  // 1. Request logging for all API calls
  .use("*", appLogger())
  // 2. Global API rate limit (120 req/min per IP, excludes /health)
  .use("*", apiRateLimiter)
  // 3. Stricter rate limit on auth endpoints (15 req/min per IP)
  .use("/auth/*", authRateLimiter)
  // 4. Stricter rate limit on AI chat (20 req/min per IP)
  .use("/chat", aiChatRateLimiter)
  .get("/health", (c) => {
    return c.json({
      status: "ok",
      runtime: "bun-hono",
      timestamp: new Date().toISOString(),
    });
  })
  .route("/auth", authRoutes)
  .route("/admin", adminRoutes)
  .route("/", publicRoutes)
  .route("/", parentRoutes);

export type AppType = typeof apiApp;
