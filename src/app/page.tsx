import Link from "next/link";

const FEATURES = [
  {
    title: "Pantau Tumbuh Kembang",
    desc: "Kurva pertumbuhan, berat & tinggi badan, serta status gizi anak terpantau berkala.",
    tint: "bg-emerald-50 text-emerald-600",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M3 3v18h18" />
        <path d="M7 14l3-3 3 2 5-6" />
      </svg>
    ),
  },
  {
    title: "Gizi Seimbang & Diary Makan",
    desc: "Kalkulator nutrisi, catatan makan harian, dan inspirasi menu tradisional sehat.",
    tint: "bg-teal-50 text-teal-600",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M12 21c-4.5 0-8-3.2-8-7.2C4 8.3 8.5 3.8 12 2c3.5 1.8 8 6.3 8 11.8 0 4-3.5 7.2-8 7.2Z" />
        <path d="M12 21V11" />
      </svg>
    ),
  },
  {
    title: "Edukasi Kesehatan",
    desc: "Artikel, video, dan panduan praktis pencegahan diabetes untuk seluruh keluarga.",
    tint: "bg-sky-50 text-sky-600",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      </svg>
    ),
  },
  {
    title: "Konsultasi & Pengingat",
    desc: "Akses tenaga medis mitra dan pengingat rutinitas sehat harian anak.",
    tint: "bg-amber-50 text-amber-600",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M4 3v5a4 4 0 0 0 8 0V3" />
        <path d="M8 12v3a5 5 0 0 0 10 0v-3" />
        <circle cx="18" cy="10" r="2" />
      </svg>
    ),
  },
];

const STEPS = [
  {
    title: "Buat profil keluarga",
    desc: "Daftarkan akun orang tua lalu lengkapi data anak untuk personalisasi panduan.",
  },
  {
    title: "Catat & pantau harian",
    desc: "Isi diary makan, aktivitas, dan pengukuran tumbuh kembang secara rutin.",
  },
  {
    title: "Dapatkan panduan",
    desc: "Terima rekomendasi gizi seimbang dan edukasi pencegahan diabetes sejak dini.",
  },
];

export default function LandingPage() {
  return (
    <div
      className="min-h-screen bg-[#f7faf8] text-slate-900 antialiased"
      style={{ fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif" }}
    >
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <a href="#beranda" className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm shadow-emerald-600/30">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M12 21c-4.5 0-8-3.2-8-7.2C4 8.3 8.5 3.8 12 2c3.5 1.8 8 6.3 8 11.8 0 4-3.5 7.2-8 7.2Z" />
                <path d="M12 21V11" />
              </svg>
            </span>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">Si Cehat</span>
          </a>

          <div className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
            <a href="#fitur" className="transition hover:text-emerald-700">Fitur</a>
            <a href="#cara-kerja" className="transition hover:text-emerald-700">Cara Kerja</a>
          </div>

          <Link
            href="/admin/login"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-emerald-600/25 transition hover:bg-emerald-700"
          >
            Masuk Admin
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </nav>
      </header>

      {/* ===== Hero ===== */}
      <section id="beranda" className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[-12rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="absolute right-[-10rem] top-40 h-80 w-80 rounded-full bg-teal-200/40 blur-3xl" />
          <div className="absolute bottom-0 left-[-8rem] h-72 w-72 rounded-full bg-lime-200/30 blur-3xl" />
        </div>

        <div className="mx-auto flex max-w-3xl flex-col items-center px-5 py-16 text-center sm:px-8 lg:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Pendamping Kesehatan Keluarga
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-[1.06] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Jaga Anak,{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              Cegah Diabetes
            </span>{" "}
            Sejak Dini.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Si Cehat membantu orang tua memantau tumbuh kembang, gizi, dan kebiasaan sehat anak — dengan panduan edukasi yang mudah dipahami.
          </p>

          <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/admin/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700"
            >
              Masuk Admin
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-semibold text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-emerald-500">
                <path d="m5 12 4 4L19 6" />
              </svg>
              Edukasi berbasis bukti
            </span>
            <span className="inline-flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-emerald-500">
                <path d="m5 12 4 4L19 6" />
              </svg>
              Bukan alat diagnosis medis
            </span>
          </div>
        </div>
      </section>

      {/* ===== Fitur ===== */}
      <section id="fitur" className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">Fitur</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Semua yang dibutuhkan untuk mendampingi anak
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Satu tempat untuk memantau dan membangun kebiasaan sehat keluarga, dari tumbuh kembang hingga edukasi gizi.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-emerald-100 hover:shadow-lg hover:shadow-emerald-900/5"
            >
              <div className={`grid h-12 w-12 place-items-center rounded-xl ${feature.tint}`}>
                {feature.icon}
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Cara Kerja ===== */}
      <section id="cara-kerja" className="bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">Cara Kerja</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Mulai dalam tiga langkah
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Proses sederhana untuk memulai pendampingan kesehatan anak.
            </p>
          </div>

          <div className="relative mt-12 grid gap-6 md:grid-cols-3">
            <div className="pointer-events-none absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent md:block" aria-hidden="true" />
            {STEPS.map((step, index) => (
              <div key={step.title} className="relative rounded-2xl border border-slate-100 bg-[#f7faf8] p-6">
                <span className="relative z-10 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-base font-extrabold text-white shadow-md shadow-emerald-600/25">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-base font-bold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Disclaimer ===== */}
      <section className="mx-auto max-w-5xl px-5 py-16 sm:px-8">
        <div className="flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:flex-row sm:items-start">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-100 text-xl" aria-hidden="true">
            ⚠️
          </span>
          <div>
            <p className="text-base font-bold text-amber-900">Penting untuk diketahui</p>
            <p className="mt-1 text-sm leading-7 text-amber-800">
              Si Cehat adalah pendamping edukasi dan kebiasaan sehat keluarga. Si Cehat bukan alat diagnosis medis dan tidak menggantikan pemeriksaan, saran, maupun penanganan dari tenaga kesehatan profesional.
            </p>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-600 px-6 py-12 text-center shadow-xl shadow-emerald-900/15 sm:px-12">
          <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-16 -right-8 h-52 w-52 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />

          <h2 className="relative text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Siap mendampingi keluarga jadi lebih sehat?
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-base leading-7 text-emerald-50">
            Kelola konten edukasi, resep, dan materi kesehatan keluarga melalui panel admin Si Cehat.
          </p>
          <Link
            href="/admin/login"
            className="relative mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-bold text-emerald-700 shadow-lg shadow-emerald-950/10 transition hover:bg-emerald-50"
          >
            Masuk Admin
          </Link>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row sm:px-8">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M12 21c-4.5 0-8-3.2-8-7.2C4 8.3 8.5 3.8 12 2c3.5 1.8 8 6.3 8 11.8 0 4-3.5 7.2-8 7.2Z" />
                <path d="M12 21V11" />
              </svg>
            </span>
            <span className="text-lg font-extrabold tracking-tight text-slate-900">Si Cehat</span>
          </div>

          <div className="flex items-center gap-6 text-sm font-semibold text-slate-500">
            <Link className="transition hover:text-emerald-700" href="/admin/login">Masuk Admin</Link>
          </div>

          <p className="text-xs font-medium text-slate-400">
            © {new Date().getFullYear()} Si Cehat. Semua hak dilindungi.
          </p>
        </div>
      </footer>
    </div>
  );
}
