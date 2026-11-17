import React, { useState } from 'react';
import { useParkEase } from '../../context/ParkEaseContext';
import { Vehicle } from '../../types';
import { Search, Car, Bike, User as UserIcon, Eye, X } from 'lucide-react';

export const AdminVehicles: React.FC = () => {
  const { vehicles, users } = useParkEase();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Car' | 'Motorcycle'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [viewingVehicle, setViewingVehicle] = useState<Vehicle | null>(null);

  const totalVehicles = vehicles.length;
  const totalCars = vehicles.filter((v) => v.vehicle_type === 'Car').length;
  const totalMotorcycles = vehicles.filter((v) => v.vehicle_type === 'Motorcycle').length;
  const activeVehicles = vehicles.filter((v) => v.status === 'Active').length;

  const filteredVehicles = vehicles.filter((v) => {
    const owner = users.find((u) => u.user_id === v.user_id);
    const ownerName = owner?.full_name || '';
    const q = searchTerm.trim().toLowerCase();

    const matchSearch =
      !q ||
      v.vehicle_number.toLowerCase().includes(q) ||
      v.brand.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      ownerName.toLowerCase().includes(q);
    const matchType = typeFilter === 'All' || v.vehicle_type === typeFilter;
    const matchStatus = statusFilter === 'All' || v.status === statusFilter;

    return matchSearch && matchType && matchStatus;
  });

  const viewingOwner = viewingVehicle
    ? users.find((u) => u.user_id === viewingVehicle.user_id) || null
    : null;

  return (
    <div className="admin-page-wrap">
      {/* Breadcrumb & Page Title with thin yellow dashed underline */}
      <div className="admin-breadcrumb">Admin Portal / Vehicles</div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Vehicle Management</h1>
          <p className="admin-page-subtitle">
            View all registered vehicles and their owners.
          </p>
        </div>
      </div>

      {/* Stat Cards (Database counts only) */}
      <div className="admin-stats-grid-4">
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Registered</span>
          </div>
          <div className="admin-stat-value">{totalVehicles}</div>
          <div className="admin-stat-caption">All registered vehicles</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Cars</span>
          </div>
          <div className="admin-stat-value">{totalCars}</div>
          <div className="admin-stat-caption">Registered cars</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Motorcycles</span>
          </div>
          <div className="admin-stat-value">{totalMotorcycles}</div>
          <div className="admin-stat-caption">Registered motorcycles</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Active Status</span>
          </div>
          <div className="admin-stat-value">{activeVehicles}</div>
          <div className="admin-stat-caption">Eligible for booking</div>
        </div>
      </div>

      {/* Search Box and Two Selects (All Types, All Status) */}
      <div className="admin-filter-card">
        <div className="admin-search-box" style={{ maxWidth: '520px' }}>
          <Search className="admin-search-icon" aria-hidden="true" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by license plate, brand, model or owner name..."
            aria-label="Search vehicles"
            className="admin-search-input"
          />
        </div>

        <div className="admin-filter-group">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'All' | 'Car' | 'Motorcycle')}
            aria-label="Filter by vehicle type"
            className="admin-select"
          >
            <option value="All">All Types</option>
            <option value="Car">Car</option>
            <option value="Motorcycle">Motorcycle</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'All' | 'Active' | 'Inactive')}
            aria-label="Filter by vehicle status"
            className="admin-select"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Vehicle Inventory Flat Table */}
      <div className="admin-flat-table-wrap">
        <div className="admin-flat-table-titlebar">
          <h2 className="admin-card-title">
            <Car className="w-4 h-4 text-[var(--primary-forest)]" aria-hidden="true" />
            <span>Vehicle Inventory ({filteredVehicles.length})</span>
          </h2>
        </div>

        <div className="admin-table-scroll">
          <table className="admin-flat-table">
            <thead>
              <tr>
                <th>License Plate</th>
                <th>Type</th>
                <th>Brand &amp; Model</th>
                <th>Owner</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.length > 0 ? (
                filteredVehicles.map((vehicle) => {
                  const owner = users.find((u) => u.user_id === vehicle.user_id);

                  return (
                    <tr key={vehicle.vehicle_id}>
                      <td>
                        <div className="flex items-center flex-wrap gap-1.5">
                          <span className="admin-plate-tile">{vehicle.vehicle_number}</span>
                          {vehicle.is_active_selection && (
                            <span className="admin-primary-tag">Primary</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--text-ink)]">
                          {vehicle.vehicle_type === 'Car' ? (
                            <Car className="w-3.5 h-3.5 text-[var(--primary-forest)]" aria-hidden="true" />
                          ) : (
                            <Bike className="w-3.5 h-3.5 text-[var(--status-booked)]" aria-hidden="true" />
                          )}
                          <span>{vehicle.vehicle_type}</span>
                        </span>
                      </td>
                      <td>
                        <div className="font-semibold text-[var(--text-heading)]">{vehicle.brand}</div>
                        <div className="text-[11px] text-[var(--text-muted)]">{vehicle.model}</div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 font-semibold text-[var(--text-heading)]">
                          <UserIcon className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" aria-hidden="true" />
                          <span>{owner?.full_name || 'Unknown'}</span>
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] pl-5">
                          {owner?.phone || 'N/A'}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge-status ${
                            vehicle.status === 'Active' ? 'badge-available' : 'badge-neutral'
                          }`}
                        >
                          {vehicle.status}
                        </span>
                      </td>
                      <td className="text-right">
                        <button
                          type="button"
                          onClick={() => setViewingVehicle(vehicle)}
                          className="admin-row-btn"
                        >
                          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[var(--text-muted)]">
                    No vehicles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Read-Only Vehicle View Modal */}
      {viewingVehicle && (
        <div className="admin-modal-backdrop">
          <div
            className="admin-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="vehicle-view-title"
          >
            <button
              type="button"
              onClick={() => setViewingVehicle(null)}
              className="absolute top-4 right-4 bg-transparent border-0 p-1 text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
              aria-label="Close vehicle details"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 id="vehicle-view-title" className="title-underline text-base font-bold text-[var(--text-heading)]">
              Vehicle Details #{viewingVehicle.vehicle_id}
            </h2>

            <div className="space-y-3 text-xs">
              <div className="inspector-inset-box mb-0 space-y-2">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[var(--text-muted)]">License Plate</span>
                  <span className="admin-plate-tile">{viewingVehicle.vehicle_number}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[var(--text-muted)]">Vehicle Type</span>
                  <span className="font-bold text-[var(--text-heading)]">{viewingVehicle.vehicle_type}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[var(--text-muted)]">Brand &amp; Model</span>
                  <span className="font-bold text-[var(--text-heading)]">
                    {viewingVehicle.brand} {viewingVehicle.model}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[var(--text-muted)]">Status</span>
                  <span
                    className={`badge-status ${
                      viewingVehicle.status === 'Active' ? 'badge-available' : 'badge-neutral'
                    }`}
                  >
                    {viewingVehicle.status}
                  </span>
                </div>
                <div className="flex justify-between gap-2 pt-2 border-t border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)]">Owner</span>
                  <span className="font-semibold text-[var(--text-heading)]">
                    {viewingOwner?.full_name || 'Unknown'} ({viewingOwner?.phone || 'N/A'})
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[var(--text-muted)]">Registered</span>
                  <span className="text-[var(--text-ink)]">{viewingVehicle.created_at}</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setViewingVehicle(null)}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
