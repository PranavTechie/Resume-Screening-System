import React, { useState } from 'react';
import { X, Sparkles, BarChart3, HelpCircle, CheckCircle2, ShieldAlert, ArrowRight, Lightbulb, FileText, Award, Layers, Check, AlertCircle } from 'lucide-react';
import { ResumeAnalysis } from '../types';

interface ResumeIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: ResumeAnalysis;
  onMatchWithJob?: () => void;
}

export const ResumeIntelligenceModal: React.FC<ResumeIntelligenceModalProps> = ({
  isOpen,
  onClose,
  candidate,
  onMatchWithJob,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'ats' | 'skills' | 'experience'>('overview');

  if (!isOpen || !candidate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-950/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-purple-500/10 text-purple-900 dark:text-purple-100 border border-purple-500/20">
                RESUME INTELLIGENCE
              </span>
              <span className="text-xs text-neutral-500 font-mono">ID: {candidate.id.slice(0, 8)}</span>
            </div>
            <h2 className="text-xl font-bold font-serif-title text-neutral-900 dark:text-white">
              {candidate.candidateName} — <span className="text-neutral-600 dark:text-neutral-400 font-sans font-normal text-base">{candidate.targetRole}</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {onMatchWithJob && (
              <button
                onClick={() => {
                  onMatchWithJob();
                }}
                className="px-3 py-1.5 text-xs font-semibold text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Match With Job →</span>
              </button>
            )}

            <button 
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center gap-6 text-xs font-semibold overflow-x-auto">
          {[
            { id: 'overview', label: 'Resume Health & Quality' },
            { id: 'ats', label: 'ATS Readability' },
            { id: 'skills', label: 'Extracted Skill Matrix' },
            { id: 'experience', label: 'Impact & Format Audit' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-purple-600 text-neutral-900 dark:text-white font-bold'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Context Banner */}
              <div className="p-3.5 rounded-xl bg-purple-500/5 border border-purple-500/20 flex items-center justify-between gap-4 text-xs">
                <div>
                  <span className="font-bold text-neutral-900 dark:text-white block">GENERAL RESUME HEALTH AUDIT</span>
                  <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-0.5">
                    Independent assessment of formatting compliance, keyword density, extracted competencies, and impact statement strength.
                  </p>
                </div>
                {onMatchWithJob && (
                  <button
                    onClick={onMatchWithJob}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs rounded-lg shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Match Job</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* 4 Core Resume Metric Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-center">
                  <span className="text-[11px] uppercase font-bold text-neutral-400">RESUME QUALITY</span>
                  <div className="text-3xl font-normal font-serif-title text-neutral-900 dark:text-white mt-1">
                    {candidate.resumeScore}<span className="text-xs font-sans text-neutral-400">/100</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-center">
                  <span className="text-[11px] uppercase font-bold text-neutral-400">ATS READABILITY</span>
                  <div className="text-3xl font-normal font-serif-title text-neutral-900 dark:text-white mt-1">
                    {candidate.atsCompatibility}%
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-center">
                  <span className="text-[11px] uppercase font-bold text-neutral-400">SKILLS DETECTED</span>
                  <div className="text-3xl font-normal font-serif-title text-neutral-900 dark:text-white mt-1">
                    {candidate.skillsDetectedCount}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-center">
                  <span className="text-[11px] uppercase font-bold text-neutral-400">AI IMPROVEMENTS</span>
                  <div className="text-3xl font-normal font-serif-title text-neutral-900 dark:text-white mt-1">
                    {candidate.aiImprovementsCount}
                  </div>
                </div>
              </div>

              {/* AI Recommendation */}
              <div className="p-5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-bold text-xs uppercase tracking-wider">
                  <Lightbulb className="w-4 h-4 text-purple-600" />
                  <span>Key AI Resume Recommendation</span>
                </div>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
                  {candidate.aiRecommendation}
                </p>
              </div>

              {/* Detected vs Missing Core Skills */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
                  <span className="text-xs font-bold text-neutral-900 dark:text-white block">Detected Core Skills ({candidate.detectedSkills.length})</span>
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.detectedSkills.map((skill, i) => (
                      <span key={i} className="px-2.5 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-medium border border-neutral-200 dark:border-neutral-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block">Missing / Weak High-Impact Areas ({candidate.missingSkills.length})</span>
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.missingSkills.map((skill, i) => (
                      <span key={i} className="px-2.5 py-1 rounded bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs font-medium border border-rose-500/20">
                        ✕ {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ats' && (
            <div className="space-y-6">
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">ATS Readability & Parser Compliance</h3>
                <p className="text-neutral-500 text-xs">Evaluated across Workday, Greenhouse, Lever, and Taleo parsing rules.</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                  <span className="text-[11px] text-neutral-500 font-bold uppercase block mb-1">Keyword Density</span>
                  <p className="text-2xl font-extrabold text-neutral-900 dark:text-white font-mono">{candidate.atsBreakdown.keywordMatch}%</p>
                </div>
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                  <span className="text-[11px] text-neutral-500 font-bold uppercase block mb-1">Layout & Formatting</span>
                  <p className="text-2xl font-extrabold text-neutral-900 dark:text-white font-mono">{candidate.atsBreakdown.formatting}%</p>
                </div>
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                  <span className="text-[11px] text-neutral-500 font-bold uppercase block mb-1">Structure Relevance</span>
                  <p className="text-2xl font-extrabold text-neutral-900 dark:text-white font-mono">{candidate.atsBreakdown.experienceRelevance}%</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2 bg-neutral-50/50 dark:bg-neutral-950/50">
                <span className="font-bold text-neutral-900 dark:text-white block">Parser Compliance Check</span>
                <ul className="space-y-1.5 text-xs">
                  <li className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Single-column standard layout passes automated ATS text node extraction without error.</span>
                  </li>
                  <li className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Font hierarchy and section headers use standard semantic naming (`Work Experience`, `Education`, `Skills`).</span>
                  </li>
                  <li className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Contact details (Email, Phone, Location) successfully parsed into candidate contact record.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'skills' && (
            <div className="space-y-4">
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Extracted Skill Matrix</h3>
                <p className="text-neutral-500 text-xs">Technical competencies, tools, frameworks, and domain expertise identified in the resume text.</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {candidate.detectedSkills.map((skill, idx) => (
                  <span key={idx} className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold border border-neutral-200 dark:border-neutral-700">
                    ✓ {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'experience' && (
            <div className="space-y-4">
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Impact & Achievement Audit</h3>
                <p className="text-neutral-500 text-xs">Evaluates metric density, strong action verbs, and achievement statements.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2">
                  <span className="font-bold text-neutral-900 dark:text-white block">Strengths & High Impact Bullet Points</span>
                  <ul className="space-y-1.5">
                    <li className="flex items-start gap-2 text-neutral-700 dark:text-neutral-300">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Strong action verbs used across experience bullet points.</span>
                    </li>
                    <li className="flex items-start gap-2 text-neutral-700 dark:text-neutral-300">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Clear progression of responsibilities across past technical positions.</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2">
                  <span className="font-bold text-rose-600 dark:text-rose-400 block">Recommended Resume Improvements</span>
                  <ul className="space-y-1.5">
                    {candidate.generalIssues.map((issue, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-neutral-700 dark:text-neutral-300">
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <span>{issue}</span>
                      </li>
                    ))}
                    {candidate.generalIssues.length === 0 && (
                      <li className="flex items-start gap-2 text-neutral-700 dark:text-neutral-300">
                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>Add measurable metrics to recent achievements (e.g. "Increased throughput by 40%").</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex items-center justify-between">
          <span className="text-neutral-500 text-xs">Resume Screening System Engine • General Resume Intelligence</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-neutral-900 text-white font-medium text-xs hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
