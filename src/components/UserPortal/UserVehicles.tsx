import React, { useState } from 'react';
import { useParkEase } from '../../context/ParkEaseContext';
import { Vehicle, VehicleType } from '../../types';
import { Car, Bike, Plus, Edit, Trash2, Check, X, AlertCircle } from 'lucide-react';

export const UserVehicles: React.FC = () => {
  const {
    userVehicles,
    activeVehicle,
    addVehicle,
    editVehicle,
    deleteVehicle,
    setActiveVehicle
  } = useParkEase();

  // Inline Add Form State (matching screenshot layout)
  const [newNumber, setNewNumber] = useState('');
  const [newType, setNewType] = useState<VehicleType>('Car');
  const [newBrand, setNewBrand] = useState('');
  const [newModel, setNewModel] = useState('');

  // Edit Modal State
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [editBrand, setEditBrand] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editStatus, setEditStatus] = useState<'Active' | 'Inactive'>('Active');

  // Inline Delete Confirmation State
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Dynamic Counts for Top 3 Summary Cards
  const activeCount = userVehicles.filter((v) => v.status === 'Active').length;
  const carCount = userVehicles.filter((v) => v.vehicle_type === 'Car').length;
  const bikeCount = userVehicles.filter((v) => v.vehicle_type === 'Motorcycle').length;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const res = addVehicle(newNumber, newType, newBrand, newModel);
    if (res.success) {
      setMessage({ type: 'success', text: res.message });
      setNewNumber('');
      setNewBrand('');
      setNewModel('');
    } else {
      setMessage({ type: 'error', text: res.message });
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;
    setMessage(null);

    const res = editVehicle(editingVehicle.vehicle_id, editBrand, editModel, editStatus);
    if (res.success) {
      setMessage({ type: 'success', text: res.message });
      setEditingVehicle(null);
    } else {
      setMessage({ type: 'error', text: res.message });
    }
  };

  const handleDelete = (vehicleId: number) => {
    setMessage(null);
    const res = deleteVehicle(vehicleId);
    setConfirmDeleteId(null);
    if (res.success) {
      setMessage({ type: 'success', text: res.message });
    } else {
      setMessage({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="user-portal-container space-y-6">
      {/* Header */}
      <div className="user-page-header">
        <div>
          <h1 className="user-page-title">Vehicle Management</h1>
          <p className="user-page-subtitle">
            Add and manage your private vehicles for parking reservations in Chattogram.
          </p>
        </div>
      </div>

      {/* Feedback Banner */}
      {message && (
        <div
          role="status"
          className={`p-4 rounded-[8px] text-xs flex items-center justify-between gap-2 border ${
            message.type === 'success'
              ? 'bg-[var(--status-available-bg)] border-[var(--status-available-border)] text-[var(--status-available)]'
              : 'bg-[var(--status-occupied-bg)] border-[var(--status-occupied-border)] text-[var(--status-occupied)]'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            {message.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-current opacity-70 hover:opacity-100 bg-transparent border-0 cursor-pointer p-1"
            aria-label="Dismiss message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Row 1: 3 Summary KPI Cards */}
      <div className="user-stat-grid">
        <div className="user-stat-card">
          <div className="user-stat-label">My Registered Vehicles</div>
          <div className="user-stat-value">{userVehicles.length}</div>
          <div className="user-stat-hint tabular-nums">{activeCount} active in account</div>
        </div>

        <div className="user-stat-card">
          <div className="user-stat-label">Registered Cars</div>
          <div className="user-stat-value">{carCount}</div>
          <div className="user-stat-hint">Four-wheelers</div>
        </div>

        <div className="user-stat-card">
          <div className="user-stat-label">Motorcycles</div>
          <div className="user-stat-value">{bikeCount}</div>
          <div className="user-stat-hint">Two-wheelers</div>
        </div>
      </div>

      {/* Row 2: Two-Column Workspace (Left: Vehicle List, Right: Add New Vehicle Card) */}
      <div className="user-vehicle-layout">
        {/* Left Card: My Vehicles */}
        <div className="soft-raised-static p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[var(--text-heading)] m-0 tabular-nums">
              My Vehicles ({userVehicles.length})
            </h2>
            {activeVehicle && (
              <span className="text-xs text-[var(--text-muted)]">
                Primary: <strong className="text-[var(--text-heading)]">{activeVehicle.vehicle_number}</strong>
              </span>
            )}
          </div>

          {userVehicles.length > 0 ? (
            <div className="user-vehicle-list">
              {userVehicles.map((vehicle) => {
                const isPrimary = activeVehicle?.vehicle_id === vehicle.vehicle_id;
                const isConfirmingDelete = confirmDeleteId === vehicle.vehicle_id;

                return (
                  <div
                    key={vehicle.vehicle_id}
                    className={`vehicle-entry-card ${isPrimary ? 'is-primary' : ''}`}
                  >
                    <div className="vehicle-info-wrap min-w-0">
                      <div className="vehicle-well text-[var(--primary-forest)]">
                        {vehicle.vehicle_type === 'Car' ? (
                          <Car className="w-4 h-4" aria-hidden="true" />
                        ) : (
                          <Bike className="w-4 h-4" aria-hidden="true" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="vehicle-plate-text truncate">
                            {vehicle.vehicle_number}
                          </span>
                          {vehicle.status === 'Inactive' && (
                            <span className="badge-status badge-neutral">Inactive</span>
                          )}
                        </div>
                        <div className="vehicle-model-subtext mt-0.5 flex flex-wrap items-center gap-2">
                          <span>
                            {vehicle.brand} {vehicle.model} ({vehicle.vehicle_type})
                          </span>
                          {isPrimary && (
                            <span className="badge-status badge-available">Primary</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!isPrimary && vehicle.status === 'Active' && (
                        <button
                          type="button"
                          onClick={() => setActiveVehicle(vehicle.vehicle_id)}
                          className="text-xs font-semibold text-[var(--primary-forest)] hover:underline bg-transparent border-0 px-2 py-1 cursor-pointer"
                        >
                          Set Primary
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setEditingVehicle(vehicle);
                          setEditBrand(vehicle.brand);
                          setEditModel(vehicle.model);
                          setEditStatus(vehicle.status);
                          setConfirmDeleteId(null);
                          setMessage(null);
                        }}
                        className="p-1.5 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-base)] text-[var(--text-ink)] hover:border-[var(--primary-forest)] hover:text-[var(--primary-forest)] cursor-pointer transition-colors"
                        title="Edit vehicle"
                        aria-label={`Edit ${vehicle.vehicle_number}`}
                      >
                        <Edit className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>

                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDelete(vehicle.vehicle_id)}
                            className="px-2 py-1 rounded-[6px] bg-[var(--status-occupied)] text-white text-[11px] font-bold border-0 cursor-pointer"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-base)] text-[var(--text-muted)] text-[11px] font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(vehicle.vehicle_id)}
                          className="p-1.5 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-base)] text-[var(--text-muted)] hover:border-[var(--status-occupied)] hover:text-[var(--status-occupied)] cursor-pointer transition-colors"
                          title="Delete vehicle"
                          aria-label={`Delete ${vehicle.vehicle_number}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="user-empty-state">
              <Car className="w-9 h-9 text-[var(--text-muted)] mx-auto mb-2" aria-hidden="true" />
              <div className="user-empty-title">No Vehicles Registered</div>
              <p className="user-empty-desc m-0">
                Use the Add New Vehicle form on the right to register your car or motorcycle.
              </p>
            </div>
          )}
        </div>

        {/* Right Card: Add New Vehicle Form */}
        <div className="soft-raised-static p-5 sm:p-6">
          <h2 className="text-base font-bold text-[var(--text-heading)] mb-4">
            Add New Vehicle
          </h2>

          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div>
              <span className="form-label block mb-1.5">Vehicle Type</span>
              <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Vehicle Type">
                <button
                  type="button"
                  role="radio"
                  aria-checked={newType === 'Car'}
                  onClick={() => setNewType('Car')}
                  className={`py-2.5 px-3 rounded-[8px] text-xs font-bold flex items-center justify-center gap-2 border transition-colors cursor-pointer ${
                    newType === 'Car'
                      ? 'bg-[var(--primary-forest)] text-white border-[var(--primary-forest)]'
                      : 'bg-[var(--bg-base)] text-[var(--text-ink)] border-[var(--border-subtle)] hover:border-[var(--primary-forest)]'
                  }`}
                >
                  <Car className="w-4 h-4" aria-hidden="true" />
                  <span>Car</span>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={newType === 'Motorcycle'}
                  onClick={() => setNewType('Motorcycle')}
                  className={`py-2.5 px-3 rounded-[8px] text-xs font-bold flex items-center justify-center gap-2 border transition-colors cursor-pointer ${
                    newType === 'Motorcycle'
                      ? 'bg-[var(--primary-forest)] text-white border-[var(--primary-forest)]'
                      : 'bg-[var(--bg-base)] text-[var(--text-ink)] border-[var(--border-subtle)] hover:border-[var(--primary-forest)]'
                  }`}
                >
                  <Bike className="w-4 h-4" aria-hidden="true" />
                  <span>Motorcycle</span>
                </button>
              </div>
            </div>

            <div className="form-group m-0">
              <label htmlFor="add-vehicle-number" className="form-label">
                License Plate Number
              </label>
              <input
                id="add-vehicle-number"
                type="text"
                required
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
                placeholder="e.g. CTG-METRO-GA-12-3456"
                className="form-input uppercase"
              />
            </div>

            <div className="form-group m-0">
              <label htmlFor="add-vehicle-brand" className="form-label">
                Brand / Manufacturer
              </label>
              <input
                id="add-vehicle-brand"
                type="text"
                required
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                placeholder="e.g. Toyota, Honda, Yamaha"
                className="form-input"
              />
            </div>

            <div className="form-group m-0">
              <label htmlFor="add-vehicle-model" className="form-label">
                Model Name
              </label>
              <input
                id="add-vehicle-model"
                type="text"
                required
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                placeholder="e.g. Corolla, Allion, FZ"
                className="form-input"
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-2.5 text-xs uppercase tracking-wider"
            >
              <Plus className="w-4 h-4 text-white" aria-hidden="true" />
              <span>Register Vehicle</span>
            </button>
          </form>
        </div>
      </div>

      {/* Edit Vehicle Modal */}
      {editingVehicle && (
        <div
          className="fixed inset-0 z-[700] overflow-y-auto bg-black/40 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-vehicle-modal-title"
        >
          <div className="soft-raised-static max-w-md w-full p-6 text-[var(--text-ink)] relative">
            <button
              type="button"
              onClick={() => setEditingVehicle(null)}
              className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-heading)] p-1 rounded-[6px] hover:bg-[var(--bg-tint)] bg-transparent border-0 cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <h2
              id="edit-vehicle-modal-title"
              className="text-base font-bold text-[var(--text-heading)] border-b-2 border-dashed border-[var(--accent-gold)] pb-1 mb-2 inline-block"
            >
              Edit Vehicle
            </h2>
            <p className="text-xs text-[var(--text-muted)] font-mono mb-4">
              {editingVehicle.vehicle_number}
            </p>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="form-group m-0">
                <label htmlFor="edit-vehicle-brand" className="form-label">
                  Brand / Manufacturer
                </label>
                <input
                  id="edit-vehicle-brand"
                  type="text"
                  required
                  value={editBrand}
                  onChange={(e) => setEditBrand(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group m-0">
                <label htmlFor="edit-vehicle-model" className="form-label">
                  Model Name
                </label>
                <input
                  id="edit-vehicle-model"
                  type="text"
                  required
                  value={editModel}
                  onChange={(e) => setEditModel(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group m-0">
                <label htmlFor="edit-vehicle-status" className="form-label">
                  Status
                </label>
                <select
                  id="edit-vehicle-status"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'Active' | 'Inactive')}
                  className="form-select"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingVehicle(null)}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs px-4 py-2"
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
