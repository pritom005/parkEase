import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { mockDb } from '../db/mockDb';
import { AdminNotification } from '../types';
import { Shield, User, LogOut, Database, MapPin, Radio, Car, Bell, Check, ExternalLink, CheckCheck } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, extra?: any) => void;
  onOpenSqlInspector: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onOpenSqlInspector }) => {
  const { currentUser, isAdmin, logout, loginAsUser, loginAsAdmin } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshNotifications = () => {
    if (currentUser?.role === 'admin') {
      setNotifications(mockDb.getNotifications());
      setUnreadCount(mockDb.getUnreadNotificationsCount());
    }
  };

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 2000);
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationsOpen && !(e.target as Element).closest('#admin-notification-container')) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notificationsOpen]);

  const handleMarkRead = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    mockDb.markNotificationAsRead(id);
    refreshNotifications();
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    mockDb.markAllNotificationsAsRead();
    refreshNotifications();
  };

  const handleOpenBooking = (notif: AdminNotification) => {
    mockDb.markNotificationAsRead(notif.notification_id);
    refreshNotifications();
    setNotificationsOpen(false);
    onNavigate('admin-bookings', { bookingId: notif.booking_id });
  };


  return (
    <header className="sticky top-0 z-40 bg-[#e8eee9] border-b border-[#cfd9d1] shadow-xs">
      {/* Top Telemetry Ticker (matches the municipal header in mockups) */}
      <div className="bg-[#dee4df] text-[#455549] text-xs px-4 py-1.5 flex flex-wrap items-center justify-between border-b border-[#cfd9d1]/60">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[#1b5e3b] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#1b5e3b] animate-pulse"></span>
            <span>Chattogram Metro Smart Mobility Grid</span>
          </div>
          <span className="text-[#cfd9d1]">|</span>
          <span className="hidden md:inline font-mono text-[11px]">Node: #CCC-GRID-01</span>
          <span className="hidden lg:inline text-[11px]">24/7 LoRaWAN Telemetry Active</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSqlInspector}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#1b5e3b] bg-white/70 hover:bg-white px-2 py-0.5 rounded border border-[#6b8273]/30 shadow-2xs transition"
          >
            <Database className="w-3 h-3 text-[#e6b422]" />
            <span>DBMS Viva & SQL Studio</span>
          </button>

          {/* Quick Demo Switchers */}
          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-[#455549]">Fast Switch:</span>
            <button
              onClick={() => {
                loginAsUser();
                onNavigate('user-dashboard');
              }}
              className="px-1.5 py-0.5 bg-[#dcefe3] text-[#1b5e3b] rounded font-medium hover:bg-[#c9e6d2] transition"
            >
              Tanvir (Citizen)
            </button>
            <button
              onClick={() => {
                loginAsAdmin();
                onNavigate('admin-dashboard');
              }}
              className="px-1.5 py-0.5 bg-[#e4eae5] text-[#16261d] rounded font-medium hover:bg-[#d5dbd7] transition"
            >
              Admin Controller
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 cursor-pointer select-none"
        >
          <div className="w-10 h-10 rounded-lg bg-[#1b5e3b] text-white flex items-center justify-center font-bold text-xl shadow-xs">
            P
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-[#16261d] tracking-tight">PARKEASE</span>
              <span className="text-[10px] bg-[#dcefe3] text-[#1b5e3b] px-1.5 py-0.5 rounded font-mono font-semibold">
                CTG SYS
              </span>
            </div>
            <p className="text-[10px] text-[#455549] uppercase tracking-wider font-medium -mt-1">
              Smart Parking Infrastructure
            </p>
          </div>
        </div>

        {/* Center Links (Public) */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-[#455549]">
          <button
            onClick={() => onNavigate('home')}
            className={`px-3 py-2 rounded-md transition ${
              currentView === 'home'
                ? 'bg-[#dcefe3] text-[#1b5e3b] font-semibold'
                : 'hover:text-[#16261d] hover:bg-[#dee4df]'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onNavigate('parking-map')}
            className={`px-3 py-2 rounded-md transition ${
              currentView === 'parking-map'
                ? 'bg-[#dcefe3] text-[#1b5e3b] font-semibold'
                : 'hover:text-[#16261d] hover:bg-[#dee4df]'
            }`}
          >
            Parking Areas
          </button>
          <button
            onClick={() => {
              onNavigate('home');
              setTimeout(() => {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="px-3 py-2 rounded-md hover:text-[#16261d] hover:bg-[#dee4df] transition"
          >
            How It Works
          </button>
          <button
            onClick={() => {
              onNavigate('home');
              setTimeout(() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="px-3 py-2 rounded-md hover:text-[#16261d] hover:bg-[#dee4df] transition"
          >
            Features
          </button>
          <button
            onClick={() => onNavigate('terms')}
            className={`px-3 py-2 rounded-md transition ${
              currentView === 'terms'
                ? 'bg-[#dcefe3] text-[#1b5e3b] font-semibold'
                : 'hover:text-[#16261d] hover:bg-[#dee4df]'
            }`}
          >
            Bylaws & Terms
          </button>
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="flex items-center gap-2">
              {currentUser.role === 'admin' ? (
                <>
                  {/* Admin Notification Bell */}
                  <div id="admin-notification-container" className="relative">
                    <button
                      onClick={() => setNotificationsOpen((prev) => !prev)}
                      title="Admin Notifications"
                      aria-label="Admin Notifications"
                      className={`relative p-2 rounded-lg text-xs font-semibold transition flex items-center justify-center ${
                        notificationsOpen
                          ? 'neu-pressed bg-[#dcefe3] text-[#1b5e3b]'
                          : 'neu-btn-secondary text-[#16261d]'
                      }`}
                    >
                      <Bell className="w-4 h-4 text-[#1b5e3b]" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-amber-600 text-white font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[18px] text-center shadow-xs animate-pulse">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Notification Dropdown Panel */}
                    {notificationsOpen && (
                      <div className="absolute right-0 mt-2 w-80 sm:w-96 neu-raised p-4 rounded-xl border border-[#cfd9d1] shadow-2xl z-50">
                        {/* Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-[#cfd9d1]">
                          <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-[#1b5e3b]" />
                            <h3 className="text-xs font-bold text-[#16261d] tracking-tight">
                              Admin Notifications
                            </h3>
                            {unreadCount > 0 ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                {unreadCount} Unread
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-[#455549] bg-[#dee4df]">
                                All Read
                              </span>
                            )}
                          </div>

                          {unreadCount > 0 && (
                            <button
                              onClick={handleMarkAllRead}
                              className="text-[10px] font-semibold text-[#1b5e3b] hover:underline flex items-center gap-1"
                            >
                              <CheckCheck className="w-3 h-3" />
                              <span>Mark all read</span>
                            </button>
                          )}
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-96 overflow-y-auto space-y-2.5 my-3 pr-1">
                          {notifications.length === 0 ? (
                            <div className="p-6 text-center text-[#455549] space-y-1">
                              <Bell className="w-8 h-8 mx-auto text-[#6b8273]/40" />
                              <p className="text-xs font-bold text-[#16261d]">No Notifications</p>
                              <p className="text-[11px]">When citizens book parking slots, verified records will appear here.</p>
                            </div>
                          ) : (
                            notifications.map((notif) => (
                              <div
                                key={notif.notification_id}
                                onClick={() => handleOpenBooking(notif)}
                                className={`p-3 rounded-lg border cursor-pointer transition text-left ${
                                  !notif.is_read
                                    ? 'bg-[#dcefe3]/40 border-[#1b5e3b]/40 shadow-xs'
                                    : 'bg-white/70 border-[#cfd9d1] hover:bg-white'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#1b5e3b] text-white">
                                      {notif.notification_type}
                                    </span>
                                    <span className="font-mono text-xs font-bold text-[#16261d]">
                                      {notif.booking_code}
                                    </span>
                                    {!notif.is_read && (
                                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1">
                                    {!notif.is_read && (
                                      <button
                                        onClick={(e) => handleMarkRead(e, notif.notification_id)}
                                        title="Mark as Read"
                                        className="p-1 hover:bg-[#dcefe3] rounded text-[#1b5e3b] transition"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    <ExternalLink className="w-3 h-3 text-[#455549]" />
                                  </div>
                                </div>

                                {/* Customer Info */}
                                <div className="text-xs text-[#16261d] font-semibold">
                                  {notif.customer_name}
                                  <span className="text-[10px] text-[#455549] font-normal block">
                                    {notif.customer_email}
                                  </span>
                                </div>

                                {/* Booking details grid */}
                                <div className="mt-1.5 pt-1.5 border-t border-[#cfd9d1]/70 grid grid-cols-2 gap-1 text-[11px] text-[#455549]">
                                  <div>
                                    <span className="text-[10px] uppercase block text-[#6b8273]">Location</span>
                                    <strong className="text-[#16261d]">{notif.parking_area}</strong>
                                    <span className="block font-mono text-[#1b5e3b] font-semibold">
                                      Bay {notif.parking_slot_number}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] uppercase block text-[#6b8273]">Vehicle & Tariff</span>
                                    <strong className="text-[#16261d] font-mono text-[10px]">{notif.vehicle_number}</strong>
                                    <span className="block font-mono font-bold text-[#16261d]">
                                      ৳{notif.total_price}.00 ({notif.duration_hours}h)
                                    </span>
                                  </div>
                                </div>

                                {/* Schedule & Timestamp */}
                                <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#6b8273] font-mono">
                                  <span>{notif.booking_date} • {notif.start_time}</span>
                                  <span>{notif.created_at}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Footer */}
                        <div className="pt-2 border-t border-[#cfd9d1] flex items-center justify-between text-[10px] text-[#455549]">
                          <span>Click item to view booking</span>
                          <button
                            onClick={() => {
                              setNotificationsOpen(false);
                              onNavigate('admin-bookings');
                            }}
                            className="font-bold text-[#1b5e3b] hover:underline"
                          >
                            All Bookings &rarr;
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onNavigate('admin-dashboard')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                      currentView.startsWith('admin-')
                        ? 'neu-btn-primary'
                        : 'neu-btn-secondary'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-[#e6b422]" />
                    <span>Admin Console</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onNavigate('user-dashboard')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    currentView.startsWith('user-')
                      ? 'neu-btn-primary'
                      : 'neu-btn-secondary'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Citizen Portal</span>
                </button>
              )}

              <div className="hidden sm:flex flex-col text-right pl-2 border-l border-[#cfd9d1]">
                <span className="text-xs font-bold text-[#16261d]">{currentUser.full_name}</span>
                <span className="text-[10px] text-[#455549] font-mono">
                  {currentUser.role === 'admin' ? 'Chief Traffic Controller' : `Citizen ID: #${currentUser.user_id}042`}
                </span>
              </div>

              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 text-[#455549] hover:text-red-700 hover:bg-[#dee4df] rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('user-login')}
                className="neu-btn-secondary px-3 py-2 rounded-lg text-xs font-semibold"
              >
                Citizen Login
              </button>
              <button
                onClick={() => onNavigate('admin-login')}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-[#455549] hover:text-[#16261d] hover:bg-[#dee4df] transition"
              >
                Admin Access
              </button>
              <button
                onClick={() => onNavigate('user-register')}
                className="neu-btn-primary px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1"
              >
                <Car className="w-3.5 h-3.5" />
                <span>Citizen Register</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
