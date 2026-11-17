import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParkEase } from '../../context/ParkEaseContext';
import { subscribeLiveRefresh, LIVE_REFRESH_INTERVAL_MS } from '../../utils/liveRefresh';
import {
  ParkingSlot,
  SlotSearchResult,
  SlotStatus,
  SuggestedTimeSlot,
  VehicleType
} from '../../types';
import { Check, Search, Loader2, Clock, History, Radio, MapPin, RotateCcw, X } from 'lucide-react';

interface UserFindParkingProps {
  onSelectSlotForBooking: (
    slot: SlotSearchResult,
    searchParams: { date: string; time: string; duration: number }
  ) => void;
}

interface DisplaySlot extends ParkingSlot {
  resolvedStatus: SlotStatus;
  areaName: string;
  location: string;
}

interface RecentParkingSearch {
  id: string;
  areaId: number;
  areaName: string;
  location: string;
  vehicleType: 'All' | VehicleType;
  statusFilter: 'All' | SlotStatus;
  slotQuery: string;
  date: string;
  time: string;
  duration: number;
  searchedAt: string;
}

const RECENT_SEARCHES_KEY = 'pe_recent_parking_searches';
const MAX_RECENT_SEARCHES = 5;

const loadRecentSearches = (): RecentParkingSearch[] => {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is RecentParkingSearch =>
          Boolean(item) &&
          typeof item === 'object' &&
          typeof (item as RecentParkingSearch).areaId === 'number' &&
          typeof (item as RecentParkingSearch).areaName === 'string' &&
          typeof (item as RecentParkingSearch).date === 'string' &&
          typeof (item as RecentParkingSearch).time === 'string'
      )
      .slice(0, MAX_RECENT_SEARCHES);
  } catch {
    return [];
  }
};

const persistRecentSearches = (items: RecentParkingSearch[]) => {
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota or private-mode errors
  }
};

const VehicleLineIcon: React.FC<{ type: VehicleType; size?: number }> = ({ type, size = 16 }) => {
  if (type === 'Car') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M5 11l2-5h10l2 5" />
        <rect x="3" y="11" width="18" height="6" rx="2" />
        <circle cx="7.5" cy="17" r="1.5" />
        <circle cx="16.5" cy="17" r="1.5" />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="6.5" cy="16.5" r="2.5" />
      <circle cx="17.5" cy="16.5" r="2.5" />
      <path d="M9 16.5h4l2.5-6.5h-4l-1.5 3.5" />
      <path d="M14 8h3l1 2" />
    </svg>
  );
};

export const UserFindParking: React.FC<UserFindParkingProps> = ({ onSelectSlotForBooking }) => {
  const {
    areas,
    slots,
    isSlotAvailable,
    fetchSlotAvailability,
    fetchNextAvailableSlotsForArea,
    getSuggestedTimes,
    refreshLiveData
  } = useParkEase();

  const [lastSyncedAt, setLastSyncedAt] = useState<string>(() =>
    new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  );
  const [isLiveSyncing, setIsLiveSyncing] = useState<boolean>(false);
  const refreshRef = useRef(refreshLiveData);
  refreshRef.current = refreshLiveData;

  useEffect(() => {
    const loadSlotUpdates = async () => {
      setIsLiveSyncing(true);
      try {
        const res = await refreshRef.current();
        setLastSyncedAt(res.syncedAt);
      } finally {
        setIsLiveSyncing(false);
      }
    };

    const stop = subscribeLiveRefresh(loadSlotUpdates, LIVE_REFRESH_INTERVAL_MS);
    return () => stop();
  }, []);

  const activeAreas = useMemo(
    () => areas.filter((a) => a.status === 'Active'),
    [areas]
  );

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedAreaId, setSelectedAreaId] = useState<number>(activeAreas[0]?.area_id || 1);
  const [vehicleFilter, setVehicleFilter] = useState<'All' | VehicleType>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | SlotStatus>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchDate, setSearchDate] = useState<string>(todayStr);
  const [searchTime, setSearchTime] = useState<string>('10:00');
  const [searchDuration, setSearchDuration] = useState<number>(2);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);

  // Real-time database fetch progress & fallback suggestions state
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchProgress, setSearchProgress] = useState<number>(0);
  const [searchStage, setSearchStage] = useState<string>('');
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState<boolean>(false);
  const [fetchedSuggestedTimes, setFetchedSuggestedTimes] = useState<SuggestedTimeSlot[] | null>(
    null
  );
  const [recentSearches, setRecentSearches] = useState<RecentParkingSearch[]>(() =>
    loadRecentSearches()
  );

  const currentArea =
    activeAreas.find((a) => a.area_id === Number(selectedAreaId)) || activeAreas[0];

  // Evaluate availability for any slot against current date, time, duration
  const resolveSlotStatus = (slot: ParkingSlot): SlotStatus => {
    if (slot.status === 'Occupied') return 'Occupied';
    if (
      slot.status === 'Booked' ||
      !isSlotAvailable(slot.slot_id, searchDate, searchTime, Number(searchDuration))
    ) {
      return 'Booked';
    }
    return 'Available';
  };

  // Slots belonging to the chosen area
  const areaEvaluatedSlots: DisplaySlot[] = useMemo(() => {
    if (!currentArea) return [];
    return slots
      .filter((s) => s.area_id === currentArea.area_id)
      .map((slot) => ({
        ...slot,
        resolvedStatus: resolveSlotStatus(slot),
        areaName: currentArea.area_name,
        location: currentArea.location
      }));
  }, [currentArea, slots, searchDate, searchTime, searchDuration, isSlotAvailable]);

  const areaAvailableCount = areaEvaluatedSlots.filter(
    (s) => s.resolvedStatus === 'Available'
  ).length;

  // Filtered slots grid
  const filteredSlots = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return areaEvaluatedSlots.filter((slot) => {
      if (vehicleFilter !== 'All' && slot.vehicle_type !== vehicleFilter) return false;
      if (statusFilter !== 'All' && slot.resolvedStatus !== statusFilter) return false;
      if (q && !slot.slot_number.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [areaEvaluatedSlots, vehicleFilter, statusFilter, searchQuery]);

  const selectedSlot = areaEvaluatedSlots.find(
    (s) => s.slot_id === selectedSlotId && s.resolvedStatus === 'Available'
  );

  const filteredAvailableCount = filteredSlots.filter(
    (s) => s.resolvedStatus === 'Available'
  ).length;

  // Automatic database fallback query when zero slots are available for the requested schedule
  useEffect(() => {
    const zeroAvailable = filteredSlots.length === 0 || filteredAvailableCount === 0;
    if (!zeroAvailable || fetchedSuggestedTimes !== null || isSearching || !currentArea) {
      return;
    }

    let cancelled = false;
    setIsLoadingSuggestions(true);

    fetchNextAvailableSlotsForArea({
      areaId: Number(selectedAreaId),
      vehicleType: vehicleFilter,
      dateStr: searchDate,
      timeStr: searchTime,
      durationHours: Number(searchDuration),
      bookingType: Number(searchDuration) === 24 ? 'full_day' : 'hourly'
    })
      .then((results) => {
        if (!cancelled) {
          setFetchedSuggestedTimes(results);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFetchedSuggestedTimes([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingSuggestions(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    filteredSlots.length,
    filteredAvailableCount,
    fetchedSuggestedTimes,
    isSearching,
    currentArea,
    fetchNextAvailableSlotsForArea,
    selectedAreaId,
    vehicleFilter,
    searchDate,
    searchTime,
    searchDuration
  ]);

  // Historical Suggested Times whenever 0 matching or 0 available slots exist
  const suggestedTimes = useMemo(() => {
    if (filteredSlots.length > 0 && filteredAvailableCount > 0) return [];
    if (fetchedSuggestedTimes && fetchedSuggestedTimes.length > 0) {
      return fetchedSuggestedTimes;
    }
    return getSuggestedTimes(
      Number(selectedAreaId),
      vehicleFilter,
      searchDate,
      searchTime,
      Number(searchDuration),
      Number(searchDuration) === 24 ? 'full_day' : 'hourly'
    );
  }, [
    filteredSlots.length,
    filteredAvailableCount,
    fetchedSuggestedTimes,
    getSuggestedTimes,
    selectedAreaId,
    vehicleFilter,
    searchDate,
    searchTime,
    searchDuration
  ]);

  const saveSearchToHistory = (params: {
    areaId: number;
    vehicleType: 'All' | VehicleType;
    statusFilter: 'All' | SlotStatus;
    slotQuery: string;
    date: string;
    time: string;
    duration: number;
  }) => {
    const matchedArea = activeAreas.find((a) => a.area_id === Number(params.areaId)) || currentArea;
    if (!matchedArea) return;

    const cleanSlotQuery = params.slotQuery.trim().toUpperCase();
    const dedupeKey = [
      matchedArea.area_id,
      params.vehicleType,
      params.statusFilter,
      cleanSlotQuery,
      params.date,
      params.time,
      params.duration
    ].join('|');

    const entry: RecentParkingSearch = {
      id: dedupeKey,
      areaId: matchedArea.area_id,
      areaName: matchedArea.area_name,
      location: matchedArea.location,
      vehicleType: params.vehicleType,
      statusFilter: params.statusFilter,
      slotQuery: cleanSlotQuery,
      date: params.date,
      time: params.time,
      duration: params.duration,
      searchedAt: new Date().toISOString()
    };

    setRecentSearches((prev) => {
      const next = [entry, ...prev.filter((item) => item.id !== dedupeKey)].slice(
        0,
        MAX_RECENT_SEARCHES
      );
      persistRecentSearches(next);
      return next;
    });
  };

  const executeFindParking = async (
    targetDate = searchDate,
    targetTime = searchTime,
    targetDuration = searchDuration,
    targetAreaId = Number(selectedAreaId),
    targetVehicleType = vehicleFilter,
    targetSlotQuery = searchQuery,
    targetStatusFilter = statusFilter
  ) => {
    setIsSearching(true);
    setSearchProgress(10);
    setSearchStage('Connecting to database...');
    setSelectedSlotId(null);

    saveSearchToHistory({
      areaId: targetAreaId,
      vehicleType: targetVehicleType,
      statusFilter: targetStatusFilter,
      slotQuery: targetSlotQuery,
      date: targetDate,
      time: targetTime,
      duration: Number(targetDuration)
    });

    const bookingType = Number(targetDuration) === 24 ? 'full_day' : 'hourly';
    try {
      const response = await fetchSlotAvailability(
        {
          areaId: targetAreaId,
          vehicleType: targetVehicleType,
          dateStr: targetDate,
          timeStr: targetTime,
          durationHours: Number(targetDuration),
          bookingType
        },
        (percent, stage) => {
          setSearchProgress(percent);
          setSearchStage(stage);
        }
      );
      setFetchedSuggestedTimes(response.suggestedTimes);
    } finally {
      window.setTimeout(() => {
        setIsSearching(false);
        setSearchProgress(0);
        setSearchStage('');
      }, 220);
    }
  };

  const handleApplyRecentSearch = async (item: RecentParkingSearch) => {
    const validArea = activeAreas.find((a) => a.area_id === item.areaId);
    const nextAreaId = validArea ? validArea.area_id : activeAreas[0]?.area_id || 1;
    const nextDate = item.date >= todayStr ? item.date : todayStr;

    setSelectedAreaId(nextAreaId);
    setVehicleFilter(item.vehicleType);
    setStatusFilter(item.statusFilter);
    setSearchQuery(item.slotQuery);
    setSearchDate(nextDate);
    setSearchTime(item.time);
    setSearchDuration(item.duration);
    setSelectedSlotId(null);
    setFetchedSuggestedTimes(null);

    await executeFindParking(
      nextDate,
      item.time,
      item.duration,
      nextAreaId,
      item.vehicleType,
      item.slotQuery,
      item.statusFilter
    );
  };

  const handleRemoveRecentSearch = (id: string) => {
    setRecentSearches((prev) => {
      const next = prev.filter((item) => item.id !== id);
      persistRecentSearches(next);
      return next;
    });
  };

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
    persistRecentSearches([]);
  };

  const handleApplySuggestedTime = async (item: SuggestedTimeSlot) => {
    setSearchDate(item.date);
    setSearchTime(item.time);
    setSearchDuration(item.durationHours);
    setStatusFilter('All');
    setSearchQuery('');
    await executeFindParking(
      item.date,
      item.time,
      item.durationHours,
      Number(selectedAreaId),
      vehicleFilter,
      '',
      'All'
    );
  };

  const handleContinueToBooking = () => {
    if (!selectedSlot || !currentArea) return;

    const dur = Number(searchDuration);
    const total =
      dur === 24 ? selectedSlot.day_price : selectedSlot.price_per_hour * dur;

    const payload: SlotSearchResult = {
      slot_id: selectedSlot.slot_id,
      area_id: selectedSlot.area_id,
      slot_number: selectedSlot.slot_number,
      vehicle_type: selectedSlot.vehicle_type,
      price_per_hour: selectedSlot.price_per_hour,
      day_price: selectedSlot.day_price,
      status: selectedSlot.status,
      created_at: selectedSlot.created_at,
      area_name: selectedSlot.areaName,
      location: selectedSlot.location,
      calculated_total: total
    };

    onSelectSlotForBooking(payload, {
      date: searchDate,
      time: searchTime,
      duration: dur
    });
  };

  return (
    <div className="user-portal-container space-y-5">
      {/* Header */}
      <div className="user-page-header m-0">
        <div>
          <h1 className="user-page-title">Parking Areas & Slot Availability</h1>
          <p className="user-page-subtitle">
            Browse parking areas in Chattogram and select an available slot to reserve.
          </p>
        </div>

        <div
          data-live-refresh-indicator="true"
          role="status"
          aria-live="polite"
          title="Auto-refreshes every 5 seconds"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-[var(--bg-tint)] border border-[var(--status-available-border)] text-xs font-semibold text-[var(--primary-forest)] whitespace-nowrap shrink-0"
        >
          <Radio className="w-3.5 h-3.5 text-[var(--primary-forest)] shrink-0" aria-hidden="true" />
          <span>Live</span>
          <span className="text-[11px] font-medium text-[var(--text-muted)] tabular-nums">
            {isLiveSyncing ? '· Syncing' : `· ${lastSyncedAt}`}
          </span>
        </div>
      </div>

      {/* Row 1: Choose Parking Area (6 Area Selector Tiles) */}
      <div className="soft-raised-static p-4 sm:p-5">
        <div className="text-xs font-bold text-[var(--text-heading)] mb-3">
          Choose Parking Area:
        </div>
        <div className="area-selector-grid">
          {activeAreas.map((area) => {
            const areaSlots = slots.filter((s) => s.area_id === area.area_id);
            const openCount = areaSlots.filter(
              (s) => resolveSlotStatus(s) === 'Available'
            ).length;
            const isSelected = area.area_id === Number(selectedAreaId);

            return (
              <button
                key={area.area_id}
                type="button"
                onClick={() => {
                  setSelectedAreaId(area.area_id);
                  setSelectedSlotId(null);
                  setFetchedSuggestedTimes(null);
                }}
                className={`area-select-tile ${isSelected ? 'selected' : ''}`}
              >
                <div className="text-xs font-bold truncate">{area.area_name}</div>
                <div
                  className={`text-[11px] mt-0.5 tabular-nums ${
                    isSelected ? 'text-white/90' : 'text-[var(--text-muted)]'
                  }`}
                >
                  {openCount} Available
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 2: 3 Area Summary Cards */}
      {currentArea && (
        <div className="space-y-4">
          <div className="user-stat-grid m-0">
            <div className="user-stat-card">
              <div className="user-stat-label">Current Area</div>
              <div className="user-stat-value text-lg">{currentArea.area_name}</div>
              <div className="user-stat-hint">{currentArea.location}</div>
            </div>

            <div className="user-stat-card">
              <div className="user-stat-label">Total Slots in Area</div>
              <div className="user-stat-value">{areaEvaluatedSlots.length}</div>
              <div className="user-stat-hint">Configured slots</div>
            </div>

            <div className="user-stat-card">
              <div className="user-stat-label">Available Now</div>
              <div className="user-stat-value text-[var(--primary-forest)]">
                {areaAvailableCount}
              </div>
              <div className="user-stat-hint">Ready to reserve</div>
            </div>
          </div>
        </div>
      )}

      {/* Row 3: Filter, Search & Schedule Strip */}
      <div className="soft-raised-static p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Vehicle Type Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[var(--text-heading)]">Vehicle Type:</span>
            {(['All', 'Car', 'Motorcycle'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setVehicleFilter(type);
                  setFetchedSuggestedTimes(null);
                }}
                className={`filter-tab-btn ${vehicleFilter === type ? 'active' : ''}`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Status Filter (3 real statuses + All) */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[var(--text-heading)]">Status:</span>
            {(['All', 'Available', 'Booked', 'Occupied'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`filter-tab-btn ${statusFilter === status ? 'active' : ''}`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Slot Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-[260px]">
            <Search
              className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-2.5 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search slot (e.g. C-01)..."
              aria-label="Search parking slot"
              className="form-input pl-8 py-1.5 text-xs"
            />
          </div>
        </div>

        {/* Date / Time / Duration Strip + Find Parking Button */}
        <div className="pt-3 border-t border-[var(--border-subtle)] grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label htmlFor="find-date-input" className="form-label block mb-1">
              Arrival Date
            </label>
            <input
              id="find-date-input"
              type="date"
              min={todayStr}
              value={searchDate}
              onChange={(e) => {
                setSearchDate(e.target.value);
                setFetchedSuggestedTimes(null);
              }}
              className="form-input py-1.5 text-xs font-semibold"
            />
          </div>

          <div>
            <label htmlFor="find-time-input" className="form-label block mb-1">
              Entry Time
            </label>
            <input
              id="find-time-input"
              type="time"
              value={searchTime}
              onChange={(e) => {
                setSearchTime(e.target.value);
                setFetchedSuggestedTimes(null);
              }}
              className="form-input py-1.5 text-xs font-semibold"
            />
          </div>

          <div>
            <label htmlFor="find-duration-select" className="form-label block mb-1">
              Booking Duration
            </label>
            <select
              id="find-duration-select"
              value={searchDuration}
              onChange={(e) => {
                setSearchDuration(Number(e.target.value));
                setFetchedSuggestedTimes(null);
              }}
              className="form-select py-1.5 text-xs font-semibold"
            >
              {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((hr) => (
                <option key={hr} value={hr}>
                  {hr} {hr === 1 ? 'Hour' : 'Hours'}
                </option>
              ))}
              <option value={24}>Full Day (24 Hours)</option>
            </select>
          </div>

          <div>
            <button
              type="button"
              disabled={isSearching}
              aria-busy={isSearching}
              aria-label="Search Parking"
              onClick={() => executeFindParking()}
              className="btn-primary btn-find-progress w-full py-2 text-xs"
            >
              {isSearching ? (
                <>
                  <span
                    className="find-progress-fill-overlay"
                    style={{ width: `${searchProgress}%` }}
                    aria-hidden="true"
                  />
                  <Loader2 className="w-3.5 h-3.5 text-white animate-spin" aria-hidden="true" />
                  <span className="tabular-nums">
                    Searching... {searchProgress}%
                  </span>
                  <div
                    className="find-progress-track"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={searchProgress}
                    aria-label="Database availability fetch progress"
                  >
                    <div
                      className="find-progress-fill"
                      style={{ width: `${searchProgress}%` }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5 text-white" aria-hidden="true" />
                  <span>Search Parking</span>
                </>
              )}
            </button>
          </div>
        </div>
        {isSearching && (
          <p
            aria-live="polite"
            className="text-[11px] font-medium text-[var(--primary-forest)] text-right tabular-nums m-0"
          >
            {searchStage} ({searchProgress}%)
          </p>
        )}
      </div>

      {/* Recent Searches Section (localStorage backed) */}
      <section className="soft-raised-static p-4" aria-labelledby="recent-searches-heading">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[var(--primary-forest)]" aria-hidden="true" />
            <h2
              id="recent-searches-heading"
              className="text-xs sm:text-sm font-bold text-[var(--text-heading)] m-0"
            >
              Recent Searches
            </h2>
          </div>

          {recentSearches.length > 0 && (
            <button
              type="button"
              onClick={handleClearRecentSearches}
              className="text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--status-occupied)] bg-transparent border-0 p-0 cursor-pointer"
            >
              Clear All
            </button>
          )}
        </div>

        {recentSearches.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] m-0">
            No recent searches yet. Run a parking search above to save it for quick access.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {recentSearches.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-2 p-2.5 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-base)] hover:border-[var(--primary-forest)] transition-colors"
              >
                <button
                  type="button"
                  disabled={isSearching}
                  onClick={() => void handleApplyRecentSearch(item)}
                  className="flex-1 text-left bg-transparent border-0 p-0 cursor-pointer min-w-0"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-heading)]">
                    <MapPin
                      className="w-3.5 h-3.5 text-[var(--primary-forest)] shrink-0"
                      aria-hidden="true"
                    />
                    <span className="truncate">{item.areaName}</span>
                    <span className="badge-status badge-neutral text-[10px] py-0 px-1.5 shrink-0">
                      {item.vehicleType}
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-1 tabular-nums truncate">
                    {item.date} at {item.time} ({item.duration === 24 ? 'Full Day' : `${item.duration}h`})
                    {item.slotQuery ? ` | Slot ${item.slotQuery}` : ''}
                  </div>
                  <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--primary-forest)] mt-1">
                    <RotateCcw className="w-3 h-3" aria-hidden="true" />
                    <span>Load Query</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleRemoveRecentSearch(item.id)}
                  aria-label={`Remove recent search for ${item.areaName}`}
                  className="text-[var(--text-muted)] hover:text-[var(--status-occupied)] bg-transparent border-0 p-1 rounded-[6px] cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Row 4: Slots Grid Card */}
      <div className="soft-raised-static slots-fetch-container p-5">
        {isSearching && (
          <>
            <div className="slots-linear-bar" aria-hidden="true">
              <div
                className="slots-linear-bar-fill"
                style={{ width: `${searchProgress}%` }}
              />
            </div>
            <div className="slots-fetch-overlay" role="status" aria-live="polite">
              <div className="slots-fetch-status-box">
                <div className="flex items-center justify-between gap-2 text-xs font-bold text-[var(--text-heading)] mb-2">
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2
                      className="w-3.5 h-3.5 text-[var(--primary-forest)] animate-spin"
                      aria-hidden="true"
                    />
                    <span>{searchStage || 'Fetching live availability...'}</span>
                  </span>
                  <span className="tabular-nums text-[var(--primary-forest)]">
                    {searchProgress}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-[var(--bg-inset)] rounded-[4px] overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary-forest)] transition-all duration-150"
                    style={{ width: `${searchProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-sm font-bold text-[var(--text-heading)] m-0 tabular-nums">
            Slots in {currentArea?.area_name} ({filteredSlots.length} Slots)
          </h2>

          <div className="flex items-center gap-2 text-[11px] font-semibold">
            <span className="badge-status badge-available">Available</span>
            <span className="badge-status badge-booked">Booked</span>
            <span className="badge-status badge-occupied">Occupied</span>
          </div>
        </div>

        {filteredSlots.length === 0 ? (
          <div className="user-empty-state">
            <div className="user-empty-title">No Matching Slots</div>
            <p className="user-empty-desc m-0">
              No slots match your current filter or schedule in {currentArea?.area_name}. Check
              suggested next available windows below or adjust your filters.
            </p>
          </div>
        ) : (
          <div className="find-parking-slots-grid">
            {filteredSlots.map((slot, index) => {
              const isSelected =
                selectedSlotId === slot.slot_id && slot.resolvedStatus === 'Available';
              const isAvail = slot.resolvedStatus === 'Available';
              const isBooked = slot.resolvedStatus === 'Booked';

              return (
                <button
                  key={slot.slot_id}
                  type="button"
                  disabled={!isAvail}
                  onClick={() => {
                    if (isAvail) {
                      setSelectedSlotId(isSelected ? null : slot.slot_id);
                    }
                  }}
                  className={`find-slot-tile ${
                    isAvail
                      ? isSelected
                        ? 'is-available is-selected'
                        : 'is-available'
                      : isBooked
                      ? 'is-booked'
                      : 'is-occupied'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="text-[11px] font-bold text-[var(--text-muted)] tabular-nums">
                      #{index + 1}
                    </span>
                    <span
                      className={
                        isAvail
                          ? 'text-[var(--primary-forest)]'
                          : isBooked
                          ? 'text-[var(--status-booked)]'
                          : 'text-[var(--status-occupied)]'
                      }
                    >
                      <VehicleLineIcon type={slot.vehicle_type} size={15} />
                    </span>
                  </div>

                  <div className="w-full text-center my-1">
                    <div className="text-base font-bold text-[var(--text-heading)] flex items-center justify-center gap-1">
                      <span>{slot.slot_number}</span>
                      {isSelected && (
                        <Check
                          className="w-3.5 h-3.5 text-[var(--primary-forest)]"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <div className="text-[11px] font-semibold text-[var(--text-muted)] tabular-nums mt-0.5">
                      {slot.price_per_hour} BDT/hr | {slot.day_price}/day
                    </div>
                  </div>

                  <div className="w-full mt-2 flex justify-center">
                    <span
                      className={`badge-status w-full justify-center uppercase tracking-wider text-[10px] ${
                        isAvail
                          ? 'badge-available'
                          : isBooked
                          ? 'badge-booked'
                          : 'badge-occupied'
                      }`}
                    >
                      {slot.resolvedStatus}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Suggested Times Section (database fallback when zero slots are found for requested time) */}
      {(filteredSlots.length === 0 || filteredAvailableCount === 0) &&
        (isLoadingSuggestions || suggestedTimes.length > 0) &&
        currentArea && (
          <div className="soft-raised-static p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b-2 border-dashed border-[var(--accent-gold)]">
              <div>
                <div className="flex items-center gap-2">
                  <History
                    className="w-4 h-4 text-[var(--primary-forest)]"
                    aria-hidden="true"
                  />
                  <h2 className="text-base font-bold text-[var(--text-heading)] m-0">
                    Suggested Times
                  </h2>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-0.5 m-0">
                  Next available windows in {currentArea.area_name} from database &amp; historical
                  booking records.
                </p>
              </div>
              <span className="badge-status badge-neutral">
                {isLoadingSuggestions ? 'Querying Database...' : 'Next Available Windows'}
              </span>
            </div>

            {isLoadingSuggestions ? (
              <div
                className="flex items-center gap-2.5 py-4 text-xs font-semibold text-[var(--primary-forest)]"
                role="status"
                aria-live="polite"
              >
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>
                  Searching database for next open slots in {currentArea.area_name}...
                </span>
              </div>
            ) : (
              <div className="suggested-times-grid">
                {suggestedTimes.map((item) => {
                  const firstSlot = item.slots[0];
                  return (
                    <div key={`${item.date}_${item.time}`} className="suggested-time-tile">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--text-heading)] tabular-nums">
                            <Clock
                              className="w-3.5 h-3.5 text-[var(--primary-forest)]"
                              aria-hidden="true"
                            />
                            <span>{item.time}</span>
                          </span>
                          <span className="badge-status badge-available tabular-nums">
                            {item.isProjectedTurnover
                              ? `${item.availableCount} Projected`
                              : `${item.availableCount} Open`}
                          </span>
                        </div>

                        <div className="text-xs font-semibold text-[var(--text-ink)] tabular-nums">
                          {item.date} ({item.durationHours}h)
                        </div>

                        <div className="text-[11px] text-[var(--text-muted)] mt-1">
                          {item.historicalReason}
                        </div>

                        {firstSlot && (
                          <div className="text-[11px] font-semibold text-[var(--primary-forest)] mt-1.5 tabular-nums">
                            Slots:{' '}
                            {item.slots
                              .slice(0, 3)
                              .map((s) => s.slot_number)
                              .join(', ')}{' '}
                            ({firstSlot.calculated_total} BDT)
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={isSearching}
                        onClick={() => handleApplySuggestedTime(item)}
                        className="btn-primary w-full py-1.5 text-xs"
                      >
                        Select {item.time} &amp; Search Parking
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      {/* Selected Slot Action Footer */}
      {selectedSlot && currentArea && (
        <div className="active-session-banner m-0">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs flex-1">
            <div>
              <span className="text-[var(--text-muted)] block">Selected Slot</span>
              <span className="font-bold text-[var(--text-heading)] text-sm">
                {selectedSlot.slot_number} ({selectedSlot.vehicle_type})
              </span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block">Area</span>
              <span className="font-semibold text-[var(--text-ink)]">
                {currentArea.area_name}
              </span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block">Schedule</span>
              <span className="font-semibold text-[var(--text-ink)] tabular-nums">
                {searchDate} at {searchTime}
              </span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block">Duration</span>
              <span className="font-semibold text-[var(--text-ink)] tabular-nums">
                {Number(searchDuration) === 24
                  ? 'Full Day (24 Hours)'
                  : `${searchDuration} ${Number(searchDuration) === 1 ? 'Hour' : 'Hours'}`}
              </span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block">Estimated Total</span>
              <span className="font-bold text-[var(--primary-forest)] text-sm tabular-nums">
                {Number(searchDuration) === 24
                  ? selectedSlot.day_price
                  : selectedSlot.price_per_hour * Number(searchDuration)}{' '}
                BDT
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleContinueToBooking}
            className="btn-primary text-xs sm:text-sm px-5 py-2.5 shrink-0"
          >
            Continue to Booking
          </button>
        </div>
      )}
    </div>
  );
};
