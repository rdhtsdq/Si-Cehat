import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: "Harus login." } }, { status: 401 });
  }

  const user = await db.guardian.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    return NextResponse.json(
      { error: { message: "Akses ditolak. Halaman ini khusus untuk Administrator." } },
      { status: 403 }
    );
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
    ] = await Promise.all([
      db.guardian.count(),
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
        _count: {
          tone: true,
        },
      }),
      db.chatSession.count(),
      db.chatMessage.count(),
      db.dailyProgress.findMany({
        take: 10,
        orderBy: { date: "desc" },
        include: {
          child: {
            select: { name: true },
          },
        },
      }),
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
      },
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
