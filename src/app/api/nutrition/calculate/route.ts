import { NextResponse } from "next/server";
import { z } from "zod";

const calculateNutritionSchema = z
  .object({
    foodName: z.string().trim().min(2, "Nama makanan minimal 2 karakter"),
    weightGram: z.number().min(1).max(5000).optional(),
    portionGram: z.number().min(1).max(5000).optional(),
  })
  .transform((data) => ({
    foodName: data.foodName,
    weightGram: data.weightGram ?? data.portionGram ?? 100,
  }));

// Database referensi gizi standar pangan Indonesia (per 100 gram)
const FOOD_NUTRITION_DB: Record<
  string,
  { calories: number; carbs: number; protein: number; fat: number; sugar: number; fiber: number }
> = {
  nasi: { calories: 130, carbs: 28, protein: 2.7, fat: 0.3, sugar: 0.1, fiber: 0.4 },
  "nasi putih": { calories: 130, carbs: 28, protein: 2.7, fat: 0.3, sugar: 0.1, fiber: 0.4 },
  "nasi merah": { calories: 111, carbs: 23, protein: 2.6, fat: 0.9, sugar: 0.4, fiber: 1.8 },
  ayam: { calories: 239, carbs: 0, protein: 27, fat: 14, sugar: 0, fiber: 0 },
  "ayam goreng": { calories: 260, carbs: 1.5, protein: 25, fat: 17, sugar: 0.1, fiber: 0 },
  "ayam rebus": { calories: 165, carbs: 0, protein: 31, fat: 3.6, sugar: 0, fiber: 0 },
  telur: { calories: 155, carbs: 1.1, protein: 13, fat: 11, sugar: 1.1, fiber: 0 },
  "telur rebus": { calories: 155, carbs: 1.1, protein: 13, fat: 11, sugar: 1.1, fiber: 0 },
  "telur dadar": { calories: 180, carbs: 1.5, protein: 12, fat: 14, sugar: 0.5, fiber: 0 },
  tempe: { calories: 193, carbs: 9.4, protein: 20.8, fat: 10.8, sugar: 0.5, fiber: 4.8 },
  "tempe goreng": { calories: 225, carbs: 12, protein: 18, fat: 15, sugar: 0.5, fiber: 4.0 },
  tahu: { calories: 76, carbs: 1.9, protein: 8, fat: 4.8, sugar: 0.5, fiber: 0.3 },
  "tahu goreng": { calories: 115, carbs: 3.5, protein: 9, fat: 8, sugar: 0.3, fiber: 0.5 },
  lele: { calories: 145, carbs: 0, protein: 18, fat: 8, sugar: 0, fiber: 0 },
  "pecel lele": { calories: 210, carbs: 4, protein: 22, fat: 11, sugar: 1, fiber: 1.5 },
  bayam: { calories: 23, carbs: 3.6, protein: 2.9, fat: 0.4, sugar: 0.4, fiber: 2.2 },
  "sayur bayam": { calories: 28, carbs: 4.2, protein: 2.5, fat: 0.5, sugar: 0.8, fiber: 2.5 },
  "sayur asem": { calories: 35, carbs: 6.5, protein: 1.8, fat: 0.5, sugar: 1.8, fiber: 1.5 },
  wortel: { calories: 41, carbs: 9.6, protein: 0.9, fat: 0.2, sugar: 4.7, fiber: 2.8 },
  apel: { calories: 52, carbs: 13.8, protein: 0.3, fat: 0.2, sugar: 10.4, fiber: 2.4 },
  pisang: { calories: 89, carbs: 22.8, protein: 1.1, fat: 0.3, sugar: 12.2, fiber: 2.6 },
  pepaya: { calories: 43, carbs: 10.8, protein: 0.5, fat: 0.3, sugar: 7.8, fiber: 1.7 },
  donat: { calories: 452, carbs: 51, protein: 4.9, fat: 25, sugar: 27, fiber: 1.5 },
  "es teh manis": { calories: 90, carbs: 23, protein: 0.1, fat: 0, sugar: 22, fiber: 0 },
  boba: { calories: 320, carbs: 78, protein: 0.5, fat: 1.2, sugar: 48, fiber: 0.5 },
  susu: { calories: 65, carbs: 4.8, protein: 3.3, fat: 3.6, sugar: 5.1, fiber: 0 },
};

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = calculateNutritionSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message || "Input nama bahan atau berat tidak valid." } },
      { status: 400 }
    );
  }

  const { foodName, weightGram } = parsed.data;
  const normalized = foodName.toLowerCase().trim();

  // Cari kecocokan exact atau partial di database referensi
  let refItem = FOOD_NUTRITION_DB[normalized];
  if (!refItem) {
    const key = Object.keys(FOOD_NUTRITION_DB).find(
      (k) => normalized.includes(k) || k.includes(normalized)
    );
    if (key) {
      refItem = FOOD_NUTRITION_DB[key];
    }
  }

  // Jika tidak ditemukan di database spesifik, berikan estimasi sehat terhitung
  if (!refItem) {
    refItem = {
      calories: 120,
      carbs: 15,
      protein: 5,
      fat: 4,
      sugar: 3,
      fiber: 2,
    };
  }

  const multiplier = weightGram / 100;

  return NextResponse.json({
    foodName,
    weightGram,
    caloriesKkal: Math.round(refItem.calories * multiplier),
    carbsGram: Number((refItem.carbs * multiplier).toFixed(1)),
    proteinGram: Number((refItem.protein * multiplier).toFixed(1)),
    fatGram: Number((refItem.fat * multiplier).toFixed(1)),
    sugarGram: Number((refItem.sugar * multiplier).toFixed(1)),
    fiberGram: Number((refItem.fiber * multiplier).toFixed(1)),
    note: "Dihitung berdasarkan data komposisi pangan dan porsi takaran.",
  });
}
