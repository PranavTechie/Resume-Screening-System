import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, ArrowRight, ArrowLeft, Sparkles, Building2, Loader2, AlertCircle } from 'lucide-react';
import { useJobs } from '../context/JobContext';
import { useToast } from '../context/ToastContext';
import {
  JOB_DESCRIPTION_MIN_LENGTH,
  JOB_DESCRIPTION_MAX_LENGTH,
  JOB_DESCRIPTION_VALIDATION_MESSAGES,
} from '../config/constants';
import { JobDescriptionEditor } from '../components/JobDescriptionEditor';

export const CreateJobPage: React.FC = () => {
  const navigate = useNavigate();
  const { addJob, generateJobDescription } = useJobs();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [description, setDescription] = useState('');
  const [isGeneratingAiJd, setIsGeneratingAiJd] = useState(false);
  const [error, setError] = useState('');

  const charCount = description.length;
  const isTooShort = charCount > 0 && charCount < JOB_DESCRIPTION_MIN_LENGTH;
  const isTooLong = charCount > JOB_DESCRIPTION_MAX_LENGTH;
  const isLimitReached = charCount === JOB_DESCRIPTION_MAX_LENGTH;

  const isSubmitDisabled = 
    !title.trim() || 
    !description.trim() || 
    charCount < JOB_DESCRIPTION_MIN_LENGTH || 
    charCount > JOB_DESCRIPTION_MAX_LENGTH || 
    isGeneratingAiJd;

  const handleDescriptionChange = (newNormalizedText: string) => {
    setDescription(newNormalizedText);

    if (newNormalizedText.length > JOB_DESCRIPTION_MAX_LENGTH) {
      setError(JOB_DESCRIPTION_VALIDATION_MESSAGES.TOO_LONG);
      return;
    }

    if (error && (error === JOB_DESCRIPTION_VALIDATION_MESSAGES.TOO_LONG || error === JOB_DESCRIPTION_VALIDATION_MESSAGES.TOO_SHORT || error === JOB_DESCRIPTION_VALIDATION_MESSAGES.REQUIRED)) {
      if (newNormalizedText.trim().length >= JOB_DESCRIPTION_MIN_LENGTH && newNormalizedText.length <= JOB_DESCRIPTION_MAX_LENGTH) {
        setError('');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a job title.');
      toast.error('Please provide a job title.', { title: 'Validation Error' });
      return;
    }
    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      setError(JOB_DESCRIPTION_VALIDATION_MESSAGES.REQUIRED);
      toast.error(JOB_DESCRIPTION_VALIDATION_MESSAGES.REQUIRED, { title: 'Validation Error' });
      return;
    }
    if (description.length < JOB_DESCRIPTION_MIN_LENGTH) {
      setError(JOB_DESCRIPTION_VALIDATION_MESSAGES.TOO_SHORT);
      toast.error(JOB_DESCRIPTION_VALIDATION_MESSAGES.TOO_SHORT, { title: 'Validation Error' });
      return;
    }
    if (description.length > JOB_DESCRIPTION_MAX_LENGTH) {
      setError(JOB_DESCRIPTION_VALIDATION_MESSAGES.TOO_LONG);
      toast.error(JOB_DESCRIPTION_VALIDATION_MESSAGES.TOO_LONG, { title: 'Validation Error' });
      return;
    }

    setError('');
    const newJob = await addJob({
      title: title.trim(),
      company: company.trim() || undefined,
      description: description
    });

    if (newJob) {
      navigate(`/jobs/${newJob.id}`);
    }
  };

  return (
    <div className="min-h-screen selection:bg-purple-100 selection:text-purple-900 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-8">
        
        {/* Back Link */}
        <button
          onClick={() => navigate('/jobs')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Jobs Library</span>
        </button>

        {/* Page Header */}
        <div className="border-b border-neutral-200/50 dark:border-neutral-800/50 pb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-neutral-900 dark:text-neutral-100 text-xs font-semibold mb-2 border border-purple-500/20">
            <Briefcase className="w-3.5 h-3.5" />
            <span>NEW JOB SCREENING</span>
          </div>
          <h1 className="text-3xl font-serif-title font-normal text-neutral-900 dark:text-white tracking-tight">
            Create a New Job
          </h1>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
            Add a job description to start screening candidates.
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Job Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
              Job Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Software Engineer"
              className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-medium text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>

          {/* Company Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
              Company / Department <span className="text-neutral-400 font-normal lowercase">(optional)</span>
            </label>
            <div className="relative">
              <Building2 className="w-3.5 h-3.5 absolute left-3.5 top-3 text-neutral-400" />
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. TechCorp or Platform Infrastructure Team"
                className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-medium text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>
          </div>

          {/* Job Description Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                Job Description <span className="text-rose-500">*</span>
              </label>

              <button
                type="button"
                disabled={isGeneratingAiJd}
                onClick={async () => {
                  if (!title.trim()) {
                    toast.error('Please enter a Job Title first to generate an AI description.', { title: 'Missing Title' });
                    return;
                  }
                  setIsGeneratingAiJd(true);
                  const generated = await generateJobDescription(title.trim(), company.trim() || undefined);
                  if (generated) {
                    if (generated.length > JOB_DESCRIPTION_MAX_LENGTH) {
                      toast.warn('Generated description exceeded limit and was clamped to 10,000 characters.');
                      setDescription(generated.slice(0, JOB_DESCRIPTION_MAX_LENGTH));
                    } else {
                      setDescription(generated);
                    }
                    setError('');
                  }
                  setIsGeneratingAiJd(false);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-xs font-semibold hover:bg-purple-500/20 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isGeneratingAiJd ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Generate with AI (1 Credit)</span>
                  </>
                )}
              </button>
            </div>

            <JobDescriptionEditor
              value={description}
              onChange={handleDescriptionChange}
              onError={(msg) => setError(msg)}
              disabled={isGeneratingAiJd}
              isTooLong={isTooLong}
              isLimitReached={isLimitReached}
            />

            {/* Counter and status bar */}
            <div className="flex items-center justify-between pt-0.5 text-xs">
              <div className="text-neutral-500">
                {isTooShort ? (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    {100 - charCount} more character{100 - charCount === 1 ? '' : 's'} needed (min 100)
                  </span>
                ) : isLimitReached ? (
                  <span className="text-purple-600 dark:text-purple-400 font-semibold">
                    Maximum limit reached (10,000 characters)
                  </span>
                ) : (
                  <span>Manual entry, pasting, and editing are free (0 credits).</span>
                )}
              </div>

              {/* Live Character Counter */}
              <div className="tabular-nums font-mono shrink-0">
                <span className={`font-medium ${
                  isTooShort
                    ? 'text-amber-600 dark:text-amber-400'
                    : isLimitReached
                    ? 'text-purple-600 dark:text-purple-400 font-bold'
                    : isTooLong
                    ? 'text-rose-500 font-bold'
                    : charCount > 9500
                    ? 'text-purple-500'
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}>
                  {charCount.toLocaleString()}
                </span>
                <span className="text-neutral-400 dark:text-neutral-500"> / {JOB_DESCRIPTION_MAX_LENGTH.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/jobs')}
              className="px-4 py-2.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Continue to Resumes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
