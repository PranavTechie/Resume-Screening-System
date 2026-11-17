/**
 * One place that turns API error codes into friendly, specific messages.
 * The server message is used when it is already specific (e.g. "detected: research paper").
 */
import type { ApiError, BatchItem } from '../lib/api';

const MESSAGES: Record<string, string> = {
  TOO_MANY_PAGES: 'This PDF has more than 5 pages. Resumes are usually 1-5 pages, so it was not analyzed. No credit was used.',
  TOO_LITTLE_TEXT: "We couldn't find enough text in this file. Please upload a text-based resume (not a blank or image-only page). No credit was used.",
  TOO_LONG_NOT_A_RESUME: 'This document is much longer than a resume, so it was not analyzed. No credit was used.',
  NOT_A_RESUME: "This doesn't look like a resume. Please upload a CV. No credit was used.",
  TOO_MANY_REJECTED_UPLOADS: 'Too many files were rejected in the last 24 hours. Please try again later and upload only resumes/CVs.',
  DUPLICATE_RESUME: 'This file is already in your library. No credit was used.',
  DUPLICATE_CANDIDATE: 'Same candidate (same email or phone) is already in this job.',
  INSUFFICIENT_CREDITS: "You don't have enough credits for this. Top up on the Pricing page.",
  FILE_TOO_LARGE: 'File is larger than 5 MB.',
  UNSUPPORTED_TYPE: 'Unsupported file type. Use PDF, DOCX, DOC, TXT, JPG or PNG.',
  EMPTY_FILE: 'The file is empty.',
  ENCRYPTED: 'This file is password-protected.',
  TEXT_EXTRACTION_FAILED: "We couldn't read this file clearly. Please upload a sharper scan or a text PDF.",
  AI_SERVICE_UNAVAILABLE: 'Our AI is busy right now. Please try again in a minute. You were not charged.',
  AI_ANALYSIS_TIMEOUT: 'This took too long. Please try again. You were not charged.',
  GEMINI_VALIDATION_FAILED: 'The AI returned an unreadable answer. Please try again. You were not charged.',
  STORAGE_UPLOAD_FAILED: 'We could not store this file. Use "Retry failed" in a moment.',
  STORAGE_FILE_MISSING: 'The file was never stored. Please upload it again.',
  PROCESSING_TIMEOUT: 'Processing took too long and was stopped. You were refunded.',
  CANCELLED: 'Cancelled. The credit was refunded.',
  CONSENT_REQUIRED: 'Please confirm you have permission to process these candidates’ data.',
  TOO_MANY_FILES: 'You can upload at most 50 files per batch.',
  BATCH_RATE_LIMIT: 'You can start at most 20 batches per hour. Please try again later.',
  AI_RATE_LIMIT: 'Too many AI requests. Please wait a minute and try again.',
  RANKING_IN_PROGRESS: 'This job is already being ranked. Please wait for it to finish.',
  NO_RESUMES_ATTACHED: 'Attach resumes to this job before ranking.',
  ZIP_UNSAFE_PATH: 'This ZIP contains unsafe file paths and was rejected.',
  ZIP_NESTED_ARCHIVE: 'ZIP files inside the ZIP are not allowed. Please upload one flat ZIP.',
  ZIP_TOO_MANY_FILES: 'A ZIP can contain at most 50 resumes.',
  ZIP_TOO_LARGE: 'This ZIP is too large (max 50 MB, 100 MB unpacked).',
  ZIP_INVALID: 'This ZIP file is damaged or not a real ZIP.',
  MIXED_UPLOAD: 'Upload either separate files or one ZIP, not both.',
  JOB_NOT_FOUND: 'This job was deleted.',
  RESUME_NOT_FOUND: 'This resume was deleted.',
  NETWORK_ERROR: 'Unable to reach the server. Please check your connection and try again.',
  TOO_MANY_REQUESTS: 'Too many requests. Please wait a few minutes.',
};

/** Codes whose server message carries useful specifics (detected type, duplicate name, counts). */
const PREFER_SERVER_MESSAGE = new Set(['NOT_A_RESUME', 'DUPLICATE_RESUME', 'DUPLICATE_CANDIDATE', 'INSUFFICIENT_CREDITS', 'TOO_MANY_PAGES']);

export function friendlyError(err: Partial<ApiError> | null | undefined, fallback = 'Something went wrong. Please try again.'): string {
  if (!err) return fallback;
  const code = err.code || '';
  const serverMsg = typeof err.message === 'string' ? err.message : '';
  if (code === 'NOT_A_RESUME') {
    const detected = err.details?.documentType;
    return detected
      ? `This doesn't look like a resume (detected: ${detected}). Please upload a CV. No credit was used.`
      : serverMsg || MESSAGES.NOT_A_RESUME;
  }
  if (PREFER_SERVER_MESSAGE.has(code) && serverMsg) return serverMsg;
  return MESSAGES[code] || serverMsg || fallback;
}

export function itemMessage(item: Pick<BatchItem, 'status' | 'errorCode' | 'errorMessage' | 'duplicateOfName'>): string | null {
  if (item.status === 'duplicate') return item.duplicateOfName ? `Duplicate of ${item.duplicateOfName}` : 'Duplicate';
  if (item.status === 'rejected' && item.errorCode === 'NOT_A_RESUME') return item.errorMessage || MESSAGES.NOT_A_RESUME;
  if (item.status === 'rejected' || item.status === 'failed' || item.status === 'cancelled') {
    if (item.errorCode && PREFER_SERVER_MESSAGE.has(item.errorCode) && item.errorMessage) return item.errorMessage;
    return (item.errorCode && MESSAGES[item.errorCode]) || item.errorMessage || null;
  }
  if (item.status === 'queued' && item.errorCode) return 'Retrying shortly…';
  return null;
}
