import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import crypto from "crypto";

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "json" ? "json" : "csv";

  try {
    const records = await db.dailyProgress.findMany({
      orderBy: { date: "asc" },
      include: {
        child: {
          select: {
            id: true,
            foodLogs: true,
            chatSessions: {
              include: {
                messages: {
                  select: { id: true },
                },
              },
            },
          },
        },
      },
    });

    // Map unique child UUIDs to anonymized participant IDs (e.g., P-A7B2)
    const participantMap = new Map<string, string>();
    let participantIndex = 1;

    function getAnonymizedParticipantId(childId: string) {
      if (!participantMap.has(childId)) {
        const hash = crypto.createHash("sha256").update(childId).digest("hex").slice(0, 4).toUpperCase();
        participantMap.set(childId, `P-${String(participantIndex).padStart(3, "0")}-${hash}`);
        participantIndex++;
      }
      return participantMap.get(childId)!;
    }

    const exportRows = records.map((record) => {
      const participantId = getAnonymizedParticipantId(record.childId);
      const dateStr = record.date.toISOString().slice(0, 10);

      // Filter food logs for this specific date
      const foodsForDate = record.child.foodLogs.filter(
        (f) => f.date.toISOString().slice(0, 10) === dateStr
      );

      const balancedCount = foodsForDate.filter((f) => f.tone === "balanced").length;
      const sweetCount = foodsForDate.filter((f) => f.tone === "sweet").length;
      const friedCount = foodsForDate.filter((f) => f.tone === "fried").length;
      const unknownCount = foodsForDate.filter((f) => f.tone === "unknown").length;

      // Count total chat messages for this participant
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
      return new NextResponse(JSON.stringify(exportRows, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": 'attachment; filename="si_cehat_research_dataset.json"',
        },
      });
    }

    // CSV Format
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

    return new NextResponse(csvLines.join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="si_cehat_research_dataset.csv"',
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: { message: "Gagal mengekspor data riset." } }, { status: 500 });
  }
}
