import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";

const challengeSchema = z.object({
  type: z.literal("challenge"),
  title: z.string().trim().min(3),
  description: z.string().trim().min(5),
  xp: z.number().int().min(5).max(100).default(30),
  isActive: z.boolean().default(false),
});

const quizSchema = z.object({
  type: z.literal("quiz"),
  question: z.string().trim().min(5),
  options: z.array(z.string().trim().min(1)).min(2).max(5),
  answer: z.string().trim().min(1),
  xp: z.number().int().min(5).max(100).default(20),
  isActive: z.boolean().default(false),
});

const menuSchema = z.object({
  type: z.literal("menu"),
  title: z.string().trim().min(3),
  note: z.string().trim().min(5),
  orderIndex: z.number().int().default(1),
});

const toggleSchema = z.object({
  type: z.literal("toggle"),
  entity: z.enum(["challenge", "quiz"]),
  id: z.string().uuid(),
  isActive: z.boolean(),
});

const deleteSchema = z.object({
  type: z.enum(["challenge", "quiz", "menu"]),
  id: z.string().uuid(),
});

async function checkIsAdmin() {
  const session = await auth();
  if (!session?.user?.id) return false;
  const user = await db.guardian.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  return user?.role === "ADMIN";
}

export async function GET() {
  if (!(await checkIsAdmin())) {
    return NextResponse.json(
      { error: { message: "Akses ditolak. Halaman ini khusus untuk Administrator." } },
      { status: 403 }
    );
  }
  try {
    const [challenges, quizzes, menus] = await Promise.all([
      db.challenge.findMany({ orderBy: { createdAt: "desc" } }),
      db.quiz.findMany({ orderBy: { createdAt: "desc" } }),
      db.recommendedMenu.findMany({ orderBy: { orderIndex: "asc" } }),
    ]);

    const formattedQuizzes = quizzes.map((q) => {
      let parsedOptions = [];
      try {
        parsedOptions = JSON.parse(q.options);
      } catch {
        parsedOptions = [];
      }
      return {
        ...q,
        options: parsedOptions,
      };
    });

    return NextResponse.json({
      challenges,
      quizzes: formattedQuizzes,
      menus,
    });
  } catch (error) {
    console.error("Admin content fetch error:", error);
    return NextResponse.json({ error: { message: "Gagal memuat konten edukasi." } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json(
      { error: { message: "Akses ditolak. Halaman ini khusus untuk Administrator." } },
      { status: 403 }
    );
  }
  try {
    const json = await request.json().catch(() => null);

    if (json?.type === "toggle") {
      const parsed = toggleSchema.safeParse(json);
      if (!parsed.success) return NextResponse.json({ error: { message: "Input tidak valid" } }, { status: 400 });

      if (parsed.data.entity === "challenge") {
        if (parsed.data.isActive) {
          // Deactivate all others first to ensure only 1 is active
          await db.challenge.updateMany({ data: { isActive: false } });
        }
        await db.challenge.update({
          where: { id: parsed.data.id },
          data: { isActive: parsed.data.isActive },
        });
      } else {
        if (parsed.data.isActive) {
          await db.quiz.updateMany({ data: { isActive: false } });
        }
        await db.quiz.update({
          where: { id: parsed.data.id },
          data: { isActive: parsed.data.isActive },
        });
      }

      return NextResponse.json({ success: true });
    }

    if (json?.type === "challenge") {
      const parsed = challengeSchema.safeParse(json);
      if (!parsed.success) return NextResponse.json({ error: { message: parsed.error.issues[0]?.message || "Input tidak valid" } }, { status: 400 });

      if (parsed.data.isActive) {
        await db.challenge.updateMany({ data: { isActive: false } });
      }

      const created = await db.challenge.create({
        data: {
          title: parsed.data.title,
          description: parsed.data.description,
          xp: parsed.data.xp,
          isActive: parsed.data.isActive,
        },
      });
      return NextResponse.json({ success: true, item: created });
    }

    if (json?.type === "quiz") {
      const parsed = quizSchema.safeParse(json);
      if (!parsed.success) return NextResponse.json({ error: { message: parsed.error.issues[0]?.message || "Input tidak valid" } }, { status: 400 });

      if (parsed.data.isActive) {
        await db.quiz.updateMany({ data: { isActive: false } });
      }

      const created = await db.quiz.create({
        data: {
          question: parsed.data.question,
          options: JSON.stringify(parsed.data.options),
          answer: parsed.data.answer,
          xp: parsed.data.xp,
          isActive: parsed.data.isActive,
        },
      });
      return NextResponse.json({ success: true, item: created });
    }

    if (json?.type === "menu") {
      const parsed = menuSchema.safeParse(json);
      if (!parsed.success) return NextResponse.json({ error: { message: parsed.error.issues[0]?.message || "Input tidak valid" } }, { status: 400 });

      const created = await db.recommendedMenu.create({
        data: {
          title: parsed.data.title,
          note: parsed.data.note,
          orderIndex: parsed.data.orderIndex,
        },
      });
      return NextResponse.json({ success: true, item: created });
    }

    return NextResponse.json({ error: { message: "Tipe aksi tidak dikenali." } }, { status: 400 });
  } catch (error) {
    console.error("Admin content create error:", error);
    return NextResponse.json({ error: { message: "Gagal menyimpan konten." } }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json(
      { error: { message: "Akses ditolak. Halaman ini khusus untuk Administrator." } },
      { status: 403 }
    );
  }
  try {
    const json = await request.json().catch(() => null);
    const parsed = deleteSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: { message: "Data tidak valid" } }, { status: 400 });

    const { type, id } = parsed.data;
    if (type === "challenge") {
      await db.challenge.delete({ where: { id } });
    } else if (type === "quiz") {
      await db.quiz.delete({ where: { id } });
    } else if (type === "menu") {
      await db.recommendedMenu.delete({ where: { id } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin content delete error:", error);
    return NextResponse.json({ error: { message: "Gagal menghapus konten." } }, { status: 500 });
  }
}
