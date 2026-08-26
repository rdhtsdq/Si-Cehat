"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { AvatarRenderer } from "@/components/AvatarRenderer";
import { defaultAvatarPreference, loadAvatarPreference, type AvatarPreference } from "@/lib/avatar";
import {
  addXp,
  createDefaultProgress,
  dailyQuiz,
  loadProgress,
  saveProgress,
  summarizeProgress,
  todayChallenge,
  type DailyProgress,
  type MealTone,
} from "@/lib/progress";

const foodToneLabels: Record<MealTone, string> = {
  balanced: "Lengkap warna",
  sweet: "Rasa manis",
  fried: "Digoreng",
  unknown: "Belum tahu",
};

function MissionIcon({ type }: { type: "water" | "move" | "food" | "quiz" }) {
  if (type === "water") return <svg aria-hidden="true" className="h-10 w-10" viewBox="0 0 48 48"><path d="M24 4S10 22 10 31a14 14 0 0028 0C38 22 24 4 24 4z" fill="#75c8e8" stroke="#173d31" strokeWidth="3" /><path d="M17 32q2 7 9 7" fill="none" stroke="white" strokeLinecap="round" strokeWidth="3" /></svg>;
  if (type === "move") return <svg aria-hidden="true" className="h-10 w-10" viewBox="0 0 48 48"><circle cx="29" cy="8" r="5" fill="#f4b942" stroke="#173d31" strokeWidth="3" /><path d="M27 16l-8 10 8 5-7 12M27 17l8 9 8-3M27 31l10 10" fill="none" stroke="#173d31" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" /></svg>;
  if (type === "food") return <svg aria-hidden="true" className="h-10 w-10" viewBox="0 0 48 48"><path d="M13 7v14M7 7v9q0 6 6 6t6-6V7M13 22v20M35 7v35M35 7q9 8 0 20" fill="none" stroke="#173d31" strokeLinecap="round" strokeWidth="4" /></svg>;
  return <svg aria-hidden="true" className="h-10 w-10" viewBox="0 0 48 48"><path d="M24 5a16 16 0 00-9 29v8l9-5a16 16 0 100-32z" fill="#fff9e9" stroke="#173d31" strokeWidth="3" /><path d="M19 18q1-6 6-6 6 0 6 5 0 4-6 6v4M25 32h.1" fill="none" stroke="#173d31" strokeLinecap="round" strokeWidth="4" /></svg>;
}

export default function ChildDashboardPage() {
  const [avatar, setAvatar] = useState<AvatarPreference>(defaultAvatarPreference);
  const [progress, setProgress] = useState<DailyProgress>(() => createDefaultProgress());
  const [foodName, setFoodName] = useState("");
  const [foodTone, setFoodTone] = useState<MealTone>("balanced");
  const [quizAnswer, setQuizAnswer] = useState("");
  const [feedback, setFeedback] = useState("Pilih satu tempat untuk memulai misi!");
  const summary = summarizeProgress(progress);
  const level = Math.floor(progress.xp / 100) + 1;
  const levelProgress = progress.xp % 100;

  useEffect(() => {
    setAvatar(loadAvatarPreference());
    setProgress(loadProgress());
  }, []);

  function updateProgress(next: DailyProgress, message: string) {
    setProgress(next);
    saveProgress(next);
    setFeedback(message);
  }

  function addWater() {
    if (progress.waterGlasses >= 20) {
      setFeedback("Catatan air hari ini sudah penuh. Kamu hebat sudah rajin mencatat!");
      return;
    }
    updateProgress({ ...progress, waterGlasses: progress.waterGlasses + 1, xp: Math.min(9999, progress.xp + 5) }, "Pling! Satu gelas tercatat. Tubuhmu berterima kasih.");
  }

  function addActivity(minutes: number) {
    if (progress.activityMinutes >= 240) {
      setFeedback("Catatan gerak hari ini sudah penuh. Saatnya istirahat yang cukup.");
      return;
    }
    updateProgress({ ...progress, activityMinutes: Math.min(240, progress.activityMinutes + minutes), xp: Math.min(9999, progress.xp + 10) }, `Hebat! ${minutes} menit gerak ditambahkan.`);
  }

  function submitFood(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = foodName.trim();
    if (!name) return;
    updateProgress({ ...progress, foodLogs: [...progress.foodLogs, { name, tone: foodTone }].slice(-12), xp: Math.min(9999, progress.xp + (foodTone === "balanced" ? 12 : 6)) }, `${name} masuk ke jurnal petualanganmu.`);
    setFoodName("");
    setFoodTone("balanced");
  }

  function completeChallenge() {
    if (progress.challengeCompleted) return;
    updateProgress(addXp({ ...progress, challengeCompleted: true }, todayChallenge.xp), `Misi utama selesai! Kamu mendapat ${todayChallenge.xp} XP.`);
  }

  function answerQuiz(option: string) {
    setQuizAnswer(option);
    if (progress.quizCompleted) return;
    const correct = option === dailyQuiz.answer;
    if (correct) {
      updateProgress(addXp({ ...progress, quizCompleted: true }, dailyQuiz.xp), `Jawaban tepat! +${dailyQuiz.xp} XP.`);
    } else {
      setFeedback("Percobaan bagus. Petunjuk: pilih minuman tanpa gula tambahan.");
    }
  }

  return (
    <main className="map-grid min-h-screen bg-[#d8eddb] px-3 py-4 sm:px-6 sm:py-5">
      <div className="mx-auto max-w-6xl space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border-3 border-[#173d31] bg-[#fff9e9] px-4 py-3 shadow-[4px_5px_0_#173d31]">
          <div className="flex items-center gap-3">
            <Link className="display-font text-xl font-black text-[#173d31]" href="/">Si Cehat</Link>
            <span className="hidden h-6 w-px bg-[#173d31]/25 sm:block" />
            <span className="hidden text-sm font-black text-[#247a4d] sm:block">Peta {progress.childName}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-[#f4b942] px-4 py-2 text-sm font-black text-[#173d31]">Level {level}</div>
            <div className="rounded-full bg-[#ef6a55] px-4 py-2 text-sm font-black text-[#173d31]">{progress.xp} XP</div>
            <Link aria-label="Buka area orang tua" className="rounded-full border-2 border-[#173d31] px-3 py-2 text-sm font-black text-[#173d31]" href="/parent">Orang Tua</Link>
          </div>
        </header>

        <section className="adventure-paper relative overflow-hidden rounded-[2rem] bg-[#bde5db] px-4 pb-5 pt-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#247a4d]">Petualangan Hari Ini</p>
              <h1 className="display-font text-4xl font-black text-[#173d31] sm:text-5xl">Hai, {progress.childName}!</h1>
            </div>
            <nav className="flex gap-2" aria-label="Aksi teman">
              <Link className="game-button rounded-full bg-[#f4b942] px-5 py-3 text-sm font-black text-[#173d31]" href="/chat">Ngobrol</Link>
              <Link className="rounded-full border-2 border-[#173d31] bg-white/75 px-4 py-3 text-sm font-black text-[#173d31]" href="/avatar">Ganti Teman</Link>
            </nav>
          </div>
          <div className="mt-3 grid items-center gap-3 sm:grid-cols-[180px_1fr]">
            <AvatarRenderer {...avatar} state={progress.challengeCompleted ? "celebrating" : "happy"} className="h-44 w-44" />
            <div>
              <div className="relative rounded-3xl border-3 border-[#173d31] bg-white p-4 text-base font-black leading-7 text-[#173d31] shadow-[4px_5px_0_#173d31]" aria-live="polite">
                <span className="absolute -left-3 top-8 h-5 w-5 rotate-45 border-b-3 border-l-3 border-[#173d31] bg-white" aria-hidden="true" />
                {feedback}
              </div>
              <div className="mt-4 flex items-center gap-3">
                <span className="text-xs font-black uppercase tracking-wider text-[#247a4d]">Level berikutnya</span>
                <div className="h-4 flex-1 overflow-hidden rounded-full border-2 border-[#173d31] bg-white" role="progressbar" aria-label="Kemajuan level" aria-valuemax={100} aria-valuemin={0} aria-valuenow={levelProgress}>
                  <div className="h-full bg-[#f4b942]" style={{ width: `${levelProgress}%` }} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="mission-map-title" className="relative overflow-hidden rounded-[2rem] border-3 border-[#173d31] bg-[#83c876] p-4 sm:p-6">
          <div className="absolute inset-0 opacity-25 map-grid" aria-hidden="true" />
          <div className="relative mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#173d31]/70">Pilih lokasi</p>
              <h2 className="display-font text-3xl font-black text-[#173d31]" id="mission-map-title">Peta Misi</h2>
            </div>
            <div className="rounded-full border-2 border-[#173d31] bg-[#fff9e9] px-4 py-2 text-xs font-black text-[#173d31]">Skor {summary.dailyScore}/100</div>
          </div>

          <div className="relative grid gap-4 lg:grid-cols-2">
            <article className="relative rounded-[2rem_1rem_2rem_1rem] border-3 border-[#173d31] bg-[#d9f0f7] p-5 shadow-[5px_6px_0_#173d31]">
              <div className="flex items-start justify-between gap-3"><MissionIcon type="water" /><span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#173d31]">+5 XP</span></div>
              <h3 className="display-font mt-2 text-2xl font-black text-[#173d31]">Danau Air Putih</h3>
              <p className="mt-1 text-sm font-bold text-[#285648]">Isi delapan tetes agar danaunya penuh.</p>
              <div className="mt-4 flex gap-1" aria-label={`${progress.waterGlasses} dari 8 gelas`}>
                {Array.from({ length: 8 }, (_, index) => <span className={`h-7 flex-1 rounded-full border-2 border-[#173d31] ${index < progress.waterGlasses ? "bg-[#75c8e8]" : "bg-white/70"}`} key={index} />)}
              </div>
              <button className="game-button mt-4 min-h-12 w-full rounded-full bg-[#75c8e8] px-5 font-black text-[#173d31]" onClick={addWater} type="button">Aku minum 1 gelas</button>
            </article>

            <article className="relative rounded-[1rem_2rem_1rem_2rem] border-3 border-[#173d31] bg-[#ffe5b3] p-5 shadow-[5px_6px_0_#173d31] lg:translate-y-7">
              <div className="flex items-start justify-between gap-3"><MissionIcon type="move" /><span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#173d31]">+10 XP</span></div>
              <h3 className="display-font mt-2 text-2xl font-black text-[#173d31]">Taman Gerak</h3>
              <p className="mt-1 text-sm font-bold text-[#285648]">Jalan, menari, main bola, semua gerak berarti.</p>
              <p className="mt-3 text-3xl font-black text-[#173d31]">{progress.activityMinutes} <span className="text-base">menit</span></p>
              <div className="mt-3 h-3 overflow-hidden rounded-full border-2 border-[#173d31] bg-white"><div className="h-full bg-[#f4b942]" style={{ width: `${summary.activityPercent}%` }} /></div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button className="game-button min-h-12 rounded-full bg-white px-4 font-black text-[#173d31]" onClick={() => addActivity(10)} type="button">+10 menit</button>
                <button className="game-button min-h-12 rounded-full bg-[#f4b942] px-4 font-black text-[#173d31]" onClick={() => addActivity(20)} type="button">+20 menit</button>
              </div>
            </article>

            <article className="rounded-[2rem_1rem_1rem_2rem] border-3 border-[#173d31] bg-[#fff9e9] p-5 shadow-[5px_6px_0_#173d31] lg:mt-2">
              <div className="flex items-start justify-between gap-3"><MissionIcon type="food" /><span className="rounded-full bg-[#ef6a55] px-3 py-1 text-xs font-black text-[#173d31]">Jurnal</span></div>
              <h3 className="display-font mt-2 text-2xl font-black text-[#173d31]">Dapur Warna</h3>
              <p className="mt-1 text-sm font-bold text-[#285648]">Catat tanpa takut dinilai. Semua makanan boleh diceritakan.</p>
              <form className="mt-4 space-y-3" onSubmit={submitFood}>
                <label className="sr-only" htmlFor="food-name">Nama makanan</label>
                <input className="min-h-12 w-full rounded-2xl border-2 border-[#173d31] bg-white px-4 font-bold text-[#173d31]" id="food-name" maxLength={60} onChange={(event) => setFoodName(event.target.value)} placeholder="Tadi aku makan..." value={foodName} />
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <label className="sr-only" htmlFor="food-tone">Jenis catatan</label>
                  <select className="min-h-12 rounded-2xl border-2 border-[#173d31] bg-white px-3 text-sm font-bold text-[#173d31]" id="food-tone" onChange={(event) => setFoodTone(event.target.value as MealTone)} value={foodTone}>{Object.entries(foodToneLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                  <button className="game-button rounded-2xl bg-[#ef6a55] px-5 font-black text-[#173d31]" type="submit">Catat</button>
                </div>
              </form>
            </article>

            <article className="rounded-[1rem_2rem_2rem_1rem] border-3 border-[#173d31] bg-[#f6d1db] p-5 shadow-[5px_6px_0_#173d31] lg:translate-y-9">
              <div className="flex items-start justify-between gap-3"><MissionIcon type="quiz" /><span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#173d31]">Misi utama</span></div>
              <h3 className="display-font mt-2 text-2xl font-black text-[#173d31]">Bukit Tantangan</h3>
              <div className="mt-3 rounded-2xl border-2 border-[#173d31] bg-[#f4b942] p-3">
                <p className="font-black text-[#173d31]">{todayChallenge.title}</p>
                <p className="mt-1 text-sm font-bold leading-5 text-[#285648]">{todayChallenge.description}</p>
                <button className="mt-3 min-h-11 w-full rounded-full border-2 border-[#173d31] bg-white px-4 text-sm font-black text-[#173d31] disabled:opacity-60" disabled={progress.challengeCompleted} onClick={completeChallenge} type="button">{progress.challengeCompleted ? "Misi selesai!" : `Tandai selesai +${todayChallenge.xp} XP`}</button>
              </div>
              <p className="mt-4 text-sm font-black text-[#173d31]">Kuis: {dailyQuiz.question}</p>
              <div className="mt-2 grid gap-2">
                {dailyQuiz.options.map((option) => <button className="min-h-10 rounded-full border-2 border-[#173d31] bg-white px-4 text-left text-sm font-bold text-[#173d31] transition hover:bg-[#fff9e9] disabled:opacity-60" disabled={progress.quizCompleted} key={option} onClick={() => answerQuiz(option)} type="button">{option}</button>)}
              </div>
              {quizAnswer ? <p className="mt-2 text-sm font-black text-[#173d31]">{quizAnswer === dailyQuiz.answer ? "Tepat! Bintang untukmu." : "Belum tepat, tetapi kamu sudah berani mencoba."}</p> : null}
            </article>
          </div>
          <div className="h-8 lg:h-12" />
        </section>
      </div>
    </main>
  );
}
