import React, { useState } from 'react';
import { Target, CheckCircle, AlertTriangle, ArrowRight, Building, Sparkles } from 'lucide-react';

export const JobMatching: React.FC = () => {
  const [selectedJob, setSelectedJob] = useState<number>(0);

  const jobs = [
    {
      company: 'Stripe',
      role: 'Senior Frontend Engineer',
      matchScore: 91,
      strongMatches: ['React', 'TypeScript', 'REST APIs', 'Performance Tuning'],
      skillGaps: ['AWS', 'Docker', 'GraphQL Subscriptions'],
      description: 'Looking for a Senior Frontend Engineer to build high-converting global checkout interfaces using React, TypeScript, and high-performance API clients.'
    },
    {
      company: 'Vercel',
      role: 'Staff Full Stack Engineer',
      matchScore: 95,
      strongMatches: ['TypeScript', 'Node.js', 'Next.js', 'Tailwind CSS'],
      skillGaps: ['Vector Databases (Pinecone)', 'OpenAI SDK'],
      description: 'Join the edge infrastructure team building next-generation frontend deployment tooling with Next.js and TypeScript.'
    },
    {
      company: 'Linear',
      role: 'Lead Product Engineer',
      matchScore: 88,
      strongMatches: ['React', 'System Design', 'Agile / Scrum', 'State Sync'],
      skillGaps: ['Go', 'Kubernetes'],
      description: 'Seeking a Lead Product Engineer passionate about high-fps desktop-class web applications, keyboard shortcuts, and sync engine design.'
    }
  ];

  const currentJob = jobs[selectedJob];

  return (
    <section className="py-16 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-neutral-900 dark:text-neutral-100 text-xs font-semibold">
            <Target className="w-3.5 h-3.5" />
            <span>Target Opportunity Comparison</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif-title font-normal text-neutral-900 dark:text-white">
            Resume vs Job Description Match Engine
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
            Compare your resume against real target job descriptions in seconds to discover instant skill gaps.
          </p>
        </div>

        {/* Job Selection Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {jobs.map((job, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedJob(idx)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                selectedJob === idx
                  ? 'bg-neutral-900 dark:bg-purple-600 text-white shadow-sm'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>{job.company} — {job.role}</span>
            </button>
          ))}
        </div>

        {/* Side-by-Side Comparison Container */}
        <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-lg">
          
          <div className="flex flex-wrap items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                  {currentJob.company}
                </span>
                <span className="text-neutral-400">•</span>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {currentJob.role}
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-xl">
                "{currentJob.description}"
              </p>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
                Job Match Score
              </span>
              <span className="text-3xl font-bold text-neutral-900 dark:text-white font-serif-title">
                {currentJob.matchScore}%
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 pt-6">
            
            {/* Strong Matches Box */}
            <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-emerald-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  Strong Matches ({currentJob.strongMatches.length})
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold">
                  Matched
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentJob.strongMatches.map((skill, i) => (
                  <span 
                    key={i} 
                    className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-500/20"
                  >
                    ✓ {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Skill Gaps Box */}
            <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-amber-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Skill Gaps ({currentJob.skillGaps.length})
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 font-bold">
                  Action Required
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentJob.skillGaps.map((gap, i) => (
                  <span 
                    key={i} 
                    className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-500/20"
                  >
                    + Add {gap}
                  </span>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
