import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/adminAuth";

const updateRecipeSchema = z.object({
  title: z.string().trim().min(3).optional(),
  category: z.enum(["makanan", "minuman", "camilan"]).optional(),
  description: z.string().trim().min(5).optional(),
  caloriesKkal: z.number().int().min(0).optional(),
  carbsGram: z.number().min(0).optional(),
  proteinGram: z.number().min(0).optional(),
  fatGram: z.number().min(0).optional(),
  fiberGram: z.number().min(0).optional(),
  sugarGram: z.number().min(0).optional(),
  ingredients: z.array(z.string()).optional(),
  instructions: z.array(z.string()).optional(),
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
  const parsed = updateRecipeSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message || "Data resep tidak valid." } },
      { status: 400 }
    );
  }

  try {
    const updateData: Record<string, unknown> = {};
    if (parsed.data.title) updateData.title = parsed.data.title;
    if (parsed.data.category) updateData.category = parsed.data.category;
    if (parsed.data.description) updateData.description = parsed.data.description;
    if (parsed.data.caloriesKkal !== undefined) updateData.caloriesKkal = parsed.data.caloriesKkal;
    if (parsed.data.carbsGram !== undefined) updateData.carbsGram = parsed.data.carbsGram;
    if (parsed.data.proteinGram !== undefined) updateData.proteinGram = parsed.data.proteinGram;
    if (parsed.data.fatGram !== undefined) updateData.fatGram = parsed.data.fatGram;
    if (parsed.data.fiberGram !== undefined) updateData.fiberGram = parsed.data.fiberGram;
    if (parsed.data.sugarGram !== undefined) updateData.sugarGram = parsed.data.sugarGram;
    if (parsed.data.ingredients) updateData.ingredients = JSON.stringify(parsed.data.ingredients);
    if (parsed.data.instructions) updateData.instructions = JSON.stringify(parsed.data.instructions);
    if (parsed.data.imageUrl !== undefined) updateData.imageUrl = parsed.data.imageUrl;

    const recipe = await db.recipe.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ recipe });
  } catch (error) {
    console.error("Admin update recipe error:", error);
    return NextResponse.json({ error: { message: "Gagal memperbarui resep." } }, { status: 500 });
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
    await db.recipe.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Resep berhasil dihapus." });
  } catch (error) {
    console.error("Admin delete recipe error:", error);
    return NextResponse.json({ error: { message: "Gagal menghapus resep." } }, { status: 500 });
  }
}
