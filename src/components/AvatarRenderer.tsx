"use client";

import { motion, useReducedMotion } from "motion/react";
import type { AvatarAccessory, AvatarCharacter, AvatarState } from "@/lib/avatar";

type AvatarRendererProps = {
  character: AvatarCharacter;
  accessory: AvatarAccessory;
  orbColor: string;
  state?: AvatarState;
  className?: string;
};

const characterStyle: Record<AvatarCharacter, { label: string; color: string; shadow: string }> = {
  default: { label: "Bulat Bimbi", color: "", shadow: "#2d6f59" },
  apple: { label: "Apo si Apel", color: "#ef5b4f", shadow: "#a72f35" },
  broccoli: { label: "Brok si Brokoli", color: "#63b85d", shadow: "#327342" },
  carrot: { label: "Roro si Wortel", color: "#f4913d", shadow: "#bd552b" },
};

const stateLabel: Record<AvatarState, string> = {
  idle: "bersantai",
  listening: "mendengarkan",
  thinking: "berpikir",
  talking: "berbicara",
  happy: "senang",
  celebrating: "merayakan",
  confused: "kebingungan",
};

export function AvatarRenderer({
  character,
  accessory,
  orbColor,
  state = "idle",
  className = "h-56 w-56",
}: AvatarRendererProps) {
  const reduceMotion = useReducedMotion();
  const style = characterStyle[character];
  const color = character === "default" ? orbColor : style.color;
  const isHappy = state === "happy" || state === "celebrating";
  const isConfused = state === "confused";
  const isTalking = state === "talking";
  const isCelebrating = state === "celebrating";

  return (
    <motion.svg
      animate={
        reduceMotion
          ? undefined
          : isCelebrating
            ? { y: [0, -18, 0], rotate: [0, -4, 4, 0] }
            : { y: [0, -7, 0], rotate: [0, -1.5, 1.5, 0] }
      }
      aria-label={`${style.label} sedang ${stateLabel[state]}`}
      className={`mx-auto overflow-visible drop-shadow-[0_14px_14px_rgba(45,81,59,0.18)] ${className}`}
      role="img"
      transition={{ duration: isCelebrating ? 0.8 : 3, repeat: reduceMotion ? 0 : Infinity, ease: "easeInOut" }}
      viewBox="0 0 260 260"
    >
      <title>{`${style.label} sedang ${stateLabel[state]}`}</title>

      {state === "thinking" ? (
        <motion.g
          animate={reduceMotion ? undefined : { opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          <circle cx="193" cy="42" fill="#fff" r="7" />
          <circle cx="212" cy="27" fill="#fff" r="10" />
          <circle cx="237" cy="10" fill="#fff" r="14" />
        </motion.g>
      ) : null}

      {isCelebrating ? (
        <g aria-hidden="true" fill="none" strokeLinecap="round" strokeWidth="5">
          <path d="M27 61l-9-11M44 51l1-15M220 62l10-10M207 48l-1-14" stroke="#f4b942" />
          <path d="M22 83l-14-2M234 81l14-3" stroke="#ef5b4f" />
        </g>
      ) : null}

      <ellipse cx="130" cy="237" fill="#244b3d" opacity="0.14" rx="76" ry="12" />

      <motion.g
        animate={reduceMotion ? undefined : { rotate: isCelebrating ? -25 : [0, -4, 0] }}
        style={{ originX: "77px", originY: "158px" }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <path d={isCelebrating ? "M83 164Q57 132 43 102" : "M82 165Q58 176 45 158"} fill="none" stroke={style.shadow} strokeLinecap="round" strokeWidth="13" />
        <circle cx={isCelebrating ? 42 : 44} cy={isCelebrating ? 99 : 158} fill="#ffd6ad" r="10" />
      </motion.g>
      <motion.g
        animate={reduceMotion ? undefined : { rotate: isCelebrating ? 25 : [0, 4, 0] }}
        style={{ originX: "183px", originY: "158px" }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <path d={isCelebrating ? "M177 164Q203 132 217 102" : "M178 165Q202 176 215 158"} fill="none" stroke={style.shadow} strokeLinecap="round" strokeWidth="13" />
        <circle cx={isCelebrating ? 218 : 216} cy={isCelebrating ? 99 : 158} fill="#ffd6ad" r="10" />
      </motion.g>

      <path d="M105 211q-3 22-18 27" fill="none" stroke={style.shadow} strokeLinecap="round" strokeWidth="14" />
      <path d="M155 211q3 22 18 27" fill="none" stroke={style.shadow} strokeLinecap="round" strokeWidth="14" />
      <path d="M72 239q15-12 30 0" fill="none" stroke="#274b3f" strokeLinecap="round" strokeWidth="10" />
      <path d="M158 239q15-12 30 0" fill="none" stroke="#274b3f" strokeLinecap="round" strokeWidth="10" />

      {character === "default" ? (
        <circle cx="130" cy="137" fill={color} r="79" stroke="#fff7df" strokeWidth="7" />
      ) : null}
      {character === "apple" ? (
        <>
          <path d="M130 77c-13-23-48-25-68-4-28 29-14 100 19 131 20 18 36 15 49 7 13 8 29 11 49-7 33-31 47-102 19-131-20-21-55-19-68 4z" fill={color} stroke="#fff7df" strokeWidth="7" />
          <path d="M131 69q-2-34 18-43" fill="none" stroke="#684631" strokeLinecap="round" strokeWidth="11" />
          <path d="M145 44q25-15 37 5-25 15-37-5z" fill="#5ca85c" />
        </>
      ) : null}
      {character === "broccoli" ? (
        <>
          <path d="M105 105h50l19 99q-20 25-44 8-24 17-44-8z" fill="#8bcf70" stroke="#fff7df" strokeWidth="7" />
          <g fill={color} stroke="#fff7df" strokeWidth="5">
            <circle cx="83" cy="90" r="40" />
            <circle cx="124" cy="70" r="47" />
            <circle cx="169" cy="89" r="42" />
            <circle cx="130" cy="110" r="48" />
          </g>
        </>
      ) : null}
      {character === "carrot" ? (
        <>
          <path d="M77 91q53-22 106 0-10 83-53 135Q87 174 77 91z" fill={color} stroke="#fff7df" strokeLinejoin="round" strokeWidth="7" />
          <path d="M130 89q-4-43-33-57 0 35 33 57z" fill="#5dab5b" />
          <path d="M130 89q4-48 37-61 0 39-37 61z" fill="#4c9650" />
          <path d="M130 89q-1-48 4-63 19 28-4 63z" fill="#76bf62" />
          <path d="M97 151l18-4M151 171l16-5" stroke="#d76531" strokeLinecap="round" strokeWidth="5" />
        </>
      ) : null}

      <g aria-hidden="true">
        {isHappy ? (
          <>
            <path d="M92 127q13-15 26 0" fill="none" stroke="#203b32" strokeLinecap="round" strokeWidth="7" />
            <path d="M142 127q13-15 26 0" fill="none" stroke="#203b32" strokeLinecap="round" strokeWidth="7" />
          </>
        ) : (
          <motion.g
            animate={reduceMotion ? undefined : { scaleY: [1, 1, 0.12, 1, 1] }}
            style={{ originX: "130px", originY: "124px" }}
            transition={{ duration: 4.5, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1] }}
          >
            <ellipse cx="104" cy="124" fill="#203b32" rx="8" ry={isConfused ? 10 : 12} />
            <ellipse cx="156" cy="124" fill="#203b32" rx="8" ry={isConfused ? 6 : 12} />
            <circle cx="101" cy="120" fill="white" r="2.5" />
            <circle cx="153" cy="120" fill="white" r="2.5" />
          </motion.g>
        )}
        <ellipse cx="83" cy="149" fill="#f7a19c" opacity="0.68" rx="13" ry="7" />
        <ellipse cx="177" cy="149" fill="#f7a19c" opacity="0.68" rx="13" ry="7" />
        {isTalking ? (
          <motion.ellipse
            animate={reduceMotion ? undefined : { ry: [6, 13, 6] }}
            cx="130"
            cy="158"
            fill="#203b32"
            rx="14"
            ry="10"
            transition={{ duration: 0.45, repeat: Infinity }}
          />
        ) : isConfused ? (
          <path d="M116 164q14-9 28 0" fill="none" stroke="#203b32" strokeLinecap="round" strokeWidth="6" />
        ) : (
          <path d="M112 157q18 24 36 0" fill="#fff7df" stroke="#203b32" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6" />
        )}
      </g>

      {accessory === "glasses" ? (
        <g fill="none" stroke="#25453a" strokeWidth="6">
          <circle cx="103" cy="126" r="23" />
          <circle cx="157" cy="126" r="23" />
          <path d="M126 123h8" />
        </g>
      ) : null}
      {accessory === "headphone" ? (
        <g fill="none" stroke="#315b6d" strokeWidth="10">
          <path d="M72 127q0-69 58-69t58 69" />
          <path d="M70 124v40M190 124v40" strokeLinecap="round" />
        </g>
      ) : null}
      {accessory === "hat" ? (
        <g>
          <path d="M76 78q9-56 54-56t54 56z" fill="#f4b942" stroke="#fff7df" strokeWidth="6" />
          <path d="M62 80q68-18 136 0" fill="none" stroke="#274b3f" strokeLinecap="round" strokeWidth="11" />
        </g>
      ) : null}
    </motion.svg>
  );
}
