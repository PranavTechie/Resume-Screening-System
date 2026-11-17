import { useCallback, useRef } from 'react';
import { useJobs } from '../context/JobContext';

/**
 * Custom hook to prefetch job workspace data when hovering over job cards
 */
export const usePrefetchJob = () => {
  const { getJob } = useJobs();
  const prefetchedJobs = useRef<Set<string>>(new Set());

  const prefetchJob = useCallback(
    (jobId: string) => {
      if (!jobId || prefetchedJobs.current.has(jobId)) return;

      const job = getJob(jobId);
      if (job) {
        prefetchedJobs.current.add(jobId);
      }
    },
    [getJob]
  );

  return { prefetchJob };
};
