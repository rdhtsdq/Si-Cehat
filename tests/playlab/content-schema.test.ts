import { describe, expect, it } from "bun:test";
import contentData from "../../src/client/playlab/content/healthy-plate/v1.json";

describe("Content & Rules Schema v1.0.0", () => {
  it("contains version and rules metadata", () => {
    expect(contentData.version).toBe("1.0.0");
    expect(contentData.rulesVersion).toBe("1.0.0");
    expect(contentData.gameSlug).toBe("piring-sehat-nimbo");
  });

  it("contains all 4 balanced meal categories plus distractors", () => {
    const categories = new Set(contentData.foods.map((f: { category: string }) => f.category));
    expect(categories.has("karbo")).toBe(true);
    expect(categories.has("protein")).toBe(true);
    expect(categories.has("sayur")).toBe(true);
    expect(categories.has("buah")).toBe(true);
    expect(categories.has("distractor")).toBe(true);
  });

  it("has non-empty tips for all food items", () => {
    for (const food of contentData.foods) {
      expect(food.tip.length).toBeGreaterThan(10);
      expect(food.name.length).toBeGreaterThan(2);
    }
  });

  it("has valid knowledge assessment questions with exactly one correct answer", () => {
    for (const q of contentData.knowledgeAssessment.questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      const correctOptions = q.options.filter((o: { isCorrect: boolean }) => o.isCorrect);
      expect(correctOptions.length).toBe(1);
    }
  });
});
