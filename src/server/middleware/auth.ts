import type { Context } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { sign, verify } from "hono/jwt";
import { eq, or } from "drizzle-orm";
import { drizzleDb } from "../db";
import { guardians } from "../db/schema";
import { getServerEnv } from "../env";

export const SESSION_COOKIE_NAME = "sicehat_session";

export interface SessionUser {
  id: string;
  email: string;
  role: string;
  name?: string | null;
}

export interface SessionPayload {
  user: SessionUser;
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  const env = getServerEnv();
  const now = Math.floor(Date.now() / 1000);
  return await sign(
    {
      sub: user.id,
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name ?? null,
      iat: now,
      exp: now + 60 * 60 * 24 * 7, // 7 days
    },
    env.AUTH_SECRET,
    "HS256"
  );
}

export function setSessionCookie(c: Context, token: string): void {
  const env = getServerEnv();
  setCookie(c, SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    secure: env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSessionCookie(c: Context): void {
  deleteCookie(c, SESSION_COOKIE_NAME, {
    path: "/",
  });
}

export async function getSession(c: Context): Promise<SessionPayload | null> {
  const token = getCookie(c, SESSION_COOKIE_NAME);
  if (!token) return null;

  try {
    const env = getServerEnv();
    const payload = await verify(token, env.AUTH_SECRET, "HS256");
    const id = (payload.id || payload.sub) as string | undefined;
    const email = payload.email as string | undefined;
    const role = (payload.role as string | undefined) || "GUARDIAN";
    const name = (payload.name as string | null | undefined) ?? null;

    if (!id || !email) return null;

    return {
      user: {
        id,
        email,
        role,
        name,
      },
    };
  } catch {
    return null;
  }
}

export async function verifyAdmin(c: Context) {
  const session = await getSession(c);
  if (!session?.user?.id && !session?.user?.email) {
    return {
      authorized: false as const,
      response: c.json({ error: { message: "Harus login terlebih dahulu." } }, 401),
      user: null,
    };
  }

  const userId = session.user.id;
  const userEmail = session.user.email;

  const conditions = [];
  if (userId) conditions.push(eq(guardians.id, userId));
  if (userEmail) conditions.push(eq(guardians.email, userEmail));

  const [user] = await drizzleDb
    .select({
      id: guardians.id,
      email: guardians.email,
      role: guardians.role,
      name: guardians.name,
    })
    .from(guardians)
    .where(conditions.length > 1 ? or(...conditions) : conditions[0])
    .limit(1);

  if (!user || user.role !== "ADMIN") {
    return {
      authorized: false as const,
      response: c.json(
        { error: { message: "Akses ditolak. Endpoint ini memerlukan hak akses Administrator." } },
        403
      ),
      user: null,
    };
  }

  return { authorized: true as const, response: null, user };
}
