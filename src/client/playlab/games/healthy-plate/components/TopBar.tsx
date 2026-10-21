import React, { useState } from 'react';
import { CloseIcon, SparkleIcon } from '../../../components/UIIcons';
import { NimboAvatar } from '../../../components/NimboAvatar';

interface TopBarProps {
  currentRound: number;
  totalRounds: number;
  xpBonus: number;
  onExit: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentRound,
  totalRounds,
  xpBonus,
  onExit,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between px-1 py-1 max-w-md mx-auto w-full">
        <button
          onClick={() => setShowConfirm(true)}
          className="game-btn flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-black text-[#173d31]"
          aria-label="Keluar dari permainan"
        >
          <CloseIcon className="w-3.5 h-3.5" />
          <span>Keluar</span>
        </button>

        <div className="flex flex-col items-center">
          <span className="text-xs font-black tracking-wide text-[#173d31]">
            Piring Sehat Nimbo
          </span>
          <span className="text-[10px] font-bold text-[#285648]/80">
            Babak {currentRound} dari {totalRounds}
          </span>
        </div>

        <div className="flex items-center gap-1.5 rounded-full border-2 border-[#173d31] bg-[#f4b942] px-3 py-1 text-xs font-black shadow-[1px_2px_0_#173d31]">
          <SparkleIcon className="w-3.5 h-3.5 text-[#173d31]" />
          <span>+{xpBonus} XP</span>
        </div>
      </header>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-2xl border-4 border-[#173d31] bg-[#fff9e9] p-5 shadow-[4px_6px_0_#173d31] text-center">
            <div className="flex justify-center mb-2">
              <NimboAvatar mood="thinking" size={48} />
            </div>
            <h3 className="text-base font-black text-[#173d31]">Mau keluar sekarang?</h3>
            <p className="mt-1 text-xs font-bold text-[#285648]">
              Progres piring sehat babak ini belum tersimpan jika kamu keluar.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="game-btn flex-1 rounded-xl bg-white py-2 text-xs font-black text-[#173d31]"
              >
                Lanjut Main
              </button>
              <button
                onClick={onExit}
                className="game-btn flex-1 rounded-xl bg-[#fee2e2] py-2 text-xs font-black text-[#991b1b]"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
