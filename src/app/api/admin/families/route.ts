import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/adminAuth";

export async function GET(request: Request) {
  const authCheck = await verifyAdmin();
  if (!authCheck.authorized) return authCheck.response!;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";

  try {
    const where: {
      role: string;
      OR?: Array<{
        name?: { contains: string; mode: "insensitive" };
        email?: { contains: string; mode: "insensitive" };
        phone?: { contains: string; mode: "insensitive" };
      }>;
    } = {
      role: "GUARDIAN",
    };

    if (search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: "insensitive" } },
        { email: { contains: search.trim(), mode: "insensitive" } },
        { phone: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const families = await db.guardian.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        education: true,
        occupation: true,
        address: true,
        createdAt: true,
        children: {
          select: {
            id: true,
            name: true,
            gender: true,
            birthDate: true,
            healthHistory: true,
            screenings: {
              take: 1,
              orderBy: { createdAt: "desc" },
              select: {
                riskScore: true,
                riskCategory: true,
                createdAt: true,
              },
            },
            growthMeasurements: {
              take: 1,
              orderBy: { date: "desc" },
              select: {
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

    return NextResponse.json({ families });
  } catch (error) {
    console.error("Admin get families error:", error);
    return NextResponse.json({ error: { message: "Gagal memuat direktori keluarga." } }, { status: 500 });
  }
}
