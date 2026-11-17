import React, { useState } from 'react';
import { Check, Sparkles, HelpCircle, ChevronDown, Zap, CheckCircle } from 'lucide-react';
import { useAuth, UserPlan } from '../context/AuthContext';

interface PricingPageProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onOpenAuth }) => {
  const [isYearly, setIsYearly] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const { isLoggedIn, plan: activePlan } = useAuth();
  const currentPlan: UserPlan | null = isLoggedIn ? (activePlan || 'free') : null;

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handlePlanClick = (targetPlan: UserPlan) => {
    if (targetPlan === currentPlan) return;

    if (!isLoggedIn) {
      onOpenAuth('signup');
    }
  };

  const FAQS = [
    {
      question: 'Can I start for free?',
      answer: 'Yes! The Free Starter plan includes 10 free AI welcome credits with access to all Resume Screening System features including resume AI analysis, ATS intelligence, skill insights, AI job descriptions, job matching, candidate ranking, and PDF report exports with no credit card required.'
    },
    {
      question: 'What does the Pro plan include?',
      answer: 'The Pro plan includes 50 AI credits per month and full access to every Resume Screening System feature, including deep resume audits, ATS intelligence, AI job matching, and PDF report exports.'
    },
    {
      question: 'What is the difference between Pro and Pro Max?',
      answer: 'All plans include access to every single Resume Screening System feature. Pro Max provides 150 AI credits per month compared to 50 on Pro for higher volume resume analysis and candidate screening.'
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes, you can cancel or pause your subscription at any time directly from your account dashboard. Your plan access will remain active until the end of your current billing period.'
    },
    {
      question: 'Will my resume data be secure?',
      answer: 'Your data privacy is guaranteed. Resumes are processed over encrypted TLS 256-bit connections and stored securely. We never sell your resume or personal details to recruiters or third-party advertisers.'
    }
  ];

  const COMPARISON_FEATURES = [
    { name: 'AI Credits Allocation', free: '10 Welcome Credits', pro: '50 Credits / mo', max: '150 Credits / mo' },
    { name: 'Resume AI Analysis', free: '✓', pro: '✓', max: '✓' },
    { name: 'ATS Intelligence', free: '✓', pro: '✓', max: '✓' },
    { name: 'Skills & Improvement Insights', free: '✓', pro: '✓', max: '✓' },
    { name: 'AI Job Description Generation', free: '✓', pro: '✓', max: '✓' },
    { name: 'Job Matching & Candidate Ranking', free: '✓', pro: '✓', max: '✓' },
    { name: 'Reports', free: '✓', pro: '✓', max: '✓' },
    { name: 'PDF Report Export', free: '✓', pro: '✓', max: '✓' },
  ];

  return (
    <div className="min-h-screen selection:bg-purple-100 selection:text-purple-900 pb-12">
      
      {/* Hero Section */}
      <section className="pt-16 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center relative">
        <div className="max-w-3xl mx-auto space-y-4">
          
          {/* Small Eyebrow */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/20 text-neutral-900 dark:text-neutral-100 text-xs font-semibold uppercase tracking-wider shadow-xs">
            <Zap className="w-3.5 h-3.5" />
            <span>Pricing Plans</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif-title font-normal text-neutral-900 dark:text-white tracking-tight leading-[1.1]">
            Simple plans for smarter career growth.
          </h1>

          {/* Supporting Text */}
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 max-w-xl mx-auto font-normal leading-relaxed">
            All features unlocked on every tier. Choose the plan with the monthly AI credit allowance that fits your workflow.
          </p>

          {/* Billing Toggle */}
          <div className="pt-6 flex items-center justify-center">
            <div className="inline-flex items-center p-1.5 rounded-xl bg-neutral-200/80 dark:bg-neutral-900 border border-neutral-300/80 dark:border-neutral-800 text-xs font-medium shadow-xs">
              <button
                onClick={() => setIsYearly(false)}
                className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                  !isYearly
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                Monthly
              </button>
              
              <button
                onClick={() => setIsYearly(true)}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                  isYearly
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <span>Yearly</span>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-purple-100 text-neutral-900 dark:bg-purple-950 dark:text-neutral-100 border border-purple-200 dark:border-purple-800 font-bold uppercase tracking-wider">
                  Save 25%
                </span>
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Pricing Cards Section */}
      <section className="py-6 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          
          {/* CARD 1: FREE STARTER */}
          <div className={`bg-white dark:bg-neutral-900/90 border rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all shadow-sm relative group ${
            currentPlan === 'free'
              ? 'border-2 border-emerald-500 shadow-emerald-500/10'
              : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-md'
          }`}>
            {currentPlan === 'free' && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-emerald-600 text-white font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                <CheckCircle className="w-3 h-3" />
                <span>CURRENT PLAN</span>
              </div>
            )}

            <div className="space-y-4 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 block">
                FREE STARTER
              </span>

              <div className="space-y-1">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl sm:text-4xl font-serif-title font-bold text-neutral-900 dark:text-white">
                    ₹0
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                    / month
                  </span>
                </div>
                <div className="text-xs text-transparent select-none min-h-[16px]">
                  &nbsp;
                </div>
              </div>

              <div className="pt-2 flex justify-center">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-neutral-900 dark:text-neutral-100 font-bold text-xs border border-purple-500/20 shadow-xs">
                  <Zap className="w-3.5 h-3.5 fill-current text-purple-600 dark:text-purple-400" />
                  <span>10 AI Credits</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={() => handlePlanClick('free')}
                disabled={currentPlan === 'free'}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-sm ${
                  currentPlan === 'free'
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-default border border-neutral-200 dark:border-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-neutral-900 dark:border-neutral-700 cursor-pointer'
                }`}
              >
                <span>{currentPlan === 'free' ? 'Current Plan ✓' : 'Get Started Free →'}</span>
              </button>
            </div>
          </div>

          {/* CARD 2: PRO (MOST POPULAR) */}
          <div className={`bg-white dark:bg-neutral-900 border-2 rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all shadow-xl relative group transform md:-translate-y-1 ${
            currentPlan === 'pro'
              ? 'border-emerald-500 shadow-emerald-500/10'
              : 'border-purple-600 dark:border-purple-500'
          }`}>
            
            {/* Badge */}
            <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full text-white font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 shadow-md ${
              currentPlan === 'pro' ? 'bg-emerald-600' : 'bg-purple-600'
            }`}>
              {currentPlan === 'pro' ? <CheckCircle className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
              <span>{currentPlan === 'pro' ? 'CURRENT PLAN' : 'MOST POPULAR'}</span>
            </div>

            <div className="space-y-4 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-900 dark:text-white block">
                PRO
              </span>

              <div className="space-y-1">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl sm:text-4xl font-serif-title font-bold text-neutral-900 dark:text-white">
                    {isYearly ? '₹224' : '₹299'}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                    / month
                  </span>
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 min-h-[16px]">
                  {isYearly ? '(billed ₹2,688/yr)' : <span>&nbsp;</span>}
                </div>
              </div>

              <div className="pt-2 flex justify-center">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-neutral-900 dark:text-neutral-100 font-bold text-xs border border-purple-500/20 shadow-xs">
                  <Zap className="w-3.5 h-3.5 fill-current text-purple-600 dark:text-purple-400" />
                  <span>50 AI Credits</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={() => handlePlanClick('pro')}
                disabled={currentPlan === 'pro'}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md ${
                  currentPlan === 'pro'
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-default border border-neutral-200 dark:border-neutral-700'
                    : 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer'
                }`}
              >
                <span>{currentPlan === 'pro' ? 'Current Plan ✓' : 'Start Pro →'}</span>
              </button>
            </div>
          </div>

          {/* CARD 3: PRO MAX */}
          <div className={`bg-white dark:bg-neutral-900/90 border-2 rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all shadow-sm relative group ${
            currentPlan === 'career_max'
              ? 'border-emerald-500 shadow-emerald-500/10'
              : 'border-[#C9A24B] hover:shadow-md'
          }`}>
            {/* Badge */}
            <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full text-white font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 shadow-md ${
              currentPlan === 'career_max' ? 'bg-emerald-600' : 'bg-[#C9A24B]'
            }`}>
              {currentPlan === 'career_max' ? <CheckCircle className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
              <span>{currentPlan === 'career_max' ? 'CURRENT PLAN' : 'PREMIUM'}</span>
            </div>

            <div className="space-y-4 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 block">
                PRO MAX
              </span>

              <div className="space-y-1">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl sm:text-4xl font-serif-title font-bold text-neutral-900 dark:text-white">
                    {isYearly ? '₹524' : '₹699'}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                    / month
                  </span>
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 min-h-[16px]">
                  {isYearly ? '(billed ₹6,288/yr)' : <span>&nbsp;</span>}
                </div>
              </div>

              <div className="pt-2 flex justify-center">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-neutral-900 dark:text-neutral-100 font-bold text-xs border border-purple-500/20 shadow-xs">
                  <Zap className="w-3.5 h-3.5 fill-current text-purple-600 dark:text-purple-400" />
                  <span>150 AI Credits</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={() => handlePlanClick('career_max')}
                disabled={currentPlan === 'career_max'}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-sm ${
                  currentPlan === 'career_max'
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-default border border-neutral-200 dark:border-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-neutral-900 dark:border-neutral-700 cursor-pointer'
                }`}
              >
                <span>{currentPlan === 'career_max' ? 'Current Plan ✓' : 'Get Pro Max →'}</span>
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-neutral-200/80 dark:border-neutral-800/80 mt-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-serif-title font-normal text-neutral-900 dark:text-white">
            Compare every feature
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
            A granular overview of what is included across each intelligence tier.
          </p>
        </div>

        {/* Minimal Premium Table */}
        <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 shadow-sm">
          <table className="w-full text-left text-xs border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400">
                <th className="py-4 px-6 font-semibold uppercase tracking-wider w-2/5">Feature</th>
                <th className="py-4 px-6 font-semibold uppercase tracking-wider text-center">Free</th>
                <th className="py-4 px-6 font-semibold uppercase tracking-wider text-center text-neutral-900 dark:text-white font-bold">Pro</th>
                <th className="py-4 px-6 font-semibold uppercase tracking-wider text-center">Pro Max</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800/60 text-neutral-800 dark:text-neutral-200">
              {COMPARISON_FEATURES.map((item, idx) => (
                <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                  <td className="py-3.5 px-6 font-medium text-neutral-900 dark:text-neutral-200">{item.name}</td>
                  <td className="py-3.5 px-6 text-center text-neutral-500 dark:text-neutral-400">{item.free}</td>
                  <td className="py-3.5 px-6 text-center font-bold text-neutral-900 dark:text-white bg-purple-50/60 dark:bg-purple-950/20">{item.pro}</td>
                  <td className="py-3.5 px-6 text-center text-neutral-700 dark:text-neutral-300">{item.max}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-neutral-200/80 dark:border-neutral-800/80">
        <div className="text-center mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/20 text-neutral-900 dark:text-neutral-100 text-xs font-semibold">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Pricing FAQ</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif-title font-normal text-neutral-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
            Have questions about subscriptions or credits? We have answers.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-900/60 shadow-xs transition-colors"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 focus:outline-none cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-neutral-900 dark:text-white' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 border-t border-neutral-100 dark:border-neutral-800/60 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
};
