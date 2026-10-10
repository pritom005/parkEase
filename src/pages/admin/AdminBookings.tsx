import React, { useState, useEffect } from 'react';
import { mockDb, formatBangladeshDateTime, parseBangladeshDateTime } from '../../db/mockDb';
import { Booking, BillingDetails, PaymentMethod } from '../../types';
import {
  Calendar,
  Clock,
  Search,
  Filter,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Unlock,
  Radio,
  Car,
  Bike,
  LogIn,
  LogOut,
  Sparkles,
  X,
  CreditCard,
} from 'lucide-react';

interface AdminBookingsProps {
  initialBookingId?: number;
}

export const AdminBookings: React.FC<AdminBookingsProps> = ({ initialBookingId }) => {
  const [bookings, setBookings] = useState<Booking[]>(() => mockDb.getAllBookings());
  const [selectedBookingId, setSelectedBookingId] = useState<number>(initialBookingId || 1);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Confirmed' | 'Checked-In' | 'Completed' | 'Cancelled'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Check-Out Modal state
  const [adminCheckoutTarget, setAdminCheckoutTarget] = useState<Booking | null>(null);
  const [adminExitPreset, setAdminExitPreset] = useState<'ontime' | 'overtime20' | 'overtime65' | 'custom'>('ontime');
  const [adminExitTime, setAdminExitTime] = useState<string>('');
  const [adminBilling, setAdminBilling] = useState<BillingDetails | null>(null);

  const refreshList = () => {
    mockDb.processNoShowCancellations();
    setBookings(mockDb.getAllBookings());
  };

  useEffect(() => {
    if (initialBookingId) {
      setSelectedBookingId(initialBookingId);
    }
  }, [initialBookingId]);

  useEffect(() => {
    refreshList();
    const timer = setInterval(() => {
      refreshList();
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const filtered = bookings.filter((b) => {
    if (statusFilter !== 'All' && b.booking_status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = b.booking_code.toLowerCase().includes(q);
      const matchUser = b.user_name?.toLowerCase().includes(q);
      const matchPlate = b.vehicle_number?.toLowerCase().includes(q);
      if (!matchCode && !matchUser && !matchPlate) return false;
    }
    return true;
  });

  const selectedBooking = bookings.find((b) => b.booking_id === selectedBookingId) || filtered[0] || bookings[0];

  const handleCheckIn = (bookingId: number) => {
    const res = mockDb.checkInBooking(bookingId);
    if (res.success) {
      alert('Vehicle Arrival Recorded! Barrier cleared and bay occupancy marked as Checked-In.');
      refreshList();
    } else {
      alert(res.error || 'Failed to check in');
    }
  };

  const handleForceNoShowTest = (bookingId: number) => {
    if (confirm('Simulate 10-minute grace period expiry? This tests Rule 2: auto-cancelling the booking and releasing the slot back to the municipal pool.')) {
      const res = mockDb.forceNoShowExpiry(bookingId);
      if (res.success) {
        alert('Test complete: 10-minute grace period elapsed. Booking status is now "Cancelled due to no-show", and the bay has been released.');
        refreshList();
      } else {
        alert(res.error || 'Failed to trigger no-show');
      }
    }
  };

  const handleCancel = (bookingId: number) => {
    if (confirm('Are you sure you want to cancel this booking and release the bay back to public availability?')) {
      const res = mockDb.cancelBooking(bookingId, 1, true, 'Cancelled by municipal administrator');
      if (res.success) {
        alert('Booking cancelled and bay released.');
        refreshList();
      } else {
        alert(res.error || 'Failed to cancel');
      }
    }
  };

  const openAdminCheckoutModal = (booking: Booking) => {
    setAdminCheckoutTarget(booking);
    setAdminExitPreset('ontime');

    const startMs = parseBangladeshDateTime(booking.booking_date, booking.booking_time);
    const endMs = startMs + booking.duration_hours * 3600 * 1000;
    const defaultEndStr = formatBangladeshDateTime(new Date(endMs));
    setAdminExitTime(defaultEndStr);

    const billing = mockDb.calculateBilling(booking.booking_id, defaultEndStr);
    setAdminBilling(billing);
  };

  const handlePresetChange = (preset: 'ontime' | 'overtime20' | 'overtime65' | 'custom') => {
    if (!adminCheckoutTarget) return;
    setAdminExitPreset(preset);

    const startMs = parseBangladeshDateTime(adminCheckoutTarget.booking_date, adminCheckoutTarget.booking_time);
    const scheduledEndMs = startMs + adminCheckoutTarget.duration_hours * 3600 * 1000;

    let targetMs = scheduledEndMs;
    if (preset === 'ontime') {
      targetMs = scheduledEndMs;
    } else if (preset === 'overtime20') {
      targetMs = scheduledEndMs + 20 * 60 * 1000; // +20 min overtime -> 1 extra billable hr
    } else if (preset === 'overtime65') {
      targetMs = scheduledEndMs + 65 * 60 * 1000; // +1h 5m overtime -> 2 extra billable hrs
    } else if (preset === 'custom') {
      targetMs = Date.now();
    }

    const newExitStr = formatBangladeshDateTime(new Date(targetMs));
    setAdminExitTime(newExitStr);

    const billing = mockDb.calculateBilling(adminCheckoutTarget.booking_id, newExitStr);
    setAdminBilling(billing);
  };

  const handleConfirmAdminCheckout = () => {
    if (!adminCheckoutTarget) return;
    const res = mockDb.checkOutBooking(adminCheckoutTarget.booking_id, adminExitTime, 'bKash');
    if (res.success) {
      alert(`Vehicle check-out recorded! Bay ${adminCheckoutTarget.slot_number} has been released. Total tariff: ৳${res.booking?.price_total} (${res.booking?.billable_hours} billable hours).`);
      setAdminCheckoutTarget(null);
      refreshList();
    } else {
      alert(res.error || 'Failed to complete checkout');
    }
  };

  const handleOverrideGate = () => {
    if (!selectedBooking) return;
    alert(`COMMAND TRANSMITTED: Barrier at ${selectedBooking.area_name} manually lifted for vehicle ${selectedBooking.vehicle_number}.`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-[#455549] mb-1">
          <span>MUNICIPAL CONTROL ROOM</span>
          <span>/</span>
          <span>CHATTOGRAM METROPOLITAN</span>
          <span>/</span>
          <span className="text-[#1b5e3b] font-bold">BOOKING DISPATCH & ARCHIVE</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#16261d] tracking-tight">
          Municipal Booking Dispatch & Reservation Control
        </h1>
        <p className="text-xs text-[#455549] mt-1">
          Authoritative rate enforcement (Car: BDT 250/hr, Bike: BDT 100/hr), automated 10-minute no-show cancellations, and overtime reconciliation across CCC hubs.
        </p>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="neu-raised p-5 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block mb-1">ACTIVE / PARKED BAYS</span>
          <h3 className="text-3xl font-bold text-[#16261d] font-mono">
            {bookings.filter((b) => b.booking_status === 'Checked-In').length} Parked
          </h3>
          <span className="text-[11px] text-[#455549] block mt-1">
            {bookings.filter((b) => b.booking_status === 'Confirmed').length} Confirmed (En Route)
          </span>
          <span className="text-[10px] text-[#1b5e3b] font-semibold block mt-2">Occupancy Sensor Feed Live</span>
        </div>

        <div className="neu-raised p-5 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block mb-1">TOTAL BOOKINGS</span>
          <h3 className="text-3xl font-bold text-[#16261d] font-mono">{bookings.length} Bookings</h3>
          <span className="text-[11px] text-[#1b5e3b] font-semibold block mt-1">
            Car: ৳250/hr • Bike: ৳100/hr
          </span>
          <span className="text-[10px] text-[#455549] block mt-2">Authoritative Tariff Table</span>
        </div>

        <div className="neu-raised p-5 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block mb-1">10-MIN GRACE MONITORING</span>
          <h3 className="text-3xl font-bold text-amber-700 font-mono">
            {bookings.filter((b) => b.booking_status === 'Confirmed').length} Monitored
          </h3>
          <span className="text-[11px] text-amber-800 font-bold block mt-1">
            Auto-cancel after 10 mins
          </span>
          <span className="text-[10px] text-red-700 font-semibold block mt-2">
            {bookings.filter((b) => b.is_no_show).length} No-Show Cancellations YTD
          </span>
        </div>

        <div className="neu-raised p-5 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block mb-1">TOTAL REVENUE (RECONCILED)</span>
          <h3 className="text-3xl font-bold text-[#1b5e3b] font-mono">
            ৳{bookings.reduce((sum, b) => (b.payment_status === 'Paid' ? sum + b.price_total : sum), 0)}
          </h3>
          <span className="text-[11px] text-[#16261d] block mt-1">Includes Base + Overtime Settled</span>
          <span className="text-[10px] text-[#1b5e3b] font-semibold block mt-2">Reconciled with NBR Node</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {(['All', 'Confirmed', 'Checked-In', 'Completed', 'Cancelled'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === status
                  ? 'bg-[#1b5e3b] text-white shadow-xs'
                  : 'neu-btn-secondary text-[#16261d]'
              }`}
            >
              {status === 'All' ? `All Bookings (${bookings.length})` : status}
            </button>
          ))}
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search booking ID, citizen, plate..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-2 pl-8 rounded-lg text-xs neu-input w-64"
          />
          <Search className="w-3.5 h-3.5 text-[#455549] absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Grid: Table on Left, Live Inspector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Table (8 cols) */}
        <div className="lg:col-span-8 neu-raised p-6 rounded-xl border border-[#cfd9d1] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#16261d]">Active Reservations Queue</h3>
            <span className="text-[10px] font-mono text-[#1b5e3b] font-bold flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 animate-pulse" /> Live Stream
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#cfd9d1] text-[#455549] uppercase font-mono text-[10px]">
                  <th className="py-2.5 px-3">Booking ID & Time</th>
                  <th className="py-2.5 px-3">Citizen & Permit</th>
                  <th className="py-2.5 px-3">Vehicle & Tariff</th>
                  <th className="py-2.5 px-3">Hub & Bay</th>
                  <th className="py-2.5 px-3">Tariff & Hours</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#cfd9d1]/60">
                {filtered.map((b) => {
                  const isSelected = selectedBooking?.booking_id === b.booking_id;
                  const hourlyRate = b.hourly_rate || (b.vehicle_type === 'Motorcycle' ? 100 : 250);
                  const isNoShow = b.is_no_show || b.cancellation_reason?.toLowerCase().includes('no-show');

                  return (
                    <tr
                      key={b.booking_id}
                      onClick={() => setSelectedBookingId(b.booking_id)}
                      className={`cursor-pointer transition ${
                        isSelected ? 'bg-[#dcefe3]/60' : 'hover:bg-[#dee4df]/50'
                      }`}
                    >
                      <td className="py-3 px-3">
                        <strong className="font-mono text-[#1b5e3b] block">{b.booking_code}</strong>
                        <span className="text-[10px] text-[#455549]">{b.booking_date} {b.booking_time}</span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-semibold text-[#16261d] block">{b.user_name}</span>
                        <span className="text-[10px] text-[#455549] font-mono">{b.user_phone}</span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          {b.vehicle_type === 'Motorcycle' ? (
                            <Bike className="w-3.5 h-3.5 text-[#1b5e3b]" />
                          ) : (
                            <Car className="w-3.5 h-3.5 text-[#1b5e3b]" />
                          )}
                          <strong className="font-mono text-[#16261d]">{b.vehicle_number}</strong>
                        </div>
                        <span className="text-[10px] text-[#1b5e3b] font-mono block">
                          ৳{hourlyRate}/hr ({b.vehicle_type || 'Car'})
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-[#16261d] font-medium block">{b.area_name}</span>
                        <span className="text-[10px] font-mono text-[#1b5e3b] font-bold">Bay {b.slot_number}</span>
                      </td>

                      <td className="py-3 px-3">
                        <strong className="font-mono font-bold text-[#16261d] block">৳{b.price_total}</strong>
                        <span className="text-[10px] text-[#455549] block">
                          {b.billable_hours || b.duration_hours} billable hrs
                        </span>
                        {b.extra_amount && b.extra_amount > 0 ? (
                          <span className="text-[9px] text-amber-800 font-mono block">
                            (+৳{b.extra_amount} OT)
                          </span>
                        ) : null}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border inline-block ${
                            b.booking_status === 'Checked-In'
                              ? 'bg-[#dcefe3] text-[#1b5e3b] border-[#1b5e3b]'
                              : b.booking_status === 'Confirmed'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : b.booking_status === 'Completed'
                              ? 'bg-[#eff5f0] text-[#16261d] border-[#6b8273]'
                              : isNoShow
                              ? 'bg-red-100 text-red-800 border-red-300 font-bold'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {isNoShow ? 'Cancelled due to no-show' : b.booking_status}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right space-x-1 whitespace-nowrap">
                        {b.booking_status === 'Confirmed' && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCheckIn(b.booking_id);
                              }}
                              className="bg-[#1b5e3b] text-white hover:bg-[#14472c] px-2 py-1 rounded text-xs font-semibold"
                            >
                              Check In
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancel(b.booking_id);
                              }}
                              className="text-red-700 hover:bg-red-50 px-2 py-1 rounded text-xs font-semibold border border-red-200"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {b.booking_status === 'Checked-In' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openAdminCheckoutModal(b);
                            }}
                            className="bg-[#1b5e3b] text-white hover:bg-[#14472c] px-2 py-1 rounded text-xs font-semibold"
                          >
                            Check Out
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Booking Live Inspector (4 cols) */}
        {selectedBooking && (
          <div className="lg:col-span-4 neu-raised p-6 rounded-xl border border-[#cfd9d1] space-y-4 sticky top-24">
            <div className="flex items-center justify-between border-b border-[#cfd9d1] pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#455549] block">
                  SELECTED BOOKING LIVE INSPECTOR
                </span>
                <h3 className="text-base font-bold text-[#16261d]">
                  #{selectedBooking.booking_code}
                </h3>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  selectedBooking.booking_status === 'Checked-In'
                    ? 'bg-[#dcefe3] text-[#1b5e3b] border border-[#1b5e3b]'
                    : selectedBooking.booking_status === 'Confirmed'
                    ? 'bg-blue-100 text-blue-800'
                    : selectedBooking.is_no_show || selectedBooking.cancellation_reason?.includes('no-show')
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {selectedBooking.is_no_show ? 'No-Show Cancelled' : selectedBooking.booking_status}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-white rounded-lg border border-[#cfd9d1]">
                <span className="text-[10px] text-[#455549] uppercase font-semibold block">Citizen & Permit</span>
                <strong className="text-sm text-[#16261d] block">{selectedBooking.user_name}</strong>
                <span className="text-[11px] text-[#455549]">Phone: {selectedBooking.user_phone}</span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-[#cfd9d1]">
                <span className="text-[10px] text-[#455549] uppercase font-semibold block">Assigned Slot & Tariff</span>
                <div className="flex justify-between items-center">
                  <strong className="text-sm font-mono text-[#1b5e3b]">
                    Bay {selectedBooking.slot_number} ({selectedBooking.vehicle_type})
                  </strong>
                  <span className="text-xs font-mono font-bold bg-[#eff5f0] text-[#1b5e3b] px-2 py-0.5 rounded border border-[#cfd9d1]">
                    ৳{selectedBooking.hourly_rate || (selectedBooking.vehicle_type === 'Motorcycle' ? 100 : 250)}/hr
                  </span>
                </div>
                <span className="text-[11px] text-[#16261d] block mt-1">{selectedBooking.area_name}</span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-[#cfd9d1]">
                <span className="text-[10px] text-[#455549] uppercase font-semibold block">Vehicle Telemetry</span>
                <strong className="text-sm font-mono text-[#16261d] block">{selectedBooking.vehicle_number}</strong>
                <span className="text-[11px] text-[#455549]">{selectedBooking.vehicle_model}</span>
              </div>

              {/* Schedule and Timestamps */}
              <div className="p-3 bg-white rounded-lg border border-[#cfd9d1] space-y-1 font-mono text-[11px]">
                <span className="text-[10px] text-[#455549] uppercase font-semibold block font-sans">
                  Timestamps & Duration
                </span>
                <div className="flex justify-between">
                  <span>Scheduled Window:</span>
                  <strong className="text-[#16261d]">
                    {selectedBooking.booking_date} {selectedBooking.booking_time} ({selectedBooking.duration_hours}h)
                  </strong>
                </div>
                {selectedBooking.check_in_time && (
                  <div className="flex justify-between text-[#1b5e3b]">
                    <span>Actual Arrival:</span>
                    <strong>{selectedBooking.check_in_time}</strong>
                  </div>
                )}
                {selectedBooking.check_out_time && (
                  <div className="flex justify-between text-[#455549]">
                    <span>Actual Exit:</span>
                    <strong>{selectedBooking.check_out_time}</strong>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-[#cfd9d1]">
                  <span>Total Billable Hours:</span>
                  <strong className="text-[#1b5e3b]">
                    {selectedBooking.billable_hours || selectedBooking.duration_hours} Hours
                  </strong>
                </div>
              </div>

              {/* 10-Minute Grace Window Box */}
              <div className="p-3 bg-[#eff5f0] rounded-lg border border-[#cfd9d1] space-y-1.5">
                <span className="text-[10px] font-mono text-[#1b5e3b] font-bold uppercase block flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  10-MINUTE ARRIVAL GRACE STATUS
                </span>

                {selectedBooking.booking_status === 'Confirmed' && (
                  <div className="space-y-1 font-mono text-xs">
                    <div className="flex justify-between">
                      <span>Arrival Rule:</span>
                      <strong className="text-amber-800">10 mins from start time</strong>
                    </div>
                    <p className="text-[10px] text-[#455549] font-sans">
                      If unarrived past 10-minute window, system automatically cancels booking as "Cancelled due to no-show" and releases Bay {selectedBooking.slot_number}.
                    </p>
                    <div className="pt-2 flex gap-2">
                      <button
                        onClick={() => handleCheckIn(selectedBooking.booking_id)}
                        className="flex-1 py-1.5 bg-[#1b5e3b] text-white rounded text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-[#14472c]"
                      >
                        <LogIn className="w-3 h-3" />
                        <span>Record Arrival</span>
                      </button>
                      <button
                        onClick={() => handleForceNoShowTest(selectedBooking.booking_id)}
                        className="py-1.5 px-2 bg-amber-50 text-amber-800 border border-amber-300 rounded text-[11px] font-bold hover:bg-amber-100"
                        title="Simulate 10m grace period expiry"
                      >
                        <span>Test No-Show</span>
                      </button>
                    </div>
                  </div>
                )}

                {selectedBooking.booking_status === 'Checked-In' && (
                  <div className="text-xs space-y-1 font-mono">
                    <span className="text-[#1b5e3b] font-bold block">
                      ✓ Arrival Cleared within Grace Period
                    </span>
                    <p className="text-[10px] text-[#455549] font-sans">
                      Vehicle verified inside bay. ANPR optical barrier cleared. Ready for exit billing calculation.
                    </p>
                    <button
                      onClick={() => openAdminCheckoutModal(selectedBooking)}
                      className="w-full mt-1 py-1.5 bg-[#1b5e3b] text-white rounded text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-[#14472c]"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Process Exit & Settle Bill</span>
                    </button>
                  </div>
                )}

                {selectedBooking.booking_status === 'Cancelled' && (
                  <div className="text-xs space-y-1">
                    <strong className="text-red-700 block">
                      Status: {selectedBooking.cancellation_reason || 'Cancelled due to no-show'}
                    </strong>
                    <p className="text-[10px] text-[#455549]">
                      Bay {selectedBooking.slot_number} was automatically released back to public municipal pool.
                    </p>
                  </div>
                )}

                {selectedBooking.booking_status === 'Completed' && (
                  <div className="text-xs space-y-1 font-mono">
                    <span className="text-[#1b5e3b] font-bold block">
                      ✓ Parking Completed & Settled
                    </span>
                    <div className="flex justify-between text-[11px]">
                      <span>Final Settled Charge:</span>
                      <strong className="text-[#16261d]">৳{selectedBooking.price_total}.00</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#cfd9d1]">
              <button
                onClick={handleOverrideGate}
                className="w-full neu-btn-primary py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
              >
                <Unlock className="w-4 h-4" />
                <span>Manual Gate Barrier Clearance Override</span>
              </button>

              {selectedBooking.booking_status === 'Confirmed' && (
                <button
                  onClick={() => handleCancel(selectedBooking.booking_id)}
                  className="w-full py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Force Release Bay & Cancel Booking</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Admin Check-Out & Final Billing Modal */}
      {adminCheckoutTarget && adminBilling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-[#6b8273]/30 overflow-hidden text-[#16261d]">
            <div className="p-4 bg-[#1b5e3b] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LogOut className="w-5 h-5 text-white" />
                <div>
                  <h2 className="font-bold text-sm">Control Room: Process Bay Exit & Tariff Reconciliation</h2>
                  <p className="text-[10px] text-white/80">
                    Permit #{adminCheckoutTarget.booking_code} • {adminCheckoutTarget.vehicle_number}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAdminCheckoutTarget(null)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-sans">
              <div className="p-3 bg-[#eff5f0] rounded-lg border border-[#cfd9d1] space-y-2">
                <span className="text-[11px] font-bold text-[#16261d] uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#1b5e3b]" />
                  Simulate Actual Exit Time / Parking Duration:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handlePresetChange('ontime')}
                    className={`p-2 rounded text-left border text-[11px] transition ${
                      adminExitPreset === 'ontime'
                        ? 'border-[#1b5e3b] bg-white font-bold text-[#1b5e3b] shadow-xs'
                        : 'border-[#cfd9d1] bg-[#dee4df]/50 text-[#16261d]'
                    }`}
                  >
                    <span className="block font-semibold">On-Time</span>
                    <span className="text-[9px] text-[#455549] block">No extra hours</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePresetChange('overtime20')}
                    className={`p-2 rounded text-left border text-[11px] transition ${
                      adminExitPreset === 'overtime20'
                        ? 'border-[#1b5e3b] bg-white font-bold text-[#1b5e3b] shadow-xs'
                        : 'border-[#cfd9d1] bg-[#dee4df]/50 text-[#16261d]'
                    }`}
                  >
                    <span className="block font-semibold">+20 mins</span>
                    <span className="text-[9px] text-[#455549] block">+1 billable hr</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePresetChange('overtime65')}
                    className={`p-2 rounded text-left border text-[11px] transition ${
                      adminExitPreset === 'overtime65'
                        ? 'border-[#1b5e3b] bg-white font-bold text-[#1b5e3b] shadow-xs'
                        : 'border-[#cfd9d1] bg-[#dee4df]/50 text-[#16261d]'
                    }`}
                  >
                    <span className="block font-semibold">+1h 5m</span>
                    <span className="text-[9px] text-[#455549] block">+2 billable hrs</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePresetChange('custom')}
                    className={`p-2 rounded text-left border text-[11px] transition ${
                      adminExitPreset === 'custom'
                        ? 'border-[#1b5e3b] bg-white font-bold text-[#1b5e3b] shadow-xs'
                        : 'border-[#cfd9d1] bg-[#dee4df]/50 text-[#16261d]'
                    }`}
                  >
                    <span className="block font-semibold">Live BST</span>
                    <span className="text-[9px] text-[#455549] block">Current time</span>
                  </button>
                </div>
              </div>

              <div className="p-4 bg-white rounded-lg border border-[#cfd9d1] space-y-2 font-mono text-xs">
                <div className="flex justify-between items-center text-[11px] border-b border-[#cfd9d1] pb-2">
                  <span>Tariff Policy:</span>
                  <strong className="text-[#1b5e3b]">
                    {adminBilling.vehicle_type} @ ৳{adminBilling.hourly_rate}/hour
                  </strong>
                </div>

                <div className="flex justify-between text-[#455549]">
                  <span>Booked Hours:</span>
                  <span>{adminBilling.booked_hours} Hours</span>
                </div>
                <div className="flex justify-between text-[#455549]">
                  <span>Overtime Duration:</span>
                  <span className={adminBilling.overtime_minutes > 0 ? 'text-amber-800 font-bold' : ''}>
                    {adminBilling.overtime_minutes > 0
                      ? `${adminBilling.overtime_minutes} mins (+${adminBilling.overtime_hours} hr ceil)`
                      : 'None'}
                  </span>
                </div>
                <div className="flex justify-between text-[#16261d] font-bold pt-1 border-t border-[#cfd9d1]">
                  <span>Total Billable Hours:</span>
                  <span className="text-[#1b5e3b]">{adminBilling.billable_hours} Hours</span>
                </div>

                <div className="flex justify-between text-[#455549] pt-2 border-t border-dashed border-[#cfd9d1]">
                  <span>Already Paid (Original):</span>
                  <span>৳{adminBilling.paid_amount}.00</span>
                </div>
                {adminBilling.outstanding_amount > 0 && (
                  <div className="flex justify-between text-amber-800 font-bold">
                    <span>Outstanding Overtime Charge:</span>
                    <span>+৳{adminBilling.outstanding_amount}.00</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-[#16261d] pt-1 border-t border-[#cfd9d1]">
                  <span>Total Final Charge:</span>
                  <span className="text-[#1b5e3b]">৳{adminBilling.total_charge}.00</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#dee4df] border-t border-[#cfd9d1] flex justify-between items-center">
              <button
                type="button"
                onClick={() => setAdminCheckoutTarget(null)}
                className="neu-btn-secondary px-4 py-2 rounded text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAdminCheckout}
                className="neu-btn-primary px-5 py-2 rounded text-xs font-bold flex items-center gap-1.5 bg-[#1b5e3b] text-white"
              >
                <LogOut className="w-4 h-4" />
                <span>
                  Confirm Bay Exit & Release Slot {adminBilling.outstanding_amount > 0 ? `(৳${adminBilling.outstanding_amount} extra)` : ''}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
