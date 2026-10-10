import React, { useState } from 'react';
import { mockDb } from '../../db/mockDb';
import { ParkingSlot, SlotStatus, VehicleType } from '../../types';
import {
  Car,
  Bike,
  Plus,
  CheckCircle2,
  Clock,
  Edit3,
  AlertCircle,
  Filter,
} from 'lucide-react';

export const AdminParkingSlots: React.FC = () => {
  const areas = mockDb.getAreas();
  const [selectedAreaId, setSelectedAreaId] = useState<number>(areas[0]?.area_id || 1);
  const [slots, setSlots] = useState<ParkingSlot[]>(() =>
    mockDb.getSlotsByArea(areas[0]?.area_id || 1)
  );

  // Filter
  const [typeFilter, setTypeFilter] = useState<'All' | VehicleType>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | SlotStatus>('All');

  // Add slot modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSlotNumber, setNewSlotNumber] = useState('');
  const [newVehicleType, setNewVehicleType] = useState<VehicleType>('Car');
  const [newRate, setNewRate] = useState<number>(60);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit slot modal
  const [editingSlot, setEditingSlot] = useState<ParkingSlot | null>(null);
  const [editNumber, setEditNumber] = useState('');
  const [editType, setEditType] = useState<VehicleType>('Car');
  const [editRate, setEditRate] = useState<number>(60);
  const [editStatus, setEditStatus] = useState<SlotStatus>('Available');
  const [editError, setEditError] = useState<string | null>(null);

  const refreshSlots = (areaId = selectedAreaId) => {
    setSlots(mockDb.getSlotsByArea(areaId));
  };

  const handleAreaChange = (id: number) => {
    setSelectedAreaId(id);
    refreshSlots(id);
  };

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    if (!newSlotNumber.trim()) {
      setAddError('Slot number is required');
      return;
    }
    const res = mockDb.addSlot(
      selectedAreaId,
      newSlotNumber.trim().toUpperCase(),
      newVehicleType,
      Number(newRate)
    );
    if (res.success) {
      setShowAddModal(false);
      setNewSlotNumber('');
      refreshSlots();
    } else {
      setAddError(res.error || 'Failed to add slot');
    }
  };

  const openEdit = (slot: ParkingSlot) => {
    setEditingSlot(slot);
    setEditNumber(slot.slot_number);
    setEditType(slot.vehicle_type);
    setEditRate(slot.price_per_hour);
    setEditStatus(slot.status);
    setEditError(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot) return;
    setEditError(null);

    const res = mockDb.updateSlot(
      editingSlot.slot_id,
      editNumber,
      editType,
      Number(editRate),
      editStatus
    );

    if (res.success) {
      setEditingSlot(null);
      refreshSlots();
    } else {
      setEditError(res.error || 'Failed to update slot');
    }
  };

  const currentArea = areas.find((a) => a.area_id === selectedAreaId) || areas[0];

  const filteredSlots = slots.filter((s) => {
    if (typeFilter !== 'All' && s.vehicle_type !== typeFilter) return false;
    if (statusFilter !== 'All' && s.status !== statusFilter) return false;
    return true;
  });

  const availableCount = slots.filter((s) => s.status === 'Available').length;
  const bookedCount = slots.filter((s) => s.status === 'Booked').length;
  const occupiedCount = slots.filter((s) => s.status === 'Occupied').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#16261d] tracking-tight">
            Parking Slot Management
          </h1>
          <p className="text-xs text-[#455549] mt-1">
            Configure slots, hourly pricing, and availability states for each parking area.
          </p>
        </div>

        <button
          onClick={() => {
            setAddError(null);
            setShowAddModal(true);
          }}
          className="neu-btn-primary px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Slot</span>
        </button>
      </div>

      {/* Area Selector and Filter Tabs */}
      <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#16261d]">Select Area:</span>
            <select
              value={selectedAreaId}
              onChange={(e) => handleAreaChange(Number(e.target.value))}
              className="p-2 rounded-lg text-xs neu-input font-medium"
            >
              {areas.map((a) => (
                <option key={a.area_id} value={a.area_id}>
                  {a.area_name} ({mockDb.getSlotsByArea(a.area_id).length} slots)
                </option>
              ))}
            </select>
          </div>

          {/* Type & Status Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#16261d]">Type:</span>
            {(['All', 'Car', 'Motorcycle'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                  typeFilter === t
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
                className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                  statusFilter === s
                    ? 'bg-[#1b5e3b] text-white'
                    : 'bg-[#eff5f0] text-[#455549] hover:text-[#16261d]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Area Slot KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block font-semibold">
            TOTAL SLOTS IN AREA
          </span>
          <strong className="text-2xl font-bold text-[#16261d] block mt-1">
            {slots.length}
          </strong>
          <span className="text-[10px] text-[#455549] block mt-0.5">{currentArea?.area_name}</span>
        </div>

        <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block font-semibold">
            AVAILABLE
          </span>
          <strong className="text-2xl font-bold text-[#1b5e3b] block mt-1">
            {availableCount}
          </strong>
          <span className="text-[10px] text-[#1b5e3b] block mt-0.5">Ready for booking</span>
        </div>

        <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block font-semibold">
            BOOKED
          </span>
          <strong className="text-2xl font-bold text-amber-700 block mt-1">
            {bookedCount}
          </strong>
          <span className="text-[10px] text-amber-700 block mt-0.5">Reserved by user</span>
        </div>

        <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block font-semibold">
            OCCUPIED
          </span>
          <strong className="text-2xl font-bold text-red-700 block mt-1">
            {occupiedCount}
          </strong>
          <span className="text-[10px] text-red-700 block mt-0.5">Currently parked</span>
        </div>
      </div>

      {/* Slots Grid */}
      <div className="neu-raised p-5 rounded-xl border border-[#cfd9d1]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#16261d]">
            Slots in {currentArea?.area_name} ({filteredSlots.length} displayed)
          </h2>
        </div>

        {filteredSlots.length === 0 ? (
          <div className="p-8 text-center text-[#455549] text-xs">
            No parking slots match the selected criteria in this area.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredSlots.map((slot) => {
              const isAvail = slot.status === 'Available';
              const isBooked = slot.status === 'Booked';
              const isOccupied = slot.status === 'Occupied';

              return (
                <div
                  key={slot.slot_id}
                  className={`p-3 rounded-xl border flex flex-col justify-between transition ${
                    isAvail
                      ? 'bg-white border-[#1b5e3b]/30'
                      : isBooked
                      ? 'bg-amber-50/60 border-amber-300'
                      : 'bg-red-50/60 border-red-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono font-bold text-[#455549]">
                        #{slot.slot_id}
                      </span>
                      {slot.vehicle_type === 'Car' ? (
                        <Car className="w-3.5 h-3.5 text-[#1b5e3b]" />
                      ) : (
                        <Bike className="w-3.5 h-3.5 text-[#1b5e3b]" />
                      )}
                    </div>

                    <strong className="text-base font-extrabold text-[#16261d] font-mono block">
                      {slot.slot_number}
                    </strong>
                    <span className="text-[10px] text-[#455549] block">
                      ৳{slot.price_per_hour}/hr
                    </span>
                  </div>

                  <div className="pt-2 mt-2 border-t border-[#cfd9d1]/60 flex items-center justify-between">
                    <span
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        isAvail
                          ? 'bg-[#dcefe3] text-[#1b5e3b]'
                          : isBooked
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {slot.status}
                    </span>

                    <button
                      onClick={() => openEdit(slot)}
                      className="p-1 text-[#455549] hover:text-[#1b5e3b] transition"
                      title="Edit Slot"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Slot Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-[#cfd9d1] p-6 text-[#16261d] space-y-4">
            <h3 className="text-base font-bold text-[#16261d]">
              Add Slot to {currentArea?.area_name}
            </h3>
            {addError && <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{addError}</p>}
            <form onSubmit={handleAddSlot} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#16261d] mb-1">
                  Slot Number (e.g. C-06, M-04)
                </label>
                <input
                  type="text"
                  placeholder="e.g. C-06"
                  value={newSlotNumber}
                  onChange={(e) => setNewSlotNumber(e.target.value)}
                  className="w-full p-2.5 rounded-lg text-xs neu-input font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#16261d] mb-1">
                  Vehicle Type
                </label>
                <select
                  value={newVehicleType}
                  onChange={(e) => {
                    const t = e.target.value as VehicleType;
                    setNewVehicleType(t);
                    setNewRate(t === 'Car' ? 60 : 20);
                  }}
                  className="w-full p-2.5 rounded-lg text-xs neu-input"
                >
                  <option value="Car">Car</option>
                  <option value="Motorcycle">Motorcycle</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#16261d] mb-1">
                  Price Per Hour (BDT)
                </label>
                <input
                  type="number"
                  min="5"
                  max="500"
                  value={newRate}
                  onChange={(e) => setNewRate(Number(e.target.value))}
                  className="w-full p-2.5 rounded-lg text-xs neu-input font-mono"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="neu-btn-secondary px-4 py-2 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="neu-btn-primary px-4 py-2 rounded-lg text-xs font-bold uppercase"
                >
                  Save Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Slot Modal */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-[#cfd9d1] p-6 text-[#16261d] space-y-4">
            <h3 className="text-base font-bold text-[#16261d]">
              Edit Slot #{editingSlot.slot_id} ({currentArea?.area_name})
            </h3>
            {editError && <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{editError}</p>}
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#16261d] mb-1">
                  Slot Number
                </label>
                <input
                  type="text"
                  value={editNumber}
                  onChange={(e) => setEditNumber(e.target.value)}
                  className="w-full p-2.5 rounded-lg text-xs neu-input font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#16261d] mb-1">
                  Vehicle Type
                </label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value as VehicleType)}
                  className="w-full p-2.5 rounded-lg text-xs neu-input"
                >
                  <option value="Car">Car</option>
                  <option value="Motorcycle">Motorcycle</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#16261d] mb-1">
                  Price Per Hour (BDT)
                </label>
                <input
                  type="number"
                  min="5"
                  max="500"
                  value={editRate}
                  onChange={(e) => setEditRate(Number(e.target.value))}
                  className="w-full p-2.5 rounded-lg text-xs neu-input font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#16261d] mb-1">
                  Slot Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as SlotStatus)}
                  className="w-full p-2.5 rounded-lg text-xs neu-input"
                >
                  <option value="Available">Available</option>
                  <option value="Booked">Booked</option>
                  <option value="Occupied">Occupied</option>
                </select>
                <p className="text-[10px] text-[#455549] mt-1">
                  Note: A slot cannot be set to Available if it has an active Confirmed booking.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingSlot(null)}
                  className="neu-btn-secondary px-4 py-2 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="neu-btn-primary px-4 py-2 rounded-lg text-xs font-bold uppercase"
                >
                  Update Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
