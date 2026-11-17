export type ThemeMode = 'light' | 'dark' | 'system';

export interface SkillItem {
  name: string;
  category: 'frontend' | 'backend' | 'devops' | 'soft' | 'data';
  level?: 'Expert' | 'Intermediate' | 'Foundational';
}

export interface ResumeAnalysis {
  id: string;
  candidateName: string;
  candidateEmail?: string;
  candidatePhone?: string;
  candidateLinkedIn?: string;
  candidateGitHub?: string;
  candidateWebsite?: string;
  targetRole: string;
  status?: 'Ready' | 'Processing' | 'Error';
  resumeScore: number; // General Resume Quality (0-100)
  atsCompatibility: number; // ATS Readability Percentage (0-100%)
  skillsDetectedCount: number;
  aiImprovementsCount: number;
  detectedSkills: string[];
  missingSkills: string[];
  generalIssues?: string[];
  aiRecommendation: string;
  atsBreakdown: {
    keywordMatch: number;
    formatting: number;
    experienceRelevance: number;
  };
  jobMatch?: {
    roleTitle: string;
    company: string;
    matchPercentage: number;
    strongMatches: string[];
    skillGaps: string[];
  };
  rawText?: string;
  /** Resume was longer than the AI limit; only the first part was analyzed. */
  truncated?: boolean;
  documentType?: string | null;
  createdAt?: string;
}

export type CandidateStatus = 'new' | 'shortlisted' | 'on_hold' | 'rejected';

export interface ScoreBreakdown {
  skillCoverage: number | null;
  experienceFit: number;
  aiJudgment: number;
  weights: { skillCoverage: number; experienceFit: number; aiJudgment: number };
  matchedRequired?: string[];
  missingRequired?: string[];
  matchedNiceToHave?: string[];
  missingNiceToHave?: string[];
  strengths?: string[];
  concerns?: string[];
  candidateYearsExperience?: number | null;
  minYearsExperience?: number | null;
}

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceAnnual: number;
  popular?: boolean;
  features: string[];
  ctaText: string;
}

export interface JobMatchResult {
  resumeId: string;
  candidateName: string;
  candidateEmail?: string;
  candidatePhone?: string;
  targetRole: string;
  matchPercentage: number; // Job Match Score (0-100%)
  atsMatchPercentage?: number; // Job ATS Match (0-100%)
  skillsMatchedCount?: number;
  experienceMatchPercentage?: number; // e.g. "92%"
  matchSummary: string;
  strongMatches: string[];
  skillGaps: string[];
  criticalDeficits?: string[];
  keywordAnalysis?: {
    keyword: string;
    status: 'Present' | 'Missing';
  }[];
  experienceRelevance?: string; // e.g. "90%"
  formatCheck?: string; // e.g. "Passed"
  hiringRecommendation?: string;
  candidateStatus?: CandidateStatus;
  matchReason?: string | null;
  skillCoveragePercentage?: number | null;
  aiJudgmentPercentage?: number | null;
  scoreBreakdown?: ScoreBreakdown | null;
  scoringVersion?: string | null;
  aiModel?: string | null;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface JobItem {
  id: string;
  title: string;
  company: string;
  description: string;
  createdAt: string;
  lastUpdated: string;
  status: 'Active' | 'Screened' | 'Draft' | 'Archived';
  attachedResumeIds?: string[];
  isRanked?: boolean;
  matches?: Record<string, JobMatchResult>;
}

export interface CandidateComparisonReport {
  jobId: string;
  jobTitle: string;
  company: string;
  generatedAt: string;
  candidates: JobMatchResult[];
  topRecommendationId?: string;
}
