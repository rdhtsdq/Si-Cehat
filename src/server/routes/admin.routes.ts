import { Hono } from "hono";
import { z } from "zod";
import { and, asc, avg, count, desc, eq, ilike, inArray, or, sql, sum } from "drizzle-orm";
import crypto from "node:crypto";
import { drizzleDb } from "../db";
import {
  posyandus,
  guardians,
  children,
  dailyProgresses,
  foodLogs,
  detailedFoodLogs,
  growthMeasurements,
  screeningRecords,
  recipes,
  educationArticles,
  consultations,
  chatSessions,
  chatMessages,
  challenges,
  quizzes,
  recommendedMenus,
  botConfigs,
} from "../db/schema";
import { verifyAdmin, verifySuperAdmin } from "../middleware/auth";
import { getResolvedBotConfig, maskApiKey } from "../services/bot-config";

export const adminRoutes = new Hono();

// 1. GET /api/admin/metrics
adminRoutes.get("/metrics", async (c) => {
  const authCheck = await verifyAdmin(c);
  if (!authCheck.authorized) return authCheck.response;

  // Multi-tenancy scoping:
  // Admin Posyandu is strictly scoped to their own posyanduId.
  // Super Admin (Pusat) can view all or filter by ?posyanduId=...
  const effectivePosyanduId = authCheck.isPosyandu
    ? authCheck.posyanduId
    : (c.req.query("posyanduId") || "").trim() || null;

  try {
    let scopedChildIds: string[] | null = null;
    let scopedGuardianIds: string[] | null = null;
    let activePosyandu: any = null;

    if (effectivePosyanduId) {
      const [posyanduRow, childRows, guardianRows] = await Promise.all([
        drizzleDb
          .select()
          .from(posyandus)
          .where(eq(posyandus.id, effectivePosyanduId))
          .limit(1),
        drizzleDb
          .select({ id: children.id })
          .from(children)
          .where(eq(children.posyanduId, effectivePosyanduId)),
        drizzleDb
          .select({ id: guardians.id })
          .from(guardians)
          .where(
            and(
              eq(guardians.role, "GUARDIAN"),
              eq(guardians.posyanduId, effectivePosyanduId)
            )
          ),
      ]);
      activePosyandu = posyanduRow[0] || null;
      scopedChildIds = childRows.map((r) => r.id);
      scopedGuardianIds = guardianRows.map((r) => r.id);
    }

    const hasChildren =
      !effectivePosyanduId || (scopedChildIds && scopedChildIds.length > 0);
    const hasGuardians =
      !effectivePosyanduId || (scopedGuardianIds && scopedGuardianIds.length > 0);

    const guardianFilter = effectivePosyanduId
      ? and(
          eq(guardians.role, "GUARDIAN"),
          eq(guardians.posyanduId, effectivePosyanduId)
        )
      : eq(guardians.role, "GUARDIAN");

    const childrenFilter = effectivePosyanduId
      ? eq(children.posyanduId, effectivePosyanduId)
      : undefined;

    const childWhere = (column: any) =>
      effectivePosyanduId && scopedChildIds && scopedChildIds.length > 0
        ? inArray(column, scopedChildIds)
        : undefined;

    const guardianWhere = (column: any) =>
      effectivePosyanduId && scopedGuardianIds && scopedGuardianIds.length > 0
        ? inArray(column, scopedGuardianIds)
        : undefined;

    const [
      [guardiansCount],
      [childrenCount],
      [progressAgg],
      foodToneCounts,
      [chatSessionsCount],
      [chatMessagesCount],
      recentProgress,
      [screeningsCount],
      [highRiskCountRow],
      [mediumRiskCountRow],
      [lowRiskCountRow],
      recentHighRiskScreenings,
      [growthMeasurementsCount],
      growthNutritionalStats,
      [foodLogAgg],
      consultationStats,
      [recipesCount],
      [articlesCount],
    ] = await Promise.all([
      drizzleDb.select({ total: count() }).from(guardians).where(guardianFilter),
      childrenFilter
        ? drizzleDb.select({ total: count() }).from(children).where(childrenFilter)
        : drizzleDb.select({ total: count() }).from(children),
      hasChildren
        ? drizzleDb
            .select({
              sumWater: sum(dailyProgresses.waterGlasses),
              sumActivity: sum(dailyProgresses.activityMinutes),
              sumXp: sum(dailyProgresses.xpEarned),
              avgWater: avg(dailyProgresses.waterGlasses),
              avgActivity: avg(dailyProgresses.activityMinutes),
              avgStreak: avg(dailyProgresses.streak),
            })
            .from(dailyProgresses)
            .where(childWhere(dailyProgresses.childId))
        : Promise.resolve([
            {
              sumWater: 0,
              sumActivity: 0,
              sumXp: 0,
              avgWater: 0,
              avgActivity: 0,
              avgStreak: 0,
            },
          ]),
      hasChildren
        ? drizzleDb
            .select({
              tone: foodLogs.tone,
              count: count(),
            })
            .from(foodLogs)
            .where(childWhere(foodLogs.childId))
            .groupBy(foodLogs.tone)
        : Promise.resolve([]),
      hasChildren
        ? drizzleDb
            .select({ total: count() })
            .from(chatSessions)
            .where(childWhere(chatSessions.childId))
        : Promise.resolve([{ total: 0 }]),
      hasChildren
        ? drizzleDb
            .select({ total: count() })
            .from(chatMessages)
            .innerJoin(
              chatSessions,
              eq(chatMessages.sessionId, chatSessions.id)
            )
            .where(childWhere(chatSessions.childId))
        : Promise.resolve([{ total: 0 }]),
      hasChildren
        ? drizzleDb.query.dailyProgresses.findMany({
            where: childWhere(dailyProgresses.childId),
            limit: 8,
            orderBy: [desc(dailyProgresses.date)],
            with: {
              child: {
                columns: { name: true },
              },
            },
          })
        : Promise.resolve([]),
      hasChildren
        ? drizzleDb
            .select({ total: count() })
            .from(screeningRecords)
            .where(childWhere(screeningRecords.childId))
        : Promise.resolve([{ total: 0 }]),
      hasChildren
        ? drizzleDb
            .select({ total: count() })
            .from(screeningRecords)
            .where(
              effectivePosyanduId
                ? and(
                    eq(screeningRecords.riskCategory, "TINGGI"),
                    inArray(screeningRecords.childId, scopedChildIds!)
                  )
                : eq(screeningRecords.riskCategory, "TINGGI")
            )
        : Promise.resolve([{ total: 0 }]),
      hasChildren
        ? drizzleDb
            .select({ total: count() })
            .from(screeningRecords)
            .where(
              effectivePosyanduId
                ? and(
                    eq(screeningRecords.riskCategory, "SEDANG"),
                    inArray(screeningRecords.childId, scopedChildIds!)
                  )
                : eq(screeningRecords.riskCategory, "SEDANG")
            )
        : Promise.resolve([{ total: 0 }]),
      hasChildren
        ? drizzleDb
            .select({ total: count() })
            .from(screeningRecords)
            .where(
              effectivePosyanduId
                ? and(
                    eq(screeningRecords.riskCategory, "RENDAH"),
                    inArray(screeningRecords.childId, scopedChildIds!)
                  )
                : eq(screeningRecords.riskCategory, "RENDAH")
            )
        : Promise.resolve([{ total: 0 }]),
      hasChildren
        ? drizzleDb.query.screeningRecords.findMany({
            where: effectivePosyanduId
              ? and(
                  eq(screeningRecords.riskCategory, "TINGGI"),
                  inArray(screeningRecords.childId, scopedChildIds!)
                )
              : eq(screeningRecords.riskCategory, "TINGGI"),
            limit: 6,
            orderBy: [desc(screeningRecords.createdAt)],
            with: {
              child: {
                columns: { name: true, gender: true },
              },
              guardian: {
                columns: { name: true, phone: true, email: true },
              },
            },
          })
        : Promise.resolve([]),
      hasChildren
        ? drizzleDb
            .select({ total: count() })
            .from(growthMeasurements)
            .where(childWhere(growthMeasurements.childId))
        : Promise.resolve([{ total: 0 }]),
      hasChildren
        ? drizzleDb
            .select({
              nutritionalStatus: growthMeasurements.nutritionalStatus,
              count: count(),
            })
            .from(growthMeasurements)
            .where(childWhere(growthMeasurements.childId))
            .groupBy(growthMeasurements.nutritionalStatus)
        : Promise.resolve([]),
      hasChildren
        ? drizzleDb
            .select({
              total: count(),
              avgCalories: avg(detailedFoodLogs.caloriesKkal),
              avgCarbs: avg(detailedFoodLogs.carbsGram),
            })
            .from(detailedFoodLogs)
            .where(childWhere(detailedFoodLogs.childId))
        : Promise.resolve([{ total: 0, avgCalories: 0, avgCarbs: 0 }]),
      hasGuardians
        ? drizzleDb
            .select({
              status: consultations.status,
              count: count(),
            })
            .from(consultations)
            .where(guardianWhere(consultations.guardianId))
            .groupBy(consultations.status)
        : Promise.resolve([]),
      drizzleDb.select({ total: count() }).from(recipes),
      drizzleDb.select({ total: count() }).from(educationArticles),
    ]);

    const foodToneDistribution = {
      balanced: 0,
      sweet: 0,
      fried: 0,
      unknown: 0,
    };

    foodToneCounts.forEach((item) => {
      if (item.tone in foodToneDistribution) {
        foodToneDistribution[item.tone as keyof typeof foodToneDistribution] =
          Number(item.count);
      }
    });

    const growthDistribution: Record<string, number> = {
      "Gizi Baik (Normal)": 0,
      "Berisiko Gizi Lebih": 0,
      Obesitas: 0,
      "Gizi Kurang": 0,
    };
    growthNutritionalStats.forEach((g) => {
      if (g.nutritionalStatus) {
        growthDistribution[g.nutritionalStatus] = Number(g.count);
      }
    });

    const consultationsDist = {
      pending: 0,
      active: 0,
      completed: 0,
      total: 0,
    };
    consultationStats.forEach((cs) => {
      const cnt = Number(cs.count);
      if (cs.status === "PENDING") consultationsDist.pending = cnt;
      if (cs.status === "ACTIVE") consultationsDist.active = cnt;
      if (cs.status === "COMPLETED") consultationsDist.completed = cnt;
      consultationsDist.total += cnt;
    });

    const totalScreenings = Number(screeningsCount?.total ?? 0);
    const highRiskCount = Number(highRiskCountRow?.total ?? 0);
    const mediumRiskCount = Number(mediumRiskCountRow?.total ?? 0);
    const lowRiskCount = Number(lowRiskCountRow?.total ?? 0);

    return c.json({
      metrics: {
        totalGuardians: Number(guardiansCount?.total ?? 0),
        totalChildren: Number(childrenCount?.total ?? 0),
        totalWaterGlasses: Number(progressAgg?.sumWater ?? 0),
        totalActivityMinutes: Number(progressAgg?.sumActivity ?? 0),
        totalXpEarned: Number(progressAgg?.sumXp ?? 0),
        averageWaterGlasses: Number(
          Number(progressAgg?.avgWater ?? 0).toFixed(1)
        ),
        averageActivityMinutes: Number(
          Number(progressAgg?.avgActivity ?? 0).toFixed(1)
        ),
        averageStreak: Number(Number(progressAgg?.avgStreak ?? 0).toFixed(1)),
        totalChatSessions: Number(chatSessionsCount?.total ?? 0),
        totalChatMessages: Number(chatMessagesCount?.total ?? 0),
        foodToneDistribution,
        screening: {
          total: totalScreenings,
          highRiskCount,
          mediumRiskCount,
          lowRiskCount,
          highRiskPercentage:
            totalScreenings > 0
              ? Math.round((highRiskCount / totalScreenings) * 100)
              : 0,
        },
        growth: {
          total: Number(growthMeasurementsCount?.total ?? 0),
          distribution: growthDistribution,
        },
        nutrition: {
          totalLogs: Number(foodLogAgg?.total ?? 0),
          averageCalories: Math.round(Number(foodLogAgg?.avgCalories ?? 0)),
          averageCarbsGram: Number(
            Number(foodLogAgg?.avgCarbs ?? 0).toFixed(1)
          ),
        },
        consultations: consultationsDist,
        content: {
          totalRecipes: Number(recipesCount?.total ?? 0),
          totalArticles: Number(articlesCount?.total ?? 0),
        },
      },
      highRiskAlerts: recentHighRiskScreenings.map((s) => {
        const heightM = s.heightCm / 100;
        const bmiCalc =
          heightM > 0
            ? Number((s.weightKg / (heightM * heightM)).toFixed(1))
            : 0;
        return {
          id: s.id,
          childName: s.child.name,
          childAge: s.ageYears,
          childGender: s.child.gender || "-",
          guardianName: s.guardian.name || "Ibu",
          guardianPhone: s.guardian.phone || "-",
          riskScore: s.riskScore,
          riskCategory: s.riskCategory,
          bmi: bmiCalc,
          familyHistory: s.familyHistory,
          sweetDrinkFrequency: s.sweetDrinkFrequency,
          date: s.createdAt.toISOString().slice(0, 10),
        };
      }),
      recentActivity: recentProgress.map((p) => ({
        id: p.id,
        childName: p.child.name,
        date: p.date.toISOString().slice(0, 10),
        waterGlasses: p.waterGlasses,
        activityMinutes: p.activityMinutes,
        xp: p.xpEarned,
        streak: p.streak,
      })),
      scope: {
        effectivePosyanduId,
        posyandu: activePosyandu,
        isScoped: Boolean(effectivePosyanduId),
        userRole: authCheck.user.role,
      },
      system: {
        aiModel: process.env.AI_MODEL || "gpt-4o-mini",
        databaseStatus: "connected",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Admin metrics error:", error);
    return c.json(
      { error: { message: "Gagal memuat data metrik analitik." } },
      500
    );
  }
});

// =========================================================================
// MASTER DATA POSYANDU & ADMIN POSYANDU MANAGEMENT
// =========================================================================

adminRoutes.get("/posyandus", async (c) => {
  const authCheck = await verifyAdmin(c);
  if (!authCheck.authorized) return authCheck.response;

  try {
    const whereExpr =
      authCheck.isPosyandu && authCheck.posyanduId
        ? eq(posyandus.id, authCheck.posyanduId)
        : undefined;

    const allPosyandus = await drizzleDb
      .select()
      .from(posyandus)
      .where(whereExpr)
      .orderBy(asc(posyandus.name));

    const result = await Promise.all(
      allPosyandus.map(async (p) => {
        const [[cCount], [gCount], posyanduAdmins] = await Promise.all([
          drizzleDb
            .select({ total: count() })
            .from(children)
            .where(eq(children.posyanduId, p.id)),
          drizzleDb
            .select({ total: count() })
            .from(guardians)
            .where(
              and(
                eq(guardians.role, "GUARDIAN"),
                eq(guardians.posyanduId, p.id)
              )
            ),
          drizzleDb
            .select({
              id: guardians.id,
              name: guardians.name,
              email: guardians.email,
              phone: guardians.phone,
              createdAt: guardians.createdAt,
            })
            .from(guardians)
            .where(
              and(
                eq(guardians.role, "POSYANDU"),
                eq(guardians.posyanduId, p.id)
              )
            ),
        ]);

        return {
          ...p,
          childrenCount: cCount?.total || 0,
          guardiansCount: gCount?.total || 0,
          admins: posyanduAdmins,
        };
      })
    );

    return c.json({ posyandus: result });
  } catch (error) {
    console.error("Get posyandus error:", error);
    return c.json(
      { error: { message: "Gagal memuat master data Posyandu." } },
      500
    );
  }
});

const posyanduCreateSchema = z.object({
  name: z.string().trim().min(2, "Nama posyandu minimal 2 karakter"),
  code: z
    .string()
    .trim()
    .min(2, "Kode posyandu minimal 2 karakter")
    .toUpperCase(),
  rw: z.string().trim().optional(),
  rt: z.string().trim().optional(),
  kelurahan: z.string().trim().optional(),
  kecamatan: z.string().trim().optional(),
  city: z.string().trim().optional(),
  address: z.string().trim().optional(),
  contactPhone: z.string().trim().optional(),
  leaderName: z.string().trim().optional(),
  adminEmail: z.string().trim().toLowerCase().email().optional(),
  adminPassword: z.string().min(6).optional(),
  adminName: z.string().trim().optional(),
  adminPhone: z.string().trim().optional(),
});

adminRoutes.post("/posyandus", async (c) => {
  const authCheck = await verifySuperAdmin(c);
  if (!authCheck.authorized) return authCheck.response;

  try {
    const raw = await c.req.json().catch(() => null);
    const parsed = posyanduCreateSchema.safeParse(raw);
    if (!parsed.success) {
      return c.json(
        {
          error: {
            message:
              parsed.error.issues[0]?.message || "Input posyandu tidak valid.",
          },
        },
        400
      );
    }

    const {
      name,
      code,
      rw,
      rt,
      kelurahan,
      kecamatan,
      city,
      address,
      contactPhone,
      leaderName,
      adminEmail,
      adminPassword,
      adminName,
      adminPhone,
    } = parsed.data;

    const [existing] = await drizzleDb
      .select({ id: posyandus.id })
      .from(posyandus)
      .where(eq(posyandus.code, code))
      .limit(1);

    if (existing) {
      return c.json(
        {
          error: {
            message: "Kode Posyandu sudah digunakan. Gunakan kode lain.",
          },
        },
        409
      );
    }

    const [created] = await drizzleDb
      .insert(posyandus)
      .values({
        name,
        code,
        rw: rw || null,
        rt: rt || null,
        kelurahan: kelurahan || null,
        kecamatan: kecamatan || null,
        city: city || "Jakarta Selatan",
        address: address || null,
        contactPhone: contactPhone || null,
        leaderName: leaderName || null,
      })
      .returning();

    let createdAdmin = null;
    if (adminEmail && adminPassword) {
      const [emailCheck] = await drizzleDb
        .select({ id: guardians.id })
        .from(guardians)
        .where(eq(sql`lower(${guardians.email})`, adminEmail))
        .limit(1);

      if (!emailCheck) {
        const passwordHash = await Bun.password.hash(adminPassword, {
          algorithm: "bcrypt",
          cost: 10,
        });

        const [adminUser] = await drizzleDb
          .insert(guardians)
          .values({
            email: adminEmail,
            passwordHash,
            name: adminName || `Kader (${name})`,
            role: "POSYANDU",
            posyanduId: created.id,
            phone: adminPhone || contactPhone || null,
            address: address || null,
            occupation: "Kader Posyandu",
          })
          .returning({
            id: guardians.id,
            email: guardians.email,
            name: guardians.name,
          });
        createdAdmin = adminUser;
      }
    }

    return c.json({
      success: true,
      posyandu: created,
      admin: createdAdmin,
    });
  } catch (error) {
    console.error("Create posyandu error:", error);
    return c.json({ error: { message: "Gagal membuat posyandu baru." } }, 500);
  }
});

adminRoutes.put("/posyandus/:id", async (c) => {
  const authCheck = await verifySuperAdmin(c);
  if (!authCheck.authorized) return authCheck.response;

  const id = c.req.param("id");
  try {
    const raw = await c.req.json().catch(() => null);
    const parsed = posyanduCreateSchema.partial().safeParse(raw);
    if (!parsed.success) {
      return c.json(
        {
          error: {
            message:
              parsed.error.issues[0]?.message || "Input pembaruan tidak valid.",
          },
        },
        400
      );
    }

    const [existing] = await drizzleDb
      .select()
      .from(posyandus)
      .where(eq(posyandus.id, id))
      .limit(1);
    if (!existing) {
      return c.json({ error: { message: "Posyandu tidak ditemukan." } }, 404);
    }

    const [updated] = await drizzleDb
      .update(posyandus)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(posyandus.id, id))
      .returning();

    return c.json({ success: true, posyandu: updated });
  } catch (error) {
    console.error("Update posyandu error:", error);
    return c.json({ error: { message: "Gagal memperbarui posyandu." } }, 500);
  }
});

adminRoutes.delete("/posyandus/:id", async (c) => {
  const authCheck = await verifySuperAdmin(c);
  if (!authCheck.authorized) return authCheck.response;

  const id = c.req.param("id");
  try {
    await drizzleDb
      .update(children)
      .set({ posyanduId: null })
      .where(eq(children.posyanduId, id));
    await drizzleDb
      .update(guardians)
      .set({ posyanduId: null })
      .where(eq(guardians.posyanduId, id));

    await drizzleDb.delete(posyandus).where(eq(posyandus.id, id));
    return c.json({ success: true });
  } catch (error) {
    console.error("Delete posyandu error:", error);
    return c.json({ error: { message: "Gagal menghapus posyandu." } }, 500);
  }
});

adminRoutes.post("/posyandus/:id/admins", async (c) => {
  const authCheck = await verifySuperAdmin(c);
  if (!authCheck.authorized) return authCheck.response;

  const posyanduId = c.req.param("id");
  try {
    const raw = await c.req.json().catch(() => null);
    const schema = z.object({
      email: z.string().trim().toLowerCase().email(),
      password: z.string().min(6, "Password minimal 6 karakter"),
      name: z.string().trim().min(2, "Nama petugas minimal 2 karakter"),
      phone: z.string().trim().optional(),
    });

    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return c.json(
        {
          error: {
            message:
              parsed.error.issues[0]?.message || "Input akun admin tidak valid.",
          },
        },
        400
      );
    }

    const [posyandu] = await drizzleDb
      .select()
      .from(posyandus)
      .where(eq(posyandus.id, posyanduId))
      .limit(1);
    if (!posyandu) {
      return c.json({ error: { message: "Posyandu tidak ditemukan." } }, 404);
    }

    const [existingEmail] = await drizzleDb
      .select({ id: guardians.id })
      .from(guardians)
      .where(eq(sql`lower(${guardians.email})`, parsed.data.email))
      .limit(1);

    if (existingEmail) {
      return c.json(
        {
          error: {
            message: "Email sudah terdaftar di sistem. Gunakan email lain.",
          },
        },
        409
      );
    }

    const passwordHash = await Bun.password.hash(parsed.data.password, {
      algorithm: "bcrypt",
      cost: 10,
    });

    const [createdAdmin] = await drizzleDb
      .insert(guardians)
      .values({
        email: parsed.data.email,
        passwordHash,
        name: parsed.data.name,
        role: "POSYANDU",
        posyanduId,
        phone: parsed.data.phone || posyandu.contactPhone || null,
        occupation: "Kader Posyandu",
      })
      .returning({
        id: guardians.id,
        email: guardians.email,
        name: guardians.name,
        role: guardians.role,
        posyanduId: guardians.posyanduId,
      });

    return c.json({ success: true, admin: createdAdmin });
  } catch (error) {
    console.error("Create posyandu admin error:", error);
    return c.json(
      { error: { message: "Gagal membuat akun Admin Posyandu." } },
      500
    );
  }
});

// 2. GET /api/admin/export
adminRoutes.get("/export", async (c) => {
  const authCheck = await verifyAdmin(c);
  if (!authCheck.authorized) return authCheck.response;

  const format = c.req.query("format") === "json" ? "json" : "csv";
  const effectivePosyanduId = authCheck.isPosyandu
    ? authCheck.posyanduId
    : (c.req.query("posyanduId") || "").trim() || null;

  try {
    let whereExpr = undefined;
    if (effectivePosyanduId) {
      const childRows = await drizzleDb
        .select({ id: children.id })
        .from(children)
        .where(eq(children.posyanduId, effectivePosyanduId));
      const childIds = childRows.map((r) => r.id);
      if (childIds.length === 0) {
        if (format === "json") return c.json({ count: 0, data: [] });
        return c.text(
          "participant_id,date,water_glasses,activity_minutes,xp_earned,streak,food_entries_count,chat_messages_count\n",
          200,
          {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="sicehat-export-${new Date().toISOString().slice(0, 10)}.csv"`,
          }
        );
      }
      whereExpr = inArray(dailyProgresses.childId, childIds);
    }

    const records = await drizzleDb.query.dailyProgresses.findMany({
      where: whereExpr,
      orderBy: [asc(dailyProgresses.date)],
      with: {
        child: {
          columns: { id: true },
          with: {
            foodLogs: true,
            chatSessions: {
              with: {
                messages: {
                  columns: { id: true },
                },
              },
            },
          },
        },
      },
    });

    const participantMap = new Map<string, string>();
    let participantIndex = 1;

    function getAnonymizedParticipantId(childId: string) {
      if (!participantMap.has(childId)) {
        const hash = crypto
          .createHash("sha256")
          .update(childId)
          .digest("hex")
          .slice(0, 4)
          .toUpperCase();
        participantMap.set(
          childId,
          `P-${String(participantIndex).padStart(3, "0")}-${hash}`
        );
        participantIndex++;
      }
      return participantMap.get(childId)!;
    }

    const exportRows = records.map((record) => {
      const participantId = getAnonymizedParticipantId(record.childId);
      const dateStr = record.date.toISOString().slice(0, 10);

      const foodsForDate = record.child.foodLogs.filter(
        (f) => f.date.toISOString().slice(0, 10) === dateStr
      );

      const balancedCount = foodsForDate.filter(
        (f) => f.tone === "balanced"
      ).length;
      const sweetCount = foodsForDate.filter((f) => f.tone === "sweet").length;
      const friedCount = foodsForDate.filter((f) => f.tone === "fried").length;
      const unknownCount = foodsForDate.filter(
        (f) => f.tone === "unknown"
      ).length;

      const totalMessages = record.child.chatSessions.reduce(
        (acc, s) => acc + s.messages.length,
        0
      );

      return {
        participant_id: participantId,
        record_date: dateStr,
        water_glasses: record.waterGlasses,
        activity_minutes: record.activityMinutes,
        xp_earned: record.xpEarned,
        active_streak: record.streak,
        balanced_food_count: balancedCount,
        sweet_food_count: sweetCount,
        fried_food_count: friedCount,
        unknown_food_count: unknownCount,
        lifetime_chat_messages: totalMessages,
      };
    });

    if (format === "json") {
      return new Response(JSON.stringify(exportRows, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition":
            'attachment; filename="si_cehat_research_dataset.json"',
        },
      });
    }

    const headers = [
      "participant_id",
      "record_date",
      "water_glasses",
      "activity_minutes",
      "xp_earned",
      "active_streak",
      "balanced_food_count",
      "sweet_food_count",
      "fried_food_count",
      "unknown_food_count",
      "lifetime_chat_messages",
    ];

    const csvLines = [headers.join(",")];
    for (const row of exportRows) {
      csvLines.push(
        [
          row.participant_id,
          row.record_date,
          row.water_glasses,
          row.activity_minutes,
          row.xp_earned,
          row.active_streak,
          row.balanced_food_count,
          row.sweet_food_count,
          row.fried_food_count,
          row.unknown_food_count,
          row.lifetime_chat_messages,
        ].join(",")
      );
    }

    return new Response(csvLines.join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="si_cehat_research_dataset.csv"',
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return c.json({ error: { message: "Gagal mengekspor data riset." } }, 500);
  }
});

// 3. GET, POST, DELETE /api/admin/content
const challengeSchema = z.object({
  type: z.literal("challenge"),
  title: z.string().trim().min(3),
  description: z.string().trim().min(5),
  xp: z.number().int().min(5).max(100).default(30),
  isActive: z.boolean().default(false),
});

const quizSchema = z.object({
  type: z.literal("quiz"),
  question: z.string().trim().min(5),
  options: z.array(z.string().trim().min(1)).min(2).max(5),
  answer: z.string().trim().min(1),
  xp: z.number().int().min(5).max(100).default(20),
  isActive: z.boolean().default(false),
});

const menuSchema = z.object({
  type: z.literal("menu"),
  title: z.string().trim().min(3),
  note: z.string().trim().min(5),
  orderIndex: z.number().int().default(1),
});

const toggleSchema = z.object({
  type: z.literal("toggle"),
  entity: z.enum(["challenge", "quiz"]),
  id: z.string().uuid(),
  isActive: z.boolean(),
});

const deleteSchema = z.object({
  type: z.enum(["challenge", "quiz", "menu"]),
  id: z.string().uuid(),
});

adminRoutes.get("/content", async (c) => {
  const authCheck = await verifyAdmin(c);
  if (!authCheck.authorized) return authCheck.response;

  try {
    const [challengeList, quizList, menuList] = await Promise.all([
      drizzleDb.select().from(challenges).orderBy(desc(challenges.createdAt)),
      drizzleDb.select().from(quizzes).orderBy(desc(quizzes.createdAt)),
      drizzleDb
        .select()
        .from(recommendedMenus)
        .orderBy(asc(recommendedMenus.orderIndex)),
    ]);

    const formattedQuizzes = quizList.map((q) => {
      let parsedOptions: string[] = [];
      try {
        parsedOptions = JSON.parse(q.options);
      } catch {
        parsedOptions = [];
      }
      return {
        ...q,
        options: parsedOptions,
      };
    });

    return c.json({
      challenges: challengeList,
      quizzes: formattedQuizzes,
      menus: menuList,
    });
  } catch (error) {
    console.error("Admin content fetch error:", error);
    return c.json({ error: { message: "Gagal memuat konten edukasi." } }, 500);
  }
});

adminRoutes.post("/content", async (c) => {
  const authCheck = await verifyAdmin(c);
  if (!authCheck.authorized) return authCheck.response;

  try {
    const json = await c.req.json().catch(() => null);

    if (json?.type === "toggle") {
      const parsed = toggleSchema.safeParse(json);
      if (!parsed.success) {
        return c.json({ error: { message: "Input tidak valid" } }, 400);
      }

      if (parsed.data.entity === "challenge") {
        if (parsed.data.isActive) {
          await drizzleDb.update(challenges).set({ isActive: false });
        }
        await drizzleDb
          .update(challenges)
          .set({ isActive: parsed.data.isActive })
          .where(eq(challenges.id, parsed.data.id));
      } else {
        if (parsed.data.isActive) {
          await drizzleDb.update(quizzes).set({ isActive: false });
        }
        await drizzleDb
          .update(quizzes)
          .set({ isActive: parsed.data.isActive })
          .where(eq(quizzes.id, parsed.data.id));
      }

      return c.json({ success: true });
    }

    if (json?.type === "challenge") {
      const parsed = challengeSchema.safeParse(json);
      if (!parsed.success) {
        return c.json(
          {
            error: {
              message: parsed.error.issues[0]?.message || "Input tidak valid",
            },
          },
          400
        );
      }

      if (parsed.data.isActive) {
        await drizzleDb.update(challenges).set({ isActive: false });
      }

      const [created] = await drizzleDb
        .insert(challenges)
        .values({
          title: parsed.data.title,
          description: parsed.data.description,
          xp: parsed.data.xp,
          isActive: parsed.data.isActive,
        })
        .returning();
      return c.json({ success: true, item: created });
    }

    if (json?.type === "quiz") {
      const parsed = quizSchema.safeParse(json);
      if (!parsed.success) {
        return c.json(
          {
            error: {
              message: parsed.error.issues[0]?.message || "Input tidak valid",
            },
          },
          400
        );
      }

      if (parsed.data.isActive) {
        await drizzleDb.update(quizzes).set({ isActive: false });
      }

      const [created] = await drizzleDb
        .insert(quizzes)
        .values({
          question: parsed.data.question,
          options: JSON.stringify(parsed.data.options),
          answer: parsed.data.answer,
          xp: parsed.data.xp,
          isActive: parsed.data.isActive,
        })
        .returning();
      return c.json({ success: true, item: created });
    }

    if (json?.type === "menu") {
      const parsed = menuSchema.safeParse(json);
      if (!parsed.success) {
        return c.json(
          {
            error: {
              message: parsed.error.issues[0]?.message || "Input tidak valid",
            },
          },
          400
        );
      }

      const [created] = await drizzleDb
        .insert(recommendedMenus)
        .values({
          title: parsed.data.title,
          note: parsed.data.note,
          orderIndex: parsed.data.orderIndex,
        })
        .returning();
      return c.json({ success: true, item: created });
    }

    return c.json({ error: { message: "Tipe aksi tidak dikenali." } }, 400);
  } catch (error) {
    console.error("Admin content create error:", error);
    return c.json({ error: { message: "Gagal menyimpan konten." } }, 500);
  }
});

adminRoutes.delete("/content", async (c) => {
  const authCheck = await verifyAdmin(c);
  if (!authCheck.authorized) return authCheck.response;

  try {
    const json = await c.req.json().catch(() => null);
    const parsed = deleteSchema.safeParse(json);
    if (!parsed.success) {
      return c.json({ error: { message: "Data tidak valid" } }, 400);
    }

    const { type, id } = parsed.data;
    if (type === "challenge") {
      await drizzleDb.delete(challenges).where(eq(challenges.id, id));
    } else if (type === "quiz") {
      await drizzleDb.delete(quizzes).where(eq(quizzes.id, id));
    } else if (type === "menu") {
      await drizzleDb
        .delete(recommendedMenus)
        .where(eq(recommendedMenus.id, id));
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Admin content delete error:", error);
    return c.json({ error: { message: "Gagal menghapus konten." } }, 500);
  }
});

// 4. GET, POST /api/admin/recipes & PUT, DELETE /api/admin/recipes/:id
const recipeSchema = z.object({
  title: z.string().trim().min(3),
  category: z.enum(["makanan", "minuman", "camilan"]).default("makanan"),
  description: z.string().trim().min(5),
  caloriesKkal: z.number().int().min(0).default(150),
  carbsGram: z.number().min(0).default(20),
  proteinGram: z.number().min(0).default(8),
  fatGram: z.number().min(0).default(4),
  fiberGram: z.number().min(0).default(4),
  sugarGram: z.number().min(0).default(2),
  ingredients: z.array(z.string()).min(1),
  instructions: z.array(z.string()).min(1),
  imageUrl: z.string().url().optional().nullable(),
});

const updateRecipeSchema = recipeSchema.partial();

adminRoutes.get("/recipes", async (c) => {
  const authCheck = await verifyAdmin(c);
  if (!authCheck.authorized) return authCheck.response;

  try {
    const list = await drizzleDb
      .select()
      .from(recipes)
      .orderBy(desc(recipes.createdAt));

    const parsed = list.map((r) => {
      let ingredientsList: string[] = [];
      let instructionsList: string[] = [];
      try {
        ingredientsList = JSON.parse(r.ingredients);
      } catch {
        ingredientsList = [r.ingredients];
      }
      try {
        instructionsList = JSON.parse(r.instructions);
      } catch {
        instructionsList = [r.instructions];
      }
      return {
        ...r,
        ingredients: ingredientsList,
        instructions: instructionsList,
      };
    });

    return c.json({ recipes: parsed });
  } catch (error) {
    console.error("Admin get recipes error:", error);
    return c.json({ error: { message: "Gagal memuat daftar resep." } }, 500);
  }
});

adminRoutes.post("/recipes", async (c) => {
  const authCheck = await verifyAdmin(c);
  if (!authCheck.authorized) return authCheck.response;

  const json = await c.req.json().catch(() => null);
  const parsed = recipeSchema.safeParse(json);

  if (!parsed.success) {
    return c.json(
      {
        error: {
          message: parsed.error.issues[0]?.message || "Data resep tidak valid.",
        },
      },
      400
    );
  }

  try {
    const [recipe] = await drizzleDb
      .insert(recipes)
      .values({
        title: parsed.data.title,
        category: parsed.data.category,
        description: parsed.data.description,
        caloriesKkal: parsed.data.caloriesKkal,
        carbsGram: parsed.data.carbsGram,
        proteinGram: parsed.data.proteinGram,
        fatGram: parsed.data.fatGram,
        fiberGram: parsed.data.fiberGram,
        sugarGram: parsed.data.sugarGram,
        ingredients: JSON.stringify(parsed.data.ingredients),
        instructions: JSON.stringify(parsed.data.instructions),
        imageUrl: parsed.data.imageUrl ?? null,
      })
      .returning();

    return c.json({ recipe }, 201);
  } catch (error) {
    console.error("Admin create recipe error:", error);
    return c.json({ error: { message: "Gagal menyimpan resep." } }, 500);
  }
});

adminRoutes.put("/recipes/:id", async (c) => {
  const authCheck = await verifyAdmin(c);
  if (!authCheck.authorized) return authCheck.response;

  const id = c.req.param("id");
  const json = await c.req.json().catch(() => null);
  const parsed = updateRecipeSchema.safeParse(json);

  if (!parsed.success) {
    return c.json(
      {
        error: {
          message: parsed.error.issues[0]?.message || "Data resep tidak valid.",
        },
      },
      400
    );
  }

  try {
    const updateData: Record<string, unknown> = {};
    if (parsed.data.title) updateData.title = parsed.data.title;
    if (parsed.data.category) updateData.category = parsed.data.category;
    if (parsed.data.description) updateData.description = parsed.data.description;
    if (parsed.data.caloriesKkal !== undefined)
      updateData.caloriesKkal = parsed.data.caloriesKkal;
    if (parsed.data.carbsGram !== undefined)
      updateData.carbsGram = parsed.data.carbsGram;
    if (parsed.data.proteinGram !== undefined)
      updateData.proteinGram = parsed.data.proteinGram;
    if (parsed.data.fatGram !== undefined)
      updateData.fatGram = parsed.data.fatGram;
    if (parsed.data.fiberGram !== undefined)
      updateData.fiberGram = parsed.data.fiberGram;
    if (parsed.data.sugarGram !== undefined)
      updateData.sugarGram = parsed.data.sugarGram;
    if (parsed.data.ingredients)
      updateData.ingredients = JSON.stringify(parsed.data.ingredients);
    if (parsed.data.instructions)
      updateData.instructions = JSON.stringify(parsed.data.instructions);
    if (parsed.data.imageUrl !== undefined)
      updateData.imageUrl = parsed.data.imageUrl;

    const [recipe] = await drizzleDb
      .update(recipes)
      .set(updateData)
      .where(eq(recipes.id, id))
      .returning();

    return c.json({ recipe });
  } catch (error) {
    console.error("Admin update recipe error:", error);
    return c.json({ error: { message: "Gagal memperbarui resep." } }, 500);
  }
});

adminRoutes.delete("/recipes/:id", async (c) => {
  const authCheck = await verifyAdmin(c);
  if (!authCheck.authorized) return authCheck.response;

  const id = c.req.param("id");

  try {
    await drizzleDb.delete(recipes).where(eq(recipes.id, id));
    return c.json({ success: true, message: "Resep berhasil dihapus." });
  } catch (error) {
    console.error("Admin delete recipe error:", error);
    return c.json({ error: { message: "Gagal menghapus resep." } }, 500);
  }
});

// 5. GET, POST /api/admin/education & PUT, DELETE /api/admin/education/:id
const articleSchema = z.object({
  title: z.string().trim().min(3),
  slug: z.string().trim().min(3),
  category: z.enum(["artikel", "makanan", "video"]).default("artikel"),
  readTimeMinutes: z.number().int().min(1).default(3),
  summary: z.string().trim().min(5),
  content: z.string().trim().min(10),
  videoUrl: z.string().url().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
});

const updateArticleSchema = articleSchema.partial();

adminRoutes.get("/education", async (c) => {
  const authCheck = await verifyAdmin(c);
  if (!authCheck.authorized) return authCheck.response;

  try {
    const articles = await drizzleDb
      .select()
      .from(educationArticles)
      .orderBy(desc(educationArticles.publishedAt));

    return c.json({ articles });
  } catch (error) {
    console.error("Admin get education articles error:", error);
    return c.json({ error: { message: "Gagal memuat materi edukasi." } }, 500);
  }
});

adminRoutes.post("/education", async (c) => {
  const authCheck = await verifyAdmin(c);
  if (!authCheck.authorized) return authCheck.response;

  const json = await c.req.json().catch(() => null);
  const parsed = articleSchema.safeParse(json);

  if (!parsed.success) {
    return c.json(
      {
        error: {
          message:
            parsed.error.issues[0]?.message || "Data artikel tidak valid.",
        },
      },
      400
    );
  }

  try {
    const [article] = await drizzleDb
      .insert(educationArticles)
      .values({
        title: parsed.data.title,
        slug: parsed.data.slug.toLowerCase().replace(/\s+/g, "-"),
        category: parsed.data.category,
        readTimeMinutes: parsed.data.readTimeMinutes,
        summary: parsed.data.summary,
        content: parsed.data.content,
        videoUrl: parsed.data.videoUrl ?? null,
        imageUrl: parsed.data.imageUrl ?? null,
      })
      .returning();

    return c.json({ article }, 201);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return c.json({ error: { message: "Slug artikel sudah digunakan." } }, 409);
    }
    console.error("Admin create education article error:", error);
    return c.json(
      { error: { message: "Gagal menyimpan artikel edukasi." } },
      500
    );
  }
});

adminRoutes.put("/education/:id", async (c) => {
  const authCheck = await verifyAdmin(c);
  if (!authCheck.authorized) return authCheck.response;

  const id = c.req.param("id");
  const json = await c.req.json().catch(() => null);
  const parsed = updateArticleSchema.safeParse(json);

  if (!parsed.success) {
    return c.json(
      {
        error: {
          message:
            parsed.error.issues[0]?.message || "Data artikel tidak valid.",
        },
      },
      400
    );
  }

  try {
    const updateData: Record<string, unknown> = {};
    if (parsed.data.title) updateData.title = parsed.data.title;
    if (parsed.data.slug)
      updateData.slug = parsed.data.slug.toLowerCase().replace(/\s+/g, "-");
    if (parsed.data.category) updateData.category = parsed.data.category;
    if (parsed.data.readTimeMinutes !== undefined)
      updateData.readTimeMinutes = parsed.data.readTimeMinutes;
    if (parsed.data.summary) updateData.summary = parsed.data.summary;
    if (parsed.data.content) updateData.content = parsed.data.content;
    if (parsed.data.videoUrl !== undefined)
      updateData.videoUrl = parsed.data.videoUrl;
    if (parsed.data.imageUrl !== undefined)
      updateData.imageUrl = parsed.data.imageUrl;

    const [article] = await drizzleDb
      .update(educationArticles)
      .set(updateData)
      .where(eq(educationArticles.id, id))
      .returning();

    return c.json({ article });
  } catch (error) {
    console.error("Admin update article error:", error);
    return c.json(
      { error: { message: "Gagal memperbarui artikel edukasi." } },
      500
    );
  }
});

adminRoutes.delete("/education/:id", async (c) => {
  const authCheck = await verifyAdmin(c);
  if (!authCheck.authorized) return authCheck.response;

  const id = c.req.param("id");

  try {
    await drizzleDb
      .delete(educationArticles)
      .where(eq(educationArticles.id, id));
    return c.json({ success: true, message: "Artikel berhasil dihapus." });
  } catch (error) {
    console.error("Admin delete article error:", error);
    return c.json(
      { error: { message: "Gagal menghapus artikel edukasi." } },
      500
    );
  }
});

// 6. GET /api/admin/families
adminRoutes.get("/families", async (c) => {
  const authCheck = await verifyAdmin(c);
  if (!authCheck.authorized) return authCheck.response;

  const search = (c.req.query("search") || "").trim();
  const effectivePosyanduId = authCheck.isPosyandu
    ? authCheck.posyanduId
    : (c.req.query("posyanduId") || "").trim() || null;

  try {
    const conditions = [eq(guardians.role, "GUARDIAN")];
    if (effectivePosyanduId) {
      conditions.push(eq(guardians.posyanduId, effectivePosyanduId));
    }
    if (search) {
      conditions.push(
        or(
          ilike(guardians.name, `%${search}%`),
          ilike(guardians.email, `%${search}%`),
          ilike(guardians.phone, `%${search}%`)
        )!
      );
    }

    const whereExpr = and(...conditions);

    const families = await drizzleDb.query.guardians.findMany({
      where: whereExpr,
      orderBy: [desc(guardians.createdAt)],
      columns: {
        id: true,
        posyanduId: true,
        name: true,
        email: true,
        phone: true,
        education: true,
        occupation: true,
        address: true,
        createdAt: true,
      },
      with: {
        posyandu: {
          columns: {
            id: true,
            name: true,
            code: true,
          },
        },
        children: {
          columns: {
            id: true,
            posyanduId: true,
            name: true,
            gender: true,
            birthDate: true,
            healthHistory: true,
          },
          with: {
            screenings: {
              limit: 1,
              orderBy: [desc(screeningRecords.createdAt)],
              columns: {
                riskScore: true,
                riskCategory: true,
                createdAt: true,
              },
            },
            growthMeasurements: {
              limit: 1,
              orderBy: [desc(growthMeasurements.date)],
              columns: {
                weightKg: true,
                heightCm: true,
                nutritionalStatus: true,
                date: true,
              },
            },
          },
        },
      },
    });

    return c.json({ families });
  } catch (error) {
    console.error("Admin get families error:", error);
    return c.json(
      { error: { message: "Gagal memuat direktori keluarga." } },
      500
    );
  }
});

adminRoutes.patch("/families/:guardianId/posyandu", async (c) => {
  const authCheck = await verifyAdmin(c);
  if (!authCheck.authorized) return authCheck.response;

  const guardianId = c.req.param("guardianId");
  const raw = await c.req.json().catch(() => null);
  const targetPosyanduId = raw?.posyanduId || null;

  if (authCheck.isPosyandu && targetPosyanduId !== authCheck.posyanduId) {
    return c.json(
      {
        error: {
          message:
            "Admin Posyandu hanya dapat menetapkan keluarga ke wilayah Posyandu sendiri.",
        },
      },
      403
    );
  }

  try {
    await drizzleDb
      .update(guardians)
      .set({ posyanduId: targetPosyanduId })
      .where(eq(guardians.id, guardianId));

    await drizzleDb
      .update(children)
      .set({ posyanduId: targetPosyanduId })
      .where(eq(children.guardianId, guardianId));

    return c.json({ success: true });
  } catch (error) {
    console.error("Update family posyandu error:", error);
    return c.json(
      { error: { message: "Gagal memperbarui wilayah Posyandu keluarga." } },
      500
    );
  }
});

// 7. GET /api/admin/consultations & PATCH /api/admin/consultations/:id
adminRoutes.get("/consultations", async (c) => {
  const authCheck = await verifyAdmin(c);
  if (!authCheck.authorized) return authCheck.response;

  const status = c.req.query("status");
  const effectivePosyanduId = authCheck.isPosyandu
    ? authCheck.posyanduId
    : (c.req.query("posyanduId") || "").trim() || null;

  try {
    let guardianFilter = undefined;
    if (effectivePosyanduId) {
      const guardianRows = await drizzleDb
        .select({ id: guardians.id })
        .from(guardians)
        .where(eq(guardians.posyanduId, effectivePosyanduId));
      const guardianIds = guardianRows.map((g) => g.id);
      if (guardianIds.length === 0) {
        return c.json({ consultations: [] });
      }
      guardianFilter = inArray(consultations.guardianId, guardianIds);
    }

    const statusFilter =
      status && status !== "ALL"
        ? eq(consultations.status, status.toUpperCase())
        : undefined;

    const conditions = [];
    if (guardianFilter) conditions.push(guardianFilter);
    if (statusFilter) conditions.push(statusFilter);

    const whereExpr =
      conditions.length > 0 ? and(...conditions) : undefined;

    const list = await drizzleDb.query.consultations.findMany({
      where: whereExpr,
      orderBy: [desc(consultations.createdAt)],
      with: {
        guardian: {
          columns: {
            id: true,
            posyanduId: true,
            name: true,
            email: true,
            phone: true,
            education: true,
            occupation: true,
            address: true,
          },
          with: {
            posyandu: {
              columns: {
                id: true,
                name: true,
                code: true,
              },
            },
            children: {
              columns: {
                id: true,
                name: true,
                gender: true,
                birthDate: true,
              },
            },
          },
        },
      },
    });

    return c.json({ consultations: list });
  } catch (error) {
    console.error("Admin get consultations error:", error);
    return c.json(
      { error: { message: "Gagal memuat daftar konsultasi." } },
      500
    );
  }
});

const updateConsultationSchema = z.object({
  status: z.enum(["PENDING", "ACTIVE", "COMPLETED"]).optional(),
  notes: z.string().trim().max(2000).optional(),
});

adminRoutes.patch("/consultations/:id", async (c) => {
  const authCheck = await verifyAdmin(c);
  if (!authCheck.authorized) return authCheck.response;

  const id = c.req.param("id");
  const json = await c.req.json().catch(() => null);
  const parsed = updateConsultationSchema.safeParse(json);

  if (!parsed.success) {
    return c.json(
      {
        error: {
          message:
            parsed.error.issues[0]?.message || "Data konsultasi tidak valid.",
        },
      },
      400
    );
  }

  try {
    await drizzleDb
      .update(consultations)
      .set(parsed.data)
      .where(eq(consultations.id, id));

    const updated = await drizzleDb.query.consultations.findFirst({
      where: eq(consultations.id, id),
      with: {
        guardian: {
          columns: { name: true, phone: true },
        },
      },
    });

    return c.json({ consultation: updated });
  } catch (error) {
    console.error("Admin update consultation error:", error);
    return c.json(
      { error: { message: "Gagal memperbarui status konsultasi." } },
      500
    );
  }
});

// 8. GET, PUT /api/admin/bot-config & POST /api/admin/bot-config/test
const updateBotConfigSchema = z.object({
  provider: z.string().trim().min(1).default("openai"),
  model: z.string().trim().min(1).default("gpt-4o-mini"),
  baseUrl: z.string().trim().optional(),
  apiKey: z.string().trim().optional(),
  systemPrompt: z.string().trim().min(10),
  temperature: z.number().min(0).max(2).default(0.5),
  maxTokens: z.number().int().min(50).max(4000).default(300),
});

adminRoutes.get("/bot-config", async (c) => {
  const authCheck = await verifyAdmin(c);
  if (!authCheck.authorized) return authCheck.response;

  try {
    const config = await getResolvedBotConfig();
    return c.json({
      config: {
        provider: config.provider,
        model: config.model,
        baseUrl: config.baseUrl,
        maskedApiKey: maskApiKey(config.apiKey),
        isApiKeySet: config.isApiKeySet,
        systemPrompt: config.systemPrompt,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        isDbOverride: config.isDbOverride,
      },
    });
  } catch (error) {
    console.error("Fetch bot config error:", error);
    return c.json(
      { error: { message: "Gagal mengambil konfigurasi bot." } },
      500
    );
  }
});

adminRoutes.put("/bot-config", async (c) => {
  const authCheck = await verifyAdmin(c);
  if (!authCheck.authorized) return authCheck.response;

  try {
    const json = await c.req.json().catch(() => null);
    const parsed = updateBotConfigSchema.safeParse(json);

    if (!parsed.success) {
      return c.json(
        {
          error: {
            message:
              "Data konfigurasi tidak valid: " +
              (parsed.error.issues[0]?.message || ""),
          },
        },
        400
      );
    }

    const {
      provider,
      model,
      baseUrl,
      apiKey,
      systemPrompt,
      temperature,
      maxTokens,
    } = parsed.data;

    const [existing] = await drizzleDb
      .select()
      .from(botConfigs)
      .where(eq(botConfigs.id, "default"))
      .limit(1);

    let finalApiKey: string | null = null;
    if (apiKey && !apiKey.includes("••••") && apiKey.trim().length > 0) {
      finalApiKey = apiKey.trim();
    } else if (existing?.apiKey) {
      finalApiKey = existing.apiKey;
    }

    const now = new Date();
    const [updated] = existing
      ? await drizzleDb
          .update(botConfigs)
          .set({
            provider,
            model,
            baseUrl: baseUrl || null,
            apiKey: finalApiKey,
            systemPrompt,
            temperature,
            maxTokens,
            updatedAt: now,
          })
          .where(eq(botConfigs.id, "default"))
          .returning()
      : await drizzleDb
          .insert(botConfigs)
          .values({
            id: "default",
            provider,
            model,
            baseUrl: baseUrl || null,
            apiKey: finalApiKey,
            systemPrompt,
            temperature,
            maxTokens,
            updatedAt: now,
          })
          .returning();

    return c.json({
      success: true,
      config: {
        provider: updated.provider,
        model: updated.model,
        baseUrl: updated.baseUrl || "",
        maskedApiKey: maskApiKey(updated.apiKey),
        isApiKeySet: Boolean(updated.apiKey && updated.apiKey.length > 0),
        systemPrompt: updated.systemPrompt,
        temperature: updated.temperature,
        maxTokens: updated.maxTokens,
        isDbOverride: true,
      },
    });
  } catch (error) {
    console.error("Save bot config error:", error);
    return c.json(
      { error: { message: "Gagal menyimpan konfigurasi bot." } },
      500
    );
  }
});

const testConfigSchema = z.object({
  model: z.string().trim().optional(),
  baseUrl: z.string().trim().optional(),
  apiKey: z.string().trim().optional(),
  systemPrompt: z.string().trim().optional(),
  temperature: z.number().optional(),
  maxTokens: z.number().optional(),
  testPrompt: z
    .string()
    .trim()
    .default("Halo Si Cehat! Kenapa kita harus makan sayur setiap hari?"),
});

adminRoutes.post("/bot-config/test", async (c) => {
  const authCheck = await verifyAdmin(c);
  if (!authCheck.authorized) return authCheck.response;

  try {
    const json = await c.req.json().catch(() => ({}));
    const parsed = testConfigSchema.safeParse(json);
    const body = parsed.success
      ? parsed.data
      : { testPrompt: "Halo Si Cehat!" };

    const resolved = await getResolvedBotConfig();

    const model = body.model || resolved.model;
    const baseUrl = (body.baseUrl || resolved.baseUrl).replace(/\/$/, "");
    const apiKey =
      body.apiKey && !body.apiKey.includes("••••")
        ? body.apiKey
        : resolved.apiKey;
    const systemPrompt = body.systemPrompt || resolved.systemPrompt;
    const temperature = body.temperature ?? resolved.temperature;
    const maxTokens = body.maxTokens ?? 150;
    const testPrompt =
      body.testPrompt ||
      "Halo Si Cehat! Kenapa kita harus makan sayur setiap hari?";

    if (!apiKey || apiKey.includes("mock") || apiKey === "") {
      return c.json({
        success: true,
        isMock: true,
        latencyMs: 12,
        model: `${model} (Simulasi Offline / Mock Key)`,
        reply:
          "Halo Petualang Cilik! Sayur itu kaya serat dan vitamin yang membuat tubuhmu kuat, lincah bergerak, dan tidak mudah lemas!",
      });
    }

    const startTime = performance.now();

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: testPrompt },
        ],
      }),
    });

    const latencyMs = Math.round(performance.now() - startTime);

    if (!response.ok) {
      const errText = await response.text().catch(() => "Unknown error");
      return c.json(
        {
          error: {
            message: `Upstream error (${response.status}): ${errText.slice(0, 300)}`,
            status: response.status,
          },
        },
        502
      );
    }

    const resJson = await response.json();
    const reply =
      resJson.choices?.[0]?.message?.content?.trim() ||
      "(Tidak ada balasan yang dihasilkan)";

    return c.json({
      success: true,
      isMock: false,
      latencyMs,
      model,
      reply,
    });
  } catch (error: unknown) {
    console.error("Test bot config error:", error);
    const msg =
      error instanceof Error
        ? error.message
        : "Gagal menghubungi endpoint model.";
    return c.json({ error: { message: msg } }, 500);
  }
});
