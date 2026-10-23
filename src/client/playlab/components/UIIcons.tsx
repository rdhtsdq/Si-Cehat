import React from 'react';

export const StarIcon: React.FC<{ filled?: boolean; className?: string }> = ({
  filled = true,
  className = 'w-6 h-6',
}) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      fill={filled ? '#f59e0b' : '#e2e8f0'}
      stroke={filled ? '#d97706' : '#94a3b8'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const StarRating: React.FC<{ count: number; className?: string }> = ({ count, className = '' }) => (
  <div className={`flex items-center justify-center gap-1.5 ${className}`}>
    {[1, 2, 3].map((starIndex) => (
      <StarIcon key={starIndex} filled={starIndex <= count} className="w-8 h-8 drop-shadow-sm" />
    ))}
  </div>
);

export const CloseIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const CheckIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const RefreshIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

export const SparkleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4 text-[#f59e0b]' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2l2.4 7.2L21.6 12l-7.2 2.4L12 21.6l-2.4-7.2L2.4 12l7.2-2.4L12 2z" />
  </svg>
);

export const PlateGraphic: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="30" fill="#ffffff" stroke="#173d31" strokeWidth="3.5" />
    <circle cx="32" cy="32" r="23" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
    {/* Dividing quadrants */}
    <path d="M32 9v46M9 32h46" stroke="#173d31" strokeWidth="2.5" strokeDasharray="3 3" />
    {/* Quarter accents */}
    <path d="M32 9 A23 23 0 0 0 9 32 L32 32 Z" fill="#fef3c7" opacity="0.6" />
    <path d="M32 9 A23 23 0 0 1 55 32 L32 32 Z" fill="#dcfce7" opacity="0.6" />
    <path d="M9 32 A23 23 0 0 0 32 55 L32 32 Z" fill="#dbeafe" opacity="0.6" />
    <path d="M55 32 A23 23 0 0 1 32 55 L32 32 Z" fill="#ffedd5" opacity="0.6" />
    <circle cx="32" cy="32" r="6" fill="#173d31" />
    <circle cx="32" cy="32" r="4" fill="#ffffff" />
  </svg>
);

export const SpeakerIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" fillOpacity="0.2" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);

export const SpeakerMutedIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" fillOpacity="0.2" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
);

