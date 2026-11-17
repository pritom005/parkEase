import React from 'react';
import { useParkEase } from '../context/ParkEaseContext';
import { Cookie } from 'lucide-react';

interface CookieBannerProps {
  onOpenPrivacy: () => void;
}

export const CookieBanner: React.FC<CookieBannerProps> = ({ onOpenPrivacy }) => {
  const { cookieConsent, setCookieConsentState } = useParkEase();

  if (cookieConsent !== 'pending') {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Cookie Consent Notice"
      className="fixed bottom-0 inset-x-0 z-50 bg-[var(--bg-base)] border-t-2 border-dashed border-[var(--accent-gold)] shadow-[0_-6px_14px_rgba(203,211,205,0.6)] p-4 sm:p-5 text-[var(--text-ink)]"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-start space-x-3 text-[var(--text-ink)]">
          <div className="vehicle-well p-2 text-[var(--primary-forest)]">
            <Cookie className="w-5 h-5" />
          </div>
          <div className="text-xs sm:text-sm">
            <span className="font-bold text-[var(--text-heading)]">Privacy and Cookie Notice: </span>
            ParkEase uses essential session cookies to maintain your login and parking reservations. No advertising trackers are deployed. You can review our{' '}
            <button
              type="button"
              onClick={onOpenPrivacy}
              className="text-[var(--primary-forest)] underline font-semibold hover:text-[var(--primary-hover)]"
            >
              Cookie Policy & Privacy Terms
            </button>.
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setCookieConsentState('declined')}
            className="btn-secondary flex-1 sm:flex-none text-xs"
          >
            Essential Only
          </button>
          <button
            type="button"
            onClick={() => setCookieConsentState('accepted')}
            className="btn-primary flex-1 sm:flex-none text-xs"
          >
            Accept Cookies
          </button>
        </div>
      </div>
    </div>
  );
};
