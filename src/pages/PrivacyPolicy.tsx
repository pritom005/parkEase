import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface Props {
  onNavigate: (view: string) => void;
}

export const PrivacyPolicy: React.FC<Props> = ({ onNavigate }) => {
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
          Privacy Policy
        </h1>
        <div className="w-20 h-0.5 border-b-2 border-dashed border-[#e6b422]"></div>
        <p className="text-xs sm:text-sm text-[#455549] leading-relaxed">
          ParkEase is committed to protecting your privacy. This policy explains how we collect, use,
          and safeguard your personal and vehicular information when you use our parking booking system.
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        <div className="neu-raised p-6 rounded-xl border border-[#cfd9d1] space-y-2">
          <h3 className="text-base font-bold text-[#16261d]">1. Information We Collect</h3>
          <p className="text-xs text-[#455549] leading-relaxed">
            When you register on ParkEase, we collect your name, email address, phone number, and password hash.
            When registering vehicles or making parking reservations, we collect vehicle details (license plate number,
            vehicle type, brand, and model) and booking schedules.
          </p>
        </div>

        <div className="neu-raised p-6 rounded-xl border border-[#cfd9d1] space-y-2">
          <h3 className="text-base font-bold text-[#16261d]">2. How We Use Your Information</h3>
          <p className="text-xs text-[#455549] leading-relaxed">
            Your data is used solely to facilitate parking reservations, verify vehicle slot compatibility,
            process simulated booking payments, and maintain accurate booking history for your account.
          </p>
        </div>

        <div className="neu-raised p-6 rounded-xl border border-[#cfd9d1] space-y-2">
          <h3 className="text-base font-bold text-[#16261d]">3. Data Security & Storage</h3>
          <p className="text-xs text-[#455549] leading-relaxed">
            User passwords are stored in hashed format (PBKDF2 SHA-256) and never stored in plain text.
            We do not share your private account data with third parties.
          </p>
        </div>

        <div className="neu-raised p-6 rounded-xl border border-[#cfd9d1] space-y-2">
          <h3 className="text-base font-bold text-[#16261d]">4. Your Rights</h3>
          <p className="text-xs text-[#455549] leading-relaxed">
            You may view, update, and manage your account details or registered vehicles at any time
            through the User Portal Profile and Vehicles sections.
          </p>
        </div>
      </div>
    </div>
  );
};
