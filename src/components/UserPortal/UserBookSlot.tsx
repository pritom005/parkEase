import React, { useState, useMemo, useEffect } from 'react';
import { useParkEase } from '../../context/ParkEaseContext';
import { SlotSearchResult } from '../../types';
import {
  AlertCircle,
  Check,
  ShieldAlert,
  ShieldCheck,
  Car,
  Bike,
  ArrowRight,
  Plus
} from 'lucide-react';
import { PhoneOtpPanel } from '../PhoneOtpPanel';

interface UserBookSlotProps {
  selectedSlot: SlotSearchResult | null;
  searchParams: { date: string; time: string; duration: number };
  onSelectFallbackSlot: (slot: SlotSearchResult) => void;
  onProceedToPayment: (bookingId: number) => void;
  onNavigateToSearch: () => void;
  onNavigateToVehicles: () => void;
}

export const UserBookSlot: React.FC<UserBookSlotProps> = ({
  selectedSlot,
  searchParams,
  onSelectFallbackSlot,
  onProceedToPayment,
  onNavigateToSearch,
  onNavigateToVehicles
}) => {
  const { currentUser, userVehicles, areas, slots, createBooking } = useParkEase();

  const todayStr = new Date().toISOString().split('T')[0];

  // Ensure a slot is available even if user clicked Book Slot directly from sidebar
  const resolvedSlot: SlotSearchResult | null = useMemo(() => {
    if (selectedSlot) return selectedSlot;
    const firstOpen = slots.find((s) => s.status === 'Available') || slots[0];
    if (!firstOpen) return null;
    const area = areas.find((a) => a.area_id === firstOpen.area_id);
    return {
      ...firstOpen,
      area_name: area?.area_name || 'GEC Circle',
      location: area?.location || 'Chattogram',
      calculated_total: firstOpen.price_per_hour * 2
    };
  }, [selectedSlot, slots, areas]);

  const [arrivalDate, setArrivalDate] = useState<string>(searchParams.date || todayStr);
  const [arrivalTime, setArrivalTime] = useState<string>(searchParams.time || '10:00');
  const [bookingType, setBookingType] = useState<'hourly' | 'full_day'>(
    searchParams.duration === 24 ? 'full_day' : 'hourly'
  );
  const [hourlyCount, setHourlyCount] = useState<number>(
    searchParams.duration === 24 ? 2 : searchParams.duration || 2
  );

  const activeVehicles = useMemo(
    () => userVehicles.filter((v) => v.status === 'Active'),
    [userVehicles]
  );

  const matchingVehicles = useMemo(
    () => activeVehicles.filter((v) => v.vehicle_type === resolvedSlot?.vehicle_type),
    [activeVehicles, resolvedSlot]
  );

  const [selectedVehicleId, setSelectedVehicleId] = useState<number>(
    matchingVehicles[0]?.vehicle_id || 0
  );

  useEffect(() => {
    if (matchingVehicles.length > 0 && !matchingVehicles.some((v) => v.vehicle_id === selectedVehicleId)) {
      setSelectedVehicleId(matchingVehicles[0].vehicle_id);
    }
  }, [matchingVehicles, selectedVehicleId]);

  const [errorMsg, setErrorMsg] = useState('');
  const [showInlineOtp, setShowInlineOtp] = useState(false);

  if (!resolvedSlot) {
    return (
      <div className="user-portal-container">
        <div className="user-empty-state">
          <div className="user-empty-title">No Parking Slots Selected</div>
          <p className="user-empty-desc">
            Browse Chattogram parking areas in Find Parking to choose an available slot.
          </p>
          <button
            type="button"
            onClick={onNavigateToSearch}
            className="btn-primary text-xs px-4 py-2"
          >
            Go to Find Parking
          </button>
        </div>
      </div>
    );
  }

  const isPhoneVerified = Boolean(currentUser?.phone_verified);
  const effectiveDuration = bookingType === 'full_day' ? 24 : Number(hourlyCount);
  const totalPayable =
    bookingType === 'full_day'
      ? resolvedSlot.day_price
      : resolvedSlot.price_per_hour * Number(hourlyCount);

  const selectedVehicle =
    activeVehicles.find((v) => v.vehicle_id === selectedVehicleId) || matchingVehicles[0] || null;

  const availableAreaSlots = slots.filter(
    (s) => s.area_id === resolvedSlot.area_id && s.status === 'Available'
  );

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isPhoneVerified) {
      setShowInlineOtp(true);
      setErrorMsg('Complete SMS OTP phone verification first to confirm this booking.');
      return;
    }

    if (!selectedVehicle || selectedVehicle.vehicle_type !== resolvedSlot.vehicle_type) {
      setErrorMsg(`Please select a registered ${resolvedSlot.vehicle_type} for this slot.`);
      return;
    }

    const res = createBooking(
      resolvedSlot.slot_id,
      selectedVehicle.vehicle_id,
      arrivalDate,
      arrivalTime,
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
    <div className="user-portal-container space-y-5">
      {/* Page Header */}
      <div className="user-page-header m-0">
        <div>
          <div className="user-page-kicker">ParkEase Portal &gt; Book Slot</div>
          <h1 className="user-page-title">Slot Reservation & Booking</h1>
          <p className="user-page-subtitle">
            Complete your parking slot reservation in Chattogram. Review the selected slot, select a vehicle, choose hourly or full-day duration, and proceed to payment.
          </p>
        </div>
      </div>

      {/* 5-Step Horizontal Stepper */}
      <div className="booking-stepper" aria-label="Booking Steps">
        <div className="step-item done">
          <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>01 Search</span>
        </div>
        <div className="step-item done">
          <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>02 Slot Selection</span>
        </div>
        <div className="step-item active" aria-current="step">
          <span className="font-bold">03</span>
          <span>Vehicle & Schedule</span>
        </div>
        <div className="step-item">
          <span>04 Review & Payment</span>
        </div>
        <div className="step-item">
          <span>05 Confirmation</span>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div
          role="alert"
          className="p-3.5 bg-[var(--status-occupied-bg)] border border-[var(--status-occupied-border)] rounded-[8px] text-xs text-[var(--status-occupied)] flex items-start gap-2 font-semibold"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleConfirm} className="user-booking-layout">
        {/* Left Column: Slot Info, Vehicle Picker, Schedule & Duration */}
        <div className="space-y-5">
          {/* Card 1: Selected Slot Details */}
          <div className="soft-raised-static p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Selected Parking Area
                </div>
                <h2 className="text-lg font-bold text-[var(--text-heading)] m-0">
                  {resolvedSlot.area_name}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                {availableAreaSlots.length > 1 && (
                  <select
                    aria-label="Quick switch slot"
                    value={resolvedSlot.slot_id}
                    onChange={(e) => {
                      const next = slots.find((s) => s.slot_id === Number(e.target.value));
                      if (next) {
                        const area = areas.find((a) => a.area_id === next.area_id);
                        onSelectFallbackSlot({
                          ...next,
                          area_name: area?.area_name || resolvedSlot.area_name,
                          location: area?.location || resolvedSlot.location,
                          calculated_total: next.price_per_hour * effectiveDuration
                        });
                      }
                    }}
                    className="form-select py-1.5 px-2.5 text-xs font-semibold w-auto"
                  >
                    {availableAreaSlots.map((s) => (
                      <option key={s.slot_id} value={s.slot_id}>
                        Slot {s.slot_number} ({s.vehicle_type})
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  onClick={onNavigateToSearch}
                  className="text-xs font-bold text-[var(--primary-forest)] hover:underline bg-transparent border-0 cursor-pointer px-2 py-1"
                >
                  Change Slot
                </button>
              </div>
            </div>

            <div className="ticket-sub-grid">
              <div className="ticket-sub-tile">
                <div className="ticket-data-label">Slot Number</div>
                <div className="ticket-data-val">Slot {resolvedSlot.slot_number}</div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5">
                  {resolvedSlot.vehicle_type} Slot
                </div>
              </div>

              <div className="ticket-sub-tile">
                <div className="ticket-data-label">Vehicle Category</div>
                <div className="ticket-data-val">{resolvedSlot.vehicle_type}</div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5">
                  Standard Chattogram Slot
                </div>
              </div>

              <div className="ticket-sub-tile">
                <div className="ticket-data-label">Rates</div>
                <div className="ticket-data-val tabular-nums">
                  {resolvedSlot.price_per_hour} BDT / hr
                </div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5 tabular-nums">
                  {resolvedSlot.day_price} BDT Full Day
                </div>
              </div>
            </div>

            <div className="text-xs text-[var(--text-muted)] mt-3">
              {resolvedSlot.location}
            </div>
          </div>

          {/* Card 2: Select Vehicle (+ SMS OTP Security Prompt if unverified) */}
          <div className="soft-raised-static p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-[var(--text-heading)] m-0">
                  Select Vehicle
                </h2>
                <p className="text-xs text-[var(--text-muted)] m-0 mt-0.5">
                  Pick an active {resolvedSlot.vehicle_type.toLowerCase()} from your registered vehicles.
                </p>
              </div>

              <button
                type="button"
                onClick={onNavigateToVehicles}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Register Vehicle</span>
              </button>
            </div>

            {!isPhoneVerified ? (
              <div className="bg-[var(--status-booked-bg)] border border-[var(--status-booked-border)] rounded-[8px] p-3.5">
                {!showInlineOtp ? (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-start gap-2 text-xs">
                      <ShieldAlert className="w-4 h-4 text-[var(--status-booked)] shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <div className="font-bold text-[var(--status-booked)]">
                          Mobile Verification Required
                        </div>
                        <div className="text-[var(--text-ink)]">
                          Verify {currentUser?.phone} via SMS OTP before confirming your booking.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowInlineOtp(true)}
                      className="btn-primary text-xs px-3 py-1.5"
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
              <div className="px-3 py-2 bg-[var(--status-available-bg)] border border-[var(--status-available-border)] rounded-[8px] text-xs text-[var(--status-available)] font-semibold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Confirmed mobile number: {currentUser?.phone}</span>
              </div>
            )}

            {activeVehicles.length > 0 ? (
              <div className="vehicle-select-grid">
                {activeVehicles.map((v) => {
                  const isCompatible = v.vehicle_type === resolvedSlot.vehicle_type;
                  const isSelected = selectedVehicle?.vehicle_id === v.vehicle_id;

                  return (
                    <button
                      key={v.vehicle_id}
                      type="button"
                      disabled={!isCompatible}
                      onClick={() => setSelectedVehicleId(v.vehicle_id)}
                      className={`option-select-card ${isSelected ? 'selected' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-heading)]">
                          {v.vehicle_type === 'Car' ? (
                            <Car className="w-4 h-4 text-[var(--primary-forest)]" aria-hidden="true" />
                          ) : (
                            <Bike className="w-4 h-4 text-[var(--primary-forest)]" aria-hidden="true" />
                          )}
                          <span>
                            {v.brand} {v.model}
                          </span>
                        </div>
                        {isSelected ? (
                          <span className="badge-status badge-available">Selected</span>
                        ) : !isCompatible ? (
                          <span className="badge-status badge-occupied">Incompatible</span>
                        ) : null}
                      </div>

                      <div className="flat-subcard px-2.5 py-1.5 text-xs font-mono font-bold text-[var(--text-heading)]">
                        {v.vehicle_number}
                      </div>

                      {!isCompatible && (
                        <div className="text-[11px] text-[var(--status-occupied)] mt-1.5 font-medium">
                          Slot {resolvedSlot.slot_number} is reserved for {resolvedSlot.vehicle_type}s only.
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="user-empty-state p-6">
                <div className="user-empty-title">No Registered Vehicles</div>
                <p className="user-empty-desc">
                  Add an active {resolvedSlot.vehicle_type} to your garage to complete booking.
                </p>
                <button
                  type="button"
                  onClick={onNavigateToVehicles}
                  className="btn-primary text-xs px-4 py-2"
                >
                  Add {resolvedSlot.vehicle_type}
                </button>
              </div>
            )}
          </div>

          {/* Card 3: Reservation Schedule & Duration */}
          <div className="soft-raised-static p-5 sm:p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-[var(--text-heading)] m-0">
                Reservation Schedule
              </h2>
              <p className="text-xs text-[var(--text-muted)] m-0 mt-0.5">
                Choose your arrival date, time, and hourly or full-day booking mode.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="book-arrival-date" className="form-label block mb-1">
                  Arrival Date
                </label>
                <input
                  id="book-arrival-date"
                  type="date"
                  required
                  min={todayStr}
                  value={arrivalDate}
                  onChange={(e) => setArrivalDate(e.target.value)}
                  className="form-input font-semibold"
                />
              </div>

              <div>
                <label htmlFor="book-arrival-time" className="form-label block mb-1">
                  Expected Arrival Time
                </label>
                <input
                  id="book-arrival-time"
                  type="time"
                  required
                  value={arrivalTime}
                  onChange={(e) => setArrivalTime(e.target.value)}
                  className="form-input font-semibold"
                />
              </div>
            </div>

            <div>
              <span className="form-label block mb-2">Booking Duration</span>
              <div className="duration-grid">
                {/* Hourly Mode */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setBookingType('hourly')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setBookingType('hourly');
                    }
                  }}
                  className={`option-select-card ${bookingType === 'hourly' ? 'selected' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-[var(--text-heading)]">
                      Hourly Booking
                    </span>
                    {bookingType === 'hourly' && (
                      <Check className="w-4 h-4 text-[var(--primary-forest)]" aria-hidden="true" />
                    )}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mb-2.5 tabular-nums">
                    Rate: {resolvedSlot.price_per_hour} BDT / hour ({resolvedSlot.vehicle_type})
                  </div>

                  <label htmlFor="book-hours-select" className="text-[11px] font-semibold text-[var(--text-ink)] mr-2">
                    Hours:
                  </label>
                  <select
                    id="book-hours-select"
                    value={hourlyCount}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      setBookingType('hourly');
                      setHourlyCount(Number(e.target.value));
                    }}
                    className="form-select py-1.5 text-xs font-semibold w-auto inline-block"
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((hr) => (
                      <option key={hr} value={hr}>
                        {hr} {hr === 1 ? 'Hour' : 'Hours'} ({hr * resolvedSlot.price_per_hour} BDT)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Full Day Mode */}
                <button
                  type="button"
                  onClick={() => setBookingType('full_day')}
                  className={`option-select-card ${bookingType === 'full_day' ? 'selected' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-[var(--text-heading)]">
                      Full Day (24 Hours)
                    </span>
                    {bookingType === 'full_day' && (
                      <Check className="w-4 h-4 text-[var(--primary-forest)]" aria-hidden="true" />
                    )}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mb-1 tabular-nums">
                    Flat day rate: <strong className="text-[var(--text-heading)]">{resolvedSlot.day_price} BDT</strong>
                  </div>
                  <div className="text-[11px] font-semibold text-[var(--primary-forest)]">
                    Recommended for full-day office or city parking
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Booking Summary */}
        <div className="soft-raised-static p-5 sm:p-6 booking-summary-card space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--border-subtle)]">
            <h2 className="text-base font-bold text-[var(--text-heading)] m-0">
              Booking Summary
            </h2>
            <span className="badge-status badge-available">DB Rate</span>
          </div>

          <div className="space-y-1 text-xs">
            <div className="summary-calc-row">
              <span className="text-[var(--text-muted)]">Parking Area</span>
              <span className="font-semibold text-[var(--text-heading)]">{resolvedSlot.area_name}</span>
            </div>
            <div className="summary-calc-row">
              <span className="text-[var(--text-muted)]">Selected Slot</span>
              <span className="font-semibold text-[var(--text-heading)]">
                Slot {resolvedSlot.slot_number} ({resolvedSlot.vehicle_type})
              </span>
            </div>
            <div className="summary-calc-row">
              <span className="text-[var(--text-muted)]">Vehicle</span>
              <span className="font-semibold text-[var(--text-heading)]">
                {selectedVehicle ? selectedVehicle.vehicle_number : 'None selected'}
              </span>
            </div>
            <div className="summary-calc-row">
              <span className="text-[var(--text-muted)]">Arrival Schedule</span>
              <span className="font-semibold text-[var(--text-heading)] tabular-nums">
                {arrivalDate}, {arrivalTime}
              </span>
            </div>
            <div className="summary-calc-row">
              <span className="text-[var(--text-muted)]">Duration</span>
              <span className="font-semibold text-[var(--text-heading)] tabular-nums">
                {bookingType === 'full_day'
                  ? 'Full Day (24 Hours)'
                  : `${hourlyCount} ${hourlyCount === 1 ? 'Hour' : 'Hours'}`}
              </span>
            </div>
          </div>

          <div className="flat-subcard p-3.5 space-y-1">
            <div className="summary-calc-row text-xs">
              <span className="text-[var(--text-muted)]">Parking Tariff</span>
              <span className="font-semibold tabular-nums">{totalPayable} BDT</span>
            </div>
            <div className="summary-calc-row text-xs">
              <span className="text-[var(--text-muted)]">Service Fee</span>
              <span className="font-semibold text-[var(--primary-forest)] tabular-nums">0 BDT</span>
            </div>
            <div className="summary-calc-total">
              <span>Total Payable</span>
              <span>{totalPayable} BDT</span>
            </div>
          </div>

          <div className="flat-subcard bg-[var(--bg-tint)] border-[var(--status-available-border)] p-3 text-[11px] text-[var(--text-ink)]">
            <div className="font-bold text-[var(--primary-forest)] mb-0.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Double-Booking Check Active</span>
            </div>
            <p className="m-0 text-[var(--text-muted)] leading-relaxed">
              Availability is checked against overlapping time windows right before saving Slot {resolvedSlot.slot_number}.
            </p>
          </div>

          <button
            type="submit"
            disabled={!selectedVehicle || !isPhoneVerified || matchingVehicles.length === 0}
            className="btn-primary w-full py-3 text-xs uppercase tracking-wider"
          >
            <span>Proceed to Payment ({totalPayable} BDT)</span>
            <ArrowRight className="w-4 h-4 text-white" aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
  );
};
