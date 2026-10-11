import React, { useState } from 'react';
import { mockDb } from '../../db/mockDb';
import { Vehicle, VehicleType, VehicleStatus } from '../../types';
import {
  Car,
  Bike,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Tag,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';

export const AdminVehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => mockDb.getAllVehicles());
  const [users] = useState(() => mockDb.getUsers());
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | VehicleType>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | VehicleStatus>('All');

  const refreshVehicles = () => {
    setVehicles(mockDb.getAllVehicles());
  };

  const getUserName = (userId: number): string => {
    const user = users.find((u) => u.user_id === userId);
    return user ? user.full_name : `User #${userId}`;
  };

  const getUserPhone = (userId: number): string => {
    const user = users.find((u) => u.user_id === userId);
    return user ? user.phone : 'N/A';
  };

  const filteredVehicles = vehicles.filter((v) => {
    if (typeFilter !== 'All' && v.vehicle_type !== typeFilter) return false;
    if (statusFilter !== 'All' && v.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPlate = v.vehicle_number.toLowerCase().includes(q);
      const matchBrand = v.brand.toLowerCase().includes(q);
      const matchModel = v.model.toLowerCase().includes(q);
      const ownerName = getUserName(v.user_id).toLowerCase();
      const matchOwner = ownerName.includes(q);
      if (!matchPlate && !matchBrand && !matchModel && !matchOwner) return false;
    }
    return true;
  });

  const handleToggleStatus = (vehicle: Vehicle) => {
    const nextStatus: VehicleStatus = vehicle.status === 'Active' ? 'Inactive' : 'Active';
    const actionText = nextStatus === 'Inactive' ? 'deactivate' : 'activate';

    if (confirm(`Are you sure you want to ${actionText} vehicle ${vehicle.vehicle_number}?`)) {
      mockDb.updateVehicleStatus(vehicle.vehicle_id, nextStatus);
      refreshVehicles();
    }
  };

  const totalVehicles = vehicles.length;
  const carCount = vehicles.filter((v) => v.vehicle_type === 'Car').length;
  const bikeCount = vehicles.filter((v) => v.vehicle_type === 'Motorcycle').length;
  const activeCount = vehicles.filter((v) => v.status === 'Active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#16261d] tracking-tight">
          Vehicle Management
        </h1>
        <p className="text-xs text-[#455549] mt-1">
          Registered vehicles directory, owner associations, BRTA registration verification, and fleet status.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block font-semibold">
            TOTAL REGISTERED
          </span>
          <strong className="text-2xl font-bold text-[#16261d] block mt-1">
            {totalVehicles}
          </strong>
          <span className="text-[10px] text-[#455549] block mt-0.5">Municipal vehicle registry</span>
        </div>

        <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block font-semibold">
            CARS / SEDANS
          </span>
          <strong className="text-2xl font-bold text-[#1b5e3b] block mt-1">
            {carCount}
          </strong>
          <span className="text-[10px] text-[#1b5e3b] font-medium block mt-0.5">
            Four-wheelers
          </span>
        </div>

        <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block font-semibold">
            MOTORCYCLES
          </span>
          <strong className="text-2xl font-bold text-[#16261d] block mt-1">
            {bikeCount}
          </strong>
          <span className="text-[10px] text-[#455549] block mt-0.5">Two-wheelers</span>
        </div>

        <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block font-semibold">
            ACTIVE STATUS
          </span>
          <strong className="text-2xl font-bold text-[#1b5e3b] block mt-1">
            {activeCount}
          </strong>
          <span className="text-[10px] text-[#1b5e3b] font-medium block mt-0.5">
            Eligible for booking
          </span>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="neu-raised p-4 rounded-2xl border border-[#cfd9d1] space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#455549]" />
            <input
              type="text"
              placeholder="Search by license plate, brand, model or owner name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-[#cfd9d1] bg-white text-[#16261d] focus:outline-none focus:ring-2 focus:ring-[#1b5e3b]"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <div className="flex items-center gap-1.5 px-2 bg-[#f4f7f4] rounded-xl border border-[#cfd9d1]">
              <Filter className="w-3.5 h-3.5 text-[#455549]" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                aria-label="Filter by vehicle type"
                className="bg-transparent text-xs text-[#16261d] py-2 pr-2 font-medium focus:outline-none cursor-pointer"
              >
                <option value="All">All Types</option>
                <option value="Car">Cars</option>
                <option value="Motorcycle">Motorcycles</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 px-2 bg-[#f4f7f4] rounded-xl border border-[#cfd9d1]">
              <Filter className="w-3.5 h-3.5 text-[#455549]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                aria-label="Filter by vehicle status"
                className="bg-transparent text-xs text-[#16261d] py-2 pr-2 font-medium focus:outline-none cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {(searchQuery || typeFilter !== 'All' || statusFilter !== 'All') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setTypeFilter('All');
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

      {/* Vehicles Table */}
      <div className="neu-raised rounded-2xl border border-[#cfd9d1] overflow-hidden bg-white">
        <div className="p-4 border-b border-[#cfd9d1] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-[#1b5e3b]" />
            <span className="text-xs font-bold text-[#16261d] uppercase tracking-wider font-mono">
              Vehicle Inventory ({filteredVehicles.length})
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#16261d]">
            <thead className="bg-[#f4f7f4] border-b border-[#cfd9d1] text-[10px] font-mono text-[#455549] uppercase">
              <tr>
                <th className="py-3 px-4">License Plate</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Brand & Model</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4">RFID & Verification</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#cfd9d1]">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#455549]">
                    <Car className="w-10 h-10 mx-auto text-[#455549]/40 mb-2" />
                    <p className="font-semibold text-sm text-[#16261d]">No vehicles found</p>
                    <p className="text-xs text-[#455549] mt-0.5">
                      No registered vehicle records matched your search or filters.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((vehicle) => {
                  const isCar = vehicle.vehicle_type === 'Car';
                  const ownerName = getUserName(vehicle.user_id);
                  const ownerPhone = getUserPhone(vehicle.user_id);

                  return (
                    <tr key={vehicle.vehicle_id} className="hover:bg-[#f8faf8] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#16261d]">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-[#f4f7f4] border border-[#cfd9d1] text-[11px] font-mono">
                            {vehicle.vehicle_number}
                          </span>
                          {vehicle.is_default && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-[#e4ede6] text-[#1b5e3b] font-semibold rounded">
                              Default
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#16261d]">
                          {isCar ? (
                            <Car className="w-3.5 h-3.5 text-[#1b5e3b]" />
                          ) : (
                            <Bike className="w-3.5 h-3.5 text-[#e58a13]" />
                          )}
                          {vehicle.vehicle_type}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-[#16261d]">{vehicle.brand}</div>
                        <div className="text-[11px] text-[#455549]">{vehicle.model}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <UserIcon className="w-3.5 h-3.5 text-[#455549]" />
                          <div>
                            <div className="font-semibold text-[#16261d]">{ownerName}</div>
                            <div className="text-[10px] text-[#455549] font-mono">{ownerPhone}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {vehicle.rfid_tag ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-[#f4f7f4] px-1.5 py-0.5 rounded border border-[#cfd9d1] text-[#455549]">
                              <Tag className="w-2.5 h-2.5 text-[#1b5e3b]" />
                              {vehicle.rfid_tag}
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#455549] italic">No RFID</span>
                          )}
                          {vehicle.brta_verified && (
                            <div className="flex items-center gap-1 text-[10px] text-[#1b5e3b] font-medium">
                              <ShieldCheck className="w-3 h-3" />
                              BRTA Verified
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            vehicle.status === 'Active'
                              ? 'bg-emerald-100 text-[#1b5e3b] border border-emerald-300'
                              : 'bg-red-100 text-red-700 border border-red-300'
                          }`}
                        >
                          {vehicle.status === 'Active' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {vehicle.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleStatus(vehicle)}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
                            vehicle.status === 'Active'
                              ? 'border-red-200 text-red-700 hover:bg-red-50'
                              : 'border-emerald-300 text-[#1b5e3b] hover:bg-emerald-50'
                          }`}
                        >
                          {vehicle.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
