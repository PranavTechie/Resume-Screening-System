import React from 'react';
import { motion } from 'motion/react';
import { useRevealOnce } from '../motion/primitives';
import { ACCENT_STROKE, STROKE, SURFACE_FILL, SVG_NEUTRAL, once } from './shared';

// scan line travels y 20 -> 130 once; things it "reads" light up as it passes
const SCAN_START = 0.3;
const SCAN_DURATION = 1.4;
const SCAN_FROM = 20;
const SCAN_TO = 130;
const at = (y: number) => SCAN_START + (SCAN_DURATION * (y - SCAN_FROM)) / (SCAN_TO - SCAN_FROM);

const BODY_LINES: Array<[number, number]> = [
  [62, 150], [74, 142], [86, 146], [102, 136], [114, 148], [126, 124],
];
const HIGHLIGHTS: Array<[number, number, number]> = [
  [74, 78, 108],
  [114, 96, 130],
];
const PARSED_ROWS = [52, 76, 100];

/** (a) ATS analysis: a resume document read by a single scan line. */
export const AtsScanIllustration: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { ref, play, reduce } = useRevealOnce<SVGSVGElement>();

  return (
    <svg
      ref={ref}
      viewBox="0 0 280 150"
      className={`${SVG_NEUTRAL} ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      {/* document */}
      <rect x="64" y="14" width="100" height="122" rx="8" className={SURFACE_FILL} stroke="currentColor" strokeWidth={1.5} />
      <circle cx="82" cy="34" r="7" stroke="currentColor" {...STROKE} />
      <line x1="96" y1="30" x2="140" y2="30" stroke="currentColor" {...STROKE} />
      <line x1="96" y1="38" x2="126" y2="38" stroke="currentColor" {...STROKE} />
      <line x1="78" y1="50" x2="150" y2="50" stroke="currentColor" strokeWidth={1.5} strokeDasharray="2 4" strokeLinecap="round" />
      {BODY_LINES.map(([y, x2]) => (
        <line key={y} x1="78" y1={y} x2={x2} y2={y} stroke="currentColor" {...STROKE} />
      ))}

      {/* keywords picked up by the scan */}
      {HIGHLIGHTS.map(([y, x1, x2]) => (
        <motion.line
          key={`hl-${y}`}
          x1={x1} y1={y} x2={x2} y2={y}
          className={ACCENT_STROKE}
          {...STROKE}
          {...once(play, reduce, { opacity: 0 }, { opacity: 1 }, { duration: 0.25, delay: at(y) })}
        />
      ))}

      {/* parsed fields on the right */}
      {PARSED_ROWS.map((y) => (
        <motion.g key={`row-${y}`} {...once(play, reduce, { opacity: 0 }, { opacity: 1 }, { duration: 0.3, delay: at(y) })}>
          <circle cx="190" cy={y} r="5" className={ACCENT_STROKE} {...STROKE} />
          <path d={`M187.6 ${y} l1.8 1.8 l3.2 -3.4`} className={ACCENT_STROKE} {...STROKE} />
          <line x1="202" y1={y - 3} x2="246" y2={y - 3} stroke="currentColor" {...STROKE} />
          <line x1="202" y1={y + 3} x2="230" y2={y + 3} stroke="currentColor" {...STROKE} />
        </motion.g>
      ))}

      {/* the scan line: runs once, then fades out (not rendered with reduced motion) */}
      {!reduce && (
        <motion.g
          initial={{ y: SCAN_FROM, opacity: 0 }}
          animate={play ? { y: SCAN_TO, opacity: [0, 1, 1, 0] } : { y: SCAN_FROM, opacity: 0 }}
          transition={{ duration: SCAN_DURATION, delay: SCAN_START, ease: 'linear', opacity: { duration: SCAN_DURATION, delay: SCAN_START, times: [0, 0.08, 0.88, 1] } }}
        >
          <line x1="56" y1="0" x2="172" y2="0" className={ACCENT_STROKE} {...STROKE} />
          <line x1="56" y1="-3" x2="56" y2="3" className={ACCENT_STROKE} {...STROKE} />
          <line x1="172" y1="-3" x2="172" y2="3" className={ACCENT_STROKE} {...STROKE} />
        </motion.g>
      )}

      {/* done badge */}
      <motion.g {...once(play, reduce, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1 }, { duration: 0.35, delay: SCAN_START + SCAN_DURATION + 0.05, ease: [0.16, 1, 0.3, 1] })}>
        <circle cx="160" cy="132" r="11" className={`${SURFACE_FILL} ${ACCENT_STROKE}`} strokeWidth={1.5} />
        <path d="M155 132 l3.5 3.5 l6.5 -7" className={ACCENT_STROKE} {...STROKE} />
      </motion.g>
    </svg>
  );
};
