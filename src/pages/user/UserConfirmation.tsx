import React from 'react';
import { Booking, Payment } from '../../types';
import { mockDb } from '../../db/mockDb';
import {
  CheckCircle2,
  QrCode,
  Printer,
  Download,
  Home,
  MapPin,
  Calendar,
  Clock,
  Car,
  ShieldCheck,
  Database,
  ArrowRight,
} from 'lucide-react';

interface Props {
  booking?: Booking;
  payment?: Payment;
  onNavigate: (view: string, extra?: any) => void;
  onViewReceipt: (bookingId: number) => void;
}

export const UserConfirmation: React.FC<Props> = ({
  booking,
  payment,
  onNavigate,
  onViewReceipt,
}) => {
  const code = booking?.booking_code || 'PK-20261015-001';
  const slotNum = booking?.slot_number || 'C-04';
  const hubName = booking?.area_name || 'GEC Circle Hub Parking';
  const plate = booking?.vehicle_number || 'DHK-METRO-GA-11-2045';
  const total = booking?.price_total || 1000;
  const user = booking?.user_name || 'Tanvir Ahmed';
  const phone = booking?.user_phone || '+880 1712-349042';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="text-center space-y-3 pt-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#1b5e3b] text-white flex items-center justify-center shadow-lg">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#16261d] tracking-tight">
          Booking Confirmed Successfully!
        </h1>
        <p className="text-xs sm:text-sm text-[#455549] max-w-lg mx-auto">
          Your parking slot has been successfully reserved. Instant ingress authorization is now active across Chattogram City Corporation boom gates.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#dcefe3] rounded-full text-[11px] font-mono text-[#1b5e3b] font-bold">
          <Database className="w-3.5 h-3.5" />
          <span>TRANSACTION COMMITTED TO DBMS • LEDGER RECORD: CONFIRMED & AUDITED</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Details (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Reference and Badges */}
          <div className="neu-raised p-5 rounded-xl border border-[#cfd9d1] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#cfd9d1] pb-3">
              <div>
                <span className="text-[10px] font-mono text-[#455549] uppercase block font-semibold">
                  BOOKING REFERENCE ID
                </span>
                <strong className="text-lg font-mono font-bold text-[#16261d]">{code}</strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-[#dcefe3] text-[#1b5e3b] text-xs font-bold rounded flex items-center gap-1">
                  ✓ Paid • ৳{total}.00
                </span>
                <span className="px-2.5 py-1 bg-[#1b5e3b] text-white text-xs font-bold rounded">
                  Confirmed & Active
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-lg border border-[#cfd9d1]">
                <span className="text-[10px] text-[#455549] uppercase font-semibold block">FACILITY & SPOT</span>
                <strong className="text-xs font-bold text-[#16261d] block">{hubName}</strong>
                <span className="text-[11px] font-mono text-[#1b5e3b] font-bold">
                  Bay {slotNum} (Ground Level)
                </span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-[#cfd9d1]">
                <span className="text-[10px] text-[#455549] uppercase font-semibold block">SCHEDULE & TIME</span>
                <strong className="text-xs font-bold text-[#16261d] block">
                  {booking?.booking_date || 'Today'}, {booking?.booking_time || '09:30'}
                </strong>
                <span className="text-[11px] text-[#455549]">
                  Duration: {booking?.duration_hours || 8} Hours Block
                </span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-[#cfd9d1]">
                <span className="text-[10px] text-[#455549] uppercase font-semibold block">VEHICLE & CUSTOMER</span>
                <strong className="text-xs font-mono font-bold text-[#16261d] block">{plate}</strong>
                <span className="text-[11px] text-[#455549]">{user} • {phone}</span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-[#cfd9d1]">
                <span className="text-[10px] text-[#455549] uppercase font-semibold block">LEDGER SETTLEMENT</span>
                <div className="flex justify-between font-mono text-[11px] pt-1">
                  <span>Tariff:</span>
                  <span>{total} BDT</span>
                </div>
                <div className="flex justify-between font-mono text-[11px] text-[#1b5e3b] font-bold">
                  <span>Total Paid:</span>
                  <span>{total} BDT</span>
                </div>
              </div>
            </div>

            {/* Ingress Point and Map GPS */}
            <div className="p-4 bg-[#eff5f0] rounded-xl border border-[#cfd9d1] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#16261d] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#1b5e3b]" />
                  Allocated Ingress Point: Gate 1 (North Entry)
                </span>
                <span className="text-[10px] font-mono text-[#455549]">
                  GPS: 22.3592° N, 91.8219° E
                </span>
              </div>
              <p className="text-[11px] text-[#455549] leading-relaxed">
                Notice & 10-Minute Grace Rule: Please arrive within 10 minutes of scheduled start time ({booking?.booking_time || '09:30'} BST) and park only in designated{' '}
                <strong>Bay {slotNum}</strong>. If arrival is not checked in within the 10-minute grace period, the booking will be automatically cancelled due to no-show and the slot released.
              </p>
            </div>
          </div>
        </div>

        {/* Right Ingress Pass Card (5 Cols) */}
        <div className="lg:col-span-5 neu-raised p-6 rounded-xl border border-[#cfd9d1] space-y-4">
          <div className="p-5 bg-white rounded-xl border-2 border-[#1b5e3b] text-center space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-[#cfd9d1] pb-2 text-left">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-[#1b5e3b] text-white flex items-center justify-center font-bold text-xs">
                  P
                </div>
                <div>
                  <strong className="text-xs font-bold text-[#16261d] block">ParkEase Ingress Pass</strong>
                  <span className="text-[9px] text-[#455549]">Chattogram Urban Smart Grid</span>
                </div>
              </div>
              <span className="text-[9px] font-mono bg-[#dcefe3] text-[#1b5e3b] px-2 py-0.5 rounded font-bold">
                VALID
              </span>
            </div>

            <div className="py-2">
              <span className="text-[10px] text-[#455549] uppercase font-semibold block">DESIGNATED BAY</span>
              <strong className="text-3xl font-extrabold text-[#1b5e3b] font-mono tracking-tight block">
                BAY {slotNum}
              </strong>
              <span className="text-xs text-[#16261d] font-medium">{hubName}</span>
            </div>

            {/* QR Code Container */}
            <div className="p-3 bg-[#e8eee9] rounded-xl border border-[#cfd9d1] inline-block mx-auto">
              <QrCode className="w-36 h-36 mx-auto text-[#16261d]" />
            </div>

            <div>
              <span className="text-xs font-mono font-bold text-[#16261d] block">
                Booking ID: {code}
              </span>
              <p className="text-[10px] text-[#455549] mt-0.5">
                Scan at parking entrance or present vehicle plate to optical barrier reader.
              </p>
            </div>

            <div className="pt-2 border-t border-[#cfd9d1] text-[11px] text-[#455549] flex justify-between font-mono">
              <span>Plate: {plate}</span>
              <span className="text-[#1b5e3b] font-bold">10m Arrival Grace Active</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            {booking && booking.booking_status === 'Confirmed' && (
              <button
                onClick={() => {
                  const res = mockDb.checkInBooking(booking.booking_id);
                  if (res.success) {
                    alert('Arrival Verified! You are now Checked-In to Bay ' + slotNum + '.');
                    onNavigate('user-history');
                  }
                }}
                className="w-full bg-[#1b5e3b] text-white py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#14472c] transition shadow-xs"
              >
                <span>Check In / Record Arrival Now</span>
              </button>
            )}

            <button
              onClick={() => onNavigate('user-history')}
              className="w-full neu-btn-primary py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <span>View My Bookings</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handlePrint}
                className="neu-btn-secondary py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Pass</span>
              </button>
              <button
                onClick={() => onNavigate('home')}
                className="neu-btn-secondary py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Back to Home</span>
              </button>
            </div>

            <button
              onClick={() => onViewReceipt(booking?.booking_id || 1)}
              className="w-full text-center text-xs font-semibold text-[#1b5e3b] hover:underline py-1 flex items-center justify-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Official Tax Invoice (PDF)</span>
            </button>
          </div>
        </div>
      </div>

      {/* DBMS Transaction Audit & Distributed Ledger Telemetry */}
      <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1] text-xs font-mono text-[#455549] space-y-2">
        <div className="flex items-center justify-between text-[#1b5e3b] font-bold">
          <span className="flex items-center gap-1.5">
            <Database className="w-4 h-4" />
            DBMS TRANSACTION AUDIT & DISTRIBUTED LEDGER TELEMETRY
          </span>
          <span className="text-[10px]">Node: Synchronized across CTG-GEC-04</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-[11px]">
          <div className="p-2.5 bg-white rounded border border-[#cfd9d1]">
            <span className="text-[#455549] block">UPDATED TABLE 01</span>
            <strong className="text-[#16261d]">BOOKING_RECORD</strong>
            <span className="text-[#1b5e3b] block mt-0.5 font-bold">[{code}] -&gt; COMMITTED</span>
          </div>

          <div className="p-2.5 bg-white rounded border border-[#cfd9d1]">
            <span className="text-[#455549] block">UPDATED TABLE 02</span>
            <strong className="text-[#16261d]">SLOT_ALLOCATION</strong>
            <span className="text-[#1b5e3b] block mt-0.5 font-bold">[BAY_{slotNum}] -&gt; STATUS: OCCUPIED</span>
          </div>

          <div className="p-2.5 bg-white rounded border border-[#cfd9d1]">
            <span className="text-[#455549] block">UPDATED TABLE 03</span>
            <strong className="text-[#16261d]">PAYMENT_LEDGER</strong>
            <span className="text-[#1b5e3b] block mt-0.5 font-bold">[TXN-{code}] -&gt; SETTLED_AUDITED</span>
          </div>
        </div>
      </div>
    </div>
  );
};
