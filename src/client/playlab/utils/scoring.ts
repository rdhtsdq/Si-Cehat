import { FoodItem } from "../content/types";

export interface PlateSelection {
  karbo: FoodItem | null;
  protein: FoodItem | null;
  sayur: FoodItem | null;
  buah: FoodItem | null;
}

export interface PreviewScoreResult {
  gameplayScore: number;
  knowledgeScore: number;
  totalScore: number;
  starsEarned: number;
  isComplete: boolean;
  hasDistractor: boolean;
}

/**
 * Deterministic preview computation of gameplay score from the plate composition
 */
export function calculateGameplayScore(plate: PlateSelection, distractorCount: number = 0): PreviewScoreResult {
  let filledSlots = 0;
  if (plate.karbo && plate.karbo.isHealthy) filledSlots++;
  if (plate.protein && plate.protein.isHealthy) filledSlots++;
  if (plate.sayur && plate.sayur.isHealthy) filledSlots++;
  if (plate.buah && plate.buah.isHealthy) filledSlots++;

  // 25 points per correct quadrant
  let gameplayScore = filledSlots * 25;

  // Deduct 15 points per distractor placed, minimum 0
  if (distractorCount > 0) {
    gameplayScore = Math.max(0, gameplayScore - distractorCount * 15);
  }

  const isComplete = filledSlots === 4 && distractorCount === 0;

  // Stars: 3 stars if 100%, 2 stars if >= 75%, 1 star otherwise
  let starsEarned = 1;
  if (gameplayScore >= 90) starsEarned = 3;
  else if (gameplayScore >= 60) starsEarned = 2;

  return {
    gameplayScore,
    knowledgeScore: 0,
    totalScore: gameplayScore,
    starsEarned,
    isComplete,
    hasDistractor: distractorCount > 0,
  };
}

/**
 * Deterministic score for knowledge questions
 */
export function calculateKnowledgeScore(answers: { isCorrect: boolean }[]): number {
  if (answers.length === 0) return 0;
  const correctCount = answers.filter((a) => a.isCorrect).length;
  return Math.round((correctCount / answers.length) * 100);
}
