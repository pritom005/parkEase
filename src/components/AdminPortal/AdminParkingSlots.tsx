import React, { useState } from 'react';
import { useParkEase } from '../../context/ParkEaseContext';
import { ParkingSlot, VehicleType, SlotStatus } from '../../types';
import { Plus, Check, AlertCircle, X, Layers, Pencil } from 'lucide-react';

// Small car or motorcycle SVG icon matching screenshot tiles
const VehicleTypeIcon: React.FC<{ type: VehicleType }> = ({ type }) => {
  if (type === 'Car') {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M5 11l2-5h10l2 5" />
        <rect x="3" y="11" width="18" height="6" rx="2" />
        <circle cx="7.5" cy="17" r="1.5" />
        <circle cx="16.5" cy="17" r="1.5" />
      </svg>
    );
  }
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="6.5" cy="16.5" r="2.5" />
      <circle cx="17.5" cy="16.5" r="2.5" />
      <path d="M9 16.5h4l2.5-6.5h-4l-1.5 3.5" />
      <path d="M14 8h3l1 2" />
    </svg>
  );
};

export const AdminParkingSlots: React.FC = () => {
  const { areas, slots, addSlot, updateSlot } = useParkEase();

  // Filter toolbar state matching Screenshot 7: Select Area, Type, Status (Available/Booked/Occupied)
  const [selectedAreaId, setSelectedAreaId] = useState<number>(areas[0]?.area_id || 1);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'All' | VehicleType>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'All' | SlotStatus>('All');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Unified Add / Edit Slot Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ParkingSlot | null>(null);
  const [modalAreaId, setModalAreaId] = useState<number>(areas[0]?.area_id || 1);
  const [modalSlotNumber, setModalSlotNumber] = useState('');
  const [modalVehicleType, setModalVehicleType] = useState<VehicleType>('Car');
  const [modalPrice, setModalPrice] = useState<number>(250);
  const [modalDayPrice, setModalDayPrice] = useState<number>(2000);
  const [modalStatus, setModalStatus] = useState<SlotStatus>('Available');
  const [modalError, setModalError] = useState('');

  // Ensure selected area remains valid if areas change
  const activeArea = areas.find((a) => a.area_id === selectedAreaId) || areas[0];
  const currentAreaId = activeArea?.area_id || selectedAreaId;

  // Database stats strictly for the selected area
  const areaSlots = slots.filter((s) => s.area_id === currentAreaId);
  const areaTotalCount = areaSlots.length;
  const areaAvailableCount = areaSlots.filter((s) => s.status === 'Available').length;
  const areaBookedCount = areaSlots.filter((s) => s.status === 'Booked').length;
  const areaOccupiedCount = areaSlots.filter((s) => s.status === 'Occupied').length;

  // Filtered slots within the selected area
  const filteredSlots = areaSlots.filter((s) => {
    const matchType = selectedTypeFilter === 'All' || s.vehicle_type === selectedTypeFilter;
    const matchStatus = selectedStatusFilter === 'All' || s.status === selectedStatusFilter;
    return matchType && matchStatus;
  });

  const openAddModal = () => {
    setEditingSlot(null);
    setModalAreaId(currentAreaId || areas[0]?.area_id || 1);
    setModalSlotNumber('');
    setModalVehicleType('Car');
    setModalPrice(250);
    setModalDayPrice(2000);
    setModalStatus('Available');
    setModalError('');
    setFeedback(null);
    setIsModalOpen(true);
  };

  const openEditModal = (slot: ParkingSlot) => {
    setEditingSlot(slot);
    setModalAreaId(slot.area_id);
    setModalSlotNumber(slot.slot_number);
    setModalVehicleType(slot.vehicle_type);
    setModalPrice(slot.price_per_hour);
    setModalDayPrice(slot.day_price || (slot.vehicle_type === 'Car' ? 2000 : 1000));
    setModalStatus(slot.status);
    setModalError('');
    setFeedback(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSlot(null);
    setModalError('');
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    const cleanNumber = modalSlotNumber.trim().toUpperCase();
    const numericPrice = Number(modalPrice);
    const numericDayPrice = Number(modalDayPrice);

    if (!cleanNumber) {
      setModalError('Slot number is required.');
      return;
    }
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setModalError('Price per hour must be greater than zero.');
      return;
    }
    if (isNaN(numericDayPrice) || numericDayPrice <= 0) {
      setModalError('Price per day must be greater than zero.');
      return;
    }

    if (editingSlot) {
      const res = updateSlot(
        editingSlot.slot_id,
        numericPrice,
        modalStatus,
        Number(modalAreaId),
        cleanNumber,
        modalVehicleType,
        numericDayPrice
      );
      if (res.success) {
        setSelectedAreaId(Number(modalAreaId));
        setFeedback({ type: 'success', text: res.message });
        closeModal();
      } else {
        setModalError(res.message);
      }
    } else {
      const res = addSlot(
        Number(modalAreaId),
        cleanNumber,
        modalVehicleType,
        numericPrice,
        modalStatus,
        numericDayPrice
      );
      if (res.success) {
        setSelectedAreaId(Number(modalAreaId));
        setFeedback({ type: 'success', text: res.message });
        closeModal();
      } else {
        setModalError(res.message);
      }
    }
  };

  const clearFilters = () => {
    setSelectedTypeFilter('All');
    setSelectedStatusFilter('All');
  };

  return (
    <div className="admin-page-wrap">
      {/* Breadcrumb & Page Header with thin yellow dashed line */}
      <div className="admin-breadcrumb">Admin Portal / Parking Slots</div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Parking Slot Management</h1>
          <p className="admin-page-subtitle">
            Manage slots, prices and status for each parking area.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="btn-primary text-xs px-4 py-2.5"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Add New Slot</span>
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

      {/* Filter Card: Select Area, Type (All, Car, Motorcycle), Status (All, Available, Booked, Occupied) */}
      <div className="admin-slots-filter-card">
        <div className="admin-filter-group">
          <label htmlFor="filter-slot-area-select" className="admin-filter-label">
            Select Area:
          </label>
          <select
            id="filter-slot-area-select"
            value={currentAreaId}
            onChange={(e) => setSelectedAreaId(Number(e.target.value))}
            aria-label="Select parking area"
            className="admin-select"
          >
            {areas.map((a) => {
              const count = slots.filter((s) => s.area_id === a.area_id).length;
              return (
                <option key={a.area_id} value={a.area_id}>
                  {a.area_name} ({count} {count === 1 ? 'slot' : 'slots'})
                </option>
              );
            })}
          </select>
        </div>

        <div className="admin-filter-group">
          <span className="admin-filter-label">Type:</span>
          {(['All', 'Car', 'Motorcycle'] as const).map((typeOption) => (
            <button
              key={typeOption}
              type="button"
              onClick={() => setSelectedTypeFilter(typeOption)}
              className={`admin-filter-btn ${selectedTypeFilter === typeOption ? 'active' : ''}`}
            >
              {typeOption}
            </button>
          ))}
        </div>

        <div className="admin-filter-group">
          <span className="admin-filter-label">Status:</span>
          {(['All', 'Available', 'Booked', 'Occupied'] as const).map((statusOption) => (
            <button
              key={statusOption}
              type="button"
              onClick={() => setSelectedStatusFilter(statusOption)}
              className={`admin-filter-btn ${selectedStatusFilter === statusOption ? 'active' : ''}`}
            >
              {statusOption}
            </button>
          ))}
        </div>
      </div>

      {/* Four Stat Cards for the Selected Area */}
      <div className="admin-stats-grid-4">
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Slots</span>
          </div>
          <div className="admin-stat-value">{areaTotalCount}</div>
          <div className="admin-stat-caption">{activeArea?.area_name || 'Selected area'}</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Available</span>
          </div>
          <div className="admin-stat-value is-success">{areaAvailableCount}</div>
          <div className="admin-stat-caption">Ready for booking</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Booked</span>
          </div>
          <div className="admin-stat-value is-warning">{areaBookedCount}</div>
          <div className="admin-stat-caption">Reserved by user</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Occupied</span>
          </div>
          <div className="admin-stat-value is-danger">{areaOccupiedCount}</div>
          <div className="admin-stat-caption is-danger">Currently parked</div>
        </div>
      </div>

      {/* Slot Grid Card: "Slots in [area] (n)" */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">
            <Layers className="w-4 h-4 text-[var(--primary-forest)]" aria-hidden="true" />
            <span>
              Slots in {activeArea?.area_name || 'Area'} ({filteredSlots.length})
            </span>
          </h2>
          {activeArea && (
            <span className="text-xs text-[var(--text-muted)]">{activeArea.location}</span>
          )}
        </div>

        {filteredSlots.length > 0 ? (
          <div className="admin-slots-tile-grid">
            {filteredSlots.map((slot, index) => {
              const tileVariant =
                slot.status === 'Available'
                  ? 'is-available'
                  : slot.status === 'Booked'
                  ? 'is-booked'
                  : 'is-occupied';

              const statusBadgeClass =
                slot.status === 'Available'
                  ? 'badge-available'
                  : slot.status === 'Booked'
                  ? 'badge-booked'
                  : 'badge-occupied';

              const isOccupied = slot.status === 'Occupied';
              const dayPrice =
                typeof slot.day_price === 'number' && slot.day_price > 0
                  ? slot.day_price
                  : slot.vehicle_type === 'Car'
                  ? 2000
                  : 1000;

              return (
                <div key={slot.slot_id} className={`admin-slot-tile ${tileVariant}`}>
                  {/* Top Row: Index Number + Green P (when Available) & Vehicle Icon */}
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      {slot.status === 'Available' && (
                        <span className="admin-slot-p-mark" aria-hidden="true">
                          P
                        </span>
                      )}
                      <span className="text-[11px] font-bold text-[var(--text-muted)] tabular-nums">
                        #{index + 1}
                      </span>
                    </div>

                    <span
                      className={
                        isOccupied ? 'text-[var(--text-muted)]' : 'text-[var(--primary-forest)]'
                      }
                      title={slot.vehicle_type}
                    >
                      <VehicleTypeIcon type={slot.vehicle_type} />
                    </span>
                  </div>

                  {/* Middle: Slot Code & DB Hourly / Daily Pricing */}
                  <div>
                    <div
                      className={`text-[15px] font-bold leading-tight ${
                        isOccupied ? 'text-[var(--text-muted)]' : 'text-[var(--text-heading)]'
                      }`}
                    >
                      {slot.slot_number}
                    </div>
                    <div
                      className={`text-xs font-bold mt-1 tabular-nums ${
                        isOccupied ? 'text-[var(--text-muted)]' : 'text-[var(--text-ink)]'
                      }`}
                    >
                      BDT {slot.price_per_hour}/hr
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] tabular-nums">
                      BDT {dayPrice}/day
                    </div>
                  </div>

                  {/* Bottom Row: Status Label & Edit Icon Button */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className={`badge-status ${statusBadgeClass}`}>{slot.status}</span>
                    <button
                      type="button"
                      onClick={() => openEditModal(slot)}
                      className="admin-slot-edit-btn"
                      aria-label={`Edit slot ${slot.slot_number}`}
                    >
                      <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Layers className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm font-bold text-[var(--text-heading)] m-0">
              No parking slots match your filters
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1 mb-4">
              Try resetting the vehicle type or status filter for this area.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="btn-secondary text-xs px-4 py-2"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Unified Add / Edit Slot Modal */}
      {isModalOpen && (
        <div className="admin-modal-backdrop">
          <div
            className="admin-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="slot-modal-title"
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-4 right-4 bg-transparent border-0 p-1 text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <h2
              id="slot-modal-title"
              className="title-underline text-base font-bold text-[var(--text-heading)]"
            >
              {editingSlot ? `Edit Slot ${editingSlot.slot_number}` : 'Add New Slot'}
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

            <form onSubmit={handleSaveSlot} className="space-y-3.5 text-xs" noValidate>
              <div>
                <label htmlFor="slot-area-select" className="form-label block mb-1">
                  Area
                </label>
                <select
                  id="slot-area-select"
                  value={modalAreaId}
                  onChange={(e) => setModalAreaId(Number(e.target.value))}
                  className="form-select"
                >
                  {areas.map((a) => (
                    <option key={a.area_id} value={a.area_id}>
                      {a.area_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="slot-number-input" className="form-label block mb-1">
                  Slot Number
                </label>
                <input
                  id="slot-number-input"
                  type="text"
                  required
                  value={modalSlotNumber}
                  onChange={(e) => setModalSlotNumber(e.target.value)}
                  placeholder="e.g. C-01 or M-01"
                  className="form-input uppercase"
                />
              </div>

              <div>
                <label htmlFor="slot-vehicle-type-select" className="form-label block mb-1">
                  Vehicle Type
                </label>
                <select
                  id="slot-vehicle-type-select"
                  value={modalVehicleType}
                  onChange={(e) => {
                    const nextType = e.target.value as VehicleType;
                    setModalVehicleType(nextType);
                    if (!editingSlot) {
                      if (nextType === 'Car' && modalPrice === 100 && modalDayPrice === 1000) {
                        setModalPrice(250);
                        setModalDayPrice(2000);
                      } else if (nextType === 'Motorcycle' && modalPrice === 250 && modalDayPrice === 2000) {
                        setModalPrice(100);
                        setModalDayPrice(1000);
                      }
                    }
                  }}
                  className="form-select"
                >
                  <option value="Car">Car</option>
                  <option value="Motorcycle">Motorcycle</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="slot-price-input" className="form-label block mb-1">
                    Price per hour (BDT)
                  </label>
                  <input
                    id="slot-price-input"
                    type="number"
                    required
                    min="1"
                    value={modalPrice}
                    onChange={(e) => setModalPrice(Number(e.target.value))}
                    className="form-input"
                  />
                </div>

                <div>
                  <label htmlFor="slot-day-price-input" className="form-label block mb-1">
                    Price per day (BDT)
                  </label>
                  <input
                    id="slot-day-price-input"
                    type="number"
                    required
                    min="1"
                    value={modalDayPrice}
                    onChange={(e) => setModalDayPrice(Number(e.target.value))}
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="slot-status-select" className="form-label block mb-1">
                  Status
                </label>
                <select
                  id="slot-status-select"
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value as SlotStatus)}
                  className="form-select"
                >
                  <option value="Available">Available</option>
                  <option value="Booked">Booked</option>
                  <option value="Occupied">Occupied</option>
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
                  {editingSlot ? 'Save Changes' : 'Create Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

