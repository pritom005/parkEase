/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CookieBanner } from './components/CookieBanner';
import { SqlInspectorModal } from './components/SqlInspectorModal';
import { ReceiptModal } from './components/ReceiptModal';
import { PortalLayout } from './components/PortalLayout';

// Public pages
import { Home } from './pages/Home';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { Terms } from './pages/Terms';
import { NotFound } from './pages/NotFound';

// User Portal pages
import { UserLogin } from './pages/user/UserLogin';
import { UserRegister } from './pages/user/UserRegister';
import { UserForgotPassword } from './pages/user/UserForgotPassword';
import { UserDashboard } from './pages/user/UserDashboard';
import { UserVehicles } from './pages/user/UserVehicles';
import { UserParkingMap } from './pages/user/UserParkingMap';
import { UserBooking } from './pages/user/UserBooking';
import { UserPayment } from './pages/user/UserPayment';
import { UserConfirmation } from './pages/user/UserConfirmation';
import { UserHistory } from './pages/user/UserHistory';
import { UserProfile } from './pages/user/UserProfile';

// Admin Portal pages
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminParkingSlots } from './pages/admin/AdminParkingSlots';
import { AdminBookings } from './pages/admin/AdminBookings';
import { AdminPayments } from './pages/admin/AdminPayments';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminGateCameras } from './pages/admin/AdminGateCameras';

const MainAppContent: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const [currentView, setCurrentView] = useState<string>('home');
  const [viewParams, setViewParams] = useState<any>({});
  const [isSqlModalOpen, setIsSqlModalOpen] = useState<boolean>(false);
  const [receiptBookingId, setReceiptBookingId] = useState<number | null>(null);

  const handleNavigate = (view: string, extra?: any) => {
    setCurrentView(view);
    if (extra) {
      setViewParams(extra);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenReceipt = (bookingId: number) => {
    setReceiptBookingId(bookingId);
  };

  const isUserPortal = currentView.startsWith('user-') && currentView !== 'user-login' && currentView !== 'user-register' && currentView !== 'user-forgot-password';
  const isAdminPortal = currentView.startsWith('admin-') && currentView !== 'admin-login';

  const renderContent = () => {
    // 1. Standalone Public Pages
    if (currentView === 'home') {
      return <Home onNavigate={handleNavigate} />;
    }
    if (currentView === 'privacy-policy') {
      return <PrivacyPolicy onNavigate={handleNavigate} />;
    }
    if (currentView === 'terms') {
      return <Terms onNavigate={handleNavigate} />;
    }
    if (currentView === '404') {
      return <NotFound onNavigate={handleNavigate} />;
    }
    if (currentView === 'user-login') {
      return <UserLogin onNavigate={handleNavigate} />;
    }
    if (currentView === 'user-register') {
      return <UserRegister onNavigate={handleNavigate} />;
    }
    if (currentView === 'user-forgot-password') {
      return <UserForgotPassword onNavigate={handleNavigate} />;
    }
    if (currentView === 'admin-login') {
      return <AdminLogin onNavigate={handleNavigate} />;
    }

    // 2. User Portal views
    if (isUserPortal || currentView === 'parking-map') {
      return (
        <PortalLayout
          portalType="user"
          activeTab={currentView}
          onSelectTab={handleNavigate}
        >
          {currentView === 'user-dashboard' && (
            <UserDashboard onNavigate={handleNavigate} onViewReceipt={handleOpenReceipt} />
          )}
          {currentView === 'user-vehicles' && <UserVehicles />}
          {currentView === 'parking-map' && (
            <UserParkingMap
              initialAreaId={viewParams.areaId || 1}
              onNavigate={handleNavigate}
            />
          )}
          {currentView === 'user-booking' && (
            <UserBooking
              initialSlotId={viewParams.slotId || 4}
              initialAreaId={viewParams.areaId || 1}
              onNavigate={handleNavigate}
            />
          )}
          {currentView === 'user-payment' && (
            <UserPayment bookingId={viewParams.bookingId} onNavigate={handleNavigate} />
          )}
          {currentView === 'user-confirmation' && (
            <UserConfirmation
              booking={viewParams.booking}
              payment={viewParams.payment}
              onNavigate={handleNavigate}
              onViewReceipt={handleOpenReceipt}
            />
          )}
          {currentView === 'user-history' && (
            <UserHistory onNavigate={handleNavigate} onViewReceipt={handleOpenReceipt} />
          )}
          {currentView === 'user-profile' && <UserProfile />}
        </PortalLayout>
      );
    }

    // 3. Admin Portal views
    if (isAdminPortal) {
      return (
        <PortalLayout
          portalType="admin"
          activeTab={currentView}
          onSelectTab={handleNavigate}
        >
          {currentView === 'admin-dashboard' && <AdminDashboard onNavigate={handleNavigate} />}
          {currentView === 'admin-users' && <AdminUsers />}
          {currentView === 'admin-slots' && <AdminParkingSlots />}
          {currentView === 'admin-bookings' && (
            <AdminBookings initialBookingId={viewParams?.bookingId} />
          )}
          {currentView === 'admin-payments' && <AdminPayments />}
          {currentView === 'admin-reports' && <AdminReports />}
          {currentView === 'admin-cameras' && <AdminGateCameras />}
        </PortalLayout>
      );
    }

    return <NotFound onNavigate={handleNavigate} />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#e8eee9] text-[#16261d]">
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenSqlInspector={() => setIsSqlModalOpen(true)}
      />

      <div className="flex-1">
        {renderContent()}
      </div>

      <Footer onNavigate={handleNavigate} />
      <CookieBanner />

      <SqlInspectorModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
      />

      <ReceiptModal
        bookingId={receiptBookingId}
        onClose={() => setReceiptBookingId(null)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
