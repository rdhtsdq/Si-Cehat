import type { Context, MiddlewareHandler, Next } from "hono";

export interface RateLimiterOptions {
  /**
   * Time window in milliseconds. Default: 60,000 (1 minute).
   */
  windowMs?: number;
  /**
   * Maximum number of requests allowed within the window. Default: 100.
   */
  max?: number;
  /**
   * Custom message returned when rate limit is exceeded.
   */
  message?: string;
  /**
   * Function to extract client identifier (usually IP).
   */
  keyGenerator?: (c: Context) => string;
  /**
   * Function to determine if request should skip rate limiting.
   */
  skip?: (c: Context) => boolean;
}

interface ClientRecord {
  count: number;
  resetTime: number;
}

export function getClientIp(c: Context): string {
  // Check common reverse proxy headers
  const cfConnectingIp = c.req.header("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  const xForwardedFor = c.req.header("x-forwarded-for");
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  const xRealIp = c.req.header("x-real-ip");
  if (xRealIp) return xRealIp.trim();

  // Fallback
  return "127.0.0.1";
}

/**
 * In-memory sliding window rate limiter middleware for Hono.
 * Lightweight, zero external dependencies, memory-safe with automatic cleanup.
 */
export function rateLimiter(options: RateLimiterOptions = {}): MiddlewareHandler {
  const windowMs = options.windowMs ?? 60_000;
  const max = options.max ?? 100;
  const message =
    options.message ??
    "Terlalu banyak permintaan. Silakan tunggu beberapa saat lagi.";
  const keyGenerator = options.keyGenerator ?? getClientIp;
  const skip = options.skip ?? (() => false);

  const clients = new Map<string, ClientRecord>();

  // Cleanup expired entries periodically (every 2 minutes) to prevent memory leak
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of clients.entries()) {
      if (now > record.resetTime) {
        clients.delete(key);
      }
    }
  }, 120_000);

  if (cleanupInterval && typeof cleanupInterval.unref === "function") {
    cleanupInterval.unref();
  }

  return async (c: Context, next: Next) => {
    if (skip(c)) {
      return await next();
    }

    const key = keyGenerator(c);
    const now = Date.now();
    let record = clients.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      clients.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    // Standard RFC RateLimit headers
    c.header("RateLimit-Limit", max.toString());
    c.header("RateLimit-Remaining", remaining.toString());
    c.header("RateLimit-Reset", resetSeconds.toString());

    if (record.count > max) {
      c.header("Retry-After", resetSeconds.toString());
      return c.json(
        {
          error: {
            message,
            code: "RATE_LIMIT_EXCEEDED",
            retryAfterSeconds: resetSeconds,
          },
        },
        429
      );
    }

    return await next();
  };
}

/**
 * Pre-configured rate limiters for common endpoints:
 */
// 1. General API: 120 requests per minute per IP (excludes /health)
export const apiRateLimiter = rateLimiter({
  windowMs: 60_000,
  max: 120,
  message: "Terlalu banyak permintaan ke API. Silakan coba lagi sebentar lagi.",
  skip: (c) => c.req.path === "/api/health" || c.req.path === "/health",
});

// 2. Auth routes: 15 attempts per minute per IP (brute force protection)
export const authRateLimiter = rateLimiter({
  windowMs: 60_000,
  max: 15,
  message: "Terlalu banyak percobaan login/register. Silakan tunggu 1 menit.",
});

// 3. AI Chat: 20 messages per minute per IP (protect OpenAI quota)
export const aiChatRateLimiter = rateLimiter({
  windowMs: 60_000,
  max: 20,
  message: "Kamu bertanya terlalu cepat! Tunggu sebentar ya sebelum mengirim pesan lagi.",
});
