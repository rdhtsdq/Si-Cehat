import React from 'react';
import { motion } from 'framer-motion';

export type NimboMood = 'happy' | 'excited' | 'thinking' | 'celebrate';

interface NimboAvatarProps {
  mood?: NimboMood;
  size?: number;
  className?: string;
}

export const NimboAvatar: React.FC<NimboAvatarProps> = ({
  mood = 'happy',
  size = 40,
  className = '',
}) => {
  const isThinking = mood === 'thinking';
  const isCelebrate = mood === 'celebrate' || mood === 'excited';

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={`overflow-visible select-none ${className}`}
      role="img"
      aria-label={`Maskot Nimbo sedang ${mood}`}
      animate={
        isCelebrate
          ? { y: [0, -4, 0], rotate: [0, -3, 3, 0] }
          : isThinking
          ? { rotate: [0, -4, 0] }
          : { y: [0, -2, 0] }
      }
      transition={{ duration: isCelebrate ? 0.8 : 2.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Thinking Bubbles */}
      {isThinking && (
        <g fill="#93c5fd" opacity="0.9">
          <circle cx="86" cy="22" r="4" />
          <circle cx="96" cy="14" r="6" />
          <circle cx="110" cy="6" r="8" />
        </g>
      )}

      {/* Celebration Sparks */}
      {isCelebrate && (
        <g stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" opacity="0.9">
          <line x1="16" y1="20" x2="10" y2="12" />
          <line x1="26" y1="12" x2="26" y2="4" />
          <line x1="104" y1="20" x2="110" y2="12" />
          <line x1="94" y1="12" x2="94" y2="4" />
        </g>
      )}

      {/* Shadow */}
      <ellipse cx="60" cy="110" rx="36" ry="6" fill="#173d31" opacity="0.15" />

      {/* Waving / Celebrating Arms */}
      <g stroke="#2d6f59" strokeWidth="6" strokeLinecap="round">
        {isCelebrate ? (
          <>
            <path d="M38 74 Q 22 56 18 42" fill="none" />
            <circle cx="18" cy="42" r="5" fill="#ffd6ad" />
            <path d="M82 74 Q 98 56 102 42" fill="none" />
            <circle cx="102" cy="42" r="5" fill="#ffd6ad" />
          </>
        ) : (
          <>
            <path d="M38 76 Q 24 82 18 72" fill="none" />
            <circle cx="18" cy="72" r="4.5" fill="#ffd6ad" />
            <path d="M82 76 Q 96 82 102 72" fill="none" />
            <circle cx="102" cy="72" r="4.5" fill="#ffd6ad" />
          </>
        )}
      </g>

      {/* Feet */}
      <path d="M48 98 q-2 10 -8 12" fill="none" stroke="#2d6f59" strokeWidth="6" strokeLinecap="round" />
      <path d="M72 98 q2 10 8 12" fill="none" stroke="#2d6f59" strokeWidth="6" strokeLinecap="round" />

      {/* Main Body Orb (Nimbo Emerald Green) */}
      <circle cx="60" cy="66" r="38" fill="#3b9d75" stroke="#fff7df" strokeWidth="4" />

      {/* Cheerful Eyes */}
      {isCelebrate ? (
        <g stroke="#173d31" strokeWidth="3.5" strokeLinecap="round" fill="none">
          <path d="M42 62 q 7 -8 14 0" />
          <path d="M64 62 q 7 -8 14 0" />
        </g>
      ) : isThinking ? (
        <g fill="#173d31">
          <circle cx="50" cy="59" r="4" />
          <circle cx="72" cy="56" r="4" />
          <path d="M68 49 q 5 -5 10 -1" stroke="#173d31" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </g>
      ) : (
        <g fill="#173d31">
          <circle cx="49" cy="61" r="4.5" />
          <circle cx="71" cy="61" r="4.5" />
          <circle cx="47.5" cy="59.5" r="1.5" fill="#ffffff" />
          <circle cx="69.5" cy="59.5" r="1.5" fill="#ffffff" />
        </g>
      )}

      {/* Rosy Cheeks */}
      <ellipse cx="38" cy="71" rx="6" ry="3.5" fill="#f87171" opacity="0.75" />
      <ellipse cx="82" cy="71" rx="6" ry="3.5" fill="#f87171" opacity="0.75" />

      {/* Friendly Mouth */}
      {isCelebrate ? (
        <path d="M50 73 q 10 12 20 0" fill="#fee2e2" stroke="#173d31" strokeWidth="3" strokeLinecap="round" />
      ) : isThinking ? (
        <ellipse cx="60" cy="76" rx="3.5" ry="4" fill="#173d31" />
      ) : (
        <path d="M52 74 q 8 8 16 0" fill="none" stroke="#173d31" strokeWidth="3" strokeLinecap="round" />
      )}
    </motion.svg>
  );
};
