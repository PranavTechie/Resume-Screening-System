import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { JobItem, ResumeAnalysis, JobMatchResult, CandidateStatus } from '../types';
import { supabase } from '../lib/supabase';
import { apiClient, Batch } from '../lib/api';
import { friendlyError } from '../utils/errorMessages';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import {
  JOB_DESCRIPTION_MIN_LENGTH,
  JOB_DESCRIPTION_MAX_LENGTH,
  JOB_DESCRIPTION_VALIDATION_MESSAGES,
} from '../config/constants';

interface JobContextType {
  jobs: JobItem[];
  resumes: ResumeAnalysis[];
  loading: boolean;
  addJob: (jobData: { title: string; company?: string; description: string }) => Promise<JobItem | null>;
  getJob: (id: string) => JobItem | undefined;
  deleteJob: (id: string) => Promise<void>;
  attachResumesToJob: (jobId: string, resumeIds: string[]) => Promise<void>;
  detachResumeFromJob: (jobId: string, resumeId: string) => Promise<void>;
  /** Starts ranking on the background queue and returns the batch to watch. */
  rankResumesForJob: (jobId: string) => Promise<Batch>;
  generateJobDescription: (title: string, company?: string, keywords?: string) => Promise<string | null>;
  uploadResume: (file: File, signal?: AbortSignal) => Promise<ResumeAnalysis | null>;
  addResume: (resume: ResumeAnalysis) => void;
  deleteResume: (resumeId: string) => Promise<void>;
  deleteResumes: (resumeIds: string[]) => Promise<number>;
  detachResumesFromJob: (jobId: string, resumeIds: string[]) => Promise<void>;
  updateCandidateStatus: (jobId: string, resumeIds: string[], status: CandidateStatus) => Promise<void>;
  /** Re-fetch everything. `silent` keeps current data on screen (no loading state). */
  refreshData: (opts?: { silent?: boolean }) => Promise<void>;
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export const JobProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading, refreshCredits } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [resumes, setResumes] = useState<ResumeAnalysis[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchRealData = useCallback(async (opts?: { silent?: boolean }) => {
    if (authLoading) return;

    if (!user) {
      setJobs([]);
      setResumes([]);
      setLoading(false);
      return;
    }

    if (!opts?.silent) setLoading(true);
    try {
      // 1. Fetch Real User Resumes
      const { data: rawResumes, error: resumeErr } = await supabase
        .from('resumes')
        .select(`
          *,
          resume_analyses (*),
          detected_skills (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (resumeErr) {
        console.warn('Error fetching user resumes from Supabase:', resumeErr);
      }

      const mappedResumes: ResumeAnalysis[] = (rawResumes || []).map((r: any) => {
        const analysis = r.resume_analyses?.[0];
        const allSkills = r.detected_skills || [];
        const detected = allSkills.filter((s: any) => !s.is_missing).map((s: any) => s.skill_name);
        const missing = allSkills.filter((s: any) => s.is_missing).map((s: any) => s.skill_name);

        const atsComp = r.ats_compatibility || analysis?.ats_score || 0;

        return {
          id: r.id,
          candidateName: r.candidate_name,
          candidateEmail: r.candidate_email || analysis?.data_json?.candidateEmail || undefined,
          candidatePhone: r.candidate_phone || analysis?.data_json?.candidatePhone || undefined,
          targetRole: r.target_role,
          status: (r.status as any) || 'Ready',
          resumeScore: r.resume_score || 0,
          atsCompatibility: atsComp,
          skillsDetectedCount: r.skills_detected_count || detected.length,
          aiImprovementsCount: r.ai_improvements_count || 0,
          detectedSkills: detected,
          missingSkills: missing,
          generalIssues: analysis?.general_issues || [],
          aiRecommendation: analysis?.ai_recommendation || 'Resume uploaded and analyzed.',
          atsBreakdown: {
            keywordMatch: analysis?.ats_breakdown_json?.keywordMatch || atsComp,
            formatting: analysis?.ats_breakdown_json?.formatting || atsComp,
            experienceRelevance: analysis?.ats_breakdown_json?.experienceRelevance || atsComp,
          },
          truncated: Boolean(r.content_truncated),
          documentType: r.document_type || null,
          createdAt: r.created_at,
        };
      });

      setResumes(mappedResumes);

      // 2. Fetch Real User Jobs & Job Matches
      const { data: rawJobs, error: jobErr } = await supabase
        .from('jobs')
        .select(`
          *,
          job_matches (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (jobErr) {
        console.warn('Error fetching user jobs from Supabase:', jobErr);
      }

      const mappedJobs: JobItem[] = (rawJobs || []).map((j: any) => {
        const matchesMap: Record<string, JobMatchResult> = {};
        (j.job_matches || []).forEach((m: any) => {
          const matchedRes = mappedResumes.find(r => r.id === m.resume_id);
          matchesMap[m.resume_id] = {
            resumeId: m.resume_id,
            candidateName: matchedRes?.candidateName || m.candidate_name || 'Candidate',
            candidateEmail: m.candidate_email || matchedRes?.candidateEmail || undefined,
            candidatePhone: m.candidate_phone || matchedRes?.candidatePhone || undefined,
            targetRole: j.title,
            matchPercentage: m.match_percentage,
            atsMatchPercentage: m.ats_match_percentage ?? m.match_percentage,
            skillsMatchedCount: m.skills_matched_count || undefined,
            experienceMatchPercentage: m.experience_match_percentage ?? undefined,
            matchSummary: m.match_summary || '',
            strongMatches: m.strong_matches_json || [],
            skillGaps: m.skill_gaps_json || [],
            candidateStatus: (m.candidate_status as CandidateStatus) || 'new',
            matchReason: m.match_reason || null,
            skillCoveragePercentage: m.skill_coverage_percentage ?? null,
            aiJudgmentPercentage: m.ai_judgment_percentage ?? null,
            scoreBreakdown: m.score_breakdown_json || null,
            scoringVersion: m.scoring_version || null,
            aiModel: m.ai_model || null,
          };
        });

        return {
          id: j.id,
          title: j.title,
          company: j.company || 'Company Confidential',
          description: j.description,
          createdAt: new Date(j.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          lastUpdated: new Date(j.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          status: j.status || 'Active',
          attachedResumeIds: j.attached_resume_ids || [],
          isRanked: j.is_ranked || false,
          matches: matchesMap,
        };
      });

      setJobs(mappedJobs);
    } catch (err) {
      console.error('Error fetching Supabase user data:', err);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!authLoading) {
      fetchRealData();
    }
  }, [authLoading, fetchRealData]);

  const addJob = async (jobData: { title: string; company?: string; description: string }): Promise<JobItem | null> => {
    if (!user) return null;

    if (!jobData.description || !jobData.description.trim()) {
      toast.error(JOB_DESCRIPTION_VALIDATION_MESSAGES.REQUIRED, { title: 'Validation Error' });
      return null;
    }
    if (jobData.description.length < JOB_DESCRIPTION_MIN_LENGTH) {
      toast.error(JOB_DESCRIPTION_VALIDATION_MESSAGES.TOO_SHORT, { title: 'Validation Error' });
      return null;
    }
    if (jobData.description.length > JOB_DESCRIPTION_MAX_LENGTH) {
      toast.error(JOB_DESCRIPTION_VALIDATION_MESSAGES.TOO_LONG, { title: 'Validation Error' });
      return null;
    }

    try {
      let createdRow: any = null;
      try {
        const apiRes = await apiClient.createJob({
          title: jobData.title,
          company: jobData.company,
          description: jobData.description,
        });
        if (apiRes && apiRes.id) {
          createdRow = apiRes;
        }
      } catch (apiErr: any) {
        if (apiErr.code === 'JOB_DESCRIPTION_TOO_SHORT' || apiErr.code === 'JOB_DESCRIPTION_TOO_LONG' || apiErr.code === 'JOB_DESCRIPTION_REQUIRED') {
          toast.error(apiErr.message || 'Validation error', { title: 'Validation Error' });
          return null;
        }
        console.warn('Backend createJob notice:', apiErr);
      }

      if (!createdRow) {
        const { data, error } = await supabase
          .from('jobs')
          .insert({
            user_id: user.id,
            title: jobData.title,
            company: jobData.company || 'Company Confidential',
            description: jobData.description,
            status: 'Active',
            attached_resume_ids: [],
            is_ranked: false,
          })
          .select()
          .single();

        if (error || !data) {
          toast.error('Failed to create job in database.', { title: 'Database Error' });
          return null;
        }
        createdRow = data;
      }

      const newJobItem: JobItem = {
        id: createdRow.id,
        title: createdRow.title,
        company: createdRow.company,
        description: createdRow.description,
        createdAt: 'Today',
        lastUpdated: 'Today',
        status: 'Active',
        attachedResumeIds: createdRow.attached_resume_ids || [],
        isRanked: createdRow.is_ranked || false,
      };

      setJobs(prev => [newJobItem, ...prev]);
      toast.success(`Job description for "${createdRow.title}" added successfully.`, { title: 'Job Created' });
      return newJobItem;
    } catch (err: any) {
      toast.error(err.message || 'Error creating job.');
      return null;
    }
  };

  const getJob = (id: string) => {
    return jobs.find(j => j.id === id);
  };

  const deleteJob = async (id: string) => {
    if (!user) return;
    setJobs(prev => prev.filter(j => j.id !== id));
    await supabase.from('jobs').delete().eq('id', id).eq('user_id', user.id);
    toast.info('Job description deleted.');
  };

  const attachResumesToJob = async (jobId: string, resumeIds: string[]) => {
    if (!user) return;
    const target = jobs.find(j => j.id === jobId);
    if (!target) return;

    const uniqueIds = Array.from(new Set([...target.attachedResumeIds, ...resumeIds]));

    setJobs(prev => prev.map(job => {
      if (job.id === jobId) {
        return { ...job, attachedResumeIds: uniqueIds, lastUpdated: 'Today' };
      }
      return job;
    }));

    await supabase
      .from('jobs')
      .update({ attached_resume_ids: uniqueIds, updated_at: new Date().toISOString() })
      .eq('id', jobId)
      .eq('user_id', user.id);
  };

  const detachResumesFromJob = async (jobId: string, resumeIds: string[]) => {
    if (!user || resumeIds.length === 0) return;
    const remove = new Set(resumeIds);
    setJobs(prev => prev.map(job => {
      if (job.id !== jobId) return job;
      const updatedMatches = { ...(job.matches || {}) };
      resumeIds.forEach(id => delete updatedMatches[id]);
      return { ...job, attachedResumeIds: job.attachedResumeIds.filter(id => !remove.has(id)), matches: updatedMatches };
    }));
    try {
      await apiClient.detachResumes(jobId, resumeIds);
    } catch (err: any) {
      toast.error(friendlyError(err, 'Could not remove candidates from the job.'));
      await fetchRealData({ silent: true });
    }
  };

  const detachResumeFromJob = async (jobId: string, resumeId: string) => detachResumesFromJob(jobId, [resumeId]);

  const rankResumesForJob = async (jobId: string): Promise<Batch> => {
    if (!user) {
      const err: any = new Error('Authentication required. Please sign in.');
      err.status = 401;
      throw err;
    }
    const result = await apiClient.rankResumesForJob(jobId);
    await refreshCredits();
    return result.batch;
  };

  const updateCandidateStatus = async (jobId: string, resumeIds: string[], status: CandidateStatus) => {
    if (!user || resumeIds.length === 0) return;
    const ids = new Set(resumeIds);
    setJobs(prev => prev.map(job => {
      if (job.id !== jobId || !job.matches) return job;
      const matches = { ...job.matches };
      Object.keys(matches).forEach(id => { if (ids.has(id)) matches[id] = { ...matches[id], candidateStatus: status }; });
      return { ...job, matches };
    }));
    try {
      await apiClient.updateCandidateStatus(jobId, resumeIds, status);
    } catch (err: any) {
      toast.error(friendlyError(err, 'Could not update candidate status.'));
      await fetchRealData({ silent: true });
    }
  };

  const uploadResume = async (file: File, signal?: AbortSignal): Promise<ResumeAnalysis | null> => {
    if (!user) {
      toast.error('Please sign in to upload and analyze resumes.', { title: 'Authentication Required' });
      return null;
    }

    try {
      const apiResult = await apiClient.uploadResume(file, signal);
      if (!apiResult || !apiResult.resume) {
        if (signal?.aborted) return null;
        throw new Error('The server did not return an analysis.');
      }
      const uploadedResume: ResumeAnalysis = apiResult.resume;
      setResumes(prev => [uploadedResume, ...prev.filter(r => r.id !== uploadedResume.id)]);
      await refreshCredits();
      await fetchRealData({ silent: true });
      return uploadedResume;
    } catch (err: any) {
      if (err?.name === 'AbortError' || err?.code === 'CANCELLED' || signal?.aborted) return null;
      // Rejections are refunded server-side; keep the credit pill in sync.
      await refreshCredits();
      const apiError: any = new Error(friendlyError(err, 'Failed to analyze this resume.'));
      apiError.code = err?.code || 'PROCESS_FAILED';
      apiError.status = err?.status || 500;
      apiError.details = err?.details;
      throw apiError;
    }
  };

  const addResume = (newResume: ResumeAnalysis) => {
    setResumes(prev => [newResume, ...prev]);
  };

  /** Deletes the user's own resumes (rows + stored files) through the API. Returns how many were deleted. */
  const deleteResumes = async (resumeIds: string[]): Promise<number> => {
    if (!user || resumeIds.length === 0) return 0;
    const remove = new Set(resumeIds);
    setResumes(prev => prev.filter(r => !remove.has(r.id)));
    setJobs(prev => prev.map(job => {
      const matches = { ...(job.matches || {}) };
      resumeIds.forEach(id => delete matches[id]);
      return { ...job, attachedResumeIds: job.attachedResumeIds.filter(id => !remove.has(id)), matches };
    }));
    try {
      const res = await apiClient.deleteResumes(resumeIds);
      return res.deleted;
    } catch (err: any) {
      toast.error(friendlyError(err, 'Could not delete resumes.'));
      await fetchRealData({ silent: true });
      return 0;
    }
  };

  const deleteResume = async (resumeId: string) => {
    await deleteResumes([resumeId]);
  };

  const generateJobDescription = async (title: string, company?: string, keywords?: string): Promise<string | null> => {
    if (!user) {
      toast.error('Authentication required.');
      return null;
    }
    try {
      const res = await apiClient.generateJobDescription(title, company, keywords);
      if (res && res.description) {
        await refreshCredits();
        toast.success('AI Job Description generated! (1 Credit deducted)');
        return res.description;
      }
      return null;
    } catch (err: any) {
      if (err.code === 'INSUFFICIENT_CREDITS' || err.status === 402) {
        toast.error('Insufficient Credits. AI Job Description generation requires 1 credit.', { title: 'Credit Limit Reached' });
      } else {
        toast.error(err.message || 'Failed to generate AI job description.');
      }
      return null;
    }
  };

  return (
    <JobContext.Provider
      value={{
        jobs,
        resumes,
        loading,
        addJob,
        getJob,
        deleteJob,
        attachResumesToJob,
        detachResumeFromJob,
        rankResumesForJob,
        generateJobDescription,
        uploadResume,
        addResume,
        deleteResume,
        deleteResumes,
        detachResumesFromJob,
        updateCandidateStatus,
        refreshData: fetchRealData,
      }}
    >
      {children}
    </JobContext.Provider>
  );
};

export const useJobs = () => {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error('useJobs must be used within a JobProvider');
  }
  return context;
};
