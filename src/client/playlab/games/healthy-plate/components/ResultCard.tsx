import React from 'react';
import { motion } from 'framer-motion';
import { GameResultDto } from '../../../api/types';
import { StarRating, SparkleIcon, CheckIcon, RefreshIcon } from '../../../components/UIIcons';

interface ResultCardProps {
  result: GameResultDto;
  onExit: () => void;
  onPlayAgain: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  result,
  onExit,
  onPlayAgain,
}) => {
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-md mx-auto rounded-2xl border-4 border-[#173d31] bg-white p-5 text-center shadow-[4px_6px_0_#173d31]"
    >
      <div className="mb-3">
        <StarRating count={result.starsEarned} />
      </div>

      <h1 className="text-xl font-black text-[#173d31]">
        Hebat Sekali!
      </h1>
      <p className="mt-1 text-xs font-bold text-[#285648]">
        {result.feedbackSummary || 'Piring makanmu berhasil tersusun dengan gizi seimbang.'}
      </p>

      {/* Structured Score Breakdown */}
      <div className="mt-4 rounded-xl border-2 border-[#173d31]/20 bg-[#fff9e9] p-3.5 text-left text-xs space-y-2 font-bold">
        <div className="flex justify-between items-center">
          <span className="text-[#173d31]">Skor Praktik Piring Sehat:</span>
          <span className="text-[#15803d] font-black bg-[#dcfce7] px-2 py-0.5 rounded-full border border-[#15803d]/30">
            {result.gameplayScore} / 100
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-[#173d31]">Skor Kuis Evaluasi Gizi:</span>
          <span className="text-[#15803d] font-black bg-[#dcfce7] px-2 py-0.5 rounded-full border border-[#15803d]/30">
            {result.knowledgeScore} / 100
          </span>
        </div>

        <div className="flex justify-between items-center border-t border-[#173d31]/15 pt-2 font-black text-sm">
          <span>Hadiah XP Si-Cehat:</span>
          <span className="text-[#d97706] flex items-center gap-1.5">
            <SparkleIcon className="w-4 h-4 text-[#d97706]" />
            +{result.xpAwarded} XP
          </span>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2.5">
        <button
          onClick={onExit}
          className="game-btn flex items-center justify-center gap-2 w-full rounded-xl bg-[#247a4d] py-3 text-xs font-black text-white cursor-pointer active:translate-y-0.5"
        >
          <CheckIcon className="w-4 h-4" />
          <span>Selesai & Keluar ke Menu Utama</span>
        </button>

        <button
          onClick={onPlayAgain}
          className="game-btn flex items-center justify-center gap-2 w-full rounded-xl bg-white py-2.5 text-xs font-bold text-[#173d31] cursor-pointer"
        >
          <RefreshIcon className="w-3.5 h-3.5" />
          <span>Susun Piring Lainnya</span>
        </button>
      </div>
    </motion.div>
  );
};
