import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";

const avatarSchema = z.object({
  childId: z.string().uuid().optional(),
  character: z.enum(["default", "apple", "broccoli", "carrot"]),
  accessory: z.enum(["none", "glasses", "headphone", "hat"]),
  orbColor: z.string().min(1),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get("childId");
  const session = await auth();

  let targetId = childId;
  if (session?.user?.id) {
    if (targetId) {
      const childBelongs = await db.child.findFirst({
        where: { id: targetId, guardianId: session.user.id },
      });
      if (!childBelongs && session.user.role !== "ADMIN") {
        targetId = null;
      }
    }
    if (!targetId) {
      const child = await db.child.findFirst({
        where: { guardianId: session.user.id },
        select: { id: true, avatarPreference: true },
      });
      if (child) {
        targetId = child.id;
        if (child.avatarPreference) {
          try {
            return NextResponse.json(JSON.parse(child.avatarPreference));
          } catch {}
        }
      }
    }
  }

  if (targetId) {
    const child = await db.child.findUnique({
      where: { id: targetId },
      select: { avatarPreference: true },
    });
    if (child?.avatarPreference) {
      try {
        return NextResponse.json(JSON.parse(child.avatarPreference));
      } catch {}
    }
  }

  return NextResponse.json({
    character: "default",
    accessory: "none",
    orbColor: "#4f9f7a",
  });
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = avatarSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: { message: "Data avatar tidak valid." } }, { status: 400 });
  }

  const { childId, ...preference } = parsed.data;
  const session = await auth();

  let targetId = childId;
  if (session?.user?.id) {
    if (targetId) {
      const childBelongs = await db.child.findFirst({
        where: { id: targetId, guardianId: session.user.id },
      });
      if (!childBelongs && session.user.role !== "ADMIN") {
        targetId = undefined;
      }
    }
    if (!targetId) {
      const child = await db.child.findFirst({
        where: { guardianId: session.user.id },
      });
      if (child) targetId = child.id;
    }
  }

  if (!targetId) {
    return NextResponse.json({
      savedLocallyOnly: true,
      preference,
    });
  }

  try {
    await db.child.update({
      where: { id: targetId },
      data: {
        avatarPreference: JSON.stringify(preference),
      },
    });

    return NextResponse.json({ success: true, preference });
  } catch (error) {
    console.error("Save avatar preference error:", error);
    return NextResponse.json({ error: { message: "Gagal menyimpan avatar." } }, { status: 500 });
  }
}
