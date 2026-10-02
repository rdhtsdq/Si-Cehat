import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/adminAuth";

const recipeSchema = z.object({
  title: z.string().trim().min(3),
  category: z.enum(["makanan", "minuman", "camilan"]).default("makanan"),
  description: z.string().trim().min(5),
  caloriesKkal: z.number().int().min(0).default(150),
  carbsGram: z.number().min(0).default(20),
  proteinGram: z.number().min(0).default(8),
  fatGram: z.number().min(0).default(4),
  fiberGram: z.number().min(0).default(4),
  sugarGram: z.number().min(0).default(2),
  ingredients: z.array(z.string()).min(1),
  instructions: z.array(z.string()).min(1),
  imageUrl: z.string().url().optional().nullable(),
});

export async function GET() {
  const authCheck = await verifyAdmin();
  if (!authCheck.authorized) return authCheck.response!;

  try {
    const recipes = await db.recipe.findMany({
      orderBy: { createdAt: "desc" },
    });

    const parsed = recipes.map((r) => {
      let ingredientsList: string[] = [];
      let instructionsList: string[] = [];
      try {
        ingredientsList = JSON.parse(r.ingredients);
      } catch {
        ingredientsList = [r.ingredients];
      }
      try {
        instructionsList = JSON.parse(r.instructions);
      } catch {
        instructionsList = [r.instructions];
      }
      return {
        ...r,
        ingredients: ingredientsList,
        instructions: instructionsList,
      };
    });

    return NextResponse.json({ recipes: parsed });
  } catch (error) {
    console.error("Admin get recipes error:", error);
    return NextResponse.json({ error: { message: "Gagal memuat daftar resep." } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authCheck = await verifyAdmin();
  if (!authCheck.authorized) return authCheck.response!;

  const json = await request.json().catch(() => null);
  const parsed = recipeSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message || "Data resep tidak valid." } },
      { status: 400 }
    );
  }

  try {
    const recipe = await db.recipe.create({
      data: {
        title: parsed.data.title,
        category: parsed.data.category,
        description: parsed.data.description,
        caloriesKkal: parsed.data.caloriesKkal,
        carbsGram: parsed.data.carbsGram,
        proteinGram: parsed.data.proteinGram,
        fatGram: parsed.data.fatGram,
        fiberGram: parsed.data.fiberGram,
        sugarGram: parsed.data.sugarGram,
        ingredients: JSON.stringify(parsed.data.ingredients),
        instructions: JSON.stringify(parsed.data.instructions),
        imageUrl: parsed.data.imageUrl,
      },
    });

    return NextResponse.json({ recipe }, { status: 201 });
  } catch (error) {
    console.error("Admin create recipe error:", error);
    return NextResponse.json({ error: { message: "Gagal menyimpan resep." } }, { status: 500 });
  }
}
