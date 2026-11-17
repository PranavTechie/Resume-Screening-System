import React, { useState } from 'react';
import { Download, Loader2, Trash2, ShieldCheck } from 'lucide-react';
import { apiClient } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { useJobs } from '../context/JobContext';
import { friendlyError } from '../utils/errorMessages';

/** Settings -> Your data: export everything as JSON, or delete all resumes/candidates and stored files. */
export const DataSettingsSection: React.FC = () => {
  const { toast } = useToast();
  const { resumes, refreshData } = useJobs();
  const [exporting, setExporting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const doExport = async () => {
    setExporting(true);
    try {
      await apiClient.exportMyData();
      toast.success('Your data export has been downloaded.');
    } catch (e: any) {
      toast.error(friendlyError(e, 'Could not export your data.'));
    } finally {
      setExporting(false);
    }
  };

  const doDelete = async () => {
    if (confirmText !== 'DELETE') return;
    setDeleting(true);
    try {
      const res = await apiClient.deleteAllResumes();
      setConfirmText('');
      await refreshData({ silent: true });
      toast.success(`${res.deleted} resume(s) and their stored files were deleted.`, { title: 'Data deleted' });
    } catch (e: any) {
      toast.error(friendlyError(e, 'Could not delete your data.'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-neutral-100 dark:border-neutral-800 pb-4">
        <h2 className="text-xl font-serif-title font-normal text-neutral-900 dark:text-white">Your data</h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Download a copy of everything we store for your account, or delete all resumes and candidates.
        </p>
      </div>

      <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-3">
        <div className="flex items-start gap-3">
          <Download className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Export my data (JSON)</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Profile, preferences, resumes and their extracted text, analyses, jobs, rankings, reports, credit history and upload batches. Original files are not included.
            </p>
          </div>
        </div>
        <button
          onClick={doExport}
          disabled={exporting}
          className="px-4 py-2.5 rounded-full text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
        >
          {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin motion-reduce:animate-none" /> : <Download className="w-3.5 h-3.5" />}
          Download export
        </button>
      </div>

      <div className="p-5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 space-y-3">
        <div className="flex items-start gap-3">
          <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Delete all my resumes and candidates</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1">
              Permanently deletes {resumes.length} resume{resumes.length === 1 ? '' : 's'}, their analyses, every job ranking and all stored files. Jobs, credits and your account stay. This cannot be undone.
            </p>
          </div>
        </div>
        <label className="block text-xs text-neutral-700 dark:text-neutral-200">
          Type <strong>DELETE</strong> to confirm
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="mt-1.5 w-full sm:w-64 h-9 px-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/30"
            autoComplete="off"
            aria-label="Type DELETE to confirm"
          />
        </label>
        <button
          onClick={doDelete}
          disabled={confirmText !== 'DELETE' || deleting}
          className="px-4 py-2.5 rounded-full text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2 cursor-pointer"
        >
          {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin motion-reduce:animate-none" /> : <Trash2 className="w-3.5 h-3.5" />}
          Delete everything
        </button>
      </div>

      <p className="flex items-start gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-px" />
        To delete your whole account (including jobs and credits), use Privacy & Security → Delete account.
      </p>
    </div>
  );
};
