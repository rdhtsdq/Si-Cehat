import { Hono } from "hono";
import { authRoutes } from "./routes/auth.routes";
import { publicRoutes } from "./routes/public.routes";
import { parentRoutes } from "./routes/parent.routes";
import { adminRoutes } from "./routes/admin.routes";

export const apiApp = new Hono()
  .basePath("/api")
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
