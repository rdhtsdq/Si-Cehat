import { describe, expect, it } from "bun:test";
import {
  getDefaultTarget,
  matchFoodName,
  normalizeFoodName,
  nutritionDifference,
  percentOf,
  round1,
  scaleNutrition,
  sumNutrition,
  ZERO_NUTRITION,
} from "../services/nutrition";
import { FOOD_SEED } from "../services/food-data";

const NASI = {
  caloriesKkal: 130,
  carbsGram: 28,
  proteinGram: 2.7,
  fatGram: 0.3,
  sugarGram: 0.1,
  fiberGram: 0.4,
};

describe("Nutrition calculation helpers", () => {
  it("scales values per 100 g and rounds calories", () => {
    const scaled = scaleNutrition(NASI, 150);

    expect(scaled).toEqual({
      caloriesKkal: 195,
      carbsGram: 42,
      proteinGram: 4.1,
      fatGram: 0.5,
      sugarGram: 0.2,
      fiberGram: 0.6,
    });
  });

  it("returns zeroes for zero or negative weight", () => {
    expect(scaleNutrition(NASI, 0)).toEqual(ZERO_NUTRITION);
    expect(scaleNutrition(NASI, -10)).toEqual(ZERO_NUTRITION);
  });

  it("sums six nutrient fields and returns zeroes for an empty list", () => {
    expect(sumNutrition([])).toEqual(ZERO_NUTRITION);

    const total = sumNutrition([
      scaleNutrition(NASI, 100),
      scaleNutrition(NASI, 50),
    ]);

    expect(total.caloriesKkal).toBe(195);
    expect(total.carbsGram).toBe(42);
    expect(round1(total.proteinGram)).toBe(4.1);
  });

  it("returns AKG-style defaults by age band", () => {
    expect(getDefaultTarget(5)).toEqual({
      caloriesKkal: 1600,
      carbsGram: 220,
      proteinGram: 40,
      fatGram: 55,
      sugarGram: 25,
      fiberGram: 22,
    });
    expect(getDefaultTarget(8).caloriesKkal).toBe(1650);
    expect(getDefaultTarget(11).caloriesKkal).toBe(2000);
  });

  it("calculates remaining values without going negative", () => {
    const remaining = nutritionDifference(
      { ...ZERO_NUTRITION, caloriesKkal: 100, proteinGram: 10 },
      { ...ZERO_NUTRITION, caloriesKkal: 150, proteinGram: 4 }
    );

    expect(remaining.caloriesKkal).toBe(0);
    expect(remaining.proteinGram).toBe(6);
  });

  it("returns null for a zero target and caps at 999 percent", () => {
    expect(percentOf(0, 0)).toBeNull();
    expect(percentOf(500, 1000)).toBe(50);
    expect(percentOf(20000, 1000)).toBe(999);
  });

  it("normalizes names for matching", () => {
    expect(normalizeFoodName("  Nasi   Putih ")).toBe("nasi putih");
  });
});

describe("Food name matching", () => {
  it("matches exact names, aliases, then substrings deterministically", () => {
    expect(matchFoodName(FOOD_SEED, "nasi putih")).toBe(0);
    expect(matchFoodName(FOOD_SEED, "dada ayam rebus")).toBe(4);
    expect(matchFoodName(FOOD_SEED, "ikan lele panggang")).toBe(12);
    expect(matchFoodName(FOOD_SEED, "nasi")).toBe(0);
  });

  it("returns -1 for an unknown food", () => {
    expect(matchFoodName(FOOD_SEED, "makanan tidak ada")).toBe(-1);
  });

  it("uses the first exact duplicate when the catalog has duplicates", () => {
    const foods = [
      { name: "Nasi Putih", aliases: "nasi" },
      { name: "Nasi Putih", aliases: "nasi putih" },
    ];
    expect(matchFoodName(foods, "nasi putih")).toBe(0);
  });
});
