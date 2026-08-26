import Link from "next/link";
import { AvatarRenderer } from "@/components/AvatarRenderer";

export default function OnboardingPage() {
  return (
    <main className="adventure-sky relative min-h-screen overflow-hidden px-4 py-5 sm:px-8 sm:py-7">
      <div className="absolute -left-12 top-32 h-40 w-40 rounded-full bg-white/30 blur-2xl" aria-hidden="true" />
      <div className="absolute -right-16 top-24 h-52 w-52 rounded-full bg-[#fff4b8]/50 blur-3xl" aria-hidden="true" />

      <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between" aria-label="Navigasi utama">
        <Link className="display-font flex items-center gap-2 text-xl font-black text-[#173d31] sm:text-2xl" href="/">
          <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-[#173d31] bg-[#f4b942] text-base" aria-hidden="true">SC</span>
          Si Cehat
        </Link>
        <Link className="rounded-full border-2 border-[#173d31] bg-white/75 px-4 py-2 text-sm font-black text-[#173d31] transition hover:bg-white" href="/parent">
          Area Orang Tua
        </Link>
      </nav>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-6rem)] max-w-6xl items-center gap-6 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-4">
        <div className="max-w-2xl">
          <p className="mb-4 inline-flex -rotate-2 rounded-full border-2 border-[#173d31] bg-[#fff9e9] px-4 py-2 text-sm font-black uppercase tracking-[0.16em] text-[#247a4d]">
            Petualangan hari ini dibuka
          </p>
          <h1 className="display-font text-5xl font-black leading-[0.95] text-[#173d31] sm:text-7xl lg:text-8xl">
            Sehat itu bisa jadi <span className="text-[#e95345]">petualangan.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg font-bold leading-8 text-[#285648] sm:text-xl">
            Pilih temanmu, jelajahi peta, selesaikan misi kecil, dan kumpulkan XP bersama Si Cehat.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link className="game-button inline-flex min-h-16 items-center justify-center rounded-full bg-[#f4b942] px-8 text-lg font-black text-[#173d31]" href="/avatar">
              Mulai Petualangan
            </Link>
            <Link className="inline-flex min-h-16 items-center justify-center rounded-full border-3 border-[#173d31] bg-white/70 px-7 text-base font-black text-[#173d31] transition hover:bg-white" href="/child">
              Lanjutkan Misi
            </Link>
          </div>
          <p className="mt-5 max-w-lg text-sm font-bold leading-6 text-[#285648]/80">
            Tempat belajar kebiasaan sehat, bukan alat diagnosis atau pengganti dokter.
          </p>
        </div>

        <div className="relative mx-auto flex min-h-[420px] w-full max-w-lg items-end justify-center lg:min-h-[560px]">
          <div className="absolute left-0 top-14 -rotate-6 rounded-2xl border-3 border-[#173d31] bg-white px-4 py-3 font-black text-[#173d31] shadow-[4px_5px_0_#173d31] sm:left-4">
            4 misi baru!
          </div>
          <div className="absolute right-1 top-5 rotate-6 rounded-2xl border-3 border-[#173d31] bg-[#ef6a55] px-4 py-3 font-black text-[#173d31] shadow-[4px_5px_0_#173d31] sm:right-8">
            + XP
          </div>
          <div className="absolute bottom-4 h-48 w-[115%] rounded-[50%_50%_12%_12%] border-3 border-[#173d31] bg-[#6eb461] shadow-[inset_0_12px_0_rgba(255,255,255,0.18)]" aria-hidden="true" />
          <div className="absolute bottom-32 z-10 rounded-[50%] bg-white/45 px-4 pt-2">
            <AvatarRenderer accessory="hat" character="apple" orbColor="#247a4d" state="happy" className="h-72 w-72 sm:h-80 sm:w-80" />
          </div>
          <div className="absolute bottom-9 left-8 z-20 grid h-20 w-20 place-items-center rounded-full border-3 border-[#173d31] bg-[#75c8e8] text-center text-xs font-black text-[#173d31] shadow-[4px_5px_0_#173d31]">
            Misi<br />Air
          </div>
          <div className="absolute bottom-12 right-5 z-20 grid h-20 w-20 place-items-center rounded-full border-3 border-[#173d31] bg-[#f4b942] text-center text-xs font-black text-[#173d31] shadow-[4px_5px_0_#173d31]">
            Kuis<br />Cepat
          </div>
        </div>
      </section>
    </main>
  );
}
