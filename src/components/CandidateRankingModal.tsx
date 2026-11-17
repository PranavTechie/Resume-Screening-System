import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, CheckCircle2, AlertCircle, X, RefreshCw, Briefcase } from 'lucide-react';

export interface CandidateRankingModalProps {
  isOpen: boolean;
  jobTitle: string;
  resumeCount: number;
  stage: 'processing' | 'complete' | 'error';
  errorMessage?: string | null;
  onClose: () => void;
  onRetry?: () => void;
  onCancel?: () => void;
}

export const CandidateRankingModal: React.FC<CandidateRankingModalProps> = ({
  isOpen,
  jobTitle,
  resumeCount,
  stage,
  errorMessage,
  onClose,
  onRetry,
  onCancel,
}) => {
  // Lock body scroll and preserve scroll position
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
      if (e.key === 'Escape' && stage !== 'processing') {
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
  }, [isOpen, stage, onClose]);

  if (!isOpen) return null;

  const handleCancelClick = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none overflow-y-auto"
      onClick={() => {
        if (stage !== 'processing') onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ranking-modal-title"
    >
      {/* Centered Modal Card Container */}
      <div 
        className="relative w-full max-w-[420px] bg-neutral-900/95 border border-neutral-800/80 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 text-white transform transition-all duration-300 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Glows */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button for Error State */}
        {stage === 'error' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white transition-colors rounded-full hover:bg-neutral-800 cursor-pointer z-10"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* 1. Centered Minimal Animated Loader / Icon */}
        <div className="flex flex-col items-center justify-center pt-2">
          {stage === 'error' ? (
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-2xl border border-red-500/40 bg-red-500/10 animate-in zoom-in-50 duration-200" />
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
          ) : stage === 'complete' ? (
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 animate-in zoom-in-50 duration-300" />
              <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-in zoom-in duration-300" />
            </div>
          ) : (
            <div className="relative w-20 h-20 flex items-center justify-center">
              {/* Outer Ambient Glow Ring */}
              <div className="absolute inset-0 rounded-full bg-purple-500/10 blur-md animate-pulse" />
              
              {/* Sleek Rotating Gradient Border Loader */}
              <div className="w-16 h-16 rounded-full border-2 border-purple-500/20 border-t-purple-500 border-r-purple-400 animate-spin" />

              {/* Inner Glowing AI Sparkle Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
              </div>
            </div>
          )}
        </div>

        {/* 2. Heading & Subtle Three-Dot Indicator */}
        <div className="text-center space-y-2">
          <h3 
            id="ranking-modal-title"
            className="text-xl sm:text-2xl font-serif-title font-normal text-white tracking-tight"
          >
            {stage === 'error' 
              ? "Ranking couldn't be completed" 
              : stage === 'complete'
                ? "Ranking Complete" 
                : "Analyzing Candidates"
            }
          </h3>

          {stage === 'processing' && (
            <div className="flex items-center justify-center gap-1.5 pt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-[bounce_1.4s_infinite_ease-in-out_0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-[bounce_1.4s_infinite_ease-in-out_200ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-[bounce_1.4s_infinite_ease-in-out_400ms]" />
            </div>
          )}

          {stage === 'complete' && (
            <p className="text-xs text-emerald-400 font-medium leading-relaxed">
              Candidate rankings updated...
            </p>
          )}

          {stage === 'error' && (
            <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed px-2">
              {errorMessage || 'An error occurred during candidate ranking.'}
            </p>
          )}
        </div>

        {/* 3. Action Buttons (Cancel Ranking during processing) */}
        {stage === 'processing' && (
          <div className="flex justify-center pt-0.5">
            <button
              type="button"
              onClick={handleCancelClick}
              className="px-4 py-1.5 rounded-lg bg-neutral-800/60 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-700/60 hover:border-neutral-600 text-xs font-medium transition-all shadow-xs cursor-pointer"
            >
              Cancel Ranking
            </button>
          </div>
        )}

        {/* 4. Attached Resumes Count Pill */}
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-800/60 border border-neutral-700/60 text-xs text-neutral-300 shadow-xs max-w-full">
            <Briefcase className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="font-medium text-neutral-200">{resumeCount} resume{resumeCount === 1 ? '' : 's'} selected</span>
          </div>
        </div>

        {/* 5. Action Buttons for Error State */}
        {stage === 'error' && (
          <div className="pt-2 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white font-medium text-xs border border-neutral-700 transition-all cursor-pointer"
            >
              Dismiss
            </button>

            {onRetry && (
              <button
                onClick={() => {
                  onClose();
                  onRetry();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
