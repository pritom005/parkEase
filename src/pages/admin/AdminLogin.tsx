import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Lock, Mail, ArrowRight } from 'lucide-react';

interface Props {
  onNavigate: (view: string) => void;
}

export const AdminLogin: React.FC<Props> = ({ onNavigate }) => {
  const { login, loginAsAdmin } = useAuth();
  const [email, setEmail] = useState('admin@parkease.ctg');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = login(email, password);
    if (res.success) {
      onNavigate('admin-dashboard');
    } else {
      setError(res.error || 'Invalid admin credentials');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="neu-raised p-8 rounded-xl border border-[#cfd9d1] space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-xl bg-[#1b5e3b] text-white flex items-center justify-center font-bold shadow-xs">
            <Shield className="w-6 h-6 text-[#e6b422]" />
          </div>
          <h1 className="text-2xl font-bold text-[#16261d]">Admin Portal Login</h1>
          <p className="text-xs text-[#455549]">
            Administrative console for ParkEase system managers.
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
              Admin Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@parkease.ctg"
              className="w-full p-2.5 rounded-lg text-xs neu-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#16261d] mb-1">
              Admin Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full p-2.5 rounded-lg text-xs neu-input"
            />
          </div>

          <button
            type="submit"
            className="w-full neu-btn-primary py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 mt-2"
          >
            <span>Login to Admin Console</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                loginAsAdmin();
                onNavigate('admin-dashboard');
              }}
              className="text-xs font-semibold text-[#1b5e3b] hover:underline"
            >
              Quick Login as Admin Demo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
