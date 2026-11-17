import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Upload, Plus, Sparkles, HelpCircle, ArrowRight, CheckCircle2, Trash2, Eye, BarChart3, Briefcase, AlertCircle, X } from 'lucide-react';
import { ResumeAnalysis } from '../types';
import { MatchWithJobModal } from '../components/MatchWithJobModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { useJobs } from '../context/JobContext';
import { ResumeListSkeleton } from '../components/Skeletons';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../context/ToastContext';
import { validateResumeFile, ALLOWED_ACCEPT_STRING, HELPER_TEXT } from '../utils/resumeParser';



export const ResumeLibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const { resumes, uploadResume, deleteResume } = useJobs();
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [selectedMatchCandidate, setSelectedMatchCandidate] = useState<ResumeAnalysis | null>(null);
  const [resumeToDelete, setResumeToDelete] = useState<ResumeAnalysis | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<File | null>(null);
  const [modalStage, setModalStage] = useState<'processing' | 'complete' | 'error'>('processing');

  const [latestUploadedResume, setLatestUploadedResume] = useState<ResumeAnalysis | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const { toast } = useToast();
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const navigationTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const processResumeFile = async (file: File) => {
    // Reset previous error
    setUploadError(null);
    setLatestUploadedResume(null);

    // Validate file
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
      const uploadedResume = await uploadResume(file, controller.signal);

      if (controller.signal.aborted) {
        setIsUploading(false);
        setActiveFile(null);
        setModalStage('processing');
        return;
      }

      if (uploadedResume) {
        setLatestUploadedResume(uploadedResume);
        setModalStage('complete');
        if (navigationTimeoutRef.current) clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = setTimeout(() => {
          if (controller.signal.aborted) return;
          setIsUploading(false);
          setActiveFile(null);
          navigate(`/resume/analysis/${uploadedResume.id}`);
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
      const errMsg = err?.message || 'Failed to upload and analyze resume file.';
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
    setLatestUploadedResume(null);
  };

  const handleOpenAnalysis = (resume: ResumeAnalysis) => {
    navigate(`/resume/analysis/${resume.id}`);
  };

  const handleStartMatchWithJob = (resume: ResumeAnalysis) => {
    setSelectedMatchCandidate(resume);
    setMatchModalOpen(true);
  };

  const handlePromptDeleteResume = (resume: ResumeAnalysis) => {
    setResumeToDelete(resume);
    setDeleteModalOpen(true);
  };

  return (
    <div className="min-h-screen selection:bg-purple-100 selection:text-purple-900 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-8">
        
        {/* Page Title Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200/50 dark:border-neutral-800/50 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-neutral-900 dark:text-neutral-100 text-xs font-semibold mb-2">
              <FileText className="w-3.5 h-3.5" />
              <span>RESUME LIBRARY</span>
            </div>
            <h1 className="text-3xl font-serif-title font-normal text-neutral-900 dark:text-white tracking-tight">
              My Resumes & CVs
            </h1>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 max-w-xl">
              Upload, manage, and analyze your CV variations. Run AI audits or match with target job descriptions.
            </p>
          </div>

        </div>

        {/* Upload Error Alert */}
        {uploadError && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{uploadError}</span>
            </div>
            <button 
              onClick={() => setUploadError(null)}
              className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 cursor-pointer p-1 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* File Upload Drop Area (Redesigned Premium SaaS Style) */}
        <div className="relative overflow-hidden bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-800/80 rounded-[32px] p-8 sm:p-12 text-left group hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer">
          {/* Subtle animated background grid */}
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10 lg:gap-16 justify-between">
            
            {/* Left Content */}
            <div className="flex-1 space-y-5 max-w-xl">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-300 text-[11px] font-bold uppercase tracking-wider mb-4">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Resume Analysis Engine</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold font-serif-title text-neutral-900 dark:text-white leading-tight">
                  Upload your resume for AI evaluation
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-3 leading-relaxed">
                  Drag and drop your resume file here, or browse. Our AI engine will instantly extract your skills, verify ATS compatibility, and generate a neural score.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-3">
                <button className="relative px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-semibold text-sm rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all shadow-sm group-hover:shadow flex items-center justify-center gap-2 overflow-hidden pointer-events-none">
                  <span>Browse files</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </button>
                <div className="text-xs text-neutral-400 font-medium flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  {HELPER_TEXT} up to 5MB
                </div>
              </div>
            </div>

            {/* Right Illustration */}
            <div className="shrink-0 relative mt-4 md:mt-0">
              <img 
                src="/animations/doc-upload.png"
                alt="Upload Resume"
                className="w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] lg:w-[480px] lg:h-[480px] -my-14 sm:-my-20 lg:-my-24 object-contain pointer-events-none relative z-10"
              />
            </div>
            
          </div>

          <input 
            type="file" 
            accept={ALLOWED_ACCEPT_STRING} 
            className={`absolute inset-0 w-full h-full opacity-0 z-20 ${isUploading ? 'cursor-wait pointer-events-none' : 'cursor-pointer'}`} 
            onChange={handleFileUpload}
            disabled={isUploading}
            title="Upload your resume"
          />

          {/* Premium Animated Loading Line */}
          {isUploading && (
            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-neutral-200/50 dark:bg-neutral-800/50 overflow-hidden z-30">
              <style>{`
                @keyframes loading-slide {
                  0% { transform: translateX(-100%); }
                  100% { transform: translateX(200%); }
                }
              `}</style>
              <div 
                className="h-full w-1/2 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-80"
                style={{ animation: 'loading-slide 2s infinite ease-in-out' }}
              ></div>
            </div>
          )}
        </div>

        {/* Resume Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-serif-title font-normal text-neutral-900 dark:text-white">
              Uploaded Resumes ({resumes.length})
            </h2>
            <span className="text-xs text-neutral-500 font-medium">Sorted by last updated</span>
          </div>

          {isLoading ? (
            <ResumeListSkeleton count={3} />
          ) : resumes.length === 0 ? (
            /* POLISHED EMPTY STATE FOR NO RESUMES */
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-12 text-center max-w-lg mx-auto shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-serif-title text-neutral-900 dark:text-white">
                No resumes yet
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 max-w-sm mx-auto leading-relaxed">
                Upload your first PDF or DOCX resume to start your AI ATS optimization and candidate analysis.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resumes.map((resume) => (
              <div 
                key={resume.id}
                className="group relative bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-[24px] p-1.5 flex flex-col shadow-xs hover:shadow-md transition-all duration-300 hover:border-purple-200 dark:hover:border-purple-800/50 overflow-hidden"
              >
                {/* subtle gradient glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/5 dark:to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                <div className="bg-neutral-50/50 dark:bg-neutral-950/50 rounded-[20px] p-5 h-full flex flex-col relative z-10">
                  
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-6">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-neutral-900 shadow-sm border border-neutral-200/60 dark:border-neutral-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                        <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold font-serif-title text-neutral-900 dark:text-white truncate tracking-tight">
                          {resume.candidateName}
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5 font-medium">{resume.targetRole}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={resume.status || 'Ready'} />
                      <button
                        onClick={() => handlePromptDeleteResume(resume)}
                        className="p-1.5 text-neutral-300 hover:text-red-500 hover:bg-red-50 dark:text-neutral-600 dark:hover:text-red-400 dark:hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                        title="Delete Resume"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 shadow-sm flex flex-col justify-center relative overflow-hidden group/metric">
                      <div className="flex items-center justify-between mb-1.5 relative z-10">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Quality</span>
                        <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                      </div>
                      <div className="flex items-baseline gap-1 relative z-10">
                        <span className="text-2xl font-bold text-neutral-900 dark:text-white leading-none tracking-tight">{resume.resumeScore}</span>
                        <span className="text-xs font-semibold text-neutral-400">/100</span>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 shadow-sm flex flex-col justify-center relative overflow-hidden group/metric">
                      <div className="flex items-center justify-between mb-1.5 relative z-10">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">ATS Score</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                      <div className="flex items-baseline gap-1 relative z-10">
                        <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 leading-none tracking-tight">{resume.atsCompatibility}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="mb-6">
                    <span className="text-[11px] uppercase font-bold text-neutral-400 tracking-wider block mb-2.5">Detected Skills</span>
                    <div className="flex flex-wrap gap-1.5">
                      {resume.detectedSkills.slice(0, 5).map((skill, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-[11px] font-semibold tracking-tight shadow-sm hover:border-neutral-300 transition-colors cursor-default">
                          {skill}
                        </span>
                      ))}
                      {resume.detectedSkills.length > 5 && (
                        <span className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800/50 border border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-500 text-[11px] font-semibold tracking-tight cursor-default">
                          +{resume.detectedSkills.length - 5}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* AI Recommendation */}
                  {resume.aiRecommendation && (
                    <div className="mb-6">
                      <div className="relative p-4 pt-5 rounded-2xl bg-gradient-to-br from-purple-500/5 to-transparent border border-purple-500/10 dark:border-purple-500/20">
                        <div className="absolute top-0 left-4 -translate-y-1/2 bg-white dark:bg-neutral-900 px-2 py-0.5 flex items-center gap-1.5 rounded-full border border-purple-500/10 shadow-sm">
                           <Sparkles className="w-3 h-3 text-purple-500" />
                           <span className="font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider text-[11px]">AI Insight</span>
                        </div>
                        <p className="text-xs text-neutral-700 dark:text-neutral-300 font-medium leading-relaxed">
                          {resume.aiRecommendation}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-auto pt-4 border-t border-neutral-200/60 dark:border-neutral-800/60 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleOpenAnalysis(resume)}
                      className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer group/btn"
                    >
                      <Eye className="w-3.5 h-3.5 text-neutral-400 group-hover/btn:text-neutral-700 dark:group-hover/btn:text-neutral-200 transition-colors" />
                      <span>View Analysis</span>
                    </button>

                    <button
                      onClick={() => handleStartMatchWithJob(resume)}
                      className="w-full py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>Match With Job</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}
        </div>

      </div>

      {/* Modals */}
      {selectedMatchCandidate && (
        <MatchWithJobModal
          isOpen={matchModalOpen}
          onClose={() => {
            setMatchModalOpen(false);
            setSelectedMatchCandidate(null);
          }}
          resume={selectedMatchCandidate}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setResumeToDelete(null);
        }}
        onConfirm={() => {
          if (resumeToDelete) {
            deleteResume(resumeToDelete.id);
            toast.success(`Resume "${resumeToDelete.candidateName}" deleted from library`, { title: 'Resume Deleted' });
          }
          setDeleteModalOpen(false);
          setResumeToDelete(null);
        }}
        title="Delete Resume"
        itemName={resumeToDelete?.candidateName}
        itemType="resume"
        description="Are you sure you want to delete this candidate resume? This will remove the resume and all associated AI feedback, ATS scores, and interview prep data."
        confirmText="Delete Resume"
      />

    </div>
  );
};
