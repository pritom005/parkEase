import React, { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';

export const CookieBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('parkease_cookie_consent');
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('parkease_cookie_consent', 'accepted');
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('parkease_cookie_consent', 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 bg-[#e8eee9] border border-[#cfd9d1] rounded-lg p-4 shadow-xl neu-raised">
      <div className="flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#1b5e3b] shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-[#16261d]">Cookie & Session Notice</h4>
          <p className="text-xs text-[#455549] mt-1 leading-relaxed">
            ParkEase uses essential browser cookies to remember your login session and booking preferences.
            No 3rd-party advertising tracking is used.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleAccept}
              className="neu-btn-primary px-3 py-1.5 rounded text-xs font-semibold"
            >
              Accept Cookies
            </button>
            <button
              onClick={handleDecline}
              className="neu-btn-secondary px-3 py-1.5 rounded text-xs font-medium"
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
