"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { signIn, signOut } from "next-auth/react";

function AdminLoginForm() {
  const searchParams = useSearchParams();
  const isForbidden = searchParams.get("error") === "forbidden";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    isForbidden
      ? "Akses Ditolak: Anda saat ini terhubung dengan akun Orang Tua/Wali. Silakan login menggunakan akun Administrator di bawah ini."
      : ""
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Clear any prior session cookie to ensure fresh credentials take effect
      try {
        await signOut({ redirect: false });
      } catch {}

      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        throw new Error("Email atau kata sandi administrator tidak valid.");
      }

      // Perform a full navigation so the session cookie is immediately sent to the server
      window.location.href = "/admin";
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan saat otentikasi admin.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-7 shadow-xl shadow-emerald-900/5 sm:p-9">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
          Akses Terbatas
        </span>
        <span className="text-xs font-semibold text-slate-500">Panel Riset & CMS</span>
      </div>

      <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">
        Masuk Administrator
      </h1>
      <p className="mt-1.5 text-sm leading-6 text-slate-500">
        Halaman ini terisolasi khusus peneliti & koordinator program. Orang tua / wali tidak dapat mengakses panel ini.
      </p>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold leading-5 text-red-700" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            Email Admin
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@sicehat.id"
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            Kata Sandi
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? "Memverifikasi Otorisasi..." : "Masuk ke Panel Admin"}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#f7faf8] px-4 py-12 text-slate-900 sm:px-6"
      style={{ fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif" }}
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="absolute right-[-8rem] bottom-[-6rem] h-72 w-72 rounded-full bg-teal-200/40 blur-3xl" />
      </div>

      <div className="mx-auto max-w-md">
        <header className="mb-8 text-center">
          <Link className="inline-flex items-center gap-2.5" href="/">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm shadow-emerald-600/30">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M12 21c-4.5 0-8-3.2-8-7.2C4 8.3 8.5 3.8 12 2c3.5 1.8 8 6.3 8 11.8 0 4-3.5 7.2-8 7.2Z" />
                <path d="M12 21V11" />
              </svg>
            </span>
            <span className="text-2xl font-extrabold tracking-tight text-slate-900">Si Cehat</span>
          </Link>
          <p className="mt-3 text-sm font-semibold text-slate-500">
            Sistem Evaluasi Edukasi Gizi Anak
          </p>
        </header>

        <Suspense fallback={<div className="text-center text-xs font-semibold text-slate-500">Memuat formulir...</div>}>
          <AdminLoginForm />
        </Suspense>

        <p className="mt-6 text-center text-xs font-medium text-slate-400">
          <Link href="/" className="font-semibold text-emerald-700 transition hover:underline">
            ← Kembali ke beranda
          </Link>
        </p>
      </div>
    </main>
  );
}
