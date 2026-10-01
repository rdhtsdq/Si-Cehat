import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const growthRecordSchema = z.object({
  childId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  weightKg: z.number().min(3).max(150),
  heightCm: z.number().min(40).max(220),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: "Harus login terlebih dahulu." } }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const childId = searchParams.get("childId");

  if (!childId) {
    return NextResponse.json({ error: { message: "childId harus disertakan." } }, { status: 400 });
  }

  try {
    const measurements = await db.growthMeasurement.findMany({
      where: { childId },
      orderBy: { date: "asc" },
    });

    const latest = measurements.length > 0 ? measurements[measurements.length - 1] : null;

    return NextResponse.json({
      childId,
      latestWeightKg: latest?.weightKg ?? null,
      latestHeightCm: latest?.heightCm ?? null,
      bmi: latest?.bmi ?? null,
      nutritionalStatus: latest?.nutritionalStatus ?? "Belum ada pengukuran",
      history: measurements.map((m) => ({
        id: m.id,
        date: m.date.toISOString().slice(0, 10),
        weightKg: m.weightKg,
        heightCm: m.heightCm,
        bmi: m.bmi,
        status: m.nutritionalStatus,
      })),
    });
  } catch (error) {
    console.error("Get growth tracker error:", error);
    return NextResponse.json({ error: { message: "Gagal memuat data tracker tumbuh kembang." } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: "Harus login terlebih dahulu." } }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = growthRecordSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message || "Input tidak valid." } },
      { status: 400 }
    );
  }

  const { childId, date, weightKg, heightCm } = parsed.data;
  const targetDate = new Date((date || new Date().toISOString().slice(0, 10)) + "T00:00:00.000Z");

  try {
    const child = await db.child.findUnique({
      where: { id: childId },
      select: { guardianId: true },
    });

    if (!child) {
      return NextResponse.json({ error: { message: "Data anak tidak ditemukan." } }, { status: 404 });
    }

    if (session.user.role !== "ADMIN" && child.guardianId !== session.user.id) {
      return NextResponse.json({ error: { message: "Akses ditolak." } }, { status: 403 });
    }

    const heightM = heightCm / 100;
    const bmi = Number((weightKg / (heightM * heightM)).toFixed(1));

    let nutStatus = "Gizi Baik (Normal)";
    if (bmi >= 23) nutStatus = "Beresiko Gizi Lebih";
    if (bmi >= 27) nutStatus = "Obesitas";
    if (bmi < 14) nutStatus = "Gizi Kurang";

    const record = await db.growthMeasurement.create({
      data: {
        childId,
        date: targetDate,
        weightKg,
        heightCm,
        bmi,
        nutritionalStatus: nutStatus,
      },
    });

    return NextResponse.json({
      success: true,
      measurement: {
        id: record.id,
        date: targetDate.toISOString().slice(0, 10),
        weightKg,
        heightCm,
        bmi,
        nutritionalStatus: nutStatus,
      },
    });
  } catch (error) {
    console.error("Create growth measurement error:", error);
    return NextResponse.json({ error: { message: "Gagal menyimpan data pengukuran." } }, { status: 500 });
  }
}
