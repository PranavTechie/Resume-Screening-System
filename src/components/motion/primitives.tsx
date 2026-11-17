import React, { Children, cloneElement, createContext, isValidElement, useContext, useEffect, useRef } from 'react';
import { animate, motion, useInView, useReducedMotion } from 'motion/react';

/*
 * Landing-page motion vocabulary. Only three styles are allowed:
 *   1. scroll reveal (fade + 14px rise, once)       -> Reveal / RevealGroup / RevealItem
 *   2. count-up numbers and bar/ring fills (once)   -> CountUp / FillBar / useRevealOnce
 *   3. tiny hover lift (CSS, motion-safe only)      -> HOVER_LIFT
 * Everything animates transform/opacity only and shows the final state when
 * prefers-reduced-motion is on.
 */

export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const VIEWPORT = { once: true, margin: '-80px' } as const;
export const HOVER_LIFT =
  'transition-[translate,box-shadow,border-color] duration-200 ease-out motion-safe:hover:-translate-y-0.5 hover:shadow-md';

/** ref + boolean that flips to true once the element enters the viewport (always true with reduced motion). */
export function useRevealOnce<T extends Element>() {
  const ref = useRef<T>(null);
  const inView = useInView(ref, VIEWPORT);
  const reduce = !!useReducedMotion();
  return { ref, play: inView || reduce, reduce };
}

const HIDDEN = { opacity: 0, y: 14 };
const SHOWN = { opacity: 1, y: 0 };

/*
 * Note: App wraps routes in <AnimatePresence initial={false}>, which suppresses `initial`
 * (and initial variant propagation) for everything rendered on first load. So every reveal
 * element drives its own `animate` from useInView; its first value doubles as the start state.
 */

interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  delay?: number;
}

/** Single element scroll reveal. */
export const Reveal: React.FC<RevealProps> = ({ delay = 0, children, className, ...rest }) => {
  const { ref, play, reduce } = useRevealOnce<HTMLDivElement>();
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={reduce ? false : HIDDEN}
      animate={play ? SHOWN : HIDDEN}
      transition={reduce ? { duration: 0 } : { duration: 0.5, ease: EASE_OUT, delay }}
      {...(rest as object)}
    >
      {children}
    </motion.div>
  );
};

interface GroupState {
  play: boolean;
  reduce: boolean;
  stagger: number;
  delay: number;
}
const RevealGroupContext = createContext<GroupState | null>(null);

interface RevealGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  stagger?: number;
  delay?: number;
}

/** Stagger container: direct RevealItem children rise 60ms apart once the group is on screen. */
export const RevealGroup: React.FC<RevealGroupProps> = ({ stagger = 0.06, delay = 0, children, className, ...rest }) => {
  const { ref, play, reduce } = useRevealOnce<HTMLDivElement>();
  let index = 0;
  const indexed = Children.map(children, (child) =>
    isValidElement(child) && child.type === RevealItem
      ? cloneElement(child as React.ReactElement<RevealItemProps>, { index: index++ })
      : child,
  );
  return (
    <RevealGroupContext.Provider value={{ play, reduce, stagger, delay }}>
      <div ref={ref} className={className} {...rest}>
        {indexed}
      </div>
    </RevealGroupContext.Provider>
  );
};

interface RevealItemProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'div' | 'li' | 'span';
  /** set by RevealGroup */
  index?: number;
}

export const RevealItem: React.FC<RevealItemProps> = ({ as = 'div', index = 0, children, className, ...rest }) => {
  const group = useContext(RevealGroupContext);
  const own = useRevealOnce<HTMLElement>();
  const play = group ? group.play : own.play;
  const reduce = group ? group.reduce : own.reduce;
  const delay = group ? group.delay + index * group.stagger : 0;
  const Comp = as === 'li' ? motion.li : as === 'span' ? motion.span : motion.div;
  return (
    <Comp
      ref={group ? undefined : (own.ref as React.Ref<never>)}
      className={className}
      initial={reduce ? false : HIDDEN}
      animate={play ? SHOWN : HIDDEN}
      transition={reduce ? { duration: 0 } : { duration: 0.5, ease: EASE_OUT, delay }}
      {...(rest as object)}
    >
      {children}
    </Comp>
  );
};

interface CountUpProps {
  value: number;
  play: boolean;
  duration?: number;
  delay?: number;
  suffix?: string;
  /** render as an SVG <tspan> instead of a <span> */
  svg?: boolean;
  className?: string;
}

/** Counts 0 -> value once `play` turns true. Writes textContent directly (no re-renders). */
export const CountUp: React.FC<CountUpProps> = ({ value, play, duration = 1.1, delay = 0, suffix = '', svg = false, className }) => {
  const ref = useRef<HTMLSpanElement & SVGTSpanElement>(null);
  const reduce = !!useReducedMotion();
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) {
      el.textContent = `${value}${suffix}`;
      return;
    }
    if (!play || started.current) return;
    started.current = true;
    const controls = animate(0, value, {
      duration,
      delay,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        el.textContent = `${Math.round(v)}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [play, reduce, value, suffix, duration, delay]);

  const initial = reduce ? `${value}${suffix}` : `0${suffix}`;
  if (svg) {
    return <tspan ref={ref} className={className}>{initial}</tspan>;
  }
  // min-width in ch + tabular figures so neighbours never shift while counting
  return (
    <span
      ref={ref}
      aria-label={`${value}${suffix}`}
      className={`inline-block tabular-nums ${className ?? ''}`}
      style={{ minWidth: `${`${value}${suffix}`.length}ch` }}
    >
      {initial}
    </span>
  );
};

interface FillBarProps {
  /** 0-100 */
  value: number;
  play: boolean;
  delay?: number;
  className?: string;
  trackClassName?: string;
}

/** Thin progress bar that fills once via scaleX (no layout work). */
export const FillBar: React.FC<FillBarProps> = ({ value, play, delay = 0, className = 'bg-purple-600 dark:bg-purple-400', trackClassName = 'bg-neutral-200/80 dark:bg-neutral-800' }) => {
  const reduce = !!useReducedMotion();
  const target = Math.max(0, Math.min(100, value)) / 100;
  return (
    <div className={`h-1 w-full rounded-full overflow-hidden ${trackClassName}`} aria-hidden="true">
      <motion.div
        className={`h-full w-full rounded-full origin-left ${className}`}
        initial={{ scaleX: reduce ? target : 0 }}
        animate={{ scaleX: play || reduce ? target : 0 }}
        transition={{ duration: reduce ? 0 : 1.1, delay: reduce ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
};
