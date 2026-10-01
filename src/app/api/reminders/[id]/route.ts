import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const patchReminderSchema = z.object({
  isEnabled: z.boolean().optional(),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  title: z.string().trim().min(2).max(60).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: "Harus login terlebih dahulu." } }, { status: 401 });
  }

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = patchReminderSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message || "Input tidak valid." } },
      { status: 400 }
    );
  }

  try {
    const existing = await db.reminder.findUnique({
      where: { id },
      select: { guardianId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: { message: "Reminder tidak ditemukan." } }, { status: 404 });
    }

    if (session.user.role !== "ADMIN" && existing.guardianId !== session.user.id) {
      return NextResponse.json({ error: { message: "Akses ditolak." } }, { status: 403 });
    }

    const updated = await db.reminder.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, reminder: updated });
  } catch (error) {
    console.error("Patch reminder error:", error);
    return NextResponse.json({ error: { message: "Gagal memperbarui reminder." } }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: "Harus login terlebih dahulu." } }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await db.reminder.findUnique({
      where: { id },
      select: { guardianId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: { message: "Reminder tidak ditemukan." } }, { status: 404 });
    }

    if (session.user.role !== "ADMIN" && existing.guardianId !== session.user.id) {
      return NextResponse.json({ error: { message: "Akses ditolak." } }, { status: 403 });
    }

    await db.reminder.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete reminder error:", error);
    return NextResponse.json({ error: { message: "Gagal menghapus reminder." } }, { status: 500 });
  }
}
