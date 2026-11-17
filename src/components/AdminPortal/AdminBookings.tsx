import React, { useState } from 'react';
import { useParkEase } from '../../context/ParkEaseContext';
import { Booking } from '../../types';
import { Search, CalendarCheck, Check, AlertCircle, X, MapPin, Car, Clock } from 'lucide-react';

export const AdminBookings: React.FC = () => {
  const { bookings, slots, areas, vehicles, users, adminCancelBooking } = useParkEase();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Confirmed' | 'Completed' | 'Cancelled'>('All');
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(
    bookings[0]?.booking_id ?? null
  );
  const [confirmCancelBooking, setConfirmCancelBooking] = useState<Booking | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Database counts only
  const totalBookings = bookings.length;
  const confirmedCount = bookings.filter((b) => b.booking_status === 'Confirmed').length;
  const completedCount = bookings.filter((b) => b.booking_status === 'Completed').length;
  const cancelledCount = bookings.filter((b) => b.booking_status === 'Cancelled').length;

  const filteredBookings = bookings.filter((b) => {
    const customer = users.find((u) => u.user_id === b.user_id);
    const slot = slots.find((s) => s.slot_id === b.slot_id);
    const area = slot ? areas.find((a) => a.area_id === slot.area_id) : null;
    const vehicle = vehicles.find((v) => v.vehicle_id === b.vehicle_id);

    const customerName = customer?.full_name || '';
    const vehicleNumber = vehicle?.vehicle_number || '';
    const slotNum = slot?.slot_number || '';
    const areaName = area?.area_name || '';
    const q = searchTerm.trim().toLowerCase();

    const matchSearch =
      !q ||
      b.booking_id.toString().includes(q) ||
      customerName.toLowerCase().includes(q) ||
      vehicleNumber.toLowerCase().includes(q) ||
      slotNum.toLowerCase().includes(q) ||
      areaName.toLowerCase().includes(q);

    const matchStatus = statusFilter === 'All' || b.booking_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const selectedBooking =
    filteredBookings.find((b) => b.booking_id === selectedBookingId) ||
    filteredBookings[0] ||
    null;

  const selectedCustomer = selectedBooking
    ? users.find((u) => u.user_id === selectedBooking.user_id)
    : null;
  const selectedSlot = selectedBooking
    ? slots.find((s) => s.slot_id === selectedBooking.slot_id)
    : null;
  const selectedArea = selectedSlot
    ? areas.find((a) => a.area_id === selectedSlot.area_id)
    : null;
  const selectedVehicle = selectedBooking
    ? vehicles.find((v) => v.vehicle_id === selectedBooking.vehicle_id)
    : null;

  const formatDurationLabel = (hours: number) => {
    if (hours === 24) return 'Full day';
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  };

  const getBookingBadgeClass = (status: Booking['booking_status']) => {
    if (status === 'Confirmed') return 'badge-available';
    if (status === 'Completed') return 'badge-neutral';
    return 'badge-occupied';
  };

  const getPaymentBadgeClass = (status: Booking['payment_status']) => {
    if (status === 'Paid') return 'badge-available';
    if (status === 'Pending') return 'badge-booked';
    return 'badge-occupied';
  };

  const handleConfirmCancel = () => {
    if (!confirmCancelBooking) return;
    const res = adminCancelBooking(confirmCancelBooking.booking_id);
    setFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message
    });
    setConfirmCancelBooking(null);
  };

  return (
    <div className="admin-page-wrap">
      {/* Breadcrumb & Page Header with thin yellow dashed underline */}
      <div className="admin-breadcrumb">Admin Portal / Bookings</div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Booking Management</h1>
          <p className="admin-page-subtitle">
            View all parking bookings, check reservation details, and cancel confirmed bookings.
          </p>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          role="status"
          className={`mb-5 p-3.5 rounded-[8px] text-xs flex items-center justify-between gap-2 border ${
            feedback.type === 'success'
              ? 'bg-[var(--status-available-bg)] border-[var(--status-available-border)] text-[var(--status-available)]'
              : 'bg-[var(--status-occupied-bg)] border-[var(--status-occupied-border)] text-[var(--status-occupied)]'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            {feedback.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="bg-transparent border-0 p-0 cursor-pointer text-current opacity-75 hover:opacity-100"
            aria-label="Dismiss message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Four Stat Cards (DB counts only) */}
      <div className="admin-stats-grid-4">
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Bookings</span>
          </div>
          <div className="admin-stat-value">{totalBookings}</div>
          <div className="admin-stat-caption">All database bookings</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Confirmed</span>
          </div>
          <div className="admin-stat-value is-success">{confirmedCount}</div>
          <div className="admin-stat-caption">Active reservations</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Completed</span>
          </div>
          <div className="admin-stat-value">{completedCount}</div>
          <div className="admin-stat-caption">Finished bookings</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Cancelled</span>
          </div>
          <div className="admin-stat-value is-danger">{cancelledCount}</div>
          <div className="admin-stat-caption is-danger">Cancelled reservations</div>
        </div>
      </div>

      {/* Filter Bar: Status Tabs (All Bookings, Confirmed, Completed, Cancelled) & Search */}
      <div className="admin-filter-card">
        <div className="admin-filter-group">
          <button
            type="button"
            onClick={() => setStatusFilter('All')}
            className={`admin-filter-btn ${statusFilter === 'All' ? 'active' : ''}`}
          >
            All Bookings ({totalBookings})
          </button>
          {(['Confirmed', 'Completed', 'Cancelled'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`admin-filter-btn ${statusFilter === status ? 'active' : ''}`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="admin-search-box">
          <Search className="admin-search-icon" aria-hidden="true" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search booking ID, user, plate..."
            aria-label="Search bookings"
            className="admin-search-input"
          />
        </div>
      </div>

      {/* Two-Column Layout: Left Bookings Table + Right Booking Details Inspector */}
      <div className="admin-two-col-inspector">
        {/* Left: Flat Bookings Table */}
        <div className="admin-flat-table-wrap">
          <div className="admin-flat-table-titlebar">
            <h2 className="admin-card-title">
              <CalendarCheck className="w-4 h-4 text-[var(--primary-forest)]" aria-hidden="true" />
              <span>Bookings ({filteredBookings.length})</span>
            </h2>
          </div>

          <div className="admin-table-scroll">
            <table className="admin-flat-table">
              <thead>
                <tr>
                  <th>ID &amp; Date</th>
                  <th>User</th>
                  <th>Vehicle</th>
                  <th>Area &amp; Slot</th>
                  <th>Duration &amp; Total</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length > 0 ? (
                  filteredBookings.map((b) => {
                    const customer = users.find((u) => u.user_id === b.user_id);
                    const slot = slots.find((s) => s.slot_id === b.slot_id);
                    const area = slot ? areas.find((a) => a.area_id === slot.area_id) : null;
                    const vehicle = vehicles.find((v) => v.vehicle_id === b.vehicle_id);
                    const isSelected = selectedBooking?.booking_id === b.booking_id;

                    return (
                      <tr
                        key={b.booking_id}
                        onClick={() => setSelectedBookingId(b.booking_id)}
                        className={`is-clickable ${isSelected ? 'is-selected' : ''}`}
                      >
                        <td className="tabular-nums">
                          <div className="font-bold text-[var(--primary-forest)]">
                            #{b.booking_id}
                          </div>
                          <div className="text-[11px] text-[var(--text-muted)]">
                            {b.booking_date}
                          </div>
                          <div className="text-[11px] text-[var(--text-muted)]">
                            {b.booking_time}
                          </div>
                        </td>
                        <td>
                          <div className="font-semibold text-[var(--text-heading)]">
                            {customer?.full_name || 'User'}
                          </div>
                          <div className="text-[11px] text-[var(--text-muted)]">
                            {customer?.phone || ''}
                          </div>
                        </td>
                        <td>
                          <div className="font-bold text-[var(--text-heading)] font-mono text-[11px]">
                            {vehicle?.vehicle_number || '-'}
                          </div>
                          <div className="text-[11px] text-[var(--text-muted)]">
                            {vehicle?.vehicle_type || slot?.vehicle_type || ''}
                          </div>
                        </td>
                        <td>
                          <div className="font-semibold text-[var(--text-heading)]">
                            {area?.area_name || 'Area'}
                          </div>
                          <div className="text-[11px] text-[var(--text-muted)]">
                            Slot {slot?.slot_number || '-'}
                          </div>
                        </td>
                        <td className="tabular-nums">
                          <div className="font-bold text-[var(--text-heading)]">
                            BDT {b.price_total}
                          </div>
                          <div className="text-[11px] text-[var(--text-muted)]">
                            {formatDurationLabel(b.duration_hours)}
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-col items-start gap-1">
                            <span className={`badge-status ${getBookingBadgeClass(b.booking_status)}`}>
                              {b.booking_status}
                            </span>
                            <span className={`badge-status ${getPaymentBadgeClass(b.payment_status)}`}>
                              {b.payment_status}
                            </span>
                          </div>
                        </td>
                        <td className="text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBookingId(b.booking_id);
                            }}
                            className="admin-row-btn"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-[var(--text-muted)]">
                      No bookings found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Sticky Booking Details Inspector */}
        <aside className="admin-detail-inspector" aria-label="Selected booking details">
          {selectedBooking ? (
            <>
              <div className="flex items-start justify-between gap-2 pb-3 mb-4 border-b border-[var(--border-subtle)]">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Selected Booking
                  </div>
                  <h2 className="text-base font-bold text-[var(--text-heading)] m-0 mt-0.5">
                    Booking Details #{selectedBooking.booking_id}
                  </h2>
                </div>
                <span className={`badge-status ${getBookingBadgeClass(selectedBooking.booking_status)}`}>
                  {selectedBooking.booking_status}
                </span>
              </div>

              {/* User Box */}
              <div className="inspector-inset-box">
                <div className="inspector-row-label uppercase font-bold mb-1">User</div>
                <div className="text-[13px] font-bold text-[var(--text-heading)]">
                  {selectedCustomer?.full_name || 'User'}
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  {selectedCustomer?.email || '-'}
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  {selectedCustomer?.phone || '-'}
                </div>
              </div>

              {/* Area & Slot + Rates Box */}
              <div className="inspector-inset-box">
                <div className="inspector-row-label uppercase font-bold mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" aria-hidden="true" />
                  <span>Area &amp; Slot</span>
                </div>
                <div className="text-[13px] font-bold text-[var(--text-heading)]">
                  {selectedArea?.area_name || 'Area'}
                </div>
                <div className="text-xs text-[var(--text-ink)] mt-0.5">
                  Slot {selectedSlot?.slot_number || '-'} ({selectedSlot?.vehicle_type || 'Vehicle'})
                </div>
                {selectedSlot && (
                  <div className="text-[11px] text-[var(--text-muted)] mt-1 tabular-nums">
                    Rate: BDT {selectedSlot.price_per_hour}/hr | BDT{' '}
                    {selectedSlot.day_price || (selectedSlot.vehicle_type === 'Car' ? 2000 : 1000)}/day
                  </div>
                )}
              </div>

              {/* Vehicle Box */}
              <div className="inspector-inset-box">
                <div className="inspector-row-label uppercase font-bold mb-1.5 flex items-center gap-1">
                  <Car className="w-3 h-3" aria-hidden="true" />
                  <span>Vehicle</span>
                </div>
                <div className="admin-plate-tile">
                  {selectedVehicle?.vehicle_number || '-'}
                </div>
                <div className="text-xs text-[var(--text-ink)] mt-1.5">
                  {selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : '-'}
                </div>
              </div>

              {/* Schedule & Duration Box */}
              <div className="inspector-inset-box">
                <div className="inspector-row-label uppercase font-bold mb-1.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" aria-hidden="true" />
                  <span>Schedule &amp; Duration</span>
                </div>
                <div className="flex items-center justify-between text-xs py-0.5">
                  <span className="text-[var(--text-muted)]">Date</span>
                  <span className="font-semibold text-[var(--text-ink)] tabular-nums">
                    {selectedBooking.booking_date}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs py-0.5">
                  <span className="text-[var(--text-muted)]">Start Time</span>
                  <span className="font-semibold text-[var(--text-ink)] tabular-nums">
                    {selectedBooking.booking_time}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs py-0.5">
                  <span className="text-[var(--text-muted)]">Duration</span>
                  <span className="font-semibold text-[var(--text-ink)]">
                    {formatDurationLabel(selectedBooking.duration_hours)}
                  </span>
                </div>
              </div>

              {/* Total & Payment Box */}
              <div className="inspector-inset-box flex items-center justify-between gap-2">
                <div>
                  <div className="inspector-row-label uppercase font-bold">Total Amount</div>
                  <div className="text-base font-bold text-[var(--primary-forest)] tabular-nums mt-0.5">
                    BDT {selectedBooking.price_total}
                  </div>
                </div>
                <span className={`badge-status ${getPaymentBadgeClass(selectedBooking.payment_status)}`}>
                  {selectedBooking.payment_status}
                </span>
              </div>

              {/* Cancel Booking action for Confirmed bookings */}
              {selectedBooking.booking_status === 'Confirmed' && (
                <button
                  type="button"
                  onClick={() => setConfirmCancelBooking(selectedBooking)}
                  className="admin-row-btn admin-row-btn-danger w-full py-2.5 text-xs"
                >
                  Cancel Booking
                </button>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-xs text-[var(--text-muted)]">
              Click a booking row to view its details.
            </div>
          )}
        </aside>
      </div>

      {/* Cancel Booking Confirmation Modal */}
      {confirmCancelBooking && (
        <div className="admin-modal-backdrop">
          <div
            className="admin-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-booking-modal-title"
          >
            <h2
              id="cancel-booking-modal-title"
              className="title-underline text-base font-bold text-[var(--text-heading)]"
            >
              Cancel Booking #{confirmCancelBooking.booking_id}?
            </h2>
            <p className="text-xs text-[var(--text-ink)] leading-relaxed mb-5">
              This will mark booking #{confirmCancelBooking.booking_id} as Cancelled and release its
              reserved slot back to Available.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmCancelBooking(null)}
                className="btn-secondary text-xs px-3.5 py-2"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="admin-row-btn admin-row-btn-danger px-4 py-2 text-xs"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

