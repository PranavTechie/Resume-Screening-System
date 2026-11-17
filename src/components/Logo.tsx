import React, { useId } from 'react';

/**
 * Resume Screening System logo.
 * Inline SVG mark (sharp at any size) + HTML wordmark that follows the
 * light/dark theme through Tailwind classes — no font or <img> dependency.
 */
interface LogoMarkProps {
  className?: string;
}

export const LogoMark: React.FC<LogoMarkProps> = ({ className = 'w-9 h-9' }) => {
  // unique gradient id per instance (navbar + footer can render together)
  const gradId = `rs-grad-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6366F1" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${gradId})`} />
      <path d="M20 12H35L46 23V48a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4V16a4 4 0 0 1 4-4Z" fill="#fff" />
      <path d="M35 12V19a4 4 0 0 0 4 4H46" fill="#E0E7FF" />
      <rect x="22" y="29" width="16" height="3" rx="1.5" fill="#6366F1" opacity=".55" />
      <rect x="22" y="36" width="11" height="3" rx="1.5" fill="#6366F1" opacity=".35" />
      <circle cx="44" cy="46" r="11" fill="#10B981" stroke="#7C5CF2" strokeWidth="3" />
      <path d="M39 46l3.5 3.5L49 42.5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

interface LogoProps {
  size?: 'sm' | 'md';
  /** hide the "SCREENING SYSTEM" line between md and lg widths (navbar gets tight there) */
  collapseOnTablet?: boolean;
  /** muted grey tagline instead of brand purple (used in the navbar) */
  mutedTagline?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', collapseOnTablet = false, mutedTagline = false, className = '' }) => (
  <span className={`inline-flex items-center gap-2.5 ${className}`}>
    <LogoMark className={size === 'sm' ? 'w-8 h-8 shrink-0' : 'w-9 h-9 shrink-0'} />
    <span className="flex flex-col leading-none">
      <span className={`font-bold tracking-tight text-neutral-900 dark:text-white ${size === 'sm' ? 'text-base' : 'text-lg'}`}>
        Resume
      </span>
      <span
        className={`mt-1 text-xs font-semibold uppercase tracking-[0.16em] ${
          mutedTagline ? 'text-neutral-500 dark:text-neutral-400' : 'text-purple-600 dark:text-purple-400'
        } ${
          collapseOnTablet ? 'md:max-lg:hidden' : ''
        }`}
      >
        Screening System
      </span>
    </span>
  </span>
);
