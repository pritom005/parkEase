import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mockDb } from '../../db/mockDb';
import { Car, Bike, ArrowRight, UserPlus, Lock } from 'lucide-react';

interface Props {
  onNavigate: (view: string) => void;
}

export const UserRegister: React.FC<Props> = ({ onNavigate }) => {
  const { login } = useAuth();

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Initial vehicle registration (optional)
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleClass, setVehicleClass] = useState<'Car' | 'Motorcycle'>('Car');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');

  const [agree, setAgree] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!agree) {
      setError('Please agree to the ParkEase terms of service');
      return;
    }

    // 1. Register user
    const userRes = mockDb.registerUser(
      fullName,
      email,
      phone,
      `pbkdf2:sha256:${password}`
    );

    if (!userRes.success || !userRes.user) {
      setError(userRes.error || 'Failed to create user account');
      return;
    }

    // 2. Register initial vehicle if provided
    if (plateNumber.trim()) {
      mockDb.addVehicle(
        userRes.user.user_id,
        plateNumber.trim().toUpperCase(),
        vehicleClass,
        brand.trim() || (vehicleClass === 'Car' ? 'Toyota' : 'Honda'),
        model.trim() || (vehicleClass === 'Car' ? 'Corolla' : '150cc')
      );
    }

    // 3. Log in user
    login(email, password);
    onNavigate('user-dashboard');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="neu-raised p-8 rounded-xl border border-[#cfd9d1] space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#16261d]">
            Create a ParkEase Account
          </h1>
          <p className="text-xs text-[#455549] max-w-md mx-auto">
            Register to search and book parking slots in Chattogram City, Bangladesh.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account Details */}
          <div className="p-4 bg-[#eff5f0] rounded-lg border border-[#cfd9d1] space-y-3">
            <h3 className="text-sm font-bold text-[#16261d]">Account Details</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#16261d] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tanvir Ahmed"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2.5 rounded-lg text-xs neu-input"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#16261d] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. tanvir@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 rounded-lg text-xs neu-input"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#16261d] mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 01712349042"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 rounded-lg text-xs neu-input font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#16261d] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 rounded-lg text-xs neu-input"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#16261d] mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="Re-type your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-2.5 rounded-lg text-xs neu-input"
                  required
                />
              </div>
            </div>
          </div>

          {/* Optional Vehicle Linking */}
          <div className="p-4 bg-[#eff5f0] rounded-lg border border-[#cfd9d1] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#16261d]">
                Add Your Vehicle (Optional)
              </h3>
              <span className="text-[10px] text-[#455549]">Can also be added later</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#16261d] mb-1">
                  Vehicle Type
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setVehicleClass('Car')}
                    className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition ${
                      vehicleClass === 'Car'
                        ? 'bg-[#1b5e3b] text-white'
                        : 'bg-white text-[#455549] border border-[#cfd9d1]'
                    }`}
                  >
                    <Car className="w-3.5 h-3.5" />
                    <span>Car</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVehicleClass('Motorcycle')}
                    className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition ${
                      vehicleClass === 'Motorcycle'
                        ? 'bg-[#1b5e3b] text-white'
                        : 'bg-white text-[#455549] border border-[#cfd9d1]'
                    }`}
                  >
                    <Bike className="w-3.5 h-3.5" />
                    <span>Motorcycle</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#16261d] mb-1">
                  License Plate
                </label>
                <input
                  type="text"
                  placeholder="e.g. DHK-METRO-GA-11-2045"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  className="w-full p-2.5 rounded-lg text-xs neu-input font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#16261d] mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  placeholder="e.g. Toyota, Honda"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full p-2.5 rounded-lg text-xs neu-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#16261d] mb-1">
                  Model
                </label>
                <input
                  type="text"
                  placeholder="e.g. Corolla, Civic"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full p-2.5 rounded-lg text-xs neu-input"
                />
              </div>
            </div>
          </div>

          {/* Terms checkbox */}
          <div className="flex items-center gap-2 text-xs text-[#455549]">
            <input
              type="checkbox"
              id="agreeTerms"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="rounded text-[#1b5e3b] focus:ring-[#1b5e3b]"
            />
            <label htmlFor="agreeTerms">
              I agree to the ParkEase terms of service and booking policies.
            </label>
          </div>

          <button
            type="submit"
            className="w-full neu-btn-primary py-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Complete Registration</span>
          </button>

          <p className="text-center text-xs text-[#455549]">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => onNavigate('user-login')}
              className="text-[#1b5e3b] font-bold hover:underline"
            >
              Login here
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};
