import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

/**
 * In-process Hono API middleware for Vite dev server.
 * Runs both Frontend HMR and Backend API in a single process to minimize RAM usage on 8 GB systems.
 */
function honoDevPlugin(): Plugin {
  return {
    name: "hono-dev-middleware",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith("/api")) {
          return next();
        }

        try {
          const mod = await server.ssrLoadModule("/src/server/app.ts");
          const apiApp = mod.apiApp;

          const protocol = "http";
          const host = req.headers.host || "localhost:3000";
          const url = new URL(req.url, `${protocol}://${host}`);

          const headers = new Headers();
          for (const [key, value] of Object.entries(req.headers)) {
            if (Array.isArray(value)) {
              for (const v of value) headers.append(key, v);
            } else if (typeof value === "string") {
              headers.set(key, value);
            }
          }

          const hasBody = req.method !== "GET" && req.method !== "HEAD";
          const chunks: Buffer[] = [];
          if (hasBody) {
            for await (const chunk of req) {
              chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            }
          }

          const webReq = new Request(url.toString(), {
            method: req.method || "GET",
            headers,
            body: hasBody && chunks.length > 0 ? Buffer.concat(chunks) : undefined,
          });

          const webRes: Response = await apiApp.fetch(webReq);
          res.statusCode = webRes.status;

          webRes.headers.forEach((val, key) => {
            if (key.toLowerCase() === "set-cookie") {
              const cookies = webRes.headers.getSetCookie?.() ?? [val];
              res.setHeader("set-cookie", cookies);
            } else {
              res.setHeader(key, val);
            }
          });

          const arrayBuf = await webRes.arrayBuffer();
          res.end(Buffer.from(arrayBuf));
        } catch (err) {
          console.error("[hono-dev-middleware] Error handling API request:", err);
          res.statusCode = 500;
          res.setHeader("content-type", "application/json");
          res.end(
            JSON.stringify({
              error: { message: "Terjadi kesalahan pada server internal." },
            })
          );
        }
      });
    },
  };
}

const rootDir = import.meta.dirname;

export default defineConfig({
  plugins: [react(), tailwindcss(), honoDevPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
      "next/link": path.resolve(rootDir, "./src/client/compat/next-link.tsx"),
      "next/navigation": path.resolve(rootDir, "./src/client/compat/next-navigation.ts"),
      "next-auth/react": path.resolve(rootDir, "./src/client/compat/next-auth-react.ts"),
    },
  },
  server: {
    port: 3000,
    strictPort: false,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
  },
});
