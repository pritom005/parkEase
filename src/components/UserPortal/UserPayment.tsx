import React, { useState, useMemo, useEffect } from 'react';
import { useParkEase } from '../../context/ParkEaseContext';
import { PaymentMethod } from '../../types';
import { CheckCircle, CreditCard, Smartphone, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';

interface UserPaymentProps {
  bookingId: number | null;
  onSelectBookingId: (id: number) => void;
  onSuccessViewHistory: () => void;
  onNavigateToBooking: () => void;
  onNavigateToSearch: () => void;
}

const PAYMENT_OPTIONS: {
  method: PaymentMethod;
  badgeText: string;
  badgeColor: string;
  subtitle: string;
}[] = [
  { method: 'bKash', badgeText: 'bK', badgeColor: '#D12053', subtitle: 'bKash MFS Wallet' },
  { method: 'Nagad', badgeText: 'NG', badgeColor: '#ED6A1A', subtitle: 'Nagad MFS Wallet' },
  { method: 'Rocket', badgeText: 'RK', badgeColor: '#8C3494', subtitle: 'Rocket DBBL' },
  { method: 'Visa', badgeText: 'VS', badgeColor: '#1A4E8A', subtitle: 'Visa Debit / Credit' },
  { method: 'MasterCard', badgeText: 'MC', badgeColor: '#C43E1C', subtitle: 'MasterCard Debit / Credit' }
];

export const UserPayment: React.FC<UserPaymentProps> = ({
  bookingId,
  onSelectBookingId,
  onSuccessViewHistory,
  onNavigateToBooking,
  onNavigateToSearch
}) => {
  const { currentUser, bookings, slots, areas, vehicles, processPayment } = useParkEase();

  const pendingUserBookings = useMemo(
    () =>
      bookings.filter(
        (b) =>
          b.user_id === currentUser?.user_id &&
          b.booking_status === 'Confirmed' &&
          b.payment_status === 'Pending'
      ),
    [bookings, currentUser]
  );

  const activeBooking = useMemo(() => {
    if (bookingId) {
      const found = bookings.find((b) => b.booking_id === bookingId);
      if (found) return found;
    }
    return pendingUserBookings[0] || null;
  }, [bookingId, bookings, pendingUserBookings]);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bKash');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [completedBookingId, setCompletedBookingId] = useState<number | null>(null);

  useEffect(() => {
    setCompletedBookingId(null);
    setErrorMsg('');
  }, [bookingId]);

  if (!activeBooking) {
    return (
      <div className="user-portal-container space-y-5">
        <div className="user-page-header m-0">
          <div>
            <div className="user-page-kicker">ParkEase Portal &gt; Payment</div>
            <h1 className="user-page-title">Payment & Settlement</h1>
            <p className="user-page-subtitle">
              Settle pending parking reservations using mobile banking or card channels.
            </p>
          </div>
        </div>

        <div className="user-empty-state">
          <CreditCard className="w-9 h-9 text-[var(--text-muted)] mx-auto mb-2" aria-hidden="true" />
          <div className="user-empty-title">No Pending Payments</div>
          <p className="user-empty-desc">
            All of your confirmed parking bookings are settled. Search open slots to make a new reservation.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={onNavigateToSearch}
              className="btn-primary text-xs px-4 py-2"
            >
              Find Parking
            </button>
            <button
              type="button"
              onClick={onSuccessViewHistory}
              className="btn-secondary text-xs px-4 py-2"
            >
              View Booking History
            </button>
          </div>
        </div>
      </div>
    );
  }

  const slot = slots.find((s) => s.slot_id === activeBooking.slot_id);
  const area = slot ? areas.find((a) => a.area_id === slot.area_id) : null;
  const vehicle = vehicles.find((v) => v.vehicle_id === activeBooking.vehicle_id);

  const isCompleted =
    completedBookingId === activeBooking.booking_id || activeBooking.payment_status === 'Paid';

  const isCard = paymentMethod === 'Visa' || paymentMethod === 'MasterCard';

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!accountNumber.trim()) {
      setErrorMsg(
        isCard ? 'Please enter your card number.' : `Please enter your ${paymentMethod} mobile number.`
      );
      return;
    }

    const res = processPayment(activeBooking.booking_id, paymentMethod);
    if (res.success) {
      setCompletedBookingId(activeBooking.booking_id);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="user-portal-container space-y-5">
      {/* Header Row */}
      <div className="user-page-header m-0">
        <div>
          <div className="user-page-kicker">ParkEase Portal &gt; Payment</div>
          <h1 className="user-page-title">Payment & Settlement</h1>
          <p className="user-page-subtitle">
            Complete your reservation payment for Slot {slot?.slot_number} at {area?.area_name}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {pendingUserBookings.length > 1 && !isCompleted && (
            <select
              aria-label="Select pending booking"
              value={activeBooking.booking_id}
              onChange={(e) => onSelectBookingId(Number(e.target.value))}
              className="form-select py-1.5 text-xs font-semibold w-auto"
            >
              {pendingUserBookings.map((b) => (
                <option key={b.booking_id} value={b.booking_id}>
                  Booking #{b.booking_id} ({b.price_total} BDT)
                </option>
              ))}
            </select>
          )}
          <span className="badge-status badge-available">Standard Checkout</span>
        </div>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="p-3.5 bg-[var(--status-occupied-bg)] border border-[var(--status-occupied-border)] rounded-[8px] text-xs text-[var(--status-occupied)] flex items-center gap-2 font-semibold"
        >
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isCompleted ? (
        <div className="soft-raised-static p-6 sm:p-8 max-w-2xl mx-auto space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-[8px] bg-[var(--status-available-bg)] border border-[var(--status-available-border)] text-[var(--primary-forest)] flex items-center justify-center shrink-0">
              <CheckCircle className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-heading)] m-0">
                Payment Confirmed
              </h2>
              <p className="text-xs text-[var(--text-muted)] m-0 mt-0.5">
                Reservation #{activeBooking.booking_id} has been settled.
              </p>
            </div>
          </div>

          <div className="soft-inset p-4 space-y-2.5 text-xs">
            <div className="flex justify-between border-b border-[var(--border-subtle)] pb-2">
              <span className="text-[var(--text-muted)]">Driver Name</span>
              <span className="font-semibold text-[var(--text-heading)]">
                {currentUser?.full_name}
              </span>
            </div>
            <div className="flex justify-between border-b border-[var(--border-subtle)] pb-2">
              <span className="text-[var(--text-muted)]">Vehicle</span>
              <span className="font-mono font-bold text-[var(--text-heading)]">
                {vehicle?.vehicle_number || 'Registered Vehicle'}
              </span>
            </div>
            <div className="flex justify-between border-b border-[var(--border-subtle)] pb-2">
              <span className="text-[var(--text-muted)]">Area & Slot</span>
              <span className="font-bold text-[var(--primary-forest)]">
                {area?.area_name} | Slot {slot?.slot_number}
              </span>
            </div>
            <div className="flex justify-between border-b border-[var(--border-subtle)] pb-2">
              <span className="text-[var(--text-muted)]">Schedule & Duration</span>
              <span className="font-semibold text-[var(--text-ink)] tabular-nums">
                {activeBooking.booking_date} at {activeBooking.booking_time} (
                {activeBooking.duration_hours === 24
                  ? 'Full Day 24h'
                  : `${activeBooking.duration_hours} hrs`}
                )
              </span>
            </div>
            <div className="flex justify-between border-b border-[var(--border-subtle)] pb-2">
              <span className="text-[var(--text-muted)]">Payment Channel</span>
              <span className="font-semibold text-[var(--text-ink)]">{paymentMethod}</span>
            </div>
            <div className="flex justify-between pt-1 text-sm font-bold tabular-nums">
              <span className="text-[var(--text-heading)]">Total Paid</span>
              <span className="text-[var(--primary-forest)]">
                {activeBooking.price_total.toFixed(2)} BDT
              </span>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onNavigateToSearch}
              className="btn-secondary text-xs px-4 py-2"
            >
              Find More Parking
            </button>
            <button
              type="button"
              onClick={onSuccessViewHistory}
              className="btn-primary text-xs px-4 py-2"
            >
              <span>View Booking History</span>
              <ArrowRight className="w-4 h-4 text-white" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : (
        <div className="user-payment-layout">
          {/* Left Column: Reservation Brief + Select Payment Method */}
          <div className="space-y-5">
            {/* Reservation Brief */}
            <div className="soft-raised-static p-5 sm:p-6">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h2 className="text-base font-bold text-[var(--text-heading)] m-0">
                  Reservation Brief
                </h2>
                <span className="badge-status badge-booked">Pending Payment</span>
              </div>

              <div className="brief-sub-grid">
                <div className="ticket-sub-tile">
                  <div className="ticket-data-label">Parking Area</div>
                  <div className="ticket-data-val text-sm">{area?.area_name}</div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{area?.location}</div>
                </div>

                <div className="ticket-sub-tile">
                  <div className="ticket-data-label">Allocated Slot</div>
                  <div className="ticket-data-val text-sm">
                    Slot {slot?.slot_number} ({slot?.vehicle_type})
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5 tabular-nums">
                    {slot?.price_per_hour} BDT/hr | {slot?.day_price} BDT/day
                  </div>
                </div>

                <div className="ticket-sub-tile">
                  <div className="ticket-data-label">Vehicle</div>
                  <div className="ticket-data-val text-sm font-mono">
                    {vehicle?.vehicle_number || 'Assigned Vehicle'}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    {vehicle ? `${vehicle.brand} ${vehicle.model}` : ''}
                  </div>
                </div>

                <div className="ticket-sub-tile">
                  <div className="ticket-data-label">Booking Schedule</div>
                  <div className="ticket-data-val text-sm tabular-nums">
                    {activeBooking.booking_date} at {activeBooking.booking_time}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5 tabular-nums">
                    {activeBooking.duration_hours === 24
                      ? 'Full Day (24 hours)'
                      : `${activeBooking.duration_hours} hour duration`}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Form */}
            <form onSubmit={handlePay} className="soft-raised-static p-5 sm:p-6 space-y-4">
              <div>
                <h2 className="text-base font-bold text-[var(--text-heading)] m-0">
                  Select Payment Channel
                </h2>
                <p className="text-xs text-[var(--text-muted)] m-0 mt-0.5">
                  Choose mobile banking or card payment to confirm Booking #{activeBooking.booking_id}.
                </p>
              </div>

              <div className="payment-gateway-grid">
                {PAYMENT_OPTIONS.map((opt) => {
                  const isSelected = paymentMethod === opt.method;
                  return (
                    <button
                      key={opt.method}
                      type="button"
                      onClick={() => setPaymentMethod(opt.method)}
                      className={`gateway-tile ${isSelected ? 'selected' : ''}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="gateway-logo-badge"
                          style={{ backgroundColor: opt.badgeColor }}
                        >
                          {opt.badgeText}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[var(--text-heading)] flex items-center gap-1.5">
                            <span>{opt.method}</span>
                          </div>
                          <div className="text-[11px] text-[var(--text-muted)] truncate">
                            {opt.subtitle}
                          </div>
                        </div>
                      </div>
                      {isSelected && <span className="badge-status badge-available">Selected</span>}
                    </button>
                  );
                })}
              </div>

              <div className="form-group m-0">
                <label htmlFor="pay-account-input" className="form-label flex items-center gap-1.5">
                  {isCard ? (
                    <CreditCard className="w-3.5 h-3.5 text-[var(--primary-forest)]" aria-hidden="true" />
                  ) : (
                    <Smartphone className="w-3.5 h-3.5 text-[var(--primary-forest)]" aria-hidden="true" />
                  )}
                  <span>
                    {isCard ? 'Card Number' : `${paymentMethod} Mobile Account Number`}
                  </span>
                </label>
                <input
                  id="pay-account-input"
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder={isCard ? 'e.g. 4XXX XXXX XXXX XXXX' : '01XXXXXXXXX'}
                  className="form-input tabular-nums"
                />
              </div>

              <div className="form-group m-0">
                <label htmlFor="pay-ref-input" className="form-label">
                  Booking Reference
                </label>
                <input
                  id="pay-ref-input"
                  type="text"
                  readOnly
                  value={`Booking #${activeBooking.booking_id}`}
                  className="form-input-readonly font-mono"
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-3 text-xs uppercase tracking-wider"
              >
                <span>
                  Pay {activeBooking.price_total.toFixed(2)} BDT via {paymentMethod}
                </span>
                <ArrowRight className="w-4 h-4 text-white" aria-hidden="true" />
              </button>
            </form>
          </div>

          {/* Right Column: Settlement Invoice */}
          <div className="soft-raised-static p-5 sm:p-6 booking-summary-card space-y-4">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--border-subtle)]">
              <div>
                <h2 className="text-base font-bold text-[var(--text-heading)] m-0">
                  Payment Summary
                </h2>
                <div className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                  Ref: Booking #{activeBooking.booking_id}
                </div>
              </div>
              <span className="badge-status badge-available">BDT Total</span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="summary-calc-row">
                <span className="text-[var(--text-muted)]">
                  Parking Tariff (
                  {activeBooking.duration_hours === 24
                    ? 'Full Day 24h'
                    : `${activeBooking.duration_hours} hrs`}
                  )
                </span>
                <span className="font-semibold text-[var(--text-heading)] tabular-nums">
                  {activeBooking.price_total.toFixed(2)} BDT
                </span>
              </div>
              <div className="summary-calc-row">
                <span className="text-[var(--text-muted)]">Gateway Processing Fee</span>
                <span className="font-semibold text-[var(--primary-forest)] tabular-nums">
                  0.00 BDT
                </span>
              </div>
            </div>

            <div className="invoice-total-box">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Total Amount Due
              </div>
              <div className="text-2xl font-bold text-[var(--text-heading)] mt-1 tabular-nums">
                {activeBooking.price_total.toFixed(2)} BDT
              </div>
              <p className="text-[11px] text-[var(--text-muted)] m-0 mt-1">
                Matches confirmed booking amount in Bangladeshi Taka.
              </p>
            </div>

            <div className="flat-subcard bg-[var(--bg-tint)] border-[var(--status-available-border)] p-3 text-[11px] text-[var(--text-ink)]">
              <div className="font-bold text-[var(--primary-forest)] mb-0.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Direct Booking Settlement</span>
              </div>
              <p className="m-0 text-[var(--text-muted)] leading-relaxed">
                Once paid, Slot {slot?.slot_number} is marked paid in your Booking History.
              </p>
            </div>

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={onNavigateToBooking}
                className="text-xs font-semibold text-[var(--primary-forest)] hover:underline bg-transparent border-0 cursor-pointer"
              >
                Return to Slot Reservation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
