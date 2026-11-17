import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, ShieldAlert, Award, Sparkles, AlertTriangle, Briefcase, FileText, Check, Layers, ChevronRight } from 'lucide-react';
import { JobItem, ResumeAnalysis, JobMatchResult } from '../types';

interface CandidateIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobItem;
  candidate: ResumeAnalysis;
  match?: JobMatchResult;
  rankIndex?: number;
}

export const CandidateIntelligenceModal: React.FC<CandidateIntelligenceModalProps> = ({
  isOpen,
  onClose,
  job,
  candidate,
  match,
  rankIndex,
}) => {
  const [activeTab, setActiveTab] = useState<'fit' | 'comparison' | 'recommendation' | 'interview'>('fit');

  // Viewport scroll locking and preservation
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollY = window.scrollY;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !candidate || !job) return null;

  // Use match passed as prop, or read from job.matches[candidate.id]
  const matchInfo: JobMatchResult = match || job.matches?.[candidate.id] || {
    resumeId: candidate.id,
    candidateName: candidate.candidateName,
    targetRole: job.title,
    matchPercentage: candidate.resumeScore,
    atsMatchPercentage: candidate.atsCompatibility,
    skillsMatchedCount: `${candidate.detectedSkills.slice(0, 4).length}/${candidate.detectedSkills.slice(0, 4).length + candidate.missingSkills.slice(0, 2).length}`,
    experienceMatchPercentage: candidate.resumeScore,
    matchSummary: `${candidate.candidateName} evaluated against target job "${job.title}". Solid technical alignment.`,
    strongMatches: candidate.detectedSkills.slice(0, 4),
    skillGaps: candidate.missingSkills.length > 0 ? candidate.missingSkills.slice(0, 2) : ['Cloud Architecture'],
  };

  const strongMatches = matchInfo.strongMatches || [];
  const skillGaps = matchInfo.skillGaps || [];
  const totalSkillsCount = strongMatches.length + skillGaps.length;
  const coveragePercentage = totalSkillsCount > 0 ? Math.round((strongMatches.length / totalSkillsCount) * 100) : 75;

  // Derive Hiring Recommendation
  const matchScore = matchInfo.matchPercentage;
  let recTier: { title: string; color: string; badgeBg: string; desc: string } = {
    title: 'Strong Fit',
    color: 'text-emerald-700 dark:text-emerald-400',
    badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    desc: 'High technical alignment across core tech stack, experience depth, and ATS requirements.',
  };

  if (matchScore < 60) {
    recTier = {
      title: 'Weak Fit',
      color: 'text-rose-600 dark:text-rose-400',
      badgeBg: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
      desc: 'Significant skill gaps identified against essential job requirements. Proceed with caution.',
    };
  } else if (matchScore < 75) {
    recTier = {
      title: 'Moderate Fit',
      color: 'text-amber-600 dark:text-amber-400',
      badgeBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
      desc: 'Relevant engineering background, but missing key required technologies or domain depth.',
    };
  } else if (matchScore < 85) {
    recTier = {
      title: 'Good Fit',
      color: 'text-purple-600 dark:text-purple-400',
      badgeBg: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
      desc: 'Solid overall candidate profile with minor skill gaps that can be addressed in training.',
    };
  }

  const modalContent = (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-overlay backdrop-blur-xs animate-in fade-in duration-200 select-none overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="relative w-full max-w-4xl max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3.5rem)] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto select-text transform transition-all duration-200 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-950/50">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                CANDIDATE INTELLIGENCE
              </span>
              <span className="text-xs text-neutral-500 font-medium flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-purple-600" />
                <span>Job: <strong>{job.title}</strong></span>
              </span>
              {rankIndex !== undefined && (
                <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-neutral-900 text-white dark:bg-neutral-800">
                  Rank #{rankIndex + 1}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold font-serif-title text-neutral-900 dark:text-white">
              {candidate.candidateName} — <span className="text-neutral-600 dark:text-neutral-400 font-sans font-normal text-base">{candidate.targetRole}</span>
            </h2>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center gap-6 text-xs font-semibold overflow-x-auto">
          {[
            { id: 'fit', label: 'Overall Job Fit & Skills' },
            { id: 'comparison', label: 'Candidate vs Job Matrix' },
            { id: 'recommendation', label: 'Hiring Recommendation' },
            { id: 'interview', label: 'Interview Focus Areas' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-emerald-600 text-neutral-900 dark:text-white font-bold'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Top 4 Job-Specific Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <span className="text-[11px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block">JOB MATCH</span>
              <div className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300 font-mono mt-1">
                {matchInfo.matchPercentage}%
              </div>
            </div>

            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
              <span className="text-[11px] uppercase font-bold text-purple-800 dark:text-purple-300 block">ATS COMPATIBILITY</span>
              <div className="text-3xl font-extrabold text-purple-700 dark:text-purple-300 font-mono mt-1">
                {matchInfo.atsMatchPercentage ?? matchInfo.matchPercentage}%
              </div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-center">
              <span className="text-[11px] uppercase font-bold text-neutral-400 block">SKILLS MATCHED</span>
              <div className="text-3xl font-extrabold text-neutral-900 dark:text-white font-mono mt-1">
                {matchInfo.skillsMatchedCount || `${strongMatches.length}/${totalSkillsCount}`}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-center">
              <span className="text-[11px] uppercase font-bold text-neutral-400 block">EXPERIENCE RELEVANCE</span>
              <div className="text-3xl font-extrabold text-neutral-900 dark:text-white font-mono mt-1">
                {matchInfo.experienceMatchPercentage ?? matchInfo.matchPercentage}%
              </div>
            </div>
          </div>

          {activeTab === 'fit' && (
            <div className="space-y-6">
              {/* Overall Job Fit Narrative Summary */}
              <div className="p-5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>OVERALL JOB FIT EVALUATION</span>
                </div>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
                  {matchInfo.matchSummary}
                </p>
              </div>

              {/* Job Requirement Coverage Progress Bar */}
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2 bg-white dark:bg-neutral-900">
                <div className="flex items-center justify-between text-xs font-bold text-neutral-900 dark:text-white">
                  <span>JOB REQUIREMENT COVERAGE</span>
                  <span className="font-mono text-purple-600 dark:text-purple-400">{coveragePercentage}% Met</span>
                </div>
                <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-600 to-emerald-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${coveragePercentage}%` }}
                  />
                </div>
                <p className="text-xs text-neutral-500">
                  Calculated against key technical skills, frameworks, and job description requirements.
                </p>
              </div>

              {/* Key Matched Skills vs Missing Job Skills */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Key Matched Skills */}
                <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-emerald-500/30 dark:border-emerald-500/20 space-y-3">
                  <span className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>KEY MATCHED SKILLS ({strongMatches.length})</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {strongMatches.map((skill, i) => (
                      <span key={i} className="px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-medium border border-emerald-200 dark:border-emerald-800/80">
                        ✓ {skill}
                      </span>
                    ))}
                    {strongMatches.length === 0 && (
                      <span className="text-neutral-400 text-xs italic">No direct skill matches detected.</span>
                    )}
                  </div>
                </div>

                {/* Missing Job Skills */}
                <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-rose-500/30 dark:border-rose-500/20 space-y-3">
                  <span className="text-xs font-bold uppercase text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>MISSING JOB SKILLS ({skillGaps.length})</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {skillGaps.map((gap, i) => (
                      <span key={i} className="px-2.5 py-1 rounded bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-medium border border-rose-200 dark:border-rose-800/80">
                        ✕ {gap}
                      </span>
                    ))}
                    {skillGaps.length === 0 && (
                      <span className="text-emerald-600 text-xs font-medium">Zero skill gaps detected!</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'comparison' && (
            <div className="space-y-4">
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">CANDIDATE vs JOB REQUIREMENTS MATRIX</h3>
                <p className="text-neutral-500 text-xs">Direct comparison of required job parameters against candidate resume evidence.</p>
              </div>

              {/* Requirement Comparison Table */}
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 text-xs uppercase font-bold text-neutral-500">
                    <tr>
                      <th className="p-3">Job Requirement / Skill</th>
                      <th className="p-3">Candidate Status</th>
                      <th className="p-3">Assessment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
                    {strongMatches.map((skill, idx) => (
                      <tr key={`match-${idx}`} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                        <td className="p-3 font-medium text-neutral-900 dark:text-white flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{skill}</span>
                        </td>
                        <td className="p-3 text-emerald-700 dark:text-emerald-400 font-semibold">Matched</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-500/20">
                            Strong Fit
                          </span>
                        </td>
                      </tr>
                    ))}

                    {skillGaps.map((gap, idx) => (
                      <tr key={`gap-${idx}`} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                        <td className="p-3 font-medium text-neutral-900 dark:text-white flex items-center gap-2">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>{gap}</span>
                        </td>
                        <td className="p-3 text-rose-600 dark:text-rose-400 font-semibold">Missing</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-300 text-[11px] font-bold border border-rose-500/20">
                            Gap Identified
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'recommendation' && (
            <div className="space-y-6">
              {/* Recommendation Tier Card */}
              <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3 bg-neutral-50 dark:bg-neutral-950">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">HIRING RECOMMENDATION TIER</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${recTier.badgeBg}`}>
                    {recTier.title} ({matchScore}% Match)
                  </span>
                </div>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
                  {recTier.desc}
                </p>
              </div>

              {/* Strengths, Risks & Verification Areas Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2 bg-white dark:bg-neutral-900">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 block">Candidate Key Strengths</span>
                  <ul className="space-y-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                    {strongMatches.map((s, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Proven competency in {s}.</span>
                      </li>
                    ))}
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{candidate.atsCompatibility}% ATS document readability rating.</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2 bg-white dark:bg-neutral-900">
                  <span className="font-bold text-rose-600 dark:text-rose-400 block">Identified Gaps & Risks</span>
                  <ul className="space-y-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                    {skillGaps.map((g, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>Missing required experience in {g}.</span>
                      </li>
                    ))}
                    {skillGaps.length === 0 && (
                      <li className="flex items-center gap-2 text-emerald-600">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>No critical risks or missing technologies detected.</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'interview' && (
            <div className="space-y-4">
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">JOB-SPECIFIC INTERVIEW FOCUS AREAS</h3>
                <p className="text-neutral-500 text-xs">Recommended technical verification questions targeting missing skill gaps and key job requirements.</p>
              </div>

              <div className="space-y-3">
                {skillGaps.map((gap, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-1.5 bg-white dark:bg-neutral-900">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-300">Gap Probe: {gap}</span>
                    </div>
                    <p className="font-semibold text-neutral-900 dark:text-white">
                      "Can you describe your experience working with {gap} or how you plan to get up to speed?"
                    </p>
                    <p className="text-neutral-600 dark:text-neutral-400 text-xs italic">
                      Focus: Verify candidate adaptability and foundational knowledge in {gap}.
                    </p>
                  </div>
                ))}

                {strongMatches.slice(0, 2).map((matchSkill, idx) => (
                  <div key={`match-q-${idx}`} className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-1.5 bg-white dark:bg-neutral-900">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">Strength Deep Dive: {matchSkill}</span>
                    </div>
                    <p className="font-semibold text-neutral-900 dark:text-white">
                      "Walk us through a production architecture where you utilized {matchSkill} to solve a complex engineering challenge."
                    </p>
                    <p className="text-neutral-600 dark:text-neutral-400 text-xs italic">
                      Focus: Validate practical depth and senior-level implementation details.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex items-center justify-between">
          <span className="text-neutral-500 text-xs">Resume Screening System Engine • Job-Specific Candidate Intelligence</span>
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

  return createPortal(modalContent, document.body);
};
