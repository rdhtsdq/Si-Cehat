"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createDefaultProgress, loadProgress, recommendedMenus, summarizeProgress, type DailyProgress } from "@/lib/progress";

const toneCopy = {
  balanced: "Lengkap warna",
  sweet: "Manis",
  fried: "Digoreng",
  unknown: "Belum dikategorikan",
};

interface ChildProfile {
  id: string;
  name: string;
}

export default function ParentDashboardPage() {
  const [progress, setProgress] = useState<DailyProgress>(createDefaultProgress());
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);
  const [menus, setMenus] = useState(recommendedMenus);
  const summary = summarizeProgress(progress);

  useEffect(() => {
    // 1. Initial load from local storage
    const local = loadProgress();
    setProgress(local);

    // 2. Fetch children if logged in
    fetch("/api/children")
      .then((res) => {
        if (!res.ok) throw new Error("Not logged in");
        return res.json();
      })
      .then((data) => {
        if (data.children && data.children.length > 0) {
          setChildren(data.children);
          setSelectedChildId(data.children[0].id);
        }
      })
      .catch(() => {
        // Guest mode / not logged in
      });

    // 3. Fetch dynamic CMS menus
    fetch("/api/content")
      .then((res) => res.json())
      .then((data) => {
        if (data.recommendedMenus && data.recommendedMenus.length > 0) {
          setMenus(data.recommendedMenus);
        }
      })
      .catch(() => {});

    // 4. Instant Real-Time Cross-Tab & Local Synchronization Listeners
    function handleInstantSync(updated?: DailyProgress) {
      if (updated) {
        setProgress(updated);
      } else {
        setProgress(loadProgress());
      }
    }

    const onCustomEvent = (e: Event) => {
      const detail = (e as CustomEvent<DailyProgress>).detail;
      handleInstantSync(detail);
    };
    window.addEventListener("si-cehat-progress-updated", onCustomEvent);

    const onStorage = (e: StorageEvent) => {
      if (e.key === "si-cehat-progress" && e.newValue) {
        try {
          handleInstantSync(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener("storage", onStorage);

    let channel: BroadcastChannel | null = null;
    try {
      if ("BroadcastChannel" in window) {
        channel = new BroadcastChannel("si-cehat-sync");
        channel.onmessage = (event) => {
          if (event.data?.type === "PROGRESS_UPDATED" && event.data.progress) {
            handleInstantSync(event.data.progress);
          }
        };
      }
    } catch {}

    const onFocus = () => {
      handleInstantSync();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("si-cehat-progress-updated", onCustomEvent);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
      if (channel) channel.close();
    };
  }, []);

  // Fetch progress whenever selectedChildId changes
  useEffect(() => {
    const url = selectedChildId ? `/api/progress?childId=${selectedChildId}` : "/api/progress";
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.waterGlasses !== undefined) {
          const nextProgress: DailyProgress = {
            date: data.date || new Date().toISOString().slice(0, 10),
            childName: data.childName || "Teman Cehat",
            waterGlasses: data.waterGlasses,
            activityMinutes: data.activityMinutes,
            xp: data.xp,
            streak: data.streak,
            foodLogs: data.foodLogs || [],
            challengeCompleted: false,
            quizCompleted: false,
          };
          setProgress(nextProgress);
          setIsCloudSynced(true);

          if (data.childId) {
            window.localStorage.setItem("si-cehat-active-child-id", data.childId);
          }
          window.localStorage.setItem("si-cehat-progress", JSON.stringify(nextProgress));
          if (data.avatarPreference) {
            window.localStorage.setItem("si-cehat-avatar", JSON.stringify(data.avatarPreference));
          }
          try {
            window.dispatchEvent(new CustomEvent("si-cehat-progress-updated", { detail: nextProgress }));
            if ("BroadcastChannel" in window) {
              const channel = new BroadcastChannel("si-cehat-sync");
              channel.postMessage({ type: "CHILD_SELECTED", childId: data.childId, progress: nextProgress });
              channel.close();
            }
          } catch {}
        }
      })
      .catch(() => {
        setIsCloudSynced(false);
      });
  }, [selectedChildId]);

  return (
    <main className="min-h-screen bg-[#f2f0e7] px-4 py-5 text-[#18372e] sm:px-7 sm:py-7">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-[#18372e]/20 pb-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Link className="display-font text-xl font-black" href="/">Si Cehat</Link>
              <span className="h-6 w-px bg-[#18372e]/20" />
              <span className="text-sm font-bold text-[#48665c]">Ringkasan Keluarga</span>
              {isCloudSynced ? (
                <span className="rounded-full bg-[#dce9df] px-2.5 py-0.5 text-xs font-black text-[#247a4d]">
                  Tersinkron Database
                </span>
              ) : (
                <span className="rounded-full bg-[#fcedc7] px-2.5 py-0.5 text-xs font-black text-[#9d6e18]">
                  Penyimpanan Lokal
                </span>
              )}
            </div>
            <nav className="flex items-center gap-2" aria-label="Navigasi orang tua">
              {children.length > 0 && (
                <select
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  className="rounded-full border border-[#18372e]/30 bg-white px-3 py-1.5 text-xs font-bold text-[#18372e] outline-none"
                >
                  {children.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
              <Link className="rounded-full border border-[#18372e]/30 bg-white px-4 py-2 text-sm font-bold transition hover:border-[#18372e]" href="/parent/login">
                {children.length > 0 ? "Akun Wali" : "Masuk / Daftar"}
              </Link>
              <Link className="rounded-full border border-[#18372e]/30 bg-white px-4 py-2 text-sm font-bold transition hover:border-[#18372e]" href="/child">Lihat Mode Anak</Link>
              <Link className="rounded-full bg-[#18372e] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#265747]" href="/chat">Buka Chat</Link>
            </nav>
          </div>
        </header>

        <section className="grid gap-7 border-b border-[#18372e]/20 py-8 lg:grid-cols-[1fr_0.75fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#48665c]">Kebiasaan hari ini</p>
            <h1 className="display-font mt-2 max-w-3xl text-4xl font-black leading-[1.02] sm:text-6xl">
              Gambaran sederhana untuk {progress.childName}.
            </h1>
            <p className="mt-4 max-w-2xl text-base font-bold leading-7 text-[#48665c]">
              Gunakan catatan ini untuk membuka percakapan yang positif. Hindari menyalahkan anak atas makanan atau aktivitasnya.
            </p>
          </div>
          <div className="rounded-3xl bg-[#18372e] p-5 text-white">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-white/65">Skor keterlibatan</p>
                <p className="display-font mt-1 text-6xl font-black">{summary.dailyScore}</p>
              </div>
              <p className="mb-2 text-sm font-bold text-white/70">dari 100</p>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20" role="progressbar" aria-label="Skor keterlibatan hari ini" aria-valuemax={100} aria-valuemin={0} aria-valuenow={summary.dailyScore}>
              <div className="h-full bg-[#f4b942]" style={{ width: `${summary.dailyScore}%` }} />
            </div>
            <p className="mt-3 text-xs font-bold leading-5 text-white/60">Menggambarkan kebiasaan sehat hari ini, bukan kondisi medis anak.</p>
          </div>
        </section>

        <section className="grid border-b border-[#18372e]/20 sm:grid-cols-2 lg:grid-cols-4" aria-label="Ringkasan hari ini">
          <article className="border-b border-[#18372e]/20 py-6 sm:border-r lg:border-b-0 lg:pr-6">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-[#4f7f9a]">Air putih</p>
            <p className="display-font mt-2 text-4xl font-black">{progress.waterGlasses}<span className="text-xl text-[#48665c]"> / 8 gelas</span></p>
            <p className="mt-2 text-sm font-bold text-[#48665c]">{summary.waterPercent}% target sederhana</p>
          </article>
          <article className="border-b border-[#18372e]/20 py-6 sm:pl-6 lg:border-b-0 lg:border-r lg:pr-6">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-[#b86435]">Gerak tubuh</p>
            <p className="display-font mt-2 text-4xl font-black">{progress.activityMinutes}<span className="text-xl text-[#48665c]"> menit</span></p>
            <p className="mt-2 text-sm font-bold text-[#48665c]">Dari aktivitas yang dicatat</p>
          </article>
          <article className="border-b border-[#18372e]/20 py-6 sm:border-r sm:pr-6 lg:border-b-0 lg:pl-6">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-[#247a4d]">Makanan berwarna</p>
            <p className="display-font mt-2 text-4xl font-black">{summary.healthyFoodCount}<span className="text-xl text-[#48665c]"> catatan</span></p>
            <p className="mt-2 text-sm font-bold text-[#48665c]">Manis tercatat: {summary.sweetFoodCount}</p>
          </article>
          <article className="py-6 sm:pl-6">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-[#9d6e18]">Keterlibatan</p>
            <p className="display-font mt-2 text-4xl font-black">{progress.xp}<span className="text-xl text-[#48665c]"> XP</span></p>
            <p className="mt-2 text-sm font-bold text-[#48665c]">Streak {progress.streak} hari</p>
          </article>
        </section>

        <section className="grid gap-8 border-b border-[#18372e]/20 py-8 lg:grid-cols-[1.05fr_0.95fr]">
          <article>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#48665c]">Jurnal anak</p>
                <h2 className="display-font mt-1 text-3xl font-black">Catatan makanan</h2>
              </div>
              <span className="text-sm font-bold text-[#48665c]">{progress.foodLogs.length} entri</span>
            </div>
            {progress.foodLogs.length ? (
              <ul className="mt-5 divide-y divide-[#18372e]/15 border-y border-[#18372e]/20" role="list">
                {progress.foodLogs.map((food, index) => (
                  <li className="flex items-center justify-between gap-3 py-4" key={`${food.name}-${index}`}>
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-[#dce9df] text-sm font-black">{index + 1}</span>
                      <span className="font-black">{food.name}</span>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#48665c]">{toneCopy[food.tone]}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-5 border-y border-[#18372e]/20 py-8 text-center text-sm font-bold text-[#48665c]" role="status">Belum ada makanan yang dicatat hari ini.</div>
            )}
          </article>

          <article className="rounded-3xl bg-[#e2e7d2] p-5 sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#48665c]">Aktivitas ringan</p>
            <h2 className="display-font mt-1 text-3xl font-black">Status misi anak</h2>
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between gap-4 border-b border-[#18372e]/15 pb-3">
                <span className="font-black">Tantangan harian</span>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${progress.challengeCompleted ? "bg-[#247a4d] text-white" : "bg-white text-[#48665c]"}`}>
                  {progress.challengeCompleted ? "Selesai" : "Belum"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-[#18372e]/15 pb-3">
                <span className="font-black">Kuis pengetahuan</span>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${progress.quizCompleted ? "bg-[#247a4d] text-white" : "bg-white text-[#48665c]"}`}>
                  {progress.quizCompleted ? "Selesai" : "Belum"}
                </span>
              </div>
            </div>
            <p className="mt-5 text-sm font-bold leading-6 text-[#48665c]">
              Saran percakapan: tanyakan bagian mana yang paling seru dan rayakan setiap pencapaian kecil anak.
            </p>
          </article>
        </section>

        <section className="py-8">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#48665c]">Inspirasi meja makan</p>
            <h2 className="display-font mt-1 text-3xl font-black">Ide menu untuk dibicarakan bersama</h2>
            <p className="mt-3 text-sm font-bold leading-6 text-[#48665c]">
              Makanan tradisional tidak otomatis sehat atau tidak sehat. Perhatikan keberagaman, porsi, cara masak, serta gula dan minyak tambahan.
            </p>
          </div>
          <div className="mt-5 grid gap-px overflow-hidden rounded-3xl border border-[#18372e]/20 bg-[#18372e]/20 md:grid-cols-3">
            {menus.map((menu, index) => (
              <article className="bg-white p-5" key={menu.title}>
                <span className="text-xs font-black text-[#48665c]">0{index + 1}</span>
                <h3 className="display-font mt-3 text-xl font-black leading-tight">{menu.title}</h3>
                <p className="mt-3 text-sm font-bold leading-6 text-[#48665c]">{menu.note}</p>
              </article>
            ))}
          </div>
        </section>

        <footer className="border-t border-[#18372e]/20 py-5 text-xs font-bold leading-5 text-[#48665c]">
          Data terenkripsi dan aman. Ringkasan tidak dapat digunakan untuk diagnosis medis atau menggantikan konsultasi dengan tenaga kesehatan.
        </footer>
      </div>
    </main>
  );
}
