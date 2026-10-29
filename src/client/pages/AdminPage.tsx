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
      <main
        className="min-h-screen flex items-center justify-center bg-[#f7faf8] text-slate-900"
        style={{ fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif" }}
      >
        <div className="flex flex-col items-center gap-3 text-center text-sm font-semibold text-slate-500">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" aria-hidden="true" />
          Memverifikasi sesi Administrator &amp; Posyandu...
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
