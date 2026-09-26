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

export const activeChildIdStorageKey = "si-cehat-active-child-id";

export function getActiveChildId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return window.localStorage.getItem(activeChildIdStorageKey) || undefined;
}

export function setActiveChildId(childId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(activeChildIdStorageKey, childId);
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

export function broadcastProgressUpdate(progress: DailyProgress) {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent("si-cehat-progress-updated", { detail: progress }));
    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel("si-cehat-sync");
      channel.postMessage({ type: "PROGRESS_UPDATED", progress });
      channel.close();
    }
  } catch {}
}

export function saveProgress(progress: DailyProgress, childId?: string) {
  window.localStorage.setItem(progressStorageKey, JSON.stringify(progress));
  broadcastProgressUpdate(progress);
  const targetId = childId || getActiveChildId();
  syncProgressWithBackend(progress, targetId).catch(() => {
    // Fail silently in background to preserve offline capability
  });
}

export async function syncProgressWithBackend(progress: DailyProgress, childId?: string) {
  if (typeof window === "undefined") return;
  try {
    const res = await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        childId,
        date: progress.date,
        waterGlasses: progress.waterGlasses,
        activityMinutes: progress.activityMinutes,
        xpEarned: progress.xp,
        streak: progress.streak,
        foodLogs: progress.foodLogs,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.childId) {
        window.localStorage.setItem(activeChildIdStorageKey, data.childId);
      }
    }
  } catch {
    // Offline resilience
  }
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
