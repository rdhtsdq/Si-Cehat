import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const createArticleSchema = z.object({
  title: z.string().trim().min(3),
  slug: z.string().trim().min(3),
  category: z.enum(["artikel", "makanan", "video"]).default("artikel"),
  readTimeMinutes: z.number().int().min(1).default(3),
  summary: z.string().trim().min(5),
  content: z.string().trim().min(10),
  videoUrl: z.string().url().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
  const skip = (page - 1) * limit;

  try {
    const where: Prisma.EducationArticleWhereInput = {};
    if (category && category !== "semua") {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { summary: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, articles] = await Promise.all([
      db.educationArticle.count({ where }),
      db.educationArticle.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data: articles,
    });
  } catch (error) {
    console.error("Get education articles error:", error);
    return NextResponse.json(
      { error: { message: "Gagal memuat materi edukasi kesehatan." } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { message: "Harus login untuk menambah artikel edukasi." } },
      { status: 401 }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = createArticleSchema.safeParse(json);

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
        slug: parsed.data.slug,
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
      return NextResponse.json(
        { error: { message: "Slug artikel sudah digunakan." } },
        { status: 409 }
      );
    }
    console.error("Create education article error:", error);
    return NextResponse.json(
      { error: { message: "Gagal menyimpan artikel edukasi." } },
      { status: 500 }
    );
  }
}
