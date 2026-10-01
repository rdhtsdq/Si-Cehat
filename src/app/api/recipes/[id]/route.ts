import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const recipe = await db.recipe.findUnique({
      where: { id },
    });

    if (!recipe) {
      return NextResponse.json({ error: { message: "Resep tidak ditemukan." } }, { status: 404 });
    }

    let ingredientsList: string[] = [];
    let instructionsList: string[] = [];

    try {
      ingredientsList = JSON.parse(recipe.ingredients);
    } catch {
      ingredientsList = [recipe.ingredients];
    }

    try {
      instructionsList = JSON.parse(recipe.instructions);
    } catch {
      instructionsList = [recipe.instructions];
    }

    return NextResponse.json({
      recipe: {
        id: recipe.id,
        title: recipe.title,
        category: recipe.category,
        description: recipe.description,
        caloriesKkal: recipe.caloriesKkal,
        carbsGram: recipe.carbsGram,
        proteinGram: recipe.proteinGram,
        fatGram: recipe.fatGram,
        fiberGram: recipe.fiberGram,
        sugarGram: recipe.sugarGram,
        imageUrl: recipe.imageUrl,
        ingredients: ingredientsList,
        instructions: instructionsList,
      },
    });
  } catch (error) {
    console.error("Get recipe detail error:", error);
    return NextResponse.json({ error: { message: "Gagal memuat detail resep." } }, { status: 500 });
  }
}
