import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, CheckCircle2, FileArchive, FileText, Loader2, ShieldCheck, X, XCircle } from 'lucide-react';
import { apiClient, Batch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { friendlyError } from '../utils/errorMessages';
import { inspectZip, isZip, preflightFiles, PreflightEntry } from '../utils/uploadPreflight';
import { MAX_BATCH_FILES } from '../utils/resumeParser';

export interface BulkUploadModalProps {
  isOpen: boolean;
  files: File[];
  onClose: () => void;
  onStarted: (batch: Batch) => void;
}

type ZipInfo = { file: File; resumes: string[]; skipped: string[]; error?: string };

const fmtSize = (n: number) => (n > 1024 * 1024 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ isOpen, files, onClose, onStarted }) => {
  const { credits, refreshCredits } = useAuth();
  const [entries, setEntries] = useState<PreflightEntry[]>([]);
  const [zip, setZip] = useState<ZipInfo | null>(null);
  const [checking, setChecking] = useState(false);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const zips = files.filter(isZip);
  const mixed = zips.length > 0 && (zips.length > 1 || files.length > zips.length);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setError(null);
    setConsent(false);
    setChecking(true);
    (async () => {
      if (zips.length === 1 && files.length === 1) {
        const info = await inspectZip(zips[0]);
        if (!cancelled) {
          setZip({ file: zips[0], ...info });
          setEntries([]);
        }
      } else if (!mixed) {
        const list = await preflightFiles(files);
        if (!cancelled) {
          setEntries(list);
          setZip(null);
        }
      }
      if (!cancelled) setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, files]);

  const okEntries = entries.filter((e) => e.status === 'ok' || e.status === 'warning');
  const count = zip ? (zip.error ? 0 : zip.resumes.length) : okEntries.length;
  const cost = count;
  const balance = typeof credits === 'number' ? credits : 0;
  const insufficient = cost > balance;
  const blockingError = mixed ? 'Upload either separate files or one ZIP, not both.' : zip?.error || null;
  const canStart = !checking && !submitting && !blockingError && count > 0 && consent && !insufficient;

  const removeEntry = (key: string) => setEntries((prev) => prev.filter((e) => e.key !== key));

  const start = async () => {
    if (!canStart) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = zip
        ? await apiClient.uploadBatch({ zip: zip.file, consent })
        : await apiClient.uploadBatch({ files: okEntries.map((e) => e.file), consent });
      await refreshCredits();
      onStarted(res.batch);
    } catch (e: any) {
      setError(friendlyError(e, 'Could not start the upload.'));
      await refreshCredits();
    } finally {
      setSubmitting(false);
    }
  };

  const errorsCount = entries.filter((e) => e.status === 'error').length;

  const content = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-overlay backdrop-blur-xs overflow-y-auto"
          onClick={() => !submitting && onClose()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-upload-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-neutral-200/80 dark:border-neutral-800/80 flex items-start justify-between gap-3">
              <div>
                <h2 id="bulk-upload-title" className="text-lg font-serif-title text-neutral-900 dark:text-white">
                  Review files before analysis
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Checked on your device first. Nothing is charged until you start.
                </p>
              </div>
              <button onClick={onClose} disabled={submitting} aria-label="Close" className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer disabled:opacity-50">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {checking ? (
                <div className="p-8 flex items-center justify-center gap-2 text-xs text-neutral-500">
                  <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" /> Checking files…
                </div>
              ) : blockingError ? (
                <div className="m-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 flex gap-2">
                  <XCircle className="w-4 h-4 shrink-0" /> {blockingError}
                </div>
              ) : zip ? (
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800">
                    <FileArchive className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate">{zip.file.name}</p>
                      <p className="text-[11px] text-neutral-500">
                        {fmtSize(zip.file.size)} · {zip.resumes.length} resume file{zip.resumes.length === 1 ? '' : 's'}
                        {zip.skipped.length ? ` · ${zip.skipped.length} other file(s) will be skipped` : ''}
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-neutral-500">Page count and content are checked on the server for files inside a ZIP. Rejected or duplicate files are refunded automatically.</p>
                </div>
              ) : (
                <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {entries.map((e) => (
                    <li key={e.key} className="px-5 py-2.5 flex items-center gap-3 text-xs">
                      {e.status === 'error' ? (
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0" aria-label="Will be skipped" />
                      ) : e.status === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" aria-label="Warning" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" aria-label="Ready" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-neutral-800 dark:text-neutral-100 truncate">{e.file.name}</p>
                        <p className={`text-[11px] line-clamp-2 ${e.status === 'error' ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-500'}`}>
                          {e.message || `${fmtSize(e.file.size)}${e.pageCount ? ` · ${e.pageCount} page${e.pageCount === 1 ? '' : 's'}` : ''}`}
                        </p>
                      </div>
                      <button onClick={() => removeEntry(e.key)} aria-label={`Remove ${e.file.name}`} className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="p-5 border-t border-neutral-200/80 dark:border-neutral-800/80 space-y-3 bg-neutral-50/60 dark:bg-neutral-950/40">
              {!checking && !blockingError && (
                <div className="flex items-start gap-2 text-xs">
                  <FileText className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                  <p className="text-neutral-700 dark:text-neutral-200">
                    <strong>{count} resume{count === 1 ? '' : 's'}</strong> will be analyzed = <strong>{cost} credit{cost === 1 ? '' : 's'}</strong>. You have{' '}
                    <strong>{balance}</strong>.
                    {errorsCount > 0 && <span className="text-neutral-500"> {errorsCount} file(s) with problems will be skipped for free.</span>}
                    {entries.length > MAX_BATCH_FILES && <span className="text-neutral-500"> Max {MAX_BATCH_FILES} per batch.</span>}
                  </p>
                </div>
              )}
              {insufficient && !checking && !blockingError && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300 flex flex-wrap items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  You need {cost - balance} more credit{cost - balance === 1 ? '' : 's'}.
                  <Link to="/pricing" onClick={onClose} className="font-semibold underline underline-offset-2">Get credits</Link>
                  or remove some files.
                </div>
              )}
              <label className="flex items-start gap-2.5 text-xs text-neutral-700 dark:text-neutral-200 cursor-pointer select-none">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 w-4 h-4 accent-purple-600 cursor-pointer" />
                <span className="flex items-start gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-neutral-400 mt-0.5 shrink-0" />
                  I have permission to process these candidates’ data.
                </span>
              </label>
              {error && <p className="text-xs text-rose-600 dark:text-rose-400" role="alert">{error}</p>}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <button onClick={onClose} disabled={submitting} className="px-4 py-2.5 rounded-full text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 cursor-pointer disabled:opacity-50">
                  Cancel
                </button>
                <button
                  onClick={start}
                  disabled={!canStart}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin motion-reduce:animate-none" />}
                  {submitting ? 'Uploading…' : `Analyze ${count} resume${count === 1 ? '' : 's'} · ${cost} credit${cost === 1 ? '' : 's'}`}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
};
