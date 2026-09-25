"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";

export default function GuardianLoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [childName, setChildName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        // Register API call
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, childName }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error?.message || "Pendaftaran gagal. Silakan coba lagi.");
        }

        // Auto sign-in after registration
        const loginRes = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });

        if (loginRes?.error) {
          throw new Error("Akun terdaftar, namun gagal masuk otomatis. Silakan klik Masuk.");
        }

        await syncAfterLogin();
        router.push("/parent");
        router.refresh();
      } else {
        // Sign-in
        const res = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });

        if (res?.error) {
          throw new Error("Email atau kata sandi tidak cocok. Silakan periksa kembali.");
        }

        await syncAfterLogin();
        router.push("/parent");
        router.refresh();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan sistem. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function syncAfterLogin() {
    try {
      const childrenRes = await fetch("/api/children");
      if (childrenRes.ok) {
        const data = await childrenRes.json();
        if (data.children && data.children.length > 0) {
          const primaryChild = data.children[0];
          localStorage.setItem("si-cehat-active-child-id", primaryChild.id);
          if (primaryChild.avatarPreference) {
            try {
              localStorage.setItem("si-cehat-avatar", primaryChild.avatarPreference);
            } catch {}
          }
          const progRes = await fetch(`/api/progress?childId=${encodeURIComponent(primaryChild.id)}`);
          if (progRes.ok) {
            const progData = await progRes.json();
            if (progData && progData.childId) {
              const syncedProgress = {
                date: progData.date || new Date().toISOString().slice(0, 10),
                childName: progData.childName || primaryChild.name,
                waterGlasses: progData.waterGlasses ?? 0,
                activityMinutes: progData.activityMinutes ?? 0,
                xp: progData.xp ?? 0,
                streak: progData.streak ?? 0,
                foodLogs: progData.foodLogs ?? [],
                challengeCompleted: false,
                quizCompleted: false,
              };
              localStorage.setItem("si-cehat-progress", JSON.stringify(syncedProgress));
            }
          }
        }
      }
    } catch {}

    try {
      if ("BroadcastChannel" in window) {
        const channel = new BroadcastChannel("si-cehat-sync");
        channel.postMessage({ type: "PARENT_LOGGED_IN" });
        channel.close();
      }
    } catch {}
  }

  return (
    <main className="min-h-screen bg-[#f2f0e7] px-4 py-8 text-[#18372e] sm:px-6">
      <div className="mx-auto max-w-md">
        <header className="mb-8 text-center">
          <Link className="display-font text-3xl font-black text-[#18372e]" href="/">
            Si Cehat
          </Link>
          <p className="mt-2 text-sm font-bold text-[#48665c]">
            Portal Orang Tua & Wali Pendamping
          </p>
        </header>

        <div className="rounded-3xl border border-[#18372e]/20 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex rounded-2xl bg-[#f2f0e7] p-1">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setError(""); }}
              className={`flex-1 rounded-xl py-2.5 text-sm font-black transition ${
                !isRegister ? "bg-[#18372e] text-white shadow-sm" : "text-[#48665c] hover:text-[#18372e]"
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setError(""); }}
              className={`flex-1 rounded-xl py-2.5 text-sm font-black transition ${
                isRegister ? "bg-[#18372e] text-white shadow-sm" : "text-[#48665c] hover:text-[#18372e]"
              }`}
            >
              Daftar Baru
            </button>
          </div>

          <h1 className="display-font text-2xl font-black text-[#18372e]">
            {isRegister ? "Buat Akun Pendamping" : "Selamat Datang Kembali"}
          </h1>
          <p className="mt-1 text-xs font-bold text-[#48665c]">
            {isRegister
              ? "Pantau catatan gizi, kebiasaan minum air, dan aktivitas anak secara terintegrasi."
              : "Masuk untuk melihat laporan aktivitas dan ringkasan kebiasaan keluarga."}
          </p>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700 border border-red-200" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#48665c]">
                Email Orang Tua / Wali
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@keluarga.com"
                className="mt-1 w-full rounded-xl border border-[#18372e]/30 px-3 py-2.5 text-sm font-semibold outline-none transition focus:border-[#18372e] focus:ring-1 focus:ring-[#18372e]"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#48665c]">
                Kata Sandi
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="mt-1 w-full rounded-xl border border-[#18372e]/30 px-3 py-2.5 text-sm font-semibold outline-none transition focus:border-[#18372e] focus:ring-1 focus:ring-[#18372e]"
              />
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#48665c]">
                  Nama Panggilan Anak
                </label>
                <input
                  type="text"
                  required
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="Contoh: Budi, Sari, dll."
                  className="mt-1 w-full rounded-xl border border-[#18372e]/30 px-3 py-2.5 text-sm font-semibold outline-none transition focus:border-[#18372e] focus:ring-1 focus:ring-[#18372e]"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-2xl bg-[#18372e] py-3 text-sm font-black text-white transition hover:bg-[#265747] disabled:opacity-50"
            >
              {loading
                ? "Memproses..."
                : isRegister
                  ? "Daftar & Masuk"
                  : "Masuk ke Dashboard"}
            </button>
          </form>

          <div className="mt-6 border-t border-[#18372e]/10 pt-4 text-center">
            <Link
              href="/child"
              className="text-xs font-bold text-[#48665c] hover:text-[#18372e] hover:underline"
            >
              Mode Tamu / Kembali ke Mode Anak →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
