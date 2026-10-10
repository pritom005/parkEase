import React from 'react';
import { Home, ArrowLeft } from 'lucide-react';

interface Props {
  onNavigate: (view: string) => void;
}

export const NotFound: React.FC<Props> = ({ onNavigate }) => {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
      <div className="neu-raised p-8 rounded-xl border border-[#cfd9d1] space-y-4">
        <span className="text-5xl font-mono font-extrabold text-[#1b5e3b] block">
          404
        </span>
        <h1 className="text-2xl font-bold text-[#16261d]">Page Not Found</h1>
        <p className="text-xs text-[#455549] max-w-md mx-auto">
          The page or parking slot you requested does not exist or may have been moved.
        </p>

        <div className="pt-4 flex justify-center gap-3">
          <button
            onClick={() => onNavigate('home')}
            className="neu-btn-primary px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </button>
          <button
            onClick={() => onNavigate('parking-map')}
            className="neu-btn-secondary px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>View Parking Areas</span>
          </button>
        </div>
      </div>
    </div>
  );
};
