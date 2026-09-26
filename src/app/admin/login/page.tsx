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
    <div className="rounded-3xl border border-[#18372e]/20 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-[#18372e] px-2.5 py-0.5 text-xs font-black text-white">
          Akses Terbatas
        </span>
        <span className="text-xs font-bold text-[#48665c]">Panel Riset & CMS</span>
      </div>

      <h1 className="display-font mt-3 text-2xl font-black text-[#18372e]">
        Masuk Administrator
      </h1>
      <p className="mt-1 text-xs font-bold text-[#48665c]">
        Halaman ini terisolasi khusus peneliti & koordinator program. Orang tua / wali tidak dapat mengakses panel ini.
      </p>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-bold text-red-700" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-[#48665c]">
            Email Admin
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@sicehat.id"
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mt-1 w-full rounded-xl border border-[#18372e]/30 px-3 py-2.5 text-sm font-semibold outline-none transition focus:border-[#18372e] focus:ring-1 focus:ring-[#18372e]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-2xl bg-[#18372e] py-3 text-sm font-black text-white transition hover:bg-[#265747] disabled:opacity-50"
        >
          {loading ? "Memverifikasi Otorisasi..." : "Masuk ke Panel Admin"}
        </button>
      </form>

      <div className="mt-6 border-t border-[#18372e]/10 pt-4 flex flex-col gap-2 text-center text-xs font-bold">
        <Link
          href="/parent"
          className="text-[#48665c] hover:text-[#18372e] hover:underline"
        >
          ← Anda Orang Tua? Buka Dashboard Anak Anda
        </Link>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-[#f2f0e7] px-4 py-12 text-[#18372e] sm:px-6">
      <div className="mx-auto max-w-md">
        <header className="mb-8 text-center">
          <Link className="display-font text-3xl font-black text-[#18372e]" href="/">
            Si Cehat
          </Link>
          <p className="mt-1 text-sm font-bold text-[#48665c]">
            Sistem Evaluasi Edukasi Gizi Anak
          </p>
        </header>

        <Suspense fallback={<div className="text-center text-xs font-bold text-[#48665c]">Memuat formulir...</div>}>
          <AdminLoginForm />
        </Suspense>
      </div>
    </main>
  );
}
