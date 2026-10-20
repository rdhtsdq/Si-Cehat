import React, { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { AvatarRenderer } from "@/components/AvatarRenderer";

interface FoodItem {
  id: string;
  name: string;
  category: "karbo" | "protein" | "sayur" | "buah" | "distractor";
  color: string;
}

const FOODS: FoodItem[] = [
  { id: "nasi-merah", name: "Nasi Merah", category: "karbo", color: "#fef3c7" },
  { id: "kentang-rebus", name: "Kentang Rebus", category: "karbo", color: "#fef3c7" },
  { id: "bayam-bening", name: "Sayur Bayam", category: "sayur", color: "#dcfce7" },
  { id: "wortel-rebus", name: "Wortel Manis", category: "sayur", color: "#dcfce7" },
  { id: "ikan-bakar", name: "Ikan Bakar", category: "protein", color: "#dbeafe" },
  { id: "telur-rebus", name: "Telur Rebus", category: "protein", color: "#dbeafe" },
  { id: "pisang-barangan", name: "Pisang Barangan", category: "buah", color: "#ffedd5" },
  { id: "apel-segar", name: "Apel Renyah", category: "buah", color: "#ffedd5" },
  { id: "donat-cokelat", name: "Donat Gula", category: "distractor", color: "#fee2e2" },
];

export default function PlayLabGamePage() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const paramSessionId = searchParams.get("sessionId");
  const paramChildId = searchParams.get("childId");

  const [sessionId, setSessionId] = useState<string | null>(paramSessionId);
  const [selectedKarbo, setSelectedKarbo] = useState<FoodItem | null>(null);
  const [selectedProtein, setSelectedProtein] = useState<FoodItem | null>(null);
  const [selectedSayur, setSelectedSayur] = useState<FoodItem | null>(null);
  const [selectedBuah, setSelectedBuah] = useState<FoodItem | null>(null);

  const [nimboSpeech, setNimboSpeech] = useState<string>(
    "Ayo ketuk makanan di bawah untuk melengkapi 4 bagian piring sehatku!"
  );
  const [nimboMood, setNimboMood] = useState<"happy" | "excited" | "thinking">("happy");

  // Flow: 'PLATE' -> 'QUIZ' -> 'RESULT'
  const [phase, setPhase] = useState<"PLATE" | "QUIZ" | "RESULT">("PLATE");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    gameplayScore: number;
    knowledgeScore: number;
    totalScore: number;
    starsEarned: number;
    xpAwarded: number;
  } | null>(null);

  // Send bridge message to Flutter host or parent window
  const sendBridgeMessage = (message: { type: string; [key: string]: any }) => {
    try {
      const win = window as any;
      if (win.PlayLabBridge && typeof win.PlayLabBridge.postMessage === "function") {
        win.PlayLabBridge.postMessage(JSON.stringify(message));
      }
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(message, "*");
      }
    } catch (e) {
      console.warn("[PlayLabBridge] Error dispatching message:", e);
    }
  };

  const handleExit = () => {
    sendBridgeMessage({ type: "EXIT_GAME" });
    // In browser fallback
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  useEffect(() => {
    sendBridgeMessage({ type: "GAME_READY", protocolVersion: 1 });

    if (!sessionId) {
      fetch("/api/game-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameSlug: "piring-sehat-nimbo",
          childId: paramChildId || undefined,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.session?.id) {
            setSessionId(data.session.id);
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleSelectFood = (food: FoodItem) => {
    if (food.category === "distractor") {
      setNimboMood("thinking");
      setNimboSpeech("Waduh, donat terlalu manis! Ganti dengan buah segar ya.");
      return;
    }

    if (food.category === "karbo") {
      setSelectedKarbo(food);
      setNimboSpeech(`Hebat! ${food.name} mengisi karbohidrat untuk sumber energi.`);
    } else if (food.category === "protein") {
      setSelectedProtein(food);
      setNimboSpeech(`Mantap! ${food.name} adalah protein untuk tumbuh kuat.`);
    } else if (food.category === "sayur") {
      setSelectedSayur(food);
      setNimboSpeech(`Keren! ${food.name} kaya serat dan vitamin pencegah diabetes.`);
    } else if (food.category === "buah") {
      setSelectedBuah(food);
      setNimboSpeech(`Lezat! ${food.name} memberi rasa manis alami yang sehat.`);
    }

    setNimboMood("excited");
  };

  const isPlateComplete = selectedKarbo && selectedProtein && selectedSayur && selectedBuah;

  const handleCompletePlate = () => {
    setPhase("QUIZ");
    setNimboSpeech("Piringmu sudah lengkap! Sekarang, jawab 1 kuis kilat ini ya!");
    setNimboMood("thinking");
  };

  const handleAnswerQuiz = async (answerId: string) => {
    setSelectedAnswer(answerId);
    setIsSubmitting(true);

    const isCorrect = answerId === "setengah_piring";
    if (isCorrect) {
      setNimboMood("excited");
      setNimboSpeech("Jawabanmu 100% benar! Separuh piring kita diisi sayur dan buah.");
    } else {
      setNimboMood("thinking");
      setNimboSpeech("Hampir tepat! Yang benar adalah 1/2 piring diisi sayur dan buah.");
    }

    try {
      const plateItems: string[] = [];
      if (selectedKarbo) plateItems.push(selectedKarbo.id);
      if (selectedProtein) plateItems.push(selectedProtein.id);
      if (selectedSayur) plateItems.push(selectedSayur.id);
      if (selectedBuah) plateItems.push(selectedBuah.id);

      if (sessionId) {
        const res = await fetch(`/api/game-sessions/${sessionId}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plateItems,
            answers: [{ questionId: "q1_portion", selectedAnswer: answerId }],
          }),
        });
        const data = await res.json();
        if (data.result) {
          setResult(data.result);
          sendBridgeMessage({
            type: "GAME_COMPLETED",
            sessionId,
            scores: data.result,
          });
        }
      } else {
        setResult({
          gameplayScore: 100,
          knowledgeScore: isCorrect ? 100 : 50,
          totalScore: isCorrect ? 100 : 80,
          starsEarned: isCorrect ? 3 : 2,
          xpAwarded: 75,
        });
      }
    } catch {
      setResult({
        gameplayScore: 100,
        knowledgeScore: isCorrect ? 100 : 50,
        totalScore: isCorrect ? 100 : 80,
        starsEarned: isCorrect ? 3 : 2,
        xpAwarded: 75,
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setPhase("RESULT"), 1200);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff9e9] text-[#173d31] font-sans flex flex-col justify-between p-3 sm:p-5 select-none">
      {/* Top Bar with Clear Exit Button */}
      <header className="flex items-center justify-between">
        <button
          onClick={handleExit}
          className="flex items-center gap-1.5 rounded-full border-2 border-[#173d31] bg-white px-3.5 py-1.5 text-xs font-black shadow-[2px_2px_0_#173d31] transition active:translate-y-0.5 active:shadow-none"
        >
          <span>Keluar</span>
        </button>

        <span className="text-xs font-black tracking-wide sm:text-sm text-[#173d31]">
          Piring Sehat Nimbo
        </span>

        <div className="flex items-center gap-1 rounded-full border-2 border-[#173d31] bg-[#f4b942] px-3 py-1 text-xs font-black">
          <span>+75 XP</span>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="my-auto mx-auto w-full max-w-md py-2">
        {/* Nimbo Mascot Bubble */}
        <div className="mb-3 flex items-center gap-2.5 rounded-2xl border-2 border-[#173d31] bg-white p-2.5 shadow-[2px_3px_0_#173d31]">
          <div className="shrink-0 overflow-hidden rounded-xl border-2 border-[#173d31] bg-[#75c8e8]">
            <AvatarRenderer
              character="default"
              accessory="none"
              orbColor="#3b9d75"
              state={nimboMood === "thinking" ? "thinking" : nimboMood === "excited" ? "happy" : "idle"}
              className="h-10 w-10"
            />
          </div>
          <p className="text-xs font-bold leading-tight text-[#173d31]">
            {nimboSpeech}
          </p>
        </div>

        {/* PHASE 1: PLATE COMPOSITION */}
        {phase === "PLATE" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* The Plate */}
            <div className="relative mx-auto aspect-square max-w-[270px] rounded-full border-4 border-[#173d31] bg-white p-2.5 shadow-[3px_5px_0_#173d31]">
              <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-1.5 overflow-hidden rounded-full">
                {/* Karbohidrat */}
                <div
                  onClick={() => selectedKarbo && setSelectedKarbo(null)}
                  className="flex flex-col items-center justify-center rounded-tl-full border-2 border-[#f59e0b] bg-[#fef3c7] p-1 text-center cursor-pointer transition active:scale-95"
                >
                  <span className="text-[11px] font-black text-[#92400e]">
                    {selectedKarbo ? selectedKarbo.name : "Karbohidrat"}
                  </span>
                  {selectedKarbo ? (
                    <span className="text-[9px] text-[#15803d] font-bold">Lengkap</span>
                  ) : (
                    <span className="text-[8px] text-[#92400e]/60">1/3 piring</span>
                  )}
                </div>

                {/* Sayuran */}
                <div
                  onClick={() => selectedSayur && setSelectedSayur(null)}
                  className="flex flex-col items-center justify-center rounded-tr-full border-2 border-[#16a34a] bg-[#dcfce7] p-1 text-center cursor-pointer transition active:scale-95"
                >
                  <span className="text-[11px] font-black text-[#166534]">
                    {selectedSayur ? selectedSayur.name : "Sayuran"}
                  </span>
                  {selectedSayur ? (
                    <span className="text-[9px] text-[#15803d] font-bold">Lengkap</span>
                  ) : (
                    <span className="text-[8px] text-[#166534]/60">1/3 piring</span>
                  )}
                </div>

                {/* Protein */}
                <div
                  onClick={() => selectedProtein && setSelectedProtein(null)}
                  className="flex flex-col items-center justify-center rounded-bl-full border-2 border-[#2563eb] bg-[#dbeafe] p-1 text-center cursor-pointer transition active:scale-95"
                >
                  <span className="text-[11px] font-black text-[#1e40af]">
                    {selectedProtein ? selectedProtein.name : "Lauk Pauk"}
                  </span>
                  {selectedProtein ? (
                    <span className="text-[9px] text-[#15803d] font-bold">Lengkap</span>
                  ) : (
                    <span className="text-[8px] text-[#1e40af]/60">1/6 piring</span>
                  )}
                </div>

                {/* Buah */}
                <div
                  onClick={() => selectedBuah && setSelectedBuah(null)}
                  className="flex flex-col items-center justify-center rounded-br-full border-2 border-[#ea580c] bg-[#ffedd5] p-1 text-center cursor-pointer transition active:scale-95"
                >
                  <span className="text-[11px] font-black text-[#9a3412]">
                    {selectedBuah ? selectedBuah.name : "Buah Segar"}
                  </span>
                  {selectedBuah ? (
                    <span className="text-[9px] text-[#15803d] font-bold">Lengkap</span>
                  ) : (
                    <span className="text-[8px] text-[#9a3412]/60">1/6 piring</span>
                  )}
                </div>
              </div>

              {/* Center Plate Badge */}
              <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#173d31] bg-white px-2 py-0.5 text-[9px] font-black shadow-sm">
                Isi Piringku
              </div>
            </div>

            {/* Action Button: Proceed when ready */}
            {isPlateComplete ? (
              <motion.button
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                onClick={handleCompletePlate}
                className="mt-3.5 w-full rounded-2xl border-2 border-[#173d31] bg-[#247a4d] py-2.5 text-xs font-black text-white shadow-[2px_3px_0_#173d31] transition active:translate-y-0.5 active:shadow-none sm:text-sm"
              >
                Piring Lengkap! Lanjut Kuis
              </motion.button>
            ) : (
              <p className="mt-2 text-center text-[10px] font-bold text-[#285648]/80">
                Lengkapi 4 bagian di atas dengan mengetuk makanan di bawah
              </p>
            )}

            {/* Food Cards Grid */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              {FOODS.map((food) => (
                <button
                  key={food.id}
                  onClick={() => handleSelectFood(food)}
                  className="flex flex-col items-center justify-center rounded-xl border-2 border-[#173d31] p-2 text-center shadow-[1px_2px_0_#173d31] transition active:translate-y-0.5 active:shadow-none"
                  style={{ backgroundColor: food.color }}
                >
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#173d31]/70">
                    {food.category === "distractor" ? "Camilan" : food.category}
                  </span>
                  <span className="mt-0.5 text-[11px] font-black truncate w-full">{food.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* PHASE 2: QUICK 1-QUESTION QUIZ */}
        {phase === "QUIZ" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border-2 border-[#173d31] bg-white p-4 shadow-[3px_4px_0_#173d31]"
          >
            <div className="text-[10px] font-black uppercase tracking-wider text-[#247a4d]">
              Kuis Kilat Edukasi Sehat
            </div>
            <h2 className="mt-2 text-sm font-black leading-snug sm:text-base">
              Berapa banyak porsi sayuran dan buah yang ideal di piring kita?
            </h2>

            <div className="mt-4 space-y-2">
              <button
                disabled={isSubmitting}
                onClick={() => handleAnswerQuiz("setengah_piring")}
                className={`w-full rounded-xl border-2 border-[#173d31] p-3 text-left text-xs font-bold transition shadow-[2px_2px_0_#173d31] ${
                  selectedAnswer === "setengah_piring" ? "bg-[#dcfce7] font-black text-[#15803d]" : "bg-white"
                }`}
              >
                1/2 Piring (Separuh piring penuh sayur & buah)
              </button>

              <button
                disabled={isSubmitting}
                onClick={() => handleAnswerQuiz("sedikit_saja")}
                className={`w-full rounded-xl border-2 border-[#173d31] p-3 text-left text-xs font-bold transition shadow-[2px_2px_0_#173d31] ${
                  selectedAnswer === "sedikit_saja" ? "bg-[#fee2e2] font-black text-[#991b1b]" : "bg-white"
                }`}
              >
                Sedikit saja, cuma 1 sendok kecil
              </button>
            </div>

            {selectedAnswer && (
              <p className="mt-3 text-center text-xs font-black text-[#247a4d]">
                Menghitung skor evaluasi...
              </p>
            )}
          </motion.div>
        )}

        {/* PHASE 3: RESULT CELEBRATION */}
        {phase === "RESULT" && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-2xl border-2 border-[#173d31] bg-white p-5 text-center shadow-[3px_4px_0_#173d31]"
          >
            <div className="flex justify-center gap-1.5 mb-1">
              {[1, 2, 3].map((star) => (
                <svg
                  key={star}
                  viewBox="0 0 24 24"
                  className="w-8 h-8 fill-amber-400 stroke-amber-600"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
            <h1 className="mt-2 text-xl font-black">Hebat Sekali!</h1>
            <p className="text-xs font-bold text-[#285648]">
              Kamu berhasil menyusun Isi Piringku yang seimbang!
            </p>

            <div className="mt-4 rounded-xl border border-[#173d31]/20 bg-[#fff9e9] p-3 text-left text-xs space-y-1.5 font-bold">
              <div className="flex justify-between">
                <span>Skor Piring Sehat:</span>
                <span className="text-[#15803d] font-black">{result?.gameplayScore ?? 100} / 100</span>
              </div>
              <div className="flex justify-between">
                <span>Skor Kuis Gizi:</span>
                <span className="text-[#15803d] font-black">{result?.knowledgeScore ?? 100} / 100</span>
              </div>
              <div className="flex justify-between border-t border-[#173d31]/15 pt-1 font-black">
                <span>Hadiah XP:</span>
                <span className="text-[#f59e0b]">+{result?.xpAwarded ?? 75} XP</span>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <button
                onClick={handleExit}
                className="w-full rounded-xl border-2 border-[#173d31] bg-[#247a4d] py-3 text-xs font-black text-white shadow-[2px_3px_0_#173d31] transition active:translate-y-0.5 active:shadow-none"
              >
                Selesai & Keluar ke Menu Utama
              </button>

              <button
                onClick={() => {
                  setSelectedKarbo(null);
                  setSelectedProtein(null);
                  setSelectedSayur(null);
                  setSelectedBuah(null);
                  setSelectedAnswer(null);
                  setPhase("PLATE");
                  setNimboSpeech("Ayo susun piring sehatmu lagi!");
                  setNimboMood("happy");
                }}
                className="w-full rounded-xl border border-[#173d31] bg-white py-2 text-xs font-bold"
              >
                Main Lagi
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Subtle bottom note */}
      <footer className="text-center text-[10px] text-[#285648]/60 font-semibold">
        Si-Cehat PlayLab • Edukasi Gizi Seimbang Anak
      </footer>
    </div>
  );
}
