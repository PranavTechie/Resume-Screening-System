import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { LogoutConfirmModal } from './components/LogoutConfirmModal';
import { PageTransition } from './components/PageTransition';
import { LandingPage } from './pages/LandingPage';
import { PricingPage } from './pages/PricingPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ResumeLibraryPage } from './pages/ResumeLibraryPage';
import { JobsLibraryPage } from './pages/JobsLibraryPage';
import { CreateJobPage } from './pages/CreateJobPage';
import { JobWorkspacePage } from './pages/JobWorkspacePage';
import { ReportsPage } from './pages/ReportsPage';
import { CreditsPage } from './pages/CreditsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ResumeIntelligencePage } from './pages/ResumeIntelligencePage';
import { CandidateIntelligencePage } from './pages/CandidateIntelligencePage';
import { DashboardPage } from './pages/DashboardPage';
import { JobProvider, useJobs } from './context/JobContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider, ToastRefRegister } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppContent() {
  const { jobs, resumes } = useJobs();
  const isReady = Boolean(jobs && resumes);
  const { isLoggedIn, loading, signOut } = useAuth();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot-password'>('login');
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Handle direct navigation to /login, /signup, or /forgot-password
  useEffect(() => {
    if (isLoggedIn) return;
    if (location.pathname === '/login') {
      setAuthMode('login');
      setAuthModalOpen(true);
    } else if (location.pathname === '/signup') {
      setAuthMode('signup');
      setAuthModalOpen(true);
    } else if (location.pathname === '/forgot-password') {
      setAuthMode('forgot-password');
      setAuthModalOpen(true);
    }
  }, [location.pathname, isLoggedIn]);

  const handleOpenAuth = (mode: 'login' | 'signup' | 'forgot-password') => {
    if (isLoggedIn) {
      return;
    }
    setAuthMode(mode);
    setAuthModalOpen(true);
    if (
      location.pathname === '/' ||
      location.pathname === '/login' ||
      location.pathname === '/signup' ||
      location.pathname === '/forgot-password' ||
      location.pathname === '/reset-password'
    ) {
      navigate(`/${mode}`);
    }
  };

  const handleCloseAuth = () => {
    setAuthModalOpen(false);
    if (
      location.pathname === '/login' ||
      location.pathname === '/signup' ||
      location.pathname === '/forgot-password' ||
      location.pathname === '/reset-password'
    ) {
      navigate('/');
    }
  };

  const handleLoginSuccess = () => {
    setAuthModalOpen(false);
    navigate('/');
  };

  const handleOpenLogoutModal = () => {
    setLogoutModalOpen(true);
  };

  const handleConfirmLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await signOut();
      setLogoutModalOpen(false);
      navigate('/');
    } catch (err) {
      console.error('Error during logout:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-page flex flex-col items-center justify-center text-neutral-900 dark:text-neutral-100 space-y-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white dark:bg-neutral-900 border border-line shadow-sm text-purple-600 dark:text-purple-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold tracking-tight">Restoring Resume Screening System Session...</p>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">Verifying secure authentication token</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page text-neutral-900 dark:text-neutral-100 transition-colors duration-250 flex flex-col justify-between">
      <ScrollToTop />
      
      {/* Header Navbar */}
      <Navbar 
        onOpenAuth={handleOpenAuth} 
        isLoggedIn={isLoggedIn}
        onLogout={handleOpenLogoutModal}
      />

      {/* Page Routing */}
      <main className="flex-grow flex flex-col">
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location}>
            {/* Public Routes */}
            <Route path="/" element={<PageTransition key={location.pathname} isReady={isReady}>{isLoggedIn ? <DashboardPage /> : <LandingPage onOpenAuth={handleOpenAuth} />}</PageTransition>} />
            <Route path="/pricing" element={<PageTransition key={location.pathname} isReady={isReady}><PricingPage onOpenAuth={handleOpenAuth} /></PageTransition>} />
            <Route path="/terms" element={<PageTransition key={location.pathname} isReady={isReady}><TermsPage onOpenAuth={handleOpenAuth} /></PageTransition>} />
            <Route path="/privacy" element={<PageTransition key={location.pathname} isReady={isReady}><PrivacyPage onOpenAuth={handleOpenAuth} /></PageTransition>} />
            <Route path="/login" element={isLoggedIn ? <Navigate to="/" replace /> : <PageTransition key={location.pathname} isReady={isReady}><LandingPage onOpenAuth={handleOpenAuth} /></PageTransition>} />
            <Route path="/signup" element={isLoggedIn ? <Navigate to="/" replace /> : <PageTransition key={location.pathname} isReady={isReady}><LandingPage onOpenAuth={handleOpenAuth} /></PageTransition>} />
            <Route path="/forgot-password" element={isLoggedIn ? <Navigate to="/" replace /> : <PageTransition key={location.pathname} isReady={isReady}><LandingPage onOpenAuth={handleOpenAuth} /></PageTransition>} />
            <Route path="/reset-password" element={isLoggedIn ? <Navigate to="/" replace /> : <PageTransition key={location.pathname} isReady={isReady}><ResetPasswordPage onOpenAuth={handleOpenAuth} /></PageTransition>} />

            {/* Protected Authenticated Routes */}
            <Route 
              path="/resume" 
              element={isLoggedIn ? <PageTransition key={location.pathname} isReady={isReady}><ResumeLibraryPage /></PageTransition> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/resumes/:resumeId/analysis" 
              element={isLoggedIn ? <PageTransition key={location.pathname} isReady={isReady}><ResumeIntelligencePage /></PageTransition> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/resume/:resumeId/analysis" 
              element={isLoggedIn ? <PageTransition key={location.pathname} isReady={isReady}><ResumeIntelligencePage /></PageTransition> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/resume/analysis/:resumeId" 
              element={isLoggedIn ? <PageTransition key={location.pathname} isReady={isReady}><ResumeIntelligencePage /></PageTransition> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/analysis/resume/:resumeId" 
              element={isLoggedIn ? <PageTransition key={location.pathname} isReady={isReady}><ResumeIntelligencePage /></PageTransition> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/jobs" 
              element={isLoggedIn ? <PageTransition key={location.pathname} isReady={isReady}><JobsLibraryPage /></PageTransition> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/jobs/new" 
              element={isLoggedIn ? <PageTransition key={location.pathname} isReady={isReady}><CreateJobPage /></PageTransition> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/jobs/:jobId" 
              element={isLoggedIn ? <PageTransition key={location.pathname} isReady={isReady}><JobWorkspacePage /></PageTransition> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/jobs/:jobId/candidates/:resumeId/analysis" 
              element={isLoggedIn ? <PageTransition key={location.pathname} isReady={isReady}><CandidateIntelligencePage /></PageTransition> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/analysis/job-match/:resumeId/:jobId" 
              element={isLoggedIn ? <PageTransition key={location.pathname} isReady={isReady}><CandidateIntelligencePage /></PageTransition> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/reports" 
              element={isLoggedIn ? <PageTransition key={location.pathname} isReady={isReady}><ReportsPage /></PageTransition> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/credits" 
              element={isLoggedIn ? <PageTransition key={location.pathname} isReady={isReady}><CreditsPage /></PageTransition> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/settings" 
              element={isLoggedIn ? <PageTransition key={location.pathname} isReady={isReady}><SettingsPage /></PageTransition> : <Navigate to="/login" replace />} 
            />

            {/* Catch-all fallback */}
            <Route path="*" element={<PageTransition key={location.pathname} isReady={isReady}><LandingPage onOpenAuth={handleOpenAuth} /></PageTransition>} />
          </Routes>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <Footer onOpenAuth={handleOpenAuth} isLoggedIn={isLoggedIn} />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={handleCloseAuth}
        initialMode={authMode}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={logoutModalOpen}
        onClose={() => {
          if (!isLoggingOut) {
            setLogoutModalOpen(false);
          }
        }}
        onConfirm={handleConfirmLogout}
        isLoggingOut={isLoggingOut}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ToastRefRegister />
        <AuthProvider>
          <BrowserRouter>
            <JobProvider>
              <AppContent />
            </JobProvider>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
