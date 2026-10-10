import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mockDb, formatBangladeshDateTime, parseBangladeshDateTime } from '../../db/mockDb';
import { Booking, BillingDetails, PaymentMethod } from '../../types';
import {
  FileText,
  Search,
  Filter,
  Download,
  RotateCcw,
  QrCode,
  ShieldCheck,
  Calendar,
  Clock,
  Car,
  Bike,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  LogIn,
  LogOut,
  ArrowRight,
  CreditCard,
  X,
  Sparkles,
} from 'lucide-react';

interface Props {
  onNavigate: (view: string, extra?: any) => void;
  onViewReceipt: (bookingId: number) => void;
}

export const UserHistory: React.FC<Props> = ({ onNavigate, onViewReceipt }) => {
  const { currentUser } = useAuth();
  const userId = currentUser?.user_id || 2;
  const [bookings, setBookings] = useState<Booking[]>(() => mockDb.getBookingsByUser(userId));
  const [statusFilter, setStatusFilter] = useState<'All' | 'Confirmed' | 'Checked-In' | 'Completed' | 'Cancelled'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Check-out modal state
  const [checkoutTarget, setCheckoutTarget] = useState<Booking | null>(null);
  const [selectedExitPreset, setSelectedExitPreset] = useState<'ontime' | 'overtime20' | 'overtime65' | 'custom'>('ontime');
  const [customExitTime, setCustomExitTime] = useState<string>('');
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<PaymentMethod>('bKash');
  const [checkoutBilling, setCheckoutBilling] = useState<BillingDetails | null>(null);

  const refreshList = () => {
    mockDb.processNoShowCancellations();
    setBookings(mockDb.getBookingsByUser(userId));
  };

  useEffect(() => {
    refreshList();
    const timer = setInterval(() => {
      refreshList();
    }, 4000);
    return () => clearInterval(timer);
  }, [userId]);

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter !== 'All' && b.booking_status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = b.booking_code.toLowerCase().includes(q);
      const matchPlate = b.vehicle_number?.toLowerCase().includes(q);
      const matchHub = b.area_name?.toLowerCase().includes(q);
      const matchSlot = b.slot_number?.toLowerCase().includes(q);
      if (!matchCode && !matchPlate && !matchHub && !matchSlot) return false;
    }
    return true;
  });

  const handleCheckIn = (bookingId: number) => {
    const res = mockDb.checkInBooking(bookingId);
    if (res.success) {
      alert('Arrival Confirmed! Vehicle has entered the parking bay. Status is now Checked-In.');
      refreshList();
    } else {
      alert(res.error || 'Failed to check in');
    }
  };

  const handleForceNoShowTest = (bookingId: number) => {
    if (confirm('Simulate 10-minute grace period expiry? This will test Rule 2: auto-cancelling the booking and releasing the slot back to public availability.')) {
      const res = mockDb.forceNoShowExpiry(bookingId);
      if (res.success) {
        alert('Test complete: 10-minute grace period elapsed. Booking status is now "Cancelled due to no-show", and the bay has been released.');
        refreshList();
      } else {
        alert(res.error || 'Failed to test no-show expiry');
      }
    }
  };

  const handleCancelBooking = (bookingId: number) => {
    if (confirm('Are you sure you want to cancel this booking? The slot will be released back to the municipal pool.')) {
      const res = mockDb.cancelBooking(bookingId, userId, false, 'Cancelled by user');
      if (res.success) {
        alert('Booking cancelled successfully and slot released.');
        refreshList();
      } else {
        alert(res.error || 'Failed to cancel');
      }
    }
  };

  // Open Check-Out Modal
  const openCheckoutModal = (booking: Booking) => {
    setCheckoutTarget(booking);
    setSelectedExitPreset('ontime');
    // Calculate default exit time (on-time: scheduled start + duration hours)
    const startMs = parseBangladeshDateTime(booking.booking_date, booking.booking_time);
    const endMs = startMs + booking.duration_hours * 3600 * 1000;
    const defaultEndStr = formatBangladeshDateTime(new Date(endMs));
    setCustomExitTime(defaultEndStr);

    const billing = mockDb.calculateBilling(booking.booking_id, defaultEndStr);
    setCheckoutBilling(billing);
  };

  const handlePresetChange = (preset: 'ontime' | 'overtime20' | 'overtime65' | 'custom') => {
    if (!checkoutTarget) return;
    setSelectedExitPreset(preset);

    const startMs = parseBangladeshDateTime(checkoutTarget.booking_date, checkoutTarget.booking_time);
    const scheduledEndMs = startMs + checkoutTarget.duration_hours * 3600 * 1000;

    let targetMs = scheduledEndMs;
    if (preset === 'ontime') {
      targetMs = scheduledEndMs;
    } else if (preset === 'overtime20') {
      targetMs = scheduledEndMs + 20 * 60 * 1000; // 20 mins overtime -> 1 extra billable hour
    } else if (preset === 'overtime65') {
      targetMs = scheduledEndMs + 65 * 60 * 1000; // 1 hr 5 mins overtime -> 2 extra billable hours
    } else if (preset === 'custom') {
      targetMs = Date.now();
    }

    const newExitStr = formatBangladeshDateTime(new Date(targetMs));
    setCustomExitTime(newExitStr);

    const billing = mockDb.calculateBilling(checkoutTarget.booking_id, newExitStr);
    setCheckoutBilling(billing);
  };

  const handleConfirmCheckout = () => {
    if (!checkoutTarget) return;
    const res = mockDb.checkOutBooking(checkoutTarget.booking_id, customExitTime, checkoutPaymentMethod);
    if (res.success) {
      alert(`Check-out confirmed! Bay ${checkoutTarget.slot_number} has been released. Total billed: ৳${res.booking?.price_total} (${res.booking?.billable_hours} billable hours).`);
      setCheckoutTarget(null);
      refreshList();
    } else {
      alert(res.error || 'Failed to complete checkout');
    }
  };

  const totalExpenditure = bookings
    .filter((b) => b.payment_status === 'Paid')
    .reduce((sum, b) => sum + b.price_total, 0);

  const activeBooking = bookings.find((b) => b.booking_status === 'Confirmed' || b.booking_status === 'Checked-In');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-[#455549] mb-1">
          <span>PARKEASE PORTAL</span>
          <span>&gt;</span>
          <span>AUDIT & RECORDS</span>
          <span>&gt;</span>
          <span className="text-[#1b5e3b] font-bold">RESERVATION HISTORY</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#16261d] tracking-tight">
              Booking History & Permit Archive
            </h1>
            <p className="text-xs text-[#455549] mt-1">
              Hourly parking rates (Car: BDT 250/hr, Motorcycle: BDT 100/hr), 10-minute arrival grace monitoring, and exit tariff reconciliation.
            </p>
          </div>
          <button
            onClick={() => alert('Exporting user audit ledger to CSV format...')}
            className="neu-btn-secondary px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export History (CSV/PDF)</span>
          </button>
        </div>
      </div>

      {/* Top 3 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="neu-raised p-5 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block mb-1">TOTAL USER RESERVATIONS</span>
          <h3 className="text-2xl font-bold text-[#16261d]">{bookings.length} Bookings</h3>
          <p className="text-xs text-[#455549] mt-1">
            {bookings.filter((b) => b.booking_status === 'Completed').length} Completed •{' '}
            {bookings.filter((b) => b.booking_status === 'Confirmed' || b.booking_status === 'Checked-In').length} Active •{' '}
            {bookings.filter((b) => b.booking_status === 'Cancelled').length} Cancelled
          </p>
          <span className="text-[10px] text-[#1b5e3b] font-semibold mt-3 block">
            Automated ANPR & Gate Integration
          </span>
        </div>

        <div className="neu-raised p-5 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block mb-1">TOTAL EXPENDITURE</span>
          <h3 className="text-2xl font-bold text-[#16261d]">{totalExpenditure} BDT</h3>
          <p className="text-xs text-[#455549] mt-1">Car: 250 BDT/hr • Bike: 100 BDT/hr</p>
          <span className="text-[10px] text-[#1b5e3b] font-semibold mt-3 block">
            NBR Verified Taxpayer TIN: 4491-09
          </span>
        </div>

        <div className="neu-raised p-5 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block mb-1">OFFICIAL TARIFF RATES</span>
          <div className="flex items-center gap-4 mt-1">
            <div>
              <span className="text-[10px] text-[#455549] block">CAR RATE:</span>
              <strong className="text-base text-[#1b5e3b] font-mono">250 BDT/hr</strong>
            </div>
            <div className="border-l border-[#cfd9d1] pl-4">
              <span className="text-[10px] text-[#455549] block">BIKE RATE:</span>
              <strong className="text-base text-[#1b5e3b] font-mono">100 BDT/hr</strong>
            </div>
          </div>
          <span className="text-[10px] text-[#455549] font-semibold mt-2 block">
            10-Minute Arrival Grace Period
          </span>
        </div>
      </div>

      {/* Active Session Card if available */}
      {activeBooking && (
        <div className="neu-raised p-5 rounded-xl border-2 border-[#1b5e3b] bg-[#eff5f0] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-[#1b5e3b] text-white flex flex-col items-center justify-center font-mono">
              <span className="text-xs font-bold">{activeBooking.slot_number}</span>
              <span className="text-[8px] uppercase">
                {activeBooking.booking_status === 'Checked-In' ? 'IN-BAY' : 'HELD'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#16261d]">
                  Active Session #{activeBooking.booking_code}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                    activeBooking.booking_status === 'Checked-In'
                      ? 'bg-[#dcefe3] text-[#1b5e3b] border-[#1b5e3b]'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}
                >
                  {activeBooking.booking_status}
                </span>
                <span className="text-[10px] font-mono text-[#455549] bg-white px-2 py-0.5 rounded border border-[#cfd9d1]">
                  {activeBooking.vehicle_type === 'Car' ? 'Car (৳250/hr)' : 'Bike (৳100/hr)'}
                </span>
              </div>
              <p className="text-xs text-[#455549] mt-0.5">
                {activeBooking.area_name} • Vehicle: {activeBooking.vehicle_number} ({activeBooking.vehicle_model})
              </p>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#16261d] font-mono mt-1">
                <span>Start: {activeBooking.booking_time} BST</span>
                {activeBooking.check_in_time ? (
                  <span className="text-[#1b5e3b] font-bold">
                    ✓ Checked-In: {activeBooking.check_in_time}
                  </span>
                ) : (
                  <span className="text-amber-800 font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    10-min arrival grace window active
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeBooking.booking_status === 'Confirmed' && (
              <>
                <button
                  onClick={() => handleCheckIn(activeBooking.booking_id)}
                  className="neu-btn-primary px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-[#1b5e3b] text-white"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Check In / Record Arrival</span>
                </button>
                <button
                  onClick={() => handleForceNoShowTest(activeBooking.booking_id)}
                  className="px-2.5 py-2 rounded-lg text-xs font-semibold border border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100 flex items-center gap-1"
                  title="Simulate 10-minute grace elapsed to test automatic cancellation"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  <span>Test 10m No-Show</span>
                </button>
              </>
            )}

            {activeBooking.booking_status === 'Checked-In' && (
              <button
                onClick={() => openCheckoutModal(activeBooking)}
                className="neu-btn-primary px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-[#1b5e3b] text-white"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Check Out & Settle Tariff</span>
              </button>
            )}

            <button
              onClick={() => onNavigate('user-confirmation', { booking: activeBooking })}
              className="neu-btn-secondary px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Pass</span>
            </button>

            {activeBooking.booking_status === 'Confirmed' && (
              <button
                onClick={() => handleCancelBooking(activeBooking.booking_id)}
                className="text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 border border-red-200"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>
      )}

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
              {status === 'All' ? 'All Bookings' : status}
            </button>
          ))}
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search by ID, bay, plate..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-2 pl-8 rounded-lg text-xs neu-input w-64"
          />
          <Search className="w-3.5 h-3.5 text-[#455549] absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Municipal Audit Ledger Table */}
      <div className="neu-raised p-6 rounded-xl border border-[#cfd9d1] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#16261d]">Municipal Audit Ledger</h2>
            <p className="text-xs text-[#455549]">Standardized fiscal records and ANPR gate passages.</p>
          </div>
          <span className="text-[11px] font-mono text-[#1b5e3b] font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> ANPR Automated Verification Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#cfd9d1] text-[#455549] uppercase font-mono text-[10px]">
                <th className="py-2.5 px-3">Permit ID & Facility</th>
                <th className="py-2.5 px-3">Vehicle & Tariff Rate</th>
                <th className="py-2.5 px-3">Schedule & Timestamps</th>
                <th className="py-2.5 px-3">Duration & Billable Hours</th>
                <th className="py-2.5 px-3">Settlement</th>
                <th className="py-2.5 px-3">Status & Cancellation Reason</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#cfd9d1]/60">
              {filteredBookings.map((b) => {
                const hourlyRate = b.hourly_rate || (b.vehicle_type === 'Motorcycle' ? 100 : 250);
                const isNoShow = b.is_no_show || b.cancellation_reason?.toLowerCase().includes('no-show');

                return (
                  <tr key={b.booking_id} className="hover:bg-[#dee4df]/50 transition">
                    <td className="py-3 px-3">
                      <strong className="font-mono text-[#1b5e3b] block">{b.booking_code}</strong>
                      <span className="text-[#16261d] font-medium block">{b.area_name}</span>
                      <span className="text-[10px] text-[#455549] font-mono">Bay {b.slot_number}</span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        {b.vehicle_type === 'Motorcycle' ? (
                          <Bike className="w-3.5 h-3.5 text-[#1b5e3b]" />
                        ) : (
                          <Car className="w-3.5 h-3.5 text-[#1b5e3b]" />
                        )}
                        <strong className="font-mono text-[#16261d]">{b.vehicle_number}</strong>
                      </div>
                      <span className="text-[#455549] block text-[11px]">{b.vehicle_model}</span>
                      <span className="text-[10px] font-mono text-[#1b5e3b] font-semibold block">
                        ৳{hourlyRate}/hr ({b.vehicle_type || 'Car'})
                      </span>
                    </td>

                    <td className="py-3 px-3 text-[#455549]">
                      <div className="font-semibold text-[#16261d]">{b.booking_date}</div>
                      <div>Scheduled: {b.booking_time} BST</div>
                      {b.check_in_time && (
                        <div className="text-[#1b5e3b] font-mono text-[10px]">
                          In: {b.check_in_time.split(' ')[1] || b.check_in_time}
                        </div>
                      )}
                      {b.check_out_time && (
                        <div className="text-[#455549] font-mono text-[10px]">
                          Out: {b.check_out_time.split(' ')[1] || b.check_out_time}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 text-[#16261d]">
                      <div>Booked: {b.duration_hours} hrs</div>
                      <div className="font-bold text-[#1b5e3b] font-mono">
                        Billable: {b.billable_hours || b.duration_hours} hrs
                      </div>
                      {b.extra_amount && b.extra_amount > 0 ? (
                        <span className="text-[10px] text-amber-800 font-semibold block">
                          Overtime: +৳{b.extra_amount}
                        </span>
                      ) : null}
                    </td>

                    <td className="py-3 px-3">
                      <strong className="font-mono text-[#16261d] block text-sm">৳{b.price_total}</strong>
                      <span className="text-[10px] text-[#1b5e3b] font-medium block">
                        {b.payment_status === 'Paid' ? 'Paid via bKash/MFS' : 'Pending Payment'}
                      </span>
                      {b.extra_amount && b.extra_amount > 0 ? (
                        <span className="text-[9px] text-[#455549] font-mono block">
                          (Base: ৳{b.original_amount || (b.duration_hours * hourlyRate)} + Extra: ৳{b.extra_amount})
                        </span>
                      ) : null}
                    </td>

                    <td className="py-3 px-3">
                      <div className="space-y-1">
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
                        {b.booking_status === 'Cancelled' && (
                          <span className="text-[10px] text-red-700 block font-medium">
                            Reason: {b.cancellation_reason || (isNoShow ? 'Cancelled due to no-show' : 'Cancelled')}
                          </span>
                        )}
                        {b.booking_status === 'Confirmed' && (
                          <span className="text-[10px] text-amber-800 font-mono block">
                            10m grace period active
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                      {b.booking_status === 'Confirmed' && (
                        <>
                          <button
                            onClick={() => handleCheckIn(b.booking_id)}
                            className="inline-flex items-center gap-1 bg-[#1b5e3b] text-white px-2.5 py-1 rounded text-xs font-semibold hover:bg-[#14472c]"
                          >
                            <LogIn className="w-3 h-3" />
                            <span>Check In</span>
                          </button>
                          <button
                            onClick={() => handleCancelBooking(b.booking_id)}
                            className="text-red-700 hover:bg-red-50 px-2 py-1 rounded text-xs font-semibold border border-red-200"
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {b.booking_status === 'Checked-In' && (
                        <button
                          onClick={() => openCheckoutModal(b)}
                          className="inline-flex items-center gap-1 bg-[#1b5e3b] text-white px-2.5 py-1 rounded text-xs font-semibold hover:bg-[#14472c]"
                        >
                          <LogOut className="w-3 h-3" />
                          <span>Check Out</span>
                        </button>
                      )}

                      <button
                        onClick={() => onViewReceipt(b.booking_id)}
                        className="inline-flex items-center gap-1 text-[#1b5e3b] hover:underline font-semibold text-xs ml-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Check-Out & Settlement Modal */}
      {checkoutTarget && checkoutBilling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-[#6b8273]/30 overflow-hidden text-[#16261d]">
            {/* Modal Header */}
            <div className="p-4 bg-[#1b5e3b] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LogOut className="w-5 h-5 text-white" />
                <div>
                  <h2 className="font-bold text-sm">Vehicle Check-Out & Final Billing</h2>
                  <p className="text-[10px] text-white/80">
                    Permit #{checkoutTarget.booking_code} • Bay {checkoutTarget.slot_number} ({checkoutTarget.area_name})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCheckoutTarget(null)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs font-sans">
              {/* Presets for Testing Requirements */}
              <div className="p-3 bg-[#eff5f0] rounded-lg border border-[#cfd9d1] space-y-2">
                <span className="text-[11px] font-bold text-[#16261d] uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#1b5e3b]" />
                  Parking Duration Simulation Presets
                </span>
                <p className="text-[11px] text-[#455549]">
                  Select duration to verify hourly overtime calculation formula:
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handlePresetChange('ontime')}
                    className={`p-2 rounded text-left border text-[11px] transition ${
                      selectedExitPreset === 'ontime'
                        ? 'border-[#1b5e3b] bg-white font-bold text-[#1b5e3b] shadow-xs'
                        : 'border-[#cfd9d1] bg-[#dee4df]/50 text-[#16261d]'
                    }`}
                  >
                    <span className="block font-semibold">On-Time</span>
                    <span className="text-[9px] text-[#455549] block">No extra time</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePresetChange('overtime20')}
                    className={`p-2 rounded text-left border text-[11px] transition ${
                      selectedExitPreset === 'overtime20'
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
                      selectedExitPreset === 'overtime65'
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
                      selectedExitPreset === 'custom'
                        ? 'border-[#1b5e3b] bg-white font-bold text-[#1b5e3b] shadow-xs'
                        : 'border-[#cfd9d1] bg-[#dee4df]/50 text-[#16261d]'
                    }`}
                  >
                    <span className="block font-semibold">Current BST</span>
                    <span className="text-[9px] text-[#455549] block">Live time</span>
                  </button>
                </div>
              </div>

              {/* Billing Formula Breakdown */}
              <div className="p-4 bg-white rounded-lg border border-[#cfd9d1] space-y-2">
                <div className="flex justify-between items-center text-[11px] border-b border-[#cfd9d1] pb-2 font-mono">
                  <span>Vehicle Type & Rate:</span>
                  <strong className="text-[#1b5e3b]">
                    {checkoutBilling.vehicle_type} @ ৳{checkoutBilling.hourly_rate}/hour
                  </strong>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 text-[#455549]">
                  <div>
                    <span>Scheduled Start:</span>
                    <strong className="block text-[#16261d]">{checkoutBilling.scheduled_start}</strong>
                  </div>
                  <div>
                    <span>Scheduled End:</span>
                    <strong className="block text-[#16261d]">{checkoutBilling.scheduled_end}</strong>
                  </div>
                  <div>
                    <span>Actual Check-In:</span>
                    <strong className="block text-[#1b5e3b]">{checkoutBilling.check_in_time || 'Recorded'}</strong>
                  </div>
                  <div>
                    <span>Actual Exit Time:</span>
                    <strong className="block text-[#16261d]">{customExitTime}</strong>
                  </div>
                </div>

                <div className="border-t border-[#cfd9d1] pt-2 space-y-1 font-mono text-xs">
                  <div className="flex justify-between text-[#455549]">
                    <span>Booked Duration:</span>
                    <span>{checkoutBilling.booked_hours} Hours</span>
                  </div>
                  <div className="flex justify-between text-[#455549]">
                    <span>Overtime Exceeded:</span>
                    <span className={checkoutBilling.overtime_minutes > 0 ? 'text-amber-800 font-bold' : ''}>
                      {checkoutBilling.overtime_minutes > 0
                        ? `${checkoutBilling.overtime_minutes} mins (+${checkoutBilling.overtime_hours} hr rounded up)`
                        : 'None (Within booked block)'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#16261d] font-bold">
                    <span>Total Billable Hours:</span>
                    <span className="text-[#1b5e3b]">{checkoutBilling.billable_hours} Hours</span>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="border-t border-dashed border-[#cfd9d1] pt-2 space-y-1 font-mono text-xs">
                  <div className="flex justify-between text-[#455549]">
                    <span>Initial Amount Paid:</span>
                    <span>৳{checkoutBilling.paid_amount}.00</span>
                  </div>
                  {checkoutBilling.outstanding_amount > 0 && (
                    <div className="flex justify-between text-amber-800 font-bold">
                      <span>Outstanding Overtime Charge:</span>
                      <span>+৳{checkoutBilling.outstanding_amount}.00</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-[#16261d] pt-1 border-t border-[#cfd9d1]">
                    <span>Final Parking Charge:</span>
                    <span className="text-[#1b5e3b]">৳{checkoutBilling.total_charge}.00</span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector if outstanding amount > 0 */}
              {checkoutBilling.outstanding_amount > 0 && (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#16261d]">
                    Select Payment Method for Outstanding ৳{checkoutBilling.outstanding_amount}:
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['bKash', 'Nagad', 'Rocket', 'Civic Wallet'] as PaymentMethod[]).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setCheckoutPaymentMethod(m)}
                        className={`py-1.5 px-2 rounded text-center text-xs font-semibold border ${
                          checkoutPaymentMethod === m
                            ? 'bg-[#1b5e3b] text-white border-[#1b5e3b]'
                            : 'neu-btn-secondary text-[#16261d]'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#dee4df] border-t border-[#cfd9d1] flex justify-between items-center">
              <button
                type="button"
                onClick={() => setCheckoutTarget(null)}
                className="neu-btn-secondary px-4 py-2 rounded text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCheckout}
                className="neu-btn-primary px-5 py-2 rounded text-xs font-bold flex items-center gap-1.5 bg-[#1b5e3b] text-white"
              >
                <LogOut className="w-4 h-4" />
                <span>
                  Confirm Exit & Settle {checkoutBilling.outstanding_amount > 0 ? `(৳${checkoutBilling.outstanding_amount})` : 'Free'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
