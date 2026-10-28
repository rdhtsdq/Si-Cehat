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
    .select({
      id: children.id,
      guardianId: children.guardianId,
      birthDate: children.birthDate,
    })
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

const GENERIC_FOOD: NutritionValues = {
  caloriesKkal: 120,
  carbsGram: 15,
  proteinGram: 5,
  fatGram: 4,
  sugarGram: 3,
  fiberGram: 2,
};

const calculateSchema = z
  .object({
    foodId: z.string().trim().optional(),
    foodName: z.string().trim().min(2).optional(),
    weightGram: z.number().min(0).max(5000).optional(),
    portionGram: z.number().min(0).max(5000).optional(),
  })
  .refine((data) => Boolean(data.foodId || data.foodName), {
    message: "foodId atau foodName wajib diisi.",
  });

// POST /api/nutrition/calculate (backward compatible)
nutritionRoutes.post("/nutrition/calculate", async (c) => {
  const json = await c.req.json().catch(() => null);
  const parsed = calculateSchema.safeParse(json);

  if (!parsed.success) {
    return c.json(
      {
        error: {
          message:
            parsed.error.issues[0]?.message ||
            "Input nama bahan atau berat tidak valid.",
        },
      },
      400
    );
  }

  const { foodId, foodName, weightGram, portionGram } = parsed.data;
  const grams = weightGram ?? portionGram ?? 100;

  try {
    const food = await resolveFoodItem({ foodId, foodName });
    const values = scaleNutrition(
      food ? toNutritionValues(food) : GENERIC_FOOD,
      grams
    );

    return c.json({
      foodId: food?.id,
      foodName: food?.name ?? foodName,
      weightGram: grams,
      ...values,
      note: food
        ? "Dihitung berdasarkan data komposisi pangan dan porsi takaran."
        : "Perkiraan umum karena makanan tidak ditemukan di katalog.",
      isEstimate: !food,
    });
  } catch (error) {
    console.error("Calculate nutrition error:", error);
    return c.json(
      { error: { message: "Gagal menghitung nilai gizi." } },
      500
    );
  }
});

const batchItemSchema = z
  .object({
    foodId: z.string().trim().optional(),
    foodName: z.string().trim().min(2).optional(),
    weightGram: z.number().min(0).max(5000).optional(),
  })
  .refine((data) => Boolean(data.foodId || data.foodName), {
    message: "foodId atau foodName wajib diisi.",
  });

const batchSchema = z.object({
  childId: z.string().uuid().optional(),
  items: z.array(batchItemSchema).min(1).max(50),
});

// POST /api/nutrition/calculate-batch
nutritionRoutes.post("/nutrition/calculate-batch", async (c) => {
  const json = await c.req.json().catch(() => null);
  const parsed = batchSchema.safeParse(json);

  if (!parsed.success) {
    return c.json(
      {
        error: {
          message:
            parsed.error.issues[0]?.message || "Daftar makanan tidak valid.",
        },
      },
      400
    );
  }

  const session = await getSession(c);
  const { childId, items } = parsed.data;

  let target: NutritionValues | null = null;
  let ownedChildId: string | null = null;

  if (childId && session?.user?.id) {
    const ownership = await findOwnedChild(
      childId,
      session.user.id,
      session.user.role
    );
    if ("error" in ownership) {
      return c.json(
        {
          error: {
            message:
              ownership.error === "not_found"
                ? "Data anak tidak ditemukan."
                : "Akses ditolak.",
          },
        },
        ownership.error === "not_found" ? 404 : 403
      );
    }
    ownedChildId = ownership.child.id;
    target = await getOrCreateNutritionTarget(ownedChildId);
  }

  try {
    const results = await Promise.all(
      items.map(async (item) => {
        const food = await resolveFoodItem(item);
        const grams = item.weightGram ?? 100;
        const values = scaleNutrition(
          food ? toNutritionValues(food) : GENERIC_FOOD,
          grams
        );
        return {
          foodId: food?.id,
          foodName: food?.name ?? item.foodName,
          weightGram: grams,
          ...values,
          isEstimate: !food,
        };
      })
    );

    const totals = normalizeNutritionTotals(
      sumNutrition(
        results.map((item) => ({
          caloriesKkal: item.caloriesKkal,
          carbsGram: item.carbsGram,
          proteinGram: item.proteinGram,
          fatGram: item.fatGram,
          sugarGram: item.sugarGram,
          fiberGram: item.fiberGram,
        }))
      )
    );

    const percent = target
      ? {
          caloriesKkal: percentOf(totals.caloriesKkal, target.caloriesKkal),
          carbsGram: percentOf(totals.carbsGram, target.carbsGram),
          proteinGram: percentOf(totals.proteinGram, target.proteinGram),
          fatGram: percentOf(totals.fatGram, target.fatGram),
          sugarGram: percentOf(totals.sugarGram, target.sugarGram),
          fiberGram: percentOf(totals.fiberGram, target.fiberGram),
        }
      : null;

    return c.json({ items: results, totals, target, percent });
  } catch (error) {
    console.error("Calculate nutrition batch error:", error);
    return c.json(
      { error: { message: "Gagal menghitung total nilai gizi." } },
      500
    );
  }
});

// GET /api/nutrition/target
nutritionRoutes.get("/nutrition/target", async (c) => {
  const session = await getSession(c);
  if (!session?.user?.id) {
    return c.json({ error: { message: "Harus login terlebih dahulu." } }, 401);
  }

  const childId = c.req.query("childId");
  if (!childId) {
    return c.json({ error: { message: "childId harus disertakan." } }, 400);
  }

  const ownership = await findOwnedChild(
    childId,
    session.user.id,
    session.user.role
  );
  if ("error" in ownership) {
    return c.json(
      {
        error: {
          message:
            ownership.error === "not_found"
              ? "Data anak tidak ditemukan."
              : "Akses ditolak.",
        },
      },
      ownership.error === "not_found" ? 404 : 403
    );
  }

  const target = await getOrCreateNutritionTarget(childId);
  const defaults = getDefaultTarget(ageInYears(ownership.child.birthDate));

  return c.json({ target, defaults });
});

const summaryQuerySchema = z.object({
  childId: z.string().uuid(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

// GET /api/nutrition/summary
nutritionRoutes.get("/nutrition/summary", async (c) => {
  const session = await getSession(c);
  if (!session?.user?.id) {
    return c.json({ error: { message: "Harus login terlebih dahulu." } }, 401);
  }

  const parsed = summaryQuerySchema.safeParse({
    childId: c.req.query("childId"),
    date: c.req.query("date") || undefined,
  });
  if (!parsed.success) {
    return c.json(
      {
        error: {
          message:
            parsed.error.issues[0]?.message ||
            "Parameter ringkasan tidak valid.",
        },
      },
      400
    );
  }

  const { childId, date } = parsed.data;
  const ownership = await findOwnedChild(
    childId,
    session.user.id,
    session.user.role
  );
  if ("error" in ownership) {
    return c.json(
      {
        error: {
          message:
            ownership.error === "not_found"
              ? "Data anak tidak ditemukan."
              : "Akses ditolak.",
        },
      },
      ownership.error === "not_found" ? 404 : 403
    );
  }

  const dateStr = date ?? new Date().toISOString().slice(0, 10);
  const targetDate = new Date(`${dateStr}T00:00:00.000Z`);

  try {
    const entries = await drizzleDb
      .select()
      .from(detailedFoodLogs)
      .where(
        and(
          eq(detailedFoodLogs.childId, childId),
          eq(detailedFoodLogs.date, targetDate)
        )
      )
      .orderBy(asc(detailedFoodLogs.createdAt));

    const totals = normalizeNutritionTotals(
      sumNutrition(
        entries.map((entry) => ({
          caloriesKkal: entry.caloriesKkal ?? 0,
          carbsGram: entry.carbsGram ?? 0,
          proteinGram: entry.proteinGram ?? 0,
          fatGram: entry.fatGram ?? 0,
          sugarGram: entry.sugarGram ?? 0,
          fiberGram: entry.fiberGram ?? 0,
        }))
      )
    );

    const target = await getOrCreateNutritionTarget(childId);
    const remaining = nutritionDifference(target, totals);

    return c.json({
      date: dateStr,
      childId,
      entries: entries.map((entry) => ({
        id: entry.id,
        foodItemId: entry.foodItemId,
        mealSlot: entry.mealSlot,
        foodName: entry.foodName,
        portion: entry.portion,
        caloriesKkal: entry.caloriesKkal ?? 0,
        carbsGram: entry.carbsGram ?? 0,
        proteinGram: entry.proteinGram ?? 0,
        fatGram: entry.fatGram ?? 0,
        sugarGram: entry.sugarGram ?? 0,
        fiberGram: entry.fiberGram ?? 0,
        createdAt: entry.createdAt,
      })),
      totals,
      target,
      remaining,
      percent: {
        caloriesKkal: percentOf(totals.caloriesKkal, target.caloriesKkal),
        carbsGram: percentOf(totals.carbsGram, target.carbsGram),
        proteinGram: percentOf(totals.proteinGram, target.proteinGram),
        fatGram: percentOf(totals.fatGram, target.fatGram),
        sugarGram: percentOf(totals.sugarGram, target.sugarGram),
        fiberGram: percentOf(totals.fiberGram, target.fiberGram),
      },
    });
  } catch (error) {
    console.error("Get nutrition summary error:", error);
    return c.json(
      { error: { message: "Gagal memuat ringkasan gizi harian." } },
      500
    );
  }
});

const targetSchema = z.object({
  childId: z.string().uuid(),
  caloriesKkal: z.number().int().min(0).max(5000),
  carbsGram: z.number().min(0).max(1000),
  proteinGram: z.number().min(0).max(1000),
  fatGram: z.number().min(0).max(1000),
  sugarGram: z.number().min(0).max(1000),
  fiberGram: z.number().min(0).max(1000),
});

// PUT /api/nutrition/target
nutritionRoutes.put("/nutrition/target", async (c) => {
  const session = await getSession(c);
  if (!session?.user?.id) {
    return c.json({ error: { message: "Harus login terlebih dahulu." } }, 401);
  }

  const json = await c.req.json().catch(() => null);
  const parsed = targetSchema.safeParse(json);
  if (!parsed.success) {
    return c.json(
      {
        error: {
          message:
            parsed.error.issues[0]?.message || "Target nutrisi tidak valid.",
        },
      },
      400
    );
  }

  const { childId, ...values } = parsed.data;
  const ownership = await findOwnedChild(
    childId,
    session.user.id,
    session.user.role
  );
  if ("error" in ownership) {
    return c.json(
      {
        error: {
          message:
            ownership.error === "not_found"
              ? "Data anak tidak ditemukan."
              : "Akses ditolak.",
        },
      },
      ownership.error === "not_found" ? 404 : 403
    );
  }

  try {
    const [existing] = await drizzleDb
      .select({ id: nutritionTargets.id })
      .from(nutritionTargets)
      .where(eq(nutritionTargets.childId, childId))
      .limit(1);

    if (existing) {
      await drizzleDb
        .update(nutritionTargets)
        .set({ ...values, source: "MANUAL", updatedAt: new Date() })
        .where(eq(nutritionTargets.id, existing.id));
    } else {
      await drizzleDb.insert(nutritionTargets).values({
        childId,
        ...values,
        source: "MANUAL",
      });
    }

    const target = await getOrCreateNutritionTarget(childId);
    return c.json({ success: true, target });
  } catch (error) {
    console.error("Update nutrition target error:", error);
    return c.json(
      { error: { message: "Gagal menyimpan target nutrisi." } },
      500
    );
  }
});
