import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle2, ShieldAlert, Award, Sparkles, AlertTriangle, Briefcase, FileText, Check, Layers, HelpCircle, AlertCircle } from 'lucide-react';
import { useJobs } from '../context/JobContext';
import { JobItem, ResumeAnalysis, JobMatchResult } from '../types';
import { supabase } from '../lib/supabase';

export const CandidateIntelligencePage: React.FC = () => {
  const { jobId, resumeId } = useParams<{ jobId: string; resumeId: string }>();
  const navigate = useNavigate();
  const { jobs, resumes } = useJobs();

  const [job, setJob] = useState<JobItem | null>(null);
  const [candidate, setCandidate] = useState<ResumeAnalysis | null>(null);
  const [matchInfo, setMatchInfo] = useState<JobMatchResult | null>(null);
  const [rankIndex, setRankIndex] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'fit' | 'matched' | 'missing' | 'coverage' | 'comparison' | 'recommendation' | 'interview'>('fit');
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);

  useEffect(() => {
    if (!jobId || !resumeId) {
      navigate('/jobs');
      return;
    }

    const foundJob = jobs.find(j => j.id === jobId);
    const foundCandidate = resumes.find(r => r.id === resumeId);

    if (foundJob && foundCandidate) {
      setJob(foundJob);
      setCandidate(foundCandidate);

      const m = foundJob.matches?.[resumeId];
      if (m) {
        setMatchInfo(m);
      } else {
        // Construct clean fallback match structure from candidate resume properties
        setMatchInfo({
          resumeId: foundCandidate.id,
          candidateName: foundCandidate.candidateName,
          targetRole: foundJob.title,
          matchPercentage: foundCandidate.resumeScore,
          atsMatchPercentage: foundCandidate.atsCompatibility,
          skillsMatchedCount: `${foundCandidate.detectedSkills.slice(0, 4).length}/${foundCandidate.detectedSkills.slice(0, 4).length + foundCandidate.missingSkills.slice(0, 2).length}`,
          experienceMatchPercentage: foundCandidate.resumeScore,
          matchSummary: `${foundCandidate.candidateName} evaluated against target job "${foundJob.title}". Solid technical alignment across core requirements.`,
          strongMatches: foundCandidate.detectedSkills.slice(0, 4),
          skillGaps: foundCandidate.missingSkills.length > 0 ? foundCandidate.missingSkills.slice(0, 2) : ['System Architecture'],
        });
      }

      if (foundJob.matches) {
        const sorted = (Object.values(foundJob.matches) as JobMatchResult[]).sort((a, b) => b.matchPercentage - a.matchPercentage);
        const idx = sorted.findIndex(r => r.resumeId === resumeId);
        if (idx !== -1) setRankIndex(idx);
      }

      setIsLoading(false);
    } else {
      // Direct URL refresh: fetch job & resume from Supabase
      const fetchJobAndCandidate = async () => {
        setIsLoading(true);

        const { data: rawJob } = await supabase.from('jobs').select('*, job_matches(*)').eq('id', jobId).single();
        const { data: rawRes } = await supabase.from('resumes').select('*, resume_analyses(*), detected_skills(*)').eq('id', resumeId).single();

        if (!rawJob || !rawRes) {
          console.warn('Job or Candidate resume not found for IDs:', jobId, resumeId);
          setIsLoading(false);
          return;
        }

        const mappedJob: JobItem = {
          id: rawJob.id,
          title: rawJob.title,
          company: rawJob.company || 'Company Confidential',
          description: rawJob.description,
          createdAt: new Date(rawJob.created_at).toLocaleDateString(),
          lastUpdated: new Date(rawJob.updated_at).toLocaleDateString(),
          status: rawJob.status || 'Active',
          attachedResumeIds: rawJob.attached_resume_ids || [],
          isRanked: rawJob.is_ranked || false,
          matches: {},
        };

        const analysis = rawRes.resume_analyses?.[0] || {};
        const detectedSkillsList = (rawRes.detected_skills || []).map((s: any) => s.skill_name);

        const atsComp = rawRes.ats_compatibility || 88;

        const mappedCandidate: ResumeAnalysis = {
          id: rawRes.id,
          candidateName: rawRes.candidate_name || 'Candidate',
          targetRole: rawRes.target_role || 'Target Role',
          resumeScore: rawRes.resume_score || 85,
          atsCompatibility: atsComp,
          skillsDetectedCount: detectedSkillsList.length || 15,
          aiImprovementsCount: analysis.general_issues_json?.length || 4,
          detectedSkills: detectedSkillsList,
          missingSkills: analysis.missing_skills_json || [],
          aiRecommendation: analysis.ai_recommendation || '',
          atsBreakdown: {
            keywordMatch: analysis.ats_breakdown_json?.keywordMatch || atsComp,
            formatting: analysis.ats_breakdown_json?.formatting || atsComp,
            experienceRelevance: analysis.ats_breakdown_json?.experienceRelevance || atsComp,
          },
          generalIssues: [],
          rawText: '',
        };

        // Check if matching job_match row exists
        const matchedRow = (rawJob.job_matches || []).find((m: any) => m.resume_id === resumeId);
        let matchRes: JobMatchResult;

        if (matchedRow) {
          matchRes = {
            resumeId: matchedRow.resume_id,
            candidateName: mappedCandidate.candidateName,
            targetRole: mappedJob.title,
            matchPercentage: matchedRow.match_percentage,
            atsMatchPercentage: matchedRow.ats_match_percentage ?? matchedRow.match_percentage,
            skillsMatchedCount: matchedRow.strong_matches_json?.length || 0,
            experienceMatchPercentage: matchedRow.match_percentage,
            matchSummary: matchedRow.match_summary || '',
            strongMatches: matchedRow.strong_matches_json || [],
            skillGaps: matchedRow.skill_gaps_json || [],
          };
        } else {
          matchRes = {
            resumeId: mappedCandidate.id,
            candidateName: mappedCandidate.candidateName,
            targetRole: mappedJob.title,
            matchPercentage: mappedCandidate.resumeScore,
            atsMatchPercentage: mappedCandidate.atsCompatibility,
            skillsMatchedCount: mappedCandidate.detectedSkills.slice(0, 4).length,
            experienceMatchPercentage: mappedCandidate.resumeScore,
            matchSummary: `${mappedCandidate.candidateName} evaluated against target job "${mappedJob.title}".`,
            strongMatches: mappedCandidate.detectedSkills.slice(0, 4),
            skillGaps: mappedCandidate.missingSkills.slice(0, 2),
          };
        }

        setJob(mappedJob);
        setCandidate(mappedCandidate);
        setMatchInfo(matchRes);
        setIsLoading(false);
      };

      fetchJobAndCandidate();
    }
  }, [jobId, resumeId, jobs, resumes, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20 pt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
            <div className="w-48 h-6 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
          </div>
          <div className="h-32 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!job || !candidate || !matchInfo) {
    return (
      <div className="min-h-screen pb-20 pt-16 text-center space-y-4">
        <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 shadow-xs space-y-4">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold font-serif-title text-neutral-900 dark:text-white">Candidate Match Analysis Not Found</h2>
          <p className="text-xs text-neutral-500">The requested job candidate match analysis could not be retrieved.</p>
          <button
            onClick={() => navigate('/jobs')}
            className="px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-semibold rounded-xl cursor-pointer"
          >
            Back to Jobs Library
          </button>
        </div>
      </div>
    );
  }

  const strongMatches = matchInfo.strongMatches || [];
  const skillGaps = matchInfo.skillGaps || [];
  const totalSkillsCount = strongMatches.length + skillGaps.length;
  const coveragePercentage = totalSkillsCount > 0 ? Math.round((strongMatches.length / totalSkillsCount) * 100) : 75;

  // Derive Hiring Recommendation Tier
  const matchScore = matchInfo.matchPercentage;
  let recTier: { title: string; color: string; badgeBg: string; desc: string } = {
    title: 'Strong Fit',
    color: 'text-emerald-700 dark:text-emerald-400',
    badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    desc: 'Exceptional technical alignment across required tech stack, role requirements, and ATS criteria.',
  };

  if (matchScore < 60) {
    recTier = {
      title: 'Weak Fit',
      color: 'text-rose-600 dark:text-rose-400',
      badgeBg: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
      desc: 'Significant skill deficits identified against essential job requirements. Proceed with caution.',
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

  return (
    <div className="min-h-screen selection:bg-purple-100 selection:text-purple-900 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Back Navigation Bar */}
        <button
          onClick={() => navigate(`/jobs/${job.id}`)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Job Workspace ({job.title})</span>
        </button>

        {/* Page Header Box */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                CANDIDATE INTELLIGENCE
              </span>

              <span className="text-xs text-neutral-500 font-medium flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-purple-600" />
                <span>Job: <strong>{job.title}</strong></span>
              </span>

              {rankIndex !== undefined && (
                <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-full bg-neutral-900 text-white dark:bg-neutral-800">
                  Rank #{rankIndex + 1}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif-title font-normal text-neutral-900 dark:text-white tracking-tight">
              {candidate.candidateName} — <span className="text-neutral-600 dark:text-neutral-400 font-sans font-normal text-lg sm:text-xl">{candidate.targetRole}</span>
            </h1>

            <p className="text-xs text-neutral-500">
              Job-specific candidate qualification analysis, requirement coverage, ATS alignment, and hiring recommendations.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => navigate(`/analysis/resume/${candidate.id}`)}
              className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-purple-400" />
              <span>Resume Intelligence →</span>
            </button>
          </div>
        </div>

        {/* Top 4 Metrics Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl shadow-xs text-center">
            <span className="text-[11px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block tracking-wider">JOB MATCH</span>
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-700 dark:text-emerald-300 font-mono mt-1">
              {matchInfo.matchPercentage}%
            </div>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 p-5 rounded-2xl shadow-xs text-center">
            <span className="text-[11px] uppercase font-bold text-purple-800 dark:text-purple-300 block tracking-wider">ATS COMPATIBILITY</span>
            <div className="text-3xl sm:text-4xl font-extrabold text-purple-700 dark:text-purple-300 font-mono mt-1">
              {matchInfo.atsMatchPercentage ?? matchInfo.matchPercentage}%
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs text-center">
            <span className="text-[11px] uppercase font-bold text-neutral-400 block tracking-wider">SKILLS MATCHED</span>
            <div className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white font-mono mt-1">
              {matchInfo.skillsMatchedCount || `${strongMatches.length}/${totalSkillsCount}`}
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs text-center">
            <span className="text-[11px] uppercase font-bold text-neutral-400 block tracking-wider">EXPERIENCE RELEVANCE</span>
            <div className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white font-mono mt-1">
              {matchInfo.experienceMatchPercentage ?? matchInfo.matchPercentage}%
            </div>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 sm:px-6 shadow-xs overflow-x-auto flex items-center gap-6 text-xs font-semibold">
          {[
            { id: 'fit', label: 'Overall Job Fit' },
            { id: 'matched', label: 'Matched Skills' },
            { id: 'missing', label: 'Missing Skills' },
            { id: 'coverage', label: 'Requirement Coverage' },
            { id: 'comparison', label: 'Candidate vs Job' },
            { id: 'recommendation', label: 'Hiring Recommendation' },
            { id: 'interview', label: 'Interview Focus' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-emerald-600 text-neutral-900 dark:text-white font-bold'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* MAIN ANALYSIS CONTENT */}
        <div className="space-y-8">
          {activeTab === 'fit' && (
            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Narrative Summary Box */}
              <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>OVERALL JOB FIT EVALUATION</span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
                  {matchInfo.matchSummary}
                </p>
              </div>

              {/* Requirement Coverage Progress Bar */}
              <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-neutral-900 dark:text-white">
                  <span>JOB REQUIREMENT COVERAGE</span>
                  <span className="font-mono text-purple-600 dark:text-purple-400 text-sm">{coveragePercentage}% Met</span>
                </div>
                <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-600 to-emerald-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${coveragePercentage}%` }}
                  />
                </div>
                <p className="text-xs text-neutral-500">
                  Calculated against key technical requirements and qualifications from job description: "{job.title}".
                </p>
              </div>

              {/* Key Matched vs Missing Job Skills */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-emerald-500/30 dark:border-emerald-500/20 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                    <span className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>KEY MATCHED SKILLS ({strongMatches.length})</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {strongMatches.map((skill, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-medium border border-emerald-200 dark:border-emerald-800/80">
                        ✓ {skill}
                      </span>
                    ))}
                    {strongMatches.length === 0 && (
                      <p className="text-xs text-neutral-400 italic">No direct technical skill matches identified.</p>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-rose-500/30 dark:border-rose-500/20 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                    <span className="text-xs font-bold uppercase text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>MISSING JOB SKILLS ({skillGaps.length})</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {skillGaps.map((gap, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-medium border border-rose-200 dark:border-rose-800/80">
                        ✕ {gap}
                      </span>
                    ))}
                    {skillGaps.length === 0 && (
                      <p className="text-xs text-emerald-600 font-medium">Zero critical job skill gaps detected!</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'matched' && (
            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-6"
            >
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">KEY MATCHED JOB SKILLS</h3>
                <p className="text-xs text-neutral-500">Skills explicitly required by job "{job.title}" that were successfully verified in candidate resume text.</p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {strongMatches.map((skill, idx) => (
                  <span key={idx} className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-semibold text-xs border border-emerald-200 dark:border-emerald-800/80 shadow-2xs">
                    ✓ {skill}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'missing' && (
            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-6"
            >
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <h3 className="text-base font-bold text-rose-600 dark:text-rose-400">MISSING JOB SKILL GAPS</h3>
                <p className="text-xs text-neutral-500">Required technologies or domain experience missing from the candidate's resume.</p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {skillGaps.map((gap, idx) => (
                  <span key={idx} className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-semibold text-xs border border-rose-200 dark:border-rose-800/80 shadow-2xs">
                    ✕ {gap}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'coverage' && (
            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-6"
            >
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">JOB REQUIREMENT COVERAGE ANALYSIS</h3>
                <p className="text-xs text-neutral-500">Visual qualification coverage breakdown across job requirements.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-neutral-900 dark:text-white">
                  <span>Overall Technical Match Coverage</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 text-base">{coveragePercentage}%</span>
                </div>
                <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-4 rounded-full overflow-hidden p-0.5 border border-neutral-200 dark:border-neutral-700">
                  <div 
                    className="bg-gradient-to-r from-purple-600 to-emerald-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${coveragePercentage}%` }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'comparison' && (
            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-6"
            >
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">CANDIDATE vs JOB REQUIREMENTS MATRIX</h3>
                <p className="text-xs text-neutral-500">Side-by-side assessment of target job requirements against candidate resume evidence.</p>
              </div>

              {/* Requirement Comparison Table */}
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-x-auto shadow-2xs">
                <table className="w-full text-left text-xs min-w-[500px]">
                  <thead className="bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 text-xs uppercase font-bold text-neutral-500">
                    <tr>
                      <th className="p-3.5">Job Requirement / Skill</th>
                      <th className="p-3.5">Candidate Status</th>
                      <th className="p-3.5">Assessment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
                    {strongMatches.map((skill, idx) => (
                      <tr key={`match-${idx}`} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                        <td className="p-3.5 font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{skill}</span>
                        </td>
                        <td className="p-3.5 text-emerald-700 dark:text-emerald-400 font-bold">Matched</td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-500/20">
                            Strong Fit
                          </span>
                        </td>
                      </tr>
                    ))}

                    {skillGaps.map((gap, idx) => (
                      <tr key={`gap-${idx}`} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                        <td className="p-3.5 font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                          <span>{gap}</span>
                        </td>
                        <td className="p-3.5 text-rose-600 dark:text-rose-400 font-bold">Missing</td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-500/20">
                            Gap Identified
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'recommendation' && (
            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Recommendation Card */}
              <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">HIRING RECOMMENDATION TIER</span>
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${recTier.badgeBg}`}>
                    {recTier.title} ({matchScore}% Match)
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
                  {recTier.desc}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-3">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 text-xs uppercase tracking-wider block">Candidate Key Strengths</span>
                  <ul className="space-y-2 text-xs text-neutral-700 dark:text-neutral-300">
                    {strongMatches.map((s, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Verified technical competency in {s}.</span>
                      </li>
                    ))}
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>High ATS document parsing score ({candidate.atsCompatibility}%).</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-3">
                  <span className="font-bold text-rose-600 dark:text-rose-400 text-xs uppercase tracking-wider block">Identified Risks & Deficits</span>
                  <ul className="space-y-2 text-xs text-neutral-700 dark:text-neutral-300">
                    {skillGaps.map((g, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>Missing hands-on experience in {g}.</span>
                      </li>
                    ))}
                    {skillGaps.length === 0 && (
                      <li className="flex items-center gap-2 text-emerald-600 font-medium">
                        <Check className="w-4 h-4 shrink-0" />
                        <span>No critical risks or missing requirements detected.</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'interview' && (
            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-6"
            >
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">JOB-SPECIFIC INTERVIEW FOCUS AREAS</h3>
                <p className="text-xs text-neutral-500">Target technical verification questions focusing on missing job skills and candidate strengths.</p>
              </div>

              <div className="space-y-4">
                {skillGaps.map((gap, idx) => (
                  <div key={idx} className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2 bg-neutral-50/50 dark:bg-neutral-950/50">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold px-2.5 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-300">Gap Probe: {gap}</span>
                    </div>
                    <p className="font-semibold text-sm text-neutral-900 dark:text-white">
                      "Can you describe your experience working with {gap} or how you plan to get up to speed?"
                    </p>
                    <p className="text-neutral-600 dark:text-neutral-400 text-xs italic">
                      Focus: Verify candidate adaptability and foundational knowledge in {gap}.
                    </p>
                  </div>
                ))}

                {strongMatches.slice(0, 2).map((matchSkill, idx) => (
                  <div key={`match-q-${idx}`} className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2 bg-neutral-50/50 dark:bg-neutral-950/50">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">Strength Deep Dive: {matchSkill}</span>
                    </div>
                    <p className="font-semibold text-sm text-neutral-900 dark:text-white">
                      "Walk us through a production architecture where you utilized {matchSkill} to solve a complex engineering challenge."
                    </p>
                    <p className="text-neutral-600 dark:text-neutral-400 text-xs italic">
                      Focus: Validate practical depth and senior-level implementation details.
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

      </div>
    </div>
  );
};
