import React, { useState } from 'react';
import { KnowledgeQuestion } from '../../../content/types';

interface KnowledgeQuizProps {
  questions: KnowledgeQuestion[];
  isSubmitting: boolean;
  onSubmitAnswers: (answers: { questionId: string; selectedAnswer: string }[]) => void;
}

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
    <div className="w-full max-w-md mx-auto rounded-2xl border-2 border-[#173d31] bg-white p-5 shadow-[3px_4px_0_#173d31]">
      <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-[#247a4d]">
        <span>Kuis Evaluasi Gizi</span>
        <span>Pertanyaan {currentIndex + 1} / {questions.length}</span>
      </div>

      <h2 className="mt-2.5 text-sm font-black leading-snug sm:text-base text-[#173d31]">
        {currentQ.question}
      </h2>

      <div className="mt-4 space-y-2.5">
        {currentQ.options.map((opt) => (
          <button
            key={opt.id}
            disabled={isSubmitting}
            onClick={() => handleSelect(opt.id)}
            className={`w-full rounded-xl border-2 border-[#173d31] p-3 text-left text-xs font-bold transition shadow-[2px_2px_0_#173d31] ${
              selectedOptionId === opt.id
                ? 'bg-[#dcfce7] font-black text-[#15803d] border-[#15803d]'
                : 'bg-white hover:bg-slate-50 text-[#173d31]'
            }`}
          >
            {opt.text}
          </button>
        ))}
      </div>

      <button
        disabled={!selectedOptionId || isSubmitting}
        onClick={handleNext}
        className={`game-btn mt-5 w-full rounded-xl py-3 text-xs font-black text-white transition ${
          selectedOptionId && !isSubmitting
            ? 'bg-[#247a4d] cursor-pointer'
            : 'bg-gray-300 opacity-60 cursor-not-allowed'
        }`}
      >
        {isSubmitting
          ? 'Menghitung Hasil di Server...'
          : currentIndex + 1 < questions.length
          ? 'Lanjut ke Soal Berikutnya'
          : 'Selesai & Kumpulkan Jawaban'}
      </button>
    </div>
  );
};
