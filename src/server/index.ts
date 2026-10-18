import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { apiApp } from "./app";
import { getServerEnv } from "./env";

const env = getServerEnv();
const app = new Hono();

// Mount all /api/* routes
app.route("/", apiApp);

// Serve static assets from Vite build output (./dist)
app.use("/*", serveStatic({ root: "./dist" }));

// SPA fallback to index.html for client-side routes
app.get("*", serveStatic({ path: "./dist/index.html" }));

console.log(`[Si-Cehat] Hono + Bun server listening on http://localhost:${env.PORT}`);

export default {
  port: env.PORT,
  fetch: app.fetch,
};
