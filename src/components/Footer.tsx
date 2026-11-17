import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Logo } from './Logo';
import { useRevealOnce } from './motion/primitives';

interface FooterProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
  isLoggedIn?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAuth, isLoggedIn = false }) => {
  const navigate = useNavigate();
  // fade in once (driven by animate: App's AnimatePresence disables `initial` on first load)
  const { ref: fadeRef, play, reduce } = useRevealOnce<HTMLDivElement>();

  const scrollTo = (id: string) => {
    if (window.location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-page text-neutral-800 dark:text-neutral-200 border-t border-line text-xs">
      <motion.div
        ref={fadeRef}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: play ? 1 : 0 }}
        transition={reduce ? { duration: 0 } : { duration: 0.6, ease: 'easeOut' }}
      >
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Brand Info Left */}
          <div className="md:col-span-5 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <Logo size="sm" />
            </Link>

            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm leading-relaxed">
              AI-powered resume intelligence for modern job seekers. Elevate your ATS pass rate, detect skill gaps, and match with top technology roles.
            </p>

            <div className="text-xs text-neutral-400 dark:text-neutral-500">
              © {new Date().getFullYear()} Resume Screening System. All rights reserved.
            </div>
          </div>

          {/* Links Grid Right */}
          <div className={`md:col-span-7 grid grid-cols-2 ${isLoggedIn ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-6`}>
            
            {isLoggedIn ? (
              <>
                {/* Product Column */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
                    Product
                  </h4>
                  <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
                    <li><button onClick={() => navigate('/resume')} className="link-editorial hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer">Resume Analysis</button></li>
                    <li><button onClick={() => navigate('/jobs')} className="link-editorial hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer">Job Match</button></li>
                    <li><button onClick={() => navigate('/reports')} className="link-editorial hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer">Reports</button></li>
                    <li><button onClick={() => navigate('/pricing')} className="link-editorial hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer">Pricing</button></li>
                  </ul>
                </div>

                {/* Resources Column */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
                    Resources
                  </h4>
                  <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
                    <li><button onClick={() => scrollTo('faq')} className="link-editorial hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer">FAQ</button></li>
                    <li><a href="mailto:support@resumescreening.ai" className="link-editorial hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer">Contact Support</a></li>
                  </ul>
                </div>

                {/* Account Column */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
                    Account
                  </h4>
                  <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
                    <li><button onClick={() => navigate('/settings')} className="link-editorial hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer">Profile / Settings</button></li>
                    <li><button onClick={() => navigate('/credits')} className="link-editorial hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer">Credits / Billing</button></li>
                  </ul>
                </div>

                {/* Legal Column */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
                    Legal
                  </h4>
                  <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
                    <li><button onClick={() => navigate('/privacy')} className="link-editorial hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer">Privacy</button></li>
                    <li><button onClick={() => navigate('/terms')} className="link-editorial hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer">Terms</button></li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                {/* Product Column */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
                    Product
                  </h4>
                  <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
                    <li><button onClick={() => scrollTo('features')} className="link-editorial hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer">Resume Analysis</button></li>
                    <li><button onClick={() => scrollTo('features')} className="link-editorial hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer">ATS Optimization</button></li>
                    <li><button onClick={() => scrollTo('features')} className="link-editorial hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer">Job Match</button></li>
                    <li><button onClick={() => navigate('/pricing')} className="link-editorial hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer">Pricing</button></li>
                  </ul>
                </div>

                {/* Resources Column */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
                    Resources
                  </h4>
                  <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
                    <li><button onClick={() => scrollTo('how-it-works')} className="link-editorial hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer">How It Works</button></li>
                    <li><button onClick={() => scrollTo('faq')} className="link-editorial hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer">FAQ</button></li>
                  </ul>
                </div>

                {/* Company Column */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
                    Company
                  </h4>
                  <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
                    <li><button onClick={() => onOpenAuth('login')} className="link-editorial hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer">About</button></li>
                    <li><button onClick={() => onOpenAuth('login')} className="link-editorial hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer">Contact</button></li>
                    <li><button onClick={() => navigate('/privacy')} className="link-editorial hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer">Privacy</button></li>
                    <li><button onClick={() => navigate('/terms')} className="link-editorial hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer">Terms</button></li>
                  </ul>
                </div>
              </>
            )}

          </div>

        </div>

      </motion.div>
    </footer>
  );
};

