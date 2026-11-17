import React from 'react';
import { PortalSidebar } from '../PortalSidebar';
import { Navbar } from '../Navbar';

interface UserPortalLayoutProps {
  currentTab: string;
  onNavigateToTab: (tab: string) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenLegal: (type: 'terms' | 'privacy') => void;
  children: React.ReactNode;
}

export const UserPortalLayout: React.FC<UserPortalLayoutProps> = ({
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
          portalType="user"
        />

        <main className="portal-main">
          {children}
        </main>
      </div>
    </div>
  );
};
