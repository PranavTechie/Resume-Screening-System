import { supabase } from './supabase';

/**
 * Resume Screening System Frontend API Client
 *
 * Connects to the authoritative Express REST API backend.
 * Uses VITE_API_URL environment variable or defaults to http://localhost:3000.
 */

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

/** Row from GET /api/credits/history (credit_transactions table). Deductions are stored as negative amounts. */
export interface CreditTransaction {
  id: string;
  amount: number;
  type: 'DEDUCTION' | 'PURCHASE' | 'BONUS' | 'REFUND';
  description: string;
  reference_id?: string | null;
  created_at: string;
}

export interface ApiError extends Error {
  status?: number;
  code?: string;
  requiredCredits?: number;
  availableCredits?: number;
}

async function getAuthToken(): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      localStorage.setItem('supabase_access_token', session.access_token);
      return session.access_token;
    }
  } catch (err) {
    console.warn('Failed to retrieve active Supabase session token:', err);
  }
  return localStorage.getItem('supabase_access_token') || '';
}

async function requestApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = await getAuthToken();
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options?.headers || {}),
      },
    });
  } catch (err: any) {
    const error: ApiError = new Error(`Unable to connect to Resume Screening System API backend (${API_BASE_URL}). Please verify backend server is running.`);
    error.code = 'NETWORK_ERROR';
    throw error;
  }

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const errCode = json?.error?.code || json?.code || `HTTP_${res.status}`;
    const errMsg = json?.error?.message || json?.message || `Request failed with status ${res.status}`;
    const error: ApiError = new Error(errMsg);
    error.status = res.status;
    error.code = errCode;
    error.requiredCredits = json?.error?.requiredCredits;
    error.availableCredits = json?.error?.availableCredits;
    throw error;
  }

  if (!json || json.success === false) {
    const errMsg = json?.error?.message || json?.message || 'API request failed';
    const error: ApiError = new Error(errMsg);
    throw error;
  }

  return json.data;
}

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  try {
    return await requestApi<T>(endpoint, options);
  } catch (err) {
    console.warn(`Fetch notice on ${endpoint}:`, err);
    return null;
  }
}

export const apiClient = {
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return requestApi<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  async getMe() {
    return fetchJson<{ user: any; credits: number; preferences: any }>('/api/auth/me');
  },

  async deleteAccount() {
    return requestApi<{ message: string }>('/api/auth/account', {
      method: 'DELETE',
    });
  },

  async uploadResume(file: File, signal?: AbortSignal) {
    console.log('[ResumeAPI] upload started');
    const token = await getAuthToken();

    if (!token) {
      console.error('[ResumeAPI] analysis failed: missing token');
      const error: ApiError = new Error('Authentication required. Please sign in to analyze resumes.');
      error.status = 401;
      error.code = 'MISSING_TOKEN';
      throw error;
    }

    const formData = new FormData();
    formData.append('file', file);

    // Hard client safety timeout (80 seconds) to guarantee the browser never waits indefinitely
    const clientAbortController = new AbortController();
    let isClientTimedOut = false;
    const safetyTimeoutId = setTimeout(() => {
      isClientTimedOut = true;
      clientAbortController.abort();
    }, 80000);

    // Forward parent signal abort if provided
    if (signal) {
      signal.addEventListener('abort', () => {
        clientAbortController.abort();
      });
    }

    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/api/resumes`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
        signal: clientAbortController.signal,
      });
      console.log(`[ResumeAPI] response received - status: ${res.status}`);
    } catch (err: any) {
      clearTimeout(safetyTimeoutId);
      if (isClientTimedOut) {
        console.error('[ResumeAPI] analysis failed: client safety timeout (45s) triggered');
        const error: ApiError = new Error('Analysis timed out. Please try again.');
        error.name = 'TimeoutError';
        error.code = 'AI_ANALYSIS_TIMEOUT';
        error.status = 504;
        throw error;
      }
      if (err.name === 'AbortError' || signal?.aborted) {
        console.log('[ResumeAPI] analysis aborted');
        const error: ApiError = new Error('Analysis was cancelled.');
        error.name = 'AbortError';
        error.code = 'CANCELLED';
        throw error;
      }
      console.error('[ResumeAPI] analysis failed: network connection error');
      const error: ApiError = new Error(`Unable to connect to Resume Screening System API backend (${API_BASE_URL}). Please verify backend server is running.`);
      error.code = 'NETWORK_ERROR';
      throw error;
    } finally {
      clearTimeout(safetyTimeoutId);
    }

    const json = await res.json().catch(() => null);
    console.log(`[ResumeAPI] response parsed - success: ${json?.success}`);

    if (!res.ok) {
      let errMsg = `Upload failed with status code ${res.status}`;
      let errCode = json?.error?.code || json?.code || 'PROCESS_FAILED';

      if (json?.error) {
        errMsg = typeof json.error === 'object' ? (json.error.message || json.error.code || errMsg) : json.error;
      } else if (json?.message) {
        errMsg = typeof json.message === 'string' ? json.message : errMsg;
      }

      // Explicit status mapping
      if (res.status === 402 || errCode === 'INSUFFICIENT_CREDITS') {
        errCode = 'INSUFFICIENT_CREDITS';
        errMsg = json?.error?.message || 'You need 1 credit to analyze this resume.';
      } else if (res.status === 413 || errCode === 'FILE_TOO_LARGE') {
        errCode = 'FILE_TOO_LARGE';
        errMsg = json?.error?.message || 'File size exceeds the 5MB limit.';
      } else if (errCode === 'TEXT_EXTRACTION_FAILED') {
        errCode = 'TEXT_EXTRACTION_FAILED';
        errMsg = json?.error?.message || "We couldn't read enough text from this resume. Please ensure the document or image is clear.";
      } else if (res.status === 422 || errCode === 'GEMINI_VALIDATION_FAILED') {
        errCode = errCode || 'GEMINI_VALIDATION_FAILED';
        errMsg = json?.error?.message || 'AI analysis could not validate the document structure. Please try again.';
      } else if (res.status === 429 || errCode === 'RATE_LIMITED') {
        errCode = 'RATE_LIMITED';
        errMsg = json?.error?.message || 'Too many requests. Please wait a moment and try again.';
      } else if (res.status === 503 || errCode === 'AI_SERVICE_UNAVAILABLE') {
        errCode = 'AI_SERVICE_UNAVAILABLE';
        errMsg = json?.error?.message || 'AI analysis is temporarily unavailable. Please try again.';
      } else if (res.status === 504 || errCode === 'AI_ANALYSIS_TIMEOUT' || errCode === 'DATABASE_TIMEOUT') {
        errCode = 'AI_ANALYSIS_TIMEOUT';
        errMsg = json?.error?.message || 'AI analysis timed out. Please try again.';
      }

      console.error(`[ResumeAPI] analysis failed with error code: ${errCode} (${res.status})`);
      const error: ApiError = new Error(errMsg);
      error.status = res.status;
      error.code = errCode;
      throw error;
    }

    if (!json || !json.success) {
      console.error('[ResumeAPI] analysis failed: invalid backend JSON payload');
      const errMsg = typeof json?.error === 'object' ? json.error.message : (json?.message || 'Backend resume processing failed.');
      throw new Error(errMsg);
    }

    console.log('[ResumeAPI] analysis completed');
    return json.data;
  },

  async listResumes() {
    return fetchJson<any[]>('/api/resumes');
  },

  async createJob(jobData: { title: string; company?: string; description: string; location?: string }) {
    return requestApi<any>('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  },

  async listJobs() {
    return fetchJson<any[]>('/api/jobs');
  },

  async attachResumesToJob(jobId: string, resumeIds: string[]) {
    return requestApi<any>(`/api/jobs/${jobId}/attach`, {
      method: 'POST',
      body: JSON.stringify({ resumeIds }),
    });
  },

  async rankResumesForJob(jobId: string, signal?: AbortSignal) {
    return requestApi<any>(`/api/jobs/${jobId}/rank`, {
      method: 'POST',
      signal,
    });
  },

  async getCredits() {
    return fetchJson<{ credits: number }>('/api/credits/balance');
  },

  /** Newest first. Resolves to null if the request fails (callers can hide their UI quietly). */
  async getCreditHistory() {
    return fetchJson<CreditTransaction[]>('/api/credits/history');
  },

  async generateJobDescription(title: string, company?: string, keywords?: string) {
    return requestApi<{ description: string; creditsRemaining: number }>('/api/jobs/generate-description', {
      method: 'POST',
      body: JSON.stringify({ title, company, keywords }),
    });
  },

  async listReports() {
    return fetchJson<any[]>('/api/reports');
  },

  async exportReport(reportId: string) {
    return fetchJson<{ reportId: string; exportAllowed: boolean }>(`/api/reports/${reportId}/export`);
  },
};
