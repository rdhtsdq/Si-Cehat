import { describe, expect, it } from 'bun:test';
import { calculateGameplayScore, calculateKnowledgeScore, PlateSelection } from '../../src/client/playlab/utils/scoring';
import { FoodItem } from '../../src/client/playlab/content/types';

const mockFood = (id: string, category: 'karbo' | 'protein' | 'sayur' | 'buah', isHealthy: boolean = true): FoodItem => ({
  id,
  name: id,
  iconId: id,
  category,
  isHealthy,
  color: '#fff',
  tip: 'tip',
});

describe('Piring Sehat Nimbo Scoring Logic', () => {
  it('calculates 100 points and 3 stars for a complete 4-quadrant balanced plate', () => {
    const plate: PlateSelection = {
      karbo: mockFood('nasi-merah', 'karbo'),
      protein: mockFood('ikan-bakar', 'protein'),
      sayur: mockFood('bayam-bening', 'sayur'),
      buah: mockFood('pisang-barangan', 'buah'),
    };

    const score = calculateGameplayScore(plate, 0);
    expect(score.gameplayScore).toBe(100);
    expect(score.starsEarned).toBe(3);
    expect(score.isComplete).toBe(true);
    expect(score.hasDistractor).toBe(false);
  });

  it('calculates 50 points and 1 star when only 2 quadrants are filled', () => {
    const plate: PlateSelection = {
      karbo: mockFood('nasi-merah', 'karbo'),
      protein: mockFood('ikan-bakar', 'protein'),
      sayur: null,
      buah: null,
    };

    const score = calculateGameplayScore(plate, 0);
    expect(score.gameplayScore).toBe(50);
    expect(score.starsEarned).toBe(1);
    expect(score.isComplete).toBe(false);
  });

  it('deducts points when distractors are included', () => {
    const plate: PlateSelection = {
      karbo: mockFood('nasi-merah', 'karbo'),
      protein: mockFood('ikan-bakar', 'protein'),
      sayur: mockFood('bayam-bening', 'sayur'),
      buah: mockFood('pisang-barangan', 'buah'),
    };

    const score = calculateGameplayScore(plate, 1);
    expect(score.gameplayScore).toBe(85);
    expect(score.isComplete).toBe(false);
    expect(score.hasDistractor).toBe(true);
    expect(score.starsEarned).toBe(2);
  });

  it('calculates knowledge score independently from gameplay score', () => {
    const answersAllCorrect = [{ isCorrect: true }, { isCorrect: true }];
    expect(calculateKnowledgeScore(answersAllCorrect)).toBe(100);

    const answersOneWrong = [{ isCorrect: true }, { isCorrect: false }];
    expect(calculateKnowledgeScore(answersOneWrong)).toBe(50);

    const answersNoneCorrect = [{ isCorrect: false }, { isCorrect: false }];
    expect(calculateKnowledgeScore(answersNoneCorrect)).toBe(0);
  });
});
