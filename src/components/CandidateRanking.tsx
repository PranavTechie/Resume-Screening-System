import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ShieldAlert, 
  Search, 
  Filter, 
  BarChart2, 
  Eye, 
  Award, 
  Sparkles, 
  TrendingUp, 
  ChevronRight,
  AlertTriangle,
  UserCheck,
  Mail,
  Phone
} from 'lucide-react';
import { JobMatchResult } from '../types';

export interface CandidateRankingProps {
  jobTitle?: string;
  matches?: JobMatchResult[];
  onViewCandidate?: (resumeId: string) => void;
  isRankingLoading?: boolean;
}

export const CandidateRanking: React.FC<CandidateRankingProps> = ({
  jobTitle = 'Target Job Role',
  matches = [],
  onViewCandidate,
  isRankingLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [minMatchFilter, setMinMatchFilter] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'rank' | 'ats' | 'name'>('rank');

  // Filter and sort candidates
  const filteredMatches = (matches || [])
    .filter((candidate) => {
      const matchesSearch = 
        candidate.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.targetRole.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMinScore = candidate.matchPercentage >= minMatchFilter;
      return matchesSearch && matchesMinScore;
    })
    .sort((a, b) => {
      if (sortBy === 'ats') {
        return (b.atsMatchPercentage || 0) - (a.atsMatchPercentage || 0);
      }
      if (sortBy === 'name') {
        return a.candidateName.localeCompare(b.candidateName);
      }
      return b.matchPercentage - a.matchPercentage;
    });

  // Top candidate stats
  const topMatch = matches.length > 0
    ? matches.reduce((max, c) => (c.matchPercentage > max.matchPercentage ? c : max), matches[0])
    : null;
  const avgMatch = matches.length > 0
    ? Math.round(matches.reduce((acc, c) => acc + c.matchPercentage, 0) / matches.length)
    : 0;
  const highFitCount = matches.filter(c => c.matchPercentage >= 80).length;

  return (
    <div className="space-y-6">
      
      {/* Header Badge & Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-200/80 dark:border-neutral-800/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-2 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>SCREENING & RANKING RESULTS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif-title font-normal text-neutral-900 dark:text-white tracking-tight">
            Candidate Ranking
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Evaluated candidates for <span className="font-semibold text-neutral-900 dark:text-white">{jobTitle}</span> based on skills overlap, experience depth, and ATS compatibility.
          </p>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-neutral-100/80 dark:bg-neutral-900/80 p-2.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 shrink-0">
          <div className="px-3 py-1.5 text-center">
            <span className="text-[11px] uppercase font-bold text-neutral-500 block">Evaluated</span>
            <span className="text-base font-extrabold text-neutral-900 dark:text-white font-mono">{matches.length}</span>
          </div>
          <div className="px-3 py-1.5 text-center border-x border-neutral-200 dark:border-neutral-800">
            <span className="text-[11px] uppercase font-bold text-neutral-500 block">Avg Match</span>
            <span className="text-base font-extrabold text-purple-700 dark:text-purple-400 font-mono">{avgMatch}%</span>
          </div>
          <div className="px-3 py-1.5 text-center">
            <span className="text-[11px] uppercase font-bold text-neutral-500 block">Strong Fits</span>
            <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">{highFitCount}</span>
          </div>
        </div>
      </div>

      {/* Loading overlay state */}
      {isRankingLoading ? (
        <div className="p-12 text-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-4">
          <div className="w-10 h-10 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Analyzing Candidates & Calculating Skill Gaps...</h3>
            <p className="text-xs text-neutral-500 mt-1">Comparing technical profiles against job parameters</p>
          </div>
        </div>
      ) : (
        <>
          {/* Controls Bar: Search + Filter + Sort */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-3 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-2xs">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search candidate name or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800/80 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            {/* Filter & Sort Dropdowns */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={minMatchFilter}
                  onChange={(e) => setMinMatchFilter(Number(e.target.value))}
                  className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800/80 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
                >
                  <option value={0}>All Match Scores</option>
                  <option value={90}>90%+ Match Only</option>
                  <option value={80}>80%+ Match Only</option>
                  <option value={70}>70%+ Match Only</option>
                </select>
              </div>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'rank' | 'ats' | 'name')}
                  className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800/80 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
                >
                  <option value="rank">Sort: Job Match %</option>
                  <option value="ats">Sort: ATS Readiness</option>
                  <option value="name">Sort: Candidate Name</option>
                </select>
              </div>
            </div>

          </div>

          {/* Candidate Cards List */}
          {filteredMatches.length === 0 ? (
            <div className="p-10 text-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-2">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                {matches.length === 0 ? 'No candidates have been ranked yet' : 'No candidates match search criteria'}
              </h3>
              <p className="text-xs text-neutral-500">
                {matches.length === 0 ? 'Attach candidate resumes to this job workspace and click "Rank Resumes".' : 'Try adjusting your minimum match filter or search term.'}
              </p>
              {matches.length > 0 && (
                <button
                  onClick={() => { setSearchQuery(''); setMinMatchFilter(0); }}
                  className="mt-2 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMatches.map((candidate, idx) => {
                const isTopMatch = topMatch ? candidate.resumeId === topMatch.resumeId : false;
                const hasValidEmail = Boolean(
                  candidate.candidateEmail && 
                  candidate.candidateEmail.trim() !== '' && 
                  candidate.candidateEmail.toLowerCase() !== 'null' &&
                  candidate.candidateEmail.includes('@')
                );
                const hasValidPhone = Boolean(
                  candidate.candidatePhone && 
                  candidate.candidatePhone.trim() !== '' && 
                  candidate.candidatePhone.toLowerCase() !== 'null'
                );

                return (
                  <div
                    key={candidate.resumeId}
                    className={`bg-white dark:bg-neutral-900 border rounded-2xl p-5 sm:p-6 shadow-xs hover:border-neutral-400 dark:hover:border-neutral-700 transition-all flex flex-col lg:flex-row lg:items-start justify-between gap-6 relative overflow-hidden ${
                      isTopMatch 
                        ? 'border-purple-500/50 dark:border-purple-500/40 ring-1 ring-purple-500/20' 
                        : 'border-neutral-200/90 dark:border-neutral-800/90'
                    }`}
                  >
                    {/* Top match ribbon banner if top candidate */}
                    {isTopMatch && (
                      <div className="absolute top-0 right-0 bg-purple-600 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-2xs">
                        <Award className="w-3 h-3" />
                        <span>Top Candidate Match</span>
                      </div>
                    )}

                    {/* Main Left Details Column */}
                    <div className="space-y-4 flex-1">
                      
                      {/* Candidate Header Row */}
                      <div className="flex flex-wrap items-center gap-3 pr-20">
                        {/* Rank Badge */}
                        <span className={`w-8 h-8 rounded-xl font-bold font-mono text-xs flex items-center justify-center shrink-0 shadow-2xs ${
                          isTopMatch
                            ? 'bg-purple-900 text-purple-100 dark:bg-purple-600'
                            : 'bg-neutral-900 text-white dark:bg-neutral-800'
                        }`}>
                          #{idx + 1}
                        </span>

                        {/* Candidate Name & Role */}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base sm:text-lg font-bold font-serif-title text-neutral-900 dark:text-white">
                              {candidate.candidateName}
                            </h3>
                            {isTopMatch && (
                              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-neutral-500 font-medium">
                            {candidate.targetRole}
                          </p>
                        </div>

                        {/* Candidate Contact Actions */}
                        <div className="flex items-center gap-1.5 sm:ml-1 shrink-0" role="group" aria-label={`Contact actions for ${candidate.candidateName}`}>
                          {hasValidEmail ? (
                            <a
                              href={`mailto:${candidate.candidateEmail}`}
                              onClick={(e) => e.stopPropagation()}
                              title={`Email candidate (${candidate.candidateEmail})`}
                              aria-label={`Email ${candidate.candidateName}`}
                              className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-purple-600 dark:hover:text-purple-400 bg-neutral-100 dark:bg-neutral-800/90 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-neutral-200/80 dark:border-neutral-700/80 hover:border-purple-300 dark:hover:border-purple-700/60 shadow-2xs hover:shadow-xs transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span className="sr-only">Email candidate</span>
                            </a>
                          ) : (
                            <button
                              type="button"
                              disabled
                              title="Email not available"
                              aria-label="Email not available"
                              className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg flex items-center justify-center text-neutral-400 dark:text-neutral-600 bg-neutral-100/50 dark:bg-neutral-800/40 border border-neutral-200/40 dark:border-neutral-800/50 cursor-not-allowed opacity-50 shadow-none focus:outline-none"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span className="sr-only">Email not available</span>
                            </button>
                          )}

                          {hasValidPhone ? (
                            <a
                              href={`tel:${candidate.candidatePhone}`}
                              onClick={(e) => e.stopPropagation()}
                              title={`Call candidate (${candidate.candidatePhone})`}
                              aria-label={`Call ${candidate.candidateName}`}
                              className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-emerald-600 dark:hover:text-emerald-400 bg-neutral-100 dark:bg-neutral-800/90 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-neutral-200/80 dark:border-neutral-700/80 hover:border-emerald-300 dark:hover:border-emerald-700/60 shadow-2xs hover:shadow-xs transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span className="sr-only">Call candidate</span>
                            </a>
                          ) : (
                            <button
                              type="button"
                              disabled
                              title="Phone not available"
                              aria-label="Phone not available"
                              className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg flex items-center justify-center text-neutral-400 dark:text-neutral-600 bg-neutral-100/50 dark:bg-neutral-800/40 border border-neutral-200/40 dark:border-neutral-800/50 cursor-not-allowed opacity-50 shadow-none focus:outline-none"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span className="sr-only">Phone not available</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Score Metrics Grid Pills */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                        {/* Match % */}
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                          <span className="text-[11px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block">
                            Job Match
                          </span>
                          <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300 font-mono">
                            {candidate.matchPercentage}%
                          </span>
                        </div>

                        {/* ATS Match % */}
                        {candidate.atsMatchPercentage !== undefined && (
                          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                            <span className="text-[11px] uppercase font-bold text-purple-800 dark:text-purple-300 block">
                              ATS Compatibility
                            </span>
                            <span className="text-sm font-extrabold text-purple-700 dark:text-purple-300 font-mono">
                              {candidate.atsMatchPercentage}%
                            </span>
                          </div>
                        )}

                        {/* Skills Count */}
                        {candidate.skillsMatchedCount !== undefined && (
                          <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                            <span className="text-[11px] uppercase font-bold text-neutral-500 dark:text-neutral-400 block">
                              Skills Matched
                            </span>
                            <span className="text-sm font-extrabold text-neutral-900 dark:text-white font-mono">
                              {candidate.skillsMatchedCount}/{(candidate.strongMatches?.length || 0) + (candidate.skillGaps?.length || 0) || 1}
                            </span>
                          </div>
                        )}

                        {/* Experience Match */}
                        {candidate.experienceMatchPercentage !== undefined && (
                          <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                            <span className="text-[11px] uppercase font-bold text-neutral-500 dark:text-neutral-400 block">
                              Exp Relevance
                            </span>
                            <span className="text-sm font-extrabold text-neutral-900 dark:text-white font-mono">
                              {candidate.experienceMatchPercentage}%
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Match Narrative Summary */}
                      <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed bg-neutral-50/60 dark:bg-neutral-950/40 p-3 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60">
                        {candidate.matchSummary}
                      </p>

                      {/* Skills Breakdown Grid: Key Matched vs Missing Skill Gaps */}
                      <div className="grid sm:grid-cols-2 gap-4 pt-1">
                        
                        {/* Matched Skills */}
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Key Matched Skills ({candidate.strongMatches.length})</span>
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {candidate.strongMatches.map((skill, sIdx) => (
                              <span
                                key={sIdx}
                                className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-[11px] font-medium border border-emerald-200 dark:border-emerald-800/80"
                              >
                                ✓ {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Missing Skill Gaps */}
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" />
                            <span>Missing Skill Gaps ({candidate.skillGaps.length})</span>
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {candidate.skillGaps.map((gap, gIdx) => (
                              <span
                                key={gIdx}
                                className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-[11px] font-medium border border-rose-200 dark:border-rose-800/80"
                              >
                                ✕ {gap}
                              </span>
                            ))}
                          </div>
                        </div>

                      </div>

                    </div>

                    {/* Right Action Column */}
                    <div className="shrink-0 flex lg:flex-col items-center justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-neutral-100 dark:border-neutral-800">
                      <button
                        onClick={() => onViewCandidate && onViewCandidate(candidate.resumeId)}
                        className="w-full sm:w-auto px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Analysis</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </>
      )}

    </div>
  );
};
