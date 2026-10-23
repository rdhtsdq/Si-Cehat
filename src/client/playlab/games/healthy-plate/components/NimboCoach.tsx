import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { NimboAvatar, NimboMood } from '../../../components/NimboAvatar';
import { SpeakerIcon, SpeakerMutedIcon } from '../../../components/UIIcons';
import {
  speakNimbo,
  stopNimboVoice,
  isNimboVoiceMuted,
  toggleNimboVoiceMute,
} from '../../../utils/speech';

export type { NimboMood };

interface NimboCoachProps {
  speech: string;
  mood: NimboMood;
  audioKey?: string;
  autoSpeak?: boolean;
}

export const NimboCoach: React.FC<NimboCoachProps> = ({
  speech,
  mood,
  audioKey,
  autoSpeak = true,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    setIsMuted(isNimboVoiceMuted());
  }, []);

  // Speak speech lines when they update (if autoSpeak is on)
  useEffect(() => {
    if (autoSpeak && !isMuted) {
      speakNimbo(speech, {
        audioKey,
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
      });
    }
    return () => {
      stopNimboVoice();
      setIsSpeaking(false);
    };
  }, [speech, audioKey, autoSpeak, isMuted]);

  const handleToggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const muted = toggleNimboVoiceMute();
    setIsMuted(muted);
    if (!muted) {
      speakNimbo(speech, {
        audioKey,
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
      });
    }
  };

  const handlePlayVoice = () => {
    if (isMuted) {
      const muted = toggleNimboVoiceMute();
      setIsMuted(muted);
    }
    speakNimbo(speech, {
      audioKey,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onClick={handlePlayVoice}
      className="w-full max-w-md mx-auto mb-2 flex items-center justify-between gap-2.5 rounded-2xl border-2 border-[#173d31] bg-white p-2.5 shadow-[2px_3px_0_#173d31] cursor-pointer active:scale-[0.99] transition select-none"
      title="Ketuk untuk mendengarkan suara Nimbo"
    >
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <div className="relative shrink-0">
          <NimboAvatar mood={isSpeaking ? 'excited' : mood} size={42} />
          {isSpeaking && (
            <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16a34a] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#15803d]"></span>
            </span>
          )}
        </div>
        <p className="text-xs font-bold leading-tight text-[#173d31] line-clamp-3">
          {speech}
        </p>
      </div>

      <button
        type="button"
        onClick={handleToggleSound}
        className={`shrink-0 rounded-xl p-1.5 transition active:scale-90 ${
          isMuted
            ? 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            : isSpeaking
            ? 'bg-[#dcfce7] text-[#15803d] animate-pulse ring-2 ring-[#15803d]/40'
            : 'bg-[#fff9e9] text-[#173d31] hover:bg-[#fde68a]'
        }`}
        aria-label={isMuted ? 'Nyalakan suara Nimbo' : 'Bisukan suara Nimbo'}
        title={isMuted ? 'Suara mati (ketuk untuk aktifkan)' : 'Suara aktif (ketuk untuk matikan)'}
      >
        {isMuted ? (
          <SpeakerMutedIcon className="w-4 h-4" />
        ) : (
          <SpeakerIcon className="w-4 h-4" />
        )}
      </button>
    </motion.div>
  );
};

