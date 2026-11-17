import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient, Batch } from '../lib/api';

const POLL_MS = 2000;
const DISMISSED_KEY = 'rss_dismissed_batches';
const RECENT_MS = 24 * 60 * 60 * 1000;

function readDismissed(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

export function dismissBatch(id: string) {
  const set = readDismissed();
  set.add(id);
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(set).slice(-200)));
}

export const isFinished = (b?: Batch | null) => !!b && b.status !== 'active';

/** Poll one batch every 2 s while it is active; stops by itself when it finishes. */
export function useBatchPolling(batchId: string | null, onTick?: (b: Batch, prev: Batch | null) => void) {
  const [batch, setBatch] = useState<Batch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const prevRef = useRef<Batch | null>(null);
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  const load = useCallback(async () => {
    if (!batchId) return null;
    try {
      const b = await apiClient.getBatch(batchId);
      setBatch(b);
      setError(null);
      onTickRef.current?.(b, prevRef.current);
      prevRef.current = b;
      return b;
    } catch (e: any) {
      setError(e?.message || 'Could not load progress.');
      return null;
    }
  }, [batchId]);

  useEffect(() => {
    if (!batchId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    prevRef.current = null;
    const loop = async () => {
      const b = await load();
      if (cancelled) return;
      // Keep polling while active (and retry on transient errors); stop once finished.
      if (!b || b.status === 'active') timer = setTimeout(loop, b ? POLL_MS : POLL_MS * 3);
    };
    void loop();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [batchId, load, nonce]);

  /** Start polling again (e.g. after "Retry failed" re-activates a finished batch). */
  const restart = useCallback(() => setNonce((n) => n + 1), []);

  return { batch, error, reload: load, restart, setBatch };
}

/** Batches to show on a page: active ones + recent finished ones not dismissed. Survives reloads. */
export function useVisibleBatches(opts: { kind: Batch['kind']; jobId?: string }) {
  const [ids, setIds] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    try {
      const list = await apiClient.listBatches({ jobId: opts.jobId });
      const dismissed = readDismissed();
      const now = Date.now();
      const visible = list
        .filter((b) => b.kind === opts.kind)
        .filter((b) => b.status === 'active' || (!dismissed.has(b.id) && now - new Date(b.createdAt).getTime() < RECENT_MS))
        .slice(0, 3)
        .map((b) => b.id);
      setIds(visible);
    } catch {
      /* page still works without the list */
    }
  }, [opts.kind, opts.jobId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = useCallback((id: string) => setIds((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, 3)), []);
  const remove = useCallback((id: string) => {
    dismissBatch(id);
    setIds((prev) => prev.filter((x) => x !== id));
  }, []);

  return { ids, add, remove, refresh };
}
