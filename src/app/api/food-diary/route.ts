import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const foodDiarySchema = z.object({
  childId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  mealSlot: z.enum(["sarapan", "siang", "camilan", "malam"]),
  foodName: z.string().trim().min(2).max(100),
  portion: z.string().trim().default("1 porsi sedang"),
  caloriesKkal: z.number().int().optional(),
  carbsGram: z.number().optional(),
  proteinGram: z.number().optional(),
  fatGram: z.number().optional(),
  imageUrl: z.string().url().optional(),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: "Harus login terlebih dahulu." } }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const childId = searchParams.get("childId");
  const dateStr = searchParams.get("date") || new Date().toISOString().slice(0, 10);
  const targetDate = new Date(`${dateStr}T00:00:00.000Z`);

  if (!childId) {
    return NextResponse.json({ error: { message: "childId harus disertakan." } }, { status: 400 });
  }

  try {
    const items = await db.detailedFoodLog.findMany({
      where: { childId, date: targetDate },
      orderBy: { createdAt: "asc" },
    });

    const grouped: Record<string, typeof items> = {
      sarapan: [],
      siang: [],
      camilan: [],
      malam: [],
    };

    let totalCalories = 0;

    items.forEach((item) => {
      if (item.mealSlot in grouped) {
        grouped[item.mealSlot].push(item);
      }
      if (item.caloriesKkal) {
        totalCalories += item.caloriesKkal;
      }
    });

    return NextResponse.json({
      date: dateStr,
      childId,
      totalCalories,
      slots: grouped,
      totalItems: items.length,
    });
  } catch (error) {
    console.error("Get food diary error:", error);
    return NextResponse.json({ error: { message: "Gagal memuat diary makan." } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: "Harus login terlebih dahulu." } }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = foodDiarySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message || "Input diary makan tidak valid." } },
      { status: 400 }
    );
  }

  const { childId, date, mealSlot, foodName, portion, caloriesKkal, carbsGram, proteinGram, fatGram, imageUrl } = parsed.data;
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

    const created = await db.detailedFoodLog.create({
      data: {
        childId,
        date: targetDate,
        mealSlot,
        foodName,
        portion,
        caloriesKkal,
        carbsGram,
        proteinGram,
        fatGram,
        imageUrl,
      },
    });

    return NextResponse.json({ success: true, item: created });
  } catch (error) {
    console.error("Create food diary error:", error);
    return NextResponse.json({ error: { message: "Gagal menyimpan catatan diary makan." } }, { status: 500 });
  }
}
