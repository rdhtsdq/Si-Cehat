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
  posyanduId?: string | null;
  posyanduName?: string | null;
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
      posyanduId: user.posyanduId ?? null,
      posyanduName: user.posyanduName ?? null,
      iat: now,
      exp: now + 60 * 60 * 24 * 7, // 7 days
    },
    env.AUTH_SECRET,
    "HS256"
  );
}

export function setSessionCookie(c: Context, token: string): void {
  const env = getServerEnv();
  const isHttps =
    c.req.header("x-forwarded-proto") === "https" ||
    c.req.url.startsWith("https://");
  const isSecure = env.NODE_ENV === "production" && isHttps;

  setCookie(c, SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    secure: isSecure,
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSessionCookie(c: Context): void {
  deleteCookie(c, SESSION_COOKIE_NAME, {
    path: "/",
  });
}

export async function getSession(c: Context): Promise<SessionPayload | null> {
  let token = getCookie(c, SESSION_COOKIE_NAME);
  if (!token) {
    const authHeader = c.req.header("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
  }
  if (!token) return null;

  try {
    const env = getServerEnv();
    const payload = await verify(token, env.AUTH_SECRET, "HS256");
    const id = (payload.id || payload.sub) as string | undefined;
    const email = payload.email as string | undefined;
    const role = (payload.role as string | undefined) || "GUARDIAN";
    const name = (payload.name as string | null | undefined) ?? null;
    const posyanduId = (payload.posyanduId as string | null | undefined) ?? null;
    const posyanduName = (payload.posyanduName as string | null | undefined) ?? null;

    if (!id || !email) return null;

    return {
      user: {
        id,
        email,
        role,
        name,
        posyanduId,
        posyanduName,
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
      isSuperAdmin: false,
      isPosyandu: false,
      posyanduId: null,
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
      posyanduId: guardians.posyanduId,
    })
    .from(guardians)
    .where(conditions.length > 1 ? or(...conditions) : conditions[0])
    .limit(1);

  if (!user || (user.role !== "ADMIN" && user.role !== "POSYANDU")) {
    return {
      authorized: false as const,
      response: c.json(
        { error: { message: "Akses ditolak. Endpoint ini memerlukan hak akses Administrator atau Admin Posyandu." } },
        403
      ),
      user: null,
      isSuperAdmin: false,
      isPosyandu: false,
      posyanduId: null,
    };
  }

  const isSuperAdmin = user.role === "ADMIN";
  const isPosyandu = user.role === "POSYANDU";

  return {
    authorized: true as const,
    response: null,
    user: {
      ...user,
      posyanduId: user.posyanduId ?? null,
    },
    isSuperAdmin,
    isPosyandu,
    posyanduId: user.posyanduId ?? null,
  };
}

export async function verifySuperAdmin(c: Context) {
  const auth = await verifyAdmin(c);
  if (!auth.authorized) return auth;
  if (!auth.isSuperAdmin) {
    return {
      authorized: false as const,
      response: c.json(
        { error: { message: "Akses ditolak. Tindakan ini hanya dapat dilakukan oleh Administrator Pusat." } },
        403
      ),
      user: null,
      isSuperAdmin: false,
      isPosyandu: true,
      posyanduId: auth.posyanduId,
    };
  }
  return auth;
}
