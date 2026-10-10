import React from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#dee4df] border-t-2 border-dashed border-[#e6b422] pt-12 pb-8 text-[#16261d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Col 1: System Info */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-md bg-[#1b5e3b] text-white flex items-center justify-center font-bold text-base">
                P
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-[#16261d]">PARKEASE</span>
                <p className="text-[10px] text-[#455549] uppercase font-semibold">Smart Parking System</p>
              </div>
            </div>
            <p className="text-xs text-[#455549] leading-relaxed mb-4">
              Web-based parking booking and management system for Chattogram City, Bangladesh.
            </p>
            <div className="p-3 bg-[#e8eee9] rounded-lg border border-[#cfd9d1] text-xs">
              <span className="font-semibold text-[#1b5e3b] block mb-0.5">Project Information</span>
              <p className="text-[11px] text-[#455549]">
                University CSE DBMS Project • MySQL & Python Architecture
              </p>
            </div>
          </div>

          {/* Col 2: Parking Areas */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#16261d] mb-3 bay-accent-line">
              Parking Areas
            </h4>
            <ul className="space-y-2 text-xs text-[#455549]">
              <li>
                <button onClick={() => onNavigate('parking-map')} className="hover:text-[#1b5e3b] transition">
                  ■ GEC Circle
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('parking-map')} className="hover:text-[#1b5e3b] transition">
                  ■ Agrabad Commercial Area
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('parking-map')} className="hover:text-[#1b5e3b] transition">
                  ■ Khulshi
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('parking-map')} className="hover:text-[#1b5e3b] transition">
                  ■ Bahaddarhat
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('parking-map')} className="hover:text-[#1b5e3b] transition">
                  ■ Patenga
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('parking-map')} className="hover:text-[#1b5e3b] transition">
                  ■ Chawkbazar
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Portals & Access */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#16261d] mb-3 bay-accent-line">
              Portals & Navigation
            </h4>
            <ul className="space-y-2 text-xs text-[#455549]">
              <li>
                <button onClick={() => onNavigate('user-login')} className="hover:text-[#1b5e3b] transition">
                  ■ User Login
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('user-register')} className="hover:text-[#1b5e3b] transition">
                  ■ User Registration
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('user-forgot-password')} className="hover:text-[#1b5e3b] transition">
                  ■ Reset Password
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('admin-login')} className="hover:text-[#1b5e3b] transition">
                  ■ Admin Login
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('terms')} className="hover:text-[#1b5e3b] transition">
                  ■ Terms of Service
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('privacy-policy')} className="hover:text-[#1b5e3b] transition">
                  ■ Privacy Policy
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Inquiries */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#16261d] mb-3 bay-accent-line">
              Contact & Support
            </h4>
            <div className="space-y-2 text-xs text-[#455549]">
              <p className="font-semibold text-[#16261d]">ParkEase Support Desk</p>
              <p className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#1b5e3b] shrink-0 mt-0.5" />
                <span>Chattogram, Bangladesh</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#1b5e3b] shrink-0" />
                <span>support@parkease-ctg.com</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-[#cfd9d1] flex flex-col sm:flex-row items-center justify-between text-xs text-[#455549] gap-4">
          <p>© 2026 ParkEase Chattogram. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('terms')} className="hover:text-[#1b5e3b] transition">
              Terms of Service
            </button>
            <button onClick={() => onNavigate('privacy-policy')} className="hover:text-[#1b5e3b] transition">
              Privacy Policy
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
