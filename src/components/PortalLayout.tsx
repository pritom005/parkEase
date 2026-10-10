import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Car,
  MapPin,
  CalendarCheck,
  CreditCard,
  History,
  User,
  Users,
  Grid,
  BarChart3,
  LogOut,
} from 'lucide-react';

interface Props {
  portalType: 'user' | 'admin';
  activeTab: string;
  onSelectTab: (tab: string) => void;
  children: React.ReactNode;
}

export const PortalLayout: React.FC<Props> = ({
  portalType,
  activeTab,
  onSelectTab,
  children,
}) => {
  const { currentUser, logout } = useAuth();

  interface NavItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }

  const userNavItems: NavItem[] = [
    { id: 'user-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'user-vehicles', label: 'Vehicles', icon: Car },
    { id: 'parking-map', label: 'Parking Search', icon: MapPin },
    { id: 'user-booking', label: 'Book Slot', icon: CalendarCheck },
    { id: 'user-payment', label: 'Payment', icon: CreditCard },
    { id: 'user-history', label: 'Booking History', icon: History },
    { id: 'user-profile', label: 'Profile', icon: User },
  ];

  const adminNavItems: NavItem[] = [
    { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'admin-users', label: 'Users', icon: Users },
    { id: 'admin-vehicles', label: 'Vehicles', icon: Car },
    { id: 'admin-areas', label: 'Parking Areas', icon: MapPin },
    { id: 'admin-slots', label: 'Parking Slots', icon: Grid },
    { id: 'admin-bookings', label: 'Bookings', icon: CalendarCheck },
    { id: 'admin-payments', label: 'Payments', icon: CreditCard },
    { id: 'admin-reports', label: 'Reports', icon: BarChart3 },
  ];

  const items = portalType === 'user' ? userNavItems : adminNavItems;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar (3 cols) */}
        <aside className="lg:col-span-3 neu-raised p-4 rounded-xl border border-[#cfd9d1] space-y-4">
          {/* Brand & Badge in Sidebar */}
          <div className="flex items-center justify-between pb-3 border-b border-[#cfd9d1]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#1b5e3b] text-white flex items-center justify-center font-bold text-sm">
                P
              </div>
              <div>
                <strong className="text-xs font-bold text-[#16261d] block">
                  ParkEase
                </strong>
                <span className="text-[10px] text-[#455549] uppercase">
                  {portalType === 'user' ? 'User Portal' : 'Admin Portal'}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-[#1b5e3b] bg-[#dcefe3] px-2 py-0.5 rounded font-bold">
              Chattogram
            </span>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition select-none ${
                    isActive
                      ? 'bg-[#dcefe3] text-[#1b5e3b] neu-pressed-sm border-l-4 border-[#1b5e3b]'
                      : 'text-[#455549] hover:text-[#16261d] hover:bg-[#dee4df]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[#1b5e3b]' : 'text-[#455549]'
                    }`}
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Sign Out Button */}
          <div className="pt-3 border-t border-[#cfd9d1]">
            <button
              onClick={logout}
              className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-red-700 hover:bg-red-50 flex items-center gap-2 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Content Area (9 cols) */}
        <main className="lg:col-span-9">{children}</main>
      </div>
    </div>
  );
};
