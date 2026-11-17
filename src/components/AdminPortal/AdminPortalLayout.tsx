import React from 'react';
import { PortalSidebar } from '../PortalSidebar';
import { Navbar } from '../Navbar';
import { Footer } from '../Footer';

interface AdminPortalLayoutProps {
  currentTab: string;
  onNavigateToTab: (tab: string) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenLegal: (type: 'terms' | 'privacy') => void;
  children: React.ReactNode;
}

export const AdminPortalLayout: React.FC<AdminPortalLayoutProps> = ({
  currentTab,
  onNavigateToTab,
  onOpenAuth,
  onOpenLegal,
  children
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-base)] text-[var(--text-ink)]">
      {/* Shared Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={onNavigateToTab}
        onOpenAuth={onOpenAuth}
        onOpenLegal={onOpenLegal}
        isPortalView
      />

      {/* Left Sidebar + Main Workspace */}
      <div className="portal-layout flex-1">
        <PortalSidebar
          currentTab={currentTab}
          onNavigateToTab={onNavigateToTab}
          portalType="admin"
        />

        <main className="portal-main">
          {children}
        </main>
      </div>

      {/* Shared Footer */}
      <Footer
        onOpenLegal={onOpenLegal}
        onNavigateSearch={() => {
          onNavigateToTab('admin-areas');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
};
