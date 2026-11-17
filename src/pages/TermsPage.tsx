import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, FileText, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface TermsPageProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onOpenAuth }) => {
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
            <FileText className="w-3.5 h-3.5" />
            <span>TERMS OF SERVICE</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-normal font-serif-title text-neutral-900 dark:text-white tracking-tight">
            Terms of Service
          </h1>

          <div className="flex flex-wrap items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 gap-2 pt-1">
            <p className="max-w-xl text-sm text-neutral-600 dark:text-neutral-400">
              Please read these Terms of Service carefully before using the Resume Screening System platform and services.
            </p>
            <span className="font-mono text-xs px-2.5 py-1 rounded bg-neutral-200/60 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
              Last Updated: August 10, 2026
            </span>
          </div>
        </div>
      </section>

      {/* Main Content Article */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-10 shadow-xs space-y-10">
          
          {/* Section 1 */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold font-serif-title text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-2">
              1. Agreement & Acceptance
            </h2>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              By accessing, browsing, or utilizing the Resume Screening System web application, platform API, or associated intelligence tools (collectively, the &quot;Service&quot;), you acknowledge that you have read, understood, and agreed to be legally bound by these Terms of Service.
            </p>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              If you do not agree with any part of these terms, you must immediately discontinue your use of the Service. We reserve the right to update or modify these Terms at any time without prior individual notice. Continued use after changes constitutes acceptance.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold font-serif-title text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-2">
              2. Description of Service
            </h2>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              Resume Screening System provides candidate intelligence, automated ATS score optimization, resume auditing, job matching diagnostics, and AI interview simulation tools.
            </p>
            <ul className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300 pl-4 list-disc">
              <li><strong>Resume Analysis:</strong> Automated parsing and feedback on resume format, ATS compatibility, and skill presentation.</li>
              <li><strong>Job Matching:</strong> Comparative analysis between candidate documents and target job descriptions.</li>
              <li><strong>Interview Simulation:</strong> Question generation and candidate readiness evaluations.</li>
            </ul>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 italic pt-1">
              Note: Resume Screening System is an advisory intelligence system. We do not guarantee job placements, employment offers, or interview guarantees from third-party employers.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold font-serif-title text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-2">
              3. User Accounts & Responsibilities
            </h2>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              To access certain features, you may be required to register an account. You agree to provide accurate, current, and complete information during registration and to keep your credentials confidential.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800 space-y-1">
                <span className="text-xs font-bold text-neutral-900 dark:text-white block">Account Security</span>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  You are solely responsible for all activities occurring under your account session credentials.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800 space-y-1">
                <span className="text-xs font-bold text-neutral-900 dark:text-white block">Accurate Ownership</span>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  You affirm that you own or have explicit rights to upload all submitted resumes and career materials.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold font-serif-title text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-2">
              4. Subscriptions, Payments & Refunds
            </h2>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              Paid tiers (including Pro Career and Enterprise plans) provide access to expanded scan volume, deep neural audits, and unlimited interview prep modules.
            </p>
            <ul className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300 pl-4 list-disc">
              <li><strong>Billing Cycles:</strong> Subscriptions bill automatically on a monthly or annual recurring basis until cancelled.</li>
              <li><strong>Cancellation:</strong> You may cancel your subscription at any time via your account settings. Cancellation takes effect at the end of the current billing cycle.</li>
              <li><strong>Money-Back Guarantee:</strong> Pro plans include a 14-day risk-free guarantee for new subscribers as specified in plan details.</li>
            </ul>
          </div>

          {/* Section 5 */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold font-serif-title text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-2">
              5. Intellectual Property Rights
            </h2>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              All software, algorithms, designs, brand marks, and user interface components associated with Resume Screening System remain the exclusive intellectual property of Resume Screening System Inc. Users retain full ownership of their original submitted resume content.
            </p>
          </div>

          {/* Section 6 */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold font-serif-title text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-2">
              6. Limitation of Liability
            </h2>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              To the maximum extent permitted by applicable law, Resume Screening System shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your access to or inability to access the Service.
            </p>
          </div>

          {/* Section 7 */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold font-serif-title text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-2">
              7. Contact Information
            </h2>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              If you have any questions or concerns regarding these Terms of Service, please reach out to our legal and support team:
            </p>
            <div className="p-4 rounded-xl bg-neutral-900 text-white border border-neutral-800 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-white">Resume Screening System Legal Operations</p>
                <p className="text-xs text-neutral-400">Email: legal@resumescreening.ai</p>
              </div>
              <button
                onClick={() => onOpenAuth('signup')}
                className="px-4 py-2 rounded-lg bg-white text-neutral-900 font-bold text-xs hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                Contact Support
              </button>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};
