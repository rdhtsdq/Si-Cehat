import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function verifyAdmin() {
  const session = await auth();
  if (!session?.user?.id && !session?.user?.email) {
    return {
      authorized: false,
      response: NextResponse.json({ error: { message: "Harus login terlebih dahulu." } }, { status: 401 }),
      user: null,
    };
  }

  const userId = session?.user?.id;
  const userEmail = session?.user?.email;

  const user = await db.guardian.findFirst({
    where: {
      OR: [
        userId ? { id: userId } : undefined,
        userEmail ? { email: userEmail } : undefined,
      ].filter(Boolean) as Array<{ id?: string; email?: string }>,
    },
    select: { id: true, email: true, role: true, name: true },
  });

  if (!user || user.role !== "ADMIN") {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: { message: "Akses ditolak. Endpoint ini memerlukan hak akses Administrator." } },
        { status: 403 }
      ),
      user: null,
    };
  }

  return { authorized: true, response: null, user };
}
