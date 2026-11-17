import React from 'react';

interface FooterProps {
  onOpenLegal: (type: 'terms' | 'privacy') => void;
  onNavigateSearch: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenLegal, onNavigateSearch }) => {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        {/* Brand & Short Description */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[var(--bg-base)] text-[var(--primary-forest)] rounded-[8px] flex items-center justify-center font-bold text-base">
              P
            </div>
            <span className="footer-brand-title m-0">ParkEase</span>
          </div>
          <p className="footer-text max-w-xs m-0">
            Chattogram parking reservation system. Search and book open car or motorcycle bays before arriving at your destination.
          </p>
        </div>

        {/* Column 1: Parking Areas */}
        <div>
          <h4 className="footer-col-title uppercase tracking-wider pb-1 border-b border-[var(--accent-gold)]/60 w-fit">
            Parking Areas
          </h4>
          <ul className="footer-links">
            <li><button type="button" onClick={onNavigateSearch} className="footer-link bg-transparent border-0 p-0 cursor-pointer text-left">GEC Circle</button></li>
            <li><button type="button" onClick={onNavigateSearch} className="footer-link bg-transparent border-0 p-0 cursor-pointer text-left">Agrabad</button></li>
            <li><button type="button" onClick={onNavigateSearch} className="footer-link bg-transparent border-0 p-0 cursor-pointer text-left">Khulshi</button></li>
            <li><button type="button" onClick={onNavigateSearch} className="footer-link bg-transparent border-0 p-0 cursor-pointer text-left">Bahaddarhat</button></li>
            <li><button type="button" onClick={onNavigateSearch} className="footer-link bg-transparent border-0 p-0 cursor-pointer text-left">Patenga</button></li>
            <li><button type="button" onClick={onNavigateSearch} className="footer-link bg-transparent border-0 p-0 cursor-pointer text-left">Chawkbazar</button></li>
          </ul>
        </div>

        {/* Column 2: Portals and Navigation */}
        <div>
          <h4 className="footer-col-title uppercase tracking-wider pb-1 border-b border-[var(--accent-gold)]/60 w-fit">
            Portals and Navigation
          </h4>
          <ul className="footer-links">
            <li><a href="#hero" className="footer-link">Home</a></li>
            <li><button type="button" onClick={onNavigateSearch} className="footer-link bg-transparent border-0 p-0 cursor-pointer text-left">Find Parking</button></li>
            <li><a href="#how-it-works" className="footer-link">How It Works</a></li>
            <li><a href="#features" className="footer-link">Features</a></li>
            <li><a href="#about" className="footer-link">About ParkEase</a></li>
            <li><a href="#faq" className="footer-link">FAQ</a></li>
          </ul>
        </div>

        {/* Column 3: Contact and Support */}
        <div>
          <h4 className="footer-col-title uppercase tracking-wider pb-1 border-b border-[var(--accent-gold)]/60 w-fit">
            Contact and Support
          </h4>
          <p className="footer-text mb-3">
            ParkEase Support Desk
            <br />
            Chattogram, Bangladesh
          </p>
          <div className="text-[11px] text-[var(--text-on-primary-soft)] space-y-1">
            <div>Email: <span className="font-mono text-white">[OWNER TO PROVIDE]</span></div>
            <div>Phone: <span className="font-mono text-white">[OWNER TO PROVIDE]</span></div>
            <div>Address: <span className="font-mono text-white">[OWNER TO PROVIDE]</span></div>
          </div>
        </div>
      </div>

      {/* Bottom Legal Row */}
      <div className="footer-bottom flex-col sm:flex-row gap-3">
        <div>
          &copy; {new Date().getFullYear()} ParkEase. All rights reserved. Chattogram, Bangladesh.
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => onOpenLegal('terms')}
            className="footer-link underline bg-transparent border-0 p-0 cursor-pointer"
          >
            Terms and Conditions
          </button>
          <span className="opacity-60">|</span>
          <button
            type="button"
            onClick={() => onOpenLegal('privacy')}
            className="footer-link underline bg-transparent border-0 p-0 cursor-pointer"
          >
            Privacy Policy
          </button>
        </div>
      </div>
    </footer>
  );
};
