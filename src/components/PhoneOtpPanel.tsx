import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParkEase } from '../context/ParkEaseContext';
import { ShieldCheck, Smartphone, AlertCircle, CheckCircle, RotateCw, Edit2 } from 'lucide-react';

interface PhoneOtpPanelProps {
  phone: string;
  onVerified: () => void;
  onCancel?: () => void;
  cancelLabel?: string;
  autoSend?: boolean;
  allowPhoneEdit?: boolean;
  compact?: boolean;
}

export const PhoneOtpPanel: React.FC<PhoneOtpPanelProps> = ({
  phone,
  onVerified,
  onCancel,
  cancelLabel = 'Confirm Later',
  autoSend = true,
  allowPhoneEdit = true,
  compact = false
}) => {
  const { currentUser, sendPhoneOtp, verifyPhoneOtp, updateProfile } = useParkEase();

  const [activePhone, setActivePhone] = useState(phone);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState(phone);

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [maskedPhone, setMaskedPhone] = useState('');
  const [sandboxOtp, setSandboxOtp] = useState<string | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<'sms' | 'sandbox' | null>(null);

  const [expirySeconds, setExpirySeconds] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  const initialSendDone = useRef(false);

  useEffect(() => {
    setActivePhone(phone);
    setPhoneDraft(phone);
  }, [phone]);

  // Countdown timers for OTP expiry and resend cooldown
  useEffect(() => {
    if (expirySeconds <= 0 && cooldownSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setExpirySeconds(prev => (prev > 0 ? prev - 1 : 0));
      setCooldownSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [expirySeconds, cooldownSeconds]);

  const requestOtp = useCallback(
    async (targetPhone: string) => {
      setErrorMsg('');
      setInfoMsg('');
      setIsSending(true);
      const res = await sendPhoneOtp(targetPhone);
      setIsSending(false);

      if (!res.success) {
        setErrorMsg(res.message);
        if (res.retryAfterSeconds) {
          setCooldownSeconds(res.retryAfterSeconds);
        }
        return;
      }

      setMaskedPhone(res.maskedPhone || targetPhone);
      setDeliveryMode(res.deliveryMode || null);
      setSandboxOtp(res.sandboxOtp || null);
      setExpirySeconds(res.expiresInSeconds || 300);
      setCooldownSeconds(res.resendCooldownSeconds || 45);
      setInfoMsg(res.message);
      setDigits(['', '', '', '', '', '']);
      window.setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 60);
    },
    [sendPhoneOtp]
  );

  useEffect(() => {
    if (autoSend && activePhone && !initialSendDone.current) {
      initialSendDone.current = true;
      requestOtp(activePhone);
    }
  }, [autoSend, activePhone, requestOtp]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleDigitChange = (index: number, rawValue: string) => {
    setErrorMsg('');
    const numericOnly = rawValue.replace(/\D/g, '');
    if (!numericOnly) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }

    // Handle multi-digit input (e.g. SMS autofill or paste into single box)
    if (numericOnly.length > 1) {
      const next = [...digits];
      const chars = numericOnly.slice(0, 6).split('');
      for (let i = 0; i < chars.length && index + i < 6; i++) {
        next[index + i] = chars[i];
      }
      setDigits(next);
      const focusIdx = Math.min(index + chars.length, 5);
      inputRefs.current[focusIdx]?.focus();
      return;
    }

    const next = [...digits];
    next[index] = numericOnly;
    setDigits(next);
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const next = [...digits];
        next[index - 1] = '';
        setDigits(next);
        inputRefs.current[index - 1]?.focus();
      } else {
        const next = [...digits];
        next[index] = '';
        setDigits(next);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setDigits(next);
    const targetIdx = Math.min(pasted.length, 5);
    inputRefs.current[targetIdx]?.focus();
  };

  const handleFillSandboxOtp = () => {
    if (!sandboxOtp) return;
    const next = sandboxOtp.slice(0, 6).split('');
    while (next.length < 6) next.push('');
    setDigits(next);
    setErrorMsg('');
    inputRefs.current[5]?.focus();
  };

  const handleSavePhoneChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!currentUser) return;
    const updateRes = updateProfile(currentUser.full_name, phoneDraft);
    if (!updateRes.success) {
      setErrorMsg(updateRes.message);
      return;
    }
    const cleanPhone = phoneDraft.replace(/[\s()-]/g, '').trim();
    setActivePhone(cleanPhone);
    setEditingPhone(false);
    await requestOtp(cleanPhone);
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const code = digits.join('');

    if (code.length !== 6) {
      setErrorMsg('Enter all 6 digits of your SMS confirmation code.');
      return;
    }

    setIsVerifying(true);
    const res = await verifyPhoneOtp(activePhone, code);
    setIsVerifying(false);

    if (!res.success) {
      setErrorMsg(res.message);
      return;
    }

    setVerifiedSuccess(true);
    setInfoMsg(res.message);
    window.setTimeout(() => {
      onVerified();
    }, 650);
  };

  const combinedCode = digits.join('');

  return (
    <div className={compact ? 'space-y-3 text-xs' : 'space-y-4 text-xs'}>
      {/* Step Header */}
      <div className="flex items-start gap-3 pb-3 border-b-2 border-dashed border-[var(--accent-gold)]">
        <div className="w-9 h-9 rounded-[8px] bg-[var(--bg-tint)] border border-[var(--status-available-border)] flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5 text-[var(--primary-forest)]" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-bold text-[var(--text-heading)]">
            Mobile Phone Confirmation
          </h3>
          <p className="text-[11px] sm:text-xs text-[var(--text-muted)] mt-0.5">
            Confirm your phone via SMS OTP to activate slot reservations.
          </p>
        </div>
      </div>

      {/* Feedback Alerts */}
      {errorMsg && (
        <div
          role="alert"
          aria-live="polite"
          className="p-3 bg-[var(--status-occupied-bg)] border border-[var(--status-occupied-border)] rounded-[8px] text-xs text-[var(--status-occupied)] flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      {verifiedSuccess ? (
        <div
          role="status"
          aria-live="polite"
          className="p-4 bg-[var(--status-available-bg)] border border-[var(--status-available-border)] rounded-[8px] text-xs text-[var(--status-available)] flex items-center gap-2.5 font-semibold"
        >
          <CheckCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>{infoMsg || 'Mobile number confirmed successfully.'}</span>
        </div>
      ) : (
        <>
          {/* Target Phone Strip */}
          {!editingPhone ? (
            <div className="soft-inset p-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Smartphone className="w-4 h-4 text-[var(--primary-forest)] shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <span className="text-[11px] text-[var(--text-muted)] block">
                    Confirmation code sent to
                  </span>
                  <span className="font-bold text-[var(--text-heading)] tabular-nums">
                    {maskedPhone || activePhone}
                  </span>
                </div>
              </div>
              {allowPhoneEdit && (
                <button
                  type="button"
                  onClick={() => {
                    setPhoneDraft(activePhone);
                    setEditingPhone(true);
                    setErrorMsg('');
                  }}
                  className="btn-secondary px-2.5 py-1 text-[11px] shrink-0"
                >
                  <Edit2 className="w-3 h-3" aria-hidden="true" />
                  <span>Change</span>
                </button>
              )}
            </div>
          ) : (
            <form
              onSubmit={handleSavePhoneChange}
              className="flat-subcard p-3 space-y-2"
            >
              <label htmlFor="otp-edit-phone" className="form-label block text-[11px]">
                Update Mobile Number
              </label>
              <div className="flex gap-2">
                <input
                  id="otp-edit-phone"
                  type="tel"
                  required
                  value={phoneDraft}
                  onChange={(e) => setPhoneDraft(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="form-input flex-1 py-1.5 text-xs"
                />
                <button
                  type="submit"
                  disabled={isSending}
                  className="btn-primary px-3 py-1.5 text-[11px] shrink-0"
                >
                  Send OTP
                </button>
                <button
                  type="button"
                  onClick={() => setEditingPhone(false)}
                  className="btn-secondary px-2.5 py-1.5 text-[11px] shrink-0"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Sandbox Preview Notice when no external carrier webhook is connected */}
          {deliveryMode === 'sandbox' && sandboxOtp && (
            <div className="p-3 bg-[var(--status-booked-bg)] border border-[var(--status-booked-border)] rounded-[8px] text-[11px] text-[var(--status-booked)] flex items-center justify-between gap-2">
              <div>
                <span className="font-bold block">SMS Sandbox Preview</span>
                <span>
                  Use confirmation code{' '}
                  <strong className="font-mono text-xs text-[var(--text-heading)] tabular-nums">
                    {sandboxOtp}
                  </strong>
                </span>
              </div>
              <button
                type="button"
                onClick={handleFillSandboxOtp}
                className="btn-secondary px-2.5 py-1 text-[11px] shrink-0"
              >
                Auto-fill
              </button>
            </div>
          )}

          {/* 6-Digit OTP Input Form */}
          <form onSubmit={handleVerifySubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="form-label">Enter 6-Digit SMS Code</label>
                {expirySeconds > 0 && (
                  <span className="text-[11px] font-semibold text-[var(--text-muted)] tabular-nums">
                    Expires in {formatTimer(expirySeconds)}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-6 gap-2" role="group" aria-label="6-digit OTP code">
                {digits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                    maxLength={6}
                    value={digit}
                    aria-label={`Digit ${idx + 1}`}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                    onPaste={handlePaste}
                    className="form-input h-11 text-center text-base font-bold font-mono tabular-nums px-1"
                  />
                ))}
              </div>
            </div>

            {/* Resend Row */}
            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span>Did not receive the SMS code?</span>
              <button
                type="button"
                disabled={isSending || cooldownSeconds > 0}
                onClick={() => requestOtp(activePhone)}
                className="font-semibold text-[var(--primary-forest)] disabled:text-[var(--text-muted)] inline-flex items-center gap-1 hover:underline disabled:no-underline tabular-nums"
              >
                <RotateCw className={`w-3 h-3 ${isSending ? 'animate-spin' : ''}`} aria-hidden="true" />
                <span>
                  {cooldownSeconds > 0
                    ? `Resend in ${cooldownSeconds}s`
                    : isSending
                    ? 'Sending...'
                    : 'Resend Code'}
                </span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="submit"
                disabled={isVerifying || combinedCode.length !== 6}
                className="btn-primary flex-1 py-2.5 px-4 text-xs"
              >
                <span>{isVerifying ? 'Confirming...' : 'Confirm Mobile Number'}</span>
              </button>

              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="btn-secondary py-2.5 px-4 text-xs"
                >
                  {cancelLabel}
                </button>
              )}
            </div>
          </form>
        </>
      )}
    </div>
  );
};
