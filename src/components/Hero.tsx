import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import { ResumeAnalysis } from '../types';
import { CountUp, EASE_OUT, FillBar, Reveal, RevealGroup, RevealItem, useRevealOnce } from './motion/primitives';

const HERO_SKILLS = ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS', 'Git'];

interface HeroProps {
  onSelectResume: (resume: ResumeAnalysis) => void;
  onAnalyzeClick: () => void;
  onSeeHowClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onAnalyzeClick, onSeeHowClick }) => {
  // card numbers, bars and chips play once when the card is on screen (on load on desktop)
  const { ref: cardRef, play, reduce } = useRevealOnce<HTMLDivElement>();
  const chipState = (i: number) =>
    reduce
      ? { initial: false as const }
      : {
          initial: { opacity: 0, y: 6 },
          animate: play ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 },
          transition: { duration: 0.35, ease: EASE_OUT, delay: 0.7 + i * 0.06 },
        };

  return (
    <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 border-b border-line bg-page overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* Hero Content Left */}
          <RevealGroup className="lg:col-span-7 space-y-6">

            {/* Pill Badge */}
            <RevealItem>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/20 text-neutral-900 dark:text-neutral-100 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                <span>AI-Powered Resume Analysis</span>
              </div>
            </RevealItem>

            {/* Editorial Serif Headline */}
            <RevealItem>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight font-serif-title text-neutral-900 dark:text-white leading-[1.08]">
              Turn Your Resume Into <br className="hidden sm:inline" />
              <span className="text-neutral-900 dark:text-white font-serif-title italic">Career Intelligence.</span>
            </h1>
            </RevealItem>

            {/* Subtitle */}
            <RevealItem>
            <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300 max-w-2xl font-normal leading-relaxed">
              Analyze your resume, understand your ATS performance, discover skill gaps, match better jobs, and improve your applications with AI-powered career intelligence.
            </p>
            </RevealItem>

            {/* CTAs */}
            <RevealItem className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onAnalyzeClick}
                className="group px-6 py-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 border border-neutral-900 dark:border-white text-white dark:text-neutral-900 font-medium text-xs sm:text-sm shadow-sm hover:shadow-md motion-safe:hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950 transition-[translate,box-shadow,background-color] duration-200 ease-out flex items-center gap-2 cursor-pointer"
              >
                <span>Analyze My Resume</span>
                <ArrowRight className="w-4 h-4 motion-safe:group-hover:translate-x-0.5 transition-transform duration-200" />
              </button>

              <button
                onClick={onSeeHowClick}
                className="px-6 py-3 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 font-medium text-xs sm:text-sm shadow-sm hover:shadow-md motion-safe:hover:-translate-y-0.5 transition-[translate,box-shadow,background-color] duration-200 ease-out cursor-pointer"
              >
                See How It Works
              </button>
            </RevealItem>

            {/* Trust Bulletins */}
            <RevealItem className="pt-4 flex flex-wrap items-center gap-6 text-xs text-neutral-500 dark:text-neutral-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Private & Secure</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Supports PDF, DOCX, DOC, TXT, JPG & PNG</span>
              </div>
            </RevealItem>
          </RevealGroup>

          {/* Hero Resume Screening System Product Dashboard Preview Right */}
          <div className="lg:col-span-5 relative isolate">
            {/* Single static focal light behind the card (token: --hero-focal) */}
            <div aria-hidden="true" className="hero-focal pointer-events-none absolute -inset-x-20 -inset-y-24 -z-10" />
            <Reveal delay={0.15}>
            <div ref={cardRef} className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden space-y-4">

              {/* HEADER */}
              <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100 dark:border-neutral-800">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Resume Screening System Analysis
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-[11px] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                      Live Analysis
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white font-sans">
                    Alex Morgan <span className="font-normal text-neutral-500 dark:text-neutral-400 text-xs">· Senior Frontend Engineer</span>
                  </h3>
                </div>
              </div>

              {/* TOP METRICS — 2x2 compact cards */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Resume Score */}
                <div className="p-3 rounded-xl bg-neutral-50/80 dark:bg-neutral-950/50 border border-neutral-200/60 dark:border-neutral-800/60 space-y-1">
                  <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    Resume Score
                  </div>
                  <div className="text-lg font-bold text-neutral-900 dark:text-white flex items-baseline gap-1">
                    <CountUp value={89} play={play} delay={0.25} /> <span className="text-xs font-normal text-neutral-400">/ 100</span>
                  </div>
                  <FillBar value={89} play={play} delay={0.25} />
                </div>

                {/* ATS Match */}
                <div className="p-3 rounded-xl bg-neutral-50/80 dark:bg-neutral-950/50 border border-neutral-200/60 dark:border-neutral-800/60 space-y-1">
                  <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    ATS Match
                  </div>
                  <div className="text-lg font-bold text-neutral-900 dark:text-white">
                    <CountUp value={94} suffix="%" play={play} delay={0.33} />
                  </div>
                  <FillBar value={94} play={play} delay={0.33} />
                </div>

                {/* Skills Detected */}
                <div className="p-3 rounded-xl bg-neutral-50/80 dark:bg-neutral-950/50 border border-neutral-200/60 dark:border-neutral-800/60 space-y-1">
                  <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    Skills Detected
                  </div>
                  <div className="text-lg font-bold text-neutral-900 dark:text-white">
                    <CountUp value={18} play={play} delay={0.41} />
                  </div>
                </div>

                {/* Job Match */}
                <div className="p-3 rounded-xl bg-neutral-50/80 dark:bg-neutral-950/50 border border-neutral-200/60 dark:border-neutral-800/60 space-y-1">
                  <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    Job Match
                  </div>
                  <div className="text-lg font-bold text-neutral-900 dark:text-white">
                    <CountUp value={91} suffix="%" play={play} delay={0.49} />
                  </div>
                  <FillBar value={91} play={play} delay={0.49} />
                </div>
              </div>

              {/* DETECTED SKILLS */}
              <div className="space-y-2 pt-0.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Detected Skills
                </div>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {HERO_SKILLS.map((skill, i) => (
                    <motion.span
                      key={skill}
                      {...chipState(i)}
                      className="px-2.5 py-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-medium text-xs"
                    >
                      {skill}
                    </motion.span>
                  ))}
                  <motion.span {...chipState(HERO_SKILLS.length)} className="px-2.5 py-0.5 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-semibold text-xs">
                    +12 more
                  </motion.span>
                </div>
              </div>

              {/* COMPACT AI INSIGHT */}
              <motion.div
                {...(reduce
                  ? { initial: false as const }
                  : {
                      initial: { opacity: 0 },
                      animate: { opacity: play ? 1 : 0 },
                      transition: { duration: 0.5, delay: 1.25 },
                    })}
                className="p-3 rounded-xl bg-neutral-50/90 dark:bg-neutral-950/60 border border-neutral-200/70 dark:border-neutral-800/70 space-y-1"
              >
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                  <span>AI Insight</span>
                </div>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 italic leading-relaxed">
                  "Strong ATS compatibility and relevant technical skills. Add measurable impact to recent experience."
                </p>
              </motion.div>

              {/* VIEW FULL ANALYSIS FOOTER */}
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
                <button
                  onClick={onAnalyzeClick}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer group"
                >
                  <span>View Full Analysis</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

            </div>
            </Reveal>
          </div>

        </div>

      </div>
    </section>
  );
};
