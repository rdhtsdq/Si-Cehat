import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/adminAuth";

export async function GET() {
  const authCheck = await verifyAdmin();
  if (!authCheck.authorized) {
    return authCheck.response!;
  }

  try {
    const [
      totalGuardians,
      totalChildren,
      progressAggregates,
      foodToneCounts,
      totalChatSessions,
      totalChatMessages,
      recentProgress,
      // Figma Extensions Metrics
      totalScreenings,
      highRiskCount,
      mediumRiskCount,
      lowRiskCount,
      recentHighRiskScreenings,
      totalGrowthMeasurements,
      growthNutritionalStats,
      foodLogAggregates,
      consultationStats,
      totalRecipes,
      totalArticles,
    ] = await Promise.all([
      db.guardian.count({ where: { role: "GUARDIAN" } }),
      db.child.count(),
      db.dailyProgress.aggregate({
        _sum: {
          waterGlasses: true,
          activityMinutes: true,
          xpEarned: true,
        },
        _avg: {
          waterGlasses: true,
          activityMinutes: true,
          streak: true,
        },
      }),
      db.foodLog.groupBy({
        by: ["tone"],
        _count: { tone: true },
      }),
      db.chatSession.count(),
      db.chatMessage.count(),
      db.dailyProgress.findMany({
        take: 8,
        orderBy: { date: "desc" },
        include: {
          child: {
            select: { name: true },
          },
        },
      }),
      // Screening aggregations
      db.screeningRecord.count(),
      db.screeningRecord.count({ where: { riskCategory: "TINGGI" } }),
      db.screeningRecord.count({ where: { riskCategory: "SEDANG" } }),
      db.screeningRecord.count({ where: { riskCategory: "RENDAH" } }),
      db.screeningRecord.findMany({
        where: { riskCategory: "TINGGI" },
        take: 6,
        orderBy: { createdAt: "desc" },
        include: {
          child: {
            select: {
              name: true,
              gender: true,
            },
          },
          guardian: {
            select: {
              name: true,
              phone: true,
              email: true,
            },
          },
        },
      }),
      // Growth measurements
      db.growthMeasurement.count(),
      db.growthMeasurement.groupBy({
        by: ["nutritionalStatus"],
        _count: { nutritionalStatus: true },
      }),
      // Detailed Food Logs
      db.detailedFoodLog.aggregate({
        _count: { _all: true },
        _avg: { caloriesKkal: true, carbsGram: true },
      }),
      // Consultations
      db.consultation.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      // Content items
      db.recipe.count(),
      db.educationArticle.count(),
    ]);

    const foodToneDistribution = {
      balanced: 0,
      sweet: 0,
      fried: 0,
      unknown: 0,
    };

    foodToneCounts.forEach((item) => {
      if (item.tone in foodToneDistribution) {
        foodToneDistribution[item.tone as keyof typeof foodToneDistribution] = item._count.tone;
      }
    });

    // Format growth status distribution
    const growthDistribution: Record<string, number> = {
      "Gizi Baik (Normal)": 0,
      "Berisiko Gizi Lebih": 0,
      "Obesitas": 0,
      "Gizi Kurang": 0,
    };
    growthNutritionalStats.forEach((g) => {
      if (g.nutritionalStatus) {
        growthDistribution[g.nutritionalStatus] = g._count.nutritionalStatus;
      }
    });

    // Format consultation distribution
    const consultations = {
      pending: 0,
      active: 0,
      completed: 0,
      total: 0,
    };
    consultationStats.forEach((c) => {
      if (c.status === "PENDING") consultations.pending = c._count.status;
      if (c.status === "ACTIVE") consultations.active = c._count.status;
      if (c.status === "COMPLETED") consultations.completed = c._count.status;
      consultations.total += c._count.status;
    });

    return NextResponse.json({
      metrics: {
        totalGuardians,
        totalChildren,
        totalWaterGlasses: progressAggregates._sum.waterGlasses || 0,
        totalActivityMinutes: progressAggregates._sum.activityMinutes || 0,
        totalXpEarned: progressAggregates._sum.xpEarned || 0,
        averageWaterGlasses: Number((progressAggregates._avg.waterGlasses || 0).toFixed(1)),
        averageActivityMinutes: Number((progressAggregates._avg.activityMinutes || 0).toFixed(1)),
        averageStreak: Number((progressAggregates._avg.streak || 0).toFixed(1)),
        totalChatSessions,
        totalChatMessages,
        foodToneDistribution,
        // Clinical & Figma extensions
        screening: {
          total: totalScreenings,
          highRiskCount,
          mediumRiskCount,
          lowRiskCount,
          highRiskPercentage: totalScreenings > 0 ? Math.round((highRiskCount / totalScreenings) * 100) : 0,
        },
        growth: {
          total: totalGrowthMeasurements,
          distribution: growthDistribution,
        },
        nutrition: {
          totalLogs: foodLogAggregates._count._all || 0,
          averageCalories: Math.round(foodLogAggregates._avg.caloriesKkal || 0),
          averageCarbsGram: Number((foodLogAggregates._avg.carbsGram || 0).toFixed(1)),
        },
        consultations,
        content: {
          totalRecipes,
          totalArticles,
        },
      },
      highRiskAlerts: recentHighRiskScreenings.map((s) => {
        const heightM = s.heightCm / 100;
        const bmiCalc = heightM > 0 ? Number((s.weightKg / (heightM * heightM)).toFixed(1)) : 0;
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
      system: {
        aiModel: process.env.AI_MODEL || "gpt-4o-mini",
        databaseStatus: "connected",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Admin metrics error:", error);
    return NextResponse.json({ error: { message: "Gagal memuat data metrik analitik." } }, { status: 500 });
  }
}
