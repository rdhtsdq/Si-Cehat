import { describe, expect, it } from "bun:test";
import { FOOD_ITEMS_MAP, KNOWLEDGE_KEY } from "../routes/game.routes";

describe("Server-Side PlayLab Game Scoring Rules", () => {
  it("defines all essential food items for balanced Isi Piringku evaluation", () => {
    expect(FOOD_ITEMS_MAP["nasi-merah"].category).toBe("karbo");
    expect(FOOD_ITEMS_MAP["ikan-bakar"].category).toBe("protein");
    expect(FOOD_ITEMS_MAP["bayam-bening"].category).toBe("sayur");
    expect(FOOD_ITEMS_MAP["pisang-barangan"].category).toBe("buah");
    expect(FOOD_ITEMS_MAP["donat-cokelat"].category).toBe("distractor");
    expect(FOOD_ITEMS_MAP["donat-cokelat"].isHealthy).toBe(false);
  });

  it("contains validated knowledge assessment answer keys", () => {
    expect(KNOWLEDGE_KEY["q1_portion"]).toBe("setengah_piring");
    expect(KNOWLEDGE_KEY["q2_drink"]).toBe("air_putih");
    expect(KNOWLEDGE_KEY["q3_sugar"]).toBe("cegah_diabetes");
  });
});
