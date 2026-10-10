import React, { useState } from 'react';
import { mockDb } from '../../db/mockDb';
import { ParkingArea, AreaStatus } from '../../types';
import { MapPin, Plus, CheckCircle2, XCircle, Search, Edit3 } from 'lucide-react';

export const AdminParkingAreas: React.FC = () => {
  const [areas, setAreas] = useState(() => mockDb.getAreas());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Edit modal
  const [editingArea, setEditingArea] = useState<ParkingArea | null>(null);
  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editStatus, setEditStatus] = useState<AreaStatus>('Active');

  const refreshAreas = () => {
    setAreas(mockDb.getAreas());
  };

  const handleAddArea = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!newAreaName.trim() || !newLocation.trim()) {
      setError('Please provide both area name and location.');
      return;
    }
    const res = mockDb.addArea(newAreaName, newLocation);
    if (res.success) {
      setNewAreaName('');
      setNewLocation('');
      setShowAddModal(false);
      refreshAreas();
    } else {
      setError(res.error || 'Failed to add parking area.');
    }
  };

  const openEdit = (a: ParkingArea) => {
    setEditingArea(a);
    setEditName(a.area_name);
    setEditLocation(a.location);
    setEditStatus(a.status);
    setError(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArea) return;
    setError(null);
    const res = mockDb.updateArea(editingArea.area_id, editName, editLocation, editStatus);
    if (res.success) {
      setEditingArea(null);
      refreshAreas();
    } else {
      setError(res.error || 'Failed to update area.');
    }
  };

  const totalAreas = areas.length;
  const activeAreas = areas.filter((a) => a.status === 'Active').length;
  const totalSlotsCount = mockDb.getAllSlots().length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#16261d] tracking-tight">
            Parking Area Management
          </h1>
          <p className="text-xs text-[#455549] mt-1">
            Manage parking locations, addresses, and availability status across Chattogram City.
          </p>
        </div>

        <button
          onClick={() => {
            setError(null);
            setShowAddModal(true);
          }}
          className="neu-btn-primary px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Area</span>
        </button>
      </div>

      {/* Summary KPI derived from database */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block font-semibold">
            TOTAL PARKING AREAS
          </span>
          <strong className="text-2xl font-bold text-[#16261d] block mt-1">
            {totalAreas}
          </strong>
          <span className="text-[10px] text-[#455549] block mt-0.5">Database records</span>
        </div>

        <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block font-semibold">
            ACTIVE AREAS
          </span>
          <strong className="text-2xl font-bold text-[#1b5e3b] block mt-1">
            {activeAreas}
          </strong>
          <span className="text-[10px] text-[#455549] block mt-0.5">Open for reservation</span>
        </div>

        <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block font-semibold">
            ASSOCIATED SLOTS
          </span>
          <strong className="text-2xl font-bold text-[#16261d] block mt-1">
            {totalSlotsCount}
          </strong>
          <span className="text-[10px] text-[#455549] block mt-0.5">Across all areas</span>
        </div>
      </div>

      {/* Areas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {areas.map((area) => {
          const areaSlots = mockDb.getSlotsByArea(area.area_id);
          const availableSlots = areaSlots.filter((s) => s.status === 'Available').length;
          const carCount = areaSlots.filter((s) => s.vehicle_type === 'Car').length;
          const bikeCount = areaSlots.filter((s) => s.vehicle_type === 'Motorcycle').length;

          return (
            <div
              key={area.area_id}
              className="neu-raised p-5 rounded-xl border border-[#cfd9d1] flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-[#455549] font-semibold">
                    AREA ID: #{area.area_id}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      area.status === 'Active'
                        ? 'bg-[#dcefe3] text-[#1b5e3b]'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {area.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#16261d]">{area.area_name}</h3>
                <p className="text-xs text-[#455549] flex items-start gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-[#1b5e3b] shrink-0 mt-0.5" />
                  <span>{area.location}</span>
                </p>
              </div>

              {/* Slot Breakdown */}
              <div className="p-3 bg-[#eff5f0] rounded-lg border border-[#cfd9d1] text-xs font-mono">
                <div className="flex justify-between text-[#16261d] font-semibold">
                  <span>Total Slots:</span>
                  <span>{areaSlots.length}</span>
                </div>
                <div className="flex justify-between text-[#1b5e3b] font-medium pt-1">
                  <span>Available Now:</span>
                  <span>{availableSlots}</span>
                </div>
                <div className="flex justify-between text-[#455549] text-[11px] pt-1 border-t border-[#cfd9d1] mt-1">
                  <span>Cars: {carCount}</span>
                  <span>Motorcycles: {bikeCount}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#cfd9d1] flex items-center justify-between">
                <button
                  onClick={() => openEdit(area)}
                  className="text-xs font-semibold text-[#1b5e3b] hover:underline flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </button>
                <button
                  onClick={() => {
                    mockDb.toggleAreaStatus(area.area_id);
                    refreshAreas();
                  }}
                  className="text-xs font-semibold text-[#455549] hover:text-[#16261d]"
                >
                  {area.status === 'Active' ? 'Set Inactive' : 'Set Active'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Area Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-[#cfd9d1] p-6 text-[#16261d] space-y-4">
            <h3 className="text-base font-bold text-[#16261d]">Add New Parking Area</h3>
            {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</p>}
            <form onSubmit={handleAddArea} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#16261d] mb-1">
                  Area Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Muradpur Junction"
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                  className="w-full p-2.5 rounded-lg text-xs neu-input"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#16261d] mb-1">
                  Location / Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Muradpur, CDA Avenue, Chattogram"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full p-2.5 rounded-lg text-xs neu-input"
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
                  Save Area
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Area Modal */}
      {editingArea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-[#cfd9d1] p-6 text-[#16261d] space-y-4">
            <h3 className="text-base font-bold text-[#16261d]">
              Edit Area #{editingArea.area_id}
            </h3>
            {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</p>}
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#16261d] mb-1">
                  Area Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 rounded-lg text-xs neu-input"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#16261d] mb-1">
                  Location / Address
                </label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full p-2.5 rounded-lg text-xs neu-input"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#16261d] mb-1">
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as AreaStatus)}
                  className="w-full p-2.5 rounded-lg text-xs neu-input"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingArea(null)}
                  className="neu-btn-secondary px-4 py-2 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="neu-btn-primary px-4 py-2 rounded-lg text-xs font-bold uppercase"
                >
                  Update Area
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
