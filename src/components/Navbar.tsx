import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup, useReducedMotion } from 'motion/react';
import { ChevronDown, LayoutDashboard, LogOut, Settings, Tag, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';

interface NavbarProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
  isLoggedIn?: boolean;
  onLogout?: () => void;
}

interface NavItem {
  label: string;
  active: boolean;
  /** router link (logged in) */
  to?: string;
  /** in-page action (logged out landing links) */
  onClick?: () => void;
}

/* ---------- shared surface tokens (pill, dropdown and mobile card use the same glass) ---------- */
const GLASS =
  'bg-white/80 dark:bg-neutral-900/70 border border-black/5 dark:border-white/10 ' +
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(28,25,23,0.04),0_10px_28px_-10px_rgba(28,25,23,0.10)] ' +
  'dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_2px_rgba(0,0,0,0.45),0_14px_36px_-12px_rgba(0,0,0,0.65)]';
const GLASS_SCROLLED =
  'bg-white/85 dark:bg-neutral-900/75 border border-black/5 dark:border-white/10 ' +
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(28,25,23,0.06),0_14px_36px_-10px_rgba(28,25,23,0.16)] ' +
  'dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_2px_4px_rgba(0,0,0,0.5),0_18px_44px_-12px_rgba(0,0,0,0.75)]';
/** dropdown + mobile card: same tokens, near-opaque so page content never bleeds through the text */
const MENU_SURFACE =
  'bg-white/95 dark:bg-neutral-900/95 border border-black/5 dark:border-white/10 ' +
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(28,25,23,0.06),0_16px_40px_-12px_rgba(28,25,23,0.18)] ' +
  'dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_2px_4px_rgba(0,0,0,0.5),0_20px_48px_-12px_rgba(0,0,0,0.8)]';
const FOCUS = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60 focus-visible:ring-offset-0';
const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

type CreditTone = 'ok' | 'low' | 'empty';
const creditTone = (credits: number, unlimited: boolean): CreditTone =>
  unlimited || credits > 2 ? 'ok' : credits > 0 ? 'low' : 'empty';
const CREDIT_TEXT: Record<CreditTone, string> = {
  ok: 'text-neutral-700 dark:text-neutral-200',
  low: 'text-amber-700 dark:text-amber-400',
  empty: 'text-rose-700 dark:text-rose-400',
};
const CREDIT_DOT: Record<CreditTone, string | null> = { ok: null, low: 'bg-amber-500', empty: 'bg-rose-500' };

/** Count that slides/fades once when the value changes (not on first render). */
const CreditCount: React.FC<{ value: string }> = ({ value }) => {
  const reduce = !!useReducedMotion();
  return (
    <span className="relative inline-flex overflow-hidden tabular-nums">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

/** Credits pill: neutral > 2, amber 1-2, rose 0. Links to /pricing. */
const CreditsPill: React.FC<{ credits: number; unlimited: boolean; onNavigate?: () => void; className?: string; withTooltip?: boolean }> = ({
  credits, unlimited, onNavigate, className = '', withTooltip = true,
}) => {
  const tone = creditTone(credits, unlimited);
  const dot = CREDIT_DOT[tone];
  const tipId = useId();
  const label = unlimited ? 'Unlimited' : String(credits);
  return (
    <Link
      to="/pricing"
      onClick={onNavigate}
      aria-label={`${label} credits left. Get more credits`}
      aria-describedby={withTooltip ? tipId : undefined}
      className={`group relative inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-[13px] font-semibold bg-neutral-900/[0.04] dark:bg-white/[0.06] hover:bg-neutral-900/[0.07] dark:hover:bg-white/10 transition-colors ${CREDIT_TEXT[tone]} ${FOCUS} ${className}`}
    >
      {dot ? <span className={`w-1.5 h-1.5 rounded-full ${dot}`} aria-hidden="true" /> : <Zap className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" aria-hidden="true" />}
      <CreditCount value={label} />
      <span className="font-medium opacity-70">credits</span>
      {withTooltip && (
        <span
          id={tipId}
          role="tooltip"
          className="pointer-events-none absolute right-0 top-full mt-2 whitespace-nowrap rounded-md bg-neutral-900 dark:bg-neutral-100 px-2 py-1 text-xs font-medium text-white dark:text-neutral-900 opacity-0 translate-y-0.5 transition-[opacity,translate] duration-150 delay-0 group-hover:opacity-100 group-hover:translate-y-0 group-hover:delay-300 group-focus-visible:opacity-100 group-focus-visible:translate-y-0"
        >
          Credits left. Click to get more
        </span>
      )}
    </Link>
  );
};

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth, isLoggedIn = false, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const { user, credits } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const reduce = !!useReducedMotion();

  const shellRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuId = useId();
  const profileMenuId = useId();

  const displayName = user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'User');
  const displayEmail = user?.email || '';
  const isUnlimited = credits >= 999900;
  const tone = creditTone(credits, isUnlimited);

  const isPricingActive = location.pathname === '/pricing';

  /* ---------- scroll state: stronger glass + slightly shorter pill ---------- */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ---------- close menus on route change ---------- */
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  const closeMobileMenu = useCallback((restoreFocus: boolean) => {
    setMobileMenuOpen(false);
    if (restoreFocus) menuButtonRef.current?.focus();
  }, []);

  /* ---------- mobile menu: Esc, outside tap, resize to desktop ---------- */
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobileMenu(true);
    };
    const onPointer = (e: PointerEvent) => {
      if (shellRef.current && !shellRef.current.contains(e.target as Node)) closeMobileMenu(false);
    };
    const mq = window.matchMedia('(min-width: 768px)');
    const onMq = () => {
      if (mq.matches) setMobileMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    mq.addEventListener('change', onMq);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
      mq.removeEventListener('change', onMq);
    };
  }, [mobileMenuOpen, closeMobileMenu]);

  /* ---------- profile dropdown: outside click, Esc, focus first item ---------- */
  useEffect(() => {
    if (!profileOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setProfileOpen(false);
        profileButtonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    const t = window.setTimeout(() => profileMenuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus(), 30);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
    };
  }, [profileOpen]);

  const onProfileMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const items: HTMLElement[] = [];
    e.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]').forEach((el) => items.push(el));
    const index = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = e.key === 'ArrowDown' ? (index + 1) % items.length : (index - 1 + items.length) % items.length;
      items[next]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      items[items.length - 1]?.focus();
    } else if (e.key === 'Tab') {
      setProfileOpen(false);
    }
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleGoToPricing = () => {
    setMobileMenuOpen(false);
    navigate('/pricing');
  };

  const handleLogoutClick = () => {
    setProfileOpen(false);
    setMobileMenuOpen(false);
    if (onLogout) {
      onLogout();
    }
  };

  const navItems: NavItem[] = isLoggedIn
    ? [
        { label: 'Resume', to: '/resume', active: location.pathname === '/resume' },
        { label: 'Jobs', to: '/jobs', active: location.pathname.startsWith('/jobs') },
        { label: 'Reports', to: '/reports', active: location.pathname === '/reports' },
        { label: 'Pricing', to: '/pricing', active: isPricingActive },
      ]
    : [
        { label: 'Features', onClick: () => scrollToSection('features'), active: false },
        { label: 'How It Works', onClick: () => scrollToSection('how-it-works'), active: false },
        { label: 'Pricing', onClick: handleGoToPricing, active: isPricingActive },
      ];

  const activeLabel = navItems.find((item) => item.active)?.label ?? null;
  const indicatorOn = hovered ?? activeLabel;
  const indicatorTransition = reduce ? { duration: 0 } : { type: 'spring' as const, stiffness: 420, damping: 36, mass: 0.8 };

  const menuItemClass = `w-full flex items-center gap-2.5 px-3 h-10 rounded-lg text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-900/[0.05] dark:hover:bg-white/[0.06] focus:bg-neutral-900/[0.05] dark:focus:bg-white/[0.06] transition-colors cursor-pointer ${FOCUS}`;

  return (
    // Fixed-height wrapper: the pill shrinks inside it, so page content never jumps.
    <header className="sticky top-4 z-40 w-full px-4 sm:px-6 lg:px-8 h-14 md:h-[60px]">
      {/* When scrolled, page dividers passing through the 16px gap above the pill read as stray
          1px lines. A soft blur strip (faded out with a mask, no colour) dissolves them. */}
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed inset-x-0 top-0 h-7 backdrop-blur-md [mask-image:linear-gradient(to_bottom,#000_55%,transparent)] transition-opacity duration-200 motion-reduce:transition-none ${
          scrolled ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div ref={shellRef} className="relative max-w-6xl mx-auto h-full flex items-center">
        <div
          className={`w-full flex items-center justify-between rounded-full pl-4 md:pl-5 pr-2 transition-[height,box-shadow,background-color,backdrop-filter] duration-200 ease-out motion-reduce:transition-none ${
            scrolled ? `h-[50px] md:h-[52px] backdrop-blur-2xl ${GLASS_SCROLLED}` : `h-14 md:h-[60px] backdrop-blur-xl ${GLASS}`
          }`}
        >
          {/* LEFT: logo lockup */}
          <Link to="/" className={`flex items-center rounded-lg ${FOCUS}`} aria-label="Resume Screening System home">
            <Logo size="sm" collapseOnTablet mutedTagline />
          </Link>

          {/* CENTER: links with one sliding indicator (active <-> hovered) */}
          <LayoutGroup id="navbar-links">
            <nav className="hidden md:flex items-center gap-0.5" onMouseLeave={() => setHovered(null)} aria-label="Main">
              {navItems.map((item) => {
                const showIndicator = indicatorOn === item.label;
                const textClass = item.active
                  ? 'text-purple-700 dark:text-purple-300'
                  : hovered === item.label
                    ? 'text-neutral-900 dark:text-white'
                    : 'text-neutral-600 dark:text-neutral-400';
                const inner = (
                  <>
                    {showIndicator && (
                      <motion.span
                        layoutId="navbar-indicator"
                        className="absolute inset-0 rounded-full bg-purple-500/10 dark:bg-purple-400/15"
                        transition={indicatorTransition}
                        aria-hidden="true"
                      />
                    )}
                    <span className="relative">{item.label}</span>
                  </>
                );
                const common = {
                  onMouseEnter: () => setHovered(item.label),
                  onFocus: () => setHovered(item.label),
                  onBlur: () => setHovered(null),
                  className: `relative px-4 py-2 rounded-full text-sm font-medium transition-colors duration-150 cursor-pointer ${textClass} ${FOCUS}`,
                };
                return item.to ? (
                  <Link key={item.label} to={item.to} aria-current={item.active ? 'page' : undefined} {...common}>
                    {inner}
                  </Link>
                ) : (
                  <button key={item.label} type="button" onClick={item.onClick} aria-current={item.active ? 'page' : undefined} {...common}>
                    {inner}
                  </button>
                );
              })}
            </nav>
          </LayoutGroup>

          {/* RIGHT (desktop) */}
          {isLoggedIn ? (
            <div className="hidden md:flex items-center gap-2">
              <CreditsPill credits={credits} unlimited={isUnlimited} />

              <div ref={profileRef} className="relative">
                <button
                  ref={profileButtonRef}
                  type="button"
                  onClick={() => setProfileOpen((open) => !open)}
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                  aria-controls={profileMenuId}
                  aria-label="Account menu"
                  className={`flex items-center gap-1 h-9 pl-0.5 pr-1.5 rounded-full hover:bg-neutral-900/[0.05] dark:hover:bg-white/[0.06] transition-colors cursor-pointer ${FOCUS}`}
                >
                  <span className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-500/30 dark:to-purple-500/10 text-purple-800 dark:text-purple-200 text-[13px] font-bold flex items-center justify-center ring-1 ring-purple-500/15">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 transition-transform duration-200 motion-reduce:transition-none ${profileOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      ref={profileMenuRef}
                      id={profileMenuId}
                      role="menu"
                      aria-label="Account"
                      onKeyDown={onProfileMenuKeyDown}
                      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -4 }}
                      transition={{ duration: reduce ? 0.12 : 0.16, ease: EASE_OUT }}
                      style={{ transformOrigin: 'top right' }}
                      className={`absolute right-0 top-full mt-3 w-64 rounded-2xl p-1.5 backdrop-blur-2xl ${MENU_SURFACE}`}
                    >
                      <div className="px-3 pt-2 pb-2.5">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate capitalize">{displayName}</p>
                        {displayEmail && <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{displayEmail}</p>}
                      </div>
                      <Link
                        to="/credits"
                        role="menuitem"
                        onClick={() => setProfileOpen(false)}
                        className={`${menuItemClass} justify-between`}
                      >
                        <span className="flex items-center gap-2.5"><Zap className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" aria-hidden="true" />Credits</span>
                        <span className={`tabular-nums text-[13px] font-semibold ${CREDIT_TEXT[tone]}`}>{isUnlimited ? 'Unlimited' : credits}</span>
                      </Link>
                      <div className="my-1 h-px bg-neutral-900/[0.06] dark:bg-white/[0.08]" role="separator" />
                      <Link to="/" role="menuitem" onClick={() => setProfileOpen(false)} className={menuItemClass}>
                        <LayoutDashboard className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" aria-hidden="true" />Dashboard
                      </Link>
                      <Link to="/pricing" role="menuitem" onClick={() => setProfileOpen(false)} className={menuItemClass}>
                        <Tag className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" aria-hidden="true" />Pricing
                      </Link>
                      <Link to="/settings" role="menuitem" onClick={() => setProfileOpen(false)} className={menuItemClass}>
                        <Settings className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" aria-hidden="true" />Settings
                      </Link>
                      <div className="my-1 h-px bg-neutral-900/[0.06] dark:bg-white/[0.08]" role="separator" />
                      <button type="button" role="menuitem" onClick={handleLogoutClick} className={`${menuItemClass} text-rose-700 dark:text-rose-400`}>
                        <LogOut className="w-3.5 h-3.5" aria-hidden="true" />Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className={`h-9 px-4 rounded-full text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-900/[0.05] dark:hover:bg-white/[0.06] transition-colors cursor-pointer ${FOCUS}`}
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('signup')}
                className={`h-9 px-4 rounded-full text-sm font-semibold text-white dark:text-neutral-900 bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 shadow-sm hover:shadow-md motion-safe:hover:-translate-y-px transition-[translate,box-shadow,background-color] duration-200 cursor-pointer ${FOCUS}`}
              >
                Get started
              </button>
            </div>
          )}

          {/* MOBILE: hamburger that morphs into a cross */}
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-expanded={mobileMenuOpen}
            aria-controls={mobileMenuId}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            className={`md:hidden relative w-11 h-11 flex items-center justify-center rounded-full text-neutral-800 dark:text-neutral-100 hover:bg-purple-500/10 active:scale-[0.96] transition-[background-color,scale] duration-150 cursor-pointer ${FOCUS}`}
          >
            <span className="relative block w-[18px] h-[12px]" aria-hidden="true">
              {[0, 1, 2].map((line) => {
                const open = mobileMenuOpen;
                const target =
                  line === 0 ? (open ? { y: 5.25, rotate: 45 } : { y: 0, rotate: 0 })
                  : line === 2 ? (open ? { y: -5.25, rotate: -45 } : { y: 0, rotate: 0 })
                  : { opacity: open ? 0 : 1 };
                return (
                  <motion.span
                    key={line}
                    className="absolute left-0 right-0 h-[1.5px] rounded-full bg-current"
                    style={{ top: line * 5.25 }}
                    initial={false}
                    animate={reduce && line !== 1 ? { ...target, transition: { duration: 0 } } : target}
                    transition={line === 1 ? { duration: 0.15 } : { type: 'spring', stiffness: 520, damping: 32 }}
                  />
                );
              })}
            </span>
          </button>
        </div>

        {/* MOBILE MENU: floating card under the pill */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              id={mobileMenuId}
              key="mobile-menu"
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: reduce ? 0.12 : 0.22, ease: EASE_OUT } }}
              exit={reduce ? { opacity: 0, transition: { duration: 0.1 } } : { opacity: 0, scale: 0.97, y: -6, transition: { duration: 0.16, ease: [0.4, 0, 1, 1] } }}
              style={{ transformOrigin: 'top center' }}
              className={`md:hidden absolute left-0 right-0 top-full mt-2 rounded-[20px] p-2 backdrop-blur-2xl overflow-y-auto overscroll-contain max-h-[calc(100dvh-96px)] ${MENU_SURFACE}`}
            >
              <nav aria-label="Mobile">
                <ul className="flex flex-col">
                  {navItems.map((item, i) => {
                    const rowClass = `w-full flex items-center justify-between h-12 px-3.5 rounded-xl text-base font-medium transition-colors cursor-pointer ${FOCUS} ${
                      item.active
                        ? 'bg-purple-500/10 dark:bg-purple-400/15 text-purple-700 dark:text-purple-300'
                        : 'text-neutral-800 dark:text-neutral-100 hover:bg-neutral-900/[0.04] dark:hover:bg-white/[0.05]'
                    }`;
                    const content = (
                      <>
                        <span>{item.label}</span>
                        {item.active && <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400" aria-hidden="true" />}
                      </>
                    );
                    return (
                      <motion.li
                        key={item.label}
                        initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: reduce ? 0 : 0.04 + i * 0.04, ease: EASE_OUT }}
                      >
                        {item.to ? (
                          <Link to={item.to} onClick={() => setMobileMenuOpen(false)} aria-current={item.active ? 'page' : undefined} className={rowClass}>
                            {content}
                          </Link>
                        ) : (
                          <button type="button" onClick={item.onClick} aria-current={item.active ? 'page' : undefined} className={rowClass}>
                            {content}
                          </button>
                        )}
                      </motion.li>
                    );
                  })}
                </ul>
              </nav>

              <div className="my-2 h-px bg-neutral-900/[0.06] dark:bg-white/[0.08]" />

              <motion.div
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: reduce ? 0 : 0.04 + navItems.length * 0.04, ease: EASE_OUT }}
                className="flex flex-col gap-1 pb-1"
              >
                {isLoggedIn ? (
                  <>
                    <div className="px-1.5 py-1">
                      <CreditsPill credits={credits} unlimited={isUnlimited} withTooltip={false} onNavigate={() => setMobileMenuOpen(false)} className="h-11" />
                    </div>
                    <Link to="/" onClick={() => setMobileMenuOpen(false)} className={`${menuItemClass} h-12 text-base`}>
                      <LayoutDashboard className="w-4 h-4 text-neutral-500 dark:text-neutral-400" aria-hidden="true" />Dashboard
                    </Link>
                    <Link to="/settings" onClick={() => setMobileMenuOpen(false)} className={`${menuItemClass} h-12 text-base`}>
                      <Settings className="w-4 h-4 text-neutral-500 dark:text-neutral-400" aria-hidden="true" />Settings
                    </Link>
                    <button type="button" onClick={handleLogoutClick} className={`${menuItemClass} h-12 text-base text-rose-700 dark:text-rose-400`}>
                      <LogOut className="w-4 h-4" aria-hidden="true" />Sign out
                    </button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-2 p-1">
                    <button
                      type="button"
                      onClick={() => { setMobileMenuOpen(false); onOpenAuth('login'); }}
                      className={`h-11 rounded-full text-[15px] font-medium text-neutral-800 dark:text-neutral-100 border border-black/10 dark:border-white/10 hover:bg-neutral-900/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer ${FOCUS}`}
                    >
                      Log in
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMobileMenuOpen(false); onOpenAuth('signup'); }}
                      className={`h-11 rounded-full text-[15px] font-semibold text-white dark:text-neutral-900 bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors cursor-pointer ${FOCUS}`}
                    >
                      Get started
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};
