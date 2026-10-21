import React from 'react';

interface FoodIconProps {
  iconId: string;
  className?: string;
}

export const FoodIcon: React.FC<FoodIconProps> = ({ iconId, className = 'w-8 h-8' }) => {
  switch (iconId) {
    case 'nasi-merah':
    case 'nasi-putih':
    case 'karbo':
      // Steamed Rice Bowl
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="24" cy="18" rx="15" ry="8" fill="#fef3c7" stroke="#d97706" strokeWidth="2" />
          <path d="M9 20c0 9 7 17 15 17s15-8 15-17" fill="#d97706" stroke="#b45309" strokeWidth="2" />
          <path d="M16 17q4-3 8-1t8-2" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M20 13q4-3 8-1" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round" />
          {/* Steam curls */}
          <path d="M18 9c-1-3 1-5 0-7M24 8c-1-3 1-5 0-7M30 9c-1-3 1-5 0-7" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'kentang-rebus':
      // Boiled Potato
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="24" cy="26" rx="17" ry="13" fill="#fde68a" stroke="#d97706" strokeWidth="2.5" />
          <circle cx="18" cy="22" r="1.5" fill="#b45309" />
          <circle cx="28" cy="24" r="1.5" fill="#b45309" />
          <circle cx="22" cy="31" r="1.5" fill="#b45309" />
          <circle cx="32" cy="28" r="1" fill="#b45309" />
          <rect x="20" y="16" width="8" height="6" rx="2" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
        </svg>
      );

    case 'jagung-manis':
      // Sweet Corn
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="24" cy="24" rx="11" ry="17" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
          <path d="M17 18h14M15 24h18M17 30h14" stroke="#eab308" strokeWidth="2" strokeLinecap="round" />
          <path d="M21 11v26M27 11v26" stroke="#eab308" strokeWidth="2" strokeLinecap="round" />
          <path d="M13 38q-4-10 2-20c2 8 8 16 11 20" fill="#86efac" stroke="#16a34a" strokeWidth="2" />
          <path d="M35 38q4-10-2-20c-2 8-8 16-11 20" fill="#86efac" stroke="#16a34a" strokeWidth="2" />
        </svg>
      );

    case 'ikan-bakar':
    case 'protein':
      // Grilled Fish
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 24c8-10 24-10 32 0-8 10-24 10-32 0z" fill="#93c5fd" stroke="#1d4ed8" strokeWidth="2.5" />
          <path d="M38 24l8-8v16l-8-8z" fill="#60a5fa" stroke="#1d4ed8" strokeWidth="2" />
          <circle cx="14" cy="22" r="2.5" fill="#1e3a8a" />
          <circle cx="13" cy="21" r="0.8" fill="#ffffff" />
          <path d="M20 18l4 12M26 18l4 12" stroke="#b45309" strokeWidth="2" strokeLinecap="round" />
          <path d="M20 16q4-5 8-2" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'telur-rebus':
      // Boiled Egg Half
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="24" cy="24" rx="16" ry="20" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2.5" />
          <circle cx="24" cy="26" r="9" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" />
          <circle cx="21" cy="23" r="2.5" fill="#ffffff" opacity="0.7" />
        </svg>
      );

    case 'tempe-bacem':
      // Tempeh Slice
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="14" width="28" height="20" rx="4" fill="#d97706" stroke="#92400e" strokeWidth="2.5" />
          <circle cx="16" cy="20" r="2" fill="#fef3c7" stroke="#b45309" strokeWidth="1" />
          <circle cx="24" cy="21" r="2" fill="#fef3c7" stroke="#b45309" strokeWidth="1" />
          <circle cx="32" cy="20" r="2" fill="#fef3c7" stroke="#b45309" strokeWidth="1" />
          <circle cx="19" cy="27" r="2" fill="#fef3c7" stroke="#b45309" strokeWidth="1" />
          <circle cx="28" cy="27" r="2" fill="#fef3c7" stroke="#b45309" strokeWidth="1" />
        </svg>
      );

    case 'bayam-bening':
    case 'sayur':
      // Green Spinach Leaves
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 10c-8 0-14 8-12 18 2 10 12 14 12 14s10-4 12-14c2-10-4-18-12-18z" fill="#86efac" stroke="#16a34a" strokeWidth="2.5" />
          <path d="M24 12v28M24 20q-6-3-8 1M24 28q6-3 8 1M24 24q-6-2-7 2" stroke="#15803d" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'wortel-rebus':
      // Carrot
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 16l18 18c-3 5-7 6-12 2L8 22c-4-5-2-9 4-6" fill="#fb923c" stroke="#ea580c" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M15 17l-6-6M13 21l-7-3M19 15l-3-7" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M22 23l4 3M27 28l3 2" stroke="#c2410c" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'sayur-sop':
      // Vegetable Soup Bowl
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 22c0 9 7 16 16 16s16-7 16-16H8z" fill="#bbf7d0" stroke="#16a34a" strokeWidth="2.5" />
          <ellipse cx="24" cy="22" rx="16" ry="6" fill="#dcfce7" stroke="#16a34a" strokeWidth="2" />
          <circle cx="19" cy="22" r="2.5" fill="#fb923c" />
          <circle cx="27" cy="21" r="2.5" fill="#4ade80" />
          <circle cx="23" cy="23" r="1.8" fill="#fde047" />
          <path d="M32 18l6-8" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'pisang-barangan':
      // Banana
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 32c4-14 16-24 28-20-2 8-10 24-24 22-2-1-3-1-4-2z" fill="#fde047" stroke="#ca8a04" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M38 12l3-3" stroke="#65a30d" strokeWidth="3" strokeLinecap="round" />
          <path d="M10 32l-2 3" stroke="#854d0e" strokeWidth="3" strokeLinecap="round" />
          <path d="M15 28c8-3 16-9 20-15" stroke="#eab308" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'pepaya-manis':
      // Papaya Slice
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 16c6-4 22-2 26 12 3 10-10 16-20 10-7-4-10-16-6-22z" fill="#fb923c" stroke="#16a34a" strokeWidth="3" />
          <circle cx="23" cy="24" r="1.8" fill="#1e293b" />
          <circle cx="27" cy="23" r="1.8" fill="#1e293b" />
          <circle cx="22" cy="28" r="1.8" fill="#1e293b" />
          <circle cx="26" cy="27" r="1.8" fill="#1e293b" />
        </svg>
      );

    case 'apel-segar':
    case 'buah':
      // Fresh Red Apple
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 16c-3-5-10-5-14-1-6 6-3 21 4 27 4 4 8 3 10 1 2 2 6 3 10-1 7-6 10-21 4-27-4-4-11-4-14 1z" fill="#ef4444" stroke="#b91c1c" strokeWidth="2.5" />
          <path d="M24 15q-1-7 4-9" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M27 9q6-3 8 2-6 3-8-2z" fill="#22c55e" stroke="#15803d" strokeWidth="1.5" />
          <ellipse cx="19" cy="22" rx="2" ry="4" fill="#ffffff" opacity="0.5" />
        </svg>
      );

    case 'donat-cokelat':
      // Chocolate Donut
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="24" cy="24" rx="16" ry="16" fill="#78350f" stroke="#451a03" strokeWidth="2.5" />
          <ellipse cx="24" cy="24" rx="6" ry="6" fill="#fff9e9" stroke="#451a03" strokeWidth="2" />
          <line x1="18" y1="15" x2="20" y2="17" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
          <line x1="28" y1="16" x2="30" y2="15" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
          <line x1="15" y1="25" x2="17" y2="27" stroke="#facc15" strokeWidth="2" strokeLinecap="round" />
          <line x1="29" y1="26" x2="32" y2="25" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'minuman-soda':
      // Soda Cup
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 16h20l-3 24H17L14 16z" fill="#f87171" stroke="#dc2626" strokeWidth="2.5" />
          <rect x="13" y="13" width="22" height="4" rx="2" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
          <path d="M26 13l4-7h5" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="22" cy="24" r="1.5" fill="#ffffff" opacity="0.8" />
          <circle cx="26" cy="28" r="1.8" fill="#ffffff" opacity="0.8" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="18" fill="#e2e8f0" stroke="#64748b" strokeWidth="2.5" />
          <circle cx="24" cy="24" r="11" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
        </svg>
      );
  }
};
