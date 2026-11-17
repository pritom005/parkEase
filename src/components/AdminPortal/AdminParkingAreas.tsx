import React, { useState } from 'react';
import { useParkEase } from '../../context/ParkEaseContext';
import { ParkingArea, AreaStatus } from '../../types';
import { Plus, Search, Check, AlertCircle, X, MapPin, Car, Bike, Pencil } from 'lucide-react';

export const AdminParkingAreas: React.FC = () => {
  const { areas, slots, addArea, updateArea } = useParkEase();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | AreaStatus>('All');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Unified Add / Edit Area Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<ParkingArea | null>(null);
  const [areaName, setAreaName] = useState('');
  const [areaLocation, setAreaLocation] = useState('');
  const [areaStatus, setAreaStatus] = useState<AreaStatus>('Active');
  const [modalError, setModalError] = useState('');

  const totalAreas = areas.length;
  const activeAreas = areas.filter((a) => a.status === 'Active').length;
  const totalSlotsCount = slots.length;

  const filteredAreas = areas.filter((area) => {
    const q = searchQuery.trim().toLowerCase();
    const matchSearch =
      !q ||
      area.area_name.toLowerCase().includes(q) ||
      area.location.toLowerCase().includes(q) ||
      String(area.area_id).includes(q);
    const matchStatus = statusFilter === 'All' || area.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openAddModal = () => {
    setEditingArea(null);
    setAreaName('');
    setAreaLocation('');
    setAreaStatus('Active');
    setModalError('');
    setFeedback(null);
    setIsModalOpen(true);
  };

  const openEditModal = (area: ParkingArea) => {
    setEditingArea(area);
    setAreaName(area.area_name);
    setAreaLocation(area.location);
    setAreaStatus(area.status);
    setModalError('');
    setFeedback(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingArea(null);
    setModalError('');
  };

  const handleSaveArea = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    const cleanName = areaName.trim();
    const cleanLocation = areaLocation.trim();
    if (!cleanName || !cleanLocation) {
      setModalError('Area name and location are required.');
      return;
    }

    if (editingArea) {
      const res = updateArea(editingArea.area_id, cleanName, cleanLocation, areaStatus);
      if (res.success) {
        setFeedback({ type: 'success', text: res.message });
        closeModal();
      } else {
        setModalError(res.message);
      }
    } else {
      const res = addArea(cleanName, cleanLocation, areaStatus);
      if (res.success) {
        setFeedback({ type: 'success', text: res.message });
        closeModal();
      } else {
        setModalError(res.message);
      }
    }
  };

  const handleToggleStatus = (area: ParkingArea) => {
    const nextStatus: AreaStatus = area.status === 'Active' ? 'Inactive' : 'Active';
    const res = updateArea(area.area_id, area.area_name, area.location, nextStatus);
    if (res.success) {
      setFeedback({
        type: 'success',
        text: `${area.area_name} marked as ${nextStatus}.`
      });
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="admin-page-wrap">
      {/* Breadcrumb & Page Header with thin yellow dashed underline */}
      <div className="admin-breadcrumb">Admin Portal / Parking Areas</div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Parking Area Management</h1>
          <p className="admin-page-subtitle">
            Add and manage the parking areas users can search.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="btn-primary text-xs px-4 py-2.5"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Add Parking Area</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          role="status"
          className={`mb-5 p-3.5 rounded-[8px] text-xs flex items-center justify-between gap-2 border ${
            feedback.type === 'success'
              ? 'bg-[var(--status-available-bg)] border-[var(--status-available-border)] text-[var(--status-available)]'
              : 'bg-[var(--status-occupied-bg)] border-[var(--status-occupied-border)] text-[var(--status-occupied)]'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            {feedback.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="bg-transparent border-0 p-0 cursor-pointer text-current opacity-75 hover:opacity-100"
            aria-label="Dismiss message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Three Stat Cards */}
      <div className="admin-stats-grid-3">
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Areas</span>
          </div>
          <div className="admin-stat-value">{totalAreas}</div>
          <div className="admin-stat-caption">Configured parking locations</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Active Areas</span>
          </div>
          <div className="admin-stat-value">{activeAreas}</div>
          <div className="admin-stat-caption">Open for bookings</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Slots</span>
          </div>
          <div className="admin-stat-value">{totalSlotsCount}</div>
          <div className="admin-stat-caption">All slots across areas</div>
        </div>
      </div>

      {/* Search Box & Status Filter Select */}
      <div className="admin-filter-card">
        <div className="admin-search-box" style={{ maxWidth: '520px' }}>
          <Search className="admin-search-icon" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search area name or location..."
            aria-label="Search parking areas"
            className="admin-search-input"
          />
        </div>

        <div className="admin-filter-group">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'All' | AreaStatus)}
            aria-label="Filter by area status"
            className="admin-select"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Parking Areas Flat Table */}
      {filteredAreas.length > 0 ? (
        <div className="admin-flat-table-wrap">
          <div className="admin-flat-table-titlebar">
            <h2 className="admin-card-title">
              <MapPin className="w-4 h-4 text-[var(--primary-forest)]" aria-hidden="true" />
              <span>Parking Areas ({filteredAreas.length})</span>
            </h2>
          </div>

          <div className="admin-table-scroll">
            <table className="admin-flat-table">
              <thead>
                <tr>
                  <th>Area Name &amp; ID</th>
                  <th>Location</th>
                  <th>Capacity</th>
                  <th>Available Now</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAreas.map((area) => {
                  const areaSlots = slots.filter((s) => s.area_id === area.area_id);
                  const totalAreaSlots = areaSlots.length;
                  const carCount = areaSlots.filter((s) => s.vehicle_type === 'Car').length;
                  const bikeCount = areaSlots.filter((s) => s.vehicle_type === 'Motorcycle').length;
                  const availableNow = areaSlots.filter((s) => s.status === 'Available').length;
                  const isInactive = area.status === 'Inactive';

                  return (
                    <tr key={area.area_id} className={isInactive ? 'is-inactive' : ''}>
                      <td>
                        <div className="font-bold text-[var(--text-heading)] text-[13px]">
                          {area.area_name}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)]">
                          ID: #{area.area_id}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-start gap-1.5 text-[var(--text-ink)] max-w-xs">
                          <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0 mt-0.5" aria-hidden="true" />
                          <span>{area.location}</span>
                        </div>
                      </td>
                      <td>
                        <div className="font-bold text-[var(--text-heading)] tabular-nums">
                          {totalAreaSlots} Total
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)] mt-0.5 tabular-nums">
                          <span className="inline-flex items-center gap-1">
                            <Car className="w-3 h-3" aria-hidden="true" />
                            {carCount} Car
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Bike className="w-3 h-3" aria-hidden="true" />
                            {bikeCount} Motorcycle
                          </span>
                        </div>
                      </td>
                      <td className="font-bold text-[var(--status-available)] tabular-nums">
                        {availableNow} Available
                      </td>
                      <td>
                        <span
                          className={`badge-status ${
                            isInactive ? 'badge-neutral' : 'badge-available'
                          }`}
                        >
                          {area.status}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(area)}
                            className="admin-row-btn"
                          >
                            <Pencil className="w-3 h-3" aria-hidden="true" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(area)}
                            className={`admin-row-btn ${
                              isInactive ? 'admin-row-btn-success' : 'admin-row-btn-danger'
                            }`}
                          >
                            {isInactive ? 'Activate' : 'Deactivate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="admin-card text-center py-10">
          <MapPin className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm font-bold text-[var(--text-heading)] m-0">No parking areas found</p>
          <p className="text-xs text-[var(--text-muted)] mt-1 mb-4">
            {searchQuery || statusFilter !== 'All'
              ? 'No parking areas matched your search or status filter.'
              : 'Add a parking area so users can search for slots.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('All');
            }}
            className="btn-secondary text-xs px-4 py-2"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Unified Add / Edit Area Modal */}
      {isModalOpen && (
        <div className="admin-modal-backdrop">
          <div
            className="admin-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="area-modal-title"
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-4 right-4 bg-transparent border-0 p-1 text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 id="area-modal-title" className="title-underline text-base font-bold text-[var(--text-heading)]">
              {editingArea ? `Edit Parking Area #${editingArea.area_id}` : 'Add Parking Area'}
            </h2>

            {modalError && (
              <div
                role="alert"
                className="mb-4 p-3 bg-[var(--status-occupied-bg)] border border-[var(--status-occupied-border)] rounded-[8px] text-xs text-[var(--status-occupied)] flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveArea} className="space-y-4 text-xs" noValidate>
              <div>
                <label htmlFor="area-name-input" className="form-label block mb-1">
                  Area Name
                </label>
                <input
                  id="area-name-input"
                  type="text"
                  required
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  placeholder="e.g. GEC Circle"
                  className="form-input"
                />
              </div>

              <div>
                <label htmlFor="area-location-input" className="form-label block mb-1">
                  Location
                </label>
                <input
                  id="area-location-input"
                  type="text"
                  required
                  value={areaLocation}
                  onChange={(e) => setAreaLocation(e.target.value)}
                  placeholder="e.g. GEC More, Near Sanmar Ocean City, Chattogram"
                  className="form-input"
                />
              </div>

              <div>
                <label htmlFor="area-status-select" className="form-label block mb-1">
                  Status
                </label>
                <select
                  id="area-status-select"
                  value={areaStatus}
                  onChange={(e) => setAreaStatus(e.target.value as AreaStatus)}
                  className="form-select"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary text-xs px-3.5 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs px-4 py-2"
                >
                  {editingArea ? 'Save Changes' : 'Create Area'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
