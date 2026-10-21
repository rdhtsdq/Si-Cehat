import React, { useState, useEffect } from 'react';
import { GameContentVersion, FoodItem } from '../../content/types';
import rawContent from '../../content/healthy-plate/v1.json';
import { PlateArea } from './components/PlateArea';
import { FoodCardGrid } from './components/FoodCardGrid';
import { NimboCoach, NimboMood } from './components/NimboCoach';
import { TopBar } from './components/TopBar';
import { KnowledgeQuiz } from './components/KnowledgeQuiz';
import { ResultCard } from './components/ResultCard';
import { calculateGameplayScore, PlateSelection } from '../../utils/scoring';
import { gameApi } from '../../api/client';
import { GameResultDto } from '../../api/types';
import { sendBridgeMessage } from '../../bridge/playlab-bridge';
import { PlateGraphic } from '../../components/UIIcons';

const content = rawContent as unknown as GameContentVersion;

type GamePhase = 'INTRO' | 'ROUND' | 'QUIZ' | 'RESULT';

export const HealthyPlateGame: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>('INTRO');
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [plate, setPlate] = useState<PlateSelection>({
    karbo: null,
    protein: null,
    sayur: null,
    buah: null,
  });

  const [nimboSpeech, setNimboSpeech] = useState(
    'Halo Teman Si-Cehat! Ayo kita pilih makanan bergizi seimbang untuk piring sehatmu hari ini.'
  );
  const [nimboMood, setNimboMood] = useState<NimboMood>('happy');

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<GameResultDto | null>(null);

  // Initialize bridge or direct API session on mount
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'START_GAME') {
        const sid = e.data.sessionId || null;
        setSessionId(sid);
      }
    };
    window.addEventListener('message', handleMessage);

    sendBridgeMessage({ type: 'GAME_READY', protocolVersion: 1 });

    const params = new URLSearchParams(window.location.search);
    const token = params.get('bootstrap') || params.get('token');
    const directSessionId = params.get('sessionId');

    if (token) {
      gameApi.exchangeBootstrapToken(token)
        .then((res) => {
          setSessionId(res.session.id);
        })
        .catch((err) => {
          console.warn('[PlayLab] Bootstrap exchange failed, falling back to direct:', err);
          if (directSessionId) {
            setSessionId(directSessionId);
          } else {
            fallbackSessionInit();
          }
        });
    } else if (directSessionId) {
      setSessionId(directSessionId);
    } else {
      fallbackSessionInit();
    }

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const fallbackSessionInit = () => {
    const params = new URLSearchParams(window.location.search);
    const childId = params.get('childId') || undefined;
    gameApi.createDirectSession(content.gameSlug, childId)
      .then((res) => {
        if (res?.session?.id) {
          setSessionId(res.session.id);
        }
      })
      .catch((err) => console.warn('[PlayLab] Direct session init error:', err));
  };

  const currentRound = content.rounds[currentRoundIndex] || content.rounds[0];

  const roundFoods = content.foods.filter((f) =>
    currentRound.availableFoodIds.includes(f.id)
  );

  const handleSelectFood = (food: FoodItem) => {
    if (food.category === 'distractor') {
      setNimboMood('thinking');
      setNimboSpeech(`${food.name}? ${food.tip} Ganti dengan buah segar ya!`);
      return;
    }

    setPlate((prev) => ({
      ...prev,
      [food.category]: food,
    }));

    setNimboMood('excited');
    setNimboSpeech(`Pilihan cerdas! ${food.name}: ${food.tip}`);

    if (sessionId) {
      gameApi.sendEvent(sessionId, {
        eventType: 'ITEM_PLACED',
        sequence: Date.now(),
        payload: { itemId: food.id, category: food.category },
      });
    }
  };

  const handleRemoveFood = (category: 'karbo' | 'protein' | 'sayur' | 'buah') => {
    setPlate((prev) => ({
      ...prev,
      [category]: null,
    }));
    setNimboMood('happy');
    setNimboSpeech(`Bagian ${category} dikosongkan. Pilih makanan lainnya ya.`);
  };

  const handleStartGame = () => {
    setPhase('ROUND');
    setNimboSpeech(currentRound.prompt);
    setNimboMood('happy');
  };

  const handleNextRound = () => {
    if (currentRoundIndex + 1 < content.rounds.length) {
      const nextIndex = currentRoundIndex + 1;
      setCurrentRoundIndex(nextIndex);
      setNimboSpeech(content.rounds[nextIndex].prompt);
      setNimboMood('happy');
    } else {
      setPhase('QUIZ');
      setNimboSpeech('Piring sehatmu sudah lengkap! Sekarang, jawab 2 pertanyaan kuis kilat ini ya.');
      setNimboMood('thinking');
    }
  };

  const handleSubmitQuiz = async (answers: { questionId: string; selectedAnswer: string }[]) => {
    setIsSubmitting(true);

    const plateItems: string[] = [];
    if (plate.karbo) plateItems.push(plate.karbo.id);
    if (plate.protein) plateItems.push(plate.protein.id);
    if (plate.sayur) plateItems.push(plate.sayur.id);
    if (plate.buah) plateItems.push(plate.buah.id);

    try {
      if (sessionId) {
        const canonicalResult = await gameApi.completeSession(sessionId, {
          plateItems,
          answers,
        });
        setResult(canonicalResult);
        sendBridgeMessage({
          type: 'GAME_COMPLETED',
          sessionId,
          scores: {
            gameplayScore: canonicalResult.gameplayScore,
            knowledgeScore: canonicalResult.knowledgeScore,
            totalScore: canonicalResult.totalScore,
            starsEarned: canonicalResult.starsEarned,
            xpAwarded: canonicalResult.xpAwarded,
          },
        });
      } else {
        const preview = calculateGameplayScore(plate);
        const simResult: GameResultDto = {
          sessionId: 'local-simulation',
          gameplayScore: preview.gameplayScore,
          knowledgeScore: 100,
          totalScore: preview.totalScore,
          starsEarned: preview.starsEarned,
          xpAwarded: 75,
          feedbackSummary: 'Luar biasa! Piring sehatmu memenuhi pedoman gizi seimbang Isi Piringku.',
          rulesVersion: content.rulesVersion,
        };
        setResult(simResult);
        sendBridgeMessage({
          type: 'GAME_COMPLETED',
          sessionId: 'local-simulation',
          scores: simResult,
        });
      }
    } catch (e) {
      console.error('[PlayLab] Completion error:', e);
      const preview = calculateGameplayScore(plate);
      setResult({
        sessionId: sessionId || 'offline',
        gameplayScore: preview.gameplayScore,
        knowledgeScore: 100,
        totalScore: preview.totalScore,
        starsEarned: preview.starsEarned,
        xpAwarded: 50,
        feedbackSummary: 'Hebat! Kamu berhasil menyusun piring sehat.',
        rulesVersion: content.rulesVersion,
      });
    } finally {
      setIsSubmitting(false);
      setPhase('RESULT');
    }
  };

  const getCurrentScores = () => {
    if (result) {
      return {
        gameplayScore: result.gameplayScore,
        knowledgeScore: result.knowledgeScore,
        totalScore: result.totalScore,
        starsEarned: result.starsEarned,
        xpAwarded: result.xpAwarded,
      };
    }
    const preview = calculateGameplayScore(plate);
    return {
      gameplayScore: preview.gameplayScore,
      knowledgeScore: 0,
      totalScore: preview.totalScore,
      starsEarned: preview.starsEarned,
      xpAwarded: 0,
    };
  };

  const handleExit = async () => {
    const scores = getCurrentScores();
    const sid = sessionId || 'session';

    // If session is active and not finalized on server yet, complete it now so the server has the verified score
    if (sessionId && !result) {
      try {
        const plateItems: string[] = [];
        if (plate.karbo) plateItems.push(plate.karbo.id);
        if (plate.protein) plateItems.push(plate.protein.id);
        if (plate.sayur) plateItems.push(plate.sayur.id);
        if (plate.buah) plateItems.push(plate.buah.id);
        await gameApi.completeSession(sessionId, { plateItems, answers: [] });
      } catch (err) {
        console.warn('[PlayLab] Early exit server completion warning:', err);
      }
    }

    // 1. Dispatch EXIT_GAME with full score details to Flutter
    sendBridgeMessage({
      type: 'EXIT_GAME',
      sessionId: sid,
      scores,
      totalScore: scores.totalScore,
      gameplayScore: scores.gameplayScore,
      knowledgeScore: scores.knowledgeScore,
      starsEarned: scores.starsEarned,
      xpAwarded: scores.xpAwarded,
    });

    // 2. Also send GAME_COMPLETED if finished, for any Flutter handlers listening for completion
    if (result) {
      sendBridgeMessage({
        type: 'GAME_COMPLETED',
        sessionId: sid,
        scores,
        totalScore: scores.totalScore,
        gameplayScore: scores.gameplayScore,
        knowledgeScore: scores.knowledgeScore,
        starsEarned: scores.starsEarned,
        xpAwarded: scores.xpAwarded,
      });
    }

    // 3. Format URL parameters for Flutter navigationDelegate / deep-link handlers
    const queryParams = new URLSearchParams({
      action: 'exit',
      type: 'EXIT_GAME',
      sessionId: sid,
      totalScore: String(scores.totalScore),
      gameplayScore: String(scores.gameplayScore),
      knowledgeScore: String(scores.knowledgeScore),
      starsEarned: String(scores.starsEarned),
      xpAwarded: String(scores.xpAwarded),
    }).toString();

    // 4. Try window.close() (standard WebView window close trigger)
    try {
      window.close();
    } catch (_) {}

    // 5. Try custom scheme navigation in hidden iframe (for Flutter deep-link handlers)
    try {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = `sicehat://exit?${queryParams}`;
      document.body.appendChild(iframe);
      setTimeout(() => {
        try {
          document.body.removeChild(iframe);
        } catch (_) {}
      }, 500);
    } catch (_) {}

    // 6. Navigation fallback: navigate to /exit with score parameters
    setTimeout(() => {
      window.location.href = `/exit?${queryParams}`;
    }, 120);
  };

  const handlePlayAgain = () => {
    setPlate({ karbo: null, protein: null, sayur: null, buah: null });
    setCurrentRoundIndex(0);
    setPhase('ROUND');
    setNimboSpeech(content.rounds[0].prompt);
    setNimboMood('happy');
  };

  const isCurrentRoundSatisfied = () => {
    return currentRound.targetSlots.every((slot) => plate[slot] !== null);
  };

  return (
    <div className="min-h-screen bg-[#fff9e9] text-[#173d31] flex flex-col justify-between p-3 sm:p-5 select-none">
      <TopBar
        currentRound={currentRoundIndex + 1}
        totalRounds={content.rounds.length}
        xpBonus={75}
        onExit={handleExit}
      />

      <main className="my-auto mx-auto w-full max-w-md py-1">
        <NimboCoach speech={nimboSpeech} mood={nimboMood} />

        {/* PHASE 0: INTRO SCREEN */}
        {phase === 'INTRO' && (
          <div className="rounded-2xl border-4 border-[#173d31] bg-white p-5 text-center shadow-[4px_6px_0_#173d31]">
            <PlateGraphic className="w-16 h-16 mx-auto mb-2" />
            <h1 className="text-xl font-black text-[#173d31]">
              Piring Sehat Nimbo
            </h1>
            <p className="mt-1.5 text-xs font-bold text-[#285648] leading-relaxed">
              Bantu Nimbo menyusun makanan seimbang: <br />
              <span className="text-[#92400e]">Karbohidrat</span>,{' '}
              <span className="text-[#166534]">Sayuran</span>,{' '}
              <span className="text-[#1e40af]">Lauk Protein</span>, dan{' '}
              <span className="text-[#9a3412]">Buah Segar</span>!
            </p>

            <button
              onClick={handleStartGame}
              className="game-btn mt-5 w-full rounded-xl bg-[#247a4d] py-3 text-xs font-black text-white active:translate-y-0.5 cursor-pointer"
            >
              Mulai Susun Piring
            </button>
          </div>
        )}

        {/* PHASE 1: ROUNDS */}
        {phase === 'ROUND' && (
          <div>
            <PlateArea
              plate={plate}
              highlightCategory={currentRound.targetSlots[0]}
              onPlaceFood={handleSelectFood}
              onRemoveFood={handleRemoveFood}
            />

            {isCurrentRoundSatisfied() ? (
              <button
                onClick={handleNextRound}
                className="game-btn mt-3 w-full rounded-xl bg-[#247a4d] py-2.5 text-xs font-black text-white cursor-pointer active:translate-y-0.5"
              >
                {currentRoundIndex + 1 < content.rounds.length
                  ? 'Bagus Sekali! Lanjut Babak Berikutnya'
                  : 'Piring Lengkap! Lanjut ke Kuis Kilat'}
              </button>
            ) : (
              <p className="mt-2 text-center text-[10px] font-bold text-[#285648]/80">
                Pilih atau tarik makanan di bawah ke piring Nimbo
              </p>
            )}

            <FoodCardGrid foods={roundFoods} onSelectFood={handleSelectFood} />
          </div>
        )}

        {/* PHASE 2: DECOUPLED KNOWLEDGE CHECK */}
        {phase === 'QUIZ' && (
          <KnowledgeQuiz
            questions={content.knowledgeAssessment.questions}
            isSubmitting={isSubmitting}
            onSubmitAnswers={handleSubmitQuiz}
          />
        )}

        {/* PHASE 3: CANONICAL RESULT CELEBRATION */}
        {phase === 'RESULT' && result && (
          <ResultCard
            result={result}
            onExit={handleExit}
            onPlayAgain={handlePlayAgain}
          />
        )}
      </main>

      <footer className="text-center text-[10px] text-[#285648]/60 font-semibold pt-2">
        Si-Cehat PlayLab v{content.version} • Panduan Isi Piringku Kemenkes RI
      </footer>
    </div>
  );
};
