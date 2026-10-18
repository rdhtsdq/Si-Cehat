import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/adminAuth";

export async function GET(request: Request) {
  const authCheck = await verifyAdmin();
  if (!authCheck.authorized) return authCheck.response!;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  try {
    const where: { status?: string } = {};
    if (status && status !== "ALL") {
      where.status = status.toUpperCase();
    }

    const consultations = await db.consultation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        guardian: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            education: true,
            occupation: true,
            address: true,
            children: {
              select: {
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

    return NextResponse.json({ consultations });
  } catch (error) {
    console.error("Admin get consultations error:", error);
    return NextResponse.json({ error: { message: "Gagal memuat daftar konsultasi." } }, { status: 500 });
  }
}
