import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const createConsultationSchema = z.object({
  specialistType: z.enum(["BIDAN", "AHLI_GIZI", "DOKTER"]),
  specialistName: z.string().trim().min(3).max(100),
  topic: z.string().trim().min(3).max(200),
  notes: z.string().trim().max(1000).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: "Harus login terlebih dahulu." } }, { status: 401 });
  }

  try {
    const consultations = await db.consultation.findMany({
      where: { guardianId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ consultations });
  } catch (error) {
    console.error("Get consultations error:", error);
    return NextResponse.json({ error: { message: "Gagal memuat daftar konsultasi." } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: "Harus login terlebih dahulu." } }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = createConsultationSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message || "Data konsultasi tidak valid." } },
      { status: 400 }
    );
  }

  try {
    const consultation = await db.consultation.create({
      data: {
        guardianId: session.user.id,
        specialistType: parsed.data.specialistType,
        specialistName: parsed.data.specialistName,
        topic: parsed.data.topic,
        notes: parsed.data.notes,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({ consultation }, { status: 201 });
  } catch (error) {
    console.error("Create consultation error:", error);
    return NextResponse.json({ error: { message: "Gagal membuat sesi konsultasi." } }, { status: 500 });
  }
}
