import React from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, FileSearch, Check, X } from 'lucide-react';

export const AtsOptimization: React.FC = () => {
  const missingKeywords = [
    { name: 'Docker', searchVolume: 'Very High', importance: 'Critical' },
    { name: 'GraphQL Subscriptions', searchVolume: 'High', importance: 'Recommended' },
    { name: 'Terraform', searchVolume: 'High', importance: 'Optional' },
    { name: 'Cloud Security', searchVolume: 'Medium', importance: 'Recommended' },
  ];

  const atsSystems = [
    { name: 'Workday', status: 'Parsed (98%)', pass: true },
    { name: 'Greenhouse', status: 'Parsed (96%)', pass: true },
    { name: 'Lever', status: 'Parsed (95%)', pass: true },
    { name: 'Taleo', status: 'Parsed (92%)', pass: true },
  ];

  return (
    <section className="py-16 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-950/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Description */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Applicant Tracking System Verification</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-serif-title font-normal text-neutral-900 dark:text-white">
              Bypass ATS Filters with Precision Engineering
            </h2>

            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              75% of resumes are rejected by automated recruitment algorithms before a human recruiter ever sees them. Resume Screening System checks your document against real enterprise parser rules.
            </p>

            {/* ATS Systems Grid */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Tested against top recruiting software:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {atsSystems.map((sys, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs">
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">{sys.name}</span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> {sys.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Product Output Card */}
          <div className="lg:col-span-7">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-xl space-y-6">
              
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <FileSearch className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                    ATS Audit Results
                  </span>
                </div>
                <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                  Overall ATS Score: 94%
                </div>
              </div>

              {/* 4 Required Metric Gauges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                
                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                  <span className="text-[11px] uppercase font-bold text-neutral-400">ATS Score</span>
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white mt-0.5">94%</div>
                </div>

                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                  <span className="text-[11px] uppercase font-bold text-neutral-400">Keyword Match</span>
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white mt-0.5">92%</div>
                </div>

                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                  <span className="text-[11px] uppercase font-bold text-neutral-400">Formatting</span>
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white mt-0.5">96%</div>
                </div>

                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                  <span className="text-[11px] uppercase font-bold text-neutral-400">Experience Rel.</span>
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white mt-0.5">91%</div>
                </div>

              </div>

              {/* Missing Keywords Box */}
              <div className="pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Missing Keywords Detected
                </h4>
                <div className="space-y-1.5">
                  {missingKeywords.map((kw, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">{kw.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-neutral-400">Search Vol: {kw.searchVolume}</span>
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold">
                          {kw.importance}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
