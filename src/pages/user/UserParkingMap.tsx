import React, { useState } from 'react';
import { mockDb } from '../../db/mockDb';
import { ParkingSlot, VehicleType, SlotStatus } from '../../types';
import {
  Car,
  Bike,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  MapPin,
} from 'lucide-react';

interface Props {
  initialAreaId?: number;
  onNavigate: (view: string, extra?: any) => void;
}

export const UserParkingMap: React.FC<Props> = ({ initialAreaId = 1, onNavigate }) => {
  const areas = mockDb.getAreas();
  const [selectedAreaId, setSelectedAreaId] = useState<number>(initialAreaId);
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<'All' | VehicleType>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | SlotStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected slot for booking
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);

  const currentArea = mockDb.getAreaById(selectedAreaId) || areas[0];
  const allSlotsInArea = mockDb.getSlotsByArea(selectedAreaId);

  const filteredSlots = allSlotsInArea.filter((slot) => {
    if (vehicleTypeFilter !== 'All' && slot.vehicle_type !== vehicleTypeFilter) return false;
    if (statusFilter !== 'All' && slot.status !== statusFilter) return false;
    if (
      searchQuery.trim() &&
      !slot.slot_number.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const selectedSlot = selectedSlotId ? mockDb.getSlotById(selectedSlotId) : null;

  const handleSelectSlot = (slot: ParkingSlot) => {
    if (slot.status !== 'Available') {
      alert(`Slot ${slot.slot_number} is currently ${slot.status.toLowerCase()} and cannot be reserved.`);
      return;
    }
    setSelectedSlotId(slot.slot_id);
  };

  const handleProceedBooking = () => {
    if (!selectedSlot) return;
    onNavigate('user-booking', { slotId: selectedSlot.slot_id, areaId: selectedAreaId });
  };

  const totalSlotsInArea = allSlotsInArea.length;
  const availInArea = allSlotsInArea.filter((s) => s.status === 'Available').length;
  const bookedInArea = allSlotsInArea.filter((s) => s.status === 'Booked').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#16261d] tracking-tight">
            Parking Areas & Slot Availability
          </h1>
          <p className="text-xs text-[#455549] mt-1">
            Browse parking areas in Chattogram and select an available slot to reserve.
          </p>
        </div>

        {selectedSlot && (
          <button
            onClick={handleProceedBooking}
            className="neu-btn-primary px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 self-start sm:self-auto"
          >
            <span>Book Selected Slot ({selectedSlot.slot_number})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Area Selector Tabs */}
      <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1] space-y-3">
        <label className="block text-xs font-bold text-[#16261d]">Choose Parking Area:</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {areas.map((a) => {
            const isSelected = selectedAreaId === a.area_id;
            const areaSlots = mockDb.getSlotsByArea(a.area_id);
            const avail = areaSlots.filter((s) => s.status === 'Available').length;

            return (
              <button
                key={a.area_id}
                onClick={() => {
                  setSelectedAreaId(a.area_id);
                  setSelectedSlotId(null);
                }}
                className={`p-3 rounded-lg text-left transition select-none ${
                  isSelected
                    ? 'bg-[#1b5e3b] text-white shadow-xs'
                    : 'bg-[#eff5f0] text-[#16261d] hover:bg-[#dee4df]'
                }`}
              >
                <strong className="text-xs block truncate">{a.area_name}</strong>
                <span
                  className={`text-[10px] block mt-0.5 ${
                    isSelected ? 'text-[#dcefe3]' : 'text-[#1b5e3b]'
                  }`}
                >
                  {avail} Available
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Area Info and Slot Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block font-semibold">
            CURRENT AREA
          </span>
          <strong className="text-lg font-bold text-[#16261d] block mt-1">
            {currentArea?.area_name}
          </strong>
          <span className="text-[11px] text-[#455549] block mt-0.5">{currentArea?.location}</span>
        </div>

        <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block font-semibold">
            TOTAL SLOTS IN AREA
          </span>
          <strong className="text-2xl font-bold text-[#16261d] block mt-1">
            {totalSlotsInArea}
          </strong>
          <span className="text-[10px] text-[#455549] block mt-0.5">Configured slots</span>
        </div>

        <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block font-semibold">
            AVAILABLE NOW
          </span>
          <strong className="text-2xl font-bold text-[#1b5e3b] block mt-1">
            {availInArea}
          </strong>
          <span className="text-[10px] text-[#1b5e3b] font-medium block mt-0.5">
            Ready to reserve
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-[#16261d]">Vehicle Type:</span>
          {(['All', 'Car', 'Motorcycle'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setVehicleTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                vehicleTypeFilter === t
                  ? 'bg-[#1b5e3b] text-white'
                  : 'bg-[#eff5f0] text-[#455549] hover:text-[#16261d]'
              }`}
            >
              {t}
            </button>
          ))}

          <span className="text-xs font-bold text-[#16261d] ml-2">Status:</span>
          {(['All', 'Available', 'Booked', 'Occupied'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === s
                  ? 'bg-[#1b5e3b] text-white'
                  : 'bg-[#eff5f0] text-[#455549] hover:text-[#16261d]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-56">
          <Search className="w-3.5 h-3.5 text-[#455549] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search slot (e.g. C-01)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs neu-input font-mono"
          />
        </div>
      </div>

      {/* Slots Matrix */}
      <div className="neu-raised p-6 rounded-xl border border-[#cfd9d1]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#16261d]">
            Slots in {currentArea?.area_name} ({filteredSlots.length} Slots)
          </h2>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-[#1b5e3b]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1b5e3b]"></span> Available
            </span>
            <span className="flex items-center gap-1 text-amber-700">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span> Booked
            </span>
            <span className="flex items-center gap-1 text-red-700">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span> Occupied
            </span>
          </div>
        </div>

        {filteredSlots.length === 0 ? (
          <div className="p-8 text-center text-[#455549] text-xs">
            No slots match your filters in this area.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredSlots.map((slot) => {
              const isSelected = selectedSlotId === slot.slot_id;
              const isAvail = slot.status === 'Available';
              const isBooked = slot.status === 'Booked';

              return (
                <div
                  key={slot.slot_id}
                  onClick={() => handleSelectSlot(slot)}
                  className={`p-3.5 rounded-xl border text-center transition cursor-pointer select-none flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#1b5e3b] text-white border-2 border-[#1b5e3b] shadow-sm'
                      : isAvail
                      ? 'bg-white border-[#cfd9d1] hover:bg-[#dee4df]'
                      : isBooked
                      ? 'bg-amber-50/70 border-amber-300 opacity-90 cursor-not-allowed'
                      : 'bg-red-50/70 border-red-200 opacity-80 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[10px] font-mono ${
                        isSelected ? 'text-[#dcefe3]' : 'text-[#455549]'
                      }`}
                    >
                      #{slot.slot_id}
                    </span>
                    {slot.vehicle_type === 'Car' ? (
                      <Car
                        className={`w-3.5 h-3.5 ${
                          isSelected ? 'text-white' : 'text-[#1b5e3b]'
                        }`}
                      />
                    ) : (
                      <Bike
                        className={`w-3.5 h-3.5 ${
                          isSelected ? 'text-white' : 'text-[#1b5e3b]'
                        }`}
                      />
                    )}
                  </div>

                  <strong
                    className={`text-lg font-mono font-extrabold block ${
                      isSelected ? 'text-white' : 'text-[#16261d]'
                    }`}
                  >
                    {slot.slot_number}
                  </strong>

                  <span
                    className={`text-[10px] block mt-1 ${
                      isSelected ? 'text-[#dcefe3]' : 'text-[#455549]'
                    }`}
                  >
                    ৳{slot.price_per_hour}/hr
                  </span>

                  <span
                    className={`inline-block mt-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      isSelected
                        ? 'bg-white text-[#1b5e3b]'
                        : isAvail
                        ? 'bg-[#dcefe3] text-[#1b5e3b]'
                        : isBooked
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {isSelected ? 'SELECTED' : slot.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Selected Slot Action Strip */}
        {selectedSlot && (
          <div className="mt-6 p-4 bg-[#dcefe3] rounded-xl border border-[#1b5e3b] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <strong className="text-sm font-bold text-[#16261d]">
                Selected: Slot {selectedSlot.slot_number} ({selectedSlot.vehicle_type})
              </strong>
              <p className="text-xs text-[#455549]">
                Rate: ৳{selectedSlot.price_per_hour} BDT/hr at {currentArea?.area_name}
              </p>
            </div>
            <button
              onClick={handleProceedBooking}
              className="neu-btn-primary px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
            >
              <span>Continue to Reservation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
