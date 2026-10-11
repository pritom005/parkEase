import React, { useState } from 'react';
import { mockDb } from '../../db/mockDb';
import { ParkingArea, AreaStatus } from '../../types';
import {
  MapPin,
  Plus,
  Edit3,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Car,
  Bike,
  Phone,
  User as UserIcon,
  Layers,
  X,
  AlertCircle,
} from 'lucide-react';

export const AdminParkingAreas: React.FC = () => {
  const [areas, setAreas] = useState<ParkingArea[]>(() => mockDb.getAreas());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | AreaStatus>('All');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingArea, setEditingArea] = useState<ParkingArea | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form states
  const [areaName, setAreaName] = useState('');
  const [location, setLocation] = useState('');
  const [carSlots, setCarSlots] = useState<number>(20);
  const [motorcycleSlots, setMotorcycleSlots] = useState<number>(10);
  const [carRateHourly, setCarRateHourly] = useState<number>(250);
  const [motorcycleRateHourly, setMotorcycleRateHourly] = useState<number>(100);
  const [carRateDaily, setCarRateDaily] = useState<number>(2500);
  const [motorcycleRateDaily, setMotorcycleRateDaily] = useState<number>(1000);
  const [wardenName, setWardenName] = useState('');
  const [hotline, setHotline] = useState('');
  const [coordinates, setCoordinates] = useState('');

  const refreshAreas = () => {
    setAreas(mockDb.getAreas());
  };

  const filteredAreas = areas.filter((a) => {
    if (statusFilter !== 'All' && a.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = a.area_name.toLowerCase().includes(q);
      const matchLocation = a.location.toLowerCase().includes(q);
      const matchWarden = (a.warden_name || '').toLowerCase().includes(q);
      if (!matchName && !matchLocation && !matchWarden) return false;
    }
    return true;
  });

  const handleToggleStatus = (area: ParkingArea) => {
    const nextStatus: AreaStatus = area.status === 'Active' ? 'Inactive' : 'Active';
    const actionText = nextStatus === 'Inactive' ? 'deactivate' : 'activate';

    if (confirm(`Are you sure you want to ${actionText} parking area "${area.area_name}"?`)) {
      mockDb.updateAreaStatus(area.area_id, nextStatus);
      refreshAreas();
    }
  };

  const openAddModal = () => {
    setAreaName('');
    setLocation('');
    setCarSlots(20);
    setMotorcycleSlots(10);
    setCarRateHourly(250);
    setMotorcycleRateHourly(100);
    setCarRateDaily(2500);
    setMotorcycleRateDaily(1000);
    setWardenName('');
    setHotline('');
    setCoordinates('');
    setFormError(null);
    setShowAddModal(true);
  };

  const openEditModal = (area: ParkingArea) => {
    setEditingArea(area);
    setAreaName(area.area_name);
    setLocation(area.location);
    setCarSlots(area.car_slots);
    setMotorcycleSlots(area.motorcycle_slots);
    setCarRateHourly(area.car_rate_hourly);
    setMotorcycleRateHourly(area.motorcycle_rate_hourly);
    setCarRateDaily(area.car_rate_daily);
    setMotorcycleRateDaily(area.motorcycle_rate_daily);
    setWardenName(area.warden_name || '');
    setHotline(area.hotline || '');
    setCoordinates(area.coordinates || '');
    setFormError(null);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!areaName.trim() || !location.trim()) {
      setFormError('Area name and address location are required.');
      return;
    }

    const total = Number(carSlots) + Number(motorcycleSlots);
    mockDb.addArea({
      area_name: areaName.trim(),
      location: location.trim(),
      status: 'Active',
      total_slots: total,
      car_slots: Number(carSlots),
      motorcycle_slots: Number(motorcycleSlots),
      car_rate_hourly: Number(carRateHourly),
      motorcycle_rate_hourly: Number(motorcycleRateHourly),
      car_rate_daily: Number(carRateDaily),
      motorcycle_rate_daily: Number(motorcycleRateDaily),
      warden_name: wardenName.trim() || undefined,
      hotline: hotline.trim() || undefined,
      coordinates: coordinates.trim() || undefined,
    });

    setShowAddModal(false);
    refreshAreas();
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArea) return;
    setFormError(null);

    if (!areaName.trim() || !location.trim()) {
      setFormError('Area name and location are required.');
      return;
    }

    const total = Number(carSlots) + Number(motorcycleSlots);
    const res = mockDb.updateArea(editingArea.area_id, {
      area_name: areaName.trim(),
      location: location.trim(),
      total_slots: total,
      car_slots: Number(carSlots),
      motorcycle_slots: Number(motorcycleSlots),
      car_rate_hourly: Number(carRateHourly),
      motorcycle_rate_hourly: Number(motorcycleRateHourly),
      car_rate_daily: Number(carRateDaily),
      motorcycle_rate_daily: Number(motorcycleRateDaily),
      warden_name: wardenName.trim() || undefined,
      hotline: hotline.trim() || undefined,
      coordinates: coordinates.trim() || undefined,
    });

    if (res.success) {
      setEditingArea(null);
      refreshAreas();
    } else {
      setFormError(res.error || 'Failed to update parking area');
    }
  };

  const totalAreas = areas.length;
  const activeAreas = areas.filter((a) => a.status === 'Active').length;
  const totalCapacity = areas.reduce((acc, a) => acc + (a.total_slots || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#16261d] tracking-tight">
            Parking Area Management
          </h1>
          <p className="text-xs text-[#455549] mt-1">
            Manage municipal parking terminals, operational status, bay capacity, and on-site wardens.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1b5e3b] text-white text-xs font-bold hover:bg-[#154a2e] transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Parking Area
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block font-semibold">
            TOTAL HUBS / TERMINALS
          </span>
          <strong className="text-2xl font-bold text-[#16261d] block mt-1">
            {totalAreas}
          </strong>
          <span className="text-[10px] text-[#455549] block mt-0.5">Configured municipal locations</span>
        </div>

        <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block font-semibold">
            ACTIVE TERMINALS
          </span>
          <strong className="text-2xl font-bold text-[#1b5e3b] block mt-1">
            {activeAreas}
          </strong>
          <span className="text-[10px] text-[#1b5e3b] font-medium block mt-0.5">
            Accepting bookings
          </span>
        </div>

        <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block font-semibold">
            TOTAL CAPACITY
          </span>
          <strong className="text-2xl font-bold text-[#16261d] block mt-1">
            {totalCapacity} Bays
          </strong>
          <span className="text-[10px] text-[#455549] block mt-0.5">Aggregate slots capacity</span>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="neu-raised p-4 rounded-2xl border border-[#cfd9d1] space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#455549]" />
            <input
              type="text"
              placeholder="Search by terminal name, address location, or warden..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-[#cfd9d1] bg-white text-[#16261d] focus:outline-none focus:ring-2 focus:ring-[#1b5e3b]"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <div className="flex items-center gap-1.5 px-2 bg-[#f4f7f4] rounded-xl border border-[#cfd9d1]">
              <Filter className="w-3.5 h-3.5 text-[#455549]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                aria-label="Filter by terminal status"
                className="bg-transparent text-xs text-[#16261d] py-2 pr-2 font-medium focus:outline-none cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {(searchQuery || statusFilter !== 'All') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('All');
                }}
                className="px-3 py-2 text-xs font-semibold text-[#455549] hover:text-[#16261d] hover:bg-[#e2e8e3] rounded-xl border border-[#cfd9d1] transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Parking Areas Table */}
      <div className="neu-raised rounded-2xl border border-[#cfd9d1] overflow-hidden bg-white">
        <div className="p-4 border-b border-[#cfd9d1] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#1b5e3b]" />
            <span className="text-xs font-bold text-[#16261d] uppercase tracking-wider font-mono">
              Parking Hubs & Terminals ({filteredAreas.length})
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#16261d]">
            <thead className="bg-[#f4f7f4] border-b border-[#cfd9d1] text-[10px] font-mono text-[#455549] uppercase">
              <tr>
                <th className="py-3 px-4">Area Name & ID</th>
                <th className="py-3 px-4">Location Address</th>
                <th className="py-3 px-4">Capacity Breakdown</th>
                <th className="py-3 px-4">Hourly Rates</th>
                <th className="py-3 px-4">Warden / Contact</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#cfd9d1]">
              {filteredAreas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#455549]">
                    <MapPin className="w-10 h-10 mx-auto text-[#455549]/40 mb-2" />
                    <p className="font-semibold text-sm text-[#16261d]">No parking areas found</p>
                    <p className="text-xs text-[#455549] mt-0.5">
                      No parking areas match the selected filters or search query.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAreas.map((area) => (
                  <tr key={area.area_id} className="hover:bg-[#f8faf8] transition-colors">
                    <td className="py-3 px-4 font-medium text-[#16261d]">
                      <div className="font-bold text-sm text-[#16261d]">{area.area_name}</div>
                      <span className="text-[10px] font-mono text-[#455549]">
                        ID: #{area.area_id}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-start gap-1.5 max-w-xs">
                        <MapPin className="w-3.5 h-3.5 text-[#1b5e3b] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-[#16261d] leading-snug">{area.location}</p>
                          {area.coordinates && (
                            <span className="text-[10px] font-mono text-[#455549] block mt-0.5">
                              {area.coordinates}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#16261d]">
                            {area.total_slots} Total
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-[#455549]">
                          <span className="flex items-center gap-1">
                            <Car className="w-3 h-3 text-[#1b5e3b]" />
                            {area.car_slots} Car
                          </span>
                          <span className="flex items-center gap-1">
                            <Bike className="w-3 h-3 text-[#e58a13]" />
                            {area.motorcycle_slots} Bike
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <div className="space-y-0.5">
                        <div className="text-[11px] text-[#16261d]">
                          <span className="text-[#455549]">Car:</span> ৳{area.car_rate_hourly}/hr
                        </div>
                        <div className="text-[11px] text-[#16261d]">
                          <span className="text-[#455549]">Bike:</span> ৳{area.motorcycle_rate_hourly}/hr
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div>
                        {area.warden_name ? (
                          <div className="flex items-center gap-1 text-xs font-medium text-[#16261d]">
                            <UserIcon className="w-3 h-3 text-[#455549]" />
                            {area.warden_name}
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#455549] italic">Unassigned</span>
                        )}
                        {area.hotline && (
                          <div className="flex items-center gap-1 text-[10px] font-mono text-[#455549] mt-0.5">
                            <Phone className="w-2.5 h-2.5 text-[#1b5e3b]" />
                            {area.hotline}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          area.status === 'Active'
                            ? 'bg-emerald-100 text-[#1b5e3b] border border-emerald-300'
                            : 'bg-red-100 text-red-700 border border-red-300'
                        }`}
                      >
                        {area.status === 'Active' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {area.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(area)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-[#cfd9d1] text-[#16261d] hover:bg-[#e4ede6] transition-all inline-flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(area)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                            area.status === 'Active'
                              ? 'border-red-200 text-red-700 hover:bg-red-50'
                              : 'border-emerald-300 text-[#1b5e3b] hover:bg-emerald-50'
                          }`}
                        >
                          {area.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Area Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl border border-[#cfd9d1] max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#cfd9d1] pb-3">
              <h2 className="text-base font-bold text-[#16261d] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#1b5e3b]" />
                Add New Parking Area
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#455549] hover:text-[#16261d] p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAdd} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#16261d] mb-1">
                  Area / Terminal Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Agrabad Commercial Hub"
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#cfd9d1] rounded-xl focus:ring-2 focus:ring-[#1b5e3b] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#16261d] mb-1">
                  Location Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Finance Hub, Agrabad C/A, Chattogram"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-[#cfd9d1] rounded-xl focus:ring-2 focus:ring-[#1b5e3b] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#16261d] mb-1">Car Slots</label>
                  <input
                    type="number"
                    min="0"
                    value={carSlots}
                    onChange={(e) => setCarSlots(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#cfd9d1] rounded-xl focus:ring-2 focus:ring-[#1b5e3b] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#16261d] mb-1">Motorcycle Slots</label>
                  <input
                    type="number"
                    min="0"
                    value={motorcycleSlots}
                    onChange={(e) => setMotorcycleSlots(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#cfd9d1] rounded-xl focus:ring-2 focus:ring-[#1b5e3b] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#16261d] mb-1">Car Hourly Rate (৳)</label>
                  <input
                    type="number"
                    min="0"
                    value={carRateHourly}
                    onChange={(e) => setCarRateHourly(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#cfd9d1] rounded-xl focus:ring-2 focus:ring-[#1b5e3b] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#16261d] mb-1">Motorcycle Rate (৳)</label>
                  <input
                    type="number"
                    min="0"
                    value={motorcycleRateHourly}
                    onChange={(e) => setMotorcycleRateHourly(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#cfd9d1] rounded-xl focus:ring-2 focus:ring-[#1b5e3b] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#16261d] mb-1">Warden Name</label>
                  <input
                    type="text"
                    placeholder="Warden In-Charge"
                    value={wardenName}
                    onChange={(e) => setWardenName(e.target.value)}
                    className="w-full px-3 py-2 border border-[#cfd9d1] rounded-xl focus:ring-2 focus:ring-[#1b5e3b] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#16261d] mb-1">Hotline / Contact</label>
                  <input
                    type="text"
                    placeholder="+880 1..."
                    value={hotline}
                    onChange={(e) => setHotline(e.target.value)}
                    className="w-full px-3 py-2 border border-[#cfd9d1] rounded-xl focus:ring-2 focus:ring-[#1b5e3b] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#16261d] mb-1">Geo Coordinates</label>
                <input
                  type="text"
                  placeholder="e.g. 22.3218° N, 91.8124° E"
                  value={coordinates}
                  onChange={(e) => setCoordinates(e.target.value)}
                  className="w-full px-3 py-2 border border-[#cfd9d1] rounded-xl focus:ring-2 focus:ring-[#1b5e3b] focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#cfd9d1]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[#cfd9d1] rounded-xl text-[#455549] hover:bg-[#f4f7f4] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1b5e3b] text-white rounded-xl font-bold hover:bg-[#154a2e]"
                >
                  Create Area
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Area Modal */}
      {editingArea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl border border-[#cfd9d1] max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#cfd9d1] pb-3">
              <h2 className="text-base font-bold text-[#16261d] flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#1b5e3b]" />
                Edit Parking Area (#{editingArea.area_id})
              </h2>
              <button
                onClick={() => setEditingArea(null)}
                className="text-[#455549] hover:text-[#16261d] p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#16261d] mb-1">
                  Area / Terminal Name *
                </label>
                <input
                  type="text"
                  required
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#cfd9d1] rounded-xl focus:ring-2 focus:ring-[#1b5e3b] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#16261d] mb-1">
                  Location Address *
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-[#cfd9d1] rounded-xl focus:ring-2 focus:ring-[#1b5e3b] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#16261d] mb-1">Car Slots</label>
                  <input
                    type="number"
                    min="0"
                    value={carSlots}
                    onChange={(e) => setCarSlots(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#cfd9d1] rounded-xl focus:ring-2 focus:ring-[#1b5e3b] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#16261d] mb-1">Motorcycle Slots</label>
                  <input
                    type="number"
                    min="0"
                    value={motorcycleSlots}
                    onChange={(e) => setMotorcycleSlots(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#cfd9d1] rounded-xl focus:ring-2 focus:ring-[#1b5e3b] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#16261d] mb-1">Car Hourly Rate (৳)</label>
                  <input
                    type="number"
                    min="0"
                    value={carRateHourly}
                    onChange={(e) => setCarRateHourly(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#cfd9d1] rounded-xl focus:ring-2 focus:ring-[#1b5e3b] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#16261d] mb-1">Motorcycle Rate (৳)</label>
                  <input
                    type="number"
                    min="0"
                    value={motorcycleRateHourly}
                    onChange={(e) => setMotorcycleRateHourly(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#cfd9d1] rounded-xl focus:ring-2 focus:ring-[#1b5e3b] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#16261d] mb-1">Warden Name</label>
                  <input
                    type="text"
                    value={wardenName}
                    onChange={(e) => setWardenName(e.target.value)}
                    className="w-full px-3 py-2 border border-[#cfd9d1] rounded-xl focus:ring-2 focus:ring-[#1b5e3b] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#16261d] mb-1">Hotline / Contact</label>
                  <input
                    type="text"
                    value={hotline}
                    onChange={(e) => setHotline(e.target.value)}
                    className="w-full px-3 py-2 border border-[#cfd9d1] rounded-xl focus:ring-2 focus:ring-[#1b5e3b] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#16261d] mb-1">Geo Coordinates</label>
                <input
                  type="text"
                  value={coordinates}
                  onChange={(e) => setCoordinates(e.target.value)}
                  className="w-full px-3 py-2 border border-[#cfd9d1] rounded-xl focus:ring-2 focus:ring-[#1b5e3b] focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#cfd9d1]">
                <button
                  type="button"
                  onClick={() => setEditingArea(null)}
                  className="px-4 py-2 border border-[#cfd9d1] rounded-xl text-[#455549] hover:bg-[#f4f7f4] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1b5e3b] text-white rounded-xl font-bold hover:bg-[#154a2e]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
