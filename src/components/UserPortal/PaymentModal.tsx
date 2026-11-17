import React, { useState } from 'react';
import { useParkEase } from '../../context/ParkEaseContext';
import { PaymentMethod } from '../../types';
import { X, CheckCircle, CreditCard, Smartphone, ShieldCheck, ArrowRight } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  bookingId: number | null;
  onClose: () => void;
  onSuccessViewHistory: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  bookingId,
  onClose,
  onSuccessViewHistory
}) => {
  const { bookings, slots, areas, vehicles, currentUser, processPayment } = useParkEase();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bKash');
  const [senderAccount, setSenderAccount] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !bookingId) return null;

  const booking = bookings.find((b) => b.booking_id === bookingId);
  const slot = booking ? slots.find((s) => s.slot_id === booking.slot_id) : null;
  const area = slot ? areas.find((a) => a.area_id === slot.area_id) : null;
  const vehicle = booking ? vehicles.find((v) => v.vehicle_id === booking.vehicle_id) : null;

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const res = processPayment(bookingId, paymentMethod);
    if (res.success) {
      setIsCompleted(true);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[700] overflow-y-auto bg-black/40 flex items-center justify-center p-4">
      <div
        className="soft-raised-static max-w-md w-full p-6 text-[var(--text-ink)] relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-modal-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-heading)] p-1 rounded-[6px] hover:bg-[var(--bg-tint)] bg-transparent border-0 cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {!isCompleted ? (
          <div>
            <h2
              id="payment-modal-title"
              className="text-base sm:text-lg font-bold text-[var(--text-heading)] border-b-2 border-dashed border-[var(--accent-gold)] pb-1 mb-1 inline-block"
            >
              Payment Gateway
            </h2>
            <p className="text-xs text-[var(--text-muted)] mb-4">Booking Ref: #{bookingId}</p>

            {errorMsg && (
              <div
                role="alert"
                className="mb-4 p-3 bg-[var(--status-occupied-bg)] border border-[var(--status-occupied-border)] rounded-[8px] text-xs text-[var(--status-occupied)] font-semibold"
              >
                {errorMsg}
              </div>
            )}

            <div className="invoice-total-box mb-5 text-center mt-0">
              <span className="text-xs text-[var(--text-muted)] block">Total Payable Amount</span>
              <span className="text-2xl font-bold text-[var(--primary-forest)] tabular-nums">
                BDT {booking?.price_total.toFixed(2)}
              </span>
            </div>

            <form onSubmit={handlePay} className="space-y-4 text-xs">
              <div>
                <span className="form-label block mb-2">Select Payment Channel</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['bKash', 'Nagad', 'Rocket', 'Visa', 'MasterCard'] as PaymentMethod[]).map(
                    (method) => {
                      const isSelected = paymentMethod === method;
                      return (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`option-select-card p-2.5 flex flex-col items-center justify-center gap-1 text-center ${
                            isSelected ? 'selected' : ''
                          }`}
                        >
                          {method === 'Visa' || method === 'MasterCard' ? (
                            <CreditCard className="w-4 h-4 text-[var(--primary-forest)]" />
                          ) : (
                            <Smartphone className="w-4 h-4 text-[var(--primary-forest)]" />
                          )}
                          <span className="text-xs font-bold text-[var(--text-heading)]">
                            {method}
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="form-group m-0">
                <label htmlFor="modal-pay-account" className="form-label">
                  {paymentMethod === 'Visa' || paymentMethod === 'MasterCard'
                    ? 'Card Number'
                    : `${paymentMethod} Account Number`}
                </label>
                <input
                  id="modal-pay-account"
                  type="text"
                  required
                  placeholder={
                    paymentMethod === 'Visa' || paymentMethod === 'MasterCard'
                      ? 'e.g. 4XXX XXXX XXXX XXXX'
                      : '01XXXXXXXXX'
                  }
                  value={senderAccount}
                  onChange={(e) => setSenderAccount(e.target.value)}
                  className="form-input"
                />
              </div>

              <button type="submit" className="btn-primary w-full py-2.5 text-xs">
                <ShieldCheck className="w-4 h-4 text-white" aria-hidden="true" />
                <span>Confirm and Pay BDT {booking?.price_total.toFixed(2)}</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center py-2 space-y-4">
            <div className="w-12 h-12 bg-[var(--status-available-bg)] text-[var(--primary-forest)] rounded-[10px] flex items-center justify-center mx-auto border border-[var(--status-available-border)]">
              <CheckCircle className="w-6 h-6" aria-hidden="true" />
            </div>

            <div>
              <h3 className="text-base font-bold text-[var(--text-heading)] m-0">
                Payment Confirmed
              </h3>
              <p className="text-xs text-[var(--text-muted)] m-0 mt-1">
                Reservation #{bookingId} is confirmed.
              </p>
            </div>

            <div className="soft-inset p-4 text-xs text-left space-y-2">
              <div className="flex justify-between border-b border-[var(--border-subtle)] pb-1.5">
                <span className="text-[var(--text-muted)]">Driver Name:</span>
                <span className="font-semibold text-[var(--text-heading)]">
                  {currentUser?.full_name}
                </span>
              </div>
              <div className="flex justify-between border-b border-[var(--border-subtle)] pb-1.5">
                <span className="text-[var(--text-muted)]">Vehicle:</span>
                <span className="font-semibold text-[var(--text-heading)]">
                  {vehicle?.vehicle_number}
                </span>
              </div>
              <div className="flex justify-between border-b border-[var(--border-subtle)] pb-1.5">
                <span className="text-[var(--text-muted)]">Area:</span>
                <span className="font-semibold text-[var(--text-heading)]">{area?.area_name}</span>
              </div>
              <div className="flex justify-between border-b border-[var(--border-subtle)] pb-1.5">
                <span className="text-[var(--text-muted)]">Slot Assigned:</span>
                <span className="font-bold text-[var(--primary-forest)]">{slot?.slot_number}</span>
              </div>
              <div className="flex justify-between border-b border-[var(--border-subtle)] pb-1.5">
                <span className="text-[var(--text-muted)]">Schedule:</span>
                <span className="text-[var(--text-ink)] tabular-nums">
                  {booking?.booking_date} at {booking?.booking_time} ({booking?.duration_hours}h)
                </span>
              </div>
              <div className="flex justify-between border-b border-[var(--border-subtle)] pb-1.5">
                <span className="text-[var(--text-muted)]">Channel:</span>
                <span className="text-[var(--text-ink)]">{paymentMethod}</span>
              </div>
              <div className="flex justify-between pt-1 font-bold tabular-nums">
                <span className="text-[var(--text-heading)]">Total Paid:</span>
                <span className="text-[var(--primary-forest)]">
                  BDT {booking?.price_total.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1 py-2 text-xs"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSuccessViewHistory();
                }}
                className="btn-primary flex-1 py-2 text-xs"
              >
                <span>My Bookings</span>
                <ArrowRight className="w-3.5 h-3.5 text-white" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
