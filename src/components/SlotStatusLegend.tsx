import React from 'react';
import { CheckCircle2, Clock, Car, Info } from 'lucide-react';

interface SlotStatusLegendProps {
  className?: string;
  id?: string;
}

/**
 * SlotStatusLegend Component
 *
 * Renders a semantic <section> element containing visual representations
 * of the three parking slot states defined in src/index.css & css/style.css:
 *  - 'Available': .slot-tile-available with a prominent 'P' mark and 'Available' label
 *  - 'Booked':    .slot-tile-booked with an orange top border and 'Booked' label
 *  - 'Occupied':  .slot-tile-occupied with an inset well and 'Occupied' label
 *
 * Accessibility:
 *  - Semantic HTML (<section>, <header>, <ul role="list">, <li>, <article>, <footer>)
 *  - Meets WCAG AA contrast requirements against the #E9E3D6 Oat Milk background
 *  - Screen reader friendly labels and status attributes
 */
export const SlotStatusLegend: React.FC<SlotStatusLegendProps> = ({
  className = '',
  id = 'slot-status-legend'
}) => {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={`bg-[#E9E3D6] rounded-[12px] p-5 sm:p-6 shadow-[6px_6px_14px_#C9C1B0,-6px_-6px_14px_#FBF8F1] border border-[#FBF8F1] ${className}`}
    >
      {/* Header section with accessible landmark and heading */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 mb-4 border-b border-[#C9C1B0]/60 gap-2">
        <div>
          <div className="flex items-center space-x-1.5 mb-1">
            <Info className="w-3.5 h-3.5 text-[#1D4A35]" aria-hidden="true" />
            <span className="caption-3 uppercase tracking-wider text-[#1D4A35] font-bold">
              Visual Guide
            </span>
          </div>
          <h3
            id={`${id}-heading`}
            className="title-2 text-[#143426] font-bold tracking-tight"
          >
            Parking Slot Status Guide
          </h3>
        </div>
        <p className="caption-2 text-[#1B2A22] max-w-md">
          Tactile neumorphic elevation, distinct iconography, and WCAG AA labels identify each bay state.
        </p>
      </header>

      {/* Semantic list containing the three slot state tiles */}
      <ul
        role="list"
        aria-label="Parking slot status definitions"
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* 1. Available State: using .slot-tile-available with green 'P' mark */}
        <li className="flex">
          <article
            aria-label="Available slot: Raised tile with green P mark"
            className="slot-tile-available w-full flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="slot-p-mark" aria-hidden="true">
                    P
                  </div>
                  <h4 className="title-3 font-bold text-[#143426]">
                    Slot C-01
                  </h4>
                </div>

                <span
                  role="status"
                  aria-label="Status: Available"
                  className="slot-badge-available slot-status-label"
                >
                  Available
                </span>
              </div>

              <p className="caption-2 text-[#1B2A22] leading-relaxed">
                Raised tactile surface with Forest Green P mark. Open and ready for immediate reservation.
              </p>
            </div>

            <footer className="mt-3 pt-2.5 border-t border-[#C9C1B0]/60 flex items-center space-x-2 text-[#1D4A35] caption-4 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#1D4A35]" aria-hidden="true" />
              <span>Open for instant booking</span>
            </footer>
          </article>
        </li>

        {/* 2. Booked State: using .slot-tile-booked with orange top border */}
        <li className="flex">
          <article
            aria-label="Booked slot: Flat tile with orange top border"
            className="slot-tile-booked w-full flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2.5">
                  <div
                    className="w-7 h-7 bg-[#8A4B00] text-white rounded-[6px] flex items-center justify-center font-bold text-xs"
                    aria-hidden="true"
                  >
                    <Clock className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <h4 className="title-3 font-bold text-[#143426]">
                    Slot C-02
                  </h4>
                </div>

                <span
                  role="status"
                  aria-label="Status: Booked"
                  className="slot-badge-booked slot-status-label"
                >
                  Booked
                </span>
              </div>

              <p className="caption-2 text-[#1B2A22] leading-relaxed">
                Flat matte surface with orange top stripe. Reserved in advance by another driver.
              </p>
            </div>

            <footer className="mt-3 pt-2.5 border-t border-[#C9C1B0]/60 flex items-center space-x-2 text-[#7A3E00] caption-4 font-bold">
              <Clock className="w-4 h-4 shrink-0 text-[#8A4B00]" aria-hidden="true" />
              <span>Reserved for confirmed driver</span>
            </footer>
          </article>
        </li>

        {/* 3. Occupied State: using .slot-tile-occupied with pressed-in inset well */}
        <li className="flex">
          <article
            aria-label="Occupied slot: Pressed-in tile with dim text"
            className="slot-tile-occupied w-full flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2.5">
                  <div
                    className="w-7 h-7 bg-[#8A1C1C] text-white rounded-[6px] flex items-center justify-center font-bold text-xs shadow-[inset_1px_1px_2px_#5A1010]"
                    aria-hidden="true"
                  >
                    <Car className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <h4 className="title-3 font-bold text-[#4A5148]">
                    Slot M-01
                  </h4>
                </div>

                <span
                  role="status"
                  aria-label="Status: Occupied"
                  className="slot-badge-occupied slot-status-label"
                >
                  Occupied
                </span>
              </div>

              <p className="caption-2 text-[#4A5148] leading-relaxed">
                Pressed-in inset surface with dimmed typography. Vehicle is physically parked in the bay.
              </p>
            </div>

            <footer className="mt-3 pt-2.5 border-t border-[#C9C1B0]/60 flex items-center space-x-2 text-[#8A1C1C] caption-4 font-bold">
              <Car className="w-4 h-4 shrink-0 text-[#8A1C1C]" aria-hidden="true" />
              <span>Vehicle physically on site</span>
            </footer>
          </article>
        </li>
      </ul>
    </section>
  );
};

export const SlotLegend = SlotStatusLegend;
export default SlotStatusLegend;
