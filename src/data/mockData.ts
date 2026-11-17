import { ResumeAnalysis, PricingPlan, FaqItem, JobItem } from '../types';

export const SAMPLE_RESUMES: ResumeAnalysis[] = [
  {
    id: 'sample-1',
    candidateName: 'Alex Morgan',
    targetRole: 'Senior Frontend Engineer',
    status: 'Ready',
    resumeScore: 89,
    atsCompatibility: 94,
    skillsDetectedCount: 18,
    aiImprovementsCount: 12,
    detectedSkills: [
      'React',
      'TypeScript',
      'Python',
      'Node.js',
      'GraphQL',
      'Tailwind CSS',
      'PostgreSQL',
      'REST APIs',
      'System Design',
      'CI/CD',
      'Next.js',
      'Jest',
      'AWS',
      'Git',
      'Agile',
      'Microservices',
      'Webpack',
      'Performance Tuning'
    ],
    missingSkills: ['Docker', 'GraphQL Subscriptions', 'Terraform', 'Cloud Security'],
    aiRecommendation: 'Add measurable metrics to your recent experience to improve your impact score (e.g. "reduced bundle size by 34% resulting in 1.2s faster LCP").',
    atsBreakdown: {
      keywordMatch: 92,
      formatting: 96,
      experienceRelevance: 91,
    },
    jobMatch: {
      roleTitle: 'Senior Staff Frontend Engineer',
      company: 'Stripe',
      matchPercentage: 91,
      strongMatches: ['React', 'TypeScript', 'REST APIs', 'Performance Tuning'],
      skillGaps: ['AWS', 'Docker', 'GraphQL Subscriptions'],
    }
  },
  {
    id: 'sample-2',
    candidateName: 'Sophia Lin',
    targetRole: 'Staff Full Stack Developer',
    status: 'Ready',
    resumeScore: 92,
    atsCompatibility: 96,
    skillsDetectedCount: 22,
    aiImprovementsCount: 8,
    detectedSkills: [
      'React',
      'TypeScript',
      'Node.js',
      'Go',
      'PostgreSQL',
      'Redis',
      'Docker',
      'Kubernetes',
      'GraphQL',
      'Tailwind CSS',
      'AWS S3',
      'Terraform',
      'CI/CD',
      'gRPC',
      'Kafka',
      'Microservices',
      'Jest',
      'Cypress',
      'Distributed Systems',
      'Security Hardening',
      'Monitoring (Datadog)',
      'Git'
    ],
    missingSkills: ['PyTorch', 'Vector Databases (Pinecone)', 'OpenAI API Integration'],
    aiRecommendation: 'Highlight your microservices architecture overhaul in the top summary bullet to capitalize on high recruiter search volume.',
    atsBreakdown: {
      keywordMatch: 95,
      formatting: 98,
      experienceRelevance: 94,
    },
    jobMatch: {
      roleTitle: 'Staff Full Stack Platform Engineer',
      company: 'Vercel',
      matchPercentage: 95,
      strongMatches: ['TypeScript', 'Node.js', 'Go', 'Docker', 'Kubernetes'],
      skillGaps: ['Vector Databases (Pinecone)', 'AI Agent Architectures'],
    }
  },
  {
    id: 'sample-3',
    candidateName: 'Marcus Vance',
    targetRole: 'Lead Product Manager',
    status: 'Ready',
    resumeScore: 85,
    atsCompatibility: 88,
    skillsDetectedCount: 16,
    aiImprovementsCount: 14,
    detectedSkills: [
      'Product Strategy',
      'User Research',
      'A/B Testing',
      'SQL',
      'Figma',
      'Agile / Scrum',
      'Roadmap Design',
      'Mixpanel Analytics',
      'Customer Interviews',
      'Sprint Planning',
      'SaaS Metrics (LTV/CAC)',
      'Wireframing',
      'API Product Specs',
      'Go-To-Market Strategy',
      'Cross-functional Leadership',
      'Jira'
    ],
    missingSkills: ['Python for Data Analysis', 'Growth Hacking Frameworks', 'Enterprise RFP Negotiations'],
    aiRecommendation: 'Quantify your product launch outcomes with dollar impact or user conversion lift percentages instead of qualitative descriptions.',
    atsBreakdown: {
      keywordMatch: 86,
      formatting: 92,
      experienceRelevance: 87,
    },
    jobMatch: {
      roleTitle: 'Principal Growth Product Manager',
      company: 'Linear',
      matchPercentage: 88,
      strongMatches: ['Product Strategy', 'A/B Testing', 'Mixpanel Analytics', 'SQL'],
      skillGaps: ['Python Data Pipelines', 'Growth Funnel Automation'],
    }
  }
];

export const FAQS: FaqItem[] = [
  {
    question: 'What does Resume Screening System analyze?',
    answer: 'Resume Screening System performs a multi-dimensional AI scan evaluating structural formatting, ATS parser compatibility, keyword frequency against targeted industry benchmarks, quantifiable impact metrics, skill completeness, and leadership signals.'
  },
  {
    question: 'How does ATS scoring work?',
    answer: 'Our ATS engine simulates top enterprise applicant tracking systems (including Workday, Greenhouse, Lever, and Taleo). It tests font readability, bullet structure, margin parsing, header hierarchy, and hard skill extraction to produce a realistic pass-through percentage.'
  },
  {
    question: 'How does Job Match work?',
    answer: 'Job Match compares your resume directly against any job description URL or pasted text using semantic embedding models. It highlights exact skill alignments, missing requirements, and provides sentence-by-sentence recommendations to maximize relevance.'
  },
  {
    question: 'Can Resume Screening System identify missing skills?',
    answer: 'Yes. By analyzing real-time hiring data across thousands of job descriptions in your target field, Resume Screening System detects critical technology or process gaps missing from your resume and suggests relevant keywords to incorporate.'
  },
  {
    question: 'Is my resume data private?',
    answer: 'Absolutely. Your resume data is encrypted end-to-end and strictly private to you. We never sell your personal information or share your resume with third-party recruiters without your explicit permission.'
  },
  {
    question: 'Can I analyze multiple resumes?',
    answer: 'Yes! You can upload and maintain multiple resume variations (e.g. Full Stack vs Frontend, Product Lead vs Technical Program Manager) and compare each against specific job roles.'
  }
];

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Free Starter',
    description: 'Essential AI feedback for active job seekers looking to upgrade their CV.',
    priceMonthly: 0,
    priceAnnual: 0,
    features: [
      '1 Full Resume Analysis per month',
      'Basic ATS compatibility audit',
      'Top 5 detected skills extraction',
      '3 actionable improvement suggestions',
      'PDF resume export inspection'
    ],
    ctaText: 'Analyze Free'
  },
  {
    id: 'pro',
    name: 'Pro Career',
    description: 'Complete intelligence toolkit for ambitious professionals landing top offers.',
    priceMonthly: 19,
    priceAnnual: 14,
    popular: true,
    features: [
      'Unlimited Resume Scans & Uploads',
      'Advanced ATS compatibility engine (Workday, Greenhouse, Lever)',
      'Real-time Job Description Matcher & Gap Analysis',
      'AI Bullet Point Enhancer & Metric Quantifier',
      'Targeted Interview Question Generator & STAR Framework',
      'Priority email support'
    ],
    ctaText: 'Start 7-Day Free Trial'
  },
  {
    id: 'unlimited',
    name: 'Executive Pass',
    description: 'For senior leaders, staff engineers, and executives targeting $250k+ roles.',
    priceMonthly: 39,
    priceAnnual: 29,
    features: [
      'Everything in Pro Career',
      '1-on-1 Human Recruiter Review option',
      'Multi-resume variant management (up to 10 versions)',
      'Direct LinkedIn profile optimization insights',
      'Salary benchmarking & negotiation playbooks',
      'Dedicated 24/7 priority concierge'
    ],
    ctaText: 'Get Executive Access'
  }
];

export const COMPANY_LOGOS = [
  { name: 'Google', symbol: 'G' },
  { name: 'Stripe', symbol: 'S' },
  { name: 'Vercel', symbol: '▲' },
  { name: 'Meta', symbol: '∞' },
  { name: 'Linear', symbol: 'L' },
  { name: 'OpenAI', symbol: '✴' },
];

export const INITIAL_JOBS: JobItem[] = [
  {
    id: 'job-1',
    title: 'Software Engineer',
    company: 'TechCorp',
    description: `We are looking for a Senior Software Engineer to help design, build, and maintain our scalable cloud platform services.

Key Responsibilities:
- Architect and develop high-throughput web applications using React, TypeScript, and Node.js.
- Optimize REST and GraphQL APIs for low latency and high availability.
- Collaborate with product and design teams to build sleek, accessible user interfaces.
- Write clean, well-tested code with comprehensive unit and end-to-end test coverage.

Requirements:
- 4+ years of full-stack software development experience.
- Strong proficiency in TypeScript, React, Node.js, and PostgreSQL or MongoDB.
- Experience with REST APIs, Microservices, and Cloud Services (AWS / GCP / Cloudflare).
- Solid understanding of web performance optimization and system design fundamentals.`,
    createdAt: 'Aug 8, 2026',
    lastUpdated: 'Today',
    status: 'Screened',
    attachedResumeIds: ['sample-1', 'sample-2', 'sample-3'],
    isRanked: true,
    matches: {
      'sample-1': {
        resumeId: 'sample-1',
        candidateName: 'Alex Morgan',
        targetRole: 'Senior Frontend Engineer',
        matchPercentage: 89,
        matchSummary: 'Strong frontend and TypeScript alignment. Meets primary full-stack technical requirements with minor gaps in Docker & Container orchestration.',
        strongMatches: ['React', 'TypeScript', 'Node.js', 'REST APIs', 'System Design'],
        skillGaps: ['Docker', 'Cloud Security']
      },
      'sample-2': {
        resumeId: 'sample-2',
        candidateName: 'Sophia Lin',
        targetRole: 'Staff Full Stack Developer',
        matchPercentage: 82,
        matchSummary: 'Exceeds infrastructure and backend requirements. Exceptional cloud architecture profile with deep Go and Kubernetes experience.',
        strongMatches: ['TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'Microservices'],
        skillGaps: ['Pinecone', 'AI Agents']
      },
      'sample-3': {
        resumeId: 'sample-3',
        candidateName: 'Marcus Vance',
        targetRole: 'Lead Product Manager',
        matchPercentage: 74,
        matchSummary: 'Strong product background with SQL capabilities. Lacks hands-on software development experience required for this engineering role.',
        strongMatches: ['SQL', 'Agile', 'Product Strategy'],
        skillGaps: ['React', 'TypeScript', 'Node.js', 'REST APIs']
      }
    }
  },
  {
    id: 'job-2',
    title: 'Frontend Developer',
    company: 'Stripe',
    description: `Stripe is hiring a Senior Frontend Developer to elevate our financial dashboard experience.

Responsibilities:
- Build world-class web applications in React and TypeScript.
- Implement responsive, pixel-perfect user interfaces adhering to strict accessibility standards.
- Optimize complex client-side state management and page load speed.

Requirements:
- 3+ years in modern React frontend engineering.
- Deep understanding of CSS, Tailwind CSS, performance metrics, and browser rendering.`,
    createdAt: 'Aug 5, 2026',
    lastUpdated: 'Yesterday',
    status: 'Active',
    attachedResumeIds: ['sample-1', 'sample-2'],
    isRanked: false
  },
  {
    id: 'job-3',
    title: 'Data Analyst',
    company: 'Linear',
    description: `Seeking a Data Analyst to build analytics models and product growth funnels.

Requirements:
- Strong SQL and Python skills for querying large datasets.
- Experience with Mixpanel, Amplitude, or Google Analytics.
- Ability to synthesize product data into clear executive recommendations.`,
    createdAt: 'Aug 2, 2026',
    lastUpdated: '2 days ago',
    status: 'Active',
    attachedResumeIds: ['sample-3'],
    isRanked: false
  }
];

