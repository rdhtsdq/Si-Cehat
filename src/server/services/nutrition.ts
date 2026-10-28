export interface NutritionValues {
  caloriesKkal: number;
  carbsGram: number;
  proteinGram: number;
  fatGram: number;
  sugarGram: number;
  fiberGram: number;
}

export const ZERO_NUTRITION: NutritionValues = {
  caloriesKkal: 0,
  carbsGram: 0,
  proteinGram: 0,
  fatGram: 0,
  sugarGram: 0,
  fiberGram: 0,
};

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Nutrition values in the catalog are per 100 g. */
export function scaleNutrition(
  food: NutritionValues,
  weightGram: number
): NutritionValues {
  const grams =
    Number.isFinite(weightGram) && weightGram > 0 ? weightGram : 0;
  const multiplier = grams / 100;

  return {
    caloriesKkal: Math.round(food.caloriesKkal * multiplier),
    carbsGram: round1(food.carbsGram * multiplier),
    proteinGram: round1(food.proteinGram * multiplier),
    fatGram: round1(food.fatGram * multiplier),
    sugarGram: round1(food.sugarGram * multiplier),
    fiberGram: round1(food.fiberGram * multiplier),
  };
}

export function sumNutrition(items: NutritionValues[]): NutritionValues {
  return items.reduce<NutritionValues>(
    (total, item) => ({
      caloriesKkal: total.caloriesKkal + item.caloriesKkal,
      carbsGram: total.carbsGram + item.carbsGram,
      proteinGram: total.proteinGram + item.proteinGram,
      fatGram: total.fatGram + item.fatGram,
      sugarGram: total.sugarGram + item.sugarGram,
      fiberGram: total.fiberGram + item.fiberGram,
    }),
    { ...ZERO_NUTRITION }
  );
}

export function normalizeNutritionTotals(
  totals: NutritionValues
): NutritionValues {
  return {
    caloriesKkal: Math.round(totals.caloriesKkal),
    carbsGram: round1(totals.carbsGram),
    proteinGram: round1(totals.proteinGram),
    fatGram: round1(totals.fatGram),
    sugarGram: round1(totals.sugarGram),
    fiberGram: round1(totals.fiberGram),
  };
}

/** Remaining amount for each nutrient, never negative. */
export function nutritionDifference(
  target: NutritionValues,
  total: NutritionValues
): NutritionValues {
  return {
    caloriesKkal: Math.max(0, Math.round(target.caloriesKkal - total.caloriesKkal)),
    carbsGram: Math.max(0, round1(target.carbsGram - total.carbsGram)),
    proteinGram: Math.max(0, round1(target.proteinGram - total.proteinGram)),
    fatGram: Math.max(0, round1(target.fatGram - total.fatGram)),
    sugarGram: Math.max(0, round1(target.sugarGram - total.sugarGram)),
    fiberGram: Math.max(0, round1(target.fiberGram - total.fiberGram)),
  };
}

export function percentOf(total: number, target: number): number | null {
  if (!Number.isFinite(target) || target <= 0) return null;
  return Math.min(999, Math.round((total / target) * 100));
}

/**
 * Illustrative AKG-style defaults for children. These are educational values
 * and are intentionally editable per child.
 */
export function getDefaultTarget(ageYears: number): NutritionValues {
  if (ageYears < 7) {
    return {
      caloriesKkal: 1600,
      carbsGram: 220,
      proteinGram: 40,
      fatGram: 55,
      sugarGram: 25,
      fiberGram: 22,
    };
  }
  if (ageYears < 10) {
    return {
      caloriesKkal: 1650,
      carbsGram: 250,
      proteinGram: 45,
      fatGram: 55,
      sugarGram: 25,
      fiberGram: 23,
    };
  }
  return {
    caloriesKkal: 2000,
    carbsGram: 300,
    proteinGram: 50,
    fatGram: 65,
    sugarGram: 25,
    fiberGram: 28,
  };
}

export function normalizeFoodName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export interface FoodLookup {
  name: string;
  aliases?: string | null;
}

/**
 * Returns the index of the best match, or -1. Deterministic: exact name,
 * exact alias, then substring in either direction.
 */
export function matchFoodName(foods: FoodLookup[], query: string): number {
  const normalized = normalizeFoodName(query);
  if (!normalized) return -1;

  for (let i = 0; i < foods.length; i += 1) {
    if (normalizeFoodName(foods[i].name) === normalized) return i;
  }

  const aliasList = foods.map((food) =>
    (food.aliases ?? "")
      .split(",")
      .map((alias) => normalizeFoodName(alias))
      .filter(Boolean)
  );

  for (let i = 0; i < foods.length; i += 1) {
    if (aliasList[i].includes(normalized)) return i;
  }

  for (let i = 0; i < foods.length; i += 1) {
    const name = normalizeFoodName(foods[i].name);
    if (name.includes(normalized) || normalized.includes(name)) return i;
  }

  for (let i = 0; i < foods.length; i += 1) {
    if (
      aliasList[i].some(
        (alias) => alias.includes(normalized) || normalized.includes(alias)
      )
    ) {
      return i;
    }
  }

  return -1;
}
