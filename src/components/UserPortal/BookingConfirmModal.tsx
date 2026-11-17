import React, { useState } from 'react';
import { useParkEase } from '../../context/ParkEaseContext';
import { SlotSearchResult } from '../../types';
import { X, AlertCircle, Check, ShieldAlert, ShieldCheck } from 'lucide-react';
import { PhoneOtpPanel } from '../PhoneOtpPanel';

interface BookingConfirmModalProps {
  isOpen: boolean;
  slot: SlotSearchResult | null;
  searchParams: { date: string; time: string; duration: number };
  onClose: () => void;
  onProceedToPayment: (bookingId: number) => void;
  onNavigateToVehicles: () => void;
}

export const BookingConfirmModal: React.FC<BookingConfirmModalProps> = ({
  isOpen,
  slot,
  searchParams,
  onClose,
  onProceedToPayment,
  onNavigateToVehicles
}) => {
  const { currentUser, userVehicles, createBooking } = useParkEase();

  const matchingVehicles = userVehicles.filter(
    (v) => v.vehicle_type === slot?.vehicle_type && v.status === 'Active'
  );
  const [selectedVehicleId, setSelectedVehicleId] = useState<number>(
    matchingVehicles[0]?.vehicle_id || 0
  );
  const [bookingType, setBookingType] = useState<'hourly' | 'full_day'>(
    searchParams.duration === 24 ? 'full_day' : 'hourly'
  );
  const [errorMsg, setErrorMsg] = useState('');
  const [showInlineOtp, setShowInlineOtp] = useState(false);

  if (!isOpen || !slot) return null;

  const isPhoneVerified = Boolean(currentUser?.phone_verified);
  const effectiveDuration = bookingType === 'full_day' ? 24 : searchParams.duration;
  const totalPrice =
    bookingType === 'full_day'
      ? slot.day_price
      : slot.price_per_hour * searchParams.duration;
  const activeSelectedId = selectedVehicleId || matchingVehicles[0]?.vehicle_id || 0;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isPhoneVerified) {
      setShowInlineOtp(true);
      setErrorMsg('Complete SMS OTP phone confirmation below to confirm this booking.');
      return;
    }

    if (!activeSelectedId) {
      setErrorMsg('Please select a vehicle from your registered vehicles.');
      return;
    }

    const res = createBooking(
      slot.slot_id,
      activeSelectedId,
      searchParams.date,
      searchParams.time,
      effectiveDuration,
      bookingType
    );

    if (res.success && res.bookingId) {
      onProceedToPayment(res.bookingId);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[700] overflow-y-auto bg-black/40 flex items-center justify-center p-4">
      <div
        className="soft-raised-static max-w-lg w-full p-6 text-[var(--text-ink)] relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-confirm-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-heading)] p-1 rounded-[6px] hover:bg-[var(--bg-tint)] bg-transparent border-0 cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <h2
          id="booking-confirm-title"
          className="text-base sm:text-lg font-bold text-[var(--text-heading)] border-b-2 border-dashed border-[var(--accent-gold)] pb-1 mb-4 inline-block"
        >
          Confirm Parking Reservation
        </h2>

        {errorMsg && (
          <div
            role="alert"
            className="mb-4 p-3 bg-[var(--status-occupied-bg)] border border-[var(--status-occupied-border)] rounded-[8px] text-xs text-[var(--status-occupied)] flex items-start gap-2 font-semibold"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
        )}

        {!isPhoneVerified ? (
          <div className="mb-4 bg-[var(--status-booked-bg)] border border-[var(--status-booked-border)] rounded-[8px] p-4 space-y-3">
            {!showInlineOtp ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-[var(--status-booked)] shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="text-xs">
                    <div className="font-bold text-[var(--status-booked)]">
                      Mobile Phone Confirmation Required
                    </div>
                    <p className="text-[var(--text-ink)] mt-0.5 m-0">
                      Confirm <span className="font-semibold">{currentUser?.phone}</span> via SMS OTP before completing your slot reservation.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowInlineOtp(true);
                    setErrorMsg('');
                  }}
                  className="btn-primary text-xs px-3.5 py-2 shrink-0"
                >
                  Confirm via SMS
                </button>
              </div>
            ) : (
              <PhoneOtpPanel
                phone={currentUser?.phone || ''}
                compact
                autoSend
                allowPhoneEdit
                cancelLabel="Hide"
                onCancel={() => setShowInlineOtp(false)}
                onVerified={() => {
                  setShowInlineOtp(false);
                  setErrorMsg('');
                }}
              />
            )}
          </div>
        ) : (
          <div className="mb-4 px-3 py-2 bg-[var(--status-available-bg)] border border-[var(--status-available-border)] rounded-[8px] text-xs text-[var(--status-available)] font-semibold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Confirmed mobile number: {currentUser?.phone}</span>
          </div>
        )}

        <form onSubmit={handleConfirm} className="space-y-4 text-xs">
          {/* Hourly vs Full Day Mode Selector */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setBookingType('hourly')}
              className={`option-select-card p-3 ${bookingType === 'hourly' ? 'selected' : ''}`}
            >
              <div className="font-bold text-[var(--text-heading)]">Hourly ({searchParams.duration}h)</div>
              <div className="text-[11px] text-[var(--text-muted)] tabular-nums">
                {slot.price_per_hour} BDT/hr
              </div>
            </button>

            <button
              type="button"
              onClick={() => setBookingType('full_day')}
              className={`option-select-card p-3 ${bookingType === 'full_day' ? 'selected' : ''}`}
            >
              <div className="font-bold text-[var(--text-heading)]">Full Day (24h)</div>
              <div className="text-[11px] text-[var(--text-muted)] tabular-nums">
                {slot.day_price} BDT flat
              </div>
            </button>
          </div>

          <div className="soft-inset p-4 space-y-2 text-xs">
            <div className="flex justify-between border-b border-[var(--border-subtle)] pb-1.5">
              <span className="text-[var(--text-muted)]">Area:</span>
              <span className="font-semibold text-[var(--text-heading)]">{slot.area_name}</span>
            </div>
            <div className="flex justify-between border-b border-[var(--border-subtle)] pb-1.5">
              <span className="text-[var(--text-muted)]">Slot Number:</span>
              <span className="font-bold text-[var(--primary-forest)]">
                {slot.slot_number} ({slot.vehicle_type})
              </span>
            </div>
            <div className="flex justify-between border-b border-[var(--border-subtle)] pb-1.5">
              <span className="text-[var(--text-muted)]">Schedule:</span>
              <span className="font-medium text-[var(--text-ink)] tabular-nums">
                {searchParams.date} at {searchParams.time}
              </span>
            </div>
            <div className="flex justify-between border-b border-[var(--border-subtle)] pb-1.5">
              <span className="text-[var(--text-muted)]">Duration:</span>
              <span className="font-medium text-[var(--text-ink)] tabular-nums">
                {bookingType === 'full_day'
                  ? 'Full Day (24 Hours)'
                  : `${searchParams.duration} ${searchParams.duration === 1 ? 'Hour' : 'Hours'}`}
              </span>
            </div>
            <div className="flex justify-between pt-1 text-sm font-bold tabular-nums">
              <span className="text-[var(--text-heading)]">Total Payable:</span>
              <span className="text-[var(--primary-forest)]">BDT {totalPrice.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <span className="form-label block mb-1.5">
              Select Registered {slot.vehicle_type}
            </span>

            {matchingVehicles.length > 0 ? (
              <div className="space-y-2">
                {matchingVehicles.map((v) => {
                  const isSelected = activeSelectedId === v.vehicle_id;
                  return (
                    <label
                      key={v.vehicle_id}
                      className={`option-select-card flex items-center justify-between p-3 ${
                        isSelected ? 'selected' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="selectedVehicle"
                          value={v.vehicle_id}
                          checked={isSelected}
                          onChange={() => setSelectedVehicleId(v.vehicle_id)}
                        />
                        <div>
                          <div className="font-bold text-[var(--text-heading)]">
                            {v.vehicle_number}
                          </div>
                          <div className="text-[11px] text-[var(--text-muted)]">
                            {v.brand} {v.model}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="badge-status badge-neutral">{v.vehicle_type}</span>
                        {isSelected && <Check className="w-4 h-4 text-[var(--primary-forest)]" />}
                      </div>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="user-empty-state p-4 text-left">
                <p className="text-xs text-[var(--status-booked)] font-semibold mb-2">
                  You do not have an active registered {slot.vehicle_type}.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToVehicles();
                  }}
                  className="btn-primary text-xs px-3 py-1.5"
                >
                  Add a {slot.vehicle_type}
                </button>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary text-xs px-4 py-2">
              Cancel
            </button>
            <button
              type="submit"
              disabled={matchingVehicles.length === 0 || !isPhoneVerified}
              className="btn-primary text-xs px-4 py-2"
            >
              Proceed to Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
