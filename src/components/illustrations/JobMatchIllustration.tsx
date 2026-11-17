import React from 'react';
import { motion } from 'motion/react';
import { CountUp, useRevealOnce } from '../motion/primitives';
import { ACCENT_STROKE, LABEL_FILL, STROKE, SURFACE_FILL, SVG_NEUTRAL, once } from './shared';

const MATCH = 87;
const RING = { cx: 140, cy: 74, r: 24 };

/** (c) Career match: a candidate card matched to a job card through a percentage ring. */
export const JobMatchIllustration: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { ref, play, reduce } = useRevealOnce<SVGSVGElement>();

  return (
    <svg ref={ref} viewBox="0 0 280 150" className={`${SVG_NEUTRAL} ${className}`} aria-hidden="true" focusable="false">
      {/* candidate */}
      <rect x="16" y="38" width="82" height="72" rx="10" className={SURFACE_FILL} stroke="currentColor" strokeWidth={1.5} />
      <circle cx="36" cy="58" r="9" stroke="currentColor" {...STROKE} />
      <circle cx="36" cy="55.5" r="3" stroke="currentColor" {...STROKE} />
      <path d="M30.5 63.8 a5.5 4.6 0 0 1 11 0" stroke="currentColor" {...STROKE} />
      <line x1="52" y1="54" x2="86" y2="54" stroke="currentColor" {...STROKE} />
      <line x1="52" y1="62" x2="76" y2="62" stroke="currentColor" {...STROKE} />
      <line x1="28" y1="82" x2="86" y2="82" stroke="currentColor" {...STROKE} />
      <line x1="28" y1="92" x2="72" y2="92" stroke="currentColor" {...STROKE} />

      {/* job */}
      <rect x="182" y="38" width="82" height="72" rx="10" className={SURFACE_FILL} stroke="currentColor" strokeWidth={1.5} />
      <rect x="194" y="52" width="20" height="14" rx="3" stroke="currentColor" {...STROKE} />
      <path d="M200 52 v-2.5 a1.5 1.5 0 0 1 1.5 -1.5 h5 a1.5 1.5 0 0 1 1.5 1.5 v2.5" stroke="currentColor" {...STROKE} />
      <line x1="194" y1="58.5" x2="214" y2="58.5" stroke="currentColor" {...STROKE} />
      <line x1="222" y1="54" x2="252" y2="54" stroke="currentColor" {...STROKE} />
      <line x1="222" y1="62" x2="242" y2="62" stroke="currentColor" {...STROKE} />
      <line x1="194" y1="82" x2="252" y2="82" stroke="currentColor" {...STROKE} />
      <line x1="194" y1="92" x2="236" y2="92" stroke="currentColor" {...STROKE} />

      {/* links */}
      <motion.g {...once(play, reduce, { opacity: 0 }, { opacity: 1 }, { duration: 0.3, delay: 0.15 })}>
        <line x1="100" y1={RING.cy} x2="112" y2={RING.cy} className={ACCENT_STROKE} strokeWidth={1.5} strokeLinecap="round" strokeDasharray="2 4" />
        <line x1="168" y1={RING.cy} x2="180" y2={RING.cy} className={ACCENT_STROKE} strokeWidth={1.5} strokeLinecap="round" strokeDasharray="2 4" />
      </motion.g>

      {/* match ring: fills once */}
      <circle cx={RING.cx} cy={RING.cy} r={RING.r} className={SURFACE_FILL} stroke="currentColor" strokeWidth={1.5} />
      <g transform={`rotate(-90 ${RING.cx} ${RING.cy})`}>
        <motion.circle
          cx={RING.cx} cy={RING.cy} r={RING.r}
          className={ACCENT_STROKE}
          {...STROKE}
          strokeWidth={2}
          {...once(play, reduce, { pathLength: 0 }, { pathLength: MATCH / 100 }, { duration: 1.1, delay: 0.3, ease: [0.22, 1, 0.36, 1] })}
        />
      </g>
      <text x={RING.cx} y={RING.cy} textAnchor="middle" dominantBaseline="central" fontSize="13" fontWeight="700" className="fill-neutral-900 dark:fill-white">
        <CountUp svg value={MATCH} suffix="%" play={play} delay={0.3} />
      </text>
      <text x={RING.cx} y="116" textAnchor="middle" fontSize="11" fontWeight="600" className={LABEL_FILL}>
        match
      </text>
    </svg>
  );
};
