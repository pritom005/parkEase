/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { ParkEaseProvider, useParkEase } from './context/ParkEaseContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { PublicHome } from './components/PublicHome';
import { CookieBanner } from './components/CookieBanner';
import { LegalModal } from './components/LegalModal';
import { AuthModal } from './components/AuthModal';
import { RegisterPage } from './components/RegisterPage';
import { PhoneOtpModal } from './components/PhoneOtpModal';
import { BookingConfirmModal } from './components/UserPortal/BookingConfirmModal';
import { PaymentModal } from './components/UserPortal/PaymentModal';
import { UserDashboard } from './components/UserPortal/UserDashboard';
import { UserFindParking } from './components/UserPortal/UserFindParking';
import { UserVehicles } from './components/UserPortal/UserVehicles';
import { UserBookSlot } from './components/UserPortal/UserBookSlot';
import { UserPayment } from './components/UserPortal/UserPayment';
import { UserHistory } from './components/UserPortal/UserHistory';
import { UserProfile } from './components/UserPortal/UserProfile';
import { AdminDashboard } from './components/AdminPortal/AdminDashboard';
import { AdminUsers } from './components/AdminPortal/AdminUsers';
import { AdminVehicles } from './components/AdminPortal/AdminVehicles';
import { AdminParkingAreas } from './components/AdminPortal/AdminParkingAreas';
import { AdminParkingSlots } from './components/AdminPortal/AdminParkingSlots';
import { AdminBookings } from './components/AdminPortal/AdminBookings';
import { AdminPayments } from './components/AdminPortal/AdminPayments';
import { AdminReports } from './components/AdminPortal/AdminReports';
import { AdminPortalLayout } from './components/AdminPortal/AdminPortalLayout';
import { UserPortalLayout } from './components/UserPortal/UserPortalLayout';
import { BookingReminderToasts } from './components/BookingReminderToasts';
import { SlotSearchResult } from './types';

const MainAppContent: React.FC = () => {
  const { currentUser } = useParkEase();

  // Navigation tab state
  const [currentTab, setCurrentTab] = useState<string>('home');

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [phoneOtpModalOpen, setPhoneOtpModalOpen] = useState(false);

  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy' | null>(null);

  // Booking Flow State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState<SlotSearchResult | null>(null);
  const [bookingSearchParams, setBookingSearchParams] = useState<{ date: string; time: string; duration: number }>({
    date: '',
    time: '',
    duration: 1
  });

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [activePaymentBookingId, setActivePaymentBookingId] = useState<number | null>(null);

  // Handlers
  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    if (mode === 'register') {
      setAuthModalOpen(false);
      setCurrentTab('register');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setAuthModalMode('login');
    setAuthModalOpen(true);
  };

  const handleOpenLegal = (type: 'terms' | 'privacy') => {
    setLegalModalType(type);
    setLegalModalOpen(true);
  };

  const handleSelectSlotForBooking = (
    slot: SlotSearchResult,
    searchParams: { date: string; time: string; duration: number }
  ) => {
    if (!currentUser) {
      setAuthModalMode('login');
      setAuthModalOpen(true);
      return;
    }

    if (currentUser.role === 'admin') {
      setAuthModalMode('login');
      setAuthModalOpen(true);
      return;
    }

    setSelectedSlotForBooking(slot);
    setBookingSearchParams(searchParams);
    setCurrentTab('user-booking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProceedToPayment = (bookingId: number) => {
    setBookingModalOpen(false);
    setActivePaymentBookingId(bookingId);
    setCurrentTab('user-payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isUserPortalTab =
    [
      'user-dashboard',
      'user-parking',
      'user-vehicles',
      'user-history',
      'user-profile',
      'user-booking',
      'user-payment'
    ].includes(currentTab) ||
    (currentTab === 'search' && currentUser?.role === 'user');

  const isAdminPortalTab = [
    'admin-dashboard',
    'admin-users',
    'admin-vehicles',
    'admin-areas',
    'admin-slots',
    'admin-bookings',
    'admin-payments',
    'admin-reports'
  ].includes(currentTab);

  // Guard portal routes cleanly on logout or role mismatch
  useEffect(() => {
    if (isUserPortalTab && (!currentUser || currentUser.role !== 'user')) {
      setCurrentTab('home');
    } else if (isAdminPortalTab && (!currentUser || currentUser.role !== 'admin')) {
      setCurrentTab('home');
    }
  }, [isUserPortalTab, isAdminPortalTab, currentUser]);

  // Update browser document title to reflect active portal or page
  useEffect(() => {
    const titleMap: Record<string, string> = {
      home: 'ParkEase - Chattogram Parking System',
      search: 'Find Parking — ParkEase',
      register: 'Create Account — ParkEase',
      'user-dashboard': 'User Dashboard — ParkEase',
      'user-parking': 'Find Parking — ParkEase',
      'user-vehicles': 'My Vehicles — ParkEase',
      'user-booking': 'Confirm Booking — ParkEase',
      'user-payment': 'Complete Payment — ParkEase',
      'user-history': 'Booking History — ParkEase',
      'user-profile': 'Account Profile — ParkEase',
      'admin-dashboard': 'Admin Dashboard — ParkEase',
      'admin-users': 'Manage Users — ParkEase',
      'admin-vehicles': 'Manage Vehicles — ParkEase',
      'admin-areas': 'Parking Areas — ParkEase',
      'admin-slots': 'Parking Slots — ParkEase',
      'admin-bookings': 'All Bookings — ParkEase',
      'admin-payments': 'Payments — ParkEase',
      'admin-reports': 'Reports — ParkEase'
    };
    document.title = titleMap[currentTab] || 'Page Not Found — ParkEase';
  }, [currentTab]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-base)] text-[var(--text-ink)] font-sans antialiased">
      {isUserPortalTab ? (
        <UserPortalLayout
          currentTab={currentTab}
          onNavigateToTab={setCurrentTab}
          onOpenAuth={handleOpenAuth}
          onOpenLegal={handleOpenLegal}
        >
          {currentTab === 'user-dashboard' && (
            <UserDashboard
              onNavigateToTab={setCurrentTab}
              onOpenPayment={(id) => {
                setActivePaymentBookingId(id);
                setPaymentModalOpen(true);
              }}
              onRequestPhoneVerification={() => setPhoneOtpModalOpen(true)}
            />
          )}

          {(currentTab === 'search' || currentTab === 'user-parking') && (
            <UserFindParking onSelectSlotForBooking={handleSelectSlotForBooking} />
          )}

          {currentTab === 'user-vehicles' && <UserVehicles />}

          {currentTab === 'user-booking' && (
            <UserBookSlot
              selectedSlot={selectedSlotForBooking}
              searchParams={bookingSearchParams}
              onSelectFallbackSlot={(slot) => setSelectedSlotForBooking(slot)}
              onProceedToPayment={handleProceedToPayment}
              onNavigateToSearch={() => setCurrentTab('search')}
              onNavigateToVehicles={() => setCurrentTab('user-vehicles')}
            />
          )}

          {currentTab === 'user-payment' && (
            <UserPayment
              bookingId={activePaymentBookingId}
              onSelectBookingId={(id) => setActivePaymentBookingId(id)}
              onSuccessViewHistory={() => setCurrentTab('user-history')}
              onNavigateToBooking={() => setCurrentTab('user-booking')}
              onNavigateToSearch={() => setCurrentTab('search')}
            />
          )}

          {currentTab === 'user-history' && (
            <UserHistory
              onOpenPayment={(id) => {
                setActivePaymentBookingId(id);
                setCurrentTab('user-payment');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onNavigateToSearch={() => setCurrentTab('search')}
            />
          )}

          {currentTab === 'user-profile' && (
            <UserProfile
              onOpenPrivacy={() => handleOpenLegal('privacy')}
              onRequestPhoneVerification={() => setPhoneOtpModalOpen(true)}
            />
          )}
        </UserPortalLayout>
      ) : isAdminPortalTab ? (
        <AdminPortalLayout
          currentTab={currentTab}
          onNavigateToTab={setCurrentTab}
          onOpenAuth={handleOpenAuth}
          onOpenLegal={handleOpenLegal}
        >
          {currentTab === 'admin-dashboard' && (
            <AdminDashboard onNavigateTab={setCurrentTab} />
          )}

          {currentTab === 'admin-users' && <AdminUsers />}

          {currentTab === 'admin-vehicles' && <AdminVehicles />}

          {currentTab === 'admin-areas' && <AdminParkingAreas />}

          {currentTab === 'admin-slots' && <AdminParkingSlots />}

          {currentTab === 'admin-bookings' && <AdminBookings />}

          {currentTab === 'admin-payments' && <AdminPayments />}

          {currentTab === 'admin-reports' && <AdminReports />}
        </AdminPortalLayout>
      ) : (
        <>
          {/* Navigation for Public Pages */}
          <Navbar
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            onOpenAuth={handleOpenAuth}
            onOpenLegal={handleOpenLegal}
          />

          {/* Main View Port */}
          <main className="flex-1">
            {currentTab === 'register' ? (
              <RegisterPage
                onOpenLegal={handleOpenLegal}
                onOpenLogin={() => handleOpenAuth('login')}
                onSuccess={() => setCurrentTab('user-dashboard')}
              />
            ) : currentTab === 'home' || currentTab === 'search' ? (
              <PublicHome
                onSelectSlotForBooking={handleSelectSlotForBooking}
                onNavigateToTab={setCurrentTab}
                onOpenAuth={handleOpenAuth}
                onOpenLegal={handleOpenLegal}
              />
            ) : (
              <section className="max-w-lg mx-auto my-16 px-6">
                <div className="soft-raised-static p-8 text-center">
                  <h1 className="text-xl font-bold text-[var(--primary-forest)] border-b-2 border-dashed border-[var(--accent-gold)] pb-2 mb-3 inline-block">
                    Page Not Found
                  </h1>
                  <p className="text-sm text-[var(--text-muted)] mb-5">
                    The requested view does not exist. Return to the ParkEase home page.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCurrentTab('home')}
                    className="btn-primary text-xs px-5 py-2.5"
                  >
                    Return to Home
                  </button>
                </div>
              </section>
            )}
          </main>

          {/* Footer for Public Pages */}
          <Footer
            onOpenLegal={handleOpenLegal}
            onNavigateSearch={() => {
              setCurrentTab('search');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </>
      )}

      {/* Sticky Cookie Banner (Requirement G5) */}
      <CookieBanner onOpenPrivacy={() => handleOpenLegal('privacy')} />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onGoToRegister={() => {
          setCurrentTab('register');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSuccess={(role) => {
          if (role === 'admin') {
            setCurrentTab('admin-dashboard');
          } else {
            setCurrentTab('user-dashboard');
          }
        }}
      />

      {/* Mobile Phone SMS OTP Modal */}
      <PhoneOtpModal
        isOpen={phoneOtpModalOpen}
        phone={currentUser?.phone || ''}
        onClose={() => setPhoneOtpModalOpen(false)}
        onVerified={() => setPhoneOtpModalOpen(false)}
      />

      {/* Legal Modal: Terms & Privacy (Requirements G1-G7) */}
      <LegalModal
        isOpen={legalModalOpen}
        type={legalModalType}
        onClose={() => {
          setLegalModalOpen(false);
          setLegalModalType(null);
        }}
      />

      {/* Booking Confirmation Modal */}
      <BookingConfirmModal
        isOpen={bookingModalOpen}
        slot={selectedSlotForBooking}
        searchParams={bookingSearchParams}
        onClose={() => setBookingModalOpen(false)}
        onProceedToPayment={handleProceedToPayment}
        onNavigateToVehicles={() => setCurrentTab('user-vehicles')}
      />

      {/* Payment Processing Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        bookingId={activePaymentBookingId}
        onClose={() => {
          setPaymentModalOpen(false);
          setActivePaymentBookingId(null);
        }}
        onSuccessViewHistory={() => setCurrentTab('user-history')}
      />

      {/* Real-time 30-Minute Upcoming Booking Reminder Toasts */}
      <BookingReminderToasts
        onViewBooking={() => {
          setCurrentTab('user-history');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <ParkEaseProvider>
      <MainAppContent />
    </ParkEaseProvider>
  );
}
