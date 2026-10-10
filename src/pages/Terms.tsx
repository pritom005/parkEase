import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface Props {
  onNavigate: (view: string) => void;
}

export const Terms: React.FC<Props> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#1b5e3b] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
      </div>

      <div className="neu-raised p-8 rounded-xl border border-[#cfd9d1] space-y-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#16261d]">
          Terms of Service
        </h1>
        <div className="w-20 h-0.5 border-b-2 border-dashed border-[#e6b422]"></div>
        <p className="text-xs sm:text-sm text-[#455549] leading-relaxed">
          Welcome to ParkEase, a web-based parking booking and management system for Chattogram City, Bangladesh.
          These terms govern your use of the ParkEase platform, including slot searches, reservations, and user accounts.
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        <div className="neu-raised p-6 rounded-xl border border-[#cfd9d1] space-y-2">
          <h3 className="text-base font-bold text-[#16261d]">1. Account Registration</h3>
          <p className="text-xs text-[#455549] leading-relaxed">
            Users must register an account with accurate contact information (full name, email, and phone number).
            Each registered user is responsible for maintaining the confidentiality of their credentials and
            all activities occurring under their account.
          </p>
        </div>

        <div className="neu-raised p-6 rounded-xl border border-[#cfd9d1] space-y-2">
          <h3 className="text-base font-bold text-[#16261d]">2. Slot Reservation and Availability</h3>
          <p className="text-xs text-[#455549] leading-relaxed">
            Parking slot reservations are subject to availability at the time of booking. Users must select an appropriate
            slot matching their vehicle category (Cars must only reserve Car slots; Motorcycles must only reserve Motorcycle slots).
            Overlapping reservations on the same slot for identical time windows are strictly prevented by database validation.
          </p>
        </div>

        <div className="neu-raised p-6 rounded-xl border border-[#cfd9d1] space-y-2">
          <h3 className="text-base font-bold text-[#16261d]">3. Pricing and Simulated Payments</h3>
          <p className="text-xs text-[#455549] leading-relaxed">
            Hourly parking tariffs are clearly indicated prior to reservation confirmation. ParkEase provides simulated payment
            processing using popular Bangladeshi gateways (bKash, Nagad, Rocket, Visa, and MasterCard) for academic demonstration
            and booking settlement.
          </p>
        </div>

        <div className="neu-raised p-6 rounded-xl border border-[#cfd9d1] space-y-2">
          <h3 className="text-base font-bold text-[#16261d]">4. Cancellation Policy</h3>
          <p className="text-xs text-[#455549] leading-relaxed">
            Users may cancel their confirmed bookings through their User Portal. Upon cancellation, the reserved slot is immediately
            restored to Available status in the database so other users can book it.
          </p>
        </div>
      </div>
    </div>
  );
};
