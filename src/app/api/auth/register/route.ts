import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const registerSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  motherName: z.string().trim().min(2).max(60).optional(),
  name: z.string().trim().min(2).max(60).optional(),
  phone: z.string().trim().max(25).optional(),
  childName: z.string().min(1, "Nama anak harus diisi").max(40).optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => null);
    const result = registerSchema.safeParse(json);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Data pendaftaran tidak valid.";
      return NextResponse.json({ error: { message: errorMsg } }, { status: 400 });
    }

    const { email, password, motherName, name, phone, childName } = result.data;
    const finalMotherName = motherName || name || "Ibu";

    const existing = await db.guardian.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: { message: "Email sudah terdaftar. Silakan login." } },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const guardian = await db.guardian.create({
      data: {
        email,
        passwordHash,
        name: finalMotherName,
        phone: phone || null,
        children: {
          create: {
            name: childName?.trim() || "Teman Cehat",
            avatarPreference: JSON.stringify({
              character: "default",
              accessory: "none",
              orbColor: "#4f9f7a",
            }),
          },
        },
      },
      include: {
        children: true,
      },
    });

    return NextResponse.json({
      success: true,
      guardian: {
        id: guardian.id,
        name: guardian.name,
        email: guardian.email,
        phone: guardian.phone,
        children: guardian.children,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: { message: "Terjadi kesalahan saat pendaftaran akun." } },
      { status: 500 }
    );
  }
}
