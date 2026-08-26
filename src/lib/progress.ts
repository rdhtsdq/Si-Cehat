import { z } from "zod";

export const progressStorageKey = "si-cehat-progress";

export type MealTone = "balanced" | "sweet" | "fried" | "unknown";

export type DailyProgress = {
  date: string;
  childName: string;
  waterGlasses: number;
  activityMinutes: number;
  foodLogs: Array<{ name: string; tone: MealTone }>;
  challengeCompleted: boolean;
  quizCompleted: boolean;
  xp: number;
  streak: number;
};

export type ProgressSummary = {
  waterPercent: number;
  activityPercent: number;
  healthyFoodCount: number;
  sweetFoodCount: number;
  dailyScore: number;
};

const foodLogSchema = z.object({
  name: z.string().trim().min(1).max(60),
  tone: z.enum(["balanced", "sweet", "fried", "unknown"]),
});

const progressSchema = z.object({
  date: z.string(),
  childName: z.string().trim().min(1).max(40),
  waterGlasses: z.number().int().min(0).max(20),
  activityMinutes: z.number().int().min(0).max(240),
  foodLogs: z.array(foodLogSchema).max(12),
  challengeCompleted: z.boolean(),
  quizCompleted: z.boolean(),
  xp: z.number().int().min(0).max(9999),
  streak: z.number().int().min(0).max(365),
});

export const todayChallenge = {
  title: "Misi Warna Piring",
  description: "Makan satu buah atau sayur hari ini, lalu ceritakan warnanya.",
  xp: 30,
};

export const dailyQuiz = {
  question: "Minuman apa yang paling baik diminum setiap hari?",
  options: ["Air putih", "Soda", "Teh manis sangat banyak"],
  answer: "Air putih",
  xp: 20,
};

export const recommendedMenus = [
  {
    title: "Nasi, ayam, sayur bening, dan pepaya",
    note: "Ada sumber tenaga, lauk, sayur, dan buah. Porsinya tetap secukupnya.",
  },
  {
    title: "Karedok ringan dengan nasi dan telur",
    note: "Sayurnya beragam. Kurangi saus terlalu manis atau terlalu banyak.",
  },
  {
    title: "Tumis brokoli wortel dan tempe",
    note: "Warna sayur membantu anak mengenali isi piring yang seimbang.",
  },
];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function createDefaultProgress(): DailyProgress {
  return {
    date: todayKey(),
    childName: "Teman Cehat",
    waterGlasses: 0,
    activityMinutes: 0,
    foodLogs: [],
    challengeCompleted: false,
    quizCompleted: false,
    xp: 0,
    streak: 0,
  };
}

export function loadProgress(): DailyProgress {
  if (typeof window === "undefined") {
    return createDefaultProgress();
  }

  const stored = window.localStorage.getItem(progressStorageKey);
  if (!stored) {
    return createDefaultProgress();
  }

  try {
    const parsed = progressSchema.safeParse(JSON.parse(stored));
    if (!parsed.success || parsed.data.date !== todayKey()) {
      return createDefaultProgress();
    }
    return parsed.data;
  } catch {
    return createDefaultProgress();
  }
}

export function saveProgress(progress: DailyProgress) {
  window.localStorage.setItem(progressStorageKey, JSON.stringify(progress));
}

export function summarizeProgress(progress: DailyProgress): ProgressSummary {
  const healthyFoodCount = progress.foodLogs.filter((food) => food.tone === "balanced").length;
  const sweetFoodCount = progress.foodLogs.filter((food) => food.tone === "sweet").length;
  const waterPercent = Math.min(100, Math.round((progress.waterGlasses / 8) * 100));
  const activityPercent = Math.min(100, Math.round((progress.activityMinutes / 60) * 100));
  const dailyScore = Math.min(
    100,
    Math.round(waterPercent * 0.3 + activityPercent * 0.3 + Math.min(30, healthyFoodCount * 10) + (progress.challengeCompleted ? 10 : 0)),
  );

  return { waterPercent, activityPercent, healthyFoodCount, sweetFoodCount, dailyScore };
}

export function addXp(progress: DailyProgress, amount: number): DailyProgress {
  return { ...progress, xp: Math.min(9999, progress.xp + amount), streak: Math.max(progress.streak, 1) };
}
