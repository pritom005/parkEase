import React from 'react';
import { X } from 'lucide-react';
import { PhoneOtpPanel } from './PhoneOtpPanel';

interface PhoneOtpModalProps {
  isOpen: boolean;
  phone: string;
  onClose: () => void;
  onVerified: () => void;
}

export const PhoneOtpModal: React.FC<PhoneOtpModalProps> = ({
  isOpen,
  phone,
  onClose,
  onVerified
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 flex items-center justify-center p-4">
      <div
        className="bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-[12px] shadow-[8px_8px_20px_var(--shadow-dark),-8px_-8px_20px_var(--shadow-light)] max-w-md w-full p-6 text-[var(--text-ink)] relative"
        role="dialog"
        aria-modal="true"
        aria-label="Verify Mobile Number via SMS OTP"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-ink)] p-1 rounded-[6px] hover:bg-[var(--bg-tint)] transition-colors"
          aria-label="Close verification modal"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        <PhoneOtpPanel
          phone={phone}
          onVerified={() => {
            onVerified();
            onClose();
          }}
          onCancel={onClose}
          cancelLabel="Close"
          autoSend={true}
          allowPhoneEdit={true}
        />
      </div>
    </div>
  );
};
