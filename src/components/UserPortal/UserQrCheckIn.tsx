import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import jsQR from 'jsqr';
import QRCode from 'qrcode';
import { useParkEase } from '../../context/ParkEaseContext';
import {
  QrCode,
  Camera,
  Upload,
  Keyboard,
  CheckCircle,
  AlertTriangle,
  Download,
  ScanLine,
  StopCircle,
  ArrowRight,
  MapPin,
  Clock
} from 'lucide-react';

interface UserQrCheckInProps {
  preselectedBookingId?: number | null;
  onNavigateToTab: (tab: string) => void;
  onOpenPayment: (bookingId: number) => void;
}

type ScannerMode = 'camera' | 'upload' | 'manual';

interface CheckInFeedback {
  type: 'success' | 'error';
  text: string;
  slotNumber?: string;
  areaName?: string;
  bookingId?: number;
  checkedInAt?: string;
}

export const UserQrCheckIn: React.FC<UserQrCheckInProps> = ({
  preselectedBookingId,
  onNavigateToTab,
  onOpenPayment
}) => {
  const { currentUser, bookings, slots, areas, vehicles, checkInWithQr } = useParkEase();

  const activeAreas = useMemo(
    () => areas.filter((a) => a.status === 'Active'),
    [areas]
  );

  const userConfirmedBookings = useMemo(
    () =>
      bookings
        .filter(
          (b) => b.user_id === currentUser?.user_id && b.booking_status === 'Confirmed'
        )
        .sort((a, b) => b.booking_id - a.booking_id),
    [bookings, currentUser]
  );

  const [selectedBookingId, setSelectedBookingId] = useState<number>(
    preselectedBookingId || userConfirmedBookings[0]?.booking_id || 0
  );

  useEffect(() => {
    if (
      preselectedBookingId &&
      userConfirmedBookings.some((b) => b.booking_id === preselectedBookingId)
    ) {
      setSelectedBookingId(preselectedBookingId);
    } else if (
      userConfirmedBookings.length > 0 &&
      !userConfirmedBookings.some((b) => b.booking_id === selectedBookingId)
    ) {
      setSelectedBookingId(userConfirmedBookings[0].booking_id);
    }
  }, [preselectedBookingId, userConfirmedBookings, selectedBookingId]);

  const activeBooking = useMemo(
    () =>
      userConfirmedBookings.find((b) => b.booking_id === selectedBookingId) ||
      userConfirmedBookings[0] ||
      null,
    [userConfirmedBookings, selectedBookingId]
  );

  const activeSlot = useMemo(
    () => (activeBooking ? slots.find((s) => s.slot_id === activeBooking.slot_id) || null : null),
    [activeBooking, slots]
  );

  const activeArea = useMemo(
    () => (activeSlot ? areas.find((a) => a.area_id === activeSlot.area_id) || null : null),
    [activeSlot, areas]
  );

  const activeVehicle = useMemo(
    () =>
      activeBooking
        ? vehicles.find((v) => v.vehicle_id === activeBooking.vehicle_id) || null
        : null,
    [activeBooking, vehicles]
  );

  // Scanner UI State
  const [scannerMode, setScannerMode] = useState<ScannerMode>('camera');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastScannedPayload, setLastScannedPayload] = useState('');
  const [feedback, setFeedback] = useState<CheckInFeedback | null>(null);

  // Parking Area Gate QR Pass preview state
  const [qrPassAreaId, setQrPassAreaId] = useState<number>(
    activeArea?.area_id || activeAreas[0]?.area_id || 1
  );
  const [qrPassDataUrl, setQrPassDataUrl] = useState<string>('');

  useEffect(() => {
    if (activeArea?.area_id) {
      setQrPassAreaId(activeArea.area_id);
    }
  }, [activeArea?.area_id]);

  const qrPassArea = useMemo(
    () => activeAreas.find((a) => a.area_id === Number(qrPassAreaId)) || activeAreas[0] || null,
    [activeAreas, qrPassAreaId]
  );

  const qrPassPayload = useMemo(() => {
    if (!qrPassArea) return '';
    // Include slot details if the user's selected confirmed booking belongs to this area
    if (activeArea && activeArea.area_id === qrPassArea.area_id && activeSlot) {
      return JSON.stringify({
        system: 'ParkEase',
        type: 'checkin',
        area_id: qrPassArea.area_id,
        area_name: qrPassArea.area_name,
        slot_id: activeSlot.slot_id,
        slot_number: activeSlot.slot_number
      });
    }
    return JSON.stringify({
      system: 'ParkEase',
      type: 'area_checkin',
      area_id: qrPassArea.area_id,
      area_name: qrPassArea.area_name
    });
  }, [qrPassArea, activeArea, activeSlot]);

  useEffect(() => {
    if (!qrPassPayload) {
      setQrPassDataUrl('');
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(qrPassPayload, {
      width: 240,
      margin: 2,
      color: {
        dark: '#143426',
        light: '#FFFFFF'
      }
    })
      .then((url) => {
        if (!cancelled) setQrPassDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrPassDataUrl('');
      });

    return () => {
      cancelled = true;
    };
  }, [qrPassPayload]);

  // Camera refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const scanLockRef = useRef<boolean>(false);

  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    scanLockRef.current = false;
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleDecodedPayload = useCallback(
    async (payload: string) => {
      const clean = payload.trim();
      if (!clean || scanLockRef.current) return;

      scanLockRef.current = true;
      setIsProcessing(true);
      setLastScannedPayload(clean);
      stopCamera();

      try {
        const result = await checkInWithQr(clean, activeBooking?.booking_id);
        if (result.success) {
          setFeedback({
            type: 'success',
            text: result.message,
            slotNumber: result.slot?.slot_number,
            areaName: result.area?.area_name,
            bookingId: result.booking?.booking_id,
            checkedInAt: result.booking?.checked_in_at
          });
        } else {
          setFeedback({
            type: 'error',
            text: result.message
          });
        }
      } finally {
        setIsProcessing(false);
        scanLockRef.current = false;
      }
    },
    [activeBooking?.booking_id, checkInWithQr, stopCamera]
  );

  const startCamera = async () => {
    setCameraError('');
    setFeedback(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        'Camera access is unavailable in this browser context. Use Upload QR Image or Gate Code Entry instead.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });
      streamRef.current = stream;
      setCameraActive(true);

      window.setTimeout(() => {
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        video.play().catch(() => {});

        const scanFrame = () => {
          if (!streamRef.current || !videoRef.current || !canvasRef.current) return;
          const v = videoRef.current;
          const canvas = canvasRef.current;
          if (v.readyState === v.HAVE_ENOUGH_DATA && v.videoWidth > 0 && v.videoHeight > 0) {
            canvas.width = v.videoWidth;
            canvas.height = v.videoHeight;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (ctx) {
              ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const decoded = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert'
              });
              if (decoded && decoded.data) {
                void handleDecodedPayload(decoded.data);
                return;
              }
            }
          }
          rafRef.current = window.requestAnimationFrame(scanFrame);
        };

        rafRef.current = window.requestAnimationFrame(scanFrame);
      }, 60);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to open camera.';
      setCameraError(
        `Camera access was denied or no camera device was found (${msg}). Use Upload QR Image or Gate Code Entry.`
      );
      stopCamera();
    }
  };

  const decodeQrFromImageUrl = async (imageUrl: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 300;
        canvas.height = img.height || 300;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth'
        });
        resolve(code?.data || null);
      };
      img.onerror = () => resolve(null);
      img.src = imageUrl;
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setFeedback(null);
    setIsProcessing(true);
    const objectUrl = URL.createObjectURL(file);

    try {
      const decoded = await decodeQrFromImageUrl(objectUrl);
      if (!decoded) {
        setFeedback({
          type: 'error',
          text: 'No valid QR code could be detected inside the uploaded image. Try a clearer crop of the gate QR.'
        });
        setIsProcessing(false);
        return;
      }
      await handleDecodedPayload(decoded);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };

  const handleScanGeneratedGateQr = async () => {
    if (!qrPassDataUrl) return;
    setFeedback(null);
    const decoded = await decodeQrFromImageUrl(qrPassDataUrl);
    if (!decoded) {
      setFeedback({
        type: 'error',
        text: 'Could not decode the generated Gate QR image.'
      });
      return;
    }
    await handleDecodedPayload(decoded);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!manualCode.trim()) {
      setFeedback({
        type: 'error',
        text: 'Enter a ParkEase gate QR payload (e.g. PARKEASE|AREA:1|SLOT:C-01).'
      });
      return;
    }
    await handleDecodedPayload(manualCode);
  };

  const switchScannerMode = (mode: ScannerMode) => {
    if (mode !== 'camera') {
      stopCamera();
    }
    setCameraError('');
    setScannerMode(mode);
  };

  return (
    <div className="user-portal-container space-y-5">
      {/* Page Header */}
      <div className="user-page-header m-0">
        <div>
          <div className="user-page-kicker">ParkEase Portal &gt; Bay Arrival</div>
          <h1 className="user-page-title">Parking Area Arrival Scan</h1>
          <p className="user-page-subtitle">
            Scan the parking area gate or bay QR code upon arrival. Your assigned slot status updates to Occupied in real time across the system.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigateToTab('search')}
          className="btn-secondary text-xs px-4 py-2.5 shrink-0"
        >
          <span>View Live Slot Board</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`p-4 rounded-[12px] border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-[var(--status-available-bg)] border-[var(--status-available-border)] text-[var(--status-available)]'
              : 'bg-[var(--status-occupied-bg)] border-[var(--status-occupied-border)] text-[var(--status-occupied)]'
          }`}
        >
          <div className="flex items-start gap-2.5 text-xs">
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <div>
              <div className="font-bold text-sm">{feedback.text}</div>
              {feedback.type === 'success' && feedback.checkedInAt && (
                <div className="text-[11px] opacity-90 mt-0.5 tabular-nums">
                  Booking #{feedback.bookingId} | Arrival at {feedback.checkedInAt} | Live Status: Occupied
                </div>
              )}
            </div>
          </div>

          {feedback.type === 'success' && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onNavigateToTab('search')}
                className="btn-primary text-xs px-3.5 py-2"
              >
                View Live Slot Status
              </button>
              <button
                type="button"
                onClick={() => onNavigateToTab('user-history')}
                className="btn-secondary text-xs px-3.5 py-2"
              >
                Booking History
              </button>
            </div>
          )}
        </div>
      )}

      {/* Active Confirmed Reservation Card */}
      <div className="soft-raised-static p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[var(--border-subtle)]">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--primary-forest)]">
              Reservation Selected for Gate Arrival
            </div>
            <h2 className="text-base font-bold text-[var(--text-heading)] m-0">
              {activeBooking && activeArea
                ? `Booking #${activeBooking.booking_id} - ${activeArea.area_name}`
                : 'No Active Confirmed Reservation'}
            </h2>
          </div>

          {userConfirmedBookings.length > 1 && (
            <div className="flex items-center gap-2">
              <label htmlFor="checkin-booking-select" className="text-xs font-bold text-[var(--text-muted)]">
                Switch Booking:
              </label>
              <select
                id="checkin-booking-select"
                value={activeBooking?.booking_id || 0}
                onChange={(e) => {
                  setSelectedBookingId(Number(e.target.value));
                  setFeedback(null);
                }}
                className="form-select py-1.5 text-xs font-semibold w-auto"
              >
                {userConfirmedBookings.map((b) => {
                  const s = slots.find((item) => item.slot_id === b.slot_id);
                  const a = s ? areas.find((areaItem) => areaItem.area_id === s.area_id) : null;
                  return (
                    <option key={b.booking_id} value={b.booking_id}>
                      #{b.booking_id} - {a?.area_name} (Slot {s?.slot_number})
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

        {activeBooking && activeSlot && activeArea ? (
          <div className="space-y-3">
            <div className="ticket-sub-grid">
              <div className="ticket-sub-tile">
                <div className="ticket-data-label">Assigned Bay &amp; Live Status</div>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="ticket-data-val tabular-nums">Slot {activeSlot.slot_number}</span>
                  <span
                    className={`badge-status uppercase text-[10px] ${
                      activeSlot.status === 'Available'
                        ? 'badge-available'
                        : activeSlot.status === 'Booked'
                        ? 'badge-booked'
                        : 'badge-occupied'
                    }`}
                  >
                    {activeSlot.status}
                  </span>
                </div>
                <div className="text-xs text-[var(--text-muted)] mt-1">
                  {activeSlot.vehicle_type} Bay | {activeArea.area_name}
                </div>
              </div>

              <div className="ticket-sub-tile">
                <div className="ticket-data-label">Arrival Window</div>
                <div className="ticket-data-val tabular-nums">{activeBooking.booking_date}</div>
                <div className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1 tabular-nums">
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>
                    Entry {activeBooking.booking_time} (
                    {activeBooking.duration_hours === 24
                      ? '24h Full Day'
                      : `${activeBooking.duration_hours}h`}
                    )
                  </span>
                </div>
              </div>

              <div className="ticket-sub-tile">
                <div className="ticket-data-label">Vehicle &amp; Arrival State</div>
                <div className="ticket-data-val font-mono">
                  {activeVehicle?.vehicle_number || 'Registered Vehicle'}
                </div>
                <div className="text-xs mt-1 tabular-nums">
                  {activeBooking.checked_in_at ? (
                    <span className="font-bold text-[var(--status-occupied)]">
                      Arrived at {activeBooking.checked_in_at}
                    </span>
                  ) : (
                    <span className="text-[var(--text-muted)]">
                      Awaiting gate QR scan
                    </span>
                  )}
                </div>
              </div>
            </div>

            {activeBooking.payment_status === 'Pending' && (
              <div className="flat-subcard p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-[var(--text-ink)]">
                  Payment is currently <strong className="text-[var(--status-booked)]">Pending</strong> ({activeBooking.price_total} BDT). You can scan on arrival or pay now.
                </span>
                <button
                  type="button"
                  onClick={() => onOpenPayment(activeBooking.booking_id)}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  Complete Payment
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="user-empty-state p-6">
            <QrCode className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" aria-hidden="true" />
            <div className="user-empty-title">No Confirmed Reservation for Arrival</div>
            <p className="user-empty-desc">
              Reserve an available parking slot in Chattogram first, then scan the gate QR code upon arrival to occupy your bay.
            </p>
            <button
              type="button"
              onClick={() => onNavigateToTab('search')}
              className="btn-primary text-xs px-4 py-2"
            >
              Find &amp; Book Parking
            </button>
          </div>
        )}
      </div>

      {/* Main Two-Column Scanner + Gate QR Pass Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: QR Scanner Panel */}
        <div className="lg:col-span-7 soft-raised-static p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[var(--text-heading)] m-0">
                Scan Parking Area QR Code
              </h2>
              <p className="text-xs text-[var(--text-muted)] m-0 mt-0.5">
                Use your device camera, upload a QR snapshot, or enter the gate kiosk code.
              </p>
            </div>

            <div className="filter-tab-group" role="tablist" aria-label="QR Scanner input mode">
              <button
                type="button"
                role="tab"
                aria-selected={scannerMode === 'camera'}
                onClick={() => switchScannerMode('camera')}
                className={`filter-tab-btn inline-flex items-center gap-1.5 ${
                  scannerMode === 'camera' ? 'active' : ''
                }`}
              >
                <Camera className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Camera</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={scannerMode === 'upload'}
                onClick={() => switchScannerMode('upload')}
                className={`filter-tab-btn inline-flex items-center gap-1.5 ${
                  scannerMode === 'upload' ? 'active' : ''
                }`}
              >
                <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Upload QR</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={scannerMode === 'manual'}
                onClick={() => switchScannerMode('manual')}
                className={`filter-tab-btn inline-flex items-center gap-1.5 ${
                  scannerMode === 'manual' ? 'active' : ''
                }`}
              >
                <Keyboard className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Gate Code</span>
              </button>
            </div>
          </div>

          {/* Mode 1: Live Camera Scanner */}
          {scannerMode === 'camera' && (
            <div className="space-y-3">
              <div className="relative rounded-[12px] overflow-hidden bg-[#14231B] border border-[var(--border-subtle)] min-h-[260px] flex items-center justify-center">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className={`w-full max-h-[340px] object-cover ${
                    cameraActive ? 'block' : 'hidden'
                  }`}
                />
                <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

                {cameraActive ? (
                  <div
                    className="pointer-events-none absolute inset-0 flex items-center justify-center"
                    aria-hidden="true"
                  >
                    <div className="w-48 h-48 border-2 border-white/80 rounded-[10px] shadow-[0_0_0_9999px_rgba(12,24,18,0.45)] flex items-center justify-center">
                      <ScanLine className="w-7 h-7 text-[#6EE7B7]" />
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center max-w-sm">
                    <div className="w-12 h-12 rounded-[10px] bg-white/10 text-white flex items-center justify-center mx-auto mb-3">
                      <Camera className="w-6 h-6" aria-hidden="true" />
                    </div>
                    <div className="text-sm font-bold text-white mb-1">
                      Live Camera QR Scanner
                    </div>
                    <p className="text-xs text-white/75 mb-4">
                      Point your camera at the ParkEase gate QR display to decode and mark your reserved bay as Occupied.
                    </p>
                    <button
                      type="button"
                      onClick={startCamera}
                      disabled={isProcessing}
                      className="btn-primary text-xs px-4 py-2.5"
                    >
                      <Camera className="w-4 h-4 text-white" aria-hidden="true" />
                      <span>Start Camera Scanner</span>
                    </button>
                  </div>
                )}
              </div>

              {cameraActive && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[var(--primary-forest)]">
                    Scanning live camera frames for ParkEase QR code...
                  </span>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="btn-secondary text-xs px-3 py-1.5 text-[var(--status-occupied)] border-[var(--status-occupied-border)]"
                  >
                    <StopCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Stop Camera</span>
                  </button>
                </div>
              )}

              {cameraError && (
                <div
                  role="alert"
                  className="p-3 rounded-[8px] bg-[var(--status-booked-bg)] border border-[var(--status-booked-border)] text-xs text-[var(--status-booked)] font-medium"
                >
                  {cameraError}
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Upload QR Image */}
          {scannerMode === 'upload' && (
            <div className="flat-subcard p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-[10px] bg-[var(--bg-tint)] text-[var(--primary-forest)] flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6" aria-hidden="true" />
              </div>
              <div>
                <div className="text-sm font-bold text-[var(--text-heading)]">
                  Upload Parking Gate QR Image
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1 max-w-md mx-auto">
                  Select a PNG, JPG, or WebP QR code image from your device. ParkEase decodes it locally via jsQR and updates the bay status in real time.
                </p>
              </div>

              <label className="btn-primary text-xs px-4 py-2.5 inline-flex cursor-pointer">
                <Upload className="w-4 h-4 text-white" aria-hidden="true" />
                <span>{isProcessing ? 'Decoding QR...' : 'Choose QR Image File'}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageUpload}
                  disabled={isProcessing}
                  className="sr-only"
                />
              </label>
            </div>
          )}

          {/* Mode 3: Manual Gate Code Entry */}
          {scannerMode === 'manual' && (
            <form onSubmit={handleManualSubmit} className="flat-subcard p-4 space-y-3">
              <div>
                <label htmlFor="manual-qr-code" className="form-label block mb-1">
                  Parking Area Gate Code or QR Payload
                </label>
                <input
                  id="manual-qr-code"
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder={
                    activeArea && activeSlot
                      ? `PARKEASE|AREA:${activeArea.area_id}|SLOT:${activeSlot.slot_number}`
                      : 'PARKEASE|AREA:1|SLOT:C-01'
                  }
                  className="form-input font-mono text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-[var(--text-muted)] font-mono">
                  Format: PARKEASE|AREA:&lt;id&gt;|SLOT:&lt;bay&gt;
                </span>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="btn-primary text-xs px-4 py-2"
                >
                  <ScanLine className="w-3.5 h-3.5 text-white" aria-hidden="true" />
                  <span>{isProcessing ? 'Processing...' : 'Confirm Arrival with Code'}</span>
                </button>
              </div>
            </form>
          )}

          {lastScannedPayload && (
            <div className="flat-subcard px-3 py-2 text-[11px] text-[var(--text-muted)] flex items-center justify-between gap-2">
              <span className="font-semibold">Last decoded payload:</span>
              <code className="font-mono text-[var(--text-heading)] truncate max-w-[340px]">
                {lastScannedPayload}
              </code>
            </div>
          )}
        </div>

        {/* Right: Scannable Parking Area Gate QR Pass (for gate display / testing) */}
        <div className="lg:col-span-5 soft-raised-static p-5 space-y-4">
          <div className="flex items-start justify-between gap-2 pb-3 border-b border-[var(--border-subtle)]">
            <div>
              <h2 className="text-base font-bold text-[var(--text-heading)] m-0">
                Parking Area Gate QR Pass
              </h2>
              <p className="text-xs text-[var(--text-muted)] m-0 mt-0.5">
                Official checkpoint QR code displayed at Chattogram parking entrances.
              </p>
            </div>
            <QrCode className="w-5 h-5 text-[var(--primary-forest)] shrink-0" aria-hidden="true" />
          </div>

          <div>
            <label htmlFor="gate-qr-area-select" className="form-label block mb-1">
              Parking Area Checkpoint
            </label>
            <select
              id="gate-qr-area-select"
              value={qrPassArea?.area_id || 1}
              onChange={(e) => setQrPassAreaId(Number(e.target.value))}
              className="form-select text-xs font-semibold"
            >
              {activeAreas.map((area) => (
                <option key={area.area_id} value={area.area_id}>
                  {area.area_name} ({area.location})
                </option>
              ))}
            </select>
          </div>

          {qrPassArea && (
            <div className="flat-subcard p-4 flex flex-col items-center text-center space-y-3">
              {qrPassDataUrl ? (
                <img
                  src={qrPassDataUrl}
                  alt={`ParkEase QR Code for ${qrPassArea.area_name}`}
                  loading="lazy"
                  className="w-44 h-44 rounded-[8px] border border-[var(--border-subtle)] bg-white p-2"
                />
              ) : (
                <div className="w-44 h-44 rounded-[8px] border border-[var(--border-subtle)] bg-white flex items-center justify-center text-xs text-[var(--text-muted)]">
                  Generating QR...
                </div>
              )}

              <div>
                <div className="text-sm font-bold text-[var(--text-heading)] flex items-center justify-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[var(--primary-forest)]" aria-hidden="true" />
                  <span>{qrPassArea.area_name} Gate</span>
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  {activeArea && activeArea.area_id === qrPassArea.area_id && activeSlot
                    ? `Target Bay: Slot ${activeSlot.slot_number} (${activeSlot.vehicle_type})`
                    : `Area Arrival Code (Area #${qrPassArea.area_id})`}
                </div>
              </div>

              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleScanGeneratedGateQr}
                  disabled={!qrPassDataUrl || isProcessing}
                  className="btn-primary text-xs px-3 py-2"
                >
                  <ScanLine className="w-3.5 h-3.5 text-white" aria-hidden="true" />
                  <span>Scan Gate QR</span>
                </button>

                {qrPassDataUrl && (
                  <a
                    href={qrPassDataUrl}
                    download={`parkease-gate-area-${qrPassArea.area_id}.png`}
                    className="btn-secondary text-xs px-3 py-2 no-underline"
                  >
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Save QR PNG</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
