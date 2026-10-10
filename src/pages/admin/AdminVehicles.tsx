import React, { useState } from 'react';
import { mockDb } from '../../db/mockDb';
import { Vehicle, VehicleType, VehicleStatus } from '../../types';
import { Car, Bike, Search, Filter, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';

export const AdminVehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState(() => mockDb.getAllVehicles());
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | VehicleType>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | VehicleStatus>('All');

  const refreshVehicles = () => {
    setVehicles(mockDb.getAllVehicles());
  };

  const filteredVehicles = vehicles.filter((v) => {
    if (typeFilter !== 'All' && v.vehicle_type !== typeFilter) return false;
    if (statusFilter !== 'All' && v.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPlate = v.vehicle_number.toLowerCase().includes(q);
      const matchBrand = v.brand.toLowerCase().includes(q);
      const matchModel = v.model.toLowerCase().includes(q);
      const matchOwner = (v as any).owner_name?.toLowerCase().includes(q) || false;
      if (!matchPlate && !matchBrand && !matchModel && !matchOwner) return false;
    }
    return true;
  });

  const totalVehicles = vehicles.length;
  const totalCars = vehicles.filter((v) => v.vehicle_type === 'Car').length;
  const totalMotos = vehicles.filter((v) => v.vehicle_type === 'Motorcycle').length;
  const activeCount = vehicles.filter((v) => v.status === 'Active').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#16261d] tracking-tight">
          Vehicle Management
        </h1>
        <p className="text-xs text-[#455549] mt-1">
          View and manage registered user vehicles stored in the ParkEase database.
        </p>
      </div>

      {/* Summary Metrics derived strictly from database */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block font-semibold">
            TOTAL VEHICLES
          </span>
          <strong className="text-2xl font-bold text-[#16261d] block mt-1">
            {totalVehicles}
          </strong>
          <span className="text-[10px] text-[#455549] block mt-0.5">Database records</span>
        </div>

        <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block font-semibold">
            REGISTERED CARS
          </span>
          <strong className="text-2xl font-bold text-[#1b5e3b] block mt-1">
            {totalCars}
          </strong>
          <span className="text-[10px] text-[#455549] block mt-0.5">Passenger Cars</span>
        </div>

        <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block font-semibold">
            MOTORCYCLES
          </span>
          <strong className="text-2xl font-bold text-[#1b5e3b] block mt-1">
            {totalMotos}
          </strong>
          <span className="text-[10px] text-[#455549] block mt-0.5">Two-wheelers</span>
        </div>

        <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block font-semibold">
            ACTIVE STATUS
          </span>
          <strong className="text-2xl font-bold text-[#16261d] block mt-1">
            {activeCount}
          </strong>
          <span className="text-[10px] text-[#1b5e3b] font-medium block mt-0.5">
            Eligible for booking
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-[#16261d]">Type:</span>
          {(['All', 'Car', 'Motorcycle'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                typeFilter === t
                  ? 'bg-[#1b5e3b] text-white'
                  : 'bg-[#eff5f0] text-[#455549] hover:text-[#16261d]'
              }`}
            >
              {t}
            </button>
          ))}

          <span className="text-xs font-bold text-[#16261d] ml-2">Status:</span>
          {(['All', 'Active', 'Inactive'] as const).map((s) => (
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

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#455549] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search plate, model, owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs neu-input"
          />
        </div>
      </div>

      {/* Vehicle Table */}
      <div className="neu-raised p-5 rounded-xl border border-[#cfd9d1]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#16261d]">
            Vehicle Registry ({filteredVehicles.length} Records)
          </h2>
        </div>

        {filteredVehicles.length === 0 ? (
          <div className="p-8 text-center text-[#455549] text-xs">
            No vehicle records found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#cfd9d1] text-[#455549] uppercase font-mono text-[10px]">
                  <th className="py-2.5 px-3">Vehicle ID</th>
                  <th className="py-2.5 px-3">License Plate</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Make & Model</th>
                  <th className="py-2.5 px-3">Registered Owner</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#cfd9d1]/60">
                {filteredVehicles.map((v) => (
                  <tr key={v.vehicle_id} className="hover:bg-[#dee4df]/50">
                    <td className="py-3 px-3 font-mono text-[#455549]">#{v.vehicle_id}</td>
                    <td className="py-3 px-3 font-mono font-bold text-[#16261d]">
                      {v.vehicle_number}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 font-medium">
                        {v.vehicle_type === 'Car' ? (
                          <Car className="w-3.5 h-3.5 text-[#1b5e3b]" />
                        ) : (
                          <Bike className="w-3.5 h-3.5 text-[#1b5e3b]" />
                        )}
                        <span>{v.vehicle_type}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#16261d]">
                      {v.brand} {v.model}
                    </td>
                    <td className="py-3 px-3">
                      <strong className="block text-[#16261d]">
                        {(v as any).owner_name || `User #${v.user_id}`}
                      </strong>
                      <span className="text-[10px] text-[#455549]">
                        {(v as any).owner_email || ''}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          v.status === 'Active'
                            ? 'bg-[#dcefe3] text-[#1b5e3b]'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
