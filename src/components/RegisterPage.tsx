import React, { useState } from 'react';
import { useParkEase } from '../context/ParkEaseContext';
import { VehicleType } from '../types';
import { AlertCircle, Check, UserCheck } from 'lucide-react';
import { PhoneOtpPanel } from './PhoneOtpPanel';

interface RegisterPageProps {
  onOpenLegal: (type: 'terms' | 'privacy') => void;
  onOpenLogin: () => void;
  onSuccess: () => void;
}

const VehicleTileIcon: React.FC<{ type: VehicleType; className?: string }> = ({
  type,
  className = 'w-4 h-4'
}) => {
  if (type === 'Car') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <path d="M5 11l2-5h10l2 5" />
        <rect x="3" y="11" width="18" height="6" rx="2" />
        <circle cx="7.5" cy="17" r="1.5" />
        <circle cx="16.5" cy="17" r="1.5" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="6.5" cy="16.5" r="2.5" />
      <circle cx="17.5" cy="16.5" r="2.5" />
      <path d="M9 16.5h4l2.5-6.5h-4l-1.5 3.5" />
      <path d="M14 8h3l1 2" />
    </svg>
  );
};

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onOpenLegal,
  onOpenLogin,
  onSuccess
}) => {
  const { register } = useParkEase();

  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [registeredPhone, setRegisteredPhone] = useState('');

  // Account Details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [consent, setConsent] = useState(false);

  // Optional Vehicle Details
  const [vehicleType, setVehicleType] = useState<VehicleType>('Car');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');

  // Field-level & form-level validation feedback
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearFieldError = (key: string) => {
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const nextErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      nextErrors.fullName = 'Full name is required.';
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    const cleanPhone = phone.replace(/[\s()-]/g, '').trim();
    if (!/^(?:(?:\+?88)?01[3-9]\d{8}|\+[1-9]\d{9,14})$/.test(cleanPhone)) {
      nextErrors.phone = 'Enter a valid mobile number (e.g. 01XXXXXXXXX).';
    }
    if (password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }
    if (confirmPassword !== password) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    const hasAnyVehicleField =
      Boolean(vehicleNumber.trim()) || Boolean(brand.trim()) || Boolean(model.trim());
    if (hasAnyVehicleField) {
      if (!vehicleNumber.trim()) nextErrors.vehicleNumber = 'Enter license plate or clear vehicle fields.';
      if (!brand.trim()) nextErrors.brand = 'Enter vehicle brand or clear vehicle fields.';
      if (!model.trim()) nextErrors.model = 'Enter vehicle model or clear vehicle fields.';
    }

    if (!consent) {
      nextErrors.consent = 'You must agree to the Terms & Conditions and Privacy Policy.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setFormError('Please review the highlighted fields before completing registration.');
      return;
    }

    const res = register(
      fullName,
      email,
      cleanPhone,
      consent,
      hasAnyVehicleField
        ? { vehicleNumber, vehicleType, brand, model }
        : undefined
    );

    if (!res.success) {
      setFormError(res.message);
      return;
    }

    // Move directly to Step 2: SMS OTP mobile verification
    setRegisteredPhone(res.user?.phone || cleanPhone);
    setStep('otp');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="py-10 sm:py-12 px-4 sm:px-6 lg:px-8 bg-[var(--bg-base)] text-[var(--text-ink)]">
      <div className="max-w-[680px] mx-auto soft-raised-static p-6 sm:p-8">
        {step === 'otp' ? (
          <div className="space-y-4">
            <div className="text-center pb-2">
              <span className="badge-status badge-available mb-2">
                Step 2 of 2: Booking Security
              </span>
              <h1 className="text-2xl font-bold text-[var(--text-heading)]">
                Verify Your Mobile Number
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
                Account created for{' '}
                <span className="font-semibold text-[var(--text-heading)]">{fullName.trim()}</span>.
                Enter the 6-digit SMS code to unlock parking bookings.
              </p>
            </div>

            <div className="flat-subcard p-5">
              <PhoneOtpPanel
                phone={registeredPhone}
                onVerified={onSuccess}
                onCancel={onSuccess}
                cancelLabel="Verify Later in Profile"
                autoSend={true}
                allowPhoneEdit={true}
              />
            </div>
          </div>
        ) : (
          <>
            {/* Centered Header */}
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-[26px] font-bold text-[var(--text-heading)] tracking-tight">
                Create a ParkEase Account
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1.5">
                Register to search and book parking slots in Chattogram.
              </p>
            </div>

            {formError && (
              <div
                role="alert"
                className="mb-5 p-3.5 bg-[var(--status-occupied-bg)] border border-[var(--status-occupied-border)] rounded-[8px] text-xs text-[var(--status-occupied)] flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5 text-xs">
              {/* Section 1: Account Details */}
              <div className="flat-subcard p-5 space-y-4">
                <h2 className="text-sm font-bold text-[var(--text-heading)] border-b border-[var(--border-subtle)] pb-2">
                  Account Details
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label htmlFor="reg-full-name" className="form-label block mb-1">
                      Full Name
                    </label>
                    <input
                      id="reg-full-name"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        clearFieldError('fullName');
                      }}
                      placeholder="e.g. Your full name"
                      className="form-input text-xs"
                    />
                    <p
                      className={`mt-1 text-[11px] ${
                        fieldErrors.fullName
                          ? 'text-[var(--status-occupied)] font-semibold'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {fieldErrors.fullName || 'Shown on your digital parking reservation pass.'}
                    </p>
                  </div>

                  {/* Email Address */}
                  <div>
                    <label htmlFor="reg-email" className="form-label block mb-1">
                      Email Address
                    </label>
                    <input
                      id="reg-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        clearFieldError('email');
                      }}
                      placeholder="name@example.com"
                      className="form-input text-xs"
                    />
                    <p
                      className={`mt-1 text-[11px] ${
                        fieldErrors.email
                          ? 'text-[var(--status-occupied)] font-semibold'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {fieldErrors.email || 'Used for account sign in and booking receipts.'}
                    </p>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label htmlFor="reg-phone" className="form-label block mb-1">
                      Phone Number
                    </label>
                    <input
                      id="reg-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        clearFieldError('phone');
                      }}
                      placeholder="01XXXXXXXXX"
                      className="form-input text-xs"
                    />
                    <p
                      className={`mt-1 text-[11px] ${
                        fieldErrors.phone
                          ? 'text-[var(--status-occupied)] font-semibold'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {fieldErrors.phone ||
                        'We send an SMS OTP after registration to verify your number.'}
                    </p>
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="reg-password" className="form-label block mb-1">
                      Password
                    </label>
                    <input
                      id="reg-password"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        clearFieldError('password');
                      }}
                      placeholder="At least 6 characters"
                      className="form-input text-xs"
                    />
                    <p
                      className={`mt-1 text-[11px] ${
                        fieldErrors.password
                          ? 'text-[var(--status-occupied)] font-semibold'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {fieldErrors.password || 'Minimum 6 characters required.'}
                    </p>
                  </div>

                  {/* Confirm Password (Full Width) */}
                  <div className="md:col-span-2">
                    <label htmlFor="reg-confirm-password" className="form-label block mb-1">
                      Confirm Password
                    </label>
                    <input
                      id="reg-confirm-password"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        clearFieldError('confirmPassword');
                      }}
                      placeholder="Re-type your password"
                      className="form-input text-xs"
                    />
                    <p
                      className={`mt-1 text-[11px] ${
                        fieldErrors.confirmPassword
                          ? 'text-[var(--status-occupied)] font-semibold'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {fieldErrors.confirmPassword || 'Must match the password entered above.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: Add Your Vehicle (Optional) */}
              <div className="flat-subcard p-5 space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2">
                  <h2 className="text-sm font-bold text-[var(--text-heading)]">
                    Add Your Vehicle (Optional)
                  </h2>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    You can also add it later
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Vehicle Type Selectable Tiles */}
                  <div>
                    <span className="form-label block mb-1">Vehicle Type</span>
                    <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Vehicle Type">
                      {(['Car', 'Motorcycle'] as VehicleType[]).map((type) => {
                        const isSelected = vehicleType === type;
                        return (
                          <label
                            key={type}
                            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-[8px] text-xs font-semibold cursor-pointer border transition-colors ${
                              isSelected
                                ? 'bg-[var(--primary-forest)] border-[var(--primary-forest)] text-white'
                                : 'bg-[var(--bg-base)] border-[var(--border-input)] text-[var(--text-ink)] hover:bg-[var(--bg-tint)]'
                            }`}
                          >
                            <input
                              type="radio"
                              name="regVehicleType"
                              value={type}
                              checked={isSelected}
                              onChange={() => setVehicleType(type)}
                              className="sr-only"
                            />
                            <VehicleTileIcon
                              type={type}
                              className={`w-4 h-4 ${
                                isSelected ? 'text-white' : 'text-[var(--primary-forest)]'
                              }`}
                            />
                            <span>{type}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white" aria-hidden="true" />}
                          </label>
                        );
                      })}
                    </div>
                    <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                      Use arrow keys to switch vehicle type.
                    </p>
                  </div>

                  {/* License Plate */}
                  <div>
                    <label htmlFor="reg-plate" className="form-label block mb-1">
                      License Plate
                    </label>
                    <input
                      id="reg-plate"
                      type="text"
                      value={vehicleNumber}
                      onChange={(e) => {
                        setVehicleNumber(e.target.value);
                        clearFieldError('vehicleNumber');
                      }}
                      placeholder="e.g. CTG-METRO-GA-11-2345"
                      className="form-input text-xs"
                    />
                    <p
                      className={`mt-1 text-[11px] ${
                        fieldErrors.vehicleNumber
                          ? 'text-[var(--status-occupied)] font-semibold'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {fieldErrors.vehicleNumber || 'Optional unless adding a vehicle now.'}
                    </p>
                  </div>

                  {/* Brand */}
                  <div>
                    <label htmlFor="reg-brand" className="form-label block mb-1">
                      Brand
                    </label>
                    <input
                      id="reg-brand"
                      type="text"
                      value={brand}
                      onChange={(e) => {
                        setBrand(e.target.value);
                        clearFieldError('brand');
                      }}
                      placeholder="e.g. Toyota, Honda"
                      className="form-input text-xs"
                    />
                    <p
                      className={`mt-1 text-[11px] ${
                        fieldErrors.brand
                          ? 'text-[var(--status-occupied)] font-semibold'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {fieldErrors.brand || 'Manufacturer name.'}
                    </p>
                  </div>

                  {/* Model */}
                  <div>
                    <label htmlFor="reg-model" className="form-label block mb-1">
                      Model
                    </label>
                    <input
                      id="reg-model"
                      type="text"
                      value={model}
                      onChange={(e) => {
                        setModel(e.target.value);
                        clearFieldError('model');
                      }}
                      placeholder="e.g. Corolla, Civic"
                      className="form-input text-xs"
                    />
                    <p
                      className={`mt-1 text-[11px] ${
                        fieldErrors.model
                          ? 'text-[var(--status-occupied)] font-semibold'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {fieldErrors.model || 'Model name and year.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Terms & Conditions Consent */}
              <div>
                <label className="flex items-start gap-2.5 text-xs text-[var(--text-ink)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => {
                      setConsent(e.target.checked);
                      clearFieldError('consent');
                    }}
                    className="form-checkbox mt-0.5"
                  />
                  <span className="text-xs leading-snug text-[var(--text-muted)]">
                    I agree to the ParkEase{' '}
                    <button
                      type="button"
                      onClick={() => onOpenLegal('terms')}
                      className="text-[var(--primary-forest)] underline font-semibold"
                    >
                      Terms &amp; Conditions
                    </button>{' '}
                    and{' '}
                    <button
                      type="button"
                      onClick={() => onOpenLegal('privacy')}
                      className="text-[var(--primary-forest)] underline font-semibold"
                    >
                      Privacy Policy
                    </button>.
                  </span>
                </label>
                {fieldErrors.consent && (
                  <p className="mt-1 text-[11px] text-[var(--status-occupied)] font-semibold">
                    {fieldErrors.consent}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button type="submit" className="btn-primary w-full py-3 px-4 text-xs sm:text-sm">
                <UserCheck className="w-4 h-4" aria-hidden="true" />
                <span>Complete Registration</span>
              </button>

              {/* Login Link */}
              <p className="text-center text-xs text-[var(--text-muted)] pt-1">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="font-bold text-[var(--primary-forest)] hover:underline"
                >
                  Login here
                </button>
              </p>
            </form>
          </>
        )}
      </div>
    </section>
  );
};
