import React, { useState, useEffect, useRef } from 'react';
import { useParkEase } from '../context/ParkEaseContext';
import { SlotSearchResult, SuggestedTimeSlot } from '../types';
import {
  HeroLotSceneController,
  canUseHero3D,
  mountHeroParkingLot3D
} from '../utils/heroParkingLot3D';
import {
  Car,
  Bike,
  ArrowRight,
  MapPin,
  Layers,
  ShieldCheck,
  CreditCard,
  FileText,
  HelpCircle,
  ChevronDown,
  Lock,
  Search,
  Clock,
  Loader2,
  History
} from 'lucide-react';

interface PublicHomeProps {
  onSelectSlotForBooking: (
    slot: SlotSearchResult,
    searchParams: { date: string; time: string; duration: number }
  ) => void;
  onNavigateToTab: (tab: string) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenLegal?: (type: 'terms' | 'privacy') => void;
}

export const PublicHome: React.FC<PublicHomeProps> = ({
  onSelectSlotForBooking,
  onNavigateToTab,
  onOpenLegal
}) => {
  const { areas, slots, searchSlots, fetchSlotAvailability, refreshLiveData } = useParkEase();

  const activeAreas = areas.filter((a) => a.status === 'Active');

  // Search form state
  const [selectedAreaId, setSelectedAreaId] = useState<number>(activeAreas[0]?.area_id || 1);
  const [vehicleType, setVehicleType] = useState<'Car' | 'Motorcycle'>('Car');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];

  const [dateStr, setDateStr] = useState<string>(defaultDate);
  const [timeStr, setTimeStr] = useState<string>('09:00');
  const [durationHours, setDurationHours] = useState<number>(2);

  // Search results & real-time DB fetch progress
  const [searchResults, setSearchResults] = useState<SlotSearchResult[] | null>(null);
  const [suggestedTimes, setSuggestedTimes] = useState<SuggestedTimeSlot[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchProgress, setSearchProgress] = useState<number>(0);
  const [searchStage, setSearchStage] = useState<string>('');

  // FAQ accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Dynamic lookup and counts for the currently selected area (real DB data)
  const selectedArea =
    activeAreas.find((a) => a.area_id === Number(selectedAreaId)) || activeAreas[0];
  const currentAreaSlots = slots.filter(
    (s) => s.area_id === Number(selectedArea?.area_id ?? selectedAreaId)
  );
  const selectedAreaAvailableCount = currentAreaSlots.filter(
    (s) => s.status === 'Available'
  ).length;
  const heroSlots = currentAreaSlots.slice(0, 16);

  // Stage 1 fallback animation plays once on initial load only
  const [playLoadAnim, setPlayLoadAnim] = useState<boolean>(true);

  // Stage 2 Three.js canvas state and lifecycle refs
  const lotWrapRef = useRef<HTMLDivElement>(null);
  const lotCanvasRef = useRef<HTMLCanvasElement>(null);
  const lotControllerRef = useRef<HeroLotSceneController | null>(null);
  const latestHeroSlotsRef = useRef(heroSlots);
  latestHeroSlotsRef.current = heroSlots;

  const [use3DLot, setUse3DLot] = useState<boolean>(() => canUseHero3D());
  const [is3DReady, setIs3DReady] = useState<boolean>(false);

  const carSlot = currentAreaSlots.find((s) => s.vehicle_type === 'Car');
  const bikeSlot = currentAreaSlots.find((s) => s.vehicle_type === 'Motorcycle');

  const globalCarSlot = slots.find((s) => s.vehicle_type === 'Car');
  const globalBikeSlot = slots.find((s) => s.vehicle_type === 'Motorcycle');

  const carHourPrice = carSlot?.price_per_hour ?? globalCarSlot?.price_per_hour ?? 250;
  const carDayPrice = carSlot?.day_price ?? globalCarSlot?.day_price ?? 2000;
  const bikeHourPrice = bikeSlot?.price_per_hour ?? globalBikeSlot?.price_per_hour ?? 100;
  const bikeDayPrice = bikeSlot?.day_price ?? globalBikeSlot?.day_price ?? 1000;

  // Dynamic counts for the 4-tile summary strip
  const totalSlotsCount = slots.length;
  const carSlotsCount = slots.filter((s) => s.vehicle_type === 'Car').length;
  const bikeSlotsCount = slots.filter((s) => s.vehicle_type === 'Motorcycle').length;

  useEffect(() => {
    refreshLiveData();

    const bookingType = Number(durationHours) === 24 ? 'full_day' : 'hourly';
    const results = searchSlots(
      Number(selectedAreaId),
      vehicleType,
      dateStr,
      timeStr,
      Number(durationHours),
      bookingType
    );
    setSearchResults(results);

    // Clear initial SVG arrival animation flag once completed
    const animTimer = window.setTimeout(() => {
      setPlayLoadAnim(false);
    }, 1500);

    return () => window.clearTimeout(animTimer);
  }, []);

  // Keep selectedAreaId synced if areas load asynchronously
  useEffect(() => {
    if (
      activeAreas.length > 0 &&
      !activeAreas.some((a) => a.area_id === Number(selectedAreaId))
    ) {
      setSelectedAreaId(activeAreas[0].area_id);
    }
  }, [activeAreas, selectedAreaId]);

  // Mount Three.js lazily after page load when >= 600px, motion allowed, and WebGL present
  useEffect(() => {
    if (!use3DLot) {
      if (lotControllerRef.current) {
        lotControllerRef.current.dispose();
        lotControllerRef.current = null;
      }
      setIs3DReady(false);
      return;
    }

    const canvas = lotCanvasRef.current;
    if (!canvas) return;

    let cancelled = false;

    mountHeroParkingLot3D(canvas, latestHeroSlotsRef.current, () => {
      if (!cancelled) {
        setUse3DLot(false);
        setIs3DReady(false);
      }
    }).then((controller) => {
      if (cancelled) {
        controller?.dispose();
        return;
      }
      if (controller) {
        lotControllerRef.current = controller;
        controller.updateSlots(latestHeroSlotsRef.current);
        setIs3DReady(true);
      }
    });

    return () => {
      cancelled = true;
      if (lotControllerRef.current) {
        lotControllerRef.current.dispose();
        lotControllerRef.current = null;
      }
      setIs3DReady(false);
    };
  }, [use3DLot]);

  // Re-render 3D scene only when selected area slots change
  useEffect(() => {
    if (is3DReady && lotControllerRef.current) {
      lotControllerRef.current.updateSlots(heroSlots);
    }
  }, [is3DReady, selectedAreaId, slots]);

  // Ensure crisp canvas sizing right after swapping from SVG fallback to 3D canvas
  useEffect(() => {
    if (is3DReady && lotControllerRef.current) {
      lotControllerRef.current.resize();
    }
  }, [is3DReady]);

  // Re-render on resize and fall back to Stage 1 SVG below 600px
  useEffect(() => {
    const handleResize = () => {
      const allowed = canUseHero3D();
      if (!allowed) {
        setUse3DLot(false);
        return;
      }
      if (!use3DLot) {
        setUse3DLot(true);
        return;
      }
      lotControllerRef.current?.resize();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [use3DLot]);

  const executeAvailabilitySearch = async (
    targetAreaId: number,
    targetVehicleType: 'Car' | 'Motorcycle',
    targetDate: string,
    targetTime: string,
    targetDuration: number
  ) => {
    setIsSearching(true);
    setSearchProgress(8);
    setSearchStage('Connecting to database...');

    const bookingType = Number(targetDuration) === 24 ? 'full_day' : 'hourly';
    try {
      const response = await fetchSlotAvailability(
        {
          areaId: Number(targetAreaId),
          vehicleType: targetVehicleType,
          dateStr: targetDate,
          timeStr: targetTime,
          durationHours: Number(targetDuration),
          bookingType
        },
        (percent, stage) => {
          setSearchProgress(percent);
          setSearchStage(stage);
        }
      );
      setSearchResults(response.slots);
      setSuggestedTimes(response.suggestedTimes);
    } finally {
      window.setTimeout(() => {
        setIsSearching(false);
        setSearchProgress(0);
        setSearchStage('');
      }, 220);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeAvailabilitySearch(
      Number(selectedAreaId),
      vehicleType,
      dateStr,
      timeStr,
      Number(durationHours)
    );
  };

  const handleApplySuggestedTime = async (suggestion: SuggestedTimeSlot) => {
    setDateStr(suggestion.date);
    setTimeStr(suggestion.time);
    setDurationHours(suggestion.durationHours);
    await executeAvailabilitySearch(
      Number(selectedAreaId),
      vehicleType,
      suggestion.date,
      suggestion.time,
      suggestion.durationHours
    );
  };

  const handleSelectSlot = (slot: SlotSearchResult) => {
    onSelectSlotForBooking(slot, {
      date: dateStr,
      time: timeStr,
      duration: durationHours
    });
  };

  const handleAreaSelectFromCard = async (areaId: number) => {
    setSelectedAreaId(areaId);
    const formCard = document.getElementById('search-form-card');
    if (formCard) {
      formCard.scrollIntoView({ behavior: 'smooth' });
    }
    await executeAvailabilitySearch(
      Number(areaId),
      vehicleType,
      dateStr,
      timeStr,
      Number(durationHours)
    );
  };

  const faqs = [
    {
      q: 'How do I book a parking slot before leaving home?',
      a: 'Select your destination area in Chattogram, choose whether you drive a car or motorcycle, pick your arrival date, time, and duration (hourly or full day), then select an available slot to confirm.'
    },
    {
      q: 'How are hourly and full-day parking rates calculated?',
      a: `Rates come directly from the database per slot. Hourly bookings multiply the hourly rate by your chosen hours (Car: ${carHourPrice} BDT/hr, Motorcycle: ${bikeHourPrice} BDT/hr). Full-day (24 hours) bookings use the fixed day rate (Car: ${carDayPrice} BDT/day, Motorcycle: ${bikeDayPrice} BDT/day).`
    },
    {
      q: 'Can I cancel an upcoming booking?',
      a: 'Yes. Confirmed bookings can be cancelled directly from your Booking History page before the start time, releasing the slot back to Available.'
    },
    {
      q: 'Which payment channels are supported?',
      a: 'ParkEase supports bKash, Nagad, and Rocket mobile financial services as well as Visa and MasterCard.'
    },
    {
      q: 'What happens if I arrive after booking a slot?',
      a: 'Your assigned slot code is held for your booked window and can be reviewed anytime under Booking History.'
    }
  ];

  return (
    <div className="bg-[var(--bg-base)] text-[var(--text-ink)] space-y-14 pb-16">
      {/* =========================================================================
          SECTION 1: HERO (TWO COLUMNS + 4-CARD SUMMARY STRIP BELOW)
         ========================================================================= */}
      <section id="hero" className="hero-section">
        <div className="hero-grid">
          {/* Left Column */}
          <div>
            <span className="hero-label">Chattogram Parking System</span>

            <h1 className="hero-headline">
              Book a parking slot in Chattogram before you leave home
            </h1>

            <p className="hero-subtext">
              Making Parking Effortless across Chattogram. Check live slot availability across 6 city areas and reserve your car or motorcycle space with upfront hourly and full-day pricing.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="hero-cta-group">
              <button
                type="button"
                onClick={() => {
                  onNavigateToTab('register');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="btn-primary px-5 py-3 text-sm"
              >
                <span className="text-white">Create Account</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>

              <a href="#areas" className="btn-secondary px-5 py-3 text-sm">
                Explore Parking
              </a>
            </div>

            {/* 3-State Slot Guide Card (Available, Booked, Occupied only) */}
            <div className="soft-raised-static hero-slot-guide-card">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-heading)]">
                    Slot Status Guide
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    Three clear slot states across all Chattogram parking areas
                  </div>
                </div>
                <span className="badge-status badge-neutral">3 Slot States</span>
              </div>

              <div className="hero-slot-guide-row">
                {/* 1. Available */}
                <div className="hero-slot-guide-tile available">
                  <span className="slot-p-mark text-xs">P</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--status-available)]">
                    Available
                  </span>
                </div>

                {/* 2. Booked */}
                <div className="hero-slot-guide-tile booked">
                  <span className="w-7 h-7 rounded-[6px] bg-[var(--status-booked-bg)] text-[var(--status-booked)] flex items-center justify-center">
                    <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--status-booked)]">
                    Booked
                  </span>
                </div>

                {/* 3. Occupied */}
                <div className="hero-slot-guide-tile occupied">
                  <span className="w-7 h-7 rounded-[6px] bg-[var(--status-occupied-bg)] text-[var(--status-occupied)] flex items-center justify-center">
                    <Car className="w-3.5 h-3.5" aria-hidden="true" />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--status-occupied)]">
                    Occupied
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Quick Search & Reserve Card */}
          <div id="search-form-card" className="soft-raised-static hero-card">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--primary-forest)] mb-1">
              Quick Reservation
            </div>
            <h2 className="text-xl font-bold text-[var(--text-heading)] pb-3 mb-4 border-b-2 border-dashed border-[var(--accent-gold)]">
              Find and Reserve a Slot
            </h2>

            {/* Top-Down Parking Lot (3D Three.js when >= 600px + WebGL, Stage 1 SVG fallback otherwise) */}
            <div ref={lotWrapRef} className="hero-bay-svg-wrap">
              {use3DLot && (
                <canvas
                  ref={lotCanvasRef}
                  className="hero-lot-canvas"
                  style={{ display: is3DReady ? 'block' : 'none' }}
                  role="img"
                  aria-label="Top view of a parking lot showing available, booked and occupied bays"
                />
              )}

              {(!use3DLot || !is3DReady) && (
                <svg
                  viewBox="0 0 440 180"
                  preserveAspectRatio="xMidYMid meet"
                  className={`hero-lot-svg ${playLoadAnim ? 'hero-lot-animate' : ''}`}
                  xmlns="http://www.w3.org/2000/svg"
                  role="img"
                  aria-label="Top view of a parking lot showing available, booked and occupied bays"
                >
                  {/* Oat Milk lot ground */}
                  <rect x="0" y="0" width="440" height="180" fill="#E9E3D6" />

                  {/* Short curb wall on top */}
                  <rect x="10" y="6" width="420" height="6" rx="2" fill="#D5DDD7" stroke="#1B2A22" strokeWidth="1" />

                  {/* Center driving lane between top and bottom rows */}
                  <rect x="10" y="72" width="420" height="36" fill="#DDD6C7" />

                  {/* Small directional lane arrows */}
                  {[85, 220, 355].map((ax) => (
                    <g key={ax}>
                      <line x1={ax - 16} y1="90" x2={ax + 12} y2="90" stroke="#8A968D" strokeWidth="1.8" />
                      <polyline
                        points={`${ax + 6},86 ${ax + 13},90 ${ax + 6},94`}
                        fill="none"
                        stroke="#8A968D"
                        strokeWidth="1.8"
                      />
                    </g>
                  ))}

                  {/* Real database slots drawn in order across top row and bottom row (up to 16) */}
                  {(() => {
                    const topCount = Math.ceil(heroSlots.length / 2);
                    const topRow = heroSlots.slice(0, topCount);
                    const bottomRow = heroSlots.slice(topCount);
                    let animCounter = 0;

                    const renderSvgRow = (
                      row: typeof heroSlots,
                      rowY: number,
                      isTop: boolean
                    ) => {
                      if (row.length === 0) return null;
                      const maxWidth = 408;
                      const gap = row.length > 6 ? 5 : 8;
                      const rawWidths = row.map((s) => (s.vehicle_type === 'Motorcycle' ? 32 : 46));
                      const rawTotal =
                        rawWidths.reduce((a, b) => a + b, 0) + Math.max(0, row.length - 1) * gap;
                      const scale = rawTotal > maxWidth ? maxWidth / rawTotal : 1;
                      const totalWidth = rawTotal * scale;
                      let cursorX = (440 - totalWidth) / 2;

                      return row.map((slot, idx) => {
                        const bw = rawWidths[idx] * scale;
                        const bx = cursorX;
                        cursorX += bw + gap * scale;

                        const bh = 54;
                        const cx = bx + bw / 2;
                        const cy = rowY + bh / 2;
                        const isCar = slot.vehicle_type === 'Car';
                        const carColors = ['#1D4A35', '#143426', '#8D8678'];
                        const bodyFill = carColors[slot.slot_id % carColors.length];
                        const delayMs = slot.status === 'Occupied' ? animCounter++ * 40 : 0;

                        return (
                          <g key={slot.slot_id} className="hero-lot-bay">
                            <title>{`${slot.slot_number} (${slot.vehicle_type}) - ${slot.status}`}</title>
                            <text x={cx} y={cy} className="sr-only">
                              {`${slot.slot_number} ${slot.vehicle_type} ${slot.status}`}
                            </text>

                            {/* Thin 2px dashed yellow bay divider lines */}
                            <line
                              x1={bx}
                              y1={rowY + 2}
                              x2={bx}
                              y2={rowY + bh - 2}
                              stroke="#E6B422"
                              strokeWidth="2"
                              strokeDasharray="4,4"
                            />
                            {idx === row.length - 1 && (
                              <line
                                x1={bx + bw}
                                y1={rowY + 2}
                                x2={bx + bw}
                                y2={rowY + bh - 2}
                                stroke="#E6B422"
                                strokeWidth="2"
                                strokeDasharray="4,4"
                              />
                            )}

                            {/* Booked bay: empty with orange top edge line */}
                            {slot.status === 'Booked' && (
                              <line
                                x1={bx + 3}
                                y1={isTop ? rowY + 3 : rowY + bh - 3}
                                x2={bx + bw - 3}
                                y2={isTop ? rowY + 3 : rowY + bh - 3}
                                stroke="#C87619"
                                strokeWidth="3"
                              />
                            )}

                            {/* Available bay: empty with small green P mark */}
                            {slot.status === 'Available' && (
                              <g>
                                <rect
                                  x={cx - 10}
                                  y={cy - 10}
                                  width="20"
                                  height="20"
                                  rx="4"
                                  fill="#DCEFE2"
                                  stroke="#1D4A35"
                                  strokeWidth="1.5"
                                />
                                <text
                                  x={cx}
                                  y={cy + 4}
                                  textAnchor="middle"
                                  fill="#1D4A35"
                                  fontSize="11"
                                  fontWeight="bold"
                                  fontFamily="sans-serif"
                                >
                                  P
                                </text>
                              </g>
                            )}

                            {/* Occupied bay: top-down car or motorcycle */}
                            {slot.status === 'Occupied' && (
                              <g
                                className={`hero-lot-vehicle ${
                                  isTop ? 'hero-lot-vehicle-top' : 'hero-lot-vehicle-bottom'
                                }`}
                                style={{ '--car-delay': `${delayMs}ms` } as React.CSSProperties}
                              >
                                {isCar ? (
                                  <g>
                                    <rect
                                      x={cx - Math.min(13, bw * 0.34)}
                                      y={rowY + 6}
                                      width={Math.min(26, bw * 0.68)}
                                      height="42"
                                      rx="6"
                                      fill={bodyFill}
                                      stroke="#1B2A22"
                                      strokeWidth="1.4"
                                    />
                                    <rect
                                      x={cx - Math.min(9, bw * 0.24)}
                                      y={rowY + 15}
                                      width={Math.min(18, bw * 0.48)}
                                      height="22"
                                      rx="3"
                                      fill="#143426"
                                    />
                                    <rect
                                      x={cx - Math.min(8, bw * 0.22)}
                                      y={rowY + 10}
                                      width={Math.min(16, bw * 0.44)}
                                      height="6"
                                      rx="2"
                                      fill="#DCEBE2"
                                    />
                                    <rect
                                      x={cx - Math.min(8, bw * 0.22)}
                                      y={rowY + 37}
                                      width={Math.min(16, bw * 0.44)}
                                      height="5"
                                      rx="2"
                                      fill="#DCEBE2"
                                    />
                                  </g>
                                ) : (
                                  <g>
                                    <rect
                                      x={cx - 6}
                                      y={rowY + 11}
                                      width="12"
                                      height="32"
                                      rx="5"
                                      fill={bodyFill}
                                      stroke="#1B2A22"
                                      strokeWidth="1.2"
                                    />
                                    <rect
                                      x={cx - 9}
                                      y={isTop ? rowY + 32 : rowY + 16}
                                      width="18"
                                      height="3"
                                      rx="1.5"
                                      fill="#1B2A22"
                                    />
                                    <rect
                                      x={cx - 4}
                                      y={rowY + 20}
                                      width="8"
                                      height="12"
                                      rx="2"
                                      fill="#1B2A22"
                                    />
                                  </g>
                                )}
                              </g>
                            )}
                          </g>
                        );
                      });
                    };

                    return (
                      <>
                        {renderSvgRow(topRow, 15, true)}
                        {renderSvgRow(bottomRow, 112, false)}
                      </>
                    );
                  })()}
                </svg>
              )}
            </div>

            {/* Flat Caption Card under the parking lot visual */}
            {selectedArea && (
              <div className="hero-lot-caption">
                <div className="hero-lot-caption-info">
                  <div className="hero-lot-caption-name">
                    {selectedArea.area_name}
                  </div>
                  <div className="hero-lot-caption-location">{selectedArea.location}</div>
                </div>
                <span className="hero-lot-caption-badge">
                  Available: {selectedAreaAvailableCount} slots
                </span>
              </div>
            )}

            <form onSubmit={handleSearchSubmit} className="hero-search-form space-y-4">
              {/* Parking Area Select */}
              <div className="form-group m-0 hero-search-field">
                <label htmlFor="home-area-select" className="form-label">
                  Parking Area
                </label>
                <div className="relative">
                  <select
                    id="home-area-select"
                    value={selectedAreaId}
                    onChange={(e) => {
                      setPlayLoadAnim(false);
                      setSelectedAreaId(Number(e.target.value));
                    }}
                    className="form-select hero-search-control pr-8 font-semibold appearance-none"
                  >
                    {activeAreas.map((area) => {
                      const count = slots.filter((s) => s.area_id === area.area_id).length;
                      return (
                        <option key={area.area_id} value={area.area_id}>
                          {area.area_name} ({count} Slots)
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="hero-search-chevron w-4 h-4 text-[var(--text-muted)] absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Vehicle Type Selector */}
              <div>
                <span className="form-label block mb-1.5">Vehicle Type & Tariff</span>
                <div className="vehicle-type-group m-0" role="radiogroup" aria-label="Vehicle Type">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={vehicleType === 'Car'}
                    onClick={() => setVehicleType('Car')}
                    className={`vehicle-tile ${vehicleType === 'Car' ? 'selected' : ''}`}
                  >
                    <Car className="w-4 h-4 text-[var(--primary-forest)]" aria-hidden="true" />
                    <span className="text-xs font-bold text-[var(--text-heading)]">Car</span>
                    <span className="text-[11px] font-semibold text-[var(--text-muted)] tabular-nums">
                      {carHourPrice} BDT/hr | {carDayPrice}/day
                    </span>
                  </button>

                  <button
                    type="button"
                    role="radio"
                    aria-checked={vehicleType === 'Motorcycle'}
                    onClick={() => setVehicleType('Motorcycle')}
                    className={`vehicle-tile ${vehicleType === 'Motorcycle' ? 'selected' : ''}`}
                  >
                    <Bike className="w-4 h-4 text-[var(--primary-forest)]" aria-hidden="true" />
                    <span className="text-xs font-bold text-[var(--text-heading)]">Motorcycle</span>
                    <span className="text-[11px] font-semibold text-[var(--text-muted)] tabular-nums">
                      {bikeHourPrice} BDT/hr | {bikeDayPrice}/day
                    </span>
                  </button>
                </div>
              </div>

              {/* Date, Time, Duration Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="hero-search-field">
                  <label htmlFor="home-date" className="form-label block mb-1">
                    Arrival Date
                  </label>
                  <input
                    id="home-date"
                    type="date"
                    value={dateStr}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDateStr(e.target.value)}
                    className="form-input hero-search-control text-xs font-semibold"
                    required
                  />
                </div>

                <div className="hero-search-field">
                  <label htmlFor="home-time" className="form-label block mb-1">
                    Entry Time
                  </label>
                  <input
                    id="home-time"
                    type="time"
                    value={timeStr}
                    onChange={(e) => setTimeStr(e.target.value)}
                    className="form-input hero-search-control text-xs font-semibold"
                    required
                  />
                </div>

                <div className="hero-search-field">
                  <label htmlFor="home-duration" className="form-label block mb-1">
                    Duration
                  </label>
                  <select
                    id="home-duration"
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="form-select hero-search-control text-xs font-semibold"
                  >
                    <option value={1}>1 hour</option>
                    <option value={2}>2 hours</option>
                    <option value={3}>3 hours</option>
                    <option value={4}>4 hours</option>
                    <option value={6}>6 hours</option>
                    <option value={8}>8 hours</option>
                    <option value={24}>Full Day (24h)</option>
                  </select>
                </div>
              </div>

              {/* Submit Button with Real-Time Database Progress Indicator */}
              <div>
                <button
                  type="submit"
                  disabled={isSearching}
                  aria-busy={isSearching}
                  aria-label="Find Parking"
                  className="btn-primary btn-find-progress w-full py-3 text-xs uppercase tracking-wider"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-4 h-4 text-white animate-spin" aria-hidden="true" />
                      <span className="tabular-nums">
                        {searchStage || 'Checking Database...'} ({searchProgress}%)
                      </span>
                      <div
                        className="find-progress-track"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={searchProgress}
                        aria-label="Database availability fetch progress"
                      >
                        <div
                          className="find-progress-fill"
                          style={{ width: `${searchProgress}%` }}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 text-white" aria-hidden="true" />
                      <span>Find Parking</span>
                    </>
                  )}
                </button>
                {isSearching && (
                  <p
                    aria-live="polite"
                    className="mt-1.5 text-[11px] font-medium text-[var(--text-muted)] text-center tabular-nums"
                  >
                    {searchStage} ({searchProgress}%)
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Bottom 4-Tile Summary Bar (Directly under Hero Columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <div className="soft-raised-sm p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-[8px] bg-[var(--bg-tint)] border border-[var(--status-available-border)] text-[var(--primary-forest)] font-bold text-sm flex items-center justify-center shrink-0 tabular-nums">
              {activeAreas.length}
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--text-heading)]">
                {activeAreas.length} Parking Areas
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">Chattogram City Locations</div>
            </div>
          </div>

          <div className="soft-raised-sm p-4 flex items-center gap-3">
            <div className="slot-p-mark text-sm shrink-0">P</div>
            <div>
              <div className="text-xs font-bold text-[var(--text-heading)] tabular-nums">
                {totalSlotsCount} Total Slots
              </div>
              <div className="text-[11px] text-[var(--text-muted)] tabular-nums">
                {carSlotsCount} Car + {bikeSlotsCount} Motorcycle
              </div>
            </div>
          </div>

          <div className="soft-raised-sm p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-[8px] bg-[var(--bg-tint)] border border-[var(--status-available-border)] text-[var(--primary-forest)] font-bold text-sm flex items-center justify-center shrink-0">
              &#2547;
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--text-heading)]">Standard Rates</div>
              <div className="text-[11px] text-[var(--text-muted)] tabular-nums">
                Car: {carHourPrice}/hr | Bike: {bikeHourPrice}/hr
              </div>
            </div>
          </div>

          <div className="soft-raised-sm p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-[8px] bg-[var(--bg-tint)] border border-[var(--status-available-border)] text-[var(--primary-forest)] flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--text-heading)]">Flexible Payment</div>
              <div className="text-[11px] text-[var(--text-muted)]">bKash, Nagad, Rocket, Cards</div>
            </div>
          </div>
        </div>

        {/* Dynamic Search Results Grid + Suggested Times Fallback */}
        {searchResults && (
          <div className="mt-10 pt-6 border-t-2 border-dashed border-[var(--accent-gold)] space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-bold text-[var(--text-heading)]">
                Slots in {areas.find((a) => a.area_id === Number(selectedAreaId))?.area_name} ({vehicleType})
              </h3>
              <span className="text-xs font-semibold text-[var(--text-muted)] tabular-nums">
                {searchResults.filter((s) => s.status === 'Available').length} available for {dateStr} at {timeStr}
              </span>
            </div>

            {searchResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {searchResults.map((slot) => {
                  const isAvail = slot.status === 'Available';
                  const isBooked = slot.status === 'Booked';

                  return (
                    <div
                      key={slot.slot_id}
                      className={`find-slot-tile ${
                        isAvail ? 'is-available' : isBooked ? 'is-booked' : 'is-occupied'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-[var(--text-heading)]">
                            {slot.slot_number}
                          </span>
                          <span
                            className={`badge-status ${
                              isAvail
                                ? 'badge-available'
                                : isBooked
                                ? 'badge-booked'
                                : 'badge-occupied'
                            }`}
                          >
                            {slot.status}
                          </span>
                        </div>
                        <div className="text-[11px] font-semibold text-[var(--text-muted)] tabular-nums">
                          {slot.price_per_hour} BDT/hr | {slot.day_price}/day
                        </div>
                      </div>

                      <div className="mt-3">
                        {isAvail ? (
                          <button
                            type="button"
                            onClick={() => handleSelectSlot(slot)}
                            className="btn-primary w-full py-1.5 text-[11px]"
                          >
                            Book Slot
                          </button>
                        ) : (
                          <div className="text-center py-1 text-[10px] font-semibold text-[var(--text-muted)]">
                            Unavailable
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="soft-inset p-5 text-center">
                  <div className="text-sm font-bold text-[var(--text-heading)]">
                    No {vehicleType} Slots Found for {dateStr} at {timeStr}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1 m-0">
                    All {vehicleType.toLowerCase()} bays in{' '}
                    {areas.find((a) => a.area_id === Number(selectedAreaId))?.area_name} are
                    reserved during this window. Review the suggested next openings below.
                  </p>
                </div>

                {suggestedTimes.length > 0 && (
                  <div className="soft-raised-static p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-[var(--border-subtle)]">
                      <div>
                        <div className="flex items-center gap-2">
                          <History
                            className="w-4 h-4 text-[var(--primary-forest)]"
                            aria-hidden="true"
                          />
                          <h4 className="text-sm font-bold text-[var(--text-heading)] m-0">
                            Suggested Times
                          </h4>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5 m-0">
                          Next available windows in{' '}
                          {areas.find((a) => a.area_id === Number(selectedAreaId))?.area_name} based
                          on historical booking data.
                        </p>
                      </div>
                      <span className="badge-status badge-neutral">Historical Availability</span>
                    </div>

                    <div className="suggested-times-grid">
                      {suggestedTimes.map((item) => {
                        const firstSlot = item.slots[0];
                        return (
                          <div key={`${item.date}_${item.time}`} className="suggested-time-tile">
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--text-heading)] tabular-nums">
                                  <Clock
                                    className="w-3.5 h-3.5 text-[var(--primary-forest)]"
                                    aria-hidden="true"
                                  />
                                  <span>{item.time}</span>
                                </span>
                                <span className="badge-status badge-available tabular-nums">
                                  {item.isProjectedTurnover
                                    ? `${item.availableCount} Projected`
                                    : `${item.availableCount} Open`}
                                </span>
                              </div>

                              <div className="text-xs font-semibold text-[var(--text-ink)] tabular-nums">
                                {item.date} ({item.durationHours}h)
                              </div>

                              <div className="text-[11px] text-[var(--text-muted)] mt-1">
                                {item.historicalReason}
                              </div>

                              {firstSlot && (
                                <div className="text-[11px] font-semibold text-[var(--primary-forest)] mt-1.5 tabular-nums">
                                  Slots:{' '}
                                  {item.slots
                                    .slice(0, 3)
                                    .map((s) => s.slot_number)
                                    .join(', ')}{' '}
                                  ({firstSlot.calculated_total} BDT)
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              disabled={isSearching}
                              onClick={() => handleApplySuggestedTime(item)}
                              className="btn-secondary w-full py-1.5 text-xs"
                            >
                              Check {item.time} Slots
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* =========================================================================
          SECTION 2: PARKING AREAS (6 APPROVED CHATTOGRAM AREAS)
         ========================================================================= */}
      <section id="areas" className="home-section pt-2">
        <div className="pb-3 mb-6 border-b-2 border-dashed border-[var(--accent-gold)]">
          <h2 className="home-section-title">Parking Areas in Chattogram</h2>
          <p className="home-section-desc">
            Parking locations across the city with real-time slot inventory.
          </p>
        </div>

        <div className="area-cards-grid">
          {activeAreas.map((area) => {
            const areaSlots = slots.filter((s) => s.area_id === area.area_id);
            const availableCount = areaSlots.filter((s) => s.status === 'Available').length;
            const carSlotInArea = areaSlots.find((s) => s.vehicle_type === 'Car');
            const bikeSlotInArea = areaSlots.find((s) => s.vehicle_type === 'Motorcycle');

            return (
              <div key={area.area_id} className="soft-raised area-card">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-base font-bold text-[var(--text-heading)]">{area.area_name}</h3>
                    <span className="badge-status badge-available tabular-nums">
                      {availableCount} open
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mb-4 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[var(--primary-forest)] shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{area.location}</span>
                  </p>
                </div>

                <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                  <div className="text-xs text-[var(--text-ink)] font-semibold tabular-nums">
                    Car {carSlotInArea?.price_per_hour ?? 250}/hr | Bike {bikeSlotInArea?.price_per_hour ?? 100}/hr
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAreaSelectFromCard(area.area_id)}
                    className="btn-primary text-xs px-3.5 py-1.5"
                  >
                    View Parking
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: HOW IT WORKS (4 STEPS)
         ========================================================================= */}
      <section id="how-it-works" className="home-section">
        <div className="pb-3 mb-6 border-b-2 border-dashed border-[var(--accent-gold)]">
          <h2 className="home-section-title">How It Works</h2>
          <p className="home-section-desc">
            Four steps to reserve your parking slot before setting out.
          </p>
        </div>

        <div className="how-it-works-grid">
          {[
            {
              num: '01',
              title: 'Select Destination',
              desc: 'Choose from 6 Chattogram areas: GEC Circle, Agrabad, Khulshi, Bahaddarhat, Patenga, or Chawkbazar.'
            },
            {
              num: '02',
              title: 'Choose Time & Vehicle',
              desc: 'Pick car or motorcycle, select your arrival time, and choose hourly or 24-hour full-day duration.'
            },
            {
              num: '03',
              title: 'Confirm & Pay',
              desc: 'Review the exact tariff calculated from database rates and complete payment via bKash, Nagad, Rocket, or Card.'
            },
            {
              num: '04',
              title: 'Park Without Delay',
              desc: 'Present your confirmed booking details at the parking area and drive straight to your assigned slot.'
            }
          ].map((step) => (
            <div key={step.num} className="soft-raised step-card">
              <div className="step-badge">{step.num}</div>
              <h3 className="text-sm font-bold text-[var(--text-heading)] mb-1.5">{step.title}</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed m-0">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: FEATURES (6 CARDS)
         ========================================================================= */}
      <section id="features" className="home-section">
        <div className="pb-3 mb-6 border-b-2 border-dashed border-[var(--accent-gold)]">
          <h2 className="home-section-title">Platform Features</h2>
          <p className="home-section-desc">
            Built for clear availability checks and straightforward parking bookings in Chattogram.
          </p>
        </div>

        <div className="features-grid">
          {[
            {
              icon: Layers,
              title: 'Live Slot Availability',
              desc: 'Slot availability updates immediately across all 6 Chattogram parking locations whenever bookings change.'
            },
            {
              icon: ShieldCheck,
              title: 'Fixed Database Pricing',
              desc: 'Upfront rates with no hidden charges: hourly or full-day 24-hour bookings calculated directly by the server.'
            },
            {
              icon: Car,
              title: 'Car & Motorcycle Slots',
              desc: 'Separate slots sized for four-wheelers and two-wheelers with distinct hourly and daily tariffs.'
            },
            {
              icon: CreditCard,
              title: 'Mobile Banking & Cards',
              desc: 'Complete payments using bKash, Nagad, Rocket, Visa, or MasterCard.'
            },
            {
              icon: FileText,
              title: 'Booking History & Receipts',
              desc: 'View upcoming bookings, cancel when needed, and review your payment receipts anytime.'
            },
            {
              icon: HelpCircle,
              title: 'Double-Booking Protection',
              desc: 'Server-side overlap validation prevents conflicting reservations on the same slot time window.'
            }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="soft-raised feature-card">
                <div className="w-8 h-8 rounded-[8px] bg-[var(--bg-tint)] text-[var(--primary-forest)] flex items-center justify-center mb-3 border border-[var(--status-available-border)]">
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </div>
                <h3 className="text-sm font-bold text-[var(--text-heading)] mb-1.5">{item.title}</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed m-0">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: ABOUT PARKEASE
         ========================================================================= */}
      <section id="about" className="home-section">
        <div className="pb-3 mb-6 border-b-2 border-dashed border-[var(--accent-gold)]">
          <h2 className="home-section-title">About ParkEase</h2>
          <p className="home-section-desc">
            Making Chattogram parking straightforward and predictable.
          </p>
        </div>

        <div className="soft-raised-static p-6 sm:p-8 space-y-4">
          <p className="text-sm text-[var(--text-ink)] leading-relaxed m-0">
            ParkEase is Chattogram's parking reservation portal designed to remove guesswork from city driving. By checking open slots before leaving home, drivers save time and avoid circling busy commercial zones.
          </p>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed m-0">
            Active locations cover GEC Circle, Agrabad, Khulshi, Bahaddarhat, Patenga, and Chawkbazar, supporting both hourly and 24-hour full-day parking.
          </p>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: TERMS AND PRIVACY CARDS
         ========================================================================= */}
      <section id="terms-block" className="home-section">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="soft-raised p-5">
            <h3 className="text-sm font-bold text-[var(--text-heading)] mb-1.5 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[var(--primary-forest)]" aria-hidden="true" />
              <span>Terms and Conditions</span>
            </h3>
            <p className="text-xs text-[var(--text-muted)] mb-3 leading-relaxed">
              Read our reservation guidelines, cancellation policy, and facility usage terms.
            </p>
            <button
              type="button"
              onClick={() => onOpenLegal && onOpenLegal('terms')}
              className="text-xs font-bold text-[var(--primary-forest)] hover:underline inline-flex items-center gap-1 bg-transparent border-0 p-0 cursor-pointer"
            >
              <span>View Terms</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="soft-raised p-5">
            <h3 className="text-sm font-bold text-[var(--text-heading)] mb-1.5 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[var(--primary-forest)]" aria-hidden="true" />
              <span>Privacy Policy</span>
            </h3>
            <p className="text-xs text-[var(--text-muted)] mb-3 leading-relaxed">
              Learn how your account information and vehicle details are stored and protected.
            </p>
            <button
              type="button"
              onClick={() => onOpenLegal && onOpenLegal('privacy')}
              className="text-xs font-bold text-[var(--primary-forest)] hover:underline inline-flex items-center gap-1 bg-transparent border-0 p-0 cursor-pointer"
            >
              <span>View Privacy</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: FAQ
         ========================================================================= */}
      <section id="faq" className="home-section">
        <div className="pb-3 mb-6 border-b-2 border-dashed border-[var(--accent-gold)]">
          <h2 className="home-section-title">Frequently Asked Questions</h2>
          <p className="home-section-desc">
            Common questions about reserving slots, rates, and payments.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className="soft-raised-static overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="w-full px-5 py-4 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-[var(--text-heading)] hover:text-[var(--primary-forest)] bg-transparent border-0 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[var(--primary-forest)] transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-xs text-[var(--text-muted)] leading-relaxed border-t border-[var(--border-subtle)] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          SECTION 8: CONTACT
         ========================================================================= */}
      <section id="contact" className="home-section">
        <div className="pb-3 mb-6 border-b-2 border-dashed border-[var(--accent-gold)]">
          <h2 className="home-section-title">Contact & Operations Desk</h2>
          <p className="home-section-desc">
            Get in touch with the Chattogram parking management team.
          </p>
        </div>

        <div className="soft-raised-static p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div>
              <div className="font-bold text-[var(--text-heading)] uppercase tracking-wider mb-1.5">
                Office Location
              </div>
              <p className="text-[var(--text-muted)] leading-relaxed m-0">
                ParkEase Operations Desk
                <br />
                Chattogram City, Bangladesh
                <br />
                Address: <span className="font-mono text-[var(--text-heading)]">[OWNER TO PROVIDE]</span>
              </p>
            </div>

            <div>
              <div className="font-bold text-[var(--text-heading)] uppercase tracking-wider mb-1.5">
                Support Channels
              </div>
              <p className="text-[var(--text-muted)] leading-relaxed m-0">
                Email: <span className="font-mono text-[var(--text-heading)]">[OWNER TO PROVIDE]</span>
                <br />
                Phone: <span className="font-mono text-[var(--text-heading)]">[OWNER TO PROVIDE]</span>
              </p>
            </div>

            <div>
              <div className="font-bold text-[var(--text-heading)] uppercase tracking-wider mb-1.5">
                Operating Hours
              </div>
              <p className="text-[var(--text-muted)] leading-relaxed m-0">
                Customer Support: 24/7
                <br />
                Parking facilities open 24 hours daily.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
