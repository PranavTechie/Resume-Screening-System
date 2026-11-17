import React from 'react';
import { COMPANY_LOGOS } from '../data/mockData';

export const TrustMetrics: React.FC = () => {
  return (
    <section className="py-12 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 3 Core Editorial Metric Highlights */}
        <div className="grid md:grid-cols-3 gap-8 text-center pb-10 border-b border-neutral-200 dark:border-neutral-800">
          
          <div className="space-y-1">
            <div className="text-4xl sm:text-5xl font-normal font-serif-title text-neutral-900 dark:text-white">
              10K+
            </div>
            <p className="text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Resumes analyzed
            </p>
          </div>

          <div className="space-y-1 border-t md:border-t-0 md:border-l border-neutral-200 dark:border-neutral-800 pt-6 md:pt-0">
            <div className="text-4xl sm:text-5xl font-normal font-serif-title text-neutral-900 dark:text-white">
              94%
            </div>
            <p className="text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Average ATS compatibility
            </p>
          </div>

          <div className="space-y-1 border-t md:border-t-0 md:border-l border-neutral-200 dark:border-neutral-800 pt-6 md:pt-0">
            <div className="text-4xl sm:text-5xl font-normal font-serif-title text-neutral-900 dark:text-white">
              3×
            </div>
            <p className="text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Faster resume improvement
            </p>
          </div>

        </div>

        {/* Company Logos */}
        <div className="pt-8 text-center space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
            Engineers & Professionals hired at top technology companies
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 opacity-75 grayscale hover:grayscale-0 transition-all">
            {COMPANY_LOGOS.map((company, index) => (
              <div key={index} className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 font-semibold text-sm">
                <span className="w-6 h-6 rounded bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  {company.symbol}
                </span>
                <span>{company.name}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
