import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import AdminDashboardClient from "@/app/admin/AdminDashboardClient";

interface MeResponse {
  user: {
    id: string;
    email: string;
    role: string;
    name?: string | null;
    posyanduId?: string | null;
    posyanduName?: string | null;
  } | null;
}

export default function AdminPage() {
  const [, navigate] = useLocation();
  const [currentUser, setCurrentUser] = useState<MeResponse["user"] | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    async function checkAdminSession() {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "same-origin",
        });
        const data: MeResponse = await res.json().catch(() => ({ user: null }));
        if (!active) return;

        if (!data?.user) {
          navigate("/admin/login", { replace: true });
          return;
        }

        if (data.user.role !== "ADMIN" && data.user.role !== "POSYANDU") {
          navigate("/admin/login?error=forbidden", { replace: true });
          return;
        }

        setCurrentUser(data.user);
      } catch {
        if (active) {
          navigate("/admin/login", { replace: true });
        }
      } finally {
        if (active) {
          setChecking(false);
        }
      }
    }

    checkAdminSession();
    return () => {
      active = false;
    };
  }, [navigate]);

  if (checking || !currentUser) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f2f0e7] text-[#18372e]">
        <div className="text-center text-sm font-black">
          Memverifikasi sesi Administrator & Posyandu...
        </div>
      </main>
    );
  }

  return (
    <AdminDashboardClient
      userEmail={currentUser.email}
      userRole={currentUser.role}
      posyanduId={currentUser.posyanduId}
      posyanduName={currentUser.posyanduName}
    />
  );
}
