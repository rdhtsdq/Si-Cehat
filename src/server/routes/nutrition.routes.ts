import { Hono } from "hono";
import { z } from "zod";
import { and, asc, eq, ilike, or } from "drizzle-orm";
import { drizzleDb } from "../db";
import {
  children,
  detailedFoodLogs,
  foodItems,
  nutritionTargets,
} from "../db/schema";
import { getSession } from "../middleware/auth";
import {
  getDefaultTarget,
  matchFoodName,
  normalizeNutritionTotals,
  nutritionDifference,
  percentOf,
  scaleNutrition,
  sumNutrition,
  type NutritionValues,
} from "../services/nutrition";

export const nutritionRoutes = new Hono();

type FoodRow = typeof foodItems.$inferSelect;

function toNutritionValues(food: FoodRow): NutritionValues {
  return {
    caloriesKkal: food.caloriesKkal,
    carbsGram: food.carbsGram,
    proteinGram: food.proteinGram,
    fatGram: food.fatGram,
    sugarGram: food.sugarGram,
    fiberGram: food.fiberGram,
  };
}

function toFoodJson(food: FoodRow) {
  return {
    id: food.id,
    name: food.name,
    aliases: food.aliases,
    category: food.category,
    caloriesKkal: food.caloriesKkal,
    carbsGram: food.carbsGram,
    proteinGram: food.proteinGram,
    fatGram: food.fatGram,
    sugarGram: food.sugarGram,
    fiberGram: food.fiberGram,
    portionDescription: food.portionDescription,
  };
}

export function ageInYears(birthDate: Date | null): number {
  if (!birthDate) return 8;
  const now = new Date();
  let age = now.getUTCFullYear() - birthDate.getUTCFullYear();
  const beforeBirthday =
    now.getUTCMonth() < birthDate.getUTCMonth() ||
    (now.getUTCMonth() === birthDate.getUTCMonth() &&
      now.getUTCDate() < birthDate.getUTCDate());
  if (beforeBirthday) age -= 1;
  return Math.max(1, Math.min(18, age));
}

export async function resolveFoodItem(input: {
  foodId?: string;
  foodName?: string;
}): Promise<FoodRow | null> {
  if (input.foodId) {
    const [byId] = await drizzleDb
      .select()
      .from(foodItems)
      .where(and(eq(foodItems.id, input.foodId), eq(foodItems.isActive, true)))
      .limit(1);
    if (byId) return byId;
  }

  const all = await drizzleDb
    .select()
    .from(foodItems)
    .where(eq(foodItems.isActive, true))
    .orderBy(asc(foodItems.name));

  const index = matchFoodName(all, input.foodName ?? "");
  return index >= 0 ? all[index] : null;
}

export async function getOrCreateNutritionTarget(
  childId: string
): Promise<NutritionValues> {
  const [existing] = await drizzleDb
    .select()
    .from(nutritionTargets)
    .where(eq(nutritionTargets.childId, childId))
    .limit(1);

  if (existing) {
    return {
      caloriesKkal: existing.caloriesKkal,
      carbsGram: existing.carbsGram,
      proteinGram: existing.proteinGram,
      fatGram: existing.fatGram,
      sugarGram: existing.sugarGram,
      fiberGram: existing.fiberGram,
    };
  }

  const [child] = await drizzleDb
    .select({ birthDate: children.birthDate })
    .from(children)
    .where(eq(children.id, childId))
    .limit(1);

  const defaults = getDefaultTarget(ageInYears(child?.birthDate ?? null));

  const [created] = await drizzleDb
    .insert(nutritionTargets)
    .values({
      childId,
      caloriesKkal: defaults.caloriesKkal,
      carbsGram: defaults.carbsGram,
      proteinGram: defaults.proteinGram,
      fatGram: defaults.fatGram,
      sugarGram: defaults.sugarGram,
      fiberGram: defaults.fiberGram,
      source: "AKG",
    })
    .returning();

  return {
    caloriesKkal: created.caloriesKkal,
    carbsGram: created.carbsGram,
    proteinGram: created.proteinGram,
    fatGram: created.fatGram,
    sugarGram: created.sugarGram,
    fiberGram: created.fiberGram,
  };
}

async function findOwnedChild(childId: string, guardianId: string, role: string) {
  const [child] = await drizzleDb
    .select({ id: children.id, guardianId: children.guardianId })
    .from(children)
    .where(eq(children.id, childId))
    .limit(1);

  if (!child) return { error: "not_found" as const };
  if (role !== "ADMIN" && child.guardianId !== guardianId) {
    return { error: "forbidden" as const };
  }
  return { child };
}

// GET /api/nutrition/foods
nutritionRoutes.get("/nutrition/foods", async (c) => {
  const search = c.req.query("search")?.trim();
  const category = c.req.query("category")?.trim();
  const requestedLimit = Number.parseInt(c.req.query("limit") ?? "100", 10);
  const limit = Math.min(
    200,
    Math.max(1, Number.isFinite(requestedLimit) ? requestedLimit : 100)
  );

  try {
    const conditions = [eq(foodItems.isActive, true)];
    if (category) conditions.push(eq(foodItems.category, category));
    if (search) {
      conditions.push(
        or(
          ilike(foodItems.name, `%${search}%`),
          ilike(foodItems.aliases, `%${search}%`)
        )!
      );
    }

    const foods = await drizzleDb
      .select()
      .from(foodItems)
      .where(and(...conditions))
      .orderBy(asc(foodItems.name))
      .limit(limit);

    return c.json({ foods: foods.map(toFoodJson) });
  } catch (error) {
    console.error("Get nutrition foods error:", error);
    return c.json(
      { error: { message: "Gagal memuat katalog makanan." } },
      500
    );
  }
});
