import React, { useState } from 'react';
import { useParkEase } from '../../context/ParkEaseContext';
import { Booking } from '../../types';
import { Car, Calendar, ShieldAlert, Bike, ArrowRight, MapPin, X } from 'lucide-react';

interface UserDashboardProps {
  onNavigateToTab: (tab: string) => void;
  onOpenPayment: (bookingId: number) => void;
  onRequestPhoneVerification?: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  onNavigateToTab,
  onOpenPayment,
  onRequestPhoneVerification
}) => {
  const {
    currentUser,
    userVehicles,
    activeVehicle,
    bookings,
    payments,
    slots,
    areas
  } = useParkEase();

  const activeAreas = areas.filter((a) => a.status === 'Active');
  const [quickAreaId, setQuickAreaId] = useState<number>(activeAreas[0]?.area_id || 1);
  const [quickVehicleType, setQuickVehicleType] = useState<'Car' | 'Motorcycle'>('Car');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Compute user bookings and payments dynamically from database/state
  const userBookings = bookings.filter((b) => b.user_id === currentUser?.user_id);
  const confirmedBookings = [...userBookings]
    .filter((b) => b.booking_status === 'Confirmed')
    .sort((a, b) => a.booking_date.localeCompare(b.booking_date) || a.booking_time.localeCompare(b.booking_time));
  const upcomingBooking = confirmedBookings[0] || null;
  const recentBookings = [...userBookings]
    .sort((a, b) => b.booking_id - a.booking_id)
    .slice(0, 5);

  const userBookingIds = new Set(userBookings.map((b) => b.booking_id));
  const userPaidPayments = payments
    .filter((p) => userBookingIds.has(p.booking_id) && p.payment_status === 'Paid')
    .sort((a, b) => b.payment_id - a.payment_id);
  const latestPayment = userPaidPayments[0] || null;

  const getBookingDetails = (b: typeof bookings[0]) => {
    const slot = slots.find((s) => s.slot_id === b.slot_id);
    const area = slot ? areas.find((a) => a.area_id === slot.area_id) : null;
    const vehicle = userVehicles.find((v) => v.vehicle_id === b.vehicle_id);
    return { slot, area, vehicle };
  };

  const upcomingDetails = upcomingBooking ? getBookingDetails(upcomingBooking) : null;

  // Dynamic rates and preview slots for quick reservation strip
  const previewAreaSlots = slots.filter(
    (s) => s.area_id === Number(quickAreaId) && s.vehicle_type === quickVehicleType
  );
  const carRateSlot = slots.find(
    (s) => s.area_id === Number(quickAreaId) && s.vehicle_type === 'Car'
  ) || slots.find((s) => s.vehicle_type === 'Car');
  const bikeRateSlot = slots.find(
    (s) => s.area_id === Number(quickAreaId) && s.vehicle_type === 'Motorcycle'
  ) || slots.find((s) => s.vehicle_type === 'Motorcycle');

  const carHourPrice = carRateSlot?.price_per_hour ?? 250;
  const carDayPrice = carRateSlot?.day_price ?? 2000;
  const bikeHourPrice = bikeRateSlot?.price_per_hour ?? 100;
  const bikeDayPrice = bikeRateSlot?.day_price ?? 1000;

  return (
    <div className="user-portal-container space-y-6">
      {/* Page Header */}
      <div className="user-page-header">
        <div>
          <div className="user-page-kicker">Chattogram Parking System</div>
          <h1 className="user-page-title">User Dashboard</h1>
          <p className="user-page-subtitle">
            Welcome back, <span className="font-semibold text-[var(--text-heading)]">{currentUser?.full_name}</span>. Manage your vehicles, view active reservations, and find parking slots across Chattogram.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigateToTab('search')}
          className="btn-primary text-xs sm:text-sm px-4 py-2.5"
        >
          <span>Book a Slot</span>
          <ArrowRight className="w-4 h-4 text-white" aria-hidden="true" />
        </button>
      </div>

      {/* SMS OTP Phone Verification Banner */}
      {currentUser && !currentUser.phone_verified && (
        <div
          role="alert"
          className="bg-[var(--status-booked-bg)] border border-[var(--status-booked-border)] rounded-[12px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-[var(--status-booked)] shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-xs">
              <div className="font-bold text-[var(--status-booked)]">
                Confirm Your Mobile Number to Enable Parking Bookings
              </div>
              <p className="text-[var(--text-ink)] mt-0.5 m-0">
                Your phone number (<span className="font-semibold">{currentUser.phone}</span>) needs SMS OTP confirmation to unlock slot reservations.
              </p>
            </div>
          </div>
          {onRequestPhoneVerification && (
            <button
              type="button"
              onClick={onRequestPhoneVerification}
              className="btn-primary text-xs px-4 py-2 shrink-0"
            >
              Confirm Phone via SMS
            </button>
          )}
        </div>
      )}

      {/* Row 1: 3 Summary KPI Cards */}
      <div className="user-stat-grid">
        {/* Card 1: Active Booking */}
        <div className="user-stat-card">
          <div>
            <div className="user-stat-header">
              <span className="user-stat-label">Active Booking</span>
              <span className={`badge-status ${confirmedBookings.length > 0 ? 'badge-available' : 'badge-neutral'}`}>
                {confirmedBookings.length > 0 ? 'Active' : 'None'}
              </span>
            </div>
            <div className="user-stat-value">
              {confirmedBookings.length} Active {confirmedBookings.length === 1 ? 'Reservation' : 'Reservations'}
            </div>
            <p className="user-stat-hint">
              {upcomingBooking && upcomingDetails
                ? `${upcomingDetails.area?.area_name} (Slot ${upcomingDetails.slot?.slot_number}, ${upcomingDetails.slot?.vehicle_type})`
                : 'No active confirmed reservation right now'}
            </p>
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => onNavigateToTab('user-history')}
              className="btn-secondary w-full text-xs py-2"
            >
              View Booking History
            </button>
          </div>
        </div>

        {/* Card 2: Vehicle Inventory */}
        <div className="user-stat-card">
          <div>
            <div className="user-stat-header">
              <span className="user-stat-label">Vehicle Inventory</span>
              <span className="badge-status badge-available">{userVehicles.length} Saved</span>
            </div>
            <div className="user-stat-value">
              {userVehicles.length} Registered {userVehicles.length === 1 ? 'Vehicle' : 'Vehicles'}
            </div>
            <p className="user-stat-hint">
              {activeVehicle
                ? `Primary: ${activeVehicle.brand} ${activeVehicle.model} (${activeVehicle.vehicle_number})`
                : 'Add a vehicle to speed up bookings'}
            </p>
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => onNavigateToTab('user-vehicles')}
              className="btn-secondary w-full text-xs py-2"
            >
              Manage Vehicles
            </button>
          </div>
        </div>

        {/* Card 3: Last Payment */}
        <div className="user-stat-card">
          <div>
            <div className="user-stat-header">
              <span className="user-stat-label">Billing Summary</span>
              <span className={`badge-status ${latestPayment ? 'badge-available' : 'badge-neutral'}`}>
                {latestPayment ? 'Paid' : 'No Payments'}
              </span>
            </div>
            <div className="user-stat-value">
              Last Paid: {latestPayment ? latestPayment.amount : 0} BDT
            </div>
            <p className="user-stat-hint">
              {latestPayment
                ? `Via ${latestPayment.payment_method} | Booking #${latestPayment.booking_id}`
                : 'Completed booking payments will appear here'}
            </p>
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => onNavigateToTab('user-history')}
              className="btn-secondary w-full text-xs py-2"
            >
              View Payment History
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Active Reservation Card (No QR code, no Extend/Directions buttons) */}
      <div className="user-ticket-card">
        <div className="user-ticket-header">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--primary-forest)] mb-0.5">
              Active Reservation
            </div>
            <h2 className="text-lg font-bold text-[var(--text-heading)] m-0">
              {upcomingBooking && upcomingDetails
                ? upcomingDetails.area?.area_name || 'Upcoming Reservation'
                : 'Upcoming Reservation'}
            </h2>
            {upcomingBooking && upcomingDetails?.area?.location && (
              <p className="text-xs text-[var(--text-muted)] m-0 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-[var(--primary-forest)]" aria-hidden="true" />
                <span>{upcomingDetails.area.location}</span>
              </p>
            )}
          </div>

          {upcomingBooking ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[var(--text-muted)] tabular-nums">
                Booking #{upcomingBooking.booking_id}
              </span>
              {upcomingBooking.checked_in_at && (
                <span className="badge-status badge-occupied">Active</span>
              )}
              <span
                className={`badge-status ${
                  upcomingBooking.payment_status === 'Paid' ? 'badge-confirmed' : 'badge-booked'
                }`}
              >
                {upcomingBooking.payment_status}
              </span>
            </div>
          ) : null}
        </div>

        {upcomingBooking && upcomingDetails ? (
          <div className="space-y-4">
            <div className="ticket-sub-grid">
              <div className="ticket-sub-tile">
                <div className="ticket-data-label">Assigned Slot</div>
                <div className="ticket-data-val">Slot {upcomingDetails.slot?.slot_number}</div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5">
                  {upcomingDetails.slot?.vehicle_type} Slot
                </div>
              </div>

              <div className="ticket-sub-tile">
                <div className="ticket-data-label">Arrival Schedule</div>
                <div className="ticket-data-val tabular-nums">{upcomingBooking.booking_date}</div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5 tabular-nums">
                  Entry at {upcomingBooking.booking_time}
                </div>
              </div>

              <div className="ticket-sub-tile">
                <div className="ticket-data-label">Duration & Total</div>
                <div className="ticket-data-val tabular-nums">{upcomingBooking.price_total} BDT</div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5 tabular-nums">
                  {upcomingBooking.duration_hours === 24
                    ? 'Full Day (24 hours)'
                    : `${upcomingBooking.duration_hours} hours`}
                </div>
              </div>
            </div>

            <div className="flat-subcard p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="ticket-data-label">Assigned Vehicle</div>
                <div className="text-sm font-bold text-[var(--text-heading)]">
                  {upcomingDetails.vehicle
                    ? `${upcomingDetails.vehicle.brand} ${upcomingDetails.vehicle.model}`
                    : 'Registered Vehicle'}
                </div>
              </div>
              {upcomingDetails.vehicle && (
                <span className="ticket-plate-badge">
                  {upcomingDetails.vehicle.vehicle_number}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setSelectedBooking(upcomingBooking)}
                className="btn-primary text-xs px-4 py-2"
              >
                View Booking Details
              </button>
              <button
                type="button"
                onClick={() => onNavigateToTab('user-history')}
                className="btn-secondary text-xs px-4 py-2"
              >
                Manage in History
              </button>
            </div>
          </div>
        ) : (
          <div className="user-empty-state">
            <Calendar className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" aria-hidden="true" />
            <div className="user-empty-title">No Active Reservation</div>
            <p className="user-empty-desc">
              You have no upcoming confirmed reservations right now. Search available bays to reserve a slot.
            </p>
            <button
              type="button"
              onClick={() => onNavigateToTab('search')}
              className="btn-primary text-xs px-4 py-2"
            >
              Find Parking
            </button>
          </div>
        )}
      </div>

      {/* Row 3: Recent Bookings Table */}
      <div className="flat-table-wrap">
        <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[var(--text-heading)] m-0">
              Recent Bookings
            </h2>
            <p className="text-xs text-[var(--text-muted)] m-0 mt-0.5 tabular-nums">
              Showing {recentBookings.length} of {userBookings.length} {userBookings.length === 1 ? 'reservation' : 'reservations'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToTab('user-history')}
            className="btn-secondary text-xs px-3.5 py-1.5"
          >
            View All in History
          </button>
        </div>

        {recentBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="flat-table">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Area &amp; Slot</th>
                  <th>Vehicle</th>
                  <th>Schedule</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th className="text-right">Details</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => {
                  const details = getBookingDetails(b);
                  return (
                    <tr key={b.booking_id}>
                      <td className="font-bold text-[var(--text-heading)] tabular-nums">
                        #{b.booking_id}
                      </td>
                      <td>
                        <div className="font-semibold text-[var(--text-heading)]">
                          {details.area?.area_name || 'Parking Area'}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)]">
                          Slot {details.slot?.slot_number || '-'} ({details.slot?.vehicle_type || '-'})
                        </div>
                      </td>
                      <td>
                        <div className="font-mono text-xs font-bold text-[var(--text-heading)]">
                          {details.vehicle?.vehicle_number || 'Registered Vehicle'}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)]">
                          {details.vehicle ? `${details.vehicle.brand} ${details.vehicle.model}` : ''}
                        </div>
                      </td>
                      <td className="tabular-nums">
                        <div className="font-semibold text-[var(--text-heading)]">
                          {b.booking_date}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)]">
                          {b.booking_time} ({b.duration_hours === 24 ? 'Full Day' : `${b.duration_hours}h`})
                        </div>
                      </td>
                      <td className="tabular-nums">
                        <div className="font-bold text-[var(--text-heading)]">
                          {b.price_total} BDT
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)]">
                          {b.payment_status}
                        </div>
                      </td>
                      <td>
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
                      </td>
                      <td className="text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedBooking(b)}
                          className="btn-secondary text-[11px] px-2.5 py-1"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-[var(--text-muted)]">
            No bookings found yet. Search available slots to create your first reservation.
          </div>
        )}
      </div>

      {/* Row 4: Quick Slot Reservation Preview */}
      <div className="soft-raised-static p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-[var(--text-heading)] m-0">
              Quick Slot Preview
            </h2>
            <p className="text-xs text-[var(--text-muted)] m-0 mt-0.5">
              Inspect live slot status in any Chattogram area before opening Find Parking.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-semibold">
            <span className="badge-status badge-available">Available</span>
            <span className="badge-status badge-booked">Booked</span>
            <span className="badge-status badge-occupied">Occupied</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
          <div>
            <label htmlFor="dash-quick-area" className="form-label block mb-1">
              Select Parking Area
            </label>
            <select
              id="dash-quick-area"
              value={quickAreaId}
              onChange={(e) => setQuickAreaId(Number(e.target.value))}
              className="form-select text-xs font-semibold"
            >
              {activeAreas.map((area) => {
                const count = slots.filter((s) => s.area_id === area.area_id).length;
                return (
                  <option key={area.area_id} value={area.area_id}>
                    {area.area_name} ({count} Slots)
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <span className="form-label block mb-1">Vehicle Type</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setQuickVehicleType('Car')}
                className={`py-2 px-3 rounded-[8px] text-xs font-bold flex items-center justify-center gap-1.5 border transition-colors ${
                  quickVehicleType === 'Car'
                    ? 'bg-[var(--primary-forest)] text-white border-[var(--primary-forest)]'
                    : 'bg-[var(--bg-base)] text-[var(--text-ink)] border-[var(--border-subtle)]'
                }`}
              >
                <Car className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Car</span>
              </button>
              <button
                type="button"
                onClick={() => setQuickVehicleType('Motorcycle')}
                className={`py-2 px-3 rounded-[8px] text-xs font-bold flex items-center justify-center gap-1.5 border transition-colors ${
                  quickVehicleType === 'Motorcycle'
                    ? 'bg-[var(--primary-forest)] text-white border-[var(--primary-forest)]'
                    : 'bg-[var(--bg-base)] text-[var(--text-ink)] border-[var(--border-subtle)]'
                }`}
              >
                <Bike className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Motorcycle</span>
              </button>
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => onNavigateToTab('search')}
              className="btn-primary w-full py-2.5 text-xs"
            >
              <span>Search & Book in Find Parking</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flat-subcard p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-heading)]">
              Slot Preview ({areas.find((a) => a.area_id === Number(quickAreaId))?.area_name})
            </span>
            <span className="text-xs font-semibold text-[var(--text-muted)] tabular-nums">
              Car: {carHourPrice} BDT/hr ({carDayPrice}/day) | Motorcycle: {bikeHourPrice} BDT/hr ({bikeDayPrice}/day)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {previewAreaSlots.slice(0, 4).map((slot) => {
              const isAvail = slot.status === 'Available';
              const isBooked = slot.status === 'Booked';
              return (
                <div
                  key={slot.slot_id}
                  className={`find-slot-tile ${
                    isAvail ? 'is-available' : isBooked ? 'is-booked' : 'is-occupied'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-[var(--text-heading)]">
                      {slot.slot_number}
                    </span>
                    <span
                      className={`badge-status ${
                        isAvail
                          ? 'badge-available'
                          : isBooked
                          ? 'badge-booked'
                          : 'badge-occupied'
                      }`}
                    >
                      {slot.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] font-semibold tabular-nums">
                    {slot.price_per_hour} BDT/hr | {slot.day_price}/day
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (() => {
        const details = getBookingDetails(selectedBooking);
        const payment = payments.find((p) => p.booking_id === selectedBooking.booking_id);
        return (
          <div
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/45 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-details-title"
          >
            <div className="soft-raised-static w-full max-w-md p-6 space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--primary-forest)]">
                    Reservation Details
                  </div>
                  <h3 id="booking-details-title" className="text-lg font-bold text-[var(--text-heading)] m-0">
                    Booking #{selectedBooking.booking_id}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="p-1.5 rounded-[8px] text-[var(--text-muted)] hover:text-[var(--text-heading)]"
                  aria-label="Close booking details"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flat-subcard p-3">
                  <div className="ticket-data-label">Parking Area</div>
                  <div className="font-bold text-[var(--text-heading)]">
                    {details.area?.area_name || 'Parking Area'}
                  </div>
                  {details.area?.location && (
                    <div className="text-[var(--text-muted)] mt-0.5">
                      {details.area.location}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flat-subcard p-3">
                    <div className="ticket-data-label">Slot</div>
                    <div className="font-bold text-[var(--text-heading)]">
                      Slot {details.slot?.slot_number || '-'}
                    </div>
                    <div className="text-[var(--text-muted)]">
                      {details.slot?.vehicle_type || '-'}
                    </div>
                  </div>
                  <div className="flat-subcard p-3">
                    <div className="ticket-data-label">Vehicle</div>
                    <div className="font-bold text-[var(--text-heading)]">
                      {details.vehicle?.vehicle_number || 'Registered Vehicle'}
                    </div>
                    <div className="text-[var(--text-muted)]">
                      {details.vehicle ? `${details.vehicle.brand} ${details.vehicle.model}` : '-'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 tabular-nums">
                  <div className="flat-subcard p-3">
                    <div className="ticket-data-label">Schedule</div>
                    <div className="font-bold text-[var(--text-heading)]">
                      {selectedBooking.booking_date}
                    </div>
                    <div className="text-[var(--text-muted)]">
                      {selectedBooking.booking_time} ({selectedBooking.duration_hours === 24 ? 'Full Day' : `${selectedBooking.duration_hours} hrs`})
                    </div>
                  </div>
                  <div className="flat-subcard p-3">
                    <div className="ticket-data-label">Payment &amp; Status</div>
                    <div className="font-bold text-[var(--text-heading)]">
                      {selectedBooking.price_total} BDT
                    </div>
                    <div className="text-[var(--text-muted)]">
                      {selectedBooking.booking_status} · {selectedBooking.payment_status}
                      {payment ? ` (${payment.payment_method})` : ''}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
                {selectedBooking.booking_status === 'Confirmed' && selectedBooking.payment_status === 'Pending' && (
                  <button
                    type="button"
                    onClick={() => {
                      const id = selectedBooking.booking_id;
                      setSelectedBooking(null);
                      onOpenPayment(id);
                    }}
                    className="btn-primary text-xs px-4 py-2"
                  >
                    Pay {selectedBooking.price_total} BDT
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBooking(null);
                    onNavigateToTab('user-history');
                  }}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  Manage in History
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="btn-secondary text-xs px-3.5 py-2"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
