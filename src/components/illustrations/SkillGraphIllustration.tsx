import React from 'react';
import { motion } from 'motion/react';
import { useRevealOnce } from '../motion/primitives';
import { ACCENT_FILL, ACCENT_STROKE, LABEL_FILL, STROKE, SURFACE_FILL, SVG_NEUTRAL, once } from './shared';

const CENTER = { x: 140, y: 75 };
const CHIP_W = 56;
const CHIP_H = 24;

const FOUND = [
  { label: 'React', x: 58, y: 30 },
  { label: 'Git', x: 44, y: 75 },
  { label: 'Node', x: 58, y: 120 },
  { label: 'SQL', x: 222, y: 30 },
  { label: 'AWS', x: 236, y: 75 },
];
const MISSING = { label: 'Docker', x: 222, y: 120 };

/** (b) Skill intelligence: detected skills connected to the resume, one missing skill highlighted. */
export const SkillGraphIllustration: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { ref, play, reduce } = useRevealOnce<SVGSVGElement>();
  const ease = [0.16, 1, 0.3, 1] as const;

  return (
    <svg ref={ref} viewBox="0 0 280 150" className={`${SVG_NEUTRAL} ${className}`} aria-hidden="true" focusable="false">
      {/* connectors (drawn once) */}
      {FOUND.map((chip, i) => (
        <motion.line
          key={`edge-${chip.label}`}
          x1={CENTER.x} y1={CENTER.y} x2={chip.x} y2={chip.y}
          stroke="currentColor"
          {...STROKE}
          {...once(play, reduce, { pathLength: 0 }, { pathLength: 1 }, { duration: 0.5, delay: 0.15 + i * 0.08, ease: 'easeOut' })}
        />
      ))}
      <motion.line
        x1={CENTER.x} y1={CENTER.y} x2={MISSING.x} y2={MISSING.y}
        className={ACCENT_STROKE}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeDasharray="2 5"
        {...once(play, reduce, { opacity: 0 }, { opacity: 1 }, { duration: 0.35, delay: 0.95 })}
      />

      {/* resume node */}
      <circle cx={CENTER.x} cy={CENTER.y} r="20" className={SURFACE_FILL} stroke="currentColor" strokeWidth={1.5} />
      <line x1="131" y1="69" x2="149" y2="69" stroke="currentColor" {...STROKE} />
      <line x1="131" y1="75" x2="145" y2="75" stroke="currentColor" {...STROKE} />
      <line x1="131" y1="81" x2="147" y2="81" stroke="currentColor" {...STROKE} />

      {/* detected skills */}
      {FOUND.map((chip, i) => (
        <motion.g
          key={chip.label}
          {...once(play, reduce, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1 }, { duration: 0.35, delay: 0.35 + i * 0.08, ease })}
        >
          <rect x={chip.x - CHIP_W / 2} y={chip.y - CHIP_H / 2} width={CHIP_W} height={CHIP_H} rx={CHIP_H / 2} className={SURFACE_FILL} stroke="currentColor" strokeWidth={1.5} />
          <text x={chip.x} y={chip.y} textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="600" className={LABEL_FILL}>
            {chip.label}
          </text>
        </motion.g>
      ))}

      {/* the gap */}
      <motion.g {...once(play, reduce, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1 }, { duration: 0.4, delay: 1.05, ease })}>
        <rect
          x={MISSING.x - CHIP_W / 2} y={MISSING.y - CHIP_H / 2} width={CHIP_W} height={CHIP_H} rx={CHIP_H / 2}
          className={`${SURFACE_FILL} ${ACCENT_STROKE}`} strokeWidth={1.5} strokeDasharray="3 3"
        />
        <text x={MISSING.x} y={MISSING.y} textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="600" className={ACCENT_FILL}>
          {MISSING.label}
        </text>
        <circle cx={MISSING.x + CHIP_W / 2} cy={MISSING.y - CHIP_H / 2} r="6.5" className={`${SURFACE_FILL} ${ACCENT_STROKE}`} strokeWidth={1.5} />
        <path
          d={`M${MISSING.x + CHIP_W / 2 - 2.8} ${MISSING.y - CHIP_H / 2} h5.6 M${MISSING.x + CHIP_W / 2} ${MISSING.y - CHIP_H / 2 - 2.8} v5.6`}
          className={ACCENT_STROKE}
          {...STROKE}
        />
      </motion.g>
    </svg>
  );
};
