/**
 * Local checks that run BEFORE any credit is spent: type, size, PDF page count, duplicate names.
 */
import { fileExtension, MAX_BATCH_FILES, MAX_PDF_PAGES, MAX_ZIP_SIZE_BYTES, validateResumeFile } from './resumeParser';

export type PreflightStatus = 'ok' | 'error' | 'warning' | 'checking';

export interface PreflightEntry {
  key: string;
  file: File;
  status: PreflightStatus;
  message?: string;
  pageCount?: number | null;
}

let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null;

async function loadPdfJs() {
  if (!pdfjsPromise) {
    pdfjsPromise = Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')]).then(([lib, worker]) => {
      lib.GlobalWorkerOptions.workerSrc = (worker as { default: string }).default;
      return lib;
    });
  }
  return pdfjsPromise;
}

/** Page count of a PDF in the browser, or null if it can't be read (server will decide). */
export async function getPdfPageCount(file: File): Promise<number | null> {
  try {
    const pdfjs = await loadPdfJs();
    const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const n = doc.numPages;
    await doc.cleanup?.();
    await (doc as unknown as { destroy?: () => Promise<void> }).destroy?.();
    return n;
  } catch {
    return null;
  }
}

export function isZip(file: File): boolean {
  return fileExtension(file.name) === '.zip' || /zip/.test(file.type);
}

export const fileKey = (f: File) => `${f.name}:${f.size}:${f.lastModified}`;

/** Check one resume file locally. */
export async function preflightOne(file: File): Promise<Omit<PreflightEntry, 'key'>> {
  const basic = validateResumeFile(file);
  if (!basic.valid) return { file, status: 'error', message: basic.error };
  if (fileExtension(file.name) === '.pdf') {
    const pages = await getPdfPageCount(file);
    if (pages !== null && pages > MAX_PDF_PAGES) {
      return { file, status: 'error', pageCount: pages, message: `${pages} pages. Resumes must be ${MAX_PDF_PAGES} pages or fewer.` };
    }
    return { file, status: 'ok', pageCount: pages };
  }
  return { file, status: 'ok' };
}

/** Check a list; flags duplicate names inside the selection and the 50-file cap. */
export async function preflightFiles(files: File[]): Promise<PreflightEntry[]> {
  const seen = new Map<string, number>();
  const entries: PreflightEntry[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = await preflightOne(file);
    const nameKey = file.name.toLowerCase();
    const entry: PreflightEntry = { key: `${fileKey(file)}:${i}`, ...result };
    if (entry.status === 'ok' && seen.has(nameKey)) {
      entry.status = 'warning';
      entry.message = 'Same file name selected twice. Exact copies are skipped for free.';
    }
    seen.set(nameKey, i);
    if (i >= MAX_BATCH_FILES && entry.status !== 'error') {
      entry.status = 'error';
      entry.message = `Only ${MAX_BATCH_FILES} files per batch.`;
    }
    entries.push(entry);
  }
  return entries;
}

export function checkZip(file: File): string | null {
  if (file.size > MAX_ZIP_SIZE_BYTES) return 'ZIP is larger than 50 MB.';
  if (file.size === 0) return 'ZIP is empty.';
  return null;
}

/**
 * Reads the ZIP central directory in the browser (no unzipping) to count the resumes inside,
 * so the cost confirmation is exact before any credit is spent.
 */
export async function inspectZip(file: File): Promise<{ resumes: string[]; skipped: string[]; error?: string }> {
  const sizeError = checkZip(file);
  if (sizeError) return { resumes: [], skipped: [], error: sizeError };
  const buf = new DataView(await file.arrayBuffer());
  const len = buf.byteLength;
  let eocd = -1;
  for (let i = len - 22; i >= Math.max(0, len - 22 - 65535); i--) {
    if (buf.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return { resumes: [], skipped: [], error: 'This ZIP file is damaged or not a real ZIP.' };
  const total = buf.getUint16(eocd + 10, true);
  let offset = buf.getUint32(eocd + 16, true);
  const decoder = new TextDecoder();
  const resumes: string[] = [];
  const skipped: string[] = [];
  for (let n = 0; n < total && offset + 46 <= len; n++) {
    if (buf.getUint32(offset, true) !== 0x02014b50) break;
    const nameLen = buf.getUint16(offset + 28, true);
    const extraLen = buf.getUint16(offset + 30, true);
    const commentLen = buf.getUint16(offset + 32, true);
    const name = decoder.decode(new Uint8Array(buf.buffer, offset + 46, nameLen)).split(String.fromCharCode(92)).join('/');
    offset += 46 + nameLen + extraLen + commentLen;
    const base = name.split('/').pop() || '';
    if (name.endsWith('/') || name.startsWith('__MACOSX/') || base.startsWith('.')) continue;
    if (name.split('/').includes('..') || name.startsWith('/')) return { resumes: [], skipped: [], error: 'This ZIP contains unsafe file paths.' };
    const ext = fileExtension(base);
    if (ext === '.zip') return { resumes: [], skipped: [], error: 'ZIP files inside the ZIP are not allowed.' };
    if (['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png'].includes(ext)) resumes.push(base);
    else skipped.push(base);
  }
  if (resumes.length + skipped.length > MAX_BATCH_FILES) {
    return { resumes, skipped, error: `A ZIP can contain at most ${MAX_BATCH_FILES} resumes.` };
  }
  return { resumes, skipped };
}
