import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Briefcase, ArrowLeft, Plus, Eye, Trash2, Sparkles, CheckCircle2, ShieldAlert, BarChart2, RefreshCw } from 'lucide-react';
import { useJobs } from '../context/JobContext';
import { AddResumesModal } from '../components/AddResumesModal';
import { CandidateIntelligenceModal } from '../components/CandidateIntelligenceModal';
import { CandidateRanking } from '../components/CandidateRanking';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { ReRankConfirmModal } from '../components/ReRankConfirmModal';
import { ResumeAnalysis, JobMatchResult } from '../types';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';

export const JobWorkspacePage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { getJob, resumes, detachResumeFromJob, rankResumesForJob } = useJobs();

  const [addResumesModalOpen, setAddResumesModalOpen] = useState(false);
  const [selectedCandidateModal, setSelectedCandidateModal] = useState<ResumeAnalysis | null>(null);
  const [resumeToDetach, setResumeToDetach] = useState<ResumeAnalysis | null>(null);
  const [detachModalOpen, setDetachModalOpen] = useState(false);
  const [isRanking, setIsRanking] = useState(false);
  const [reRankConfirmOpen, setReRankConfirmOpen] = useState(false);
  const rankingAbortControllerRef = React.useRef<AbortController | null>(null);

  const job = jobId ? getJob(jobId) : undefined;

  if (!job) {
    return (
      <div className="min-h-screen bg-page text-neutral-900 dark:text-neutral-100 flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-xl font-bold font-serif-title">Job Not Found</h2>
          <p className="text-xs text-neutral-500">
            The requested job screening workspace does not exist or was deleted.
          </p>
          <button
            onClick={() => navigate('/jobs')}
            className="px-4 py-2 bg-neutral-900 text-white rounded-xl font-semibold text-xs cursor-pointer"
          >
            Return to Jobs Library
          </button>
        </div>
      </div>
    );
  }

  // Attached resume objects from Resume Library
  const attachedResumes = job.attachedResumeIds
    .map(id => resumes.find(r => r.id === id))
    .filter((r): r is ResumeAnalysis => r !== undefined);

  const { toast } = useToast();
  const { triggerWithConfirmation } = useTheme();

  const handleCancelRanking = () => {
    if (rankingAbortControllerRef.current) {
      rankingAbortControllerRef.current.abort();
      rankingAbortControllerRef.current = null;
    }
    setIsRanking(false);
  };

  // Core ranking executor — called after all confirmation gates pass
  const executeRanking = () => {
    if (!job || attachedResumes.length === 0) return;

    triggerWithConfirmation({
      title: 'Confirm Candidate Ranking',
      message: `Re-ranking ${attachedResumes.length} candidate resume(s) for "${job.title}" will run deep neural matching and consume credits.`,
      creditCost: attachedResumes.length,
      onConfirm: async () => {
        const controller = new AbortController();
        rankingAbortControllerRef.current = controller;

        setIsRanking(true);

        try {
          await rankResumesForJob(job.id, controller.signal);
          if (controller.signal.aborted) {
            return;
          }
          setTimeout(() => {
            if (controller.signal.aborted) return;
            setIsRanking(false);
            toast.success('AI candidate ranking and skill alignment matrix generated!', { title: 'Ranking Complete' });
          }, 800);
        } catch (err: any) {
          if (controller.signal.aborted || err?.name === 'AbortError') {
            return;
          }
          let errMsg = 'Failed to rank candidates.';
          if (typeof err === 'object' && err !== null) {
            if (err.requiredCredits !== undefined && err.availableCredits !== undefined) {
              errMsg = `Insufficient credits. Ranking ${attachedResumes.length} candidate resume(s) requires ${err.requiredCredits} credit(s), but you have ${err.availableCredits}.`;
            } else if (err.message && typeof err.message === 'string') {
              errMsg = err.message;
            } else if (err.error?.message && typeof err.error.message === 'string') {
              errMsg = err.error.message;
            }
          } else if (typeof err === 'string') {
            errMsg = err;
          }
          setIsRanking(false);
          toast.error(errMsg, { title: 'Ranking Failed' });
        }
      }
    });
  };

  const handleRunRanking = () => {
    if (!job || attachedResumes.length === 0) return;

    // Detect duplicate ranking: job is already ranked AND nothing has changed
    if (job.isRanked && job.matches) {
      const previouslyRankedIds = new Set(Object.keys(job.matches));
      const currentIds = new Set(attachedResumes.map(r => r.id).filter((id): id is string => typeof id === 'string'));
      const sameResumes =
        previouslyRankedIds.size === currentIds.size &&
        Array.from(currentIds).every((id: string) => previouslyRankedIds.has(id));

      if (sameResumes) {
        // Show the custom "nothing has changed" confirmation modal
        setReRankConfirmOpen(true);
        return;
      }
    }

    // No duplicate detected — proceed with normal ranking flow
    executeRanking();
  };

  // Convert job matches into sorted candidate list if ranked
  const rankedResults: JobMatchResult[] = job.matches
    ? (Object.values(job.matches) as JobMatchResult[]).sort((a, b) => b.matchPercentage - a.matchPercentage)
    : [];

  return (
    <div className="min-h-screen selection:bg-purple-100 selection:text-purple-900 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-8">
        
        {/* Back Button */}
        <button
          onClick={() => navigate('/jobs')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Jobs Library</span>
        </button>

        {/* Header Section */}
        <div className="border-b border-neutral-200/50 dark:border-neutral-800/50 pb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-neutral-900 dark:text-neutral-100 text-xs font-semibold mb-2 border border-purple-500/20">
            <Briefcase className="w-3.5 h-3.5" />
            <span>JOB SCREENING</span>
          </div>
          <h1 className="text-3xl font-serif-title font-normal text-neutral-900 dark:text-white tracking-tight">
            {job.title}
          </h1>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
            {job.company ? `${job.company} · ` : ''}Created {job.createdAt} · {attachedResumes.length} resume{attachedResumes.length === 1 ? '' : 's'} attached
          </p>
        </div>

        {/* Top Grid: Job Description + Resumes Management */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Job Description Display Box */}
          <div className="lg:col-span-7 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                Job Description
              </span>
              <span className="text-xs text-neutral-400">Target Role Benchmark</span>
            </div>

            <div className="prose dark:prose-invert max-w-none max-h-[420px] overflow-y-auto pr-1">
              <pre className="font-sans text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap font-normal">
                {job.description}
              </pre>
            </div>
          </div>

          {/* RIGHT: Attached Resumes List & Actions */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                  Attached Resumes ({attachedResumes.length})
                </span>

                <button
                  onClick={() => setAddResumesModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Resumes</span>
                </button>
              </div>

              {attachedResumes.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl space-y-3">
                  <p className="text-xs text-neutral-500">
                    No resumes attached to this job yet.
                  </p>
                  <button
                    onClick={() => setAddResumesModalOpen(true)}
                    className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Select Resumes from Library
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {attachedResumes.map((resume) => {
                    const matchInfo = job.matches?.[resume.id];

                    return (
                      <div
                        key={resume.id}
                        className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <h4 className="font-bold text-neutral-900 dark:text-white truncate">
                            {resume.candidateName}
                          </h4>
                          <p className="text-xs text-neutral-500 truncate">
                            {resume.targetRole}
                          </p>
                          {matchInfo ? (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-[11px] border border-emerald-500/20">
                              {matchInfo.matchPercentage}% Match
                            </span>
                          ) : (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[11px] font-medium">
                              Not ranked
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            setResumeToDetach(resume);
                            setDetachModalOpen(true);
                          }}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg transition-colors shrink-0 cursor-pointer"
                          title="Remove from job"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Ranking CTA Box */}
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800/80 text-xs text-neutral-600 dark:text-neutral-400">
                  <p>
                    <strong>Job:</strong> {job.title} | <strong>Resumes:</strong> {attachedResumes.length} selected
                  </p>
                </div>

                <button
                  onClick={handleRunRanking}
                  disabled={attachedResumes.length === 0 || isRanking}
                  className={`w-full py-3 font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 relative overflow-hidden ${
                    isRanking
                      ? 'bg-neutral-800 dark:bg-neutral-200 text-neutral-400 dark:text-neutral-600 cursor-wait'
                      : 'bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 text-white cursor-pointer disabled:opacity-40'
                  }`}
                >
                  {isRanking && (
                    <div className="absolute inset-0 bg-white/5 dark:bg-black/5 animate-pulse pointer-events-none"></div>
                  )}
                  {isRanking ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
                      <span className="relative z-10">Ranking Resumes...</span>
                    </>
                  ) : job.isRanked ? (
                    <>
                      <BarChart2 className="w-4 h-4" />
                      <span className="relative z-10">Re-Rank Resumes →</span>
                    </>
                  ) : (
                    <>
                      <BarChart2 className="w-4 h-4" />
                      <span className="relative z-10">Rank Resumes →</span>
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>

        </div>

        {/* SCREENING RESULTS SECTION */}
        {job.isRanked ? (
          <div className="pt-8 border-t border-neutral-200/80 dark:border-neutral-800/80 animate-in fade-in duration-300">
            <CandidateRanking
              jobTitle={job.title}
              matches={rankedResults}
              onViewCandidate={(resumeId) => {
                navigate(`/analysis/job-match/${resumeId}/${job.id}`);
              }}
            />
          </div>
        ) : (
          <div className="pt-8 border-t border-neutral-200/80 dark:border-neutral-800/80">
            <div className="p-8 text-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-2">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                {attachedResumes.length > 0 ? 'Ready to rank' : 'No resumes attached'}
              </h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                {attachedResumes.length > 0
                  ? `${attachedResumes.length} resume${attachedResumes.length === 1 ? '' : 's'} attached to this job. Click "Rank Resumes" to analyze them.`
                  : 'Add resumes to start candidate screening.'}
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Modal for selecting resumes */}
      <AddResumesModal
        isOpen={addResumesModalOpen}
        onClose={() => setAddResumesModalOpen(false)}
        jobId={job.id}
        alreadyAttachedIds={job.attachedResumeIds}
      />

      {/* Remove from job confirmation modal */}
      <DeleteConfirmModal
        isOpen={detachModalOpen}
        onClose={() => {
          setDetachModalOpen(false);
          setResumeToDetach(null);
        }}
        onConfirm={() => {
          if (resumeToDetach && job) {
            detachResumeFromJob(job.id, resumeToDetach.id);
            toast.info(`Candidate "${resumeToDetach.candidateName}" removed from job`, { title: 'Resume Removed' });
          }
          setDetachModalOpen(false);
          setResumeToDetach(null);
        }}
        title="Remove Resume from Job"
        itemName={resumeToDetach?.candidateName}
        itemType="resume"
        description="Are you sure you want to remove this resume from this job workspace? The resume will remain stored in your Resume Library."
        confirmText="Remove Resume"
      />



      {/* Re-rank duplicate detection confirmation modal */}
      <ReRankConfirmModal
        isOpen={reRankConfirmOpen}
        onClose={() => setReRankConfirmOpen(false)}
        onConfirm={executeRanking}
      />
    </div>
  );
};
