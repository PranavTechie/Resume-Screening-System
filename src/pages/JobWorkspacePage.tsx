import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Briefcase, ArrowLeft, Plus, Trash2, BarChart2, RefreshCw } from 'lucide-react';
import { useJobs } from '../context/JobContext';
import { AddResumesModal } from '../components/AddResumesModal';
import { RankingTable } from '../components/RankingTable';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { ReRankConfirmModal } from '../components/ReRankConfirmModal';
import { BatchProgressPanel } from '../components/BatchProgressPanel';
import { ResumeAnalysis, JobMatchResult, CandidateStatus } from '../types';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { useVisibleBatches } from '../hooks/useBatches';
import { useBlindScreening } from '../hooks/useBlindScreening';
import { apiClient } from '../lib/api';
import { friendlyError } from '../utils/errorMessages';

export const JobWorkspacePage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { getJob, resumes, detachResumesFromJob, rankResumesForJob, deleteResumes, updateCandidateStatus, refreshData } = useJobs();
  const { toast } = useToast();
  const { triggerWithConfirmation } = useTheme();
  const [blind, setBlind] = useBlindScreening();
  const batches = useVisibleBatches({ kind: 'rank_resume', jobId });

  const [addResumesModalOpen, setAddResumesModalOpen] = useState(false);
  const [detachIds, setDetachIds] = useState<string[]>([]);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [activeBatchIds, setActiveBatchIds] = useState<Set<string>>(new Set());
  const [reRankConfirmOpen, setReRankConfirmOpen] = useState(false);

  const job = jobId ? getJob(jobId) : undefined;

  const attachedResumes = useMemo(
    () => (job?.attachedResumeIds || []).map((id) => resumes.find((r) => r.id === id)).filter((r): r is ResumeAnalysis => r !== undefined),
    [job?.attachedResumeIds, resumes]
  );
  const rankedResults: JobMatchResult[] = useMemo(
    () => (job?.matches ? (Object.values(job.matches) as JobMatchResult[]).filter((m) => job.attachedResumeIds.includes(m.resumeId)) : []),
    [job?.matches, job?.attachedResumeIds]
  );

  if (!job) {
    return (
      <div className="min-h-screen bg-page text-neutral-900 dark:text-neutral-100 flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-xl font-bold font-serif-title">Job Not Found</h2>
          <p className="text-xs text-neutral-500">The requested job screening workspace does not exist or was deleted.</p>
          <button onClick={() => navigate('/jobs')} className="px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 rounded-full font-semibold text-xs cursor-pointer">
            Return to Jobs Library
          </button>
        </div>
      </div>
    );
  }

  const isRanking = starting || activeBatchIds.size > 0;
  const blindName = (id: string, fallback: string) => {
    if (!blind) return fallback;
    const idx = attachedResumes.findIndex((r) => r.id === id);
    return `Candidate ${idx + 1}`;
  };

  const executeRanking = () => {
    if (attachedResumes.length === 0) return;
    triggerWithConfirmation({
      title: 'Confirm candidate ranking',
      message: `Ranking ${attachedResumes.length} candidate resume(s) for "${job.title}" uses 1 credit per candidate. Duplicate candidates and failures are refunded.`,
      creditCost: attachedResumes.length,
      onConfirm: async () => {
        setStarting(true);
        try {
          const batch = await rankResumesForJob(job.id);
          batches.add(batch.id);
          setActiveBatchIds((prev) => new Set(prev).add(batch.id));
          toast.success(`Ranking ${batch.creditsReserved} candidate(s) in the background.`, { title: 'Ranking started' });
        } catch (err: any) {
          toast.error(friendlyError(err, 'Failed to start ranking.'), { title: 'Ranking not started' });
        } finally {
          setStarting(false);
        }
      },
    });
  };

  const handleRunRanking = () => {
    if (attachedResumes.length === 0 || isRanking) return;
    if (job.isRanked && job.matches) {
      const previously = new Set(Object.keys(job.matches));
      const same = previously.size === attachedResumes.length && attachedResumes.every((r) => previously.has(r.id));
      if (same) {
        setReRankConfirmOpen(true);
        return;
      }
    }
    executeRanking();
  };

  const handleStatusChange = async (ids: string[], status: CandidateStatus) => {
    await updateCandidateStatus(job.id, ids, status);
  };

  const confirmDetach = async () => {
    await detachResumesFromJob(job.id, detachIds);
    toast.info(`${detachIds.length} candidate(s) removed from this job. Resumes stay in your library.`);
    setDetachIds([]);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    const n = await deleteResumes(deleteIds);
    setDeleting(false);
    setDeleteIds([]);
    if (n) toast.success(`${n} resume(s) permanently deleted.`);
  };

  return (
    <div className="min-h-screen selection:bg-purple-100 selection:text-purple-900 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-8">
        <button onClick={() => navigate('/jobs')} className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Jobs Library</span>
        </button>

        <div className="border-b border-neutral-200/50 dark:border-neutral-800/50 pb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-neutral-900 dark:text-neutral-100 text-xs font-semibold mb-2 border border-purple-500/20">
            <Briefcase className="w-3.5 h-3.5" />
            <span>JOB SCREENING</span>
          </div>
          <h1 className="text-3xl font-serif-title font-normal text-neutral-900 dark:text-white tracking-tight break-words">{job.title}</h1>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
            {job.company ? `${job.company} · ` : ''}Created {job.createdAt} · {attachedResumes.length} resume{attachedResumes.length === 1 ? '' : 's'} attached
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">Job Description</span>
              <span className="text-xs text-neutral-400">Target role benchmark</span>
            </div>
            <div className="max-w-none max-h-[420px] overflow-y-auto pr-1">
              <pre className="font-sans text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap font-normal">{job.description}</pre>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">Attached Resumes ({attachedResumes.length})</span>
                <button onClick={() => setAddResumesModalOpen(true)} className="px-3 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Resumes</span>
                </button>
              </div>

              {attachedResumes.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl space-y-3">
                  <p className="text-xs text-neutral-500">No resumes attached to this job yet.</p>
                  <button onClick={() => setAddResumesModalOpen(true)} className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg text-xs font-semibold cursor-pointer">
                    Select Resumes from Library
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {attachedResumes.map((resume) => {
                    const matchInfo = job.matches?.[resume.id];
                    return (
                      <div key={resume.id} className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <h4 className="font-bold text-neutral-900 dark:text-white truncate">{blindName(resume.id, resume.candidateName)}</h4>
                          <p className="text-xs text-neutral-500 truncate">{resume.targetRole}</p>
                          {matchInfo ? (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-[11px] border border-emerald-500/20">{matchInfo.matchPercentage}% Match</span>
                          ) : (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[11px] font-medium">Not ranked</span>
                          )}
                        </div>
                        <button
                          onClick={() => setDetachIds([resume.id])}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg transition-colors shrink-0 cursor-pointer"
                          title="Remove from job"
                          aria-label={`Remove ${blindName(resume.id, resume.candidateName)} from job`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
                <p className="text-[11px] text-neutral-500">
                  1 credit per candidate. Same email/phone twice is ranked once. Failed items are refunded automatically.
                </p>
                <button
                  onClick={handleRunRanking}
                  disabled={attachedResumes.length === 0 || isRanking}
                  className="w-full py-3 font-semibold text-xs rounded-full shadow-xs transition-all flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isRanking ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin motion-reduce:animate-none text-purple-400" />
                      <span>Ranking in progress…</span>
                    </>
                  ) : (
                    <>
                      <BarChart2 className="w-4 h-4" />
                      <span>{job.isRanked ? 'Re-rank' : 'Rank'} {attachedResumes.length} resume{attachedResumes.length === 1 ? '' : 's'} →</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {batches.ids.length > 0 && (
          <div className="space-y-3">
            {batches.ids.map((id) => (
              <BatchProgressPanel
                key={id}
                batchId={id}
                blind={blind}
                onProgress={(b) => {
                  setActiveBatchIds((prev) => {
                    const next = new Set(prev);
                    if (b.status === 'active') next.add(b.id);
                    else next.delete(b.id);
                    return next;
                  });
                  void refreshData({ silent: true });
                }}
                onFinished={(b) => {
                  setActiveBatchIds((prev) => {
                    const next = new Set(prev);
                    next.delete(b.id);
                    return next;
                  });
                  void refreshData({ silent: true });
                  toast.success(`${b.counts.done || 0} of ${b.total} candidate(s) ranked.`, { title: 'Ranking finished' });
                }}
                onDismiss={() => batches.remove(id)}
              />
            ))}
          </div>
        )}

        {rankedResults.length > 0 ? (
          <div className="pt-8 border-t border-neutral-200/80 dark:border-neutral-800/80">
            <RankingTable
              jobTitle={job.title}
              matches={rankedResults}
              blind={blind}
              onToggleBlind={setBlind}
              onView={(resumeId) => navigate(`/analysis/job-match/${resumeId}/${job.id}`)}
              onStatusChange={handleStatusChange}
              onRemoveFromJob={(ids) => setDetachIds(ids)}
              onDeleteResumes={(ids) => setDeleteIds(ids)}
              onExportCsv={async () => {
                try {
                  await apiClient.exportRankingCsv(job.id, blind);
                } catch (err: any) {
                  toast.error(friendlyError(err, 'Could not export CSV.'));
                }
              }}
            />
          </div>
        ) : (
          <div className="pt-8 border-t border-neutral-200/80 dark:border-neutral-800/80">
            <div className="p-8 text-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-2">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">{attachedResumes.length > 0 ? (isRanking ? 'Ranking in progress' : 'Ready to rank') : 'No resumes attached'}</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                {attachedResumes.length > 0
                  ? isRanking
                    ? 'Results appear here as each candidate finishes.'
                    : `${attachedResumes.length} resume${attachedResumes.length === 1 ? '' : 's'} attached to this job. Click "Rank" to analyze them.`
                  : 'Add resumes to start candidate screening.'}
              </p>
            </div>
          </div>
        )}
      </div>

      <AddResumesModal isOpen={addResumesModalOpen} onClose={() => setAddResumesModalOpen(false)} jobId={job.id} alreadyAttachedIds={job.attachedResumeIds} />

      <DeleteConfirmModal
        isOpen={detachIds.length > 0}
        onClose={() => setDetachIds([])}
        onConfirm={confirmDetach}
        title={detachIds.length > 1 ? `Remove ${detachIds.length} candidates from job` : 'Remove resume from job'}
        itemName={detachIds.length === 1 ? blindName(detachIds[0], attachedResumes.find((r) => r.id === detachIds[0])?.candidateName || '') : undefined}
        itemType="resume"
        description="They will be removed from this job and its ranking. The resumes stay in your Resume Library."
        confirmText="Remove"
      />

      <DeleteConfirmModal
        isOpen={deleteIds.length > 0}
        onClose={() => !deleting && setDeleteIds([])}
        onConfirm={confirmDelete}
        isDeleting={deleting}
        title={`Delete ${deleteIds.length} resume${deleteIds.length === 1 ? '' : 's'} permanently`}
        itemType="resume"
        description="This deletes the resumes, their analyses, all job rankings and the stored files from your account. This cannot be undone."
        confirmText="Delete permanently"
      />

      <ReRankConfirmModal isOpen={reRankConfirmOpen} onClose={() => setReRankConfirmOpen(false)} onConfirm={executeRanking} />
    </div>
  );
};
