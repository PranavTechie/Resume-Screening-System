import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CountUp, useRevealOnce } from '../motion/primitives';
import { STROKE } from './shared';

interface Candidate {
  id: string;
  name: string;
  role: string;
  score: number;
}

// shown in upload order first, then re-sorted by match score once
const CANDIDATES: Candidate[] = [
  { id: 'dk', name: 'Daniel K.', role: 'Frontend Engineer', score: 72 },
  { id: 'ps', name: 'Priya S.', role: 'Senior Frontend Engineer', score: 91 },
  { id: 'oh', name: 'Omar H.', role: 'Full-stack Developer', score: 64 },
  { id: 'mr', name: 'Maya R.', role: 'React Developer', score: 84 },
];
const RANKED = [...CANDIDATES].sort((a, b) => b.score - a.score);
const REORDER_AFTER_MS = 1350;

const Avatar: React.FC<{ accent: boolean }> = ({ accent }) => (
  <svg
    viewBox="0 0 28 28"
    className={`w-7 h-7 shrink-0 transition-colors duration-300 ${accent ? 'text-purple-600 dark:text-purple-400' : 'text-neutral-400 dark:text-neutral-600'}`}
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="14" cy="14" r="12.5" stroke="currentColor" {...STROKE} />
    <circle cx="14" cy="11.5" r="4" stroke="currentColor" {...STROKE} />
    <path d="M7.5 22 a6.5 5.5 0 0 1 13 0" stroke="currentColor" {...STROKE} />
  </svg>
);

/*
 * Bars here fill with a CSS transform transition instead of a motion animation: rows are
 * re-inserted in the DOM when they reorder, which resets motion-driven transforms inside a
 * layout-animated parent. A transition on the style attribute survives the move.
 */
const RowBar: React.FC<{ value: number; play: boolean; delay: number; accent: boolean }> = ({ value, play, delay, accent }) => (
  <div className="h-1 w-full rounded-full overflow-hidden bg-neutral-200/80 dark:bg-neutral-800">
    <div
      className={`h-full w-full rounded-full origin-left transition-transform duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
        accent ? 'bg-purple-600 dark:bg-purple-400' : 'bg-neutral-400 dark:bg-neutral-500'
      }`}
      style={{ transform: `scaleX(${play ? value / 100 : 0})`, transitionDelay: `${delay}s` }}
    />
  </div>
);

/** (d) Candidate ranking: rows score, then reorder by match once. */
export const RankingIllustration: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { ref, play, reduce } = useRevealOnce<HTMLDivElement>();
  const [sorted, setSorted] = useState(reduce);

  useEffect(() => {
    if (reduce) {
      setSorted(true);
      return;
    }
    if (!play) return;
    const t = window.setTimeout(() => setSorted(true), REORDER_AFTER_MS);
    return () => window.clearTimeout(t);
  }, [play, reduce]);

  const rows = sorted ? RANKED : CANDIDATES;

  return (
    <div ref={ref} className={className} aria-hidden="true">
      <div className="flex items-center justify-between pb-3 mb-1 border-b border-neutral-100 dark:border-neutral-800">
        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          Senior Frontend Engineer
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          Match
        </span>
      </div>
      <ul className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
        {rows.map((c, i) => {
          const top = sorted && i === 0;
          return (
            <motion.li
              key={c.id}
              layout={!reduce}
              transition={{ layout: { type: 'spring', stiffness: 380, damping: 36 } }}
              className="flex items-center gap-3 py-2.5"
            >
              <span
                className={`w-6 h-6 shrink-0 rounded-md text-[11px] font-bold tabular-nums flex items-center justify-center transition-colors duration-300 ${
                  top
                    ? 'bg-purple-600 text-white dark:bg-purple-500'
                    : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
                }`}
              >
                {i + 1}
              </span>
              <Avatar accent={top} />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-neutral-900 dark:text-white truncate">{c.name}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{c.role}</div>
              </div>
              <div className="w-16 sm:w-28 shrink-0">
                <RowBar
                  value={c.score}
                  play={play}
                  delay={reduce ? 0 : CANDIDATES.findIndex((x) => x.id === c.id) * 0.08}
                  accent={c.score >= 80}
                />
              </div>
              <span className="w-10 shrink-0 text-right text-xs font-bold text-neutral-900 dark:text-white">
                <CountUp value={c.score} suffix="%" play={play} duration={0.9} />
              </span>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
};
