import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/adminAuth";

const updateArticleSchema = z.object({
  title: z.string().trim().min(3).optional(),
  slug: z.string().trim().min(3).optional(),
  category: z.enum(["artikel", "makanan", "video"]).optional(),
  readTimeMinutes: z.number().int().min(1).optional(),
  summary: z.string().trim().min(5).optional(),
  content: z.string().trim().min(10).optional(),
  videoUrl: z.string().url().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await verifyAdmin();
  if (!authCheck.authorized) return authCheck.response!;

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = updateArticleSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message || "Data artikel tidak valid." } },
      { status: 400 }
    );
  }

  try {
    const updateData: Record<string, unknown> = {};
    if (parsed.data.title) updateData.title = parsed.data.title;
    if (parsed.data.slug) updateData.slug = parsed.data.slug.toLowerCase().replace(/\s+/g, "-");
    if (parsed.data.category) updateData.category = parsed.data.category;
    if (parsed.data.readTimeMinutes !== undefined) updateData.readTimeMinutes = parsed.data.readTimeMinutes;
    if (parsed.data.summary) updateData.summary = parsed.data.summary;
    if (parsed.data.content) updateData.content = parsed.data.content;
    if (parsed.data.videoUrl !== undefined) updateData.videoUrl = parsed.data.videoUrl;
    if (parsed.data.imageUrl !== undefined) updateData.imageUrl = parsed.data.imageUrl;

    const article = await db.educationArticle.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ article });
  } catch (error) {
    console.error("Admin update article error:", error);
    return NextResponse.json({ error: { message: "Gagal memperbarui artikel edukasi." } }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await verifyAdmin();
  if (!authCheck.authorized) return authCheck.response!;

  const { id } = await params;

  try {
    await db.educationArticle.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Artikel berhasil dihapus." });
  } catch (error) {
    console.error("Admin delete article error:", error);
    return NextResponse.json({ error: { message: "Gagal menghapus artikel edukasi." } }, { status: 500 });
  }
}
