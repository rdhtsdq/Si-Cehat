import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/adminAuth";

const articleSchema = z.object({
  title: z.string().trim().min(3),
  slug: z.string().trim().min(3),
  category: z.enum(["artikel", "makanan", "video"]).default("artikel"),
  readTimeMinutes: z.number().int().min(1).default(3),
  summary: z.string().trim().min(5),
  content: z.string().trim().min(10),
  videoUrl: z.string().url().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
});

export async function GET() {
  const authCheck = await verifyAdmin();
  if (!authCheck.authorized) return authCheck.response!;

  try {
    const articles = await db.educationArticle.findMany({
      orderBy: { publishedAt: "desc" },
    });

    return NextResponse.json({ articles });
  } catch (error) {
    console.error("Admin get education articles error:", error);
    return NextResponse.json({ error: { message: "Gagal memuat materi edukasi." } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authCheck = await verifyAdmin();
  if (!authCheck.authorized) return authCheck.response!;

  const json = await request.json().catch(() => null);
  const parsed = articleSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message || "Data artikel tidak valid." } },
      { status: 400 }
    );
  }

  try {
    const article = await db.educationArticle.create({
      data: {
        title: parsed.data.title,
        slug: parsed.data.slug.toLowerCase().replace(/\s+/g, "-"),
        category: parsed.data.category,
        readTimeMinutes: parsed.data.readTimeMinutes,
        summary: parsed.data.summary,
        content: parsed.data.content,
        videoUrl: parsed.data.videoUrl,
        imageUrl: parsed.data.imageUrl,
      },
    });

    return NextResponse.json({ article }, { status: 201 });
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "P2002") {
      return NextResponse.json({ error: { message: "Slug artikel sudah digunakan." } }, { status: 409 });
    }
    console.error("Admin create education article error:", error);
    return NextResponse.json({ error: { message: "Gagal menyimpan artikel edukasi." } }, { status: 500 });
  }
}
