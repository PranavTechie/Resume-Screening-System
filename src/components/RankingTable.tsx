import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, EyeOff, Eye, Info, Trash2, UserMinus, Loader2 } from 'lucide-react';
import { CandidateStatus, JobMatchResult } from '../types';

export const STATUS_OPTIONS: Array<{ value: CandidateStatus; label: string; cls: string }> = [
  { value: 'new', label: 'New', cls: 'text-neutral-700 dark:text-neutral-200' },
  { value: 'shortlisted', label: 'Shortlisted', cls: 'text-emerald-700 dark:text-emerald-400' },
  { value: 'on_hold', label: 'On hold', cls: 'text-amber-700 dark:text-amber-300' },
  { value: 'rejected', label: 'Rejected', cls: 'text-rose-700 dark:text-rose-400' },
];

const PAGE_SIZE = 25;

type SortKey = 'match' | 'ats' | 'name';

export interface RankingTableProps {
  jobTitle: string;
  matches: JobMatchResult[];
  blind: boolean;
  onToggleBlind: (v: boolean) => void;
  onView: (resumeId: string) => void;
  onStatusChange: (resumeIds: string[], status: CandidateStatus) => Promise<void> | void;
  onRemoveFromJob: (resumeIds: string[]) => void;
  onDeleteResumes: (resumeIds: string[]) => void;
  onExportCsv: () => Promise<void>;
}

function scoreTone(n: number) {
  if (n >= 75) return 'bg-emerald-500';
  if (n >= 50) return 'bg-amber-500';
  return 'bg-rose-500';
}

const ScoreBar: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="flex items-center gap-2 min-w-[96px]" aria-label={`${label} ${value}%`}>
    <span className="w-9 text-right font-bold tabular-nums text-neutral-900 dark:text-white">{value}%</span>
    <div className="h-1.5 flex-1 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
      <div className={`h-full rounded-full ${scoreTone(value)} transition-[width] duration-500`} style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />
    </div>
  </div>
);

const SkillPills: React.FC<{ skills: string[]; tone: 'match' | 'gap'; max?: number }> = ({ skills, tone, max = 3 }) => {
  if (!skills.length) return <span className="text-neutral-400">—</span>;
  const cls =
    tone === 'match'
      ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20'
      : 'bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-500/20';
  return (
    <div className="flex flex-wrap gap-1">
      {skills.slice(0, max).map((s) => (
        <span key={s} className={`px-1.5 py-0.5 rounded-md border text-[11px] font-medium ${cls}`}>{s}</span>
      ))}
      {skills.length > max && <span className="text-[11px] text-neutral-500">+{skills.length - max}</span>}
    </div>
  );
};

export const RankingTable: React.FC<RankingTableProps> = ({
  jobTitle,
  matches,
  blind,
  onToggleBlind,
  onView,
  onStatusChange,
  onRemoveFromJob,
  onDeleteResumes,
  onExportCsv,
}) => {
  const [sortBy, setSortBy] = useState<SortKey>('match');
  const [minScore, setMinScore] = useState(0);
  const [skillFilter, setSkillFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CandidateStatus>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

  // Stable blind labels: rank by match score, independent of the current sort / filter.
  const blindLabel = useMemo(() => {
    const map = new Map<string, string>();
    [...matches].sort((a, b) => b.matchPercentage - a.matchPercentage || a.resumeId.localeCompare(b.resumeId)).forEach((m, i) => map.set(m.resumeId, `Candidate #${i + 1}`));
    return map;
  }, [matches]);

  const allSkills = useMemo(() => {
    const set = new Set<string>();
    matches.forEach((m) => [...(m.strongMatches || []), ...(m.skillGaps || [])].forEach((s) => set.add(s)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [matches]);

  const filtered = useMemo(() => {
    const skill = skillFilter.trim().toLowerCase();
    const q = search.trim().toLowerCase();
    return matches
      .filter((m) => m.matchPercentage >= minScore)
      .filter((m) => statusFilter === 'all' || (m.candidateStatus || 'new') === statusFilter)
      .filter((m) => !skill || (m.strongMatches || []).some((s) => s.toLowerCase().includes(skill)))
      .filter((m) => blind || !q || m.candidateName.toLowerCase().includes(q) || (m.candidateEmail || '').toLowerCase().includes(q))
      .sort((a, b) => {
        if (sortBy === 'ats') return (b.atsMatchPercentage || 0) - (a.atsMatchPercentage || 0);
        if (sortBy === 'name') return (blind ? blindLabel.get(a.resumeId)! : a.candidateName).localeCompare(blind ? blindLabel.get(b.resumeId)! : b.candidateName, undefined, { numeric: true });
        return b.matchPercentage - a.matchPercentage;
      });
  }, [matches, minScore, statusFilter, skillFilter, search, sortBy, blind, blindLabel]);

  useEffect(() => setPage(0), [minScore, statusFilter, skillFilter, search, sortBy]);
  useEffect(() => {
    // Drop selections that no longer exist (deleted / detached).
    setSelected((prev) => new Set(Array.from(prev).filter((id) => matches.some((m) => m.resumeId === id))));
  }, [matches]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const allOnPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r.resumeId));

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const togglePage = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      pageRows.forEach((r) => (allOnPageSelected ? next.delete(r.resumeId) : next.add(r.resumeId)));
      return next;
    });
  const selectedIds = Array.from(selected);
  const nameOf = (m: JobMatchResult) => (blind ? blindLabel.get(m.resumeId)! : m.candidateName);

  const stats = useMemo(() => {
    const n = matches.length;
    const avg = n ? Math.round(matches.reduce((s, m) => s + m.matchPercentage, 0) / n) : 0;
    const strong = matches.filter((m) => m.matchPercentage >= 75).length;
    const shortlisted = matches.filter((m) => m.candidateStatus === 'shortlisted').length;
    return { n, avg, strong, shortlisted };
  }, [matches]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      await onExportCsv();
    } finally {
      setExporting(false);
    }
  };

  const inputCls =
    'h-9 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-purple-500/30';

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif-title text-neutral-900 dark:text-white tracking-tight">Candidate ranking</h2>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
            {stats.n} ranked for <span className="font-semibold text-neutral-900 dark:text-white">{jobTitle}</span> · avg {stats.avg}% · {stats.strong} strong (75%+) · {stats.shortlisted} shortlisted
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onToggleBlind(!blind)}
            aria-pressed={blind}
            className={`h-9 px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 border cursor-pointer transition-colors ${
              blind
                ? 'bg-purple-600 text-white border-purple-600'
                : 'border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800'
            }`}
            title="Hide names, photos, email, phone and college to reduce bias"
          >
            {blind ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            Blind screening {blind ? 'on' : 'off'}
          </button>
          <button
            onClick={exportCsv}
            disabled={exporting || matches.length === 0}
            className="h-9 px-4 rounded-full text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:opacity-90 inline-flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
          >
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin motion-reduce:animate-none" /> : <Download className="w-3.5 h-3.5" />}
            Export CSV
          </button>
        </div>
      </div>

      <p className="flex items-start gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
        <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
        AI scores are suggestions. Final hiring decisions should be made by a person.
      </p>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {!blind && (
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email" aria-label="Search candidates" className={`${inputCls} col-span-2 md:col-span-1`} />
        )}
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)} aria-label="Sort by" className={inputCls}>
          <option value="match">Sort: Match score</option>
          <option value="ats">Sort: ATS score</option>
          <option value="name">Sort: Name</option>
        </select>
        <select value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} aria-label="Minimum match score" className={inputCls}>
          {[0, 40, 50, 60, 70, 80, 90].map((n) => (
            <option key={n} value={n}>{n === 0 ? 'Any score' : `Match ≥ ${n}%`}</option>
          ))}
        </select>
        <input list="ranking-skills" value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)} placeholder="Has skill…" aria-label="Filter by skill" className={inputCls} />
        <datalist id="ranking-skills">
          {allSkills.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} aria-label="Filter by status" className={inputCls}>
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Bulk bar */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950">
          <span className="text-xs font-semibold mr-auto">{selectedIds.length} selected</span>
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) void onStatusChange(selectedIds, e.target.value as CandidateStatus);
              e.target.value = '';
            }}
            aria-label="Set status for selected"
            className="h-8 px-2 rounded-lg text-xs bg-white/10 dark:bg-black/5 border border-white/20 dark:border-black/10 cursor-pointer"
          >
            <option value="" disabled>Set status…</option>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="text-neutral-900">{o.label}</option>
            ))}
          </select>
          <button onClick={() => onRemoveFromJob(selectedIds)} className="h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-white/10 dark:hover:bg-black/5 cursor-pointer">
            <UserMinus className="w-3.5 h-3.5" /> Remove from job
          </button>
          <button onClick={() => onDeleteResumes(selectedIds)} className="h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 bg-rose-600 text-white hover:bg-rose-700 cursor-pointer">
            <Trash2 className="w-3.5 h-3.5" /> Delete resumes
          </button>
          <button onClick={() => setSelected(new Set())} className="h-8 px-2 rounded-lg text-xs hover:bg-white/10 dark:hover:bg-black/5 cursor-pointer">Clear</button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500">No candidates match these filters.</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-950/60 text-[11px] uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="p-3 w-8 text-left">
                    <input type="checkbox" checked={allOnPageSelected} onChange={togglePage} aria-label="Select all on this page" className="w-3.5 h-3.5 accent-purple-600" />
                  </th>
                  <th className="p-3 text-left w-8">#</th>
                  <th className="p-3 text-left">Candidate</th>
                  <th className="p-3 text-left">Match</th>
                  <th className="p-3 text-left">ATS</th>
                  <th className="p-3 text-left">Matched skills</th>
                  <th className="p-3 text-left">Missing</th>
                  <th className="p-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {pageRows.map((m, i) => (
                  <tr key={m.resumeId} className={`align-top hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 ${selected.has(m.resumeId) ? 'bg-purple-500/5' : ''}`}>
                    <td className="p-3">
                      <input type="checkbox" checked={selected.has(m.resumeId)} onChange={() => toggle(m.resumeId)} aria-label={`Select ${nameOf(m)}`} className="w-3.5 h-3.5 accent-purple-600" />
                    </td>
                    <td className="p-3 text-neutral-500 tabular-nums">{safePage * PAGE_SIZE + i + 1}</td>
                    <td className="p-3 max-w-[260px]">
                      <button onClick={() => onView(m.resumeId)} className="font-semibold text-neutral-900 dark:text-white hover:underline underline-offset-2 text-left cursor-pointer">
                        {nameOf(m)}
                      </button>
                      {!blind && m.candidateEmail && <p className="text-neutral-500 truncate">{m.candidateEmail}</p>}
                      {m.matchReason && <p className="text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-2" title={m.matchReason}>{m.matchReason}</p>}
                    </td>
                    <td className="p-3"><ScoreBar value={m.matchPercentage} label="Match" /></td>
                    <td className="p-3 tabular-nums text-neutral-700 dark:text-neutral-300">{m.atsMatchPercentage ?? '—'}%</td>
                    <td className="p-3 max-w-[200px]"><SkillPills skills={m.strongMatches || []} tone="match" /></td>
                    <td className="p-3 max-w-[180px]"><SkillPills skills={m.skillGaps || []} tone="gap" max={2} /></td>
                    <td className="p-3">
                      <select
                        value={m.candidateStatus || 'new'}
                        onChange={(e) => void onStatusChange([m.resumeId], e.target.value as CandidateStatus)}
                        aria-label={`Status for ${nameOf(m)}`}
                        className={`h-8 px-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-semibold cursor-pointer ${STATUS_OPTIONS.find((o) => o.value === (m.candidateStatus || 'new'))?.cls}`}
                      >
                        {STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="md:hidden space-y-2.5">
            {pageRows.map((m, i) => (
              <li key={m.resumeId} className={`p-3.5 rounded-2xl border bg-white dark:bg-neutral-900 ${selected.has(m.resumeId) ? 'border-purple-400/60' : 'border-neutral-200 dark:border-neutral-800'}`}>
                <div className="flex items-start gap-3">
                  <input type="checkbox" checked={selected.has(m.resumeId)} onChange={() => toggle(m.resumeId)} aria-label={`Select ${nameOf(m)}`} className="mt-1 w-4 h-4 accent-purple-600" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <button onClick={() => onView(m.resumeId)} className="text-sm font-semibold text-neutral-900 dark:text-white text-left cursor-pointer">
                        <span className="text-neutral-400 mr-1">{safePage * PAGE_SIZE + i + 1}.</span>
                        {nameOf(m)}
                      </button>
                      <span className="text-xs text-neutral-500 shrink-0">ATS {m.atsMatchPercentage ?? '—'}%</span>
                    </div>
                    <ScoreBar value={m.matchPercentage} label="Match" />
                    {m.matchReason && <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">{m.matchReason}</p>}
                    <SkillPills skills={m.strongMatches || []} tone="match" />
                    <select
                      value={m.candidateStatus || 'new'}
                      onChange={(e) => void onStatusChange([m.resumeId], e.target.value as CandidateStatus)}
                      aria-label={`Status for ${nameOf(m)}`}
                      className="h-9 w-full px-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-semibold"
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {pageCount > 1 && (
            <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
              <span>
                {safePage * PAGE_SIZE + 1}-{Math.min(filtered.length, (safePage + 1) * PAGE_SIZE)} of {filtered.length}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={safePage === 0} aria-label="Previous page" className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 cursor-pointer">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="tabular-nums">{safePage + 1} / {pageCount}</span>
                <button onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} disabled={safePage >= pageCount - 1} aria-label="Next page" className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 cursor-pointer">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
