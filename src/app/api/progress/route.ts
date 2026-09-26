import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";

const syncProgressSchema = z.object({
  childId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  waterGlasses: z.number().int().min(0).max(30).default(0),
  activityMinutes: z.number().int().min(0).max(600).default(0),
  xpEarned: z.number().int().min(0).max(9999).default(0),
  streak: z.number().int().min(0).max(365).default(0),
  foodLogs: z.array(
    z.object({
      name: z.string().trim().min(1).max(100),
      tone: z.enum(["balanced", "sweet", "fried", "unknown"]),
    })
  ).default([]),
});

function parseTargetDate(dateStr?: string | null): Date {
  const d = dateStr || new Date().toISOString().slice(0, 10);
  return new Date(`${d}T00:00:00.000Z`);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const childIdParam = searchParams.get("childId");
  const dateParam = searchParams.get("date");
  const session = await auth();

  // If guardian is logged in, resolve or validate targetChildId
  let targetChildId = childIdParam;
  if (session?.user?.id) {
    if (targetChildId) {
      const childBelongs = await db.child.findFirst({
        where: { id: targetChildId, guardianId: session.user.id },
      });
      if (!childBelongs && session.user.role !== "ADMIN") {
        targetChildId = null; // Stale ID from prior session or guest, discard
      }
    }
    if (!targetChildId) {
      const firstChild = await db.child.findFirst({
        where: { guardianId: session.user.id },
        orderBy: { id: "asc" },
      });
      if (firstChild) {
        targetChildId = firstChild.id;
      }
    }
  }

  if (!targetChildId) {
    return NextResponse.json({ progress: null, note: "No active child profile" });
  }

  const targetDate = parseTargetDate(dateParam);

  try {
    const progress = await db.dailyProgress.findFirst({
      where: {
        childId: targetChildId,
        date: targetDate,
      },
    });

    const foodLogs = await db.foodLog.findMany({
      where: {
        childId: targetChildId,
        date: targetDate,
      },
    });

    const child = await db.child.findUnique({
      where: { id: targetChildId },
      select: { name: true, avatarPreference: true, guardianId: true },
    });

    if (session?.user && session.user.role !== "ADMIN" && child?.guardianId !== session.user.id) {
      return NextResponse.json(
        { error: { message: "Akses ditolak. Anda hanya dapat melihat data anak Anda sendiri." } },
        { status: 403 }
      );
    }

    let avatarPreference = null;
    if (child?.avatarPreference) {
      try {
        avatarPreference = JSON.parse(child.avatarPreference);
      } catch {}
    }

    return NextResponse.json({
      childId: targetChildId,
      childName: child?.name || "Teman Cehat",
      date: targetDate.toISOString().slice(0, 10),
      waterGlasses: progress?.waterGlasses ?? 0,
      activityMinutes: progress?.activityMinutes ?? 0,
      xp: progress?.xpEarned ?? 0,
      streak: progress?.streak ?? 0,
      foodLogs: foodLogs.map((f) => ({ name: f.name, tone: f.tone })),
      avatarPreference,
    });
  } catch (error) {
    console.error("Fetch progress error:", error);
    return NextResponse.json({ error: { message: "Gagal mengambil progres harian." } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = syncProgressSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: { message: "Data progres tidak valid." } }, { status: 400 });
  }

  const { childId: reqChildId, waterGlasses, activityMinutes, xpEarned, streak, foodLogs } = parsed.data;
  const session = await auth();

  let targetChildId = reqChildId;
  if (session?.user?.id) {
    if (targetChildId) {
      const childBelongs = await db.child.findFirst({
        where: { id: targetChildId, guardianId: session.user.id },
      });
      if (!childBelongs && session.user.role !== "ADMIN") {
        targetChildId = undefined; // Stale ID from prior session or guest, discard
      }
    }
    if (!targetChildId) {
      const firstChild = await db.child.findFirst({
        where: { guardianId: session.user.id },
        orderBy: { id: "asc" },
      });
      if (firstChild) targetChildId = firstChild.id;
    }
  }

  if (!targetChildId) {
    // If not authenticated or no child found, guest mode accepts and echoes back
    return NextResponse.json({
      savedLocallyOnly: true,
      data: parsed.data,
    });
  }

  // Ownership verification for logged in guardian
  if (session?.user && session.user.role !== "ADMIN") {
    const child = await db.child.findUnique({
      where: { id: targetChildId },
      select: { guardianId: true },
    });
    if (child && child.guardianId !== session.user.id) {
      return NextResponse.json(
        { error: { message: "Akses ditolak. Anda hanya dapat memperbarui data anak Anda sendiri." } },
        { status: 403 }
      );
    }
  }

  const targetDate = parseTargetDate(parsed.data.date);

  try {
    // Find existing daily progress or create
    const existing = await db.dailyProgress.findFirst({
      where: {
        childId: targetChildId,
        date: targetDate,
      },
    });

    const progressRecord = existing
      ? await db.dailyProgress.update({
          where: { id: existing.id },
          data: {
            waterGlasses,
            activityMinutes,
            xpEarned,
            streak,
          },
        })
      : await db.dailyProgress.create({
          data: {
            childId: targetChildId,
            date: targetDate,
            waterGlasses,
            activityMinutes,
            xpEarned,
            streak,
          },
        });

    // Sync food logs for today
    await db.foodLog.deleteMany({
      where: {
        childId: targetChildId,
        date: targetDate,
      },
    });

    if (foodLogs.length > 0) {
      await db.foodLog.createMany({
        data: foodLogs.map((food) => ({
          childId: targetChildId as string,
          date: targetDate,
          name: food.name,
          tone: food.tone,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      progressId: progressRecord.id,
      childId: targetChildId,
    });
  } catch (error) {
    console.error("Save progress error:", error);
    return NextResponse.json({ error: { message: "Gagal menyimpan progres ke database." } }, { status: 500 });
  }
}
