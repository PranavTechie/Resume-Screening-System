import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronDown, Loader2, RotateCcw, X, XCircle, Ban, Copy, FileWarning, Clock } from 'lucide-react';
import { apiClient, Batch, BatchItem, BatchItemStatus } from '../lib/api';
import { useBatchPolling } from '../hooks/useBatches';
import { friendlyError, itemMessage } from '../utils/errorMessages';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const CHIP: Record<BatchItemStatus, { label: string; cls: string; Icon: React.ElementType }> = {
  queued: { label: 'Queued', cls: 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700', Icon: Clock },
  processing: { label: 'Processing', cls: 'bg-purple-500/10 text-purple-700 border-purple-500/20 dark:text-purple-300', Icon: Loader2 },
  done: { label: 'Done', cls: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400', Icon: CheckCircle2 },
  failed: { label: 'Failed', cls: 'bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-400', Icon: XCircle },
  rejected: { label: 'Not a resume', cls: 'bg-amber-500/10 text-amber-800 border-amber-500/25 dark:text-amber-300', Icon: FileWarning },
  duplicate: { label: 'Duplicate', cls: 'bg-sky-500/10 text-sky-700 border-sky-500/20 dark:text-sky-300', Icon: Copy },
  cancelled: { label: 'Cancelled', cls: 'bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700', Icon: Ban },
};

export const StatusChip: React.FC<{ status: BatchItemStatus; label?: string }> = ({ status, label }) => {
  const c = CHIP[status];
  const Icon = c.Icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold whitespace-nowrap ${c.cls}`}>
      <Icon className={`w-3 h-3 ${status === 'processing' ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden />
      {label || c.label}
    </span>
  );
};

function rejectedLabel(item: BatchItem) {
  if (item.status !== 'rejected') return undefined;
  return item.errorCode === 'NOT_A_RESUME' ? 'Not a resume' : 'Rejected';
}

export interface BatchProgressPanelProps {
  batchId: string;
  /** Called when more items finished since the last poll (refresh library / ranking quietly). */
  onProgress?: (batch: Batch) => void;
  onFinished?: (batch: Batch) => void;
  onDismiss?: () => void;
  /** Blind screening: hide candidate names in rank batches. */
  blind?: boolean;
}

export const BatchProgressPanel: React.FC<BatchProgressPanelProps> = ({ batchId, onProgress, onFinished, onDismiss, blind }) => {
  const { toast } = useToast();
  const { refreshCredits } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState<'cancel' | 'retry' | null>(null);

  const { batch, error, reload, restart } = useBatchPolling(batchId, (b, prev) => {
    const finishedNow = (b.counts.done || 0) + (b.counts.failed || 0) + (b.counts.rejected || 0) + (b.counts.duplicate || 0);
    const finishedBefore = prev ? (prev.counts.done || 0) + (prev.counts.failed || 0) + (prev.counts.rejected || 0) + (prev.counts.duplicate || 0) : -1;
    if (finishedNow !== finishedBefore) onProgress?.(b);
    if (prev && prev.status === 'active' && b.status !== 'active') {
      void refreshCredits();
      onFinished?.(b);
    }
  });

  const stats = useMemo(() => {
    const c = batch?.counts || {};
    const total = batch?.total || 0;
    const finished = (c.done || 0) + (c.failed || 0) + (c.rejected || 0) + (c.duplicate || 0) + (c.cancelled || 0);
    return { c, total, finished, pct: total ? Math.round((finished / total) * 100) : 0 };
  }, [batch]);

  if (!batch) {
    return (
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 text-xs text-neutral-500 flex items-center gap-2">
        {error ? <span>{error}</span> : <><Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" /> Loading progress…</>}
      </div>
    );
  }

  const isRank = batch.kind === 'rank_resume';
  const active = batch.status === 'active';
  const items = batch.items || [];
  const shown = expanded ? items : items.slice(0, 6);
  const { c } = stats;

  const doCancel = async () => {
    setBusy('cancel');
    try {
      await apiClient.cancelBatch(batch.id);
      await reload();
      await refreshCredits();
      toast.info('Queued items cancelled. Their credits were refunded.');
    } catch (e: any) {
      toast.error(friendlyError(e));
    } finally {
      setBusy(null);
    }
  };

  const doRetry = async () => {
    setBusy('retry');
    try {
      await apiClient.retryFailedBatch(batch.id);
      await refreshCredits();
      restart();
      toast.success(`Retrying ${c.failed} item(s).`);
    } catch (e: any) {
      toast.error(friendlyError(e));
    } finally {
      setBusy(null);
    }
  };

  const title = isRank
    ? `${active ? 'Ranking' : 'Ranked'} ${batch.total} candidate${batch.total === 1 ? '' : 's'}`
    : `${active ? 'Analyzing' : 'Analyzed'} ${batch.total} file${batch.total === 1 ? '' : 's'}`;

  const summary = [
    c.done ? `${c.done} done` : null,
    c.processing ? `${c.processing} processing` : null,
    c.queued ? `${c.queued} queued` : null,
    c.failed ? `${c.failed} failed` : null,
    c.rejected ? `${c.rejected} rejected` : null,
    c.duplicate ? `${c.duplicate} duplicate` : null,
    c.cancelled ? `${c.cancelled} cancelled` : null,
  ].filter(Boolean).join(' · ');

  return (
    <section
      aria-label={title}
      className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs overflow-hidden"
    >
      <div className="p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">{title}</h3>
              {active ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 dark:text-purple-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse motion-reduce:animate-none" /> Live
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-neutral-500">{batch.status === 'cancelled' ? 'Cancelled' : 'Finished'}</span>
              )}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5" aria-live="polite">{summary || 'Starting…'}</p>
          </div>
          <div className="flex items-center gap-2">
            {(c.failed || 0) > 0 && !active && (
              <button
                onClick={doRetry}
                disabled={busy !== null}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Retry failed ({c.failed})
              </button>
            )}
            {active && (c.queued || 0) > 0 && (
              <button
                onClick={doCancel}
                disabled={busy !== null}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5" /> Cancel queued
              </button>
            )}
            {!active && onDismiss && (
              <button onClick={onDismiss} aria-label="Dismiss" className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div
          className="h-2 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={stats.pct}
        >
          <div className="h-full rounded-full bg-purple-500 transition-[width] duration-500 ease-out" style={{ width: `${stats.pct}%` }} />
        </div>
        <div className="flex flex-wrap justify-between gap-2 text-[11px] text-neutral-500">
          <span>{stats.finished} of {stats.total} finished · {stats.pct}%</span>
          <span>
            {batch.creditsReserved} credit{batch.creditsReserved === 1 ? '' : 's'} reserved
            {batch.creditsRefunded > 0 ? ` · ${batch.creditsRefunded} refunded` : ''}
          </span>
        </div>
        {active && <p className="text-[11px] text-neutral-500">You can leave this page. Processing continues and results appear as they finish.</p>}
      </div>

      {items.length > 0 && (
        <div className="border-t border-neutral-100 dark:border-neutral-800">
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {shown.map((item, idx) => {
              const msg = itemMessage(item);
              const label = isRank ? (blind ? `Candidate ${idx + 1}` : item.candidateName || 'Candidate') : item.fileName || 'File';
              return (
                <li key={item.id} className="px-4 sm:px-5 py-2.5 flex items-center gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-neutral-800 dark:text-neutral-100 truncate">{label}</p>
                    {msg && <p className="text-neutral-500 dark:text-neutral-400 line-clamp-2" title={msg}>{msg}</p>}
                  </div>
                  {item.status === 'done' && item.resultRef && !isRank && (
                    <Link to={`/resumes/${item.resultRef}/analysis`} className="link-editorial text-[11px] font-semibold shrink-0">
                      View
                    </Link>
                  )}
                  <StatusChip status={item.status} label={rejectedLabel(item)} />
                </li>
              );
            })}
          </ul>
          {items.length > 6 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="w-full px-4 py-2.5 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 flex items-center justify-center gap-1 cursor-pointer"
              aria-expanded={expanded}
            >
              {expanded ? 'Show less' : `Show all ${items.length}`}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      )}
    </section>
  );
};
