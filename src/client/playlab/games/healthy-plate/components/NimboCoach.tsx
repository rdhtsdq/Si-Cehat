import React from 'react';
import { motion } from 'framer-motion';
import { NimboAvatar, NimboMood } from '../../../components/NimboAvatar';

export type { NimboMood };

interface NimboCoachProps {
  speech: string;
  mood: NimboMood;
}

export const NimboCoach: React.FC<NimboCoachProps> = ({ speech, mood }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full max-w-md mx-auto mb-2 flex items-center gap-3 rounded-2xl border-2 border-[#173d31] bg-white p-2.5 shadow-[2px_3px_0_#173d31]"
    >
      <div className="shrink-0">
        <NimboAvatar mood={mood} size={42} />
      </div>
      <p className="text-xs font-bold leading-tight text-[#173d31]">
        {speech}
      </p>
    </motion.div>
  );
};
