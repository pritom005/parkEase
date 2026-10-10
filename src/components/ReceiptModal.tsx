import React from 'react';
import { Booking, Payment } from '../types';
import { mockDb } from '../db/mockDb';
import { X, Printer, Download, CheckCircle2, ShieldCheck, QrCode } from 'lucide-react';

interface Props {
  bookingId: number | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<Props> = ({ bookingId, onClose }) => {
  if (!bookingId) return null;

  const booking = mockDb.getBookingById(bookingId);
  const payment = mockDb.getAllPayments().find((p) => p.booking_id === bookingId);

  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const vatAmount = (booking.price_total * 0.15).toFixed(2);
  const netTariff = (booking.price_total * 0.85).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-[#6b8273]/30 overflow-hidden text-[#16261d]">
        {/* Receipt Header */}
        <div className="p-4 bg-[#1b5e3b] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-white text-[#1b5e3b] flex items-center justify-center font-bold text-xs">
              P
            </div>
            <div>
              <h2 className="font-bold text-sm">CHATTOGRAM CITY CORPORATION</h2>
              <p className="text-[10px] text-white/80">Directorate of Engineering & Smart Traffic Control</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-6 space-y-4 text-xs font-sans">
          <div className="text-center border-b border-dashed border-[#cfd9d1] pb-3">
            <span className="text-[10px] font-mono text-[#455549] uppercase block font-bold">
              OFFICIAL MUNICIPAL PARKING INVOICE & TAX RECEIPT
            </span>
            <strong className="text-lg font-mono font-bold text-[#16261d] block mt-0.5">
              INVOICE #{booking.booking_code}
            </strong>
            <span className="text-[10px] text-[#455549]">
              Date of Issue: {booking.booking_date} • NBR BIN: 001928374-0101
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs py-1">
            <div>
              <span className="text-[10px] text-[#455549] block">Citizen / Permittee:</span>
              <strong className="text-[#16261d]">{booking.user_name || 'Tanvir Ahmed'}</strong>
              <span className="text-[10px] text-[#455549] block">{booking.user_phone}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#455549] block">Assigned Vehicle:</span>
              <strong className="font-mono text-[#16261d]">{booking.vehicle_number}</strong>
              <span className="text-[10px] text-[#455549] block">{booking.vehicle_model}</span>
            </div>
          </div>

          <div className="p-3 bg-[#eff5f0] rounded-lg border border-[#cfd9d1] space-y-1.5 text-xs font-mono">
            <div className="flex justify-between">
              <span>Facility Hub:</span>
              <strong className="text-[#16261d]">{booking.area_name}</strong>
            </div>
            <div className="flex justify-between">
              <span>Designated Bay:</span>
              <strong className="text-[#1b5e3b]">Bay {booking.slot_number} ({booking.vehicle_type})</strong>
            </div>
            <div className="flex justify-between">
              <span>Hourly Tariff Rate:</span>
              <strong className="text-[#16261d]">
                ৳{booking.hourly_rate || (booking.vehicle_type === 'Motorcycle' ? 100 : 250)}/hour ({booking.vehicle_type || 'Car'})
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Scheduled Window:</span>
              <span>{booking.booking_date} {booking.booking_time} BST ({booking.duration_hours}h block)</span>
            </div>
            {booking.check_in_time && (
              <div className="flex justify-between text-[#1b5e3b]">
                <span>Actual Check-In:</span>
                <span>{booking.check_in_time}</span>
              </div>
            )}
            {booking.check_out_time && (
              <div className="flex justify-between text-[#455549]">
                <span>Actual Check-Out:</span>
                <span>{booking.check_out_time}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-[#cfd9d1]">
              <span>Billable Duration:</span>
              <strong className="text-[#1b5e3b]">
                {booking.billable_hours || booking.duration_hours} Billable Hours
                {booking.billable_hours && booking.billable_hours > booking.duration_hours
                  ? ` (${booking.duration_hours}h booked + ${booking.billable_hours - booking.duration_hours}h overtime)`
                  : ''}
              </strong>
            </div>
          </div>

          {/* Fiscal Ledger Table */}
          <div className="border-t border-b border-[#cfd9d1] py-2 space-y-1 font-mono text-xs">
            <div className="flex justify-between text-[#455549]">
              <span>Original Booked Amount:</span>
              <span>
                ৳{booking.original_amount || (booking.duration_hours * (booking.hourly_rate || (booking.vehicle_type === 'Motorcycle' ? 100 : 250)))}.00
              </span>
            </div>
            {booking.extra_amount && booking.extra_amount > 0 ? (
              <div className="flex justify-between text-amber-800 font-semibold">
                <span>Overtime Additional Tariff:</span>
                <span>+৳{booking.extra_amount}.00</span>
              </div>
            ) : null}
            <div className="flex justify-between text-[#455549]">
              <span>NBR Statutory VAT (15%):</span>
              <span>৳{vatAmount}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-[#16261d] pt-1 border-t border-[#cfd9d1]">
              <span>Total Settled Tariff:</span>
              <span>৳{booking.price_total}.00 BDT</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#455549] font-mono">
            <div>
              <span>Gateway: {payment?.payment_method || 'bKash MFS Direct'}</span>
              <span className="block text-[9px] text-[#1b5e3b] font-bold">Status: {booking.payment_status} (NBR Cleared)</span>
            </div>
            <div className="text-right">
              <span>TxRef: {payment?.transaction_ref || `TXN-${booking.booking_code}`}</span>
            </div>
          </div>

          {/* QR Code and Verification Seal */}
          <div className="pt-2 border-t border-dashed border-[#cfd9d1] flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono font-bold text-[#1b5e3b] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> CCC AUDIT CERTIFIED
              </span>
              <p className="text-[9px] text-[#455549] max-w-[240px]">
                Legally admissible under Section 82 of Chattogram City Corporation Act. Retain for gate boom inspection.
              </p>
            </div>
            <QrCode className="w-12 h-12 text-[#16261d]" />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#dee4df] border-t border-[#cfd9d1] flex justify-between items-center">
          <button
            onClick={onClose}
            className="neu-btn-secondary px-4 py-1.5 rounded text-xs font-semibold"
          >
            Close
          </button>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="neu-btn-primary px-4 py-1.5 rounded text-xs font-bold flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Tax Invoice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
