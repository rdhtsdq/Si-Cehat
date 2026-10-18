import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/adminAuth";

const updateConsultationSchema = z.object({
  status: z.enum(["PENDING", "ACTIVE", "COMPLETED"]).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await verifyAdmin();
  if (!authCheck.authorized) return authCheck.response!;

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = updateConsultationSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message || "Data konsultasi tidak valid." } },
      { status: 400 }
    );
  }

  try {
    const consultation = await db.consultation.update({
      where: { id },
      data: parsed.data,
      include: {
        guardian: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({ consultation });
  } catch (error) {
    console.error("Admin update consultation error:", error);
    return NextResponse.json({ error: { message: "Gagal memperbarui status konsultasi." } }, { status: 500 });
  }
}
