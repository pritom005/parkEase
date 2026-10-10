import React, { useState } from 'react';
import { Shield, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { mockDb } from '../../db/mockDb';

interface Props {
  onNavigate: (view: string) => void;
}

export const UserForgotPassword: React.FC<Props> = ({ onNavigate }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [identifier, setIdentifier] = useState('+880 1712-349042');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
    setMessage('6-digit verification code dispatched to your registered phone via Teletalk CCC SMS Node.');
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    // Update Tanvir's password in mockDb
    mockDb.changePassword(2, `pbkdf2:sha256:${newPassword}`);
    alert('Security password updated successfully. You can now log in.');
    onNavigate('user-login');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="neu-raised p-8 rounded-xl border border-[#cfd9d1] space-y-6">
        <button
          onClick={() => onNavigate('user-login')}
          className="flex items-center gap-1 text-xs font-semibold text-[#1b5e3b] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Citizen Login</span>
        </button>

        {step === 1 ? (
          <>
            <div className="text-center space-y-2">
              <div className="inline-block px-2.5 py-0.5 bg-[#dcefe3] text-[#1b5e3b] text-[10px] font-mono font-bold rounded">
                CIVIC ID AUTH PROTOCOL
              </div>
              <h1 className="text-2xl font-bold text-[#16261d]">Forgot Citizen Credentials?</h1>
              <div className="w-16 h-0.5 border-b-2 border-dashed border-[#e6b422] mx-auto"></div>
              <p className="text-xs text-[#455549]">
                Enter your registered mobile phone number or Porichoy National ID (NID). We will send a secure 6-digit municipal OTP verification code to reset your password.
              </p>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#16261d] mb-1">
                  Registered Mobile Number or Porichoy NID
                </label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. +880 1712-345678 or 10-digit NID"
                  className="w-full p-2.5 rounded-lg text-xs neu-input"
                />
              </div>

              <div className="p-3 bg-[#eff5f0] rounded-lg border border-[#cfd9d1] text-xs text-[#455549]">
                <strong className="block text-[#1b5e3b] mb-1">Municipal Telemetry Gateway</strong>
                Government SMS Gateway verification will be dispatched via Teletalk / CCC Government SMS Node.
              </div>

              <button
                type="submit"
                className="w-full neu-btn-primary py-3 rounded-lg text-xs font-bold uppercase tracking-wider"
              >
                Send 6-Digit Municipal OTP
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="text-center space-y-2">
              <div className="inline-block px-2.5 py-0.5 bg-[#dcefe3] text-[#1b5e3b] text-[10px] font-mono font-bold rounded">
                SECURITY PROTOCOL // SEC-081
              </div>
              <h1 className="text-2xl font-bold text-[#16261d]">Set New Citizen Password</h1>
              <div className="w-16 h-0.5 border-b-2 border-dashed border-[#e6b422] mx-auto"></div>
              {message && (
                <div className="p-2.5 bg-green-50 text-green-800 text-xs rounded border border-green-200">
                  {message}
                </div>
              )}
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#16261d] mb-1">6-Digit Municipal OTP</label>
                <div className="flex justify-between gap-1">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <input
                      key={i}
                      type="text"
                      maxLength={1}
                      value={otp[i] || ''}
                      onChange={(e) => {
                        const nextOtp = [...otp];
                        nextOtp[i] = e.target.value;
                        setOtp(nextOtp);
                      }}
                      className="w-10 h-10 text-center font-bold text-sm neu-input rounded-lg"
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#16261d] mb-1">New Security Password</label>
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
                  placeholder="Re-enter password"
                  className="w-full p-2.5 rounded-lg text-xs neu-input"
                />
              </div>

              <button
                type="submit"
                className="w-full neu-btn-primary py-3 rounded-lg text-xs font-bold uppercase tracking-wider"
              >
                Update Password & Authenticate
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
