import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, Briefcase, Plus, Check, ArrowRight } from 'lucide-react';
import { useJobs } from '../context/JobContext';
import { usePrefetchJob } from '../hooks/usePrefetch';
import { ResumeAnalysis } from '../types';
import { useToast } from '../context/ToastContext';

interface MatchWithJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  resume?: ResumeAnalysis | null;
  candidate?: ResumeAnalysis | null;
}

export const MatchWithJobModal: React.FC<MatchWithJobModalProps> = ({
  isOpen,
  onClose,
  resume,
  candidate,
}) => {
  const targetResume = resume || candidate;
  const navigate = useNavigate();
  const { jobs, attachResumesToJob } = useJobs();
  const { prefetchJob } = usePrefetchJob();
  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id || '');
  const { toast } = useToast();

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

  if (!isOpen || !targetResume) return null;

  const handleMatchWithSelectedJob = () => {
    if (!selectedJobId) return;
    attachResumesToJob(selectedJobId, [targetResume.id]);
    const matchedJob = jobs.find((j) => j.id === selectedJobId);
    toast.success(`Attached ${targetResume.candidateName} to ${matchedJob?.title || 'target job'}`, { title: 'Job Matching Initiated' });
    onClose();
    navigate(`/analysis/job-match/${targetResume.id}/${selectedJobId}`);
  };

  const handleCreateNewJob = () => {
    onClose();
    navigate('/jobs/new');
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-overlay backdrop-blur-xs animate-in fade-in duration-200 select-none overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="relative w-full max-w-lg max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3.5rem)] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto select-text transform transition-all duration-200 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-950/50">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-purple-500/10 text-neutral-900 dark:text-neutral-100 text-xs font-semibold mb-1 border border-purple-500/20">
              <Briefcase className="w-3 h-3" />
              <span>JOB MATCHING</span>
            </div>
            <h2 className="text-xl font-bold font-serif-title text-neutral-900 dark:text-white">
              Match Resume With Job
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Matching <strong className="text-neutral-900 dark:text-neutral-100">{targetResume.candidateName}</strong> against target job requirements.
            </p>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Information Architecture Clarification Banner */}
          <div className="p-3.5 rounded-xl bg-purple-500/5 border border-purple-500/20 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-900 dark:text-white">General vs. Job-Specific Analysis</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300">
                General Quality: {targetResume.resumeScore}/100
              </span>
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 text-xs leading-relaxed">
              Selecting a target job compares <strong>{targetResume.candidateName}</strong>'s resume directly against job requirements to calculate <strong>Job Match Score</strong>, <strong>Matched Skills</strong>, and <strong>Skill Gaps</strong>.
            </p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Select Target Job Description
            </span>

            <button
              onClick={handleCreateNewJob}
              className="text-xs font-bold text-neutral-900 dark:text-white hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Job</span>
            </button>
          </div>

          {jobs.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl space-y-3">
              <p className="text-xs text-neutral-500">No jobs created yet.</p>
              <button
                onClick={handleCreateNewJob}
                className="px-4 py-2 bg-neutral-900 text-white font-semibold text-xs rounded-xl shadow-xs"
              >
                + Create Your First Job
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
              {jobs.map((job) => {
                const isSelected = job.id === selectedJobId;
                const isAlreadyAttached = job.attachedResumeIds.includes(targetResume.id);

                return (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJobId(job.id)}
                    onMouseEnter={() => prefetchJob(job.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-purple-500/5 border-purple-500 dark:border-purple-400 shadow-xs'
                        : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-400'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected 
                          ? 'border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white text-white dark:text-neutral-900' 
                          : 'border-neutral-300 dark:border-neutral-700'
                      }`}>
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                          {job.title}
                        </h4>
                        <p className="text-xs text-neutral-500 truncate">
                          {job.company || 'Company Confidential'} • {job.attachedResumeIds.length} candidate{job.attachedResumeIds.length === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>

                    {isAlreadyAttached && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 shrink-0">
                        Attached
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleMatchWithSelectedJob}
            disabled={!selectedJobId || jobs.length === 0}
            className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs rounded-xl shadow-xs disabled:opacity-40 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Match with Selected Job</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
