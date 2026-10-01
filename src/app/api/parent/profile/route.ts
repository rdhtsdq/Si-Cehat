import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  phone: z.string().trim().max(25).optional(),
  education: z.string().trim().max(60).optional(),
  occupation: z.string().trim().max(60).optional(),
  address: z.string().trim().max(255).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: "Harus login terlebih dahulu." } }, { status: 401 });
  }

  try {
    const guardian = await db.guardian.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        education: true,
        occupation: true,
        address: true,
        role: true,
        createdAt: true,
      },
    });

    if (!guardian) {
      return NextResponse.json({ error: { message: "Data profil tidak ditemukan." } }, { status: 404 });
    }

    return NextResponse.json({ profile: guardian });
  } catch (error) {
    console.error("Get mother profile error:", error);
    return NextResponse.json({ error: { message: "Gagal memuat data profil ibu." } }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: "Harus login terlebih dahulu." } }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = updateProfileSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message || "Data profil tidak valid." } },
      { status: 400 }
    );
  }

  try {
    const updated = await db.guardian.update({
      where: { id: session.user.id },
      data: parsed.data,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        education: true,
        occupation: true,
        address: true,
        role: true,
      },
    });

    return NextResponse.json({ success: true, profile: updated });
  } catch (error) {
    console.error("Update mother profile error:", error);
    return NextResponse.json({ error: { message: "Gagal menyimpan perubahan profil ibu." } }, { status: 500 });
  }
}
