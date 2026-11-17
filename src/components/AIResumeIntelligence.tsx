import React, { useState } from 'react';
import { Sparkles, CheckCircle2, AlertCircle, ArrowRight, Layers, FileCode2, TrendingUp } from 'lucide-react';

export const AIResumeIntelligence: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'experience' | 'skills' | 'achievements' | 'weaknesses' | 'recommendations'>('experience');

  const categoryDetails = {
    experience: {
      title: 'Work Experience Analysis',
      subtitle: 'Evaluates role progression, action verb strength, and quantified business impact.',
      before: '• Responsible for building front-end components using React and managing state.',
      after: '• Engineered 24+ high-throughput React dashboard components, cutting page load time by 42% and driving 1.4M monthly active sessions.',
      score: '92/100 Impact Score'
    },
    skills: {
      title: 'Skill Matrix & Tooling Scan',
      subtitle: 'Maps your tech stack against current engineering hiring demand.',
      before: '• Skills: JavaScript, React, CSS, HTML, Node',
      after: '• Frontend: React 18, TypeScript, Next.js, Tailwind CSS\n• Backend & Data: Node.js, REST APIs, PostgreSQL, Redis\n• Cloud & DevOps: Docker, CI/CD Pipelines, Datadog',
      score: '18 Hard Skills Extracted'
    },
    achievements: {
      title: 'Achievement Quantification',
      subtitle: 'Identifies missing key performance indicators (KPIs) and metric figures.',
      before: '• Led team to improve API speed.',
      after: '• Directed 5-person engineering squad to refactor legacy REST endpoints into gRPC microservices, reducing p99 latency from 850ms to 92ms.',
      score: '3× Metric Lift'
    },
    weaknesses: {
      title: 'Weakness & Red Flag Detection',
      subtitle: 'Catches employment gaps, passive voice, overused buzzwords, and vague bullet points.',
      before: '• Synergized cross-functional stakeholders to leverage paradigm shifts.',
      after: '• Coordinated product & design teams to ship 3 core features 2 weeks ahead of target launch date.',
      score: '0 Passive Phrases Found'
    },
    recommendations: {
      title: 'Actionable Improvement Roadmap',
      subtitle: 'Provides specific line-by-line rewrite recommendations in real time.',
      before: '• Managed database backups.',
      after: '• Automated daily PostgreSQL snapshot backups using AWS Lambda & S3, achieving 99.99% data durability compliance.',
      score: '12 Targeted Suggestions'
    }
  };

  const current = categoryDetails[activeCategory];

  return (
    <section className="py-16 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-neutral-900 dark:text-neutral-100 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Deep Neural Audit</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif-title font-normal text-neutral-900 dark:text-white">
            AI Resume Intelligence
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
            Every bullet point parsed, categorized, and scored for maximum recruiter conversion.
          </p>
        </div>

        {/* Category Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {(['experience', 'skills', 'achievements', 'weaknesses', 'recommendations'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                activeCategory === cat
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Realistic Interactive Comparison UI */}
        <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-lg space-y-6">
          
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                {current.title}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {current.subtitle}
              </p>
            </div>
            <span className="px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/20">
              {current.score}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Unoptimized Line */}
            <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20 space-y-2">
              <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider">
                <AlertCircle className="w-4 h-4" />
                <span>Original Unoptimized Bullet</span>
              </div>
              <pre className="text-xs text-neutral-700 dark:text-neutral-300 font-mono whitespace-pre-wrap leading-relaxed p-2 bg-white/50 dark:bg-neutral-900/50 rounded border border-red-500/10">
                {current.before}
              </pre>
              <p className="text-xs text-red-600/80 dark:text-red-400/80 italic">
                ⚠️ Issues: Lacks quantified metrics, passive verbs, generic terminology.
              </p>
            </div>

            {/* AI Optimized Line */}
            <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>Resume Screening System AI Enhanced Bullet</span>
              </div>
              <pre className="text-xs text-neutral-800 dark:text-neutral-100 font-mono whitespace-pre-wrap leading-relaxed p-2 bg-white/80 dark:bg-neutral-900/80 rounded border border-emerald-500/20">
                {current.after}
              </pre>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                ✓ Impact boost: High action verb, specific team size, measured business result.
              </p>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
