import React from 'react';
import { Sparkles } from 'lucide-react';
import { ResumeAnalysis } from '../types';
import { HOVER_LIFT, Reveal, RevealGroup, RevealItem } from './motion/primitives';
import { AtsScanIllustration } from './illustrations/AtsScanIllustration';
import { SkillGraphIllustration } from './illustrations/SkillGraphIllustration';
import { JobMatchIllustration } from './illustrations/JobMatchIllustration';
import { RankingIllustration } from './illustrations/RankingIllustration';

interface ProductVisualizationProps {
  analysis?: ResumeAnalysis;
  onProfileChange?: (id: string) => void;
}

const FEATURES = [
  {
    number: '01',
    title: 'ATS Analysis',
    description: 'Ensures applicant tracking systems parse your profile with zero errors.',
    points: ['ATS compatibility', 'Keyword coverage', 'Formatting issues', 'Missing keywords'],
    Illustration: AtsScanIllustration,
  },
  {
    number: '02',
    title: 'Skill Intelligence',
    description: 'Extracts and measures hard skills against industry benchmarks.',
    points: ['Detected skills', 'Missing skills', 'Skill strength', 'Role requirements'],
    Illustration: SkillGraphIllustration,
  },
  {
    number: '03',
    title: 'Career Match',
    description: 'Maps qualifications directly to target job descriptions.',
    points: ['Job compatibility', 'Experience match', 'Strengths & gaps', 'AI recommendations'],
    Illustration: JobMatchIllustration,
  },
];

const PointList: React.FC<{ points: string[] }> = ({ points }) => (
  <ul className="space-y-2.5 pt-4 border-t border-neutral-100 dark:border-neutral-800 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
    {points.map((point) => (
      <li key={point} className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400 shrink-0" />
        <span>{point}</span>
      </li>
    ))}
  </ul>
);

export const ProductVisualization: React.FC<ProductVisualizationProps> = () => {
  return (
    <section id="features" className="py-16 md:py-24 border-b border-line bg-page-alt">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 md:space-y-16">

        {/* Section Header */}
        <RevealGroup className="text-center max-w-3xl mx-auto space-y-3">
          <RevealItem>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Analysis Breakdown</span>
            </div>
          </RevealItem>
          <RevealItem>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif-title font-normal text-neutral-900 dark:text-white tracking-tight">
              From Resume to Career Intelligence
            </h2>
          </RevealItem>
          <RevealItem>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
              See what Resume Screening System actually analyzes.
            </p>
          </RevealItem>
        </RevealGroup>

        {/* 3 feature cards, each with its own illustration */}
        <RevealGroup className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {FEATURES.map(({ number, title, description, points, Illustration }) => (
            <RevealItem key={number} className="h-full">
              <article className={`h-full bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col gap-5 ${HOVER_LIFT}`}>
                <div className="rounded-xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/70 dark:border-neutral-800/70 px-2 py-3">
                  <Illustration className="w-full h-auto aspect-[280/150]" />
                </div>

                <div className="space-y-1.5 px-1">
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-lg font-serif-title text-neutral-500 dark:text-neutral-400">{number}</span>
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white uppercase tracking-wider font-sans">
                      {title}
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">{description}</p>
                </div>

                <div className="px-1">
                  <PointList points={points} />
                </div>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>

        {/* Candidate ranking: the screening side of the product */}
        <Reveal>
          <article className={`bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl p-5 sm:p-8 shadow-xs grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-10 items-center ${HOVER_LIFT}`}>
            <div className="md:col-span-2 min-w-0 space-y-4 px-1">
              <div className="flex items-baseline gap-2.5">
                <span className="text-lg font-serif-title text-neutral-500 dark:text-neutral-400">04</span>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white uppercase tracking-wider font-sans">
                  Candidate Ranking
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Attach resumes to a job and rank every candidate by match score.
              </p>
              <PointList points={['Match % per candidate', 'Skills matched', 'Re-rank anytime']} />
            </div>
            <div className="md:col-span-3 min-w-0 rounded-xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/70 dark:border-neutral-800/70 p-4 sm:p-5">
              <RankingIllustration />
            </div>
          </article>
        </Reveal>

      </div>
    </section>
  );
};
