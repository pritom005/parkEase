import React from 'react';
import { X, Shield, FileText } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  type: 'terms' | 'privacy' | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, type, onClose }) => {
  if (!isOpen || !type) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 flex items-center justify-center p-4">
      <div
        className="bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-[12px] shadow-[8px_8px_20px_var(--shadow-dark),-8px_-8px_20px_var(--shadow-light)] max-w-2xl w-full max-h-[85vh] flex flex-col text-[var(--text-ink)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center space-x-2">
            {type === 'terms' ? (
              <FileText className="w-5 h-5 text-[var(--primary-forest)]" />
            ) : (
              <Shield className="w-5 h-5 text-[var(--primary-forest)]" />
            )}
            <h2
              id="legal-title"
              className="text-base sm:text-lg font-bold text-[var(--text-heading)] border-b-2 border-dashed border-[var(--accent-gold)] pb-0.5"
            >
              {type === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-ink)] p-1 rounded-[6px] hover:bg-[var(--bg-tint)] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-[var(--text-muted)] leading-relaxed">
          {type === 'terms' ? (
            <>
              <section className="space-y-1.5">
                <h3 className="text-[var(--text-heading)] font-bold text-sm">1. Agreement to Terms</h3>
                <p>
                  By accessing or registering with ParkEase Chattogram, you agree to comply with all operational guidelines governing parking reservations across our facilities in Chattogram City.
                </p>
              </section>

              {/* Requirement G4: Minimum age requirement */}
              <section className="space-y-1.5 bg-[var(--bg-tint)] p-3 rounded-[8px] border border-[var(--status-available-border)]">
                <h3 className="text-[var(--primary-forest)] font-bold text-xs">2. Minimum Age Requirement</h3>
                <p className="text-[var(--text-ink)]">
                  Users under 18 years of age must possess parental or legal guardian consent to register an account and book parking slots through ParkEase.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="text-[var(--text-heading)] font-bold text-sm">3. Vehicle Ownership and Slot Usage</h3>
                <p>
                  All bookings must correspond to a vehicle registered in your garage matching the vehicle type (Car or Motorcycle) designated for the chosen slot.
                </p>
              </section>

              {/* Requirement G2: Cancellation Policy Section */}
              <section className="space-y-1.5 bg-[var(--bg-tint)] p-3 rounded-[8px] border border-[var(--status-available-border)]">
                <h3 className="text-[var(--primary-forest)] font-bold text-xs">4. Cancellation Policy</h3>
                <p className="text-[var(--text-ink)]">
                  Confirmed bookings may be cancelled prior to the reserved start time directly through the User Portal under &quot;Booking History&quot;. Once cancelled, the reserved slot status is released back to Available for other drivers.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="text-[var(--text-heading)] font-bold text-sm">5. Transparent Pricing</h3>
                <p>
                  All parking slot rates in Chattogram City are clearly published in Bangladesh Taka (BDT) per hour and per day (24 hours). The total cost is computed transparently from the slot tariff and selected duration, with zero hidden surcharges.
                </p>
              </section>
            </>
          ) : (
            <>
              {/* Requirement G6: Data Collection disclosure */}
              <section className="space-y-1.5">
                <h3 className="text-[var(--text-heading)] font-bold text-sm">1. Information We Collect</h3>
                <p>
                  ParkEase collects only the minimal data points necessary to process your parking reservations:
                </p>
                <ul className="list-disc list-inside space-y-1 text-[var(--text-ink)] pl-2">
                  <li>Full Name and contact Phone Number</li>
                  <li>Email address (for authentication and receipts)</li>
                  <li>Vehicle details: License plate number, Vehicle Type, Brand, and Model</li>
                  <li>Secure cryptographic password hash</li>
                </ul>
              </section>

              {/* Requirement G2: Cookie Policy Section */}
              <section className="space-y-1.5 bg-[var(--bg-tint)] p-3 rounded-[8px] border border-[var(--status-available-border)]">
                <h3 className="text-[var(--primary-forest)] font-bold text-xs">2. Cookie Policy</h3>
                <p className="text-[var(--text-ink)]">
                  ParkEase uses only essential first-party cookies and local storage tokens strictly required for session persistence and reservation security. No advertising tracking cookies are deployed.
                </p>
              </section>

              {/* Requirement G2: Data Deletion Request Section */}
              <section className="space-y-1.5 bg-[var(--bg-tint)] p-3 rounded-[8px] border border-[var(--status-available-border)]">
                <h3 className="text-[var(--primary-forest)] font-bold text-xs">3. Data Deletion Request</h3>
                <p className="text-[var(--text-ink)]">
                  Users retain full ownership of their personal data. To delete your vehicle records, use the &quot;Delete Vehicle&quot; option in your portal. To completely erase your user profile and reservation records, submit a request via the administration desk.
                </p>
              </section>

            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[var(--border-subtle)] flex justify-end">
          <button type="button" onClick={onClose} className="btn-primary text-xs">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
