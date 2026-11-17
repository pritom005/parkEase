import React, { useState, useMemo } from 'react';
import { useParkEase } from '../../context/ParkEaseContext';
import { Booking } from '../../types';
import { CheckCircle, AlertTriangle, Search, FileText, X } from 'lucide-react';

interface UserHistoryProps {
  onOpenPayment: (bookingId: number) => void;
  onNavigateToSearch: () => void;
}

export const UserHistory: React.FC<UserHistoryProps> = ({
  onOpenPayment,
  onNavigateToSearch
}) => {
  const { currentUser, bookings, payments, slots, areas, vehicles, cancelBooking } =
    useParkEase();

  const [statusFilter, setStatusFilter] = useState<
    'All' | 'Confirmed' | 'Completed' | 'Cancelled'
  >('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);
  const [receiptBooking, setReceiptBooking] = useState<Booking | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const userBookings = useMemo(
    () =>
      bookings
        .filter((b) => b.user_id === currentUser?.user_id)
        .sort((a, b) => b.booking_id - a.booking_id),
    [bookings, currentUser]
  );

  // Dynamic Summary KPI Calculations
  const confirmedCount = userBookings.filter((b) => b.booking_status === 'Confirmed').length;
  const completedCount = userBookings.filter((b) => b.booking_status === 'Completed').length;
  const cancelledCount = userBookings.filter((b) => b.booking_status === 'Cancelled').length;

  const paidBookings = userBookings.filter(
    (b) => b.payment_status === 'Paid' && b.booking_status !== 'Cancelled'
  );
  const totalSpent = paidBookings.reduce((sum, b) => sum + b.price_total, 0);

  // Dynamic tariff rates from database slots
  const carSlot = slots.find((s) => s.vehicle_type === 'Car');
  const bikeSlot = slots.find((s) => s.vehicle_type === 'Motorcycle');
  const carHourPrice = carSlot?.price_per_hour ?? 250;
  const carDayPrice = carSlot?.day_price ?? 2000;
  const bikeHourPrice = bikeSlot?.price_per_hour ?? 100;
  const bikeDayPrice = bikeSlot?.day_price ?? 1000;

  const activeConfirmed = userBookings.find((b) => b.booking_status === 'Confirmed') || null;

  const filteredBookings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return userBookings.filter((b) => {
      if (statusFilter !== 'All' && b.booking_status !== statusFilter) return false;
      if (!q) return true;

      const slot = slots.find((s) => s.slot_id === b.slot_id);
      const area = slot ? areas.find((a) => a.area_id === slot.area_id) : null;
      const vehicle = vehicles.find((v) => v.vehicle_id === b.vehicle_id);

      const searchable = [
        `#${b.booking_id}`,
        slot?.slot_number || '',
        area?.area_name || '',
        vehicle?.vehicle_number || '',
        vehicle?.brand || '',
        vehicle?.model || ''
      ]
        .join(' ')
        .toLowerCase();

      return searchable.includes(q);
    });
  }, [userBookings, statusFilter, searchQuery, slots, areas, vehicles]);

  const handleConfirmCancel = (bookingId: number) => {
    setConfirmCancelId(null);
    const res = cancelBooking(bookingId);
    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="user-portal-container space-y-5">
      {/* Header */}
      <div className="user-page-header m-0">
        <div>
          <div className="user-page-kicker">ParkEase Portal &gt; Booking History</div>
          <h1 className="user-page-title">Booking History</h1>
          <p className="user-page-subtitle">
            View active, completed, and cancelled parking reservations across Chattogram.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToSearch}
          className="btn-primary text-xs sm:text-sm px-4 py-2.5"
        >
          Book New Slot
        </button>
      </div>

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`p-4 rounded-[8px] text-xs flex items-center justify-between gap-2 border ${
            feedback.type === 'success'
              ? 'bg-[var(--status-available-bg)] border-[var(--status-available-border)] text-[var(--status-available)]'
              : 'bg-[var(--status-occupied-bg)] border-[var(--status-occupied-border)] text-[var(--status-occupied)]'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="bg-transparent border-0 text-current cursor-pointer p-1"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Row 1: 3 Summary KPI Cards */}
      <div className="user-stat-grid m-0">
        <div className="user-stat-card">
          <div className="user-stat-label">Total Reservations</div>
          <div className="user-stat-value">{userBookings.length} Bookings</div>
          <div className="user-stat-hint tabular-nums">
            {completedCount} Completed | {confirmedCount} Confirmed | {cancelledCount} Cancelled
          </div>
        </div>

        <div className="user-stat-card">
          <div className="user-stat-label">Total Expenditure</div>
          <div className="user-stat-value">{totalSpent.toFixed(0)} BDT</div>
          <div className="user-stat-hint tabular-nums">
            Across {paidBookings.length} paid {paidBookings.length === 1 ? 'booking' : 'bookings'}
          </div>
        </div>

        <div className="user-stat-card">
          <div className="user-stat-label">Standard Rates</div>
          <div className="grid grid-cols-2 gap-2 mt-1 tabular-nums">
            <div>
              <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Car</div>
              <div className="text-sm font-bold text-[var(--text-heading)]">
                {carHourPrice} BDT/hr
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">{carDayPrice} BDT/day</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Bike</div>
              <div className="text-sm font-bold text-[var(--text-heading)]">
                {bikeHourPrice} BDT/hr
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">{bikeDayPrice} BDT/day</div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Active Booking Highlight Banner (if any Confirmed booking exists) */}
      {activeConfirmed && (() => {
        const slot = slots.find((s) => s.slot_id === activeConfirmed.slot_id);
        const area = slot ? areas.find((a) => a.area_id === slot.area_id) : null;
        const vehicle = vehicles.find((v) => v.vehicle_id === activeConfirmed.vehicle_id);

        return (
          <div className="active-session-banner m-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-[8px] bg-[var(--primary-forest)] text-white flex flex-col items-center justify-center shrink-0 font-bold leading-tight">
                <span className="text-xs">{slot?.slot_number}</span>
                <span className="text-[9px] uppercase opacity-90">{slot?.vehicle_type}</span>
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-[var(--text-heading)]">
                    Confirmed Booking #{activeConfirmed.booking_id}
                  </span>
                  <span className="badge-status badge-confirmed">Confirmed</span>
                  {activeConfirmed.checked_in_at && (
                    <span className="badge-status badge-occupied">Active</span>
                  )}
                  <span
                    className={`badge-status ${
                      activeConfirmed.payment_status === 'Paid'
                        ? 'badge-available'
                        : 'badge-booked'
                    }`}
                  >
                    {activeConfirmed.payment_status}
                  </span>
                </div>
                <div className="text-xs text-[var(--text-muted)] mt-1 tabular-nums">
                  {area?.area_name} | Vehicle: {vehicle?.vehicle_number} ({vehicle?.brand}{' '}
                  {vehicle?.model}) | {activeConfirmed.booking_date} at{' '}
                  {activeConfirmed.booking_time} (
                  {activeConfirmed.duration_hours === 24
                    ? 'Full Day 24h'
                    : `${activeConfirmed.duration_hours}h`}
                  )
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {activeConfirmed.payment_status === 'Pending' && (
                <button
                  type="button"
                  onClick={() => onOpenPayment(activeConfirmed.booking_id)}
                  className="btn-primary text-xs px-3.5 py-2"
                >
                  Pay {activeConfirmed.price_total.toFixed(0)} BDT
                </button>
              )}

              {confirmCancelId === activeConfirmed.booking_id ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleConfirmCancel(activeConfirmed.booking_id)}
                    className="px-3 py-1.5 rounded-[8px] bg-[var(--status-occupied)] text-white text-xs font-bold border-0 cursor-pointer"
                  >
                    Confirm Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmCancelId(null)}
                    className="btn-secondary text-xs px-2.5 py-1.5"
                  >
                    Keep
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmCancelId(activeConfirmed.booking_id)}
                  className="btn-secondary text-xs px-3.5 py-2 text-[var(--status-occupied)] border-[var(--status-occupied-border)]"
                >
                  Cancel Booking
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* Row 3: Segmented Status Filters & Search Box */}
      <div className="history-filter-strip m-0">
        <div className="filter-tab-group" role="tablist" aria-label="Filter bookings by status">
          {(['All', 'Confirmed', 'Completed', 'Cancelled'] as const).map((tab) => {
            const count =
              tab === 'All'
                ? userBookings.length
                : userBookings.filter((b) => b.booking_status === tab).length;
            const isSelected = statusFilter === tab;
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setStatusFilter(tab)}
                className={`filter-tab-btn ${isSelected ? 'active' : ''}`}
              >
                {tab === 'All' ? 'All Bookings' : tab} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative history-search-input w-full">
          <Search
            className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-2.5 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, slot, area, or plate..."
            aria-label="Search booking history"
            className="form-input pl-8 py-1.5 text-xs"
          />
        </div>
      </div>

      {/* Row 4: Flat Bookings Table */}
      {filteredBookings.length > 0 ? (
        <div className="flat-table-wrap">
          <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[var(--text-heading)] m-0">
                Booking Records
              </h2>
              <p className="text-xs text-[var(--text-muted)] m-0 mt-0.5 tabular-nums">
                Showing {filteredBookings.length} of {userBookings.length} bookings
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="flat-table">
              <thead>
                <tr>
                  <th>Booking & Area</th>
                  <th>Slot & Vehicle</th>
                  <th>Schedule & Duration</th>
                  <th>Amount & Payment</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b) => {
                  const slot = slots.find((s) => s.slot_id === b.slot_id);
                  const area = slot ? areas.find((a) => a.area_id === slot.area_id) : null;
                  const vehicle = vehicles.find((v) => v.vehicle_id === b.vehicle_id);
                  const payment = payments.find((p) => p.booking_id === b.booking_id);
                  const isConfirming = confirmCancelId === b.booking_id;

                  return (
                    <tr key={b.booking_id}>
                      <td>
                        <div className="font-bold text-[var(--text-heading)] tabular-nums">
                          #{b.booking_id}
                        </div>
                        <div className="text-xs font-semibold text-[var(--text-ink)]">
                          {area?.area_name}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] truncate max-w-[200px]">
                          {area?.location}
                        </div>
                      </td>

                      <td>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="badge-status badge-available">
                            Slot {slot?.slot_number}
                          </span>
                          <span className="text-[11px] text-[var(--text-muted)]">
                            {slot?.vehicle_type}
                          </span>
                        </div>
                        <div className="font-mono text-xs font-bold text-[var(--text-heading)]">
                          {vehicle?.vehicle_number || 'Registered Vehicle'}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)]">
                          {vehicle ? `${vehicle.brand} ${vehicle.model}` : ''}
                        </div>
                      </td>

                      <td className="tabular-nums">
                        <div className="font-semibold text-[var(--text-heading)]">
                          {b.booking_date}
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">
                          Entry at {b.booking_time}
                        </div>
                        <div className="text-[11px] font-semibold text-[var(--primary-forest)] mt-0.5">
                          {b.duration_hours === 24
                            ? 'Full Day (24 hrs)'
                            : `${b.duration_hours} ${b.duration_hours === 1 ? 'hr' : 'hrs'}`}
                        </div>
                      </td>

                      <td className="tabular-nums">
                        <div className="font-bold text-[var(--text-heading)]">
                          {b.price_total.toFixed(2)} BDT
                        </div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span
                            className={`badge-status ${
                              b.payment_status === 'Paid' ? 'badge-confirmed' : 'badge-booked'
                            }`}
                          >
                            {b.payment_status}
                          </span>
                          {payment && (
                            <span className="text-[11px] text-[var(--text-muted)]">
                              via {payment.payment_method}
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`badge-status ${
                              b.booking_status === 'Confirmed'
                                ? 'badge-confirmed'
                                : b.booking_status === 'Completed'
                                ? 'badge-completed'
                                : 'badge-cancelled'
                            }`}
                          >
                            {b.booking_status}
                          </span>
                          {b.checked_in_at && (
                            <span className="badge-status badge-occupied">Occupied</span>
                          )}
                        </div>
                      </td>

                      <td className="text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          {b.payment_status === 'Pending' && b.booking_status === 'Confirmed' && (
                            <button
                              type="button"
                              onClick={() => onOpenPayment(b.booking_id)}
                              className="btn-primary px-3 py-1.5 text-[11px]"
                            >
                              Pay
                            </button>
                          )}

                          {b.booking_status === 'Confirmed' &&
                            (isConfirming ? (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleConfirmCancel(b.booking_id)}
                                  className="px-2.5 py-1 rounded-[6px] bg-[var(--status-occupied)] text-white text-[11px] font-bold border-0 cursor-pointer"
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmCancelId(null)}
                                  className="btn-secondary px-2 py-1 text-[11px]"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmCancelId(b.booking_id)}
                                className="btn-secondary px-2.5 py-1 text-[11px] text-[var(--status-occupied)] border-[var(--status-occupied-border)]"
                              >
                                Cancel
                              </button>
                            ))}

                          <button
                            type="button"
                            onClick={() => setReceiptBooking(b)}
                            className="btn-secondary px-2.5 py-1 text-[11px]"
                          >
                            <FileText className="w-3 h-3" aria-hidden="true" />
                            <span>Receipt</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="user-empty-state">
          <div className="user-empty-title">No Bookings Found</div>
          <p className="user-empty-desc">
            No bookings matched your current status filter or search query.
          </p>
          <button
            type="button"
            onClick={onNavigateToSearch}
            className="btn-primary text-xs px-4 py-2"
          >
            Find Parking
          </button>
        </div>
      )}

      {/* Booking Receipt Modal */}
      {receiptBooking && (() => {
        const slot = slots.find((s) => s.slot_id === receiptBooking.slot_id);
        const area = slot ? areas.find((a) => a.area_id === slot.area_id) : null;
        const vehicle = vehicles.find((v) => v.vehicle_id === receiptBooking.vehicle_id);
        const payment = payments.find((p) => p.booking_id === receiptBooking.booking_id);

        return (
          <div
            className="fixed inset-0 z-[700] overflow-y-auto bg-black/40 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="receipt-modal-title"
          >
            <div className="soft-raised-static max-w-md w-full p-6 relative">
              <button
                type="button"
                onClick={() => setReceiptBooking(null)}
                className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-heading)] p-1 rounded-[6px] hover:bg-[var(--bg-tint)] bg-transparent border-0 cursor-pointer"
                aria-label="Close receipt"
              >
                <X className="w-5 h-5" />
              </button>

              <h2
                id="receipt-modal-title"
                className="text-base font-bold text-[var(--text-heading)] border-b-2 border-dashed border-[var(--accent-gold)] pb-1 mb-4 inline-block"
              >
                Booking Receipt #{receiptBooking.booking_id}
              </h2>

              <div className="soft-inset p-4 space-y-2 text-xs">
                <div className="flex justify-between border-b border-[var(--border-subtle)] pb-1.5">
                  <span className="text-[var(--text-muted)]">Area</span>
                  <span className="font-semibold text-[var(--text-heading)]">{area?.area_name}</span>
                </div>
                <div className="flex justify-between border-b border-[var(--border-subtle)] pb-1.5">
                  <span className="text-[var(--text-muted)]">Slot</span>
                  <span className="font-bold text-[var(--primary-forest)]">
                    {slot?.slot_number} ({slot?.vehicle_type})
                  </span>
                </div>
                <div className="flex justify-between border-b border-[var(--border-subtle)] pb-1.5">
                  <span className="text-[var(--text-muted)]">Vehicle</span>
                  <span className="font-mono font-bold text-[var(--text-heading)]">
                    {vehicle?.vehicle_number}
                  </span>
                </div>
                <div className="flex justify-between border-b border-[var(--border-subtle)] pb-1.5">
                  <span className="text-[var(--text-muted)]">Schedule</span>
                  <span className="font-semibold tabular-nums">
                    {receiptBooking.booking_date} at {receiptBooking.booking_time}
                  </span>
                </div>
                <div className="flex justify-between border-b border-[var(--border-subtle)] pb-1.5">
                  <span className="text-[var(--text-muted)]">Duration</span>
                  <span className="font-semibold tabular-nums">
                    {receiptBooking.duration_hours === 24
                      ? 'Full Day (24 hrs)'
                      : `${receiptBooking.duration_hours} hrs`}
                  </span>
                </div>
                <div className="flex justify-between border-b border-[var(--border-subtle)] pb-1.5">
                  <span className="text-[var(--text-muted)]">Payment Status</span>
                  <span className="font-semibold">
                    {receiptBooking.payment_status}
                    {payment ? ` (${payment.payment_method})` : ''}
                  </span>
                </div>
                <div className="flex justify-between border-b border-[var(--border-subtle)] pb-1.5">
                  <span className="text-[var(--text-muted)]">Booking Status</span>
                  <span className="font-bold">{receiptBooking.booking_status}</span>
                </div>
                <div className="flex justify-between pt-1 text-sm font-bold tabular-nums">
                  <span className="text-[var(--text-heading)]">Total Amount</span>
                  <span className="text-[var(--primary-forest)]">
                    {receiptBooking.price_total.toFixed(2)} BDT
                  </span>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setReceiptBooking(null)}
                  className="btn-primary text-xs px-4 py-2"
                >
                  Close Receipt
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
