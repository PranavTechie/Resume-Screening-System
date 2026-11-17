import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Upload, FileText, Plus, Sparkles, AlertCircle } from 'lucide-react';
import { useJobs } from '../context/JobContext';
import { useToast } from '../context/ToastContext';
import { AiAnalysisModal } from './AiAnalysisModal';
import { validateResumeFile, ALLOWED_ACCEPT_STRING, HELPER_TEXT } from '../utils/resumeParser';

interface AddResumesModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  alreadyAttachedIds: string[];
}

export const AddResumesModal: React.FC<AddResumesModalProps> = ({
  isOpen,
  onClose,
  jobId,
  alreadyAttachedIds,
}) => {
  const { resumes, attachResumesToJob, uploadResume } = useJobs();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');
  const [activeFile, setActiveFile] = useState<File | null>(null);
  const [modalStage, setModalStage] = useState<'processing' | 'complete' | 'error'>('processing');
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const navigationTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const { toast } = useToast();

  // Viewport scroll locking and preservation
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollY = window.scrollY;

    // Compensate for scrollbar disappearance to prevent page shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isUploading) {
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
  }, [isOpen, isUploading, onClose]);

  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleAddSelected = () => {
    if (selectedIds.length > 0) {
      attachResumesToJob(jobId, selectedIds);
      toast.success(`${selectedIds.length} candidate resume(s) attached to job`, { title: 'Candidates Attached' });
      onClose();
    }
  };

  const processResumeFile = async (file: File) => {
    setUploadError(null);

    const validation = validateResumeFile(file);
    if (!validation.valid) {
      const errMsg = validation.error || 'Invalid file uploaded.';
      setUploadError(errMsg);
      toast.error(errMsg, { title: 'Upload Failed' });
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setActiveFile(file);
    setModalStage('processing');
    setIsUploading(true);

    try {
      const newResume = await uploadResume(file, controller.signal);

      if (controller.signal.aborted) {
        setIsUploading(false);
        setActiveFile(null);
        setModalStage('processing');
        return;
      }
      if (newResume) {
        await attachResumesToJob(jobId, [newResume.id]);
        setModalStage('complete');
        if (navigationTimeoutRef.current) clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = setTimeout(() => {
          if (controller.signal.aborted) return;
          setIsUploading(false);
          setActiveFile(null);
          onClose();
        }, 500);
      } else {
        setIsUploading(false);
        setActiveFile(null);
        setModalStage('processing');
      }
    } catch (err: any) {
      if (controller.signal.aborted || err?.name === 'AbortError' || err?.code === 'CANCELLED') {
        setIsUploading(false);
        setActiveFile(null);
        setModalStage('processing');
        return;
      }
      const errMsg = err?.message || 'Failed to upload and analyze resume.';
      setUploadError(errMsg);
      setModalStage('error');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    e.target.value = '';
    processResumeFile(file);
  };

  const handleCancelAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }
    setIsUploading(false);
    setActiveFile(null);
    setModalStage('processing');
    setUploadError(null);
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-overlay backdrop-blur-xs animate-in fade-in duration-200 select-none overflow-y-auto"
      onClick={() => {
        if (!isUploading) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-resumes-modal-title"
    >
      <div 
        className="relative w-full max-w-xl max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3.5rem)] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto select-text transform transition-all duration-200 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-950/50 shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-purple-500/10 text-neutral-900 dark:text-neutral-100 text-xs font-semibold mb-1 border border-purple-500/20">
              <Plus className="w-3 h-3" />
              <span>CANDIDATE SELECTION</span>
            </div>
            <h2 id="add-resumes-modal-title" className="text-xl font-bold font-serif-title text-neutral-900 dark:text-white">
              Attach Resumes to Job
            </h2>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 px-6 bg-white dark:bg-neutral-900 shrink-0">
          <button
            onClick={() => setActiveTab('library')}
            className={`py-3 text-xs font-semibold border-b-2 mr-6 transition-colors cursor-pointer ${
              activeTab === 'library'
                ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Select from Library ({resumes.length})
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'upload'
                ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Upload New Resume
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0 space-y-4">
          {activeTab === 'library' ? (
            <div className="space-y-3">
              <p className="text-xs text-neutral-500">
                Choose candidates from your Resume Library to attach to this screening workflow.
              </p>

              {resumes.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-neutral-200 rounded-xl">
                  <p className="text-xs text-neutral-500">No resumes in library yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {resumes.map((resume) => {
                    const isAlreadyAttached = alreadyAttachedIds.includes(resume.id);
                    const isSelected = selectedIds.includes(resume.id);

                    return (
                      <div
                        key={resume.id}
                        onClick={() => !isAlreadyAttached && toggleSelect(resume.id)}
                        className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          isAlreadyAttached
                            ? 'bg-neutral-100 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-800 opacity-60 cursor-not-allowed'
                            : isSelected
                            ? 'bg-purple-500/5 border-purple-500 dark:border-purple-400 cursor-pointer shadow-xs'
                            : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isAlreadyAttached || isSelected}
                            disabled={isAlreadyAttached}
                            onChange={() => !isAlreadyAttached && toggleSelect(resume.id)}
                            className="w-4 h-4 rounded text-neutral-900 focus:ring-purple-500 accent-neutral-900 cursor-pointer"
                          />
                          <div>
                            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                              {resume.candidateName}
                            </h4>
                            <p className="text-xs text-neutral-500">
                              {resume.targetRole} • ATS Pass: <strong className="text-neutral-800 dark:text-neutral-200">{resume.atsCompatibility}%</strong>
                            </p>
                          </div>
                        </div>

                        {isAlreadyAttached ? (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                            Attached
                          </span>
                        ) : isSelected ? (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-neutral-900 dark:text-neutral-100 border border-purple-500/30">
                            Selected
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Upload Tab */
            <div className="space-y-3">
              {uploadError && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 text-xs flex items-center justify-between gap-2 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                  <button 
                    onClick={() => setUploadError(null)}
                    className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 cursor-pointer p-0.5 rounded-md"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="p-8 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl bg-white/60 dark:bg-neutral-900/60 text-center space-y-4 relative group hover:border-neutral-900 dark:hover:border-neutral-400 transition-colors">
                <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    {isUploading ? 'Parsing and indexing resume...' : 'Upload new candidate resume'}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    {HELPER_TEXT}. Will instantly parse candidate skills and attach to this job.
                  </p>
                </div>

                <label className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs rounded-xl shadow-xs transition-all cursor-pointer">
                  <span>{isUploading ? 'Processing...' : 'Browse Computer'}</span>
                  <input 
                    type="file" 
                    accept={ALLOWED_ACCEPT_STRING} 
                    className="hidden" 
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === 'library' && (
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex items-center justify-between shrink-0">
            <span className="text-xs text-neutral-500 font-medium">
              {selectedIds.length} candidate{selectedIds.length === 1 ? '' : 's'} selected
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSelected}
                disabled={selectedIds.length === 0}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs rounded-xl shadow-xs disabled:opacity-40 transition-all cursor-pointer"
              >
                Add Selected Resumes
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Centered AI Analysis Modal */}
      {isUploading && activeFile && (
        <AiAnalysisModal
          isOpen={isUploading}
          fileName={activeFile.name}
          fileSize={activeFile.size}
          stage={modalStage}
          errorMessage={uploadError}
          onCancel={handleCancelAnalysis}
          onClose={() => {
            setIsUploading(false);
            setActiveFile(null);
          }}
          onRetry={() => {
            if (activeFile) {
              processResumeFile(activeFile);
            }
          }}
        />
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
};
