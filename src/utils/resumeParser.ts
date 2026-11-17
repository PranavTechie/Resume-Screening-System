/**
 * Client-side file checks (type, size). Real parsing and AI analysis happen on the server.
 * PDF page counting lives in uploadPreflight.ts (lazy-loads pdf.js only when needed).
 */
export const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.txt', '.jpg', '.jpeg', '.png'];

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'image/jpeg',
  'image/png',
];

export const ALLOWED_ACCEPT_STRING = '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain,image/jpeg,image/png';
export const BULK_ACCEPT_STRING = `${ALLOWED_ACCEPT_STRING},.zip,application/zip,application/x-zip-compressed`;

export const MAX_FILE_SIZE_MB = 5;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const MAX_ZIP_SIZE_BYTES = 50 * 1024 * 1024;
export const MAX_BATCH_FILES = 50;
export const MAX_PDF_PAGES = 5;

export const HELPER_TEXT = 'Supports PDF, DOCX, DOC, TXT, JPG & PNG';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  extension?: string;
}

export function fileExtension(name: string): string {
  const lastDot = (name || '').lastIndexOf('.');
  return lastDot !== -1 ? name.substring(lastDot).toLowerCase() : '';
}

/** Validates file extension and size. */
export function validateResumeFile(file: File): ValidationResult {
  if (!file) return { valid: false, error: 'No file selected.' };
  if (file.size > MAX_FILE_SIZE_BYTES) return { valid: false, error: 'File size exceeds the 5MB limit.' };
  if (file.size === 0) return { valid: false, error: 'Selected file is empty (0 bytes).' };
  const ext = fileExtension(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `Unsupported file format (${ext || 'unknown'}). Please upload a PDF, DOCX, DOC, TXT, JPG, or PNG file.` };
  }
  return { valid: true, extension: ext };
}
