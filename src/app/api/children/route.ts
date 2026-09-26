import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const createChildSchema = z.object({
  name: z.string().trim().min(1, "Nama anak harus diisi").max(40),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: "Harus login terlebih dahulu." } }, { status: 401 });
  }

  try {
    const children = await db.child.findMany({
      where: { guardianId: session.user.id },
      include: {
        dailyProgresses: {
          orderBy: { date: "desc" },
          take: 7,
        },
      },
    });

    return NextResponse.json({ children });
  } catch (error) {
    console.error("Get children error:", error);
    return NextResponse.json({ error: { message: "Gagal mengambil data anak." } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: "Harus login terlebih dahulu." } }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const result = createChildSchema.safeParse(json);

  if (!result.success) {
    return NextResponse.json(
      { error: { message: result.error.issues[0]?.message || "Input tidak valid." } },
      { status: 400 }
    );
  }

  try {
    const child = await db.child.create({
      data: {
        guardianId: session.user.id,
        name: result.data.name,
        avatarPreference: JSON.stringify({
          character: "default",
          accessory: "none",
          orbColor: "#4f9f7a",
        }),
      },
    });

    return NextResponse.json({ child });
  } catch (error) {
    console.error("Create child error:", error);
    return NextResponse.json({ error: { message: "Gagal menambahkan data anak." } }, { status: 500 });
  }
}
