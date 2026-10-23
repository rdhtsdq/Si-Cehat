import React, { useState } from 'react';
import { KnowledgeQuestion } from '../../../content/types';
import { CheckIcon } from '../../../components/UIIcons';

interface KnowledgeQuizProps {
  questions: KnowledgeQuestion[];
  isSubmitting: boolean;
  onSubmitAnswers: (answers: { questionId: string; selectedAnswer: string }[]) => void;
}

const QuizOptionGraphic: React.FC<{ optionId: string }> = ({ optionId }) => {
  switch (optionId) {
    case 'setengah_piring':
      return (
        <svg viewBox="0 0 40 40" className="w-10 h-10 shrink-0" fill="none">
          <circle cx="20" cy="20" r="18" fill="#ffffff" stroke="#15803d" strokeWidth="2.5" />
          <path d="M20 2 A18 18 0 0 1 20 38 Z" fill="#86efac" />
          <line x1="20" y1="2" x2="20" y2="38" stroke="#15803d" strokeWidth="2" strokeDasharray="2 2" />
          <circle cx="28" cy="15" r="3" fill="#ea580c" />
          <circle cx="27" cy="24" r="3" fill="#16a34a" />
          <text x="8" y="24" fontSize="10" fontWeight="900" fill="#173d31">½</text>
        </svg>
      );

    case 'sedikit_saja':
      return (
        <svg viewBox="0 0 40 40" className="w-10 h-10 shrink-0" fill="none">
          <circle cx="20" cy="20" r="18" fill="#fef3c7" stroke="#d97706" strokeWidth="2" />
          <ellipse cx="25" cy="18" rx="8" ry="5" fill="#fde68a" stroke="#b45309" strokeWidth="2" />
          <path d="M19 20 L9 31" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
          <circle cx="25" cy="18" r="1.8" fill="#16a34a" />
        </svg>
      );

    case 'tidak_perlu':
      return (
        <svg viewBox="0 0 40 40" className="w-10 h-10 shrink-0" fill="none">
          <circle cx="20" cy="20" r="18" fill="#fee2e2" stroke="#dc2626" strokeWidth="2" />
          <circle cx="20" cy="20" r="12" stroke="#f87171" strokeWidth="1.5" />
          <line x1="13" y1="13" x2="27" y2="27" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'air_putih':
      return (
        <svg viewBox="0 0 40 40" className="w-10 h-10 shrink-0" fill="none">
          <rect x="12" y="9" width="16" height="23" rx="4" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2" />
          <path d="M13 17 Q20 15 27 17 L26 30 Q20 32 14 30 Z" fill="#38bdf8" fillOpacity="0.75" />
          <path d="M20 11 Q17 14 17 17 A3 3 0 0 0 23 17 Q23 14 20 11 Z" fill="#0284c7" />
          <circle cx="17" cy="22" r="1.2" fill="#ffffff" />
          <circle cx="23" cy="25" r="1.4" fill="#ffffff" />
        </svg>
      );

    case 'minuman_soda':
      return (
        <svg viewBox="0 0 40 40" className="w-10 h-10 shrink-0" fill="none">
          <path d="M12 14h16l-2 20H14L12 14z" fill="#f87171" stroke="#dc2626" strokeWidth="2" />
          <rect x="11" y="11" width="18" height="4" rx="2" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
          <path d="M22 11l3-6h4" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="18" cy="21" r="1.5" fill="#ffffff" opacity="0.8" />
          <circle cx="22" cy="25" r="1.5" fill="#ffffff" opacity="0.8" />
        </svg>
      );

    case 'teh_manis_pekat':
      return (
        <svg viewBox="0 0 40 40" className="w-10 h-10 shrink-0" fill="none">
          <rect x="12" y="10" width="16" height="22" rx="3" fill="#ffedd5" stroke="#c2410c" strokeWidth="2" />
          <path d="M13 16 Q20 14 27 16 L26 30 Q20 32 14 30 Z" fill="#b45309" fillOpacity="0.85" />
          <rect x="15" y="19" width="4.5" height="4.5" rx="1" fill="#fed7aa" opacity="0.8" />
          <rect x="21" y="23" width="4" height="4" rx="1" fill="#fed7aa" opacity="0.8" />
        </svg>
      );

    default:
      return null;
  }
};

export const KnowledgeQuiz: React.FC<KnowledgeQuizProps> = ({
  questions,
  isSubmitting,
  onSubmitAnswers,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  const currentQ = questions[currentIndex];

  const handleSelect = (optionId: string) => {
    setSelectedOptionId(optionId);
  };

  const handleNext = () => {
    if (!selectedOptionId || !currentQ) return;

    const updated = {
      ...userAnswers,
      [currentQ.id]: selectedOptionId,
    };
    setUserAnswers(updated);
    setSelectedOptionId(null);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      const formatted = Object.entries(updated).map(([questionId, selectedAnswer]) => ({
        questionId,
        selectedAnswer,
      }));
      onSubmitAnswers(formatted);
    }
  };

  if (!currentQ) return null;

  return (
    <div className="w-full max-w-md mx-auto rounded-2xl border-2 border-[#173d31] bg-white p-4 sm:p-5 shadow-[3px_4px_0_#173d31]">
      <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-[#247a4d]">
        <span>Kuis Gizi</span>
        <span>Soal {currentIndex + 1}/{questions.length}</span>
      </div>

      <h2 className="mt-2 text-sm font-black leading-snug sm:text-base text-[#173d31]">
        {currentQ.question}
      </h2>

      <div className="mt-3.5 space-y-2.5">
        {currentQ.options.map((opt) => {
          const isSelected = selectedOptionId === opt.id;
          return (
            <button
              key={opt.id}
              disabled={isSubmitting}
              onClick={() => handleSelect(opt.id)}
              className={`w-full rounded-2xl border-2 p-2.5 flex items-center justify-between gap-3 text-left transition active:scale-[0.99] shadow-[2px_2px_0_#173d31] cursor-pointer ${
                isSelected
                  ? 'bg-[#dcfce7] border-[#15803d] text-[#15803d]'
                  : 'bg-white hover:bg-slate-50 border-[#173d31] text-[#173d31]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <QuizOptionGraphic optionId={opt.id} />
                <span className={`text-xs ${isSelected ? 'font-black' : 'font-bold'}`}>
                  {opt.text}
                </span>
              </div>

              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                isSelected
                  ? 'bg-[#15803d] border-[#15803d] text-white'
                  : 'border-[#173d31]/30 bg-white'
              }`}>
                {isSelected && <CheckIcon className="w-3 h-3" />}
              </div>
            </button>
          );
        })}
      </div>

      <button
        disabled={!selectedOptionId || isSubmitting}
        onClick={handleNext}
        className={`game-btn mt-4 w-full rounded-xl py-3 text-xs font-black text-white transition ${
          selectedOptionId && !isSubmitting
            ? 'bg-[#247a4d] cursor-pointer active:translate-y-0.5'
            : 'bg-gray-300 opacity-60 cursor-not-allowed'
        }`}
      >
        {isSubmitting
          ? 'Menyimpan Hasil...'
          : currentIndex + 1 < questions.length
          ? 'Soal Berikutnya'
          : 'Selesai'}
      </button>
    </div>
  );
};

