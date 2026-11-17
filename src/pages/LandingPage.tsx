import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResumeAnalysis } from '../types';
import { SAMPLE_RESUMES } from '../data/mockData';
import { Hero } from '../components/Hero';
import { ProductVisualization } from '../components/ProductVisualization';
import { HowItWorks } from '../components/HowItWorks';
import { FaqSection } from '../components/FaqSection';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  const navigate = useNavigate();
  const [selectedAnalysis, setSelectedAnalysis] = useState<ResumeAnalysis>(SAMPLE_RESUMES[0]);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleAnalyzeClick = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    navigate('/resume');
  };

  const scrollToElement = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <main className="min-h-screen selection:bg-purple-100 selection:text-purple-900">
      
      {/* 1. What is Resume Screening System? (Hero) */}
      <Hero
        onSelectResume={(resume) => setSelectedAnalysis(resume)}
        onAnalyzeClick={handleAnalyzeClick}
        onSeeHowClick={() => scrollToElement('how-it-works')}
      />

      {/* 2. What does it analyze? (Product Intelligence in Action) */}
      <ProductVisualization
        analysis={selectedAnalysis}
        onProfileChange={(id) => {
          const found = SAMPLE_RESUMES.find(r => r.id === id);
          if (found) setSelectedAnalysis(found);
        }}
      />

      {/* 3. What does the user actually get? (How It Works Workflow) */}
      <HowItWorks 
        onAnalyzeClick={() => scrollToElement('features')} 
      />

      {/* 4. Key Questions & Answers (FAQ) */}
      <FaqSection />

    </main>
  );
};
