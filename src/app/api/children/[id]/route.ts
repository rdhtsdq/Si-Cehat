import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const updateChildSchema = z.object({
  name: z.string().trim().min(1).max(40).optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal lahir YYYY-MM-DD").optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  healthHistory: z.string().trim().max(500).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: "Harus login terlebih dahulu." } }, { status: 401 });
  }

  const { id } = await params;

  try {
    const child = await db.child.findUnique({
      where: { id },
      include: {
        growthMeasurements: {
          orderBy: { date: "desc" },
          take: 5,
        },
        screenings: {
          orderBy: { createdAt: "desc" },
          take: 3,
        },
      },
    });

    if (!child) {
      return NextResponse.json({ error: { message: "Data anak tidak ditemukan." } }, { status: 404 });
    }

    if (session.user.role !== "ADMIN" && child.guardianId !== session.user.id) {
      return NextResponse.json({ error: { message: "Akses ditolak." } }, { status: 403 });
    }

    return NextResponse.json({ child });
  } catch (error) {
    console.error("Get child detail error:", error);
    return NextResponse.json({ error: { message: "Gagal mengambil data anak." } }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: "Harus login terlebih dahulu." } }, { status: 401 });
  }

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = updateChildSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message || "Input tidak valid." } },
      { status: 400 }
    );
  }

  try {
    const existing = await db.child.findUnique({
      where: { id },
      select: { guardianId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: { message: "Data anak tidak ditemukan." } }, { status: 404 });
    }

    if (session.user.role !== "ADMIN" && existing.guardianId !== session.user.id) {
      return NextResponse.json({ error: { message: "Akses ditolak." } }, { status: 403 });
    }

    const { name, birthDate, gender, healthHistory } = parsed.data;

    const updated = await db.child.update({
      where: { id },
      data: {
        name,
        birthDate: birthDate ? new Date(`${birthDate}T00:00:00.000Z`) : undefined,
        gender,
        healthHistory,
      },
    });

    return NextResponse.json({ success: true, child: updated });
  } catch (error) {
    console.error("Update child error:", error);
    return NextResponse.json({ error: { message: "Gagal memperbarui data anak." } }, { status: 500 });
  }
}
