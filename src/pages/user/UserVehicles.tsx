import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mockDb } from '../../db/mockDb';
import { Vehicle, VehicleType } from '../../types';
import {
  Car,
  Bike,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const UserVehicles: React.FC = () => {
  const { currentUser } = useAuth();
  const userId = currentUser?.user_id || 2;
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => mockDb.getVehiclesByUserId(userId));

  // Registration form state
  const [plate, setPlate] = useState('');
  const [vType, setVType] = useState<VehicleType>('Car');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refreshVehicles = () => {
    setVehicles(mockDb.getVehiclesByUserId(userId));
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!plate.trim()) {
      setError('Vehicle license plate is required.');
      return;
    }

    const res = mockDb.addVehicle(
      userId,
      plate.trim().toUpperCase(),
      vType,
      brand.trim() || (vType === 'Car' ? 'Toyota' : 'Honda'),
      model.trim() || (vType === 'Car' ? 'Corolla' : 'CB Hornet')
    );

    if (res.success) {
      setSuccess(`Vehicle ${plate.toUpperCase()} added successfully.`);
      setPlate('');
      setBrand('');
      setModel('');
      refreshVehicles();
    } else {
      setError(res.error || 'Failed to add vehicle');
    }
  };

  const handleSetPrimary = (vehicleId: number) => {
    mockDb.setDefaultVehicle(userId, vehicleId);
    refreshVehicles();
  };

  const handleDelete = (vehicleId: number) => {
    if (confirm('Are you sure you want to remove this vehicle?')) {
      mockDb.deleteVehicle(userId, vehicleId);
      refreshVehicles();
    }
  };

  const totalCars = vehicles.filter((v) => v.vehicle_type === 'Car').length;
  const totalBikes = vehicles.filter((v) => v.vehicle_type === 'Motorcycle').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#16261d] tracking-tight">
          Vehicle Management
        </h1>
        <p className="text-xs text-[#455549] mt-1">
          Add and manage your private vehicles for parking reservations in Chattogram.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block font-semibold">
            MY REGISTERED VEHICLES
          </span>
          <strong className="text-2xl font-bold text-[#16261d] block mt-1">
            {vehicles.length}
          </strong>
          <span className="text-[10px] text-[#455549] block mt-0.5">Active vehicles in account</span>
        </div>

        <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block font-semibold">
            REGISTERED CARS
          </span>
          <strong className="text-2xl font-bold text-[#1b5e3b] block mt-1">
            {totalCars}
          </strong>
          <span className="text-[10px] text-[#455549] block mt-0.5">Four-wheelers</span>
        </div>

        <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block font-semibold">
            MOTORCYCLES
          </span>
          <strong className="text-2xl font-bold text-[#1b5e3b] block mt-1">
            {totalBikes}
          </strong>
          <span className="text-[10px] text-[#455549] block mt-0.5">Two-wheelers</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Vehicles List (7 Cols) */}
        <div className="lg:col-span-7 neu-raised p-5 rounded-xl border border-[#cfd9d1] space-y-4">
          <h2 className="text-sm font-bold text-[#16261d]">
            My Vehicles ({vehicles.length})
          </h2>

          {vehicles.length === 0 ? (
            <div className="p-8 text-center text-[#455549] text-xs">
              No vehicles registered. Use the form on the right to add a vehicle.
            </div>
          ) : (
            <div className="space-y-3">
              {vehicles.map((v) => (
                <div
                  key={v.vehicle_id}
                  className="p-4 bg-white rounded-xl border border-[#cfd9d1] flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#eff5f0] text-[#1b5e3b] flex items-center justify-center">
                      {v.vehicle_type === 'Car' ? (
                        <Car className="w-5 h-5" />
                      ) : (
                        <Bike className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <strong className="text-sm font-mono font-bold text-[#16261d] block">
                        {v.vehicle_number}
                      </strong>
                      <span className="text-xs text-[#455549]">
                        {v.brand} {v.model} • {v.vehicle_type}
                      </span>
                      {v.is_default && (
                        <span className="inline-block text-[9px] font-bold text-[#1b5e3b] bg-[#dcefe3] px-1.5 py-0.5 rounded ml-2">
                          Primary
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!v.is_default && (
                      <button
                        onClick={() => handleSetPrimary(v.vehicle_id)}
                        className="text-xs font-semibold text-[#1b5e3b] hover:underline px-2 py-1"
                      >
                        Set Primary
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(v.vehicle_id)}
                      className="p-1.5 text-[#455549] hover:text-red-700 transition"
                      title="Remove Vehicle"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Vehicle Form (5 Cols) */}
        <div className="lg:col-span-5 neu-raised p-6 rounded-xl border border-[#cfd9d1] space-y-4">
          <h2 className="text-sm font-bold text-[#16261d]">Add New Vehicle</h2>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 text-green-700 text-xs rounded-lg flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#16261d] mb-1">
                Vehicle Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVType('Car')}
                  className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    vType === 'Car' ? 'bg-[#1b5e3b] text-white' : 'neu-btn-secondary'
                  }`}
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>Car</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVType('Motorcycle')}
                  className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    vType === 'Motorcycle' ? 'bg-[#1b5e3b] text-white' : 'neu-btn-secondary'
                  }`}
                >
                  <Bike className="w-3.5 h-3.5" />
                  <span>Motorcycle</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#16261d] mb-1">
                License Plate Number
              </label>
              <input
                type="text"
                placeholder="e.g. CTG-METRO-GA-12-3456"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                className="w-full p-2.5 rounded-lg text-xs neu-input font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#16261d] mb-1">
                Brand / Manufacturer
              </label>
              <input
                type="text"
                placeholder="e.g. Toyota, Honda, Yamaha"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full p-2.5 rounded-lg text-xs neu-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#16261d] mb-1">
                Model Name
              </label>
              <input
                type="text"
                placeholder="e.g. Corolla, Allion, FZ"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full p-2.5 rounded-lg text-xs neu-input"
              />
            </div>

            <button
              type="submit"
              className="w-full neu-btn-primary py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 mt-4"
            >
              <Plus className="w-4 h-4" />
              <span>Register Vehicle</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
