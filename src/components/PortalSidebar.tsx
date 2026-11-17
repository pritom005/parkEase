import React, { useState, useEffect } from 'react';
import { useParkEase } from '../context/ParkEaseContext';
import {
  LayoutDashboard,
  MapPin,
  Car,
  CalendarCheck,
  CreditCard,
  History,
  User as UserIcon,
  Users,
  Layers,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export interface PortalSidebarProps {
  currentTab: string;
  onNavigateToTab: (tab: string) => void;
  portalType?: 'user' | 'admin';
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const PortalSidebar: React.FC<PortalSidebarProps> = ({
  currentTab,
  onNavigateToTab,
  portalType,
  isCollapsed: externalCollapsed,
  onToggleCollapse
}) => {
  const { currentUser, logout } = useParkEase();

  const resolvedRole =
    portalType ||
    (currentTab.startsWith('admin') ? 'admin' : currentUser?.role || 'user');

  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024 && window.innerWidth > 640) {
        if (externalCollapsed === undefined) {
          setInternalCollapsed(true);
        }
      } else if (window.innerWidth > 1024) {
        if (externalCollapsed === undefined) {
          setInternalCollapsed(false);
        }
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [externalCollapsed]);

  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed(!internalCollapsed);
    }
  };

  const userMenuItems = [
    { id: 'user-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'user-vehicles', label: 'Vehicles', icon: Car },
    { id: 'search', label: 'Find Parking', icon: MapPin },
    { id: 'user-booking', label: 'Book Slot', icon: CalendarCheck },
    { id: 'user-payment', label: 'Payment', icon: CreditCard },
    { id: 'user-history', label: 'Booking History', icon: History },
    { id: 'user-profile', label: 'Profile', icon: UserIcon }
  ];

  const adminMenuItems = [
    { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'admin-users', label: 'Users', icon: Users },
    { id: 'admin-vehicles', label: 'Vehicles', icon: Car },
    { id: 'admin-areas', label: 'Parking Areas', icon: MapPin },
    { id: 'admin-slots', label: 'Parking Slots', icon: Layers },
    { id: 'admin-bookings', label: 'Bookings', icon: CalendarCheck },
    { id: 'admin-payments', label: 'Payments', icon: CreditCard },
    { id: 'admin-reports', label: 'Reports', icon: BarChart3 }
  ];

  const menuItems = resolvedRole === 'admin' ? adminMenuItems : userMenuItems;
  const portalLabel = resolvedRole === 'admin' ? 'Admin Portal' : 'User Portal';
  const currentLabel = menuItems.find((m) => m.id === currentTab)?.label || portalLabel;

  const userInitials = currentUser?.full_name
    ? currentUser.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : resolvedRole === 'admin'
    ? 'AD'
    : 'U';

  const handleLogout = () => {
    logout();
    onNavigateToTab('home');
  };

  return (
    <>
      {/* Mobile Slim Bar */}
      <div className="portal-mobile-bar flex sm:hidden items-center justify-between px-4 py-3 bg-[var(--bg-base)] border-b border-[var(--border-subtle)] sticky top-0 z-50">
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="btn-secondary p-2"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[var(--primary-forest)] text-white rounded-[6px] font-bold text-sm flex items-center justify-center">
            P
          </div>
          <span className="font-bold text-sm text-[var(--text-heading)]">{currentLabel}</span>
        </div>

        <div className="w-7 h-7 rounded-[6px] bg-[var(--bg-tint)] text-[var(--primary-forest)] font-bold text-xs flex items-center justify-center border border-[var(--status-available-border)]">
          {userInitials}
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/35 z-[550] sm:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Raised Left Sidebar Card */}
      <aside
        className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
        aria-label={`${portalLabel} navigation sidebar`}
      >
        <div>
          {/* Top Brand Header */}
          <div className="sidebar-header">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="logo-tile w-8 h-8 text-sm">P</div>
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="sidebar-brand-title font-bold text-sm text-[var(--text-heading)] leading-tight truncate">
                    ParkEase
                  </span>
                  <span className="sidebar-portal-tag text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    {portalLabel}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleCollapse}
                className="hidden sm:flex p-1 rounded-[6px] text-[var(--text-muted)] hover:text-[var(--primary-forest)] hover:bg-[var(--bg-tint)] transition-colors"
                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="sm:hidden p-1 text-[var(--text-muted)] hover:text-[var(--status-occupied)]"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Menu Links */}
          <nav aria-label="Portal Navigation">
            <ul className="sidebar-menu">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                const isActive =
                  currentTab === item.id ||
                  (item.id === 'search' && currentTab === 'user-parking');

                return (
                  <li key={item.id} className="sidebar-item">
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateToTab(item.id);
                        setIsMobileOpen(false);
                      }}
                      aria-current={isActive ? 'page' : undefined}
                      className={`sidebar-link ${isActive ? 'active' : ''}`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <IconComponent className="sidebar-icon" aria-hidden="true" />
                      {!isCollapsed && <span className="sidebar-link-text">{item.label}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Divider & Red Logout Button */}
        <div className="pt-4 border-t border-[var(--border-subtle)] space-y-3">
          <button
            type="button"
            onClick={handleLogout}
            className="btn-logout w-full"
            title={isCollapsed ? 'Logout' : undefined}
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4 shrink-0 text-[var(--status-occupied)]" aria-hidden="true" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
