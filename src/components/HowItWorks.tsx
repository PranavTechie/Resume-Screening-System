import React from 'react';
import { motion } from 'motion/react';
import { UploadCloud, Cpu, CheckCircle2, ArrowRight } from 'lucide-react';
import { HOVER_LIFT, Reveal, RevealGroup, RevealItem, useRevealOnce } from './motion/primitives';

// the connector line draws left -> right once; each node lights up as the line reaches it
const LINE_DELAY = 0.2;
const LINE_DURATION = 1.2;
const NODE_DELAYS = [LINE_DELAY, LINE_DELAY + LINE_DURATION / 2, LINE_DELAY + LINE_DURATION];

/** md+ only: three nodes aligned to the step cards, joined by a self-drawing line. */
const StepTimeline: React.FC = () => {
  const { ref, play, reduce } = useRevealOnce<HTMLDivElement>();
  const lit = (i: number) =>
    reduce
      ? { initial: false as const }
      : {
          initial: { opacity: 0, scale: 0.4 },
          animate: play ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.4 },
          transition: { duration: 0.3, delay: NODE_DELAYS[i] },
        };

  return (
    <div ref={ref} aria-hidden="true" className="hidden md:grid grid-cols-3 gap-6 relative h-4 mb-6">
      {/* line spans from the center of the first cell to the center of the last one */}
      <svg
        className="absolute top-1/2 -translate-y-1/2 h-2 overflow-visible"
        style={{ left: 'calc((100% - 3rem) / 6)', width: 'calc(100% - (100% - 3rem) / 3)' }}
      >
        <line x1="0" y1="4" x2="100%" y2="4" className="stroke-neutral-200 dark:stroke-neutral-800" strokeWidth={1.5} strokeLinecap="round" />
        <motion.line
          x1="0" y1="4" x2="100%" y2="4"
          className="stroke-purple-600 dark:stroke-purple-400"
          strokeWidth={1.5}
          strokeLinecap="round"
          initial={{ pathLength: reduce ? 1 : 0 }}
          animate={{ pathLength: play || reduce ? 1 : 0 }}
          transition={reduce ? { duration: 0 } : { duration: LINE_DURATION, delay: LINE_DELAY, ease: 'easeInOut' }}
        />
      </svg>
      {[0, 1, 2].map((i) => (
        <div key={i} className="relative flex items-center justify-center">
          <span className="w-3.5 h-3.5 rounded-full bg-page border-[1.5px] border-neutral-300 dark:border-neutral-700 flex items-center justify-center">
            <motion.span {...lit(i)} className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400" />
          </span>
        </div>
      ))}
    </div>
  );
};

interface HowItWorksProps {
  onAnalyzeClick: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onAnalyzeClick }) => {
  const steps = [
    {
      number: '01',
      title: 'Upload Resume',
      description: 'Drag and drop your current PDF, DOCX, DOC, or TXT resume into Resume Screening System for instant parsing.',
      icon: UploadCloud,
    },
    {
      number: '02',
      title: 'AI Analysis',
      description: 'Our neural engine evaluates ATS compatibility, keyword density, skill gaps, and bullet impact.',
      icon: Cpu,
    },
    {
      number: '03',
      title: 'Improve & Apply',
      description: 'Apply high-impact AI bullet edits, match target job specs, and submit applications with confidence.',
      icon: CheckCircle2,
    },
  ];

  return (
    <section id="how-it-works" className="py-16 border-b border-line bg-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <Reveal className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
            Streamlined Workflow
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif-title font-normal text-neutral-900 dark:text-white">
            How Resume Screening System Works
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
            Three simple steps to transform raw experience into a high-converting candidate profile.
          </p>
        </Reveal>

        <StepTimeline />

        {/* 3 Step Editorial Cards */}
        <RevealGroup className="grid md:grid-cols-3 gap-6 relative" stagger={0.3} delay={0.1}>
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <RevealItem key={idx} className="h-full">
              <div
                className={`h-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 relative overflow-hidden flex flex-col justify-between shadow-sm hover:border-purple-500/50 group ${HOVER_LIFT}`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-serif-title font-normal text-neutral-900 dark:text-white">
                      {step.number}
                    </span>
                    <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    {step.title}
                  </h3>

                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs font-semibold text-neutral-900 dark:text-neutral-200">
                  <span>Step {step.number} Detail</span>
                  <ArrowRight className="w-3.5 h-3.5 motion-safe:group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
              </RevealItem>
            );
          })}
        </RevealGroup>

        {/* Action Button */}
        <Reveal className="mt-10 text-center">
          <button
            onClick={onAnalyzeClick}
            className="inline-flex items-center justify-center gap-2 group px-6 py-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold shadow-sm hover:shadow-md motion-safe:hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60 transition-[translate,box-shadow,background-color] duration-200 ease-out cursor-pointer"
          >
            <span>Start Free AI Resume Scan</span>
            <ArrowRight className="w-3.5 h-3.5 motion-safe:group-hover:translate-x-0.5 transition-transform duration-200 ease-out" />
          </button>
        </Reveal>

      </div>
    </section>
  );
};
