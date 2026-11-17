import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { TrendingUp, Clock } from 'lucide-react';
import { Booking, ParkingSlot } from '../../types';

export interface HourlyOccupancyPoint {
  hourLabel: string;
  windowLabel: string;
  overall: number;
  cars: number;
  motorcycles: number;
  usedSlots: number;
  totalSlots: number;
  activeBookings: number;
}

interface OccupancyTrendChartProps {
  slots: ParkingSlot[];
  bookings: Booking[];
}

function parseBookingWindowMs(booking: Booking): { startMs: number; endMs: number } | null {
  if (!booking.booking_date || !booking.booking_time) return null;
  const dateParts = booking.booking_date.split('-').map(Number);
  const timeParts = booking.booking_time.split(':').map(Number);
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

  const startMs = new Date(year, month - 1, day, hours, minutes, seconds, 0).getTime();
  if (Number.isNaN(startMs)) return null;

  const durationHours = Math.max(1, Number(booking.duration_hours || 1));
  const endMs = startMs + durationHours * 3600 * 1000;
  return { startMs, endMs };
}

function formatHourShort(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0');
  return `${hh}:00`;
}

function formatWindowRange(start: Date, end: Date): string {
  const datePart = start.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short'
  });
  return `${datePart}, ${formatHourShort(start)} - ${formatHourShort(end)}`;
}

interface TooltipPayloadItem {
  name?: string;
  value?: number;
  color?: string;
  payload?: HourlyOccupancyPoint;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

const CustomOccupancyTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div
      className="rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-base)] p-3 text-xs shadow-[4px_4px_10px_var(--shadow-dark),-4px_-4px_10px_var(--shadow-light)]"
    >
      <div className="mb-1.5 flex items-center gap-1.5 border-b border-[var(--border-subtle)] pb-1 font-bold text-[var(--text-heading)]">
        <Clock className="h-3.5 w-3.5 text-[var(--primary-forest)]" aria-hidden="true" />
        <span className="tabular-nums">{point.windowLabel}</span>
      </div>

      <div className="space-y-1">
        {payload.map((entry, idx) => (
          <div key={`series-${idx}`} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 font-semibold text-[var(--text-ink)]">
              <span
                className="inline-block h-2 w-2 rounded-[2px]"
                style={{ backgroundColor: entry.color || '#1B5238' }}
                aria-hidden="true"
              />
              <span>{entry.name}:</span>
            </span>
            <span className="font-bold text-[var(--text-heading)] tabular-nums">
              {entry.value ?? 0}%
            </span>
          </div>
        ))}
      </div>

      <div className="mt-1.5 border-t border-[var(--border-subtle)] pt-1 text-[11px] text-[var(--text-muted)] tabular-nums">
        In use: {point.usedSlots} / {point.totalSlots} slots · Bookings: {point.activeBookings}
      </div>
    </div>
  );
};

export const OccupancyTrendChart: React.FC<OccupancyTrendChartProps> = ({ slots, bookings }) => {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const { series, currentUsed, currentPct, peakPct, avgPct, totalSlots } = useMemo(() => {
    const slotMap = new Map(slots.map((s) => [s.slot_id, s]));
    const totalCount = slots.length;
    const carTotal = slots.filter((s) => s.vehicle_type === 'Car').length;
    const motoTotal = slots.filter((s) => s.vehicle_type === 'Motorcycle').length;

    const liveActiveSlots = slots.filter(
      (s) => s.status === 'Occupied' || s.status === 'Booked'
    );

    const activeBookingWindows = bookings
      .filter((b) => b.booking_status !== 'Cancelled')
      .map((b) => ({
        booking: b,
        window: parseBookingWindowMs(b)
      }))
      .filter(
        (item): item is { booking: Booking; window: { startMs: number; endMs: number } } =>
          item.window !== null
      );

    const currentHourStart = new Date();
    currentHourStart.setMinutes(0, 0, 0);
    const currentHourMs = currentHourStart.getTime();
    const hourMs = 3600 * 1000;

    const points: HourlyOccupancyPoint[] = [];

    for (let offset = 23; offset >= 0; offset -= 1) {
      const bucketStartMs = currentHourMs - offset * hourMs;
      const bucketEndMs = bucketStartMs + hourMs;
      const bucketStartDate = new Date(bucketStartMs);
      const bucketEndDate = new Date(bucketEndMs);
      const isCurrentHour = offset === 0;

      const usedSlotIds = new Set<number>();
      let overlappingBookingsCount = 0;

      for (const item of activeBookingWindows) {
        if (item.window.startMs < bucketEndMs && item.window.endMs > bucketStartMs) {
          overlappingBookingsCount += 1;
          usedSlotIds.add(item.booking.slot_id);
        }
      }

      if (isCurrentHour) {
        for (const s of liveActiveSlots) {
          usedSlotIds.add(s.slot_id);
        }
      }

      let carUsed = 0;
      let motoUsed = 0;
      usedSlotIds.forEach((slotId) => {
        const slot = slotMap.get(slotId);
        if (slot?.vehicle_type === 'Car') {
          carUsed += 1;
        } else if (slot?.vehicle_type === 'Motorcycle') {
          motoUsed += 1;
        }
      });

      const usedCount = usedSlotIds.size;
      const overallPct = totalCount > 0 ? Math.round((usedCount / totalCount) * 100) : 0;
      const carPct = carTotal > 0 ? Math.round((carUsed / carTotal) * 100) : 0;
      const motoPct = motoTotal > 0 ? Math.round((motoUsed / motoTotal) * 100) : 0;

      points.push({
        hourLabel: isCurrentHour ? 'Now' : formatHourShort(bucketStartDate),
        windowLabel: formatWindowRange(bucketStartDate, bucketEndDate),
        overall: overallPct,
        cars: carPct,
        motorcycles: motoPct,
        usedSlots: usedCount,
        totalSlots: totalCount,
        activeBookings: overlappingBookingsCount
      });
    }

    const latest = points[points.length - 1];
    const peak = points.reduce((max, p) => Math.max(max, p.overall), 0);
    const avg =
      points.length > 0
        ? Math.round(points.reduce((sum, p) => sum + p.overall, 0) / points.length)
        : 0;

    return {
      series: points,
      currentUsed: latest?.usedSlots ?? 0,
      currentPct: latest?.overall ?? 0,
      peakPct: peak,
      avgPct: avg,
      totalSlots: totalCount
    };
  }, [slots, bookings]);

  return (
    <section className="admin-card" aria-labelledby="occupancy-trends-heading">
      <div className="admin-card-header">
        <div>
          <h2 id="occupancy-trends-heading" className="admin-card-title">
            <TrendingUp className="h-4 w-4 text-[var(--primary-forest)]" aria-hidden="true" />
            <span>Parking Occupancy Trends</span>
          </h2>
          <p className="admin-card-subtitle">
            Real-time slot usage over the last 24 hours across all {totalSlots} parking slots.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)] tabular-nums">
          <span>
            Current:{' '}
            <strong className="text-[var(--text-heading)]">
              {currentUsed}/{totalSlots} ({currentPct}%)
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            24h Peak: <strong className="text-[var(--text-heading)]">{peakPct}%</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            24h Avg: <strong className="text-[var(--primary-forest)]">{avgPct}%</strong>
          </span>
        </div>
      </div>

      <div className="h-64 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 10, right: 16, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="parkeaseOccupancyFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1B5238" stopOpacity={0.26} />
                <stop offset="95%" stopColor="#1B5238" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#D5DDD7" strokeDasharray="3 3" />
            <XAxis
              dataKey="hourLabel"
              stroke="#536159"
              fontSize={11}
              tickLine={false}
              interval={2}
              dy={5}
            />
            <YAxis
              stroke="#536159"
              fontSize={11}
              domain={[0, 100]}
              tickLine={false}
              unit="%"
            />
            <Tooltip content={<CustomOccupancyTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
              iconType="square"
              iconSize={9}
            />
            <Area
              type="monotone"
              dataKey="overall"
              name="Overall Usage"
              stroke="#1B5238"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#parkeaseOccupancyFill)"
              isAnimationActive={!prefersReducedMotion}
              activeDot={{ r: 5, fill: '#1B5238', stroke: '#D9A72A', strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="cars"
              name="Car Slots"
              stroke="#C87619"
              strokeWidth={2}
              strokeDasharray="4 4"
              fillOpacity={0}
              fill="transparent"
              isAnimationActive={!prefersReducedMotion}
            />
            <Area
              type="monotone"
              dataKey="motorcycles"
              name="Motorcycle Slots"
              stroke="#536159"
              strokeWidth={2}
              fillOpacity={0}
              fill="transparent"
              isAnimationActive={!prefersReducedMotion}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};
