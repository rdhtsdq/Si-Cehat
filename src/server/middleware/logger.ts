import type { Context, MiddlewareHandler, Next } from "hono";
import { getClientIp } from "./rate-limiter";

/**
 * Colorized and structured request logger middleware for Hono + Bun.
 * Logs method, URL path, HTTP status, execution time in ms, and client IP.
 */
export function appLogger(): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    const start = performance.now();
    const method = c.req.method;
    const path = c.req.path;
    const ip = getClientIp(c);

    await next();

    const elapsed = Math.round(performance.now() - start);
    const status = c.res.status;

    // ANSI Colors for terminal & PM2 logs
    let statusColor = "\x1b[32m"; // Green 2xx
    if (status >= 500) statusColor = "\x1b[31m"; // Red 5xx
    else if (status >= 400) statusColor = "\x1b[33m"; // Yellow 4xx
    else if (status >= 300) statusColor = "\x1b[36m"; // Cyan 3xx

    const resetColor = "\x1b[0m";
    const dimColor = "\x1b[2m";
    const boldColor = "\x1b[1m";

    const timestamp = new Date().toISOString();

    console.log(
      `${dimColor}[${timestamp}]${resetColor} ${boldColor}${method.padEnd(6)}${resetColor} ${path} ${statusColor}${status}${resetColor} ${elapsed}ms ${dimColor}(${ip})${resetColor}`
    );
  };
}
