import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParkEase } from '../../context/ParkEaseContext';
import { subscribeLiveRefresh, LIVE_REFRESH_INTERVAL_MS } from '../../utils/liveRefresh';
import {
  Users,
  Car,
  MapPin,
  Grid,
  Calendar,
  CreditCard,
  Banknote,
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { OccupancyTrendChart } from './OccupancyTrendChart';

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
}

const getBookingBadgeClass = (status: string): string => {
  if (status === 'Confirmed') return 'badge-status badge-confirmed';
  if (status === 'Completed') return 'badge-status badge-completed';
  return 'badge-status badge-cancelled';
};

const getPaymentBadgeClass = (status: string): string => {
  if (status === 'Paid') return 'badge-status badge-available';
  if (status === 'Pending') return 'badge-status badge-booked';
  return 'badge-status badge-occupied';
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const { currentUser, users, vehicles, areas, slots, bookings, payments, refreshLiveData } =
    useParkEase();

  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const refreshRef = useRef(refreshLiveData);
  refreshRef.current = refreshLiveData;

  const loadDashboardData = useCallback(async (showSpinner: boolean = false) => {
    if (showSpinner) {
      setIsInitialLoading(true);
    }
    setDashboardError(null);
    try {
      await refreshRef.current();
    } catch {
      setDashboardError('Unable to load latest dashboard data.');
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboardData(true);
    const stop = subscribeLiveRefresh(() => loadDashboardData(false), LIVE_REFRESH_INTERVAL_MS);
    return () => stop();
  }, [loadDashboardData]);

  // Enforce admin-only access for this view
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="admin-page-wrap">
        <div className="admin-state-card" role="alert">
          <AlertCircle className="w-6 h-6 text-[var(--status-occupied)]" aria-hidden="true" />
          <div className="text-sm font-bold text-[var(--text-heading)]">Admin access required.</div>
        </div>
      </div>
    );
  }

  if (isInitialLoading) {
    return (
      <div className="admin-page-wrap">
        <div className="admin-state-card" role="status" aria-live="polite">
          <Loader2 className="admin-spinner" aria-hidden="true" />
          <div className="text-sm font-semibold text-[var(--text-heading)]">Loading dashboard</div>
        </div>
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="admin-page-wrap">
        <div className="admin-state-card" role="alert">
          <AlertCircle className="w-6 h-6 text-[var(--status-occupied)]" aria-hidden="true" />
          <div className="text-sm font-bold text-[var(--text-heading)]">{dashboardError}</div>
          <button
            type="button"
            onClick={() => void loadDashboardData(true)}
            className="btn-primary text-xs px-4 py-2"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Row 1 and Row 2 database counts (strictly derived from live collections)
  const totalSlots = slots.length;
  const carSlots = slots.filter((s) => s.vehicle_type === 'Car').length;
  const motorcycleSlots = slots.filter((s) => s.vehicle_type === 'Motorcycle').length;
  const carSlotsPct = totalSlots > 0 ? Math.round((carSlots / totalSlots) * 100) : 0;
  const motoSlotsPct = totalSlots > 0 ? 100 - carSlotsPct : 0;

  const availableSlots = slots.filter((s) => s.status === 'Available').length;
  const bookedSlots = slots.filter((s) => s.status === 'Booked').length;
  const occupiedSlots = slots.filter((s) => s.status === 'Occupied').length;
  const occupiedPct = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;

  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter((b) => b.booking_status === 'Confirmed').length;
  const completedBookings = bookings.filter((b) => b.booking_status === 'Completed').length;
  const cancelledBookings = bookings.filter((b) => b.booking_status === 'Cancelled').length;

  const totalPayments = payments.length;
  const paidPaymentsList = payments.filter((p) => p.payment_status === 'Paid');
  const paidPayments = paidPaymentsList.length;
  const pendingPayments = payments.filter((p) => p.payment_status === 'Pending').length;
  const failedPayments = payments.filter((p) => p.payment_status === 'Failed').length;
  const totalPaidAmount = paidPaymentsList.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const userAccounts = users.filter((u) => u.role === 'user');
  const totalUsers = userAccounts.length;
  const activeUsers = userAccounts.filter((u) => u.status === 'Active').length;
  const blockedUsers = userAccounts.filter((u) => u.status === 'Blocked').length;

  const totalVehicles = vehicles.length;
  const carVehicles = vehicles.filter((v) => v.vehicle_type === 'Car').length;
  const motorcycleVehicles = vehicles.filter((v) => v.vehicle_type === 'Motorcycle').length;

  const totalAreas = areas.length;
  const activeAreas = areas.filter((a) => a.status === 'Active').length;
  const inactiveAreas = areas.filter((a) => a.status === 'Inactive').length;

  // Ordered areas and latest 6 bookings and payments
  const orderedAreas = [...areas].sort((a, b) => a.area_id - b.area_id);
  const recentBookings = [...bookings]
    .sort((a, b) => b.booking_id - a.booking_id)
    .slice(0, 6);
  const recentPayments = [...payments]
    .sort((a, b) => b.payment_id - a.payment_id)
    .slice(0, 6);

  return (
    <div className="admin-page-wrap">
      {/* Breadcrumb and Title Block */}
      <div className="admin-breadcrumb">Admin Portal / Dashboard</div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Admin Dashboard</h1>
          <p className="admin-page-subtitle">
            Overview of users, vehicles, parking slots, bookings and payments.
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            onClick={() => onNavigateTab('admin-bookings')}
            className="admin-header-link-btn"
          >
            <span>View Bookings</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('admin-slots')}
            className="admin-header-link-btn"
          >
            <span>Manage Slots</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Row 1: Four Big Stat Cards */}
      <div className="admin-stats-grid-4">
        <button
          type="button"
          onClick={() => onNavigateTab('admin-slots')}
          className="admin-stat-card"
        >
          <div>
            <div className="admin-stat-header">
              <span className="admin-stat-label">Total Parking Slots</span>
              <span className="admin-stat-icon" aria-hidden="true">
                <Grid className="w-4 h-4" />
              </span>
            </div>
            <div className="admin-stat-value">{totalSlots}</div>
          </div>

          <div>
            <div className="admin-stat-split-bar" aria-hidden="true">
              <div className="admin-stat-split-car" style={{ width: `${carSlotsPct}%` }} />
              <div className="admin-stat-split-moto" style={{ width: `${motoSlotsPct}%` }} />
            </div>
            <div className="admin-stat-split-legend">
              <span>{carSlots} Car Slots</span>
              <span>{motorcycleSlots} Motorcycle Slots</span>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('admin-slots')}
          className="admin-stat-card"
        >
          <div>
            <div className="admin-stat-header">
              <span className="admin-stat-label">Occupied Slots</span>
              <span className="admin-stat-icon" aria-hidden="true">
                <Car className="w-4 h-4" />
              </span>
            </div>
            <div className="admin-stat-value-row">
              <span className="admin-stat-value">{occupiedSlots}</span>
              <span className="admin-stat-denom">/ {totalSlots}</span>
            </div>
          </div>

          <div>
            <div
              className="admin-progress-track admin-stat-progress"
              role="progressbar"
              aria-valuenow={occupiedSlots}
              aria-valuemin={0}
              aria-valuemax={totalSlots}
              aria-label="Occupied parking slots"
            >
              <div
                className={`admin-progress-fill ${
                  occupiedPct >= 85 ? 'is-occupied' : occupiedPct >= 50 ? 'is-booked' : ''
                }`}
                style={{ width: `${occupiedPct}%` }}
              />
            </div>
            <div className="admin-stat-caption">{availableSlots} slots available</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('admin-bookings')}
          className="admin-stat-card"
        >
          <div>
            <div className="admin-stat-header">
              <span className="admin-stat-label">Total Bookings</span>
              <span className="admin-stat-icon" aria-hidden="true">
                <Calendar className="w-4 h-4" />
              </span>
            </div>
            <div className="admin-stat-value">{totalBookings}</div>
          </div>
          <div className="admin-stat-caption">
            Confirmed {confirmedBookings}, Completed {completedBookings}, Cancelled {cancelledBookings}
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('admin-payments')}
          className="admin-stat-card"
        >
          <div>
            <div className="admin-stat-header">
              <span className="admin-stat-label">Total Paid Amount</span>
              <span className="admin-stat-icon" aria-hidden="true">
                <Banknote className="w-4 h-4" />
              </span>
            </div>
            <div className="admin-stat-value is-success">
              BDT {totalPaidAmount.toLocaleString()}
            </div>
          </div>
          <div className="admin-stat-caption">From {paidPayments} paid payments</div>
        </button>
      </div>

      {/* Row 2: Four Small Stat Cards */}
      <div className="admin-stats-grid-4 admin-stats-grid-compact">
        <button
          type="button"
          onClick={() => onNavigateTab('admin-users')}
          className="admin-stat-card admin-stat-card-sm"
        >
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Users</span>
            <span className="admin-stat-icon" aria-hidden="true">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="admin-stat-value">{totalUsers}</div>
          <div className="admin-stat-caption">
            Active {activeUsers}, Blocked {blockedUsers}
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('admin-vehicles')}
          className="admin-stat-card admin-stat-card-sm"
        >
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Vehicles</span>
            <span className="admin-stat-icon" aria-hidden="true">
              <Car className="w-4 h-4" />
            </span>
          </div>
          <div className="admin-stat-value">{totalVehicles}</div>
          <div className="admin-stat-caption">
            Cars {carVehicles}, Motorcycles {motorcycleVehicles}
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('admin-areas')}
          className="admin-stat-card admin-stat-card-sm"
        >
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Parking Areas</span>
            <span className="admin-stat-icon" aria-hidden="true">
              <MapPin className="w-4 h-4" />
            </span>
          </div>
          <div className="admin-stat-value">{totalAreas}</div>
          <div className="admin-stat-caption">
            Active {activeAreas}, Inactive {inactiveAreas}
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('admin-payments')}
          className="admin-stat-card admin-stat-card-sm"
        >
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Payments</span>
            <span className="admin-stat-icon" aria-hidden="true">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <div className="admin-stat-value">{totalPayments}</div>
          <div className="admin-stat-caption">
            Paid {paidPayments}, Pending {pendingPayments}, Failed {failedPayments}
          </div>
        </button>
      </div>

      {/* Live 24-Hour Parking Occupancy Trends Graph */}
      <OccupancyTrendChart slots={slots} bookings={bookings} />

      {/* Wide Card: Recent Bookings */}
      <section className="admin-card" aria-labelledby="recent-bookings-heading">
        <div className="admin-card-header">
          <div>
            <h2 id="recent-bookings-heading" className="admin-card-title">
              <Calendar className="w-4 h-4 text-[var(--primary-forest)]" aria-hidden="true" />
              <span>Recent Bookings</span>
            </h2>
            <p className="admin-card-subtitle">
              The latest bookings made by users.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('admin-bookings')}
            className="btn-primary text-xs px-3.5 py-2"
          >
            <span>View All Bookings</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        {recentBookings.length > 0 ? (
          <div className="admin-recent-bookings-grid">
            {recentBookings.map((b) => {
              const customer = users.find((u) => u.user_id === b.user_id);
              const slot = slots.find((s) => s.slot_id === b.slot_id);
              const area = slot ? areas.find((a) => a.area_id === slot.area_id) : null;
              const vehicle = vehicles.find((v) => v.vehicle_id === b.vehicle_id);
              const durationText =
                b.duration_hours === 24
                  ? 'Full day'
                  : b.duration_hours === 1
                  ? '1 hour'
                  : `${b.duration_hours} hours`;

              return (
                <div key={b.booking_id} className="admin-booking-tile admin-booking-tile-lift">
                  <div className="admin-booking-tile-top">
                    <span className="text-xs font-bold text-[var(--text-heading)] tabular-nums">
                      #{b.booking_id}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={getBookingBadgeClass(b.booking_status)}>
                        {b.booking_status}
                      </span>
                      <span className={getPaymentBadgeClass(b.payment_status)}>
                        {b.payment_status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-bold text-[var(--text-heading)]">
                      {customer?.full_name || 'User'}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)]">
                      {customer?.email || 'No email'}
                    </div>
                  </div>

                  <div className="admin-booking-tile-meta">
                    <div className="admin-booking-tile-row">
                      <span className="text-[var(--text-muted)]">Area and Slot:</span>
                      <span className="font-semibold text-[var(--text-heading)] text-right">
                        {area?.area_name || 'N/A'}, {slot?.slot_number || 'N/A'}
                      </span>
                    </div>
                    <div className="admin-booking-tile-row">
                      <span className="text-[var(--text-muted)]">Vehicle:</span>
                      <span className="font-semibold text-[var(--text-ink)] text-right">
                        {vehicle?.vehicle_number || 'N/A'}
                      </span>
                    </div>
                    <div className="admin-booking-tile-row">
                      <span className="text-[var(--text-muted)]">Schedule:</span>
                      <span className="font-semibold text-[var(--text-ink)] text-right tabular-nums">
                        {b.booking_date}, {b.booking_time}, {durationText}
                      </span>
                    </div>
                    <div className="admin-booking-tile-row">
                      <span className="text-[var(--text-muted)]">Total:</span>
                      <span className="font-bold text-[var(--primary-forest)] tabular-nums">
                        BDT {b.price_total.toFixed(0)}
                      </span>
                    </div>
                  </div>

                  <div className="admin-booking-tile-footer">
                    <span className="text-[var(--text-muted)] tabular-nums">{b.created_at}</span>
                    <button
                      type="button"
                      onClick={() => onNavigateTab('admin-bookings')}
                      className="text-xs font-bold text-[var(--primary-forest)] hover:underline bg-transparent border-0 p-0 cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>View Booking</span>
                      <ArrowRight className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-xs text-[var(--text-muted)] py-4">No bookings yet.</div>
        )}
      </section>

      {/* Parking Areas Overview (3x2 grid) */}
      <section aria-labelledby="areas-overview-heading">
        <div className="admin-card-header">
          <div>
            <h2 id="areas-overview-heading" className="admin-card-title">
              <MapPin className="w-4 h-4 text-[var(--primary-forest)]" aria-hidden="true" />
              <span>Parking Areas Overview</span>
            </h2>
            <p className="admin-card-subtitle">Slot usage in each parking area.</p>
          </div>
        </div>

        <div className="admin-areas-overview-grid">
          {orderedAreas.map((area) => {
            const areaSlots = slots.filter((s) => s.area_id === area.area_id);
            const areaTotal = areaSlots.length;
            const areaAvailable = areaSlots.filter((s) => s.status === 'Available').length;
            const areaOccupied = areaSlots.filter((s) => s.status === 'Occupied').length;
            const occupancyPct = areaTotal > 0 ? Math.round((areaOccupied / areaTotal) * 100) : 0;

            return (
              <div key={area.area_id} className="admin-area-overview-card">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-heading)] m-0">
                      {area.area_name}
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5 mb-0">
                      {area.location}
                    </p>
                  </div>
                  <span
                    className={`badge-status ${
                      area.status === 'Active' ? 'badge-available' : 'badge-neutral'
                    }`}
                  >
                    {area.status}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-[var(--text-heading)] tabular-nums">
                    Occupied: {areaOccupied} / {areaTotal} slots
                  </div>
                  <div
                    className="admin-progress-track"
                    role="progressbar"
                    aria-valuenow={areaOccupied}
                    aria-valuemin={0}
                    aria-valuemax={areaTotal}
                    aria-label={`${area.area_name} occupied slots`}
                  >
                    <div
                      className={`admin-progress-fill ${
                        occupancyPct >= 85
                          ? 'is-occupied'
                          : occupancyPct >= 50
                          ? 'is-booked'
                          : ''
                      }`}
                      style={{ width: `${occupancyPct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)] text-xs">
                  <span className="font-semibold text-[var(--status-available)] tabular-nums">
                    {areaAvailable} available
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('admin-slots')}
                    className="text-xs font-bold text-[var(--primary-forest)] hover:underline bg-transparent border-0 p-0 cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>View Slots</span>
                    <ArrowRight className="w-3 h-3" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Lower Section: Recent Payments Table Left + Three Small Status Cards Right */}
      <div className="admin-dashboard-lower-grid">
        <div className="admin-flat-table-wrap">
          <div className="admin-flat-table-titlebar">
            <div>
              <h2 className="admin-card-title">Recent Payments</h2>
              <p className="admin-card-subtitle">Latest recorded payment transactions.</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('admin-payments')}
              className="text-xs font-bold text-[var(--primary-forest)] hover:underline bg-transparent border-0 p-0 cursor-pointer inline-flex items-center gap-1"
            >
              <span>View All Payments</span>
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </button>
          </div>

          <div className="admin-table-scroll">
            <table className="admin-flat-table">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Booking ID</th>
                  <th>User</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.length > 0 ? (
                  recentPayments.map((p) => {
                    const booking = bookings.find((b) => b.booking_id === p.booking_id);
                    const customer = booking
                      ? users.find((u) => u.user_id === booking.user_id)
                      : null;

                    return (
                      <tr key={p.payment_id}>
                        <td className="font-bold text-[var(--text-heading)] tabular-nums">
                          #{p.payment_id}
                        </td>
                        <td className="font-semibold tabular-nums">#{p.booking_id}</td>
                        <td className="font-semibold text-[var(--text-heading)]">
                          {customer?.full_name || 'User'}
                        </td>
                        <td>{p.payment_method}</td>
                        <td className="font-bold text-[var(--primary-forest)] tabular-nums">
                          BDT {p.amount.toFixed(0)}
                        </td>
                        <td>
                          <span className={getPaymentBadgeClass(p.payment_status)}>
                            {p.payment_status}
                          </span>
                        </td>
                        <td className="text-[11px] text-[var(--text-muted)] whitespace-nowrap tabular-nums">
                          {p.payment_date}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center text-[var(--text-muted)] py-6">
                      No payments yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-status-cards-stack">
          <div className="admin-status-summary-card">
            <h3 className="admin-status-summary-title">Slot Status</h3>
            <div className="admin-status-summary-list">
              <div className="admin-status-summary-item">
                <span className="badge-status badge-available">Available</span>
                <span className="font-bold text-[var(--text-heading)] tabular-nums">
                  {availableSlots}
                </span>
              </div>
              <div className="admin-status-summary-item">
                <span className="badge-status badge-booked">Booked</span>
                <span className="font-bold text-[var(--text-heading)] tabular-nums">
                  {bookedSlots}
                </span>
              </div>
              <div className="admin-status-summary-item">
                <span className="badge-status badge-occupied">Occupied</span>
                <span className="font-bold text-[var(--text-heading)] tabular-nums">
                  {occupiedSlots}
                </span>
              </div>
            </div>
          </div>

          <div className="admin-status-summary-card">
            <h3 className="admin-status-summary-title">Booking Status</h3>
            <div className="admin-status-summary-list">
              <div className="admin-status-summary-item">
                <span className="badge-status badge-confirmed">Confirmed</span>
                <span className="font-bold text-[var(--text-heading)] tabular-nums">
                  {confirmedBookings}
                </span>
              </div>
              <div className="admin-status-summary-item">
                <span className="badge-status badge-completed">Completed</span>
                <span className="font-bold text-[var(--text-heading)] tabular-nums">
                  {completedBookings}
                </span>
              </div>
              <div className="admin-status-summary-item">
                <span className="badge-status badge-cancelled">Cancelled</span>
                <span className="font-bold text-[var(--text-heading)] tabular-nums">
                  {cancelledBookings}
                </span>
              </div>
            </div>
          </div>

          <div className="admin-status-summary-card">
            <h3 className="admin-status-summary-title">Payment Status</h3>
            <div className="admin-status-summary-list">
              <div className="admin-status-summary-item">
                <span className="badge-status badge-available">Paid</span>
                <span className="font-bold text-[var(--text-heading)] tabular-nums">
                  {paidPayments}
                </span>
              </div>
              <div className="admin-status-summary-item">
                <span className="badge-status badge-booked">Pending</span>
                <span className="font-bold text-[var(--text-heading)] tabular-nums">
                  {pendingPayments}
                </span>
              </div>
              <div className="admin-status-summary-item">
                <span className="badge-status badge-occupied">Failed</span>
                <span className="font-bold text-[var(--text-heading)] tabular-nums">
                  {failedPayments}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
