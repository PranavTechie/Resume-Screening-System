import React from 'react';
import { Eye, Target, Sparkles, Award } from 'lucide-react';

export const Benefits: React.FC = () => {
  const benefits = [
    {
      title: 'Better ATS visibility',
      description: 'Understand how your resume performs in enterprise recruiting software before submitting a single application.',
      icon: Eye,
    },
    {
      title: 'Clear skill gaps',
      description: 'Know what skills, tools, and certifications you need next to qualify for higher-tier positions.',
      icon: Target,
    },
    {
      title: 'Smarter applications',
      description: 'Compare your resume against real job descriptions in seconds and align your skills for max relevance.',
      icon: Sparkles,
    },
    {
      title: 'Candidate Ranking',
      description: 'Rank and evaluate multiple candidate resumes against job specifications with AI precision.',
      icon: Award,
    },
  ];

  return (
    <section className="py-16 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="max-w-3xl mb-12 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
            Why Resume Screening System
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif-title font-normal text-neutral-900 dark:text-white">
            Built for Serious Career Progression
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
            A comprehensive career intelligence engine designed to eliminate application guesswork.
          </p>
        </div>

        {/* Editorial Content List Layout — Clean dividers, not giant rounded cards */}
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-10 border-t border-neutral-200 dark:border-neutral-800 pt-10">
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div key={idx} className="space-y-3 pb-6 border-b border-neutral-200/60 dark:border-neutral-800/60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-purple-500/10 text-neutral-900 dark:text-white flex items-center justify-center font-bold text-xs shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                    {b.title}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed pl-11">
                  {b.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
