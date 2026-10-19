import { Hono } from "hono";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { drizzleDb } from "../db";
import { guardians, children, posyandus } from "../db/schema";
import {
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  getSession,
} from "../middleware/auth";

export const authRoutes = new Hono();

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  motherName: z.string().trim().min(2).max(60).optional(),
  name: z.string().trim().min(2).max(60).optional(),
  phone: z.string().trim().max(25).optional(),
  childName: z.string().min(1, "Nama anak harus diisi").max(40).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Format email tidak valid"),
  password: z.string().min(1, "Kata sandi wajib diisi"),
});

authRoutes.post("/register", async (c) => {
  try {
    const json = await c.req.json().catch(() => null);
    const result = registerSchema.safeParse(json);

    if (!result.success) {
      const errorMsg =
        result.error.issues[0]?.message || "Data pendaftaran tidak valid.";
      return c.json({ error: { message: errorMsg } }, 400);
    }

    const { email, password, motherName, name, phone, childName } = result.data;
    const finalMotherName = motherName || name || "Ibu";

    const [existing] = await drizzleDb
      .select({ id: guardians.id })
      .from(guardians)
      .where(eq(sql`lower(${guardians.email})`, email))
      .limit(1);

    if (existing) {
      return c.json(
        { error: { message: "Email sudah terdaftar. Silakan login." } },
        409
      );
    }

    const passwordHash = await Bun.password.hash(password, {
      algorithm: "bcrypt",
      cost: 10,
    });

    const [guardian] = await drizzleDb
      .insert(guardians)
      .values({
        email,
        passwordHash,
        name: finalMotherName,
        phone: phone || null,
      })
      .returning();

    const [createdChild] = await drizzleDb
      .insert(children)
      .values({
        guardianId: guardian.id,
        name: childName?.trim() || "Teman Cehat",
        avatarPreference: JSON.stringify({
          character: "default",
          accessory: "none",
          orbColor: "#4f9f7a",
        }),
      })
      .returning();

    return c.json({
      success: true,
      guardian: {
        id: guardian.id,
        name: guardian.name,
        email: guardian.email,
        phone: guardian.phone,
        children: [createdChild],
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return c.json(
      { error: { message: "Terjadi kesalahan saat pendaftaran akun." } },
      500
    );
  }
});

authRoutes.post("/login", async (c) => {
  try {
    const json = await c.req.json().catch(() => null);
    const parsed = loginSchema.safeParse(json);

    if (!parsed.success) {
      return c.json(
        { error: { message: "Email atau kata sandi tidak valid." } },
        400
      );
    }

    const { email, password } = parsed.data;
    const [guardian] = await drizzleDb
      .select()
      .from(guardians)
      .where(eq(sql`lower(${guardians.email})`, email))
      .limit(1);

    if (!guardian) {
      return c.json(
        { error: { message: "Email atau kata sandi tidak cocok." } },
        401
      );
    }

    const valid = await Bun.password.verify(password, guardian.passwordHash);
    if (!valid) {
      return c.json(
        { error: { message: "Email atau kata sandi tidak cocok." } },
        401
      );
    }

    let posyanduName: string | null = null;
    if (guardian.posyanduId) {
      const [p] = await drizzleDb
        .select({ name: posyandus.name })
        .from(posyandus)
        .where(eq(posyandus.id, guardian.posyanduId))
        .limit(1);
      posyanduName = p?.name ?? null;
    }

    const user = {
      id: guardian.id,
      email: guardian.email,
      role: guardian.role || "GUARDIAN",
      name: guardian.name,
      posyanduId: guardian.posyanduId ?? null,
      posyanduName,
    };

    const token = await createSessionToken(user);
    setSessionCookie(c, token);

    return c.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Login error:", error);
    return c.json(
      { error: { message: "Terjadi kesalahan saat otentikasi." } },
      500
    );
  }
});

authRoutes.post("/logout", (c) => {
  clearSessionCookie(c);
  return c.json({ success: true });
});

authRoutes.get("/me", async (c) => {
  const session = await getSession(c);
  if (!session?.user) {
    return c.json({ user: null }, 200);
  }

  try {
    const [guardian] = await drizzleDb
      .select({
        id: guardians.id,
        email: guardians.email,
        role: guardians.role,
        name: guardians.name,
        posyanduId: guardians.posyanduId,
      })
      .from(guardians)
      .where(eq(guardians.id, session.user.id))
      .limit(1);

    if (!guardian) {
      return c.json({ user: null }, 200);
    }

    let posyanduName: string | null = null;
    if (guardian.posyanduId) {
      const [p] = await drizzleDb
        .select({ name: posyandus.name })
        .from(posyandus)
        .where(eq(posyandus.id, guardian.posyanduId))
        .limit(1);
      posyanduName = p?.name ?? null;
    }

    return c.json({
      user: {
        ...guardian,
        posyanduName,
      },
    });
  } catch {
    return c.json({ user: session.user });
  }
});
