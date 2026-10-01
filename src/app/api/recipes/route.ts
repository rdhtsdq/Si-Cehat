import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");

  try {
    const whereClause: {
      category?: string;
      title?: { contains: string; mode: "insensitive" };
    } = {};

    if (category && category !== "semua") {
      whereClause.category = category.toLowerCase();
    }

    if (search && search.trim().length > 0) {
      whereClause.title = { contains: search.trim(), mode: "insensitive" };
    }

    const recipes = await db.recipe.findMany({
      where: whereClause,
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        category: true,
        description: true,
        caloriesKkal: true,
        carbsGram: true,
        proteinGram: true,
        fatGram: true,
        fiberGram: true,
        sugarGram: true,
        imageUrl: true,
      },
    });

    return NextResponse.json({
      recipes,
      total: recipes.length,
    });
  } catch (error) {
    console.error("Get recipes error:", error);
    return NextResponse.json({ error: { message: "Gagal memuat resep sehat tradisional." } }, { status: 500 });
  }
}
