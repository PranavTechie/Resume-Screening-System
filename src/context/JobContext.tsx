import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { JobItem, ResumeAnalysis, JobMatchResult } from '../types';
import { supabase } from '../lib/supabase';
import { apiClient } from '../lib/api';
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
  rankResumesForJob: (jobId: string, signal?: AbortSignal) => Promise<void>;
  generateJobDescription: (title: string, company?: string, keywords?: string) => Promise<string | null>;
  uploadResume: (file: File, signal?: AbortSignal) => Promise<ResumeAnalysis | null>;
  addResume: (resume: ResumeAnalysis) => void;
  deleteResume: (resumeId: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export const JobProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading, refreshCredits } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [resumes, setResumes] = useState<ResumeAnalysis[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchRealData = useCallback(async () => {
    if (authLoading) return;

    if (!user) {
      setJobs([]);
      setResumes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
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

  const detachResumeFromJob = async (jobId: string, resumeId: string) => {
    if (!user) return;
    const target = jobs.find(j => j.id === jobId);
    if (!target) return;

    const updatedAttached = target.attachedResumeIds.filter(id => id !== resumeId);

    setJobs(prev => prev.map(job => {
      if (job.id === jobId) {
        const updatedMatches = { ...job.matches };
        delete updatedMatches[resumeId];
        return { ...job, attachedResumeIds: updatedAttached, matches: updatedMatches, lastUpdated: 'Today' };
      }
      return job;
    }));

    await supabase
      .from('jobs')
      .update({ attached_resume_ids: updatedAttached, updated_at: new Date().toISOString() })
      .eq('id', jobId)
      .eq('user_id', user.id);

    await supabase.from('job_matches').delete().eq('job_id', jobId).eq('resume_id', resumeId).eq('user_id', user.id);
  };

  const rankResumesForJob = async (jobId: string, signal?: AbortSignal) => {
    if (!user) {
      const err: any = new Error('Authentication required. Please sign in.');
      err.status = 401;
      throw err;
    }
    const targetJob = jobs.find(j => j.id === jobId);
    if (!targetJob || targetJob.attachedResumeIds.length === 0) {
      const err: any = new Error('No candidate resumes attached to rank for this job.');
      err.status = 400;
      throw err;
    }

    try {
      const apiResult = await apiClient.rankResumesForJob(jobId, signal);
      if (signal?.aborted) return;
      if (apiResult) {
        await refreshCredits();
        if (apiResult.job && apiResult.job.matches) {
          setJobs(prev => prev.map(j => j.id === jobId ? {
            ...j,
            isRanked: true,
            status: 'Screened',
            matches: apiResult.job.matches
          } : j));
        } else {
          await fetchRealData();
        }
        return;
      }
    } catch (apiErr: any) {
      if (apiErr?.name === 'AbortError' || apiErr?.code === 'CANCELLED' || signal?.aborted) {
        return;
      }
      if (apiErr?.status || apiErr?.code || apiErr?.requiredCredits) {
        // Re-throw authoritative API errors (402, 401, 403, 500)
        throw apiErr;
      }
      console.warn('Backend REST API ranking unreachable, using direct Supabase persistence fallback:', apiErr?.message);
    }

    const matches: Record<string, JobMatchResult> = {};
    const jobText = `${targetJob.title} ${targetJob.description}`.toLowerCase();

    for (const resId of targetJob.attachedResumeIds) {
      const res = resumes.find(r => r.id === resId);
      if (!res) continue;

      const candidateSkills = (res.detectedSkills || []).map(s => s.toLowerCase());
      const candidateRawText = (res.rawText || '').toLowerCase();

      // Check which skills from the candidate are present in the job
      const strongMatches = (res.detectedSkills || []).filter(skill => {
        const sLower = skill.toLowerCase();
        return jobText.includes(sLower);
      });

      // Check common tech keywords in job that the candidate lacks
      const COMMON_TECH = [
        'React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Java', 'SQL',
        'PostgreSQL', 'MongoDB', 'Redis', 'GraphQL', 'REST APIs', 'Docker', 'Kubernetes',
        'AWS', 'CI/CD', 'Git', 'HTML', 'CSS', 'Tailwind', 'Next.js', 'Express'
      ];
      const jobRequiredTech = COMMON_TECH.filter(tech => jobText.includes(tech.toLowerCase()));
      const skillGaps = jobRequiredTech.filter(tech => {
        const tLower = tech.toLowerCase();
        return !candidateSkills.includes(tLower) && !candidateRawText.includes(tLower);
      });

      let score = 0;
      if (jobRequiredTech.length > 0) {
        const matchedTechCount = jobRequiredTech.length - skillGaps.length;
        score = Math.min(98, Math.max(0, Math.round((matchedTechCount / jobRequiredTech.length) * 100)));
      } else if (strongMatches.length > 0) {
        score = Math.min(95, strongMatches.length * 20);
      } else {
        score = res.targetRole.toLowerCase().includes(targetJob.title.toLowerCase()) ? 45 : 0;
      }

      const totalSkillsCount = strongMatches.length + skillGaps.length;
      let matchSummary = '';
      if (score > 60) {
        matchSummary = `${res.candidateName} matched ${strongMatches.length} core requirements (e.g. ${strongMatches.slice(0, 2).join(', ')}) demonstrating strong alignment with the target role.`;
      } else if (score > 0) {
        matchSummary = `${res.candidateName} matched ${strongMatches.length} requirements but is missing critical skills (e.g. ${skillGaps.slice(0, 2).join(', ')}), demonstrating partial alignment.`;
      } else {
        matchSummary = `${res.candidateName} shows no direct technical alignment with the core requirements for ${targetJob.title}.`;
      }

      matches[resId] = {
        resumeId: resId,
        candidateName: res.candidateName,
        candidateEmail: res.candidateEmail,
        candidatePhone: res.candidatePhone,
        targetRole: targetJob.title,
        matchPercentage: score,
        atsMatchPercentage: res.atsCompatibility || 80,
        skillsMatchedCount: strongMatches.length,
        experienceMatchPercentage: score,
        matchSummary,
        strongMatches: strongMatches.length > 0 ? strongMatches : [],
        skillGaps: skillGaps.length > 0 ? skillGaps : (res.missingSkills.length > 0 ? res.missingSkills.slice(0, 3) : ['Domain Requirements']),
      };

      await supabase.from('job_matches').upsert({
        job_id: jobId,
        resume_id: resId,
        user_id: user.id,
        candidate_name: res.candidateName,
        candidate_email: res.candidateEmail || null,
        candidate_phone: res.candidatePhone || null,
        match_percentage: score,
        ats_match_percentage: res.atsCompatibility || 80,
        skills_matched_count: strongMatches.length,
        match_summary: matchSummary,
        strong_matches_json: strongMatches,
        skill_gaps_json: skillGaps,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'job_id,resume_id' });
    }

    await supabase.from('jobs').update({ status: 'Screened', is_ranked: true, updated_at: new Date().toISOString() }).eq('id', jobId).eq('user_id', user.id);
    await fetchRealData();
  };

  const uploadResume = async (file: File, signal?: AbortSignal): Promise<ResumeAnalysis | null> => {
    if (!user) {
      toast.error('Please sign in to upload and analyze resumes.', { title: 'Authentication Required' });
      return null;
    }

    try {
      // Execute REST API upload strictly to authoritative backend POST /api/resumes
      const apiResult = await apiClient.uploadResume(file, signal);

      if (!apiResult || !apiResult.resume) {
        if (signal?.aborted) return null;
        throw new Error('Backend API did not return valid resume analysis payload.');
      }

      const uploadedResume: ResumeAnalysis = apiResult.resume;

      // Update local state, refresh user credit balance & sync with persisted database state
      setResumes(prev => [uploadedResume, ...prev]);
      await refreshCredits();
      await fetchRealData();

      return uploadedResume;
    } catch (err: any) {
      if (err?.name === 'AbortError' || err?.code === 'CANCELLED' || signal?.aborted) {
        // Silent cancellation without throwing error toast
        return null;
      }
      const errMsg = err?.message || 'Failed to analyze resume via backend API.';
      console.error('Backend resume upload error:', errMsg);
      const apiError: any = new Error(errMsg);
      apiError.code = err?.code || 'PROCESS_FAILED';
      apiError.status = err?.status || 500;
      throw apiError;
    }
  };

  const addResume = (newResume: ResumeAnalysis) => {
    setResumes(prev => [newResume, ...prev]);
  };

  const deleteResume = async (resumeId: string) => {
    if (!user) return;
    setResumes(prev => prev.filter(r => r.id !== resumeId));
    setJobs(prev => prev.map(job => ({
      ...job,
      attachedResumeIds: job.attachedResumeIds.filter(id => id !== resumeId),
    })));

    try {
      const { data: row } = await supabase
        .from('resumes')
        .select('file_path')
        .eq('id', resumeId)
        .eq('user_id', user.id)
        .single();

      if (row?.file_path) {
        await supabase.storage.from('resumes').remove([row.file_path]);
      }

      await supabase.from('resumes').delete().eq('id', resumeId).eq('user_id', user.id);
      toast.info('Resume deleted successfully.');
    } catch (err) {
      console.error('Delete resume error:', err);
    }
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
