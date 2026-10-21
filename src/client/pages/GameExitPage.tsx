import React from "react";
import { useSearch, Link } from "wouter";
import { StarRating, SparkleIcon, CheckIcon } from "@/client/playlab/components/UIIcons";
import { NimboAvatar } from "@/client/playlab/components/NimboAvatar";

export default function GameExitPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);

  const totalScore = Number(params.get("totalScore") || 0);
  const gameplayScore = Number(params.get("gameplayScore") || 0);
  const knowledgeScore = Number(params.get("knowledgeScore") || 0);
  const starsEarned = Number(
    params.get("starsEarned") || (totalScore >= 80 ? 3 : totalScore >= 50 ? 2 : 1)
  );
  const xpAwarded = Number(
    params.get("xpAwarded") || (starsEarned === 3 ? 75 : starsEarned === 2 ? 60 : 45)
  );

  return (
    <div className="min-h-screen bg-[#fff9e9] text-[#173d31] flex flex-col justify-between p-4 sm:p-6 select-none">
      <header className="max-w-md mx-auto w-full text-center py-2">
        <span className="text-xs font-black uppercase tracking-wider text-[#247a4d]">
          Si-Cehat PlayLab
        </span>
      </header>

      <main className="my-auto mx-auto w-full max-w-md">
        <div className="w-full rounded-2xl border-4 border-[#173d31] bg-white p-6 text-center shadow-[4px_6px_0_#173d31]">
          <div className="flex justify-center mb-3">
            <NimboAvatar mood="celebrate" size={56} />
          </div>

          <div className="mb-3">
            <StarRating count={starsEarned} />
          </div>

          <h1 className="text-2xl font-black text-[#173d31]">
            Permainan Selesai!
          </h1>
          <p className="mt-1 text-xs font-bold text-[#285648]">
            Terima kasih sudah belajar menyusun piring sehat bersama Nimbo.
          </p>

          <div className="mt-5 rounded-xl border-2 border-[#173d31]/20 bg-[#fff9e9] p-4 text-left text-xs space-y-2.5 font-bold">
            <div className="flex justify-between items-center">
              <span>Skor Praktik Piring Sehat:</span>
              <span className="text-[#15803d] font-black bg-[#dcfce7] px-2.5 py-0.5 rounded-full border border-[#15803d]/30">
                {gameplayScore} / 100
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span>Skor Kuis Gizi:</span>
              <span className="text-[#15803d] font-black bg-[#dcfce7] px-2.5 py-0.5 rounded-full border border-[#15803d]/30">
                {knowledgeScore} / 100
              </span>
            </div>

            <div className="flex justify-between items-center border-t border-[#173d31]/15 pt-2 font-black text-sm">
              <span>Total XP Didapat:</span>
              <span className="text-[#d97706] flex items-center gap-1.5">
                <SparkleIcon className="w-4 h-4 text-[#d97706]" />
                +{xpAwarded} XP
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2.5">
            <Link
              href="/child"
              className="game-btn flex items-center justify-center gap-2 w-full rounded-xl bg-[#247a4d] py-3 text-xs font-black text-white"
            >
              <CheckIcon className="w-4 h-4" />
              <span>Kembali ke Petualangan Anak</span>
            </Link>

            <Link
              href="/playlab"
              className="game-btn flex items-center justify-center gap-2 w-full rounded-xl bg-white py-2.5 text-xs font-bold text-[#173d31]"
            >
              <span>Main Lagi</span>
            </Link>
          </div>
        </div>
      </main>

      <footer className="text-center text-[10px] text-[#285648]/60 font-semibold py-2">
        Si-Cehat PlayLab • Edukasi Gizi Seimbang Anak
      </footer>
    </div>
  );
}
