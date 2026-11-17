import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useJobs } from '../context/JobContext';
import { apiClient, type CreditTransaction } from '../lib/api';
import type { JobItem, JobMatchResult, ResumeAnalysis } from '../types';
import './DashboardPage.css';

const MAX_JOBS = 4;
const MAX_RESUMES = 5;
const MAX_CANDIDATES = 3;
const MAX_ACTIVITY = 5;
const LOW_CREDITS = 2;

const boundedScore = (score: number) => Math.min(100, Math.max(0, Number.isFinite(score) ? Math.round(score) : 0));
const atsTone = (score: number) => (score >= 80 ? 'good' : score >= 60 ? 'fair' : 'low');
const matchTone = (score: number) => (score >= 70 ? 'good' : score >= 40 ? 'fair' : 'low');
const isConfidential = (company?: string) => !company || company.trim().toLowerCase() === 'company confidential';

/** Turns backend transaction descriptions into short, readable lines. */
function describeTransaction(tx: CreditTransaction): string {
  const text = (tx.description || '').trim();
  const rules: Array<[RegExp, string]> = [
    [/^Resume analysis:\s*(.+)$/i, 'Analyzed resume · $1'],
    [/^Candidate ranking for job:\s*(.+)$/i, 'Ranked candidates · $1'],
    [/^AI job description generation for\s*(.+)$/i, 'Generated job description · $1'],
    [/^Interview preparation:\s*(.+)$/i, 'Interview prep · $1'],
  ];
  for (const [pattern, label] of rules) {
    if (pattern.test(text)) return text.replace(pattern, label);
  }
  if (tx.type === 'REFUND') return text ? `Refund · ${text}` : 'Credit refund';
  if (tx.type === 'PURCHASE') return text || 'Credits purchased';
  return text || 'Credit update';
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

type ActivityState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; items: CreditTransaction[] };

export const DashboardPage: React.FC = () => {
  const { user, credits } = useAuth();
  const { resumes, jobs, loading } = useJobs();
  const reducedMotion = !!useReducedMotion();
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  // One-time fade-in. Driven by state (not `initial`) because App's
  // <AnimatePresence initial={false}> suppresses initial animations on first load.
  const [shown, setShown] = useState(reducedMotion);
  useEffect(() => setShown(true), []);

  // Recent activity: refetch when the balance changes (an action just spent or added credits)
  const [activity, setActivity] = useState<ActivityState>({ status: 'loading' });
  useEffect(() => {
    let cancelled = false;
    apiClient.getCreditHistory().then((rows) => {
      if (cancelled) return;
      setActivity(rows === null ? { status: 'error' } : { status: 'ready', items: rows.slice(0, MAX_ACTIVITY) });
    });
    return () => {
      cancelled = true;
    };
  }, [credits]);

  const topCandidates = useMemo(() => {
    const roleByResume = new Map<string, string>(resumes.map((r: ResumeAnalysis) => [r.id, r.targetRole]));
    return jobs
      .flatMap((job: JobItem) =>
        Object.values<JobMatchResult>(job.matches || {}).map((match) => ({
          jobId: job.id,
          jobTitle: job.title,
          resumeId: match.resumeId,
          name: match.candidateName || 'Candidate',
          role: roleByResume.get(match.resumeId) || '',
          score: boundedScore(match.matchPercentage),
        })),
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_CANDIDATES);
  }, [jobs, resumes]);

  return (
    <motion.div
      className="dash"
      aria-busy={loading}
      initial={false}
      animate={{ opacity: shown ? 1 : 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.35, ease: 'easeOut' }}
    >
      <div className="dash-inner">
        <header className="dash-header">
          <h1>Welcome back, {firstName}</h1>
          <div className="dash-actions">
            <Link to="/resume" className="dash-btn dash-btn-primary">Upload resumes</Link>
            <Link to="/jobs/new" className="dash-btn dash-btn-secondary">New job</Link>
          </div>
        </header>

        {credits <= LOW_CREDITS && (
          <div className="dash-banner" role="status">
            <p>
              You have <strong>{credits}</strong> {credits === 1 ? 'credit' : 'credits'} left. Get more to keep screening.
            </p>
            <Link to="/pricing" className="dash-btn dash-btn-secondary">Get credits</Link>
          </div>
        )}

        <div className="dash-grid">
          {/* Left column: Jobs, Top candidates */}
          <div className="dash-col">
            <Card title="Jobs" titleId="dash-jobs-title" viewAll="/jobs">
              {loading ? (
                <DashboardLoading label="Loading jobs" />
              ) : jobs.length === 0 ? (
                <EmptyState text="No jobs yet. Create one to rank resumes against it." to="/jobs/new" action="Create a job" />
              ) : (
                <ul className="dash-list">
                  {jobs.slice(0, MAX_JOBS).map((job) => <JobRow key={job.id} job={job} />)}
                </ul>
              )}
            </Card>

            <Card title="Top candidates" titleId="dash-top-title">
              {loading ? (
                <DashboardLoading label="Loading top candidates" />
              ) : topCandidates.length === 0 ? (
                <EmptyState text="Rank a job to see your best candidates here." to="/jobs" action="Go to jobs" />
              ) : (
                <>
                  <ColumnHeader labels={['Candidate', 'Match']} className="dash-cols-candidate" />
                  <ul className="dash-list">
                    {topCandidates.map((c) => (
                      <li key={`${c.jobId}-${c.resumeId}`}>
                        <Link to={`/jobs/${c.jobId}/candidates/${c.resumeId}/analysis`} className="dash-row dash-candidate-row">
                          <div className="dash-row-main">
                            <h3>{c.name}</h3>
                            <p>{c.role && c.role !== c.jobTitle ? `${c.role} · for ${c.jobTitle}` : `for ${c.jobTitle}`}</p>
                          </div>
                          <span className={`dash-score ${matchTone(c.score)}`}>{c.score}%</span>
                          <ChevronRight className="dash-chevron" size={16} aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Card>
          </div>

          {/* Right column: Recent resumes, Recent activity */}
          <div className="dash-col">
            <Card title="Recent resumes" titleId="dash-resumes-title" viewAll="/resume">
              {loading ? (
                <DashboardLoading label="Loading resumes" />
              ) : resumes.length === 0 ? (
                <EmptyState text="No resumes yet. Upload one to get its ATS score." to="/resume" action="Upload a resume" />
              ) : (
                <>
                  <ColumnHeader labels={['Candidate', 'ATS score', 'Status']} className="dash-cols-resume" />
                  <ul className="dash-list">
                    {resumes.slice(0, MAX_RESUMES).map((resume) => <ResumeRow key={resume.id} resume={resume} />)}
                  </ul>
                </>
              )}
            </Card>

            {activity.status !== 'error' && (
              <Card title="Recent activity" titleId="dash-activity-title" viewAll="/credits">
                {activity.status === 'loading' ? (
                  <DashboardLoading label="Loading recent activity" />
                ) : activity.items.length === 0 ? (
                  <div className="dash-empty"><p>No credit activity yet.</p></div>
                ) : (
                  <ul className="dash-list">
                    {activity.items.map((tx) => (
                      <li key={tx.id} className="dash-row dash-activity-row">
                        <div className="dash-row-main">
                          <h3 title={describeTransaction(tx)}>{describeTransaction(tx)}</h3>
                          <p>{timeAgo(tx.created_at)}</p>
                        </div>
                        <span className={`dash-amount ${tx.amount > 0 ? 'is-credit' : ''}`}>
                          {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Card: React.FC<{ title: string; titleId: string; viewAll?: string; children: React.ReactNode }> = ({ title, titleId, viewAll, children }) => (
  <section className="dash-card" aria-labelledby={titleId}>
    <div className="dash-card-head">
      <h2 id={titleId}>{title}</h2>
      {viewAll && <Link to={viewAll} className="dash-link">View all</Link>}
    </div>
    {children}
  </section>
);

const ColumnHeader: React.FC<{ labels: string[]; className: string }> = ({ labels, className }) => (
  <div className={`dash-col-header ${className}`} aria-hidden="true">
    {labels.map((label) => <span key={label}>{label}</span>)}
  </div>
);

const JobRow: React.FC<{ job: JobItem }> = ({ job }) => {
  const matches = Object.values<JobMatchResult>(job.matches || {});
  const bestMatch = matches.length ? Math.max(...matches.map((match) => boundedScore(match.matchPercentage))) : null;
  const candidateCount = new Set([...(job.attachedResumeIds || []), ...matches.map((match) => match.resumeId)]).size;
  const meta = [isConfidential(job.company) ? null : job.company, `${candidateCount} ${candidateCount === 1 ? 'candidate' : 'candidates'}`]
    .filter(Boolean)
    .join(' · ');

  return (
    <li>
      <Link to={`/jobs/${job.id}`} className="dash-row dash-job-row">
        <div className="dash-row-main">
          <h3>{job.title}</h3>
          <p>{meta}</p>
        </div>
        <span className={`dash-job-status ${job.status === 'Active' ? 'is-active' : ''}`}>{job.status}</span>
        <div className="dash-match" aria-label={bestMatch === null ? 'Not ranked yet' : `Best match ${bestMatch}%`}>
          {bestMatch === null ? (
            <span className="dash-muted">Not ranked</span>
          ) : (
            <>
              <span className="dash-match-track" aria-hidden="true"><span style={{ transform: `scaleX(${bestMatch / 100})` }} /></span>
              <strong>{bestMatch}%</strong>
            </>
          )}
        </div>
        <ChevronRight className="dash-chevron" size={16} aria-hidden="true" />
      </Link>
    </li>
  );
};

const ResumeRow: React.FC<{ resume: ResumeAnalysis }> = ({ resume }) => {
  const status = resume.status || 'Ready';
  const ready = status === 'Ready';
  const score = boundedScore(resume.atsCompatibility);

  return (
    <li>
      <Link to={`/resumes/${resume.id}/analysis`} className="dash-row dash-resume-row">
        <div className="dash-row-main">
          <h3>{resume.candidateName || 'Untitled resume'}</h3>
          <p>{resume.targetRole || 'No target role'}</p>
        </div>
        <span className={`dash-score ${ready ? atsTone(score) : ''}`} aria-label={ready ? `ATS score ${score}%` : 'No ATS score yet'}>
          {ready ? `${score}%` : '—'}
        </span>
        <span className={`dash-status status-${status.toLowerCase()}`}>
          <span className="dash-status-dot" aria-hidden="true" />
          {status}
        </span>
        <ChevronRight className="dash-chevron" size={16} aria-hidden="true" />
      </Link>
    </li>
  );
};

function EmptyState({ text, to, action }: { text: string; to: string; action: string }) {
  return (
    <div className="dash-empty">
      <p>{text}</p>
      <Link to={to} className="dash-btn dash-btn-secondary">{action}</Link>
    </div>
  );
}

function DashboardLoading({ label }: { label: string }) {
  return (
    <div className="dash-list dash-loading" role="status" aria-label={label}>
      {[0, 1, 2].map((index) => (
        <div className="dash-skeleton-row" key={index}>
          <div><span /><span /></div>
          <span />
        </div>
      ))}
    </div>
  );
}
