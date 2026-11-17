import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, ShieldCheck, Eye, Database } from 'lucide-react';

interface PrivacyPageProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onOpenAuth }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen selection:bg-purple-100 selection:text-purple-900 pb-16">
      
      {/* Header Banner */}
      <section className="pt-12 pb-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-b border-neutral-200/50 dark:border-neutral-800/50">
        
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors mb-6 cursor-pointer link-editorial"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>

        <div className="space-y-4">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/20 text-neutral-900 dark:text-neutral-100 text-xs font-semibold uppercase tracking-wider shadow-xs">
            <Lock className="w-3.5 h-3.5" />
            <span>PRIVACY POLICY</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-normal font-serif-title text-neutral-900 dark:text-white tracking-tight">
            Privacy Policy
          </h1>

          <div className="flex flex-wrap items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 gap-2 pt-1">
            <p className="max-w-xl text-sm text-neutral-600 dark:text-neutral-400">
              Resumes contain personal data. This page explains in plain language what we collect, how it is processed and how you control it.
            </p>
            <span className="font-mono text-xs px-2.5 py-1 rounded bg-neutral-200/60 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
              Last Updated: November 17, 2026
            </span>
          </div>
        </div>
      </section>

      {/* Main Content Article */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-10 shadow-xs space-y-10">
          
          {/* Privacy Highlights Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 sm:p-6 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-white">
                <ShieldCheck className="w-4 h-4 text-neutral-900 dark:text-white" />
                <span>We don't sell data</span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Resumes and candidate details are never sold or shared with advertisers or other recruiters.
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-white">
                <Lock className="w-4 h-4 text-neutral-900 dark:text-white" />
                <span>Encrypted & access-controlled</span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                HTTPS/TLS in transit, provider encryption at rest, and row-level security so each account only sees its own data.
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-white">
                <Eye className="w-4 h-4 text-neutral-900 dark:text-white" />
                <span>You stay in control</span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Export your data or delete resumes, candidates or your whole account from Settings at any time.
              </p>
            </div>
          </div>

          {/* Section 1 */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold font-serif-title text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-2">
              1. Information We Collect
            </h2>
            <ul className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300 pl-4 list-disc">
              <li><strong>Resumes you upload:</strong> the file, the text we extract from it, contact details found in it (name, email, phone, profile links) and the analysis results.</li>
              <li><strong>Account details:</strong> email address, name, sign-in data handled by our authentication provider, credit balance and plan.</li>
              <li><strong>Jobs and rankings:</strong> job descriptions you add, match scores, candidate status and notes about why a candidate scored as they did.</li>
              <li><strong>Upload consent:</strong> for bulk uploads, the time you confirmed you have permission to process the candidates' data.</li>
              <li><strong>Basic server logs:</strong> time, request path, status and account id, kept for security and debugging. Resume text and candidate contact details are not written to logs.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold font-serif-title text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-2">
              2. How We Use and Process Data
            </h2>
            <div className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
              <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800">
                <span className="font-bold text-neutral-900 dark:text-white block text-xs mb-0.5">Analysis and ranking</span>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Resume text (and, for images or scanned PDFs, the file itself) is sent to Google's Gemini API to extract skills, score the resume and compare it with a job. AI scores are suggestions only; hiring decisions should be made by a person.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800">
                <span className="font-bold text-neutral-900 dark:text-white block text-xs mb-0.5">Storage</span>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Data and files are stored with Supabase (database and file storage). Each file lives in a private folder that only your account can access.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800">
                <span className="font-bold text-neutral-900 dark:text-white block text-xs mb-0.5">Recruiters uploading candidate resumes</span>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  If you upload other people's resumes, you are responsible for having their permission and a valid purpose. We process that data only on your instructions.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold font-serif-title text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-2">
              3. Security
            </h2>
            <ul className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300 pl-4 list-disc">
              <li>All traffic between your browser, our API and our providers uses HTTPS (TLS).</li>
              <li>Our database and file storage provider encrypts stored data at rest.</li>
              <li>Row-level security rules mean an account can only read its own rows and files.</li>
              <li>Credits are checked and charged on the server, never in the browser.</li>
            </ul>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              No system is perfectly secure. If we learn of a breach that affects your data, we will notify you and the authorities as the law requires.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold font-serif-title text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-2">
              4. Retention, Export and Deletion
            </h2>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              We keep your data while your account is active. In <strong>Settings → Your data</strong> you can download everything as a JSON file or delete all resumes and candidates. Deleting a resume removes its database rows and its stored file straight away. Deleting your account removes your account data as well. Provider backups expire on their normal schedule.
            </p>
          </div>

          {/* Section 4b */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold font-serif-title text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-2">
              5. Your Rights in India (DPDP Act, 2023)
            </h2>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              Under India's Digital Personal Data Protection Act, you can ask what personal data we hold about you, ask us to correct or delete it, withdraw consent, and raise a complaint with us, and if it is not resolved, with the Data Protection Board of India. We use personal data only for the purpose it was given for. Candidates whose resumes were uploaded by a recruiter can contact that recruiter, or us, to exercise these rights.
            </p>
          </div>

          {/* Section 4c */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold font-serif-title text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-2">
              6. Cookies
            </h2>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              We use only what is needed to keep you signed in and remember your settings (for example theme). We do not use third-party advertising trackers.
            </p>
          </div>

          {/* Section 5 */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold font-serif-title text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-2">
              7. Privacy Questions & Complaints
            </h2>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              For privacy questions or to exercise your rights, contact us:
            </p>
            <div className="p-4 rounded-xl bg-neutral-900 text-white border border-neutral-800 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-white">Data Protection Office</p>
                <p className="text-xs text-neutral-400">Email: privacy@resumescreening.ai</p>
              </div>
              <button
                onClick={() => onOpenAuth('signup')}
                className="px-4 py-2 rounded-lg bg-white text-neutral-900 font-bold text-xs hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                Submit Privacy Request
              </button>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};
