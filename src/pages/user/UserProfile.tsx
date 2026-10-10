import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mockDb } from '../../db/mockDb';
import { User, Phone, Mail, ShieldCheck, KeyRound, CheckCircle2 } from 'lucide-react';

export const UserProfile: React.FC = () => {
  const { currentUser, refreshUser } = useAuth();
  const userId = currentUser?.user_id || 2;

  const [fullName, setFullName] = useState(currentUser?.full_name || 'Tanvir Ahmed');
  const [phone, setPhone] = useState(currentUser?.phone || '+880 1712-349042');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.full_name || '');
      setPhone(currentUser.phone || '');
    }
  }, [currentUser]);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    mockDb.updateProfile(userId, fullName, phone);
    refreshUser();
    setSuccess('Citizen profile contact details updated successfully.');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    mockDb.changePassword(userId, `pbkdf2:sha256:${newPassword}`);
    setNewPassword('');
    setConfirmPassword('');
    setSuccess('Security password updated successfully.');
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-[#455549] mb-1">
          <span>PARKEASE PORTAL</span>
          <span>&gt;</span>
          <span className="text-[#1b5e3b] font-bold">CITIZEN PROFILE</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#16261d] tracking-tight">
          Citizen Profile & Credentials
        </h1>
        <p className="text-xs text-[#455549] mt-1">
          Manage your registered municipal contact credentials, Porichoy identity linkage, and authentication password.
        </p>
      </div>

      {success && (
        <div className="p-3 bg-green-50 text-green-800 text-xs rounded-xl border border-green-200">
          {success}
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {/* Citizen Identity Verification Card */}
      <div className="neu-raised p-6 rounded-xl border border-[#cfd9d1] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#cfd9d1] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#1b5e3b] text-white flex items-center justify-center font-bold text-lg">
              TA
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#16261d]">{currentUser?.full_name}</h2>
              <span className="text-xs font-mono text-[#455549]">
                Citizen Permit ID: #{currentUser?.user_id}042 • Resident Tier 1 (Nasirabad Ward 08)
              </span>
            </div>
          </div>

          <span className="text-xs font-bold text-[#1b5e3b] bg-[#dcefe3] px-3 py-1 rounded border border-[#1b5e3b] self-start sm:self-auto flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Porichoy e-KYC: 99.8% Match</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-white rounded-lg border border-[#cfd9d1]">
            <span className="text-[10px] text-[#455549] uppercase font-semibold block">National ID (NID)</span>
            <strong className="text-xs font-mono font-bold text-[#16261d] block mt-0.5">
              {currentUser?.nid || '1984-1592-384910'}
            </strong>
          </div>

          <div className="p-3 bg-white rounded-lg border border-[#cfd9d1]">
            <span className="text-[10px] text-[#455549] uppercase font-semibold block">Pre-Funded Civic Wallet</span>
            <strong className="text-xs font-mono font-bold text-[#1b5e3b] block mt-0.5">
              {currentUser?.wallet_balance || 2450} BDT
            </strong>
          </div>

          <div className="p-3 bg-white rounded-lg border border-[#cfd9d1]">
            <span className="text-[10px] text-[#455549] uppercase font-semibold block">Account Role & Status</span>
            <strong className="text-xs font-bold text-[#16261d] block mt-0.5">
              Citizen (Active)
            </strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Update Contact Details */}
        <div className="neu-raised p-6 rounded-xl border border-[#cfd9d1] space-y-4">
          <h3 className="text-base font-bold text-[#16261d] bay-accent-line">
            Contact Information
          </h3>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#16261d] mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2.5 rounded-lg text-xs neu-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#16261d] mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={currentUser?.email ?? ''}
                className="w-full p-2.5 rounded-lg text-xs neu-input bg-gray-100 opacity-75 cursor-not-allowed"
              />
              <span className="text-[10px] text-[#455549] block mt-1">
                Email is locked to primary civic identity.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#16261d] mb-1">Phone Number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 rounded-lg text-xs neu-input"
              />
            </div>

            <button
              type="submit"
              className="neu-btn-primary px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider"
            >
              Save Profile Changes
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="neu-raised p-6 rounded-xl border border-[#cfd9d1] space-y-4">
          <h3 className="text-base font-bold text-[#16261d] bay-accent-line">
            Change Security Password
          </h3>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#16261d] mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full p-2.5 rounded-lg text-xs neu-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#16261d] mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full p-2.5 rounded-lg text-xs neu-input"
              />
            </div>

            <div className="p-3 bg-[#eff5f0] rounded-lg border border-[#cfd9d1] text-[11px] text-[#455549]">
              Passwords are automatically hashed using PBKDF2/Werkzeug standard before database storage.
            </div>

            <button
              type="submit"
              className="neu-btn-secondary px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider"
            >
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
