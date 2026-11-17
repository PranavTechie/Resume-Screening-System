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
              Your career data is sensitive. Learn how Resume Screening System protects, parses, and encrypts your personal information.
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
          
          {/* Privacy Highlights Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 sm:p-6 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-white">
                <ShieldCheck className="w-4 h-4 text-neutral-900 dark:text-white" />
                <span>Zero Public Selling</span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                We never sell or monetize your submitted resumes to recruiters or advertisers.
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-white">
                <Lock className="w-4 h-4 text-neutral-900 dark:text-white" />
                <span>256-Bit Encryption</span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                All data transfers and server document storage use enterprise-grade encryption.
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-white">
                <Eye className="w-4 h-4 text-neutral-900 dark:text-white" />
                <span>Full User Control</span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                You can permanently purge your account data and uploaded resumes at any time.
              </p>
            </div>
          </div>

          {/* Section 1 */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold font-serif-title text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-2">
              1. Information We Collect
            </h2>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              We collect information to deliver precise career intelligence, ATS diagnostics, and personalized recommendations.
            </p>
            <ul className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300 pl-4 list-disc">
              <li><strong>Resume & Career Materials:</strong> Full text, formatting attributes, experience histories, contact information, and skill entries extracted from uploaded documents.</li>
              <li><strong>Account Credentials:</strong> Email address, name, authentication tokens, and billing preferences when creating an account.</li>
              <li><strong>Target Job Data:</strong> Job descriptions, company names, and requirements submitted for matching comparisons.</li>
              <li><strong>Usage Telemetry:</strong> Anonymized interaction metrics, browser type, and feature diagnostic logs.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold font-serif-title text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-2">
              2. How We Use Your Data
            </h2>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              Your data is processed strictly for providing and improving the Resume Screening System experience:
            </p>
            <div className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
              <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800">
                <span className="font-bold text-neutral-900 dark:text-white block text-xs mb-0.5">Core Functionality</span>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Executing ATS scanning models, calculating score breakdowns, and generating targeted interview prep questions.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800">
                <span className="font-bold text-neutral-900 dark:text-white block text-xs mb-0.5">Service Personalization</span>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Saving audit history so you can monitor progress across multiple document iterations.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold font-serif-title text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-2">
              3. Data Retention & Deletion Rights
            </h2>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              We retain personal data only for as long as necessary to fulfill the purposes outlined in this policy or as required by law.
            </p>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              You maintain the absolute right to export or permanently delete your account, uploaded resumes, and diagnostic reports. Deletion requests execute across primary databases within 24 hours.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold font-serif-title text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-2">
              4. Cookies & Security Controls
            </h2>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              We utilize essential session cookies required for authentication and state security. We do not deploy intrusive third-party tracking pixels for cross-site advertising.
            </p>
          </div>

          {/* Section 5 */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold font-serif-title text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-2">
              5. Privacy Questions & Complaints
            </h2>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              For privacy inquiries or to exercise your GDPR / CCPA data rights, please contact our Data Protection Officer:
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
