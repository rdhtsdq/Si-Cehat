import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import AdminDashboardClient from "./AdminDashboardClient";

export default async function AdminPage() {
  const session = await auth();

  const userId = session?.user?.id;
  const userEmail = session?.user?.email;

  if (!userId && !userEmail) {
    redirect("/admin/login");
  }

  const user = await db.guardian.findFirst({
    where: {
      OR: [
        userId ? { id: userId } : undefined,
        userEmail ? { email: userEmail } : undefined,
      ].filter(Boolean) as Array<{ id?: string; email?: string }>,
    },
    select: { role: true, email: true },
  });

  if (!user || user.role !== "ADMIN") {
    redirect("/admin/login?error=forbidden");
  }

  return <AdminDashboardClient userEmail={user.email} />;
}
