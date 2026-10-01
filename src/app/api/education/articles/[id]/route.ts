import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const article = await db.educationArticle.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });

    if (!article) {
      return NextResponse.json(
        { error: { message: "Materi edukasi tidak ditemukan." } },
        { status: 404 }
      );
    }

    return NextResponse.json({ article });
  } catch (error) {
    console.error("Get article detail error:", error);
    return NextResponse.json(
      { error: { message: "Gagal memuat detail artikel edukasi." } },
      { status: 500 }
    );
  }
}
