import React, { useState, useEffect } from 'react';
import { useParkEase } from '../../context/ParkEaseContext';
import {
  LayoutDashboard,
  Users,
  Car,
  MapPin,
  Layers,
  CalendarCheck,
  CreditCard,
  BarChart3,
  ArrowLeft,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export interface AdminPortalSidebarProps {
  currentTab: string;
  onNavigateToTab: (tab: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const AdminPortalSidebar: React.FC<AdminPortalSidebarProps> = ({
  currentTab,
  onNavigateToTab,
  isCollapsed: externalCollapsed,
  onToggleCollapse
}) => {
  const { currentUser, logout } = useParkEase();

  // Internal collapse state if not controlled externally
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;

  // Mobile drawer state
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen]);

  // Handle auto-collapse on tablet resize (641px - 1024px)
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

  // Admin menu items: Dashboard, Users, Vehicles, Parking Areas, Parking Slots, Bookings, Payments, Reports
  const menuItems = [
    { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'admin-users', label: 'Users', icon: Users },
    { id: 'admin-vehicles', label: 'Vehicles', icon: Car },
    { id: 'admin-areas', label: 'Parking Areas', icon: MapPin },
    { id: 'admin-slots', label: 'Parking Slots', icon: Layers },
    { id: 'admin-bookings', label: 'Bookings', icon: CalendarCheck },
    { id: 'admin-payments', label: 'Payments', icon: CreditCard },
    { id: 'admin-reports', label: 'Reports', icon: BarChart3 }
  ];

  const currentLabel = menuItems.find(m => m.id === currentTab)?.label || 'Admin Portal';

  const userInitials = currentUser?.full_name
    ? currentUser.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'AD';

  const handleLogout = () => {
    logout();
    onNavigateToTab('home');
  };

  return (
    <>
      {/* Mobile Slim Top Bar (Visible only at <=640px) */}
      <div className="portal-mobile-bar flex sm:hidden items-center justify-between px-4 py-3 bg-[#E9E3D6] border-b border-[#C9C1B0] sticky top-0 z-50 shadow-[0_2px_8px_rgba(201,193,176,0.3)]">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="portal-mobile-menu-btn p-2 rounded-[8px] bg-[#E9E3D6] shadow-[3px_3px_6px_#C9C1B0,-3px_-3px_6px_#FBF8F1] border border-[#FBF8F1] text-[#1D4A35]"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#1D4A35] text-white rounded-[6px] font-bold text-sm flex items-center justify-center shadow-[2px_2px_4px_#C9C1B0]">
            P
          </div>
          <span className="font-bold text-sm text-[#143426]">{currentLabel}</span>
        </div>

        <div className="w-7 h-7 rounded-[6px] bg-[#DCE8DF] text-[#1D4A35] font-bold text-xs flex items-center justify-center border border-[#1D4A35]/30">
          {userInitials}
        </div>
      </div>

      {/* Mobile Drawer Backdrop Overlay */}
      <div
        className={`sidebar-mobile-overlay ${isMobileOpen ? 'active' : ''}`}
        onClick={() => setIsMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Left Sidebar Card (260px desktop, shrinks to 72px when collapsed, offscreen drawer on mobile) */}
      <aside
        className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
        aria-label="Admin navigation sidebar"
      >
        <div>
          {/* Top Brand Header: Green P logo tile with ParkEase and Admin Portal */}
          <div className="sidebar-header flex items-center justify-between pb-4 border-b border-[#C9C1B0]/50 mb-4">
            <div className="sidebar-brand-wrap flex items-center gap-2.5">
              <div className="sidebar-logo w-9 h-9 bg-[#1D4A35] text-white rounded-[8px] flex items-center justify-center font-bold text-base shadow-[3px_3px_8px_#C9C1B0,-3px_-3px_8px_#FBF8F1] shrink-0">
                P
              </div>
              {!isCollapsed && (
                <div className="sidebar-brand-text flex flex-col">
                  <span className="sidebar-brand-title font-bold text-[15px] text-[#143426] leading-tight">
                    ParkEase
                  </span>
                  <span className="sidebar-portal-tag text-[11px] font-semibold text-[#1D4A35] tracking-wide">
                    Admin Portal
                  </span>
                </div>
              )}
            </div>

            {/* Desktop Collapse / Mobile Close Button */}
            <div className="flex items-center">
              <button
                onClick={toggleCollapse}
                className="sidebar-collapse-toggle hidden sm:flex p-1.5 rounded-[6px] text-[#4A5148] hover:text-[#1D4A35] hover:bg-[#DCE8DF] transition-colors"
                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setIsMobileOpen(false)}
                className="sidebar-mobile-close-btn sm:hidden p-1.5 text-[#4A5148] hover:text-[#8A1C1C]"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Vertical Menu List: SVG line icons + text labels, active state with green left bar & soft green tint */}
          <nav aria-label="Admin Navigation">
            <ul className="sidebar-menu space-y-1.5">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <li key={item.id} className="sidebar-item">
                    <button
                      onClick={() => {
                        onNavigateToTab(item.id);
                        setIsMobileOpen(false);
                      }}
                      aria-current={isActive ? 'page' : undefined}
                      className={`sidebar-link w-full text-left flex items-center gap-3 px-3.5 py-2.5 rounded-[8px] transition-[background-color,box-shadow,transform,opacity] duration-200 ease-out text-[13px] ${
                        isActive
                          ? 'active bg-[#DCE8DF] border-l-4 border-[#1D4A35] font-bold text-[#1D4A35]'
                          : 'border-l-4 border-transparent text-[#1B2A22] font-medium hover:bg-[#DCE8DF]/45 hover:text-[#1D4A35]'
                      } ${isCollapsed ? 'justify-center px-0' : ''}`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <IconComponent
                        className={`sidebar-icon w-[18px] h-[18px] shrink-0 ${
                          isActive ? 'stroke-[#1D4A35]' : 'stroke-[#1B2A22]'
                        }`}
                        aria-hidden="true"
                      />
                      {!isCollapsed && <span className="sidebar-link-text">{item.label}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Back to Website Link */}
          <div className="mt-4 pt-3 border-t border-[#C9C1B0]/40">
            <button
              onClick={() => {
                onNavigateToTab('home');
                setIsMobileOpen(false);
              }}
              className={`back-to-website-link w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#4A5148] hover:text-[#1D4A35] transition-colors rounded-[8px] ${
                isCollapsed ? 'justify-center px-0' : ''
              }`}
              title={isCollapsed ? 'Back to Website' : undefined}
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span className="back-to-website-text">Back to Website</span>}
            </button>
          </div>
        </div>

        {/* Sidebar Footer: Admin Name, Role Tag & Red Logout Button */}
        <div className="sidebar-footer pt-4 border-t border-[#C9C1B0]/50 space-y-3">
          <div className={`user-profile-card flex items-center gap-2.5 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="user-avatar-initial w-8 h-8 rounded-[8px] bg-[#DCE8DF] text-[#1D4A35] font-bold text-xs flex items-center justify-center border border-[#1D4A35]/25 shrink-0">
              {userInitials}
            </div>
            {!isCollapsed && (
              <div className="user-profile-info flex flex-col overflow-hidden">
                <span className="user-profile-name text-xs font-bold text-[#1B2A22] truncate">
                  {currentUser?.full_name || 'Administrator'}
                </span>
                <span className="user-profile-role text-[11px] text-[#1D4A35] uppercase tracking-wider font-semibold">
                  Admin
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className={`btn-logout w-full flex items-center gap-2 justify-center py-2 px-3 text-xs font-semibold rounded-[8px] border border-[#8A1C1C]/30 text-[#8A1C1C] hover:bg-[#FBEBEB] transition-colors ${
              isCollapsed ? 'px-0' : ''
            }`}
            title={isCollapsed ? 'Logout' : undefined}
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4 shrink-0 text-[#8A1C1C]" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
