import type { TargetAndTransition, Transition } from 'motion/react';

/*
 * Shared style for the landing illustrations: monoline 1.5px, round caps/joins,
 * neutral strokes via currentColor + one purple accent. Colors come from Tailwind
 * classes so light/dark both work.
 */
export const STROKE = {
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
};

/** neutral line color (currentColor on the <svg>) */
export const SVG_NEUTRAL = 'text-neutral-300 dark:text-neutral-700';
export const ACCENT_STROKE = 'stroke-purple-600 dark:stroke-purple-400';
export const ACCENT_FILL = 'fill-purple-600 dark:fill-purple-400';
export const SURFACE_FILL = 'fill-white dark:fill-neutral-900';
export const LABEL_FILL = 'fill-neutral-600 dark:fill-neutral-300';

/**
 * Props for a one-shot enter animation: plays start -> end once `play` is true;
 * with reduced motion it renders the end state immediately.
 */
export function once(
  play: boolean,
  reduce: boolean,
  start: TargetAndTransition,
  end: TargetAndTransition,
  transition: Transition,
) {
  return {
    initial: reduce ? end : start,
    animate: play || reduce ? end : start,
    transition: reduce ? { duration: 0 } : transition,
  };
}
