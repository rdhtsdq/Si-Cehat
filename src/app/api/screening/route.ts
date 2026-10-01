import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const screeningSchema = z.object({
  childId: z.string().uuid("childId harus berupa UUID"),
  ageYears: z.number().int().min(1).max(18),
  weightKg: z.number().min(3).max(150),
  heightCm: z.number().min(40).max(220),
  familyHistory: z.boolean().default(false),
  sweetDrinkFrequency: z.enum(["jarang", "kadang", "sering"]).default("kadang"),
  physicalActivityHours: z.number().min(0).max(12).default(1.0),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: "Harus login terlebih dahulu." } }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = screeningSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message || "Data skrining tidak valid." } },
      { status: 400 }
    );
  }

  const { childId, ageYears, weightKg, heightCm, familyHistory, sweetDrinkFrequency, physicalActivityHours } = parsed.data;

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

    // Kalkulasi BMI dan Skor Risiko Diabetes
    const heightM = heightCm / 100;
    const bmi = Number((weightKg / (heightM * heightM)).toFixed(1));

    let score = 0;
    const recs: string[] = [];

    // Bobot BMI
    if (bmi >= 23) {
      score += 35;
      recs.push("Atur porsi makan dengan prinsip 'Isi Piringku' (1/2 sayur dan buah, 1/4 karbohidrat, 1/4 lauk protein).");
    } else if (bmi >= 20) {
      score += 20;
    } else {
      score += 5;
    }

    // Bobot Riwayat Keluarga
    if (familyHistory) {
      score += 25;
      recs.push("Lakukan pemantauan pola makan teratur karena adanya faktor genetik risiko diabetes pada keluarga.");
    }

    // Bobot Minuman Manis
    if (sweetDrinkFrequency === "sering") {
      score += 25;
      recs.push("Batasi minuman kemasan manis, sirup, dan boba maksimal 1 kali seminggu, ganti dengan air putih dingin beraroma buah.");
    } else if (sweetDrinkFrequency === "kadang") {
      score += 10;
      recs.push("Biasakan anak membawa botol air putih sendiri saat bermain dan bersekolah.");
    }

    // Bobot Aktivitas Fisik
    if (physicalActivityHours < 0.75) {
      score += 20;
      recs.push("Ajak anak aktif bergerak atau bermain di luar ruangan minimal 60 menit setiap hari.");
    } else {
      score += 5;
    }

    const finalScore = Math.min(100, Math.max(5, score));
    let category = "RENDAH";
    let statusText = "Anak memiliki risiko rendah terhadap diabetes mellitus.";

    if (finalScore >= 55) {
      category = "TINGGI";
      statusText = "Anak memiliki potensi risiko tinggi terhadap diabetes mellitus. Disarankan berkonsultasi dengan dokter atau ahli gizi.";
    } else if (finalScore >= 25) {
      category = "SEDANG";
      statusText = "Anak memiliki risiko sedang terhadap diabetes mellitus.";
    }

    if (recs.length === 0) {
      recs.push("Pertahankan pola makan seimbang dan kebiasaan minum air putih yang sudah berjalan baik!");
    }

    const screening = await db.screeningRecord.create({
      data: {
        childId,
        guardianId: session.user.id,
        ageYears,
        weightKg,
        heightCm,
        familyHistory,
        sweetDrinkFrequency,
        physicalActivityHours,
        riskScore: finalScore,
        riskCategory: category,
        recommendations: JSON.stringify(recs),
      },
    });

    // Otomatis catat ke GrowthMeasurement jika belum ada hari ini
    const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00.000Z");
    const existingGrowth = await db.growthMeasurement.findFirst({
      where: { childId, date: today },
    });

    let nutStatus = "Gizi Baik (Normal)";
    if (bmi >= 23) nutStatus = "Beresiko Gizi Lebih";
    if (bmi >= 27) nutStatus = "Obesitas";
    if (bmi < 14) nutStatus = "Gizi Kurang";

    if (!existingGrowth) {
      await db.growthMeasurement.create({
        data: {
          childId,
          date: today,
          weightKg,
          heightCm,
          bmi,
          nutritionalStatus: nutStatus,
        },
      });
    }

    return NextResponse.json({
      success: true,
      screeningId: screening.id,
      riskScore: finalScore,
      riskCategory: category,
      title: statusText,
      bmi,
      nutritionalStatus: nutStatus,
      recommendations: recs,
    });
  } catch (error) {
    console.error("Screening calculation error:", error);
    return NextResponse.json({ error: { message: "Gagal memproses skrining risiko." } }, { status: 500 });
  }
}

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
    const records = await db.screeningRecord.findMany({
      where: { childId, guardianId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const parsedRecords = records.map((r) => {
      let recs: string[] = [];
      try {
        recs = JSON.parse(r.recommendations);
      } catch {
        recs = [];
      }
      return {
        id: r.id,
        date: r.createdAt.toISOString().slice(0, 10),
        ageYears: r.ageYears,
        weightKg: r.weightKg,
        heightCm: r.heightCm,
        riskScore: r.riskScore,
        riskCategory: r.riskCategory,
        recommendations: recs,
      };
    });

    return NextResponse.json({ history: parsedRecords });
  } catch (error) {
    console.error("Get screening history error:", error);
    return NextResponse.json({ error: { message: "Gagal memuat riwayat skrining." } }, { status: 500 });
  }
}
