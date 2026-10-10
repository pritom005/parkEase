import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mockDb } from '../../db/mockDb';
import { ParkingSlot, Vehicle, VehicleType } from '../../types';
import {
  Car,
  Bike,
  Clock,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Plus,
} from 'lucide-react';

interface Props {
  initialSlotId?: number;
  initialAreaId?: number;
  onNavigate: (view: string, extra?: any) => void;
}

export const UserBooking: React.FC<Props> = ({
  initialSlotId = 4,
  initialAreaId = 1,
  onNavigate,
}) => {
  const { currentUser } = useAuth();
  const userId = currentUser?.user_id || 2;
  const vehicles = mockDb.getVehiclesByUserId(userId);

  // Selected slot & area
  const [slotId, setSlotId] = useState<number>(initialSlotId);
  const slot = mockDb.getSlotById(slotId) || mockDb.getSlotById(4)!;
  const area = mockDb.getAreaById(slot.area_id) || mockDb.getAreaById(1)!;

  // Selected vehicle (auto-select compatible one)
  const defaultCompatibleVehicle = vehicles.find((v) => v.vehicle_type === slot.vehicle_type) || vehicles[0];
  const [selectedVehicleId, setSelectedVehicleId] = useState<number>(
    defaultCompatibleVehicle ? defaultCompatibleVehicle.vehicle_id : 1
  );

  // Schedule parameters
  const [bookingDate, setBookingDate] = useState<string>('2026-10-10');
  const [bookingTime, setBookingTime] = useState<string>('14:00');
  const [isFullDay, setIsFullDay] = useState<boolean>(false);
  const [durationHours, setDurationHours] = useState<number>(2);

  // Hold timer countdown
  const [secondsLeft, setSecondsLeft] = useState<number>(890); // ~14 mins 50s
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const selectedVehicle = vehicles.find((v) => v.vehicle_id === selectedVehicleId);
  const isVehicleCompatible = selectedVehicle ? selectedVehicle.vehicle_type === slot.vehicle_type : false;

  // Price calculations using authoritative hourly rates (Car: BDT 250/hr, Bike: BDT 100/hr)
  const effectiveVehicleType = selectedVehicle?.vehicle_type || slot.vehicle_type;
  const applicableHourlyRate = effectiveVehicleType === 'Car' ? 250 : 100;
  const totalHours = isFullDay ? 24 : durationHours;
  const totalPrice = isFullDay
    ? (effectiveVehicleType === 'Car' ? area.car_rate_daily : area.motorcycle_rate_daily)
    : applicableHourlyRate * totalHours;

  const [error, setError] = useState<string | null>(null);

  const handleProceed = () => {
    setError(null);

    if (!selectedVehicle) {
      setError('Please select a registered vehicle');
      return;
    }

    if (!isVehicleCompatible) {
      setError(`Incompatible vehicle: Bay ${slot.slot_number} is designated for ${slot.vehicle_type}s only.`);
      return;
    }

    // Call MockDb to create booking with strict double-check overlap rule!
    const res = mockDb.createBooking({
      userId,
      vehicleId: selectedVehicle.vehicle_id,
      slotId: slot.slot_id,
      bookingDate,
      bookingTime,
      durationHours: totalHours,
    });

    if (res.success && res.booking) {
      onNavigate('user-payment', { bookingId: res.booking.booking_id });
    } else {
      setError(res.error || 'Slot is no longer available. Please select another bay.');
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header and Step Indicator */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-[#455549] mb-1">
          <span>PARKEASE PORTAL</span>
          <span>&gt;</span>
          <span className="text-[#1b5e3b] font-bold">RESERVATION PIPELINE</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#16261d] tracking-tight">
          Slot Reservation & Booking
        </h1>
        <p className="text-xs text-[#455549] mt-1">
          Complete your municipal parking bay reservation in Chattogram. Review selected bay, link permitted vehicle, set entry schedule, and proceed to payment clearance.
        </p>

        {/* 5-Step Indicator */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4 text-xs font-semibold">
          <div className="p-2.5 bg-[#eff5f0] text-[#1b5e3b] rounded-lg border border-[#cfd9d1] flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>01 Search</span>
          </div>
          <div className="p-2.5 bg-[#eff5f0] text-[#1b5e3b] rounded-lg border border-[#cfd9d1] flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>02 Bay Selection</span>
          </div>
          <div className="p-2.5 bg-[#1b5e3b] text-white rounded-lg shadow-sm flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-[#e6b422] text-[#16261d] flex items-center justify-center text-[10px] font-bold">3</span>
            <span>03 Vehicle & Schedule</span>
          </div>
          <div className="p-2.5 bg-[#e8eee9] text-[#455549] rounded-lg border border-[#cfd9d1]">
            <span>04 Review & Payment</span>
          </div>
          <div className="p-2.5 bg-[#e8eee9] text-[#455549] rounded-lg border border-[#cfd9d1]">
            <span>05 Confirmation</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Left Steps, Right Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Allocated Bay Terminal Card */}
          <div className="neu-raised p-6 rounded-xl border border-[#cfd9d1] space-y-4">
            <div className="flex items-center justify-between border-b border-[#cfd9d1] pb-3">
              <div>
                <span className="text-[10px] font-mono text-[#455549] uppercase block font-semibold">
                  ALLOCATED BAY TERMINAL
                </span>
                <h3 className="text-lg font-bold text-[#16261d]">{area.area_name}</h3>
              </div>
              <div className="flex items-center gap-1 text-xs font-mono font-bold text-[#1b5e3b] bg-[#dcefe3] px-2.5 py-1 rounded">
                <Clock className="w-3.5 h-3.5" />
                <span>Hold Expires: {formatTimer(secondsLeft)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-white rounded-lg border border-[#cfd9d1]">
                <span className="text-[10px] text-[#455549] uppercase font-semibold block">ZONE & SLOT ID</span>
                <strong className="text-sm font-bold text-[#16261d] font-mono">
                  Bay {slot.slot_number}
                </strong>
                <span className="text-[10px] text-[#455549] block">{slot.zone}</span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-[#cfd9d1]">
                <span className="text-[10px] text-[#455549] uppercase font-semibold block">BAY SPECIFICATION</span>
                <strong className="text-sm font-bold text-[#16261d]">
                  Standard {slot.vehicle_type} Bay
                </strong>
                <span className="text-[10px] text-[#455549] block">Max clearance 2.4m</span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-[#cfd9d1]">
                <span className="text-[10px] text-[#455549] uppercase font-semibold block">TARIFF CATEGORY</span>
                <strong className="text-sm font-bold text-[#16261d] font-mono">
                  {slot.price_per_hour} BDT / hr
                </strong>
                <span className="text-[10px] text-[#455549] block">CDA Gazette Rate</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-[#455549]">{area.location}</span>
              <button
                type="button"
                onClick={() => onNavigate('parking-map')}
                className="text-xs font-semibold text-[#1b5e3b] hover:underline"
              >
                Change Bay
              </button>
            </div>
          </div>

          {/* Select Permitted Vehicle */}
          <div className="neu-raised p-6 rounded-xl border border-[#cfd9d1] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#16261d]">Select Permitted Vehicle</h3>
                <p className="text-xs text-[#455549]">
                  Assigned plate number is synced automatically with Chattogram gate boom sensors.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('user-vehicles')}
                className="neu-btn-secondary px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register Vehicle</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {vehicles.map((v) => {
                const isSelected = selectedVehicleId === v.vehicle_id;
                const isCompatible = v.vehicle_type === slot.vehicle_type;

                return (
                  <div
                    key={v.vehicle_id}
                    onClick={() => setSelectedVehicleId(v.vehicle_id)}
                    className={`p-4 rounded-xl border transition cursor-pointer select-none ${
                      isSelected
                        ? isCompatible
                          ? 'neu-pressed bg-[#dcefe3] border-2 border-[#1b5e3b]'
                          : 'neu-pressed bg-red-50 border-2 border-red-500'
                        : isCompatible
                        ? 'neu-raised-sm bg-[#e8eee9] hover:bg-[#dee4df] border-[#cfd9d1]'
                        : 'bg-[#e8eee9] border-[#cfd9d1] opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {v.vehicle_type === 'Car' ? (
                          <Car className="w-4 h-4 text-[#1b5e3b]" />
                        ) : (
                          <Bike className="w-4 h-4 text-[#1b5e3b]" />
                        )}
                        <span className="text-xs font-bold text-[#16261d]">
                          {v.brand} {v.model}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                          !isCompatible
                            ? 'bg-red-100 text-red-700'
                            : isSelected
                            ? 'bg-[#1b5e3b] text-white'
                            : 'bg-[#eff5f0] text-[#455549]'
                        }`}
                      >
                        {!isCompatible ? 'INCOMPATIBLE' : isSelected ? 'SELECTED' : 'READY'}
                      </span>
                    </div>

                    <div className="p-2 bg-white rounded border border-[#cfd9d1] font-mono text-xs font-bold text-[#16261d]">
                      {v.vehicle_number}
                    </div>

                    {!isCompatible && (
                      <span className="text-[10px] text-red-700 font-medium block mt-2">
                        Bay {slot.slot_number} is designated for {slot.vehicle_type}s only.
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reservation Schedule */}
          <div className="neu-raised p-6 rounded-xl border border-[#cfd9d1] space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#16261d]">Reservation Schedule</h3>
              <p className="text-xs text-[#455549]">
                Set expected entry time to calibrate smart barrier fast-track sensor windows.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#16261d] mb-1">Arrival Date</label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full p-2.5 rounded-lg text-xs neu-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#16261d] mb-1">Expected Arrival Time</label>
                <input
                  type="time"
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full p-2.5 rounded-lg text-xs neu-input"
                />
              </div>
            </div>

            {/* Booking Duration Mode */}
            <div>
              <label className="block text-xs font-semibold text-[#16261d] mb-1">Booking Duration</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsFullDay(false)}
                  className={`p-3 rounded-lg text-left transition ${
                    !isFullDay
                      ? 'bg-[#dcefe3] border-2 border-[#1b5e3b] neu-pressed-sm'
                      : 'neu-raised-sm hover:bg-[#dee4df]'
                  }`}
                >
                  <strong className="text-xs font-bold block text-[#16261d]">Custom Hourly Blocks</strong>
                  <span className="text-[11px] text-[#455549]">
                    Rate: {applicableHourlyRate} BDT / hour ({effectiveVehicleType})
                  </span>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-semibold">Hours:</span>
                    <select
                      value={durationHours}
                      onChange={(e) => setDurationHours(Number(e.target.value))}
                      disabled={isFullDay}
                      className="p-1 rounded text-xs neu-input bg-white"
                    >
                      {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((h) => (
                        <option key={h} value={h}>
                          {h} Hour{h > 1 ? 's' : ''} ({h * applicableHourlyRate} BDT)
                        </option>
                      ))}
                    </select>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsFullDay(true)}
                  className={`p-3 rounded-lg text-left transition ${
                    isFullDay
                      ? 'bg-[#dcefe3] border-2 border-[#1b5e3b] neu-pressed-sm'
                      : 'neu-raised-sm hover:bg-[#dee4df]'
                  }`}
                >
                  <strong className="text-xs font-bold block text-[#16261d]">Full Day (24 Hours)</strong>
                  <span className="text-[11px] text-[#455549]">
                    Flat municipal tariff:{' '}
                    {slot.vehicle_type === 'Car' ? area.car_rate_daily : area.motorcycle_rate_daily} BDT
                  </span>
                  <span className="text-[10px] text-[#1b5e3b] font-semibold block mt-3">
                    Recommended for daily office commuters
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Summary Card (4 Cols) */}
        <div className="lg:col-span-4 neu-raised p-6 rounded-xl border border-[#cfd9d1] space-y-5 sticky top-24">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-[#16261d]">Booking Summary</h3>
              <span className="text-[10px] font-mono text-[#1b5e3b] font-bold bg-[#dcefe3] px-2 py-0.5 rounded">
                VERIFIED
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#455549] block">Ref No: CTG-RES-2025-0982</span>
          </div>

          <div className="space-y-2 text-xs py-3 border-y border-[#cfd9d1] text-[#455549]">
            <div className="flex justify-between">
              <span>Municipal Hub:</span>
              <strong className="text-[#16261d]">{area.area_name}</strong>
            </div>
            <div className="flex justify-between">
              <span>Selected Bay:</span>
              <strong className="text-[#16261d] font-mono font-bold">
                Bay {slot.slot_number} ({slot.vehicle_type})
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Permitted Vehicle:</span>
              <strong className="text-[#16261d]">
                {selectedVehicle ? selectedVehicle.model : 'None Selected'}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Arrival Time:</span>
              <strong className="text-[#16261d]">{bookingDate}, {bookingTime}</strong>
            </div>
            <div className="flex justify-between">
              <span>Duration:</span>
              <strong className="text-[#16261d]">
                {isFullDay ? '24 Hours (Full Day)' : `${durationHours} Hours`}
              </strong>
            </div>
          </div>

          <div className="p-3 bg-[#eff5f0] rounded-lg border border-[#cfd9d1] space-y-1 text-xs">
            <div className="flex justify-between text-[#455549]">
              <span>Base Tariff:</span>
              <span className="font-mono">{totalPrice} BDT</span>
            </div>
            <div className="flex justify-between text-[#455549]">
              <span>Municipal Service Fee:</span>
              <span className="font-mono text-[#1b5e3b] font-semibold">0 BDT (Waived)</span>
            </div>
            <div className="flex justify-between text-base font-bold text-[#16261d] pt-2 border-t border-[#cfd9d1]">
              <span>Total Payable:</span>
              <span className="font-mono text-[#1b5e3b]">{totalPrice} BDT</span>
            </div>
          </div>

          <div className="p-3 bg-[#e8eee9] rounded-lg border border-[#cfd9d1] text-[11px] text-[#455549] space-y-1">
            <div className="flex items-center gap-1 text-[#1b5e3b] font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Double-Booking Protection Active</span>
            </div>
            <p>
              Server enforces instantaneous SQL %s race-condition lock to prevent conflicting reservation of Bay {slot.slot_number}.
            </p>
          </div>

          <button
            onClick={handleProceed}
            disabled={!isVehicleCompatible}
            className={`w-full py-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${
              isVehicleCompatible ? 'neu-btn-primary' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <span>Proceed to Payment ({totalPrice} BDT)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
