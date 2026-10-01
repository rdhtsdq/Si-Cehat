import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const createReminderSchema = z.object({
  title: z.string().trim().min(2).max(60),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format waktu harus HH:mm (contoh 07:00)"),
  category: z.enum(["makan", "minum", "aktivitas", "tidur", "umum"]).default("umum"),
  childId: z.string().uuid().optional(),
});

const DEFAULT_REMINDERS = [
  { title: "Sarapan Pagi", time: "07:00", category: "makan", isEnabled: true },
  { title: "Minum air putih", time: "10:00", category: "minum", isEnabled: true },
  { title: "Aktivitas Fisik", time: "15:30", category: "aktivitas", isEnabled: false },
  { title: "Waktu Tidur", time: "20:00", category: "tidur", isEnabled: true },
];

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: "Harus login terlebih dahulu." } }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const childId = searchParams.get("childId");

  try {
    let reminders = await db.reminder.findMany({
      where: {
        guardianId: session.user.id,
        ...(childId ? { childId } : {}),
      },
      orderBy: { time: "asc" },
    });

    // Inisialisasi otomatis reminder default jika akun belum memiliki reminder sama sekali
    if (reminders.length === 0) {
      await db.reminder.createMany({
        data: DEFAULT_REMINDERS.map((r) => ({
          guardianId: session.user.id,
          childId: childId || null,
          title: r.title,
          time: r.time,
          category: r.category,
          isEnabled: r.isEnabled,
        })),
      });

      reminders = await db.reminder.findMany({
        where: { guardianId: session.user.id },
        orderBy: { time: "asc" },
      });
    }

    return NextResponse.json({ reminders });
  } catch (error) {
    console.error("Get reminders error:", error);
    return NextResponse.json({ error: { message: "Gagal memuat jadwal reminder." } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: "Harus login terlebih dahulu." } }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = createReminderSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message || "Input reminder tidak valid." } },
      { status: 400 }
    );
  }

  const { title, time, category, childId } = parsed.data;

  try {
    const reminder = await db.reminder.create({
      data: {
        guardianId: session.user.id,
        childId: childId || null,
        title,
        time,
        category,
        isEnabled: true,
      },
    });

    return NextResponse.json({ success: true, reminder });
  } catch (error) {
    console.error("Create reminder error:", error);
    return NextResponse.json({ error: { message: "Gagal membuat jadwal reminder." } }, { status: 500 });
  }
}
