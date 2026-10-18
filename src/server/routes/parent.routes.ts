import { Hono } from "hono";
import { z } from "zod";
import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { drizzleDb } from "../db";
import {
  guardians,
  children,
  dailyProgresses,
  growthMeasurements,
  screeningRecords,
  detailedFoodLogs,
  recipes,
  reminders,
  educationArticles,
  consultations,
} from "../db/schema";
import { getSession } from "../middleware/auth";

export const parentRoutes = new Hono();

// 1. GET & PUT /api/parent/profile
const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  phone: z.string().trim().max(25).optional(),
  education: z.string().trim().max(60).optional(),
  occupation: z.string().trim().max(60).optional(),
  address: z.string().trim().max(255).optional(),
});

parentRoutes.get("/parent/profile", async (c) => {
  const session = await getSession(c);
  if (!session?.user?.id) {
    return c.json({ error: { message: "Harus login terlebih dahulu." } }, 401);
  }

  try {
    const [guardian] = await drizzleDb
      .select({
        id: guardians.id,
        email: guardians.email,
        name: guardians.name,
        phone: guardians.phone,
        education: guardians.education,
        occupation: guardians.occupation,
        address: guardians.address,
        role: guardians.role,
        createdAt: guardians.createdAt,
      })
      .from(guardians)
      .where(eq(guardians.id, session.user.id))
      .limit(1);

    if (!guardian) {
      return c.json({ error: { message: "Data profil tidak ditemukan." } }, 404);
    }

    return c.json({ profile: guardian });
  } catch (error) {
    console.error("Get mother profile error:", error);
    return c.json({ error: { message: "Gagal memuat data profil ibu." } }, 500);
  }
});

parentRoutes.put("/parent/profile", async (c) => {
  const session = await getSession(c);
  if (!session?.user?.id) {
    return c.json({ error: { message: "Harus login terlebih dahulu." } }, 401);
  }

  const json = await c.req.json().catch(() => null);
  const parsed = updateProfileSchema.safeParse(json);

  if (!parsed.success) {
    return c.json(
      {
        error: {
          message:
            parsed.error.issues[0]?.message || "Data profil tidak valid.",
        },
      },
      400
    );
  }

  try {
    const [updated] = await drizzleDb
      .update(guardians)
      .set(parsed.data)
      .where(eq(guardians.id, session.user.id))
      .returning({
        id: guardians.id,
        email: guardians.email,
        name: guardians.name,
        phone: guardians.phone,
        education: guardians.education,
        occupation: guardians.occupation,
        address: guardians.address,
        role: guardians.role,
      });

    return c.json({ success: true, profile: updated });
  } catch (error) {
    console.error("Update mother profile error:", error);
    return c.json(
      { error: { message: "Gagal menyimpan perubahan profil ibu." } },
      500
    );
  }
});

// 2. GET & POST /api/children & GET, PUT /api/children/:id
const createChildSchema = z.object({
  name: z.string().trim().min(1, "Nama anak harus diisi").max(40),
});

const updateChildSchema = z.object({
  name: z.string().trim().min(1).max(40).optional(),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal lahir YYYY-MM-DD")
    .optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  healthHistory: z.string().trim().max(500).optional(),
});

parentRoutes.get("/children", async (c) => {
  const session = await getSession(c);
  if (!session?.user?.id) {
    return c.json({ error: { message: "Harus login terlebih dahulu." } }, 401);
  }

  try {
    const childList = await drizzleDb.query.children.findMany({
      where: eq(children.guardianId, session.user.id),
      with: {
        dailyProgresses: {
          orderBy: [desc(dailyProgresses.date)],
          limit: 7,
        },
      },
    });

    return c.json({ children: childList });
  } catch (error) {
    console.error("Get children error:", error);
    return c.json({ error: { message: "Gagal mengambil data anak." } }, 500);
  }
});

parentRoutes.post("/children", async (c) => {
  const session = await getSession(c);
  if (!session?.user?.id) {
    return c.json({ error: { message: "Harus login terlebih dahulu." } }, 401);
  }

  const json = await c.req.json().catch(() => null);
  const result = createChildSchema.safeParse(json);

  if (!result.success) {
    return c.json(
      {
        error: {
          message: result.error.issues[0]?.message || "Input tidak valid.",
        },
      },
      400
    );
  }

  try {
    const [child] = await drizzleDb
      .insert(children)
      .values({
        guardianId: session.user.id,
        name: result.data.name,
        avatarPreference: JSON.stringify({
          character: "default",
          accessory: "none",
          orbColor: "#4f9f7a",
        }),
      })
      .returning();

    return c.json({ child });
  } catch (error) {
    console.error("Create child error:", error);
    return c.json({ error: { message: "Gagal menambahkan data anak." } }, 500);
  }
});

parentRoutes.get("/children/:id", async (c) => {
  const session = await getSession(c);
  if (!session?.user?.id) {
    return c.json({ error: { message: "Harus login terlebih dahulu." } }, 401);
  }

  const id = c.req.param("id");

  try {
    const child = await drizzleDb.query.children.findFirst({
      where: eq(children.id, id),
      with: {
        growthMeasurements: {
          orderBy: [desc(growthMeasurements.date)],
          limit: 5,
        },
        screenings: {
          orderBy: [desc(screeningRecords.createdAt)],
          limit: 3,
        },
      },
    });

    if (!child) {
      return c.json({ error: { message: "Data anak tidak ditemukan." } }, 404);
    }

    if (
      session.user.role !== "ADMIN" &&
      child.guardianId !== session.user.id
    ) {
      return c.json({ error: { message: "Akses ditolak." } }, 403);
    }

    return c.json({ child });
  } catch (error) {
    console.error("Get child detail error:", error);
    return c.json({ error: { message: "Gagal mengambil data anak." } }, 500);
  }
});

parentRoutes.put("/children/:id", async (c) => {
  const session = await getSession(c);
  if (!session?.user?.id) {
    return c.json({ error: { message: "Harus login terlebih dahulu." } }, 401);
  }

  const id = c.req.param("id");
  const json = await c.req.json().catch(() => null);
  const parsed = updateChildSchema.safeParse(json);

  if (!parsed.success) {
    return c.json(
      {
        error: {
          message: parsed.error.issues[0]?.message || "Input tidak valid.",
        },
      },
      400
    );
  }

  try {
    const [existing] = await drizzleDb
      .select({ guardianId: children.guardianId })
      .from(children)
      .where(eq(children.id, id))
      .limit(1);

    if (!existing) {
      return c.json({ error: { message: "Data anak tidak ditemukan." } }, 404);
    }

    if (
      session.user.role !== "ADMIN" &&
      existing.guardianId !== session.user.id
    ) {
      return c.json({ error: { message: "Akses ditolak." } }, 403);
    }

    const { name, birthDate, gender, healthHistory } = parsed.data;
    const updatePayload: Record<string, unknown> = {};
    if (name !== undefined) updatePayload.name = name;
    if (birthDate !== undefined)
      updatePayload.birthDate = new Date(`${birthDate}T00:00:00.000Z`);
    if (gender !== undefined) updatePayload.gender = gender;
    if (healthHistory !== undefined) updatePayload.healthHistory = healthHistory;

    const [updated] = await drizzleDb
      .update(children)
      .set(updatePayload)
      .where(eq(children.id, id))
      .returning();

    return c.json({ success: true, child: updated });
  } catch (error) {
    console.error("Update child error:", error);
    return c.json({ error: { message: "Gagal memperbarui data anak." } }, 500);
  }
});

// 3. GET & POST /api/screening
const screeningSchema = z.object({
  childId: z.string().uuid("childId harus berupa UUID"),
  ageYears: z.number().int().min(1).max(18),
  weightKg: z.number().min(3).max(150),
  heightCm: z.number().min(40).max(220),
  familyHistory: z.boolean().default(false),
  sweetDrinkFrequency: z.enum(["jarang", "kadang", "sering"]).default("kadang"),
  physicalActivityHours: z.number().min(0).max(12).default(1.0),
});

parentRoutes.post("/screening", async (c) => {
  const session = await getSession(c);
  if (!session?.user?.id) {
    return c.json({ error: { message: "Harus login terlebih dahulu." } }, 401);
  }

  const json = await c.req.json().catch(() => null);
  const parsed = screeningSchema.safeParse(json);

  if (!parsed.success) {
    return c.json(
      {
        error: {
          message:
            parsed.error.issues[0]?.message || "Data skrining tidak valid.",
        },
      },
      400
    );
  }

  const {
    childId,
    ageYears,
    weightKg,
    heightCm,
    familyHistory,
    sweetDrinkFrequency,
    physicalActivityHours,
  } = parsed.data;

  try {
    const [child] = await drizzleDb
      .select({ guardianId: children.guardianId })
      .from(children)
      .where(eq(children.id, childId))
      .limit(1);

    if (!child) {
      return c.json({ error: { message: "Data anak tidak ditemukan." } }, 404);
    }

    if (
      session.user.role !== "ADMIN" &&
      child.guardianId !== session.user.id
    ) {
      return c.json({ error: { message: "Akses ditolak." } }, 403);
    }

    const heightM = heightCm / 100;
    const bmi = Number((weightKg / (heightM * heightM)).toFixed(1));

    let score = 0;
    const recs: string[] = [];

    if (bmi >= 23) {
      score += 35;
      recs.push(
        "Atur porsi makan dengan prinsip 'Isi Piringku' (1/2 sayur dan buah, 1/4 karbohidrat, 1/4 lauk protein)."
      );
    } else if (bmi >= 20) {
      score += 20;
    } else {
      score += 5;
    }

    if (familyHistory) {
      score += 25;
      recs.push(
        "Lakukan pemantauan pola makan teratur karena adanya faktor genetik risiko diabetes pada keluarga."
      );
    }

    if (sweetDrinkFrequency === "sering") {
      score += 25;
      recs.push(
        "Batasi minuman kemasan manis, sirup, dan boba maksimal 1 kali seminggu, ganti dengan air putih dingin beraroma buah."
      );
    } else if (sweetDrinkFrequency === "kadang") {
      score += 10;
      recs.push(
        "Biasakan anak membawa botol air putih sendiri saat bermain dan bersekolah."
      );
    }

    if (physicalActivityHours < 0.75) {
      score += 20;
      recs.push(
        "Ajak anak aktif bergerak atau bermain di luar ruangan minimal 60 menit setiap hari."
      );
    } else {
      score += 5;
    }

    const finalScore = Math.min(100, Math.max(5, score));
    let category = "RENDAH";
    let statusText = "Anak memiliki risiko rendah terhadap diabetes mellitus.";

    if (finalScore >= 55) {
      category = "TINGGI";
      statusText =
        "Anak memiliki potensi risiko tinggi terhadap diabetes mellitus. Disarankan berkonsultasi dengan dokter atau ahli gizi.";
    } else if (finalScore >= 25) {
      category = "SEDANG";
      statusText = "Anak memiliki risiko sedang terhadap diabetes mellitus.";
    }

    if (recs.length === 0) {
      recs.push(
        "Pertahankan pola makan seimbang dan kebiasaan minum air putih yang sudah berjalan baik!"
      );
    }

    const [screening] = await drizzleDb
      .insert(screeningRecords)
      .values({
        childId,
        guardianId: session.user.id,
        ageYears,
        weightKg,
        heightCm,
        familyHistory,
        sweetDrinkFrequency,
        physicalActivityHours,
        riskScore: finalScore,
        riskCategory: category,
        recommendations: JSON.stringify(recs),
      })
      .returning({ id: screeningRecords.id });

    const today = new Date(
      new Date().toISOString().slice(0, 10) + "T00:00:00.000Z"
    );
    const [existingGrowth] = await drizzleDb
      .select({ id: growthMeasurements.id })
      .from(growthMeasurements)
      .where(
        and(
          eq(growthMeasurements.childId, childId),
          eq(growthMeasurements.date, today)
        )
      )
      .limit(1);

    let nutStatus = "Gizi Baik (Normal)";
    if (bmi >= 23) nutStatus = "Beresiko Gizi Lebih";
    if (bmi >= 27) nutStatus = "Obesitas";
    if (bmi < 14) nutStatus = "Gizi Kurang";

    if (!existingGrowth) {
      await drizzleDb.insert(growthMeasurements).values({
        childId,
        date: today,
        weightKg,
        heightCm,
        bmi,
        nutritionalStatus: nutStatus,
      });
    }

    return c.json({
      success: true,
      screeningId: screening.id,
      riskScore: finalScore,
      riskCategory: category,
      title: statusText,
      bmi,
      nutritionalStatus: nutStatus,
      recommendations: recs,
    });
  } catch (error) {
    console.error("Screening calculation error:", error);
    return c.json({ error: { message: "Gagal memproses skrining risiko." } }, 500);
  }
});

parentRoutes.get("/screening", async (c) => {
  const session = await getSession(c);
  if (!session?.user?.id) {
    return c.json({ error: { message: "Harus login terlebih dahulu." } }, 401);
  }

  const childId = c.req.query("childId");
  if (!childId) {
    return c.json({ error: { message: "childId harus disertakan." } }, 400);
  }

  try {
    const records = await drizzleDb
      .select()
      .from(screeningRecords)
      .where(
        and(
          eq(screeningRecords.childId, childId),
          eq(screeningRecords.guardianId, session.user.id)
        )
      )
      .orderBy(desc(screeningRecords.createdAt))
      .limit(10);

    const parsedRecords = records.map((r) => {
      let recs: string[] = [];
      try {
        recs = JSON.parse(r.recommendations);
      } catch {
        recs = [];
      }
      return {
        id: r.id,
        date: r.createdAt.toISOString().slice(0, 10),
        ageYears: r.ageYears,
        weightKg: r.weightKg,
        heightCm: r.heightCm,
        riskScore: r.riskScore,
        riskCategory: r.riskCategory,
        recommendations: recs,
      };
    });

    return c.json({ history: parsedRecords });
  } catch (error) {
    console.error("Get screening history error:", error);
    return c.json({ error: { message: "Gagal memuat riwayat skrining." } }, 500);
  }
});

// 4. GET & POST /api/tracker/growth
const growthRecordSchema = z.object({
  childId: z.string().uuid(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  weightKg: z.number().min(3).max(150),
  heightCm: z.number().min(40).max(220),
});

parentRoutes.get("/tracker/growth", async (c) => {
  const session = await getSession(c);
  if (!session?.user?.id) {
    return c.json({ error: { message: "Harus login terlebih dahulu." } }, 401);
  }

  const childId = c.req.query("childId");
  if (!childId) {
    return c.json({ error: { message: "childId harus disertakan." } }, 400);
  }

  try {
    const measurements = await drizzleDb
      .select()
      .from(growthMeasurements)
      .where(eq(growthMeasurements.childId, childId))
      .orderBy(asc(growthMeasurements.date));

    const latest =
      measurements.length > 0 ? measurements[measurements.length - 1] : null;

    return c.json({
      childId,
      latestWeightKg: latest?.weightKg ?? null,
      latestHeightCm: latest?.heightCm ?? null,
      bmi: latest?.bmi ?? null,
      nutritionalStatus: latest?.nutritionalStatus ?? "Belum ada pengukuran",
      history: measurements.map((m) => ({
        id: m.id,
        date: m.date.toISOString().slice(0, 10),
        weightKg: m.weightKg,
        heightCm: m.heightCm,
        bmi: m.bmi,
        status: m.nutritionalStatus,
      })),
    });
  } catch (error) {
    console.error("Get growth tracker error:", error);
    return c.json(
      { error: { message: "Gagal memuat data tracker tumbuh kembang." } },
      500
    );
  }
});

parentRoutes.post("/tracker/growth", async (c) => {
  const session = await getSession(c);
  if (!session?.user?.id) {
    return c.json({ error: { message: "Harus login terlebih dahulu." } }, 401);
  }

  const json = await c.req.json().catch(() => null);
  const parsed = growthRecordSchema.safeParse(json);

  if (!parsed.success) {
    return c.json(
      {
        error: {
          message: parsed.error.issues[0]?.message || "Input tidak valid.",
        },
      },
      400
    );
  }

  const { childId, date, weightKg, heightCm } = parsed.data;
  const targetDate = new Date(
    (date || new Date().toISOString().slice(0, 10)) + "T00:00:00.000Z"
  );

  try {
    const [child] = await drizzleDb
      .select({ guardianId: children.guardianId })
      .from(children)
      .where(eq(children.id, childId))
      .limit(1);

    if (!child) {
      return c.json({ error: { message: "Data anak tidak ditemukan." } }, 404);
    }

    if (
      session.user.role !== "ADMIN" &&
      child.guardianId !== session.user.id
    ) {
      return c.json({ error: { message: "Akses ditolak." } }, 403);
    }

    const heightM = heightCm / 100;
    const bmi = Number((weightKg / (heightM * heightM)).toFixed(1));

    let nutStatus = "Gizi Baik (Normal)";
    if (bmi >= 23) nutStatus = "Beresiko Gizi Lebih";
    if (bmi >= 27) nutStatus = "Obesitas";
    if (bmi < 14) nutStatus = "Gizi Kurang";

    const [record] = await drizzleDb
      .insert(growthMeasurements)
      .values({
        childId,
        date: targetDate,
        weightKg,
        heightCm,
        bmi,
        nutritionalStatus: nutStatus,
      })
      .returning({ id: growthMeasurements.id });

    return c.json({
      success: true,
      measurement: {
        id: record.id,
        date: targetDate.toISOString().slice(0, 10),
        weightKg,
        heightCm,
        bmi,
        nutritionalStatus: nutStatus,
      },
    });
  } catch (error) {
    console.error("Create growth measurement error:", error);
    return c.json(
      { error: { message: "Gagal menyimpan data pengukuran." } },
      500
    );
  }
});

// 5. POST /api/nutrition/calculate & GET, POST /api/food-diary
const calculateNutritionSchema = z
  .object({
    foodName: z.string().trim().min(2, "Nama makanan minimal 2 karakter"),
    weightGram: z.number().min(1).max(5000).optional(),
    portionGram: z.number().min(1).max(5000).optional(),
  })
  .transform((data) => ({
    foodName: data.foodName,
    weightGram: data.weightGram ?? data.portionGram ?? 100,
  }));

const FOOD_NUTRITION_DB: Record<
  string,
  {
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
    sugar: number;
    fiber: number;
  }
> = {
  nasi: { calories: 130, carbs: 28, protein: 2.7, fat: 0.3, sugar: 0.1, fiber: 0.4 },
  "nasi putih": { calories: 130, carbs: 28, protein: 2.7, fat: 0.3, sugar: 0.1, fiber: 0.4 },
  "nasi merah": { calories: 111, carbs: 23, protein: 2.6, fat: 0.9, sugar: 0.4, fiber: 1.8 },
  ayam: { calories: 239, carbs: 0, protein: 27, fat: 14, sugar: 0, fiber: 0 },
  "ayam goreng": { calories: 260, carbs: 1.5, protein: 25, fat: 17, sugar: 0.1, fiber: 0 },
  "ayam rebus": { calories: 165, carbs: 0, protein: 31, fat: 3.6, sugar: 0, fiber: 0 },
  telur: { calories: 155, carbs: 1.1, protein: 13, fat: 11, sugar: 1.1, fiber: 0 },
  "telur rebus": { calories: 155, carbs: 1.1, protein: 13, fat: 11, sugar: 1.1, fiber: 0 },
  "telur dadar": { calories: 180, carbs: 1.5, protein: 12, fat: 14, sugar: 0.5, fiber: 0 },
  tempe: { calories: 193, carbs: 9.4, protein: 20.8, fat: 10.8, sugar: 0.5, fiber: 4.8 },
  "tempe goreng": { calories: 225, carbs: 12, protein: 18, fat: 15, sugar: 0.5, fiber: 4.0 },
  tahu: { calories: 76, carbs: 1.9, protein: 8, fat: 4.8, sugar: 0.5, fiber: 0.3 },
  "tahu goreng": { calories: 115, carbs: 3.5, protein: 9, fat: 8, sugar: 0.3, fiber: 0.5 },
  lele: { calories: 145, carbs: 0, protein: 18, fat: 8, sugar: 0, fiber: 0 },
  "pecel lele": { calories: 210, carbs: 4, protein: 22, fat: 11, sugar: 1, fiber: 1.5 },
  bayam: { calories: 23, carbs: 3.6, protein: 2.9, fat: 0.4, sugar: 0.4, fiber: 2.2 },
  "sayur bayam": { calories: 28, carbs: 4.2, protein: 2.5, fat: 0.5, sugar: 0.8, fiber: 2.5 },
  "sayur asem": { calories: 35, carbs: 6.5, protein: 1.8, fat: 0.5, sugar: 1.8, fiber: 1.5 },
  wortel: { calories: 41, carbs: 9.6, protein: 0.9, fat: 0.2, sugar: 4.7, fiber: 2.8 },
  apel: { calories: 52, carbs: 13.8, protein: 0.3, fat: 0.2, sugar: 10.4, fiber: 2.4 },
  pisang: { calories: 89, carbs: 22.8, protein: 1.1, fat: 0.3, sugar: 12.2, fiber: 2.6 },
  pepaya: { calories: 43, carbs: 10.8, protein: 0.5, fat: 0.3, sugar: 7.8, fiber: 1.7 },
  donat: { calories: 452, carbs: 51, protein: 4.9, fat: 25, sugar: 27, fiber: 1.5 },
  "es teh manis": { calories: 90, carbs: 23, protein: 0.1, fat: 0, sugar: 22, fiber: 0 },
  boba: { calories: 320, carbs: 78, protein: 0.5, fat: 1.2, sugar: 48, fiber: 0.5 },
  susu: { calories: 65, carbs: 4.8, protein: 3.3, fat: 3.6, sugar: 5.1, fiber: 0 },
};

parentRoutes.post("/nutrition/calculate", async (c) => {
  const json = await c.req.json().catch(() => null);
  const parsed = calculateNutritionSchema.safeParse(json);

  if (!parsed.success) {
    return c.json(
      {
        error: {
          message:
            parsed.error.issues[0]?.message ||
            "Input nama bahan atau berat tidak valid.",
        },
      },
      400
    );
  }

  const { foodName, weightGram } = parsed.data;
  const normalized = foodName.toLowerCase().trim();

  let refItem = FOOD_NUTRITION_DB[normalized];
  if (!refItem) {
    const key = Object.keys(FOOD_NUTRITION_DB).find(
      (k) => normalized.includes(k) || k.includes(normalized)
    );
    if (key) {
      refItem = FOOD_NUTRITION_DB[key];
    }
  }

  if (!refItem) {
    refItem = {
      calories: 120,
      carbs: 15,
      protein: 5,
      fat: 4,
      sugar: 3,
      fiber: 2,
    };
  }

  const multiplier = weightGram / 100;

  return c.json({
    foodName,
    weightGram,
    caloriesKkal: Math.round(refItem.calories * multiplier),
    carbsGram: Number((refItem.carbs * multiplier).toFixed(1)),
    proteinGram: Number((refItem.protein * multiplier).toFixed(1)),
    fatGram: Number((refItem.fat * multiplier).toFixed(1)),
    sugarGram: Number((refItem.sugar * multiplier).toFixed(1)),
    fiberGram: Number((refItem.fiber * multiplier).toFixed(1)),
    note: "Dihitung berdasarkan data komposisi pangan dan porsi takaran.",
  });
});

const foodDiarySchema = z.object({
  childId: z.string().uuid(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  mealSlot: z.enum(["sarapan", "siang", "camilan", "malam"]),
  foodName: z.string().trim().min(2).max(100),
  portion: z.string().trim().default("1 porsi sedang"),
  caloriesKkal: z.number().int().optional(),
  carbsGram: z.number().optional(),
  proteinGram: z.number().optional(),
  fatGram: z.number().optional(),
  imageUrl: z.string().url().optional(),
});

parentRoutes.get("/food-diary", async (c) => {
  const session = await getSession(c);
  if (!session?.user?.id) {
    return c.json({ error: { message: "Harus login terlebih dahulu." } }, 401);
  }

  const childId = c.req.query("childId");
  const dateStr =
    c.req.query("date") || new Date().toISOString().slice(0, 10);
  const targetDate = new Date(`${dateStr}T00:00:00.000Z`);

  if (!childId) {
    return c.json({ error: { message: "childId harus disertakan." } }, 400);
  }

  try {
    const items = await drizzleDb
      .select()
      .from(detailedFoodLogs)
      .where(
        and(
          eq(detailedFoodLogs.childId, childId),
          eq(detailedFoodLogs.date, targetDate)
        )
      )
      .orderBy(asc(detailedFoodLogs.createdAt));

    const grouped: Record<string, typeof items> = {
      sarapan: [],
      siang: [],
      camilan: [],
      malam: [],
    };

    let totalCalories = 0;
    items.forEach((item) => {
      if (item.mealSlot in grouped) {
        grouped[item.mealSlot].push(item);
      }
      if (item.caloriesKkal) {
        totalCalories += item.caloriesKkal;
      }
    });

    return c.json({
      date: dateStr,
      childId,
      totalCalories,
      slots: grouped,
      totalItems: items.length,
    });
  } catch (error) {
    console.error("Get food diary error:", error);
    return c.json({ error: { message: "Gagal memuat diary makan." } }, 500);
  }
});

parentRoutes.post("/food-diary", async (c) => {
  const session = await getSession(c);
  if (!session?.user?.id) {
    return c.json({ error: { message: "Harus login terlebih dahulu." } }, 401);
  }

  const json = await c.req.json().catch(() => null);
  const parsed = foodDiarySchema.safeParse(json);

  if (!parsed.success) {
    return c.json(
      {
        error: {
          message:
            parsed.error.issues[0]?.message || "Input diary makan tidak valid.",
        },
      },
      400
    );
  }

  const {
    childId,
    date,
    mealSlot,
    foodName,
    portion,
    caloriesKkal,
    carbsGram,
    proteinGram,
    fatGram,
    imageUrl,
  } = parsed.data;
  const targetDate = new Date(
    (date || new Date().toISOString().slice(0, 10)) + "T00:00:00.000Z"
  );

  try {
    const [child] = await drizzleDb
      .select({ guardianId: children.guardianId })
      .from(children)
      .where(eq(children.id, childId))
      .limit(1);

    if (!child) {
      return c.json({ error: { message: "Data anak tidak ditemukan." } }, 404);
    }

    if (
      session.user.role !== "ADMIN" &&
      child.guardianId !== session.user.id
    ) {
      return c.json({ error: { message: "Akses ditolak." } }, 403);
    }

    const [created] = await drizzleDb
      .insert(detailedFoodLogs)
      .values({
        childId,
        date: targetDate,
        mealSlot,
        foodName,
        portion,
        caloriesKkal,
        carbsGram,
        proteinGram,
        fatGram,
        imageUrl,
      })
      .returning();

    return c.json({ success: true, item: created });
  } catch (error) {
    console.error("Create food diary error:", error);
    return c.json(
      { error: { message: "Gagal menyimpan catatan diary makan." } },
      500
    );
  }
});

// 6. GET /api/recipes & GET /api/recipes/:id
parentRoutes.get("/recipes", async (c) => {
  const category = c.req.query("category");
  const search = c.req.query("search");

  try {
    const conditions = [];
    if (category && category !== "semua") {
      conditions.push(eq(recipes.category, category.toLowerCase()));
    }
    if (search && search.trim().length > 0) {
      conditions.push(ilike(recipes.title, `%${search.trim()}%`));
    }

    const recipeList = await drizzleDb
      .select({
        id: recipes.id,
        title: recipes.title,
        category: recipes.category,
        description: recipes.description,
        caloriesKkal: recipes.caloriesKkal,
        carbsGram: recipes.carbsGram,
        proteinGram: recipes.proteinGram,
        fatGram: recipes.fatGram,
        fiberGram: recipes.fiberGram,
        sugarGram: recipes.sugarGram,
        imageUrl: recipes.imageUrl,
      })
      .from(recipes)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(recipes.createdAt));

    return c.json({
      recipes: recipeList,
      total: recipeList.length,
    });
  } catch (error) {
    console.error("Get recipes error:", error);
    return c.json(
      { error: { message: "Gagal memuat resep sehat tradisional." } },
      500
    );
  }
});

parentRoutes.get("/recipes/:id", async (c) => {
  const id = c.req.param("id");

  try {
    const [recipe] = await drizzleDb
      .select()
      .from(recipes)
      .where(eq(recipes.id, id))
      .limit(1);

    if (!recipe) {
      return c.json({ error: { message: "Resep tidak ditemukan." } }, 404);
    }

    let ingredientsList: string[] = [];
    let instructionsList: string[] = [];

    try {
      ingredientsList = JSON.parse(recipe.ingredients);
    } catch {
      ingredientsList = [recipe.ingredients];
    }

    try {
      instructionsList = JSON.parse(recipe.instructions);
    } catch {
      instructionsList = [recipe.instructions];
    }

    return c.json({
      recipe: {
        id: recipe.id,
        title: recipe.title,
        category: recipe.category,
        description: recipe.description,
        caloriesKkal: recipe.caloriesKkal,
        carbsGram: recipe.carbsGram,
        proteinGram: recipe.proteinGram,
        fatGram: recipe.fatGram,
        fiberGram: recipe.fiberGram,
        sugarGram: recipe.sugarGram,
        imageUrl: recipe.imageUrl,
        ingredients: ingredientsList,
        instructions: instructionsList,
      },
    });
  } catch (error) {
    console.error("Get recipe detail error:", error);
    return c.json({ error: { message: "Gagal memuat detail resep." } }, 500);
  }
});

// 7. GET, POST /api/reminders & PATCH, DELETE /api/reminders/:id
const createReminderSchema = z.object({
  title: z.string().trim().min(2).max(60),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format waktu harus HH:mm (contoh 07:00)"),
  category: z.enum(["makan", "minum", "aktivitas", "tidur", "umum"]).default("umum"),
  childId: z.string().uuid().optional(),
});

const patchReminderSchema = z.object({
  isEnabled: z.boolean().optional(),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  title: z.string().trim().min(2).max(60).optional(),
});

const DEFAULT_REMINDERS = [
  { title: "Sarapan Pagi", time: "07:00", category: "makan", isEnabled: true },
  { title: "Minum air putih", time: "10:00", category: "minum", isEnabled: true },
  { title: "Aktivitas Fisik", time: "15:30", category: "aktivitas", isEnabled: false },
  { title: "Waktu Tidur", time: "20:00", category: "tidur", isEnabled: true },
];

parentRoutes.get("/reminders", async (c) => {
  const session = await getSession(c);
  if (!session?.user?.id) {
    return c.json({ error: { message: "Harus login terlebih dahulu." } }, 401);
  }

  const childId = c.req.query("childId");

  try {
    const conditions = [eq(reminders.guardianId, session.user.id)];
    if (childId) conditions.push(eq(reminders.childId, childId));

    let reminderList = await drizzleDb
      .select()
      .from(reminders)
      .where(and(...conditions))
      .orderBy(asc(reminders.time));

    if (reminderList.length === 0) {
      await drizzleDb.insert(reminders).values(
        DEFAULT_REMINDERS.map((r) => ({
          guardianId: session.user.id,
          childId: childId || null,
          title: r.title,
          time: r.time,
          category: r.category,
          isEnabled: r.isEnabled,
        }))
      );

      reminderList = await drizzleDb
        .select()
        .from(reminders)
        .where(eq(reminders.guardianId, session.user.id))
        .orderBy(asc(reminders.time));
    }

    return c.json({ reminders: reminderList });
  } catch (error) {
    console.error("Get reminders error:", error);
    return c.json(
      { error: { message: "Gagal memuat jadwal reminder." } },
      500
    );
  }
});

parentRoutes.post("/reminders", async (c) => {
  const session = await getSession(c);
  if (!session?.user?.id) {
    return c.json({ error: { message: "Harus login terlebih dahulu." } }, 401);
  }

  const json = await c.req.json().catch(() => null);
  const parsed = createReminderSchema.safeParse(json);

  if (!parsed.success) {
    return c.json(
      {
        error: {
          message:
            parsed.error.issues[0]?.message || "Input reminder tidak valid.",
        },
      },
      400
    );
  }

  const { title, time, category, childId } = parsed.data;

  try {
    const [reminder] = await drizzleDb
      .insert(reminders)
      .values({
        guardianId: session.user.id,
        childId: childId || null,
        title,
        time,
        category,
        isEnabled: true,
      })
      .returning();

    return c.json({ success: true, reminder });
  } catch (error) {
    console.error("Create reminder error:", error);
    return c.json(
      { error: { message: "Gagal membuat jadwal reminder." } },
      500
    );
  }
});

parentRoutes.patch("/reminders/:id", async (c) => {
  const session = await getSession(c);
  if (!session?.user?.id) {
    return c.json({ error: { message: "Harus login terlebih dahulu." } }, 401);
  }

  const id = c.req.param("id");
  const json = await c.req.json().catch(() => null);
  const parsed = patchReminderSchema.safeParse(json);

  if (!parsed.success) {
    return c.json(
      {
        error: {
          message: parsed.error.issues[0]?.message || "Input tidak valid.",
        },
      },
      400
    );
  }

  try {
    const [existing] = await drizzleDb
      .select({ guardianId: reminders.guardianId })
      .from(reminders)
      .where(eq(reminders.id, id))
      .limit(1);

    if (!existing) {
      return c.json({ error: { message: "Reminder tidak ditemukan." } }, 404);
    }

    if (
      session.user.role !== "ADMIN" &&
      existing.guardianId !== session.user.id
    ) {
      return c.json({ error: { message: "Akses ditolak." } }, 403);
    }

    const [updated] = await drizzleDb
      .update(reminders)
      .set(parsed.data)
      .where(eq(reminders.id, id))
      .returning();

    return c.json({ success: true, reminder: updated });
  } catch (error) {
    console.error("Patch reminder error:", error);
    return c.json({ error: { message: "Gagal memperbarui reminder." } }, 500);
  }
});

parentRoutes.delete("/reminders/:id", async (c) => {
  const session = await getSession(c);
  if (!session?.user?.id) {
    return c.json({ error: { message: "Harus login terlebih dahulu." } }, 401);
  }

  const id = c.req.param("id");

  try {
    const [existing] = await drizzleDb
      .select({ guardianId: reminders.guardianId })
      .from(reminders)
      .where(eq(reminders.id, id))
      .limit(1);

    if (!existing) {
      return c.json({ error: { message: "Reminder tidak ditemukan." } }, 404);
    }

    if (
      session.user.role !== "ADMIN" &&
      existing.guardianId !== session.user.id
    ) {
      return c.json({ error: { message: "Akses ditolak." } }, 403);
    }

    await drizzleDb.delete(reminders).where(eq(reminders.id, id));
    return c.json({ success: true });
  } catch (error) {
    console.error("Delete reminder error:", error);
    return c.json({ error: { message: "Gagal menghapus reminder." } }, 500);
  }
});

// 8. GET, POST /api/education/articles & GET /api/education/articles/:id
const createArticleSchema = z.object({
  title: z.string().trim().min(3),
  slug: z.string().trim().min(3),
  category: z.enum(["artikel", "makanan", "video"]).default("artikel"),
  readTimeMinutes: z.number().int().min(1).default(3),
  summary: z.string().trim().min(5),
  content: z.string().trim().min(10),
  videoUrl: z.string().url().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
});

parentRoutes.get("/education/articles", async (c) => {
  const category = c.req.query("category");
  const search = c.req.query("search");
  const page = Math.max(1, parseInt(c.req.query("page") || "1", 10));
  const limit = Math.min(
    50,
    Math.max(1, parseInt(c.req.query("limit") || "10", 10))
  );
  const offset = (page - 1) * limit;

  try {
    const conditions = [];
    if (category && category !== "semua") {
      conditions.push(eq(educationArticles.category, category));
    }
    if (search) {
      conditions.push(
        or(
          ilike(educationArticles.title, `%${search}%`),
          ilike(educationArticles.summary, `%${search}%`)
        )!
      );
    }

    const whereExpr = conditions.length > 0 ? and(...conditions) : undefined;

    const [[totalRow], articles] = await Promise.all([
      drizzleDb
        .select({ total: count() })
        .from(educationArticles)
        .where(whereExpr),
      drizzleDb
        .select()
        .from(educationArticles)
        .where(whereExpr)
        .orderBy(desc(educationArticles.publishedAt))
        .limit(limit)
        .offset(offset),
    ]);

    const total = Number(totalRow?.total ?? 0);

    return c.json({
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data: articles,
    });
  } catch (error) {
    console.error("Get education articles error:", error);
    return c.json(
      { error: { message: "Gagal memuat materi edukasi kesehatan." } },
      500
    );
  }
});

parentRoutes.post("/education/articles", async (c) => {
  const session = await getSession(c);
  if (!session?.user?.id) {
    return c.json(
      { error: { message: "Harus login untuk menambah artikel edukasi." } },
      401
    );
  }

  const json = await c.req.json().catch(() => null);
  const parsed = createArticleSchema.safeParse(json);

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
        slug: parsed.data.slug,
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
    console.error("Create education article error:", error);
    return c.json(
      { error: { message: "Gagal menyimpan artikel edukasi." } },
      500
    );
  }
});

parentRoutes.get("/education/articles/:id", async (c) => {
  const id = c.req.param("id");

  try {
    const [article] = await drizzleDb
      .select()
      .from(educationArticles)
      .where(
        or(eq(educationArticles.id, id), eq(educationArticles.slug, id))
      )
      .limit(1);

    if (!article) {
      return c.json(
        { error: { message: "Materi edukasi tidak ditemukan." } },
        404
      );
    }

    return c.json({ article });
  } catch (error) {
    console.error("Get article detail error:", error);
    return c.json(
      { error: { message: "Gagal memuat detail artikel edukasi." } },
      500
    );
  }
});

// 9. GET /api/consultations/specialists & GET, POST /api/consultations
const SPECIALISTS = [
  {
    id: "spec-bidan-1",
    name: "Bidan Siti Nurhaliza, Amd.Keb",
    title: "Bidan Praktik Mandiri",
    type: "BIDAN",
    typeLabel: "Bidan Komunitas & KIA",
    rating: 4.9,
    experienceYears: 8,
    available: true,
    avatarUrl: "/avatars/spec-bidan.png",
    focus: [
      "Tumbuh Kembang Balita",
      "Pola Makan Bayi & Batita",
      "Kesehatan Ibu",
    ],
  },
  {
    id: "spec-gizi-1",
    name: "Nurul Aini, S.Gz, RD",
    title: "Nutrisionis Pediatrik Klinis",
    type: "AHLI_GIZI",
    typeLabel: "Konsultan Diet & Gizi Anak",
    rating: 4.95,
    experienceYears: 6,
    available: true,
    avatarUrl: "/avatars/spec-gizi.png",
    focus: [
      "Pencegahan Diabetes Anak",
      "Manajemen Gula Darah",
      "Porsi Gizi Seimbang",
    ],
  },
  {
    id: "spec-dokter-1",
    name: "dr. Bambang Irawan, Sp.A",
    title: "Spesialis Anak & Endokrinologi Pediatri",
    type: "DOKTER",
    typeLabel: "Dokter Spesialis Anak",
    rating: 4.88,
    experienceYears: 12,
    available: true,
    avatarUrl: "/avatars/spec-dokter.png",
    focus: [
      "Skrining & Terapi Diabetes Anak",
      "Obesitas Anak",
      "Metabolisme Glukosa",
    ],
  },
];

parentRoutes.get("/consultations/specialists", (c) => {
  const type = c.req.query("type");
  let list = SPECIALISTS;
  if (type) {
    list = list.filter((s) => s.type.toLowerCase() === type.toLowerCase());
  }
  return c.json({ specialists: list });
});

const createConsultationSchema = z.object({
  specialistType: z.enum(["BIDAN", "AHLI_GIZI", "DOKTER"]),
  specialistName: z.string().trim().min(3).max(100),
  topic: z.string().trim().min(3).max(200),
  notes: z.string().trim().max(1000).optional(),
});

parentRoutes.get("/consultations", async (c) => {
  const session = await getSession(c);
  if (!session?.user?.id) {
    return c.json({ error: { message: "Harus login terlebih dahulu." } }, 401);
  }

  try {
    const list = await drizzleDb
      .select()
      .from(consultations)
      .where(eq(consultations.guardianId, session.user.id))
      .orderBy(desc(consultations.createdAt));

    return c.json({ consultations: list });
  } catch (error) {
    console.error("Get consultations error:", error);
    return c.json(
      { error: { message: "Gagal memuat daftar konsultasi." } },
      500
    );
  }
});

parentRoutes.post("/consultations", async (c) => {
  const session = await getSession(c);
  if (!session?.user?.id) {
    return c.json({ error: { message: "Harus login terlebih dahulu." } }, 401);
  }

  const json = await c.req.json().catch(() => null);
  const parsed = createConsultationSchema.safeParse(json);

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
    const [consultation] = await drizzleDb
      .insert(consultations)
      .values({
        guardianId: session.user.id,
        specialistType: parsed.data.specialistType,
        specialistName: parsed.data.specialistName,
        topic: parsed.data.topic,
        notes: parsed.data.notes,
        status: "ACTIVE",
      })
      .returning();

    return c.json({ consultation }, 201);
  } catch (error) {
    console.error("Create consultation error:", error);
    return c.json(
      { error: { message: "Gagal membuat sesi konsultasi." } },
      500
    );
  }
});
