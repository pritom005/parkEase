import React, { useState, useEffect } from 'react';
import { useParkEase } from '../context/ParkEaseContext';
import { X, Lock, Mail, AlertCircle, CheckCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'register';
  onClose: () => void;
  onGoToRegister: () => void;
  onSuccess: (role: 'user' | 'admin') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onGoToRegister,
  onSuccess
}) => {
  const { login, completeDemoSession, loginWithGoogle } = useParkEase();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRole, setLoginRole] = useState<'user' | 'admin'>('user');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [demoEnabled, setDemoEnabled] = useState(false);
  const [demoLoading, setDemoLoading] = useState<'user' | 'admin' | null>(null);

  // Check whether presentation demo accounts are enabled on the server
  useEffect(() => {
    let isMounted = true;

    fetch('/api/demo-status', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { demo: false }))
      .then((data) => {
        if (isMounted) {
          setDemoEnabled(Boolean(data && data.demo === true));
        }
      })
      .catch(() => {
        if (isMounted) {
          setDemoEnabled(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Submit standard email/password login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const res = login(loginEmail, loginRole);
    if (res.success) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
        onSuccess(loginRole);
      }, 400);
    } else {
      setErrorMsg(res.message);
    }
  };

  // Start Google sign-in flow
  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    const res = await loginWithGoogle();
    if (res.success) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
        onSuccess(res.role || 'user');
      }, 400);
    } else {
      setErrorMsg(res.message);
    }
  };

  // Sign in using preset presentation account without touching any password in code
  const handleDemoLogin = async (which: 'user' | 'admin') => {
    if (demoLoading !== null) return;
    const targetRole: 'user' | 'admin' = which === 'admin' ? 'admin' : 'user';
    setLoginRole(targetRole);
    setLoginPassword('');
    setErrorMsg('');
    setSuccessMsg('');
    setDemoLoading(which);

    try {
      const res = await fetch('/api/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ which })
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        setErrorMsg(
          data.message || 'Demo account not found. Ask the project owner to run the demo data script.'
        );
        setDemoLoading(null);
        return;
      }

      const account = which === 'admin' ? data.admin : data.user;
      if (!account || !account.email) {
        setErrorMsg('Demo account not found. Ask the project owner to run the demo data script.');
        setDemoLoading(null);
        return;
      }

      setLoginEmail(String(account.email));
      completeDemoSession({
        user_id: Number(account.user_id),
        full_name: String(account.full_name || ''),
        email: String(account.email),
        role: targetRole
      });

      setSuccessMsg(data.message || `Welcome back, ${account.full_name}!`);
      setDemoLoading(null);
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
        onSuccess(targetRole);
      }, 400);
    } catch {
      setErrorMsg('Unable to reach server for demo login. Please try again.');
      setDemoLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 flex items-center justify-center p-4">
      <div
        className="bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-[12px] shadow-[8px_8px_20px_var(--shadow-dark),-8px_-8px_20px_var(--shadow-light)] max-w-md w-full p-6 text-[var(--text-ink)] relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-ink)] p-1 rounded-[6px] hover:bg-[var(--bg-tint)] transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="pb-3 mb-4 border-b-2 border-dashed border-[#E6B422]">
          <h2 id="auth-modal-title" className="text-lg font-bold text-[var(--text-heading)]">
            Sign In to ParkEase
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Access your driver reservations or admin portal.
          </p>
        </div>

        {errorMsg && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-4 p-3 bg-[var(--status-occupied-bg)] border border-[var(--status-occupied-border)] rounded-[8px] text-xs text-[var(--status-occupied)] flex items-start space-x-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div
            role="status"
            aria-live="polite"
            className="mb-4 p-3 bg-[var(--status-available-bg)] border border-[var(--status-available-border)] rounded-[8px] text-xs text-[var(--status-available)] flex items-start space-x-2"
          >
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Google Sign-In Button */}
        <div className="mb-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="btn-secondary w-full py-2 px-3 text-xs font-bold"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center my-3 text-[11px] text-[var(--text-muted)]">
            <div className="flex-1 border-t border-[var(--border-subtle)]" />
            <span className="px-2 font-medium">or sign in with email</span>
            <div className="flex-1 border-t border-[var(--border-subtle)]" />
          </div>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
          <div>
            <span className="form-label block mb-1.5">Portal Type</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLoginRole('user')}
                className={`py-2 px-3 rounded-[8px] font-semibold text-center transition-all ${
                  loginRole === 'user'
                    ? 'bg-[var(--primary-forest)] text-white shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)]'
                    : 'btn-secondary py-2 px-3'
                }`}
              >
                Driver / User
              </button>
              <button
                type="button"
                onClick={() => setLoginRole('admin')}
                className={`py-2 px-3 rounded-[8px] font-semibold text-center transition-all ${
                  loginRole === 'admin'
                    ? 'bg-[var(--primary-forest)] text-white shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)]'
                    : 'btn-secondary py-2 px-3'
                }`}
              >
                Admin Staff
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="auth-email" className="form-label block mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5 pointer-events-none" aria-hidden="true" />
              <input
                id="auth-email"
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder={loginRole === 'admin' ? 'admin@parkease.com' : 'user@parkease.com'}
                className="form-input pl-9 text-xs"
              />
            </div>
          </div>

          <div>
            <label htmlFor="auth-password" className="form-label block mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5 pointer-events-none" aria-hidden="true" />
              <input
                id="auth-password"
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="form-input pl-9 text-xs"
              />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full py-2.5 text-xs">
            Sign In to ParkEase
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-[var(--text-muted)]">
          New here?{' '}
          <button
            type="button"
            onClick={() => {
              onClose();
              onGoToRegister();
            }}
            className="font-bold text-[var(--primary-forest)] hover:underline"
          >
            Create an account
          </button>
        </p>

        {demoEnabled && (
          <div className="mt-4 pt-3 border-t-2 border-dashed border-[#E6B422]">
            <p className="text-[11px] font-medium text-[var(--text-muted)] mb-2">
              Preset Accounts:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={demoLoading !== null}
                onClick={() => handleDemoLogin('user')}
                aria-label="Sign in with Preset Driver Account"
                className="btn-secondary py-2 px-3 rounded-[8px] text-xs font-semibold text-center text-[var(--text-ink)] disabled:opacity-55 disabled:cursor-not-allowed"
              >
                {demoLoading === 'user' ? 'Signing in...' : 'Driver Account'}
              </button>
              <button
                type="button"
                disabled={demoLoading !== null}
                onClick={() => handleDemoLogin('admin')}
                aria-label="Sign in with Preset Admin Account"
                className="btn-secondary py-2 px-3 rounded-[8px] text-xs font-semibold text-center text-[var(--text-ink)] disabled:opacity-55 disabled:cursor-not-allowed"
              >
                {demoLoading === 'admin' ? 'Signing in...' : 'Admin Account'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
