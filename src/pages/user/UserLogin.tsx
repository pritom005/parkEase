import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Phone, User, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';

interface Props {
  onNavigate: (view: string) => void;
}

export const UserLogin: React.FC<Props> = ({ onNavigate }) => {
  const { login, loginAsUser, loginAsAdmin } = useAuth();
  const [identifier, setIdentifier] = useState('tanvir@parkease.ctg');
  const [password, setPassword] = useState('user123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberTerminal, setRememberTerminal] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = login(identifier, password);
    if (res.success) {
      onNavigate('user-dashboard');
    } else {
      setError(res.error || 'Failed to authenticate');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="neu-raised p-8 rounded-xl border border-[#cfd9d1] space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-block px-2.5 py-0.5 bg-[#dcefe3] text-[#1b5e3b] text-[10px] font-mono font-bold rounded">
            CCC CIVIC INFRASTRUCTURE PROTOCOL V4.2
          </div>
          <h1 className="text-2xl font-bold text-[#16261d]">Citizen Portal Login</h1>
          <div className="w-16 h-0.5 border-b-2 border-dashed border-[#e6b422] mx-auto"></div>
          <p className="text-xs text-[#455549]">
            Access your reserved bays, registered vehicles, and municipal parking permits across Chattogram.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#16261d] mb-1">
              Mobile Number or NID / Email
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="+880 1XXX-XXXXXX or citizen@parkease.ctg"
              className="w-full p-2.5 rounded-lg text-xs neu-input"
            />
            <span className="text-[10px] text-[#455549] block mt-1">
              Registered Bangladesh mobile number, email, or National ID.
            </span>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-[#16261d]">Account Password</label>
              <button
                type="button"
                onClick={() => onNavigate('user-forgot-password')}
                className="text-[11px] text-[#1b5e3b] hover:underline font-medium"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full p-2.5 pr-10 rounded-lg text-xs neu-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2.5 text-[#455549] hover:text-[#16261d]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-[#455549]">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberTerminal}
                onChange={(e) => setRememberTerminal(e.target.checked)}
                className="rounded text-[#1b5e3b]"
              />
              <span>Remember this terminal</span>
            </label>
            <span className="text-[10px] text-[#1b5e3b] font-mono flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> 256-bit TLS
            </span>
          </div>

          <button
            type="submit"
            className="w-full neu-btn-primary py-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <span>Log In to Citizen Portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast Login Buttons */}
        <div className="pt-2 border-t border-[#cfd9d1] space-y-2">
          <span className="text-[11px] text-[#455549] block text-center font-medium">
            Demo Viva Quick-Access Credentials:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                loginAsUser();
                onNavigate('user-dashboard');
              }}
              className="neu-btn-secondary p-2 rounded-lg text-xs font-semibold text-[#1b5e3b]"
            >
              Tanvir Ahmed (Citizen)
            </button>
            <button
              onClick={() => {
                loginAsAdmin();
                onNavigate('admin-dashboard');
              }}
              className="neu-btn-secondary p-2 rounded-lg text-xs font-semibold text-[#16261d]"
            >
              Admin Controller
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-[#455549] pt-2">
          Don't have a registered citizen permit?{' '}
          <button
            onClick={() => onNavigate('user-register')}
            className="text-[#1b5e3b] font-bold hover:underline"
          >
            Register New Citizen Account
          </button>
        </div>
      </div>
    </div>
  );
};
