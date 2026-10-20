import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, desc, and, count } from "drizzle-orm";
import { drizzleDb } from "../db";
import {
  gameDefinitions,
  gameSessions,
  gameEvents,
  gameResults,
  assessmentAttempts,
  children,
  dailyProgresses,
} from "../db/schema";
import { getSession } from "../middleware/auth";

export const gameRoutes = new Hono();

// Ephemeral single-use bootstrap tokens for secure WebView initialization (TTL: 60s)
interface BootstrapRecord {
  sessionId: string;
  expiresAt: number;
}
const bootstrapTokenStore = new Map<string, BootstrapRecord>();

// Food item definitions for server-side evaluation of Piring Sehat Nimbo
export const FOOD_ITEMS_MAP: Record<
  string,
  { name: string; category: "karbo" | "protein" | "sayur" | "buah" | "distractor"; isHealthy: boolean; tip: string }
> = {
  "nasi-merah": { name: "Nasi Beras Merah", category: "karbo", isHealthy: true, tip: "Kaya serat dan lambat menaikkan gula darah." },
  "kentang-rebus": { name: "Kentang Rebus", category: "karbo", isHealthy: true, tip: "Karbohidrat alami kaya kalium." },
  "jagung-manis": { name: "Jagung Manis", category: "karbo", isHealthy: true, tip: "Sumber serat manis alami tanpa gula tambahan." },
  "ikan-bakar": { name: "Ikan Bakar", category: "protein", isHealthy: true, tip: "Protein hewani kaya omega-3 untuk tumbuh kembang anak." },
  "telur-rebus": { name: "Telur Rebus", category: "protein", isHealthy: true, tip: "Protein lengkap ramah metabolisme." },
  "tempe-bacem": { name: "Tempe Panggang/Bacem", category: "protein", isHealthy: true, tip: "Protein nabati kaya kalsium dan prebiotik." },
  "bayam-bening": { name: "Sayur Bayam Bening", category: "sayur", isHealthy: true, tip: "Kaya zat besi dan vitamin untuk menjaga daya tahan tubuh." },
  "wortel-rebus": { name: "Wortel Manis", category: "sayur", isHealthy: true, tip: "Tinggi vitamin A untuk kesehatan mata." },
  "sayur-sop": { name: "Sayur Sop Aneka Sayur", category: "sayur", isHealthy: true, tip: "Kombinasi sayuran bervitamin dan menghidrasi tubuh." },
  "pisang-barangan": { name: "Pisang Barangan", category: "buah", isHealthy: true, tip: "Buah lokal lezat kaya kalium alami." },
  "pepaya-manis": { name: "Pepaya Potong Segar", category: "buah", isHealthy: true, tip: "Kaya enzim pencernaan dan serat alami." },
  "apel-segar": { name: "Apel Segar", category: "buah", isHealthy: true, tip: "Renyah, manis alami, dan mengenyangkan lebih lama." },
  "donat-cokelat": { name: "Donat Cokelat Tabur Gula", category: "distractor", isHealthy: false, tip: "Tinggi gula rafinasi dan minyak jenuh, berisiko lonjakan gula darah." },
  "minuman-soda": { name: "Minuman Soda Kaleng", category: "distractor", isHealthy: false, tip: "Mengandung lebih dari 30g gula cair tanpa nutrisi, hindari untuk konsumsi harian." },
};

// Knowledge check answer key for server-side evaluation
export const KNOWLEDGE_KEY: Record<string, string> = {
  q1_portion: "setengah_piring",
  q2_drink: "air_putih",
  q3_sugar: "cegah_diabetes",
};

/**
 * 1. GET /api/games - List available games
 */
gameRoutes.get("/games", async (c) => {
  try {
    let games = await drizzleDb
      .select()
      .from(gameDefinitions)
      .where(eq(gameDefinitions.isPublished, true));

    // Auto-seed default game definition if table is empty
    if (games.length === 0) {
      const [inserted] = await drizzleDb
        .insert(gameDefinitions)
        .values({
          slug: "piring-sehat-nimbo",
          title: "Piring Sehat Nimbo",
          description:
            "Game puzzle interaktif panduan Isi Piringku untuk membantu anak memahami porsi seimbang karbohidrat, protein, sayur, dan buah.",
          competency:
            "Mengenali variasi makanan dan prinsip dasar piring makan seimbang Isi Piringku Kemenkes RI.",
          currentVersion: "1.0.0",
          targetAgeRange: "6-12",
          isPublished: true,
        })
        .returning();
      games = [inserted];
    }

    return c.json({
      success: true,
      games: games.map((g) => ({
        id: g.id,
        slug: g.slug,
        title: g.title,
        description: g.description,
        competency: g.competency,
        version: g.currentVersion,
        targetAge: g.targetAgeRange,
      })),
    });
  } catch (error) {
    console.error("[PlayLab] Get games error:", error);
    return c.json({ error: { message: "Gagal memuat katalog game PlayLab." } }, 500);
  }
});

/**
 * 2. POST /api/game-sessions - Create authorized game session
 */
gameRoutes.post(
  "/game-sessions",
  zValidator(
    "json",
    z.object({
      gameSlug: z.string().trim().default("piring-sehat-nimbo"),
      childId: z.string().trim().optional(),
      studyId: z.string().trim().optional(),
      participantCode: z.string().trim().optional(),
    })
  ),
  async (c) => {
    const { gameSlug, childId, studyId, participantCode } = c.req.valid("json");
    const sessionAuth = await getSession(c);
    const user = sessionAuth?.user;

    try {
      // Find game definition
      let [game] = await drizzleDb
        .select()
        .from(gameDefinitions)
        .where(eq(gameDefinitions.slug, gameSlug));

      if (!game) {
        // Fallback default
        const [created] = await drizzleDb
          .insert(gameDefinitions)
          .values({
            slug: "piring-sehat-nimbo",
            title: "Piring Sehat Nimbo",
            description: "Panduan Isi Piringku Seimbang",
            competency: "Variasi makanan bergizi seimbang",
            currentVersion: "1.0.0",
          })
          .returning();
        game = created;
      }

      // Verify child if provided and authenticated
      let resolvedChildId = childId;
      if (childId && user) {
        const [child] = await drizzleDb
          .select({ id: children.id })
          .from(children)
          .where(and(eq(children.id, childId), eq(children.guardianId, user.id)));
        if (!child) {
          resolvedChildId = undefined;
        }
      }

      const [session] = await drizzleDb
        .insert(gameSessions)
        .values({
          gameId: game.id,
          gameSlug: game.slug,
          gameVersion: game.currentVersion,
          guardianId: user?.id,
          childId: resolvedChildId,
          studyId: studyId || "si-cehat-playlab-eval-2026",
          participantCode: participantCode || (user ? `usr_${user.id.slice(0, 8)}` : `guest_${Date.now()}`),
          status: "IN_PROGRESS",
        })
        .returning();

      // Record GAME_START event
      await drizzleDb.insert(gameEvents).values({
        sessionId: session.id,
        eventType: "GAME_START",
        sequence: 1,
        payload: JSON.stringify({
          gameSlug: game.slug,
          version: game.currentVersion,
          client: "hybrid-webview",
          timestamp: new Date().toISOString(),
        }),
      });

      // Generate short-lived, single-use bootstrap token (TTL: 60s)
      const bootstrapToken = crypto.randomUUID();
      bootstrapTokenStore.set(bootstrapToken, {
        sessionId: session.id,
        expiresAt: Date.now() + 60 * 1000,
      });

      return c.json({
        success: true,
        session: {
          id: session.id,
          gameSlug: session.gameSlug,
          gameVersion: session.gameVersion,
          childId: session.childId,
          status: session.status,
          startedAt: session.startedAt,
        },
        bootstrapToken,
      }, 201);
    } catch (error) {
      console.error("[PlayLab] Create session error:", error);
      return c.json({ error: { message: "Gagal membuat sesi permainan." } }, 500);
    }
  }
);

/**
 * 2b. POST /api/game-sessions/bootstrap/exchange - Exchange bootstrap token for session authorization
 */
gameRoutes.post(
  "/game-sessions/bootstrap/exchange",
  zValidator(
    "json",
    z.object({
      bootstrapToken: z.string().trim().min(1),
    })
  ),
  async (c) => {
    const { bootstrapToken } = c.req.valid("json");
    const record = bootstrapTokenStore.get(bootstrapToken);

    if (!record || record.expiresAt < Date.now()) {
      bootstrapTokenStore.delete(bootstrapToken);
      return c.json({ error: { message: "Token bootstrap tidak valid atau telah kadaluarsa." } }, 400);
    }

    // Invalidate immediately (single-use)
    bootstrapTokenStore.delete(bootstrapToken);

    try {
      const [session] = await drizzleDb
        .select()
        .from(gameSessions)
        .where(eq(gameSessions.id, record.sessionId));

      if (!session) {
        return c.json({ error: { message: "Sesi permainan tidak ditemukan." } }, 404);
      }

      return c.json({
        success: true,
        session: {
          id: session.id,
          gameSlug: session.gameSlug,
          gameVersion: session.gameVersion,
          status: session.status,
          childId: session.childId,
        },
        sessionAuthToken: session.id,
      });
    } catch (error) {
      console.error("[PlayLab] Bootstrap exchange error:", error);
      return c.json({ error: { message: "Gagal menukar token bootstrap." } }, 500);
    }
  }
);

/**
 * 3. POST /api/game-sessions/:id/events - Record research telemetry events
 */
gameRoutes.post(
  "/game-sessions/:id/events",
  zValidator(
    "json",
    z.object({
      eventType: z.string().trim().min(1).max(50),
      sequence: z.number().int().default(0),
      payload: z.record(z.string(), z.any()).default({}),
      occurredAt: z.string().datetime().optional(),
    })
  ),
  async (c) => {
    const sessionId = c.req.param("id");
    const { eventType, sequence, payload, occurredAt } = c.req.valid("json");

    try {
      const [session] = await drizzleDb
        .select({ id: gameSessions.id, status: gameSessions.status })
        .from(gameSessions)
        .where(eq(gameSessions.id, sessionId));

      if (!session) {
        return c.json({ error: { message: "Sesi permainan tidak ditemukan." } }, 404);
      }

      const [evt] = await drizzleDb
        .insert(gameEvents)
        .values({
          sessionId,
          eventType,
          sequence,
          payload: JSON.stringify(payload),
          occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
        })
        .returning();

      return c.json({ success: true, eventId: evt.id });
    } catch (error) {
      console.error("[PlayLab] Record event error:", error);
      return c.json({ error: { message: "Gagal mencatat event permainan." } }, 500);
    }
  }
);

/**
 * 4. POST /api/game-sessions/:id/complete - Validate & complete session server-side
 */
gameRoutes.post(
  "/game-sessions/:id/complete",
  zValidator(
    "json",
    z.object({
      plateItems: z.array(z.string()).default([]),
      answers: z
        .array(
          z.object({
            questionId: z.string(),
            selectedAnswer: z.string(),
          })
        )
        .default([]),
    })
  ),
  async (c) => {
    const sessionId = c.req.param("id");
    const { plateItems, answers } = c.req.valid("json");

    try {
      const [session] = await drizzleDb
        .select()
        .from(gameSessions)
        .where(eq(gameSessions.id, sessionId));

      if (!session) {
        return c.json({ error: { message: "Sesi permainan tidak ditemukan." } }, 404);
      }

      // Check if session is already completed (Idempotency)
      const [existingResult] = await drizzleDb
        .select()
        .from(gameResults)
        .where(eq(gameResults.sessionId, sessionId));

      if (existingResult) {
        return c.json({
          success: true,
          isAlreadyCompleted: true,
          result: {
            gameplayScore: existingResult.gameplayScore,
            knowledgeScore: existingResult.knowledgeScore,
            totalScore: existingResult.totalScore,
            starsEarned: existingResult.starsEarned,
            feedbackSummary: existingResult.feedbackSummary,
            xpAwarded: existingResult.xpAwarded,
            plateComposition: JSON.parse(existingResult.plateComposition || "{}"),
          },
        });
      }

      // ====================================================
      // 1. EVALUATE GAMEPLAY SCORE (Piring Sehat Nimbo)
      // ====================================================
      let hasKarbo = false;
      let hasProtein = false;
      let hasSayur = false;
      let hasBuah = false;
      let distractorCount = 0;
      const analyzedItems: Array<{ id: string; name: string; category: string; isHealthy: boolean }> = [];

      for (const itemId of plateItems) {
        const food = FOOD_ITEMS_MAP[itemId];
        if (food) {
          analyzedItems.push({ id: itemId, name: food.name, category: food.category, isHealthy: food.isHealthy });
          if (food.category === "karbo") hasKarbo = true;
          if (food.category === "protein") hasProtein = true;
          if (food.category === "sayur") hasSayur = true;
          if (food.category === "buah") hasBuah = true;
          if (food.category === "distractor") distractorCount++;
        }
      }

      let gameplayScore = 0;
      if (hasKarbo) gameplayScore += 25;
      if (hasProtein) gameplayScore += 25;
      if (hasSayur) gameplayScore += 25;
      if (hasBuah) gameplayScore += 25;

      // Penalize distractors (high sugar/ultraprocessed)
      gameplayScore = Math.max(0, gameplayScore - distractorCount * 20);

      // ====================================================
      // 2. EVALUATE KNOWLEDGE SCORE (Knowledge Check 3 Items)
      // ====================================================
      let correctAnswersCount = 0;
      const totalQuestions = answers.length > 0 ? answers.length : Object.keys(KNOWLEDGE_KEY).length;

      for (const ans of answers) {
        const correctKey = KNOWLEDGE_KEY[ans.questionId];
        if (correctKey && ans.selectedAnswer === correctKey) {
          correctAnswersCount++;
        }
      }

      const knowledgeScore = Math.round((correctAnswersCount / totalQuestions) * 100);

      // Combined total score: 60% gameplay, 40% knowledge
      const totalScore = Math.round(gameplayScore * 0.6 + knowledgeScore * 0.4);

      let starsEarned = 1;
      if (totalScore >= 80) starsEarned = 3;
      else if (totalScore >= 55) starsEarned = 2;

      const xpAwarded = starsEarned === 3 ? 75 : starsEarned === 2 ? 60 : 45;

      let feedbackSummary = "";
      if (starsEarned === 3) {
        feedbackSummary = "Luar biasa! Piringmu sangat seimbang dan pemahaman gizimu jempolan!";
      } else if (starsEarned === 2) {
        feedbackSummary = "Bagus sekali! Variasi piringmu sudah baik, perbanyak sayur dan kurangi makanan manis ya!";
      } else {
        feedbackSummary = "Usaha yang bagus! Ingat prinsip Isi Piringku: 1/2 piring untuk sayur dan buah, serta pilih air putih.";
      }

      const plateData = {
        items: analyzedItems,
        balance: { hasKarbo, hasProtein, hasSayur, hasBuah, distractorCount },
      };

      // Transactionally save result & complete session
      const now = new Date();
      await drizzleDb.transaction(async (tx) => {
        await tx
          .update(gameSessions)
          .set({
            status: "COMPLETED",
            completedAt: now,
          })
          .where(eq(gameSessions.id, sessionId));

        await tx.insert(gameResults).values({
          sessionId,
          gameplayScore,
          knowledgeScore,
          totalScore,
          starsEarned,
          plateComposition: JSON.stringify(plateData),
          feedbackSummary,
          rulesVersion: "1.0.0",
          xpAwarded,
          finalizedAt: now,
        });

        // Award XP to active child daily progress if childId present
        if (session.childId) {
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const [prog] = await tx
            .select()
            .from(dailyProgresses)
            .where(
              and(
                eq(dailyProgresses.childId, session.childId),
                eq(dailyProgresses.date, today)
              )
            );

          if (prog) {
            await tx
              .update(dailyProgresses)
              .set({
                xpEarned: prog.xpEarned + xpAwarded,
              })
              .where(eq(dailyProgresses.id, prog.id));
          } else {
            await tx.insert(dailyProgresses).values({
              childId: session.childId,
              date: today,
              xpEarned: xpAwarded,
              waterGlasses: 0,
              activityMinutes: 0,
              streak: 1,
            });
          }
        }
      });

      return c.json({
        success: true,
        result: {
          gameplayScore,
          knowledgeScore,
          totalScore,
          starsEarned,
          feedbackSummary,
          xpAwarded,
          plateComposition: plateData,
        },
      });
    } catch (error) {
      console.error("[PlayLab] Complete session error:", error);
      return c.json({ error: { message: "Gagal menyelesaikan sesi permainan." } }, 500);
    }
  }
);

/**
 * 5. GET /api/game-sessions/:id/result - Fetch validated result
 */
gameRoutes.get("/game-sessions/:id/result", async (c) => {
  const sessionId = c.req.param("id");

  try {
    const [result] = await drizzleDb
      .select()
      .from(gameResults)
      .where(eq(gameResults.sessionId, sessionId));

    if (!result) {
      return c.json({ error: { message: "Hasil sesi belum tersedia atau belum selesai." } }, 404);
    }

    return c.json({
      success: true,
      result: {
        gameplayScore: result.gameplayScore,
        knowledgeScore: result.knowledgeScore,
        totalScore: result.totalScore,
        starsEarned: result.starsEarned,
        feedbackSummary: result.feedbackSummary,
        xpAwarded: result.xpAwarded,
        plateComposition: JSON.parse(result.plateComposition || "{}"),
        finalizedAt: result.finalizedAt,
      },
    });
  } catch (error) {
    console.error("[PlayLab] Get result error:", error);
    return c.json({ error: { message: "Gagal mengambil hasil sesi." } }, 500);
  }
});

/**
 * 6. POST /api/assessments/attempts - Submit research assessment attempt
 */
gameRoutes.post(
  "/assessments/attempts",
  zValidator(
    "json",
    z.object({
      childId: z.string().trim().optional(),
      studyId: z.string().trim().default("si-cehat-playlab-eval-2026"),
      participantCode: z.string().trim().optional(),
      assessmentType: z.enum(["PRE_TEST", "POST_TEST", "FOLLOW_UP"]).default("PRE_TEST"),
      instrumentVersion: z.string().trim().default("1.0.0"),
      answers: z.array(
        z.object({
          questionId: z.string(),
          answer: z.string(),
          isCorrect: z.boolean().optional(),
        })
      ),
    })
  ),
  async (c) => {
    const sessionAuth = await getSession(c);
    const user = sessionAuth?.user;
    const { childId, studyId, participantCode, assessmentType, instrumentVersion, answers } = c.req.valid("json");

    try {
      // Evaluate score from answers
      let correct = 0;
      for (const a of answers) {
        if (a.isCorrect || (KNOWLEDGE_KEY[a.questionId] && KNOWLEDGE_KEY[a.questionId] === a.answer)) {
          correct++;
        }
      }
      const score = Math.round((correct / Math.max(1, answers.length)) * 100);

      const [attempt] = await drizzleDb
        .insert(assessmentAttempts)
        .values({
          guardianId: user?.id,
          childId,
          studyId,
          participantCode: participantCode || (user ? `usr_${user.id.slice(0, 8)}` : `guest_${Date.now()}`),
          assessmentType,
          instrumentVersion,
          score,
          maxScore: 100,
          answers: JSON.stringify(answers),
        })
        .returning();

      return c.json({
        success: true,
        attempt: {
          id: attempt.id,
          assessmentType: attempt.assessmentType,
          score: attempt.score,
          completedAt: attempt.completedAt,
        },
      }, 201);
    } catch (error) {
      console.error("[PlayLab] Record assessment attempt error:", error);
      return c.json({ error: { message: "Gagal mencatat data assessment penelitian." } }, 500);
    }
  }
);

/**
 * 7. GET /api/research/studies/playlab/export - Export research dataset
 */
gameRoutes.get("/research/studies/playlab/export", async (c) => {
  try {
    const [sessions, results, assessments] = await Promise.all([
      drizzleDb
        .select({
          sessionId: gameSessions.id,
          gameSlug: gameSessions.gameSlug,
          gameVersion: gameSessions.gameVersion,
          participantCode: gameSessions.participantCode,
          studyId: gameSessions.studyId,
          status: gameSessions.status,
          startedAt: gameSessions.startedAt,
          completedAt: gameSessions.completedAt,
        })
        .from(gameSessions)
        .orderBy(desc(gameSessions.startedAt))
        .limit(100),
      drizzleDb
        .select()
        .from(gameResults)
        .orderBy(desc(gameResults.finalizedAt))
        .limit(100),
      drizzleDb
        .select()
        .from(assessmentAttempts)
        .orderBy(desc(assessmentAttempts.completedAt))
        .limit(100),
    ]);

    return c.json({
      studyMetadata: {
        title: "Si-Cehat PlayLab Evaluation Study",
        gameSlug: "piring-sehat-nimbo",
        version: "1.0.0",
        exportTimestamp: new Date().toISOString(),
        totalSessionsCount: sessions.length,
      },
      sessions,
      results: results.map((r) => ({
        sessionId: r.sessionId,
        gameplayScore: r.gameplayScore,
        knowledgeScore: r.knowledgeScore,
        totalScore: r.totalScore,
        starsEarned: r.starsEarned,
        finalizedAt: r.finalizedAt,
      })),
      assessments: assessments.map((a) => ({
        id: a.id,
        participantCode: a.participantCode,
        assessmentType: a.assessmentType,
        score: a.score,
        completedAt: a.completedAt,
      })),
    });
  } catch (error) {
    console.error("[PlayLab] Research export error:", error);
    return c.json({ error: { message: "Gagal mengekspor data penelitian." } }, 500);
  }
});
