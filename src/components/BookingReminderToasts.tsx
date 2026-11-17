import React, { useEffect, useRef, useState } from 'react';
import { BellRing, Clock, MapPin, X, ArrowRight } from 'lucide-react';
import { useParkEase } from '../context/ParkEaseContext';

interface BookingReminderToastsProps {
  onViewBooking: () => void;
}

interface ActiveReminder {
  key: string;
  bookingId: number;
  areaName: string;
  slotNumber: string;
  bookingDate: string;
  bookingTime: string;
  durationHours: number;
  startMs: number;
  minutesRemaining: number;
}

const REMINDER_WINDOW_MS = 30 * 60 * 1000;
const CHECK_INTERVAL_MS = 15 * 1000;
const STORAGE_KEY = 'pe_booking_30m_notified_keys';

function parseBookingStartMs(dateStr: string, timeStr: string): number | null {
  if (!dateStr || !timeStr) return null;
  const dateParts = dateStr.split('-').map(Number);
  const timeParts = timeStr.split(':').map(Number);
  if (dateParts.length !== 3 || timeParts.length < 2) return null;

  const [year, month, day] = dateParts;
  const [hours, minutes, seconds = 0] = timeParts;
  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return null;
  }

  const dt = new Date(year, month - 1, day, hours, minutes, seconds, 0);
  const ms = dt.getTime();
  return Number.isNaN(ms) ? null : ms;
}

function readNotifiedKeys(): Set<string> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.map(String)) : new Set();
  } catch {
    return new Set();
  }
}

function persistNotifiedKeys(keys: Set<string>): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(keys)));
  } catch {
    // Ignore storage quota errors
  }
}

export const BookingReminderToasts: React.FC<BookingReminderToastsProps> = ({
  onViewBooking
}) => {
  const { currentUser, bookings, slots, areas } = useParkEase();
  const [toasts, setToasts] = useState<ActiveReminder[]>([]);
  const notifiedKeysRef = useRef<Set<string>>(readNotifiedKeys());

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'user') {
      setToasts([]);
      return;
    }

    const evaluateUpcomingBookings = () => {
      const nowMs = Date.now();
      const slotMap = new Map(slots.map((s) => [s.slot_id, s]));
      const areaMap = new Map(areas.map((a) => [a.area_id, a]));

      const userConfirmedBookings = bookings.filter(
        (b) => b.user_id === currentUser.user_id && b.booking_status === 'Confirmed'
      );

      const newlyTriggered: ActiveReminder[] = [];
      const activeStartMap = new Map<string, number>();

      for (const booking of userConfirmedBookings) {
        const startMs = parseBookingStartMs(booking.booking_date, booking.booking_time);
        if (startMs === null) continue;

        const diffMs = startMs - nowMs;
        if (diffMs <= 0 || diffMs > REMINDER_WINDOW_MS) {
          continue;
        }

        const key = `${booking.booking_id}_${booking.booking_date}_${booking.booking_time}`;
        activeStartMap.set(key, startMs);

        if (!notifiedKeysRef.current.has(key)) {
          notifiedKeysRef.current.add(key);
          persistNotifiedKeys(notifiedKeysRef.current);

          const slot = slotMap.get(booking.slot_id);
          const area = slot ? areaMap.get(slot.area_id) : undefined;
          const areaName = area?.area_name || 'Chattogram Parking';
          const slotNumber = slot?.slot_number || `#${booking.slot_id}`;
          const minutesRemaining = Math.max(1, Math.ceil(diffMs / 60000));

          newlyTriggered.push({
            key,
            bookingId: booking.booking_id,
            areaName,
            slotNumber,
            bookingDate: booking.booking_date,
            bookingTime: booking.booking_time.slice(0, 5),
            durationHours: booking.duration_hours,
            startMs,
            minutesRemaining
          });

          if (
            typeof window !== 'undefined' &&
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            try {
              new Notification(`Parking starts in ${minutesRemaining} min`, {
                body: `${areaName} / Slot ${slotNumber} at ${booking.booking_time.slice(0, 5)}`
              });
            } catch {
              // Ignore browser Notification API errors in restricted contexts
            }
          }
        }
      }

      setToasts((prev) => {
        const refreshedPrev = prev
          .filter((item) => {
            const remaining = item.startMs - nowMs;
            return remaining > 0 && remaining <= REMINDER_WINDOW_MS && activeStartMap.has(item.key);
          })
          .map((item) => ({
            ...item,
            minutesRemaining: Math.max(1, Math.ceil((item.startMs - nowMs) / 60000))
          }));

        if (newlyTriggered.length === 0 && refreshedPrev.length === prev.length) {
          const changed = refreshedPrev.some(
            (item, idx) => item.minutesRemaining !== prev[idx]?.minutesRemaining
          );
          return changed ? refreshedPrev : prev;
        }

        const existingKeys = new Set(refreshedPrev.map((t) => t.key));
        const merged = [...refreshedPrev];
        for (const item of newlyTriggered) {
          if (!existingKeys.has(item.key)) {
            merged.push(item);
          }
        }
        return merged;
      });
    };

    evaluateUpcomingBookings();

    const intervalId = window.setInterval(evaluateUpcomingBookings, CHECK_INTERVAL_MS);
    const handleVisibility = () => {
      if (!document.hidden) {
        evaluateUpcomingBookings();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [currentUser, bookings, slots, areas]);

  const dismissToast = (key: string) => {
    setToasts((prev) => prev.filter((item) => item.key !== key));
  };

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="booking-toast-region no-print"
      role="region"
      aria-label="Upcoming booking notifications"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div key={toast.key} className="booking-toast-card" role="status">
          <div className="booking-toast-top">
            <div className="booking-toast-title-wrap">
              <span className="booking-toast-icon" aria-hidden="true">
                <BellRing className="w-4 h-4" />
              </span>
              <div>
                <p className="booking-toast-kicker">Upcoming Parking Reminder</p>
                <h3 className="booking-toast-title">
                  Starts in <span className="tabular-nums">{toast.minutesRemaining}</span> min
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={() => dismissToast(toast.key)}
              className="booking-toast-close"
              aria-label={`Dismiss reminder for booking ${toast.bookingId}`}
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="booking-toast-body">
            <div className="booking-toast-detail">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-[var(--primary-forest)]" aria-hidden="true" />
              <span>
                {toast.areaName} / Slot {toast.slotNumber}
              </span>
            </div>
            <div className="booking-toast-detail tabular-nums">
              <Clock className="w-3.5 h-3.5 shrink-0 text-[var(--status-booked)]" aria-hidden="true" />
              <span>
                {toast.bookingDate} at {toast.bookingTime} ({toast.durationHours}h)
              </span>
            </div>
          </div>

          <div className="booking-toast-actions">
            <button
              type="button"
              onClick={() => {
                dismissToast(toast.key);
                onViewBooking();
              }}
              className="booking-toast-action-btn"
            >
              <span>View Booking</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => dismissToast(toast.key)}
              className="booking-toast-dismiss-btn"
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
