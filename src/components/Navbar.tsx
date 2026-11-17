import React, { useState } from 'react';
import { Menu, X, User as UserIcon, LogOut } from 'lucide-react';
import { useParkEase } from '../context/ParkEaseContext';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenLegal: (type: 'terms' | 'privacy') => void;
  isPortalView?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenAuth,
  onOpenLegal,
  isPortalView = false
}) => {
  const { currentUser, logout } = useParkEase();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('home');

  const isRegisterPage = currentTab === 'register';

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    setMobileMenuOpen(false);

    if (sectionId === 'terms') {
      onOpenLegal('terms');
      return;
    }

    if (currentTab !== 'home') {
      setCurrentTab('home');
      if (sectionId !== 'home') {
        setTimeout(() => {
          const el = document.getElementById(sectionId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleOpenRegisterPage = () => {
    setMobileMenuOpen(false);
    setCurrentTab('register');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
    setCurrentTab('home');
  };

  const publicNavLinks = [
    { id: 'home', label: 'Home' },
    { id: 'areas', label: 'Parking Areas' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'features', label: 'Features' },
    { id: 'about', label: 'About' },
    { id: 'faq', label: 'FAQ' },
    { id: 'terms', label: 'Terms' },
    { id: 'contact', label: 'Contact' }
  ];

  const portalNavLinks = [
    { id: 'home', label: 'Home' },
    { id: 'areas', label: 'Parking Areas' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'features', label: 'Features' },
    { id: 'terms', label: 'Terms' }
  ];

  const navLinks = isPortalView ? portalNavLinks : publicNavLinks;

  return (
    <header className="site-navbar">
      <div className="navbar-container">
        {/* Left: Green P Logo Tile + ParkEase + Tagline */}
        <button
          type="button"
          onClick={() => scrollToSection('home')}
          className="brand-wrap shrink-0"
        >
          <span className="logo-tile">P</span>
          <span className="brand-text-wrap">
            <span className="brand-title">ParkEase</span>
            <span className="brand-tagline">Making Parking Effortless</span>
          </span>
        </button>

        {/* Middle: Navigation Links */}
        <nav className="nav-links" aria-label="Main Navigation">
          {navLinks.map((link) => {
            const isActive = isPortalView
              ? (currentTab === 'search' || currentTab === 'user-parking') && link.id === 'areas'
              : !isRegisterPage && activeSection === link.id;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => {
                  if (isPortalView && link.id === 'areas') {
                    setCurrentTab(currentUser?.role === 'admin' ? 'admin-areas' : 'search');
                    return;
                  }
                  scrollToSection(link.id);
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Public Auth OR Logged-In Portal Header */}
        {isPortalView && currentUser ? (
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            {currentUser.role === 'admin' ? (
              <button
                type="button"
                onClick={() => setCurrentTab('admin-dashboard')}
                className="btn-primary text-xs px-3.5 py-2"
              >
                <UserIcon className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Admin Portal</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentTab('user-dashboard')}
                className={`text-xs font-semibold px-3.5 py-2 rounded-[8px] flex items-center gap-1.5 transition-colors ${
                  currentTab === 'user-dashboard'
                    ? 'btn-primary'
                    : 'btn-secondary'
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" aria-hidden="true" />
                <span>User Portal</span>
              </button>
            )}

            <div className="text-right leading-tight">
              <div className="text-xs font-bold text-[var(--text-heading)]">
                {currentUser.full_name}
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">
                {currentUser.role === 'admin' ? 'Admin' : 'User Account'}
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-[8px] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--status-occupied)] hover:border-[var(--status-occupied-border)] transition-colors"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              className="btn-secondary text-xs px-3.5 py-2"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              className="admin-nav-link"
              title="Sign in as Administrator"
            >
              Admin Login
            </button>
            <button
              type="button"
              onClick={handleOpenRegisterPage}
              aria-current={isRegisterPage ? 'page' : undefined}
              className={`btn-primary text-xs px-4 py-2 ${
                isRegisterPage ? 'ring-2 ring-[var(--accent-gold)] font-bold' : ''
              }`}
            >
              Register
            </button>
          </div>
        )}

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="nav-mobile-toggle"
          aria-label="Toggle Public Menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Dropdown Panel */}
      {mobileMenuOpen && (
        <div className="nav-mobile-menu open">
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((link) => {
              const isActive = !isPortalView && !isRegisterPage && activeSection === link.id;
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => scrollToSection(link.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`text-left text-xs font-semibold px-3 py-2 rounded-[8px] border transition-colors ${
                    isActive
                      ? 'bg-[var(--bg-tint)] text-[var(--primary-forest)] border-[var(--primary-forest)] font-bold'
                      : 'text-[var(--text-ink)] bg-[var(--bg-base)] border-[var(--border-subtle)] hover:text-[var(--primary-forest)]'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </div>

          {isPortalView && currentUser ? (
            <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setCurrentTab(currentUser.role === 'admin' ? 'admin-dashboard' : 'user-dashboard');
                  setMobileMenuOpen(false);
                }}
                className="btn-primary flex-1 text-xs py-2"
              >
                {currentUser.role === 'admin' ? 'Admin Portal' : 'User Portal'}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="btn-logout text-xs py-2 px-3"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  onOpenAuth('login');
                  setMobileMenuOpen(false);
                }}
                className="btn-secondary flex-1 text-xs py-2"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenAuth('login');
                  setMobileMenuOpen(false);
                }}
                className="admin-nav-link"
              >
                Admin Login
              </button>
              <button
                type="button"
                onClick={handleOpenRegisterPage}
                aria-current={isRegisterPage ? 'page' : undefined}
                className="btn-primary flex-1 text-xs py-2"
              >
                Register
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
