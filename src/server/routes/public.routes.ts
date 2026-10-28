import { Hono } from "hono";
import { z } from "zod";
import { and, asc, desc, eq } from "drizzle-orm";
import { drizzleDb } from "../db";
import {
  children,
  dailyProgresses,
  foodLogs,
  challenges,
  quizzes,
  recommendedMenus,
} from "../db/schema";
import { getSession } from "../middleware/auth";
import { chatMessageSchema } from "@/lib/chat";
import { orchestrateAIChat } from "../services/ai-orchestrator";
import {
  todayChallenge as defaultChallenge,
  dailyQuiz as defaultQuiz,
  recommendedMenus as defaultMenus,
} from "@/lib/progress";

export const publicRoutes = new Hono();

// 1. POST /api/chat
const chatRequestBodySchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(20),
  childId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),
});

publicRoutes.post("/chat", async (c) => {
  try {
    const raw = await c.req.json().catch(() => null);
    const body = chatRequestBodySchema.safeParse(raw);

    if (!body.success) {
      return c.json(
        {
          error: {
            message:
              "Pertanyaannya belum bisa dibaca. Coba tulis lebih singkat ya.",
          },
        },
        400
      );
    }

    const { messages, childId, sessionId } = body.data;
    const result = await orchestrateAIChat({
      messages,
      childId,
      sessionId,
    });

    return c.json({
      message: result.reply,
      sessionId: result.sessionId,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return c.json(
      {
        error: {
          message:
            "Si Cehat sedang istirahat sebentar. Coba tanya lagi ya!",
        },
      },
      500
    );
  }
});

// 2. GET & POST /api/avatar
const avatarSchema = z.object({
  childId: z.string().uuid().optional(),
  character: z.enum(["default", "apple", "broccoli", "carrot"]),
  accessory: z.enum(["none", "glasses", "headphone", "hat"]),
  orbColor: z.string().min(1),
});

publicRoutes.get("/avatar", async (c) => {
  const childId = c.req.query("childId") || null;
  const session = await getSession(c);

  let targetId = childId;
  if (session?.user?.id) {
    if (targetId) {
      const [childBelongs] = await drizzleDb
        .select({ id: children.id })
        .from(children)
        .where(
          and(
            eq(children.id, targetId),
            eq(children.guardianId, session.user.id)
          )
        )
        .limit(1);
      if (!childBelongs && session.user.role !== "ADMIN") {
        targetId = null;
      }
    }
    if (!targetId) {
      const [child] = await drizzleDb
        .select({
          id: children.id,
          avatarPreference: children.avatarPreference,
        })
        .from(children)
        .where(eq(children.guardianId, session.user.id))
        .limit(1);
      if (child) {
        targetId = child.id;
        if (child.avatarPreference) {
          try {
            return c.json(JSON.parse(child.avatarPreference));
          } catch {}
        }
      }
    }
  }

  if (targetId) {
    const [child] = await drizzleDb
      .select({ avatarPreference: children.avatarPreference })
      .from(children)
      .where(eq(children.id, targetId))
      .limit(1);
    if (child?.avatarPreference) {
      try {
        return c.json(JSON.parse(child.avatarPreference));
      } catch {}
    }
  }

  return c.json({
    character: "default",
    accessory: "none",
    orbColor: "#4f9f7a",
  });
});

publicRoutes.post("/avatar", async (c) => {
  const json = await c.req.json().catch(() => null);
  const parsed = avatarSchema.safeParse(json);

  if (!parsed.success) {
    return c.json({ error: { message: "Data avatar tidak valid." } }, 400);
  }

  const { childId, ...preference } = parsed.data;
  const session = await getSession(c);

  let targetId = childId;
  if (session?.user?.id) {
    if (targetId) {
      const [childBelongs] = await drizzleDb
        .select({ id: children.id })
        .from(children)
        .where(
          and(
            eq(children.id, targetId),
            eq(children.guardianId, session.user.id)
          )
        )
        .limit(1);
      if (!childBelongs && session.user.role !== "ADMIN") {
        targetId = undefined;
      }
    }
    if (!targetId) {
      const [child] = await drizzleDb
        .select({ id: children.id })
        .from(children)
        .where(eq(children.guardianId, session.user.id))
        .limit(1);
      if (child) targetId = child.id;
    }
  }

  if (!targetId) {
    return c.json({
      savedLocallyOnly: true,
      preference,
    });
  }

  try {
    await drizzleDb
      .update(children)
      .set({ avatarPreference: JSON.stringify(preference) })
      .where(eq(children.id, targetId));

    return c.json({ success: true, preference });
  } catch (error) {
    console.error("Save avatar preference error:", error);
    return c.json({ error: { message: "Gagal menyimpan avatar." } }, 500);
  }
});

// 3. GET & POST /api/progress
// All progress fields are optional so a partial sync (for example logging a
// glass of water) does not reset XP, streak, or food logs that were written by
// another feature.
const syncProgressSchema = z.object({
  childId: z.string().uuid().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  waterGlasses: z.number().int().min(0).max(30).optional(),
  activityMinutes: z.number().int().min(0).max(600).optional(),
  xpEarned: z.number().int().min(0).max(9999).optional(),
  streak: z.number().int().min(0).max(365).optional(),
  foodLogs: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(100),
        tone: z.enum(["balanced", "sweet", "fried", "unknown"]),
      })
    )
    .optional(),
});

function parseTargetDate(dateStr?: string | null): Date {
  const d = dateStr || new Date().toISOString().slice(0, 10);
  return new Date(`${d}T00:00:00.000Z`);
}

publicRoutes.get("/progress", async (c) => {
  const childIdParam = c.req.query("childId") || null;
  const dateParam = c.req.query("date") || null;
  const session = await getSession(c);

  let targetChildId = childIdParam;
  if (session?.user?.id) {
    if (targetChildId) {
      const [childBelongs] = await drizzleDb
        .select({ id: children.id })
        .from(children)
        .where(
          and(
            eq(children.id, targetChildId),
            eq(children.guardianId, session.user.id)
          )
        )
        .limit(1);
      if (!childBelongs && session.user.role !== "ADMIN") {
        targetChildId = null;
      }
    }
    if (!targetChildId) {
      const [firstChild] = await drizzleDb
        .select({ id: children.id })
        .from(children)
        .where(eq(children.guardianId, session.user.id))
        .orderBy(asc(children.id))
        .limit(1);
      if (firstChild) {
        targetChildId = firstChild.id;
      }
    }
  }

  if (!targetChildId) {
    return c.json({ progress: null, note: "No active child profile" });
  }

  const targetDate = parseTargetDate(dateParam);

  try {
    const [progress] = await drizzleDb
      .select()
      .from(dailyProgresses)
      .where(
        and(
          eq(dailyProgresses.childId, targetChildId),
          eq(dailyProgresses.date, targetDate)
        )
      )
      .limit(1);

    const foods = await drizzleDb
      .select()
      .from(foodLogs)
      .where(
        and(
          eq(foodLogs.childId, targetChildId),
          eq(foodLogs.date, targetDate)
        )
      );

    const [child] = await drizzleDb
      .select({
        name: children.name,
        avatarPreference: children.avatarPreference,
        guardianId: children.guardianId,
      })
      .from(children)
      .where(eq(children.id, targetChildId))
      .limit(1);

    if (
      session?.user &&
      session.user.role !== "ADMIN" &&
      child?.guardianId !== session.user.id
    ) {
      return c.json(
        {
          error: {
            message:
              "Akses ditolak. Anda hanya dapat melihat data anak Anda sendiri.",
          },
        },
        403
      );
    }

    let avatarPreference = null;
    if (child?.avatarPreference) {
      try {
        avatarPreference = JSON.parse(child.avatarPreference);
      } catch {}
    }

    return c.json({
      childId: targetChildId,
      childName: child?.name || "Teman Cehat",
      date: targetDate.toISOString().slice(0, 10),
      waterGlasses: progress?.waterGlasses ?? 0,
      activityMinutes: progress?.activityMinutes ?? 0,
      xp: progress?.xpEarned ?? 0,
      streak: progress?.streak ?? 0,
      foodLogs: foods.map((f) => ({ name: f.name, tone: f.tone })),
      avatarPreference,
    });
  } catch (error) {
    console.error("Fetch progress error:", error);
    return c.json(
      { error: { message: "Gagal mengambil progres harian." } },
      500
    );
  }
});

publicRoutes.post("/progress", async (c) => {
  const json = await c.req.json().catch(() => null);
  const parsed = syncProgressSchema.safeParse(json);

  if (!parsed.success) {
    return c.json({ error: { message: "Data progres tidak valid." } }, 400);
  }

  const {
    childId: reqChildId,
    waterGlasses,
    activityMinutes,
    xpEarned,
    streak,
    foodLogs: reqFoodLogs,
  } = parsed.data;
  const session = await getSession(c);

  let targetChildId = reqChildId;
  if (session?.user?.id) {
    if (targetChildId) {
      const [childBelongs] = await drizzleDb
        .select({ id: children.id })
        .from(children)
        .where(
          and(
            eq(children.id, targetChildId),
            eq(children.guardianId, session.user.id)
          )
        )
        .limit(1);
      if (!childBelongs && session.user.role !== "ADMIN") {
        targetChildId = undefined;
      }
    }
    if (!targetChildId) {
      const [firstChild] = await drizzleDb
        .select({ id: children.id })
        .from(children)
        .where(eq(children.guardianId, session.user.id))
        .orderBy(asc(children.id))
        .limit(1);
      if (firstChild) targetChildId = firstChild.id;
    }
  }

  if (!targetChildId) {
    return c.json({
      savedLocallyOnly: true,
      data: parsed.data,
    });
  }

  if (session?.user && session.user.role !== "ADMIN") {
    const [child] = await drizzleDb
      .select({ guardianId: children.guardianId })
      .from(children)
      .where(eq(children.id, targetChildId))
      .limit(1);
    if (child && child.guardianId !== session.user.id) {
      return c.json(
        {
          error: {
            message:
              "Akses ditolak. Anda hanya dapat memperbarui data anak Anda sendiri.",
          },
        },
        403
      );
    }
  }

  const targetDate = parseTargetDate(parsed.data.date);

  try {
    const [existing] = await drizzleDb
      .select()
      .from(dailyProgresses)
      .where(
        and(
          eq(dailyProgresses.childId, targetChildId),
          eq(dailyProgresses.date, targetDate)
        )
      )
      .limit(1);

    const updates = {
      ...(waterGlasses !== undefined ? { waterGlasses } : {}),
      ...(activityMinutes !== undefined ? { activityMinutes } : {}),
      ...(xpEarned !== undefined ? { xpEarned } : {}),
      ...(streak !== undefined ? { streak } : {}),
    };

    let progressId: string;
    if (existing) {
      if (Object.keys(updates).length > 0) {
        await drizzleDb
          .update(dailyProgresses)
          .set(updates)
          .where(eq(dailyProgresses.id, existing.id));
      }
      progressId = existing.id;
    } else {
      const [created] = await drizzleDb
        .insert(dailyProgresses)
        .values({
          childId: targetChildId,
          date: targetDate,
          waterGlasses: waterGlasses ?? 0,
          activityMinutes: activityMinutes ?? 0,
          xpEarned: xpEarned ?? 0,
          streak: streak ?? 0,
        })
        .returning({ id: dailyProgresses.id });
      progressId = created.id;
    }

    // Only replace food logs when the caller explicitly sends them.
    if (reqFoodLogs !== undefined) {
      await drizzleDb
        .delete(foodLogs)
        .where(
          and(
            eq(foodLogs.childId, targetChildId),
            eq(foodLogs.date, targetDate)
          )
        );

      if (reqFoodLogs.length > 0) {
        await drizzleDb.insert(foodLogs).values(
          reqFoodLogs.map((food) => ({
            childId: targetChildId as string,
            date: targetDate,
            name: food.name,
            tone: food.tone,
          }))
        );
      }
    }

    return c.json({
      success: true,
      progressId,
      childId: targetChildId,
    });
  } catch (error) {
    console.error("Save progress error:", error);
    return c.json(
      { error: { message: "Gagal menyimpan progres ke database." } },
      500
    );
  }
});

// 4. GET /api/content
publicRoutes.get("/content", async (c) => {
  try {
    const [[challenge], [quiz], menus] = await Promise.all([
      drizzleDb
        .select()
        .from(challenges)
        .where(eq(challenges.isActive, true))
        .orderBy(desc(challenges.createdAt))
        .limit(1),
      drizzleDb
        .select()
        .from(quizzes)
        .where(eq(quizzes.isActive, true))
        .orderBy(desc(quizzes.createdAt))
        .limit(1),
      drizzleDb
        .select()
        .from(recommendedMenus)
        .orderBy(asc(recommendedMenus.orderIndex)),
    ]);

    const resolvedChallenge = challenge
      ? {
          id: challenge.id,
          title: challenge.title,
          description: challenge.description,
          xp: challenge.xp,
        }
      : defaultChallenge;

    let resolvedQuiz = defaultQuiz;
    if (quiz) {
      try {
        const parsedOptions = JSON.parse(quiz.options);
        resolvedQuiz = {
          question: quiz.question,
          options: Array.isArray(parsedOptions)
            ? parsedOptions
            : defaultQuiz.options,
          answer: quiz.answer,
          xp: quiz.xp,
        };
      } catch {
        resolvedQuiz = defaultQuiz;
      }
    }

    const resolvedMenus =
      menus && menus.length > 0
        ? menus.map((m) => ({ title: m.title, note: m.note }))
        : defaultMenus;

    return c.json({
      challenge: resolvedChallenge,
      quiz: resolvedQuiz,
      recommendedMenus: resolvedMenus,
    });
  } catch (error) {
    console.error("Error fetching dynamic content:", error);
    return c.json({
      challenge: defaultChallenge,
      quiz: defaultQuiz,
      recommendedMenus: defaultMenus,
    });
  }
});
