import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mockDb } from '../../db/mockDb';
import { PaymentMethod, Booking } from '../../types';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Wallet,
} from 'lucide-react';

interface Props {
  bookingId?: number;
  onNavigate: (view: string, extra?: any) => void;
}

export const UserPayment: React.FC<Props> = ({ bookingId, onNavigate }) => {
  const { currentUser } = useAuth();
  const userId = currentUser?.user_id || 2;

  // Retrieve target booking
  const bookings = mockDb.getBookingsByUser(userId);
  const targetBooking = bookingId
    ? mockDb.getBookingById(bookingId) || bookings[0]
    : bookings.find((b) => b.payment_status === 'Pending') || bookings[0];

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bKash');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phone || '+880 1712-349042');
  const [promoCode, setPromoCode] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!targetBooking) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#16261d]">No Pending Reservation Found</h2>
        <p className="text-xs text-[#455549]">Please reserve a parking slot first.</p>
        <button
          onClick={() => onNavigate('parking-map')}
          className="neu-btn-primary px-4 py-2 rounded-lg text-xs font-semibold"
        >
          Go to Parking Map
        </button>
      </div>
    );
  }

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);

    setTimeout(() => {
      const res = mockDb.processPayment(targetBooking.booking_id, paymentMethod);
      setIsProcessing(false);
      if (res.success && res.payment) {
        onNavigate('user-confirmation', {
          booking: targetBooking,
          payment: res.payment,
        });
      } else {
        setError(res.error || 'Payment failed to settle');
      }
    }, 600);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-[#455549] mb-1">
          <span>PARKEASE PORTAL</span>
          <span>&gt;</span>
          <span>RESERVATION PIPELINE</span>
          <span>&gt;</span>
          <span className="text-[#1b5e3b] font-bold">PAYMENT CLEARANCE</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#16261d] tracking-tight">
              Payment & Clearance Settlement
            </h1>
            <p className="text-xs text-[#455549] mt-1">
              Settle municipal parking tariff for reserved Bay {targetBooking.slot_number} at {targetBooking.area_name}.
              Verified transaction triggers instant ANPR optical boom-barrier clearance.
            </p>
          </div>
          <span className="text-[10px] font-mono text-[#1b5e3b] font-bold bg-[#dcefe3] px-3 py-1.5 rounded border border-[#1b5e3b] flex items-center gap-1.5 self-start">
            <ShieldCheck className="w-4 h-4" />
            <span>256-BIT SSL ENCRYPTED GATEWAY</span>
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Gateway Selector & Inputs (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Reservation Brief */}
          <div className="neu-raised p-5 rounded-xl border border-[#cfd9d1] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#16261d]">Permit Reservation Brief</span>
              <span className="text-[10px] font-mono text-[#1b5e3b] bg-[#dcefe3] px-2 py-0.5 rounded font-bold">
                HOLD ACTIVE: 11:24 REMAINING
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-lg border border-[#cfd9d1]">
                <span className="text-[10px] text-[#455549] uppercase font-semibold block">Hub & Location</span>
                <strong className="text-xs font-bold text-[#16261d] block">{targetBooking.area_name}</strong>
                <span className="text-[10px] text-[#455549]">Central District</span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-[#cfd9d1]">
                <span className="text-[10px] text-[#455549] uppercase font-semibold block">Allocated Bay</span>
                <strong className="text-xs font-bold text-[#1b5e3b] font-mono block">
                  Bay {targetBooking.slot_number} ({targetBooking.vehicle_type})
                </strong>
                <span className="text-[10px] text-[#455549]">Ground Level</span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-[#cfd9d1]">
                <span className="text-[10px] text-[#455549] uppercase font-semibold block">Permitted Vehicle</span>
                <strong className="text-xs font-mono font-bold text-[#16261d] block">
                  {targetBooking.vehicle_number}
                </strong>
              </div>

              <div className="p-3 bg-white rounded-lg border border-[#cfd9d1]">
                <span className="text-[10px] text-[#455549] uppercase font-semibold block">Validity Window</span>
                <strong className="text-xs font-bold text-[#16261d] block">
                  {targetBooking.booking_time} ({targetBooking.duration_hours}h duration)
                </strong>
              </div>
            </div>
          </div>

          {/* Select Payment Gateway */}
          <div className="neu-raised p-6 rounded-xl border border-[#cfd9d1] space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#16261d]">Select Payment Gateway</h3>
              <p className="text-xs text-[#455549]">
                Settlement processed directly through Chattogram Municipal Authorized Banking & MFS network.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
              {/* bKash */}
              <div
                onClick={() => setPaymentMethod('bKash')}
                className={`p-3.5 rounded-xl border transition cursor-pointer select-none ${
                  paymentMethod === 'bKash'
                    ? 'neu-pressed bg-[#dcefe3] border-2 border-[#1b5e3b]'
                    : 'neu-raised-sm bg-[#e8eee9] hover:bg-[#dee4df] border-[#cfd9d1]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="w-7 h-7 rounded bg-[#e2136e] text-white flex items-center justify-center font-bold text-xs">
                    bK
                  </div>
                  {paymentMethod === 'bKash' && (
                    <span className="text-[9px] font-bold bg-[#1b5e3b] text-white px-1.5 py-0.5 rounded">
                      SELECTED
                    </span>
                  )}
                </div>
                <strong className="text-xs font-bold text-[#16261d] block">bKash MFS</strong>
                <span className="text-[10px] text-[#1b5e3b] font-semibold block">0% Municipal Surcharge</span>
              </div>

              {/* Nagad */}
              <div
                onClick={() => setPaymentMethod('Nagad')}
                className={`p-3.5 rounded-xl border transition cursor-pointer select-none ${
                  paymentMethod === 'Nagad'
                    ? 'neu-pressed bg-[#dcefe3] border-2 border-[#1b5e3b]'
                    : 'neu-raised-sm bg-[#e8eee9] hover:bg-[#dee4df] border-[#cfd9d1]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="w-7 h-7 rounded bg-[#f7941d] text-white flex items-center justify-center font-bold text-xs">
                    ন
                  </div>
                  {paymentMethod === 'Nagad' && (
                    <span className="text-[9px] font-bold bg-[#1b5e3b] text-white px-1.5 py-0.5 rounded">
                      SELECTED
                    </span>
                  )}
                </div>
                <strong className="text-xs font-bold text-[#16261d] block">Nagad Postal</strong>
                <span className="text-[10px] text-[#455549] block">Postal Financial Service</span>
              </div>

              {/* Rocket */}
              <div
                onClick={() => setPaymentMethod('Rocket')}
                className={`p-3.5 rounded-xl border transition cursor-pointer select-none ${
                  paymentMethod === 'Rocket'
                    ? 'neu-pressed bg-[#dcefe3] border-2 border-[#1b5e3b]'
                    : 'neu-raised-sm bg-[#e8eee9] hover:bg-[#dee4df] border-[#cfd9d1]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="w-7 h-7 rounded bg-[#8c3494] text-white flex items-center justify-center font-bold text-xs">
                    DB
                  </div>
                  {paymentMethod === 'Rocket' && (
                    <span className="text-[9px] font-bold bg-[#1b5e3b] text-white px-1.5 py-0.5 rounded">
                      SELECTED
                    </span>
                  )}
                </div>
                <strong className="text-xs font-bold text-[#16261d] block">Rocket (DBBL)</strong>
                <span className="text-[10px] text-[#455549] block">NexusPay Direct</span>
              </div>

              {/* Debit/Credit Card */}
              <div
                onClick={() => setPaymentMethod('Visa')}
                className={`p-3.5 rounded-xl border transition cursor-pointer select-none ${
                  paymentMethod === 'Visa'
                    ? 'neu-pressed bg-[#dcefe3] border-2 border-[#1b5e3b]'
                    : 'neu-raised-sm bg-[#e8eee9] hover:bg-[#dee4df] border-[#cfd9d1]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="w-7 h-7 rounded bg-[#1a1f71] text-white flex items-center justify-center font-bold text-xs">
                    💳
                  </div>
                  {paymentMethod === 'Visa' && (
                    <span className="text-[9px] font-bold bg-[#1b5e3b] text-white px-1.5 py-0.5 rounded">
                      SELECTED
                    </span>
                  )}
                </div>
                <strong className="text-xs font-bold text-[#16261d] block">Debit / Credit Card</strong>
                <span className="text-[10px] text-[#455549] block">Visa / MasterCard / NPSB</span>
              </div>
            </div>

            {/* Form details for chosen gateway */}
            <form onSubmit={handlePay} className="space-y-4 pt-3 border-t border-[#cfd9d1]">
              <div>
                <label className="block text-xs font-semibold text-[#16261d] mb-1">
                  Registered {paymentMethod} Account / Mobile Number
                </label>
                <input
                  type="text"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full p-2.5 rounded-lg text-xs neu-input font-mono"
                />
                <span className="text-[10px] text-[#455549] block mt-1">
                  An automated 6-digit municipal OTP verification challenge will be dispatched to this number.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#16261d] mb-1">
                  Municipal Settlement Reference
                </label>
                <input
                  type="text"
                  readOnly
                  value={`CTG-RES-${targetBooking.booking_code}`}
                  className="w-full p-2.5 rounded-lg text-xs neu-input bg-gray-100 font-mono text-[#455549]"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. NASIRABAD-RES-25"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="w-full p-2.5 rounded-lg text-xs neu-input"
                />
                <button
                  type="button"
                  onClick={() => alert('No active municipal subsidy found for this code.')}
                  className="neu-btn-secondary px-4 py-2.5 rounded-lg text-xs font-semibold shrink-0"
                >
                  Apply
                </button>
              </div>

              <label className="flex items-start gap-2 pt-2 text-xs text-[#455549] cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 rounded text-[#1b5e3b]"
                />
                <span>
                  I authorize Chattogram City Corporation (CCC) and CDA to register optical ANPR and RFID barrier clearance for vehicle {targetBooking.vehicle_number} upon successful gateway settlement.
                </span>
              </label>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full neu-btn-primary py-3.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <span>
                  {isProcessing
                    ? 'Processing Municipal Settlement...'
                    : `Pay ${targetBooking.price_total} BDT via ${paymentMethod} & Generate Gate Pass`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Settlement Invoice (5 Cols) */}
        <div className="lg:col-span-5 neu-raised p-6 rounded-xl border border-[#cfd9d1] space-y-5 sticky top-24">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-[#16261d]">Settlement Invoice</h3>
              <span className="text-[10px] font-mono text-[#1b5e3b] font-bold bg-[#dcefe3] px-2 py-0.5 rounded">
                VERIFIED
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#455549] block">
              CTG-PAY-{targetBooking.booking_code}
            </span>
          </div>

          <div className="space-y-2 text-xs py-3 border-y border-[#cfd9d1] text-[#455549]">
            <div className="flex justify-between">
              <span>Base Parking Tariff ({targetBooking.duration_hours}h):</span>
              <strong className="text-[#16261d] font-mono font-bold">{targetBooking.price_total}.00 BDT</strong>
            </div>
            <div className="flex justify-between">
              <span>Chattogram Municipal Amenity Fee:</span>
              <span className="font-mono text-[#1b5e3b] font-semibold">0.00 BDT (Waived)</span>
            </div>
            <div className="flex justify-between">
              <span>ANPR & FastTag Sensor Protocol:</span>
              <span className="font-mono text-[#1b5e3b] font-semibold">0.00 BDT (Free Service)</span>
            </div>
            <div className="flex justify-between">
              <span>NBR Statutory VAT (15% Included):</span>
              <span className="font-mono text-[#16261d]">{(targetBooking.price_total * 0.15).toFixed(2)} BDT</span>
            </div>
            <div className="flex justify-between">
              <span>{paymentMethod} Gateway Fee:</span>
              <span className="font-mono text-[#1b5e3b] font-semibold">0.00 BDT (0%)</span>
            </div>
          </div>

          <div className="p-4 bg-[#eff5f0] rounded-xl border border-[#cfd9d1] space-y-1">
            <span className="text-[10px] text-[#455549] uppercase font-bold block">TOTAL AMOUNT DUE</span>
            <div className="flex items-baseline justify-between">
              <strong className="text-3xl font-extrabold text-[#16261d] font-mono">
                {targetBooking.price_total} <span className="text-sm font-normal text-[#455549]">BDT</span>
              </strong>
              <span className="text-xs text-[#455549] font-mono">
                ≈ ${(targetBooking.price_total / 120).toFixed(2)} USD
              </span>
            </div>
            <p className="text-[10px] text-[#455549] pt-1">
              Bangladeshi Taka • Inclusive of all CCC parking taxes & NBR VAT.
            </p>
          </div>

          <div className="p-3 bg-[#e8eee9] rounded-lg border border-[#cfd9d1] space-y-2 text-xs text-[#455549]">
            <div className="flex items-center gap-1.5 text-[#1b5e3b] font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Municipal Optical Gate Protocol</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Upon payment confirmation, Bay {targetBooking.slot_number} entry node at {targetBooking.area_name} will
              instantly recognize license plate <strong>{targetBooking.vehicle_number}</strong>. No paper token required.
            </p>
          </div>

          <button
            onClick={() => onNavigate('user-booking')}
            className="w-full text-center text-xs font-semibold text-[#455549] hover:text-[#16261d] py-1"
          >
            ← Return to Vehicle & Schedule
          </button>
        </div>
      </div>
    </div>
  );
};
