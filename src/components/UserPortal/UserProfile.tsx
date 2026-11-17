import React, { useState, useEffect, useMemo } from 'react';
import { useParkEase } from '../../context/ParkEaseContext';
import {
  User,
  Phone,
  Mail,
  Lock,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Check,
  AlertCircle
} from 'lucide-react';

interface UserProfileProps {
  onOpenPrivacy: () => void;
  onRequestPhoneVerification?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  onOpenPrivacy,
  onRequestPhoneVerification
}) => {
  const { currentUser, userVehicles, bookings, updateProfile, changePassword } = useParkEase();

  // Profile fields
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [profileMessage, setProfileMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Sync local inputs when currentUser changes after OTP modal verification
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.full_name);
      setPhone(currentUser.phone);
    }
  }, [currentUser]);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const userBookings = useMemo(
    () => bookings.filter((b) => b.user_id === currentUser?.user_id),
    [bookings, currentUser]
  );

  const confirmedBookingsCount = useMemo(
    () => userBookings.filter((b) => b.booking_status === 'Confirmed').length,
    [userBookings]
  );

  const carCount = useMemo(
    () => userVehicles.filter((v) => v.vehicle_type === 'Car').length,
    [userVehicles]
  );

  const bikeCount = useMemo(
    () => userVehicles.filter((v) => v.vehicle_type === 'Motorcycle').length,
    [userVehicles]
  );

  const userInitials = useMemo(() => {
    const parts = (currentUser?.full_name || 'User').trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return (parts[0] || 'U').slice(0, 2).toUpperCase();
  }, [currentUser?.full_name]);

  const memberSinceLabel = useMemo(() => {
    if (!currentUser?.created_at) return 'Active Account';
    const raw = currentUser.created_at.split(' ')[0];
    const parsed = new Date(`${raw}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return raw;
    return parsed.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }, [currentUser?.created_at]);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    const res = updateProfile(fullName, phone);
    if (res.success) {
      setProfileMessage({ type: 'success', text: res.message });
      if (res.phoneChanged && onRequestPhoneVerification) {
        onRequestPhoneVerification();
      }
    } else {
      setProfileMessage({ type: 'error', text: res.message });
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 6) {
      setPasswordMessage({
        type: 'error',
        text: 'New password must be at least 6 characters.'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: 'error',
        text: 'New passwords do not match.'
      });
      return;
    }

    const res = changePassword();
    if (res.success) {
      setPasswordMessage({ type: 'success', text: 'Password successfully changed.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordMessage({ type: 'error', text: res.message });
    }
  };

  const isPhoneVerified = Boolean(currentUser?.phone_verified);

  return (
    <div className="user-portal-container space-y-5">
      {/* Page Header */}
      <div className="user-page-header m-0">
        <div>
          <div className="user-page-kicker">ParkEase Portal &gt; Account Profile</div>
          <h1 className="user-page-title">Account Profile &amp; Credentials</h1>
          <p className="user-page-subtitle">
            Manage your registered personal contact information, SMS confirmation, and account
            password.
          </p>
        </div>
      </div>

      {/* Top Account Identity Summary Card */}
      <div className="soft-raised-static p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div
              className="w-12 h-12 rounded-[10px] bg-[var(--primary-forest)] text-white font-bold text-base flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              {userInitials}
            </div>
            <div className="min-w-0">
              <div className="text-lg font-bold text-[var(--text-heading)] truncate">
                {currentUser?.full_name || 'ParkEase User'}
              </div>
              <div className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                {currentUser?.email || ''}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isPhoneVerified ? (
              <span className="badge-status badge-available">
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                <span>SMS Confirmed</span>
              </span>
            ) : (
              <>
                <span className="badge-status badge-booked">
                  <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Phone Pending</span>
                </span>
                {onRequestPhoneVerification && (
                  <button
                    type="button"
                    onClick={onRequestPhoneVerification}
                    className="btn-primary text-xs px-3 py-1.5"
                  >
                    Confirm via SMS OTP
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* 3 Real Account Summary Tiles */}
        <div className="profile-meta-grid">
          <div className="flat-subcard p-3.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Member Since
            </div>
            <div className="text-sm font-bold text-[var(--text-heading)] mt-1">
              {memberSinceLabel}
            </div>
          </div>

          <div className="flat-subcard p-3.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Registered Vehicles
            </div>
            <div className="text-sm font-bold text-[var(--text-heading)] mt-1 tabular-nums">
              {userVehicles.length}{' '}
              <span className="text-xs font-medium text-[var(--text-muted)]">
                ({carCount} Car, {bikeCount} Bike)
              </span>
            </div>
          </div>

          <div className="flat-subcard p-3.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Total Bookings
            </div>
            <div className="text-sm font-bold text-[var(--text-heading)] mt-1 tabular-nums">
              {userBookings.length}{' '}
              <span className="text-xs font-medium text-[var(--text-muted)]">
                ({confirmedBookingsCount} Confirmed)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Forms: Contact Information + Change Security Password */}
      <div className="user-profile-layout">
        {/* Left Card: Contact Information */}
        <div className="soft-raised-static p-6">
          <div className="flex items-center gap-2 pb-3 mb-5 border-b-2 border-dashed border-[var(--accent-gold)]">
            <User className="w-4 h-4 text-[var(--primary-forest)]" aria-hidden="true" />
            <h2 className="text-base font-bold text-[var(--text-heading)]">Contact Information</h2>
          </div>

          {profileMessage && (
            <div
              role="status"
              aria-live="polite"
              className={`mb-4 p-3 rounded-[8px] text-xs flex items-center gap-2 border ${
                profileMessage.type === 'success'
                  ? 'bg-[var(--status-available-bg)] border-[var(--status-available-border)] text-[var(--status-available)]'
                  : 'bg-[var(--status-occupied-bg)] border-[var(--status-occupied-border)] text-[var(--status-occupied)]'
              }`}
            >
              {profileMessage.type === 'success' ? (
                <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              )}
              <span>{profileMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="form-group mb-0">
              <label htmlFor="profile-email" className="form-label">
                Email Address (Permanent)
              </label>
              <div className="relative">
                <Mail
                  className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="profile-email"
                  type="email"
                  disabled
                  value={currentUser?.email || ''}
                  className="form-input-readonly pl-9"
                />
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Email is locked to your registered ParkEase account.
              </p>
            </div>

            <div className="form-group mb-0">
              <label htmlFor="profile-full-name" className="form-label">
                Full Name
              </label>
              <div className="relative">
                <User
                  className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="profile-full-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="form-input pl-9"
                />
              </div>
            </div>

            <div className="form-group mb-0">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="profile-phone" className="form-label">
                  Phone Number
                </label>
                {isPhoneVerified ? (
                  <span className="badge-status badge-available">
                    <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                    <span>SMS Confirmed</span>
                  </span>
                ) : (
                  <span className="badge-status badge-booked">
                    <ShieldAlert className="w-3 h-3" aria-hidden="true" />
                    <span>Pending SMS</span>
                  </span>
                )}
              </div>

              <div className="relative">
                <Phone
                  className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="profile-phone"
                  type="tel"
                  required
                  placeholder="01XXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="form-input pl-9"
                />
              </div>

              {!isPhoneVerified && onRequestPhoneVerification && (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[var(--status-booked-bg)] border border-[var(--status-booked-border)] rounded-[8px] text-[11px] text-[var(--status-booked)]">
                  <span>Confirm via SMS OTP to enable parking reservations.</span>
                  <button
                    type="button"
                    onClick={onRequestPhoneVerification}
                    className="btn-primary text-[11px] px-2.5 py-1 shrink-0"
                  >
                    Confirm via SMS OTP
                  </button>
                </div>
              )}

              {isPhoneVerified && currentUser?.phone_verified_at && (
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  Confirmed on {currentUser.phone_verified_at}. Changing your phone requires SMS
                  re-confirmation.
                </p>
              )}
            </div>

            <div className="pt-2">
              <button type="submit" className="btn-primary">
                Save Profile Changes
              </button>
            </div>
          </form>
        </div>

        {/* Right Card: Change Security Password */}
        <div className="soft-raised-static p-6">
          <div className="flex items-center gap-2 pb-3 mb-5 border-b-2 border-dashed border-[var(--accent-gold)]">
            <Lock className="w-4 h-4 text-[var(--primary-forest)]" aria-hidden="true" />
            <h2 className="text-base font-bold text-[var(--text-heading)]">
              Change Security Password
            </h2>
          </div>

          {passwordMessage && (
            <div
              role="status"
              aria-live="polite"
              className={`mb-4 p-3 rounded-[8px] text-xs flex items-center gap-2 border ${
                passwordMessage.type === 'success'
                  ? 'bg-[var(--status-available-bg)] border-[var(--status-available-border)] text-[var(--status-available)]'
                  : 'bg-[var(--status-occupied-bg)] border-[var(--status-occupied-border)] text-[var(--status-occupied)]'
              }`}
            >
              {passwordMessage.type === 'success' ? (
                <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              )}
              <span>{passwordMessage.text}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="form-group mb-0">
              <label htmlFor="profile-current-password" className="form-label">
                Current Password
              </label>
              <input
                id="profile-current-password"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="form-input"
              />
            </div>

            <div className="form-group mb-0">
              <label htmlFor="profile-new-password" className="form-label">
                New Password
              </label>
              <input
                id="profile-new-password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="form-input"
              />
            </div>

            <div className="form-group mb-0">
              <label htmlFor="profile-confirm-password" className="form-label">
                Confirm New Password
              </label>
              <input
                id="profile-confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="form-input"
              />
            </div>

            <div className="flat-subcard p-3 text-[11px] text-[var(--text-muted)] leading-relaxed">
              Use a strong password of at least 6 characters to protect your vehicle records and
              parking reservations.
            </div>

            <div className="pt-1">
              <button type="submit" className="btn-secondary">
                Update Password
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Data Privacy & Deletion Rights */}
      <div className="soft-raised-static p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-heading)] flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-[var(--primary-forest)]" aria-hidden="true" />
            <span>Data Privacy &amp; Erasure</span>
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xl">
            You may review how your contact details, SMS confirmation timestamps, and vehicle logs
            are handled or request erasure under our privacy terms.
          </p>
        </div>
        <button type="button" onClick={onOpenPrivacy} className="btn-secondary shrink-0">
          View Policy
        </button>
      </div>
    </div>
  );
};
