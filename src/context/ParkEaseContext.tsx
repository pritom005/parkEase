/**
 * ParkEase Central State & Business Logic Provider
 * Encapsulates all database mutations, session management, and business rules.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  Vehicle,
  ParkingArea,
  ParkingSlot,
  Booking,
  Payment,
  SlotSearchResult,
  SuggestedTimeSlot,
  PaymentMethod
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_AREAS,
  INITIAL_SLOTS,
  INITIAL_VEHICLES,
  INITIAL_BOOKINGS,
  INITIAL_PAYMENTS
} from '../data/initialData';
import {
  auth,
  googleProvider,
  signInWithPopup,
  fbSignOut
} from '../firebase';

interface OtpSendResponse {
  success: boolean;
  message: string;
  maskedPhone?: string;
  expiresInSeconds?: number;
  resendCooldownSeconds?: number;
  deliveryMode?: 'sms' | 'sandbox';
  sandboxOtp?: string;
  retryAfterSeconds?: number;
}

interface OptionalVehicleInput {
  vehicleNumber: string;
  vehicleType: 'Car' | 'Motorcycle';
  brand: string;
  model: string;
}

interface ParkEaseContextType {
  // Current session
  currentUser: User | null;
  login: (email: string, role?: 'user' | 'admin') => { success: boolean; message: string };
  completeDemoSession: (account: {
    user_id: number;
    full_name: string;
    email: string;
    role: 'user' | 'admin';
  }) => void;
  loginWithGoogle: () => Promise<{ success: boolean; message: string; role?: 'user' | 'admin' }>;
  register: (
    fullName: string,
    email: string,
    phone: string,
    consent: boolean,
    optionalVehicle?: OptionalVehicleInput
  ) => { success: boolean; message: string; user?: User };
  sendPhoneOtp: (phone: string) => Promise<OtpSendResponse>;
  verifyPhoneOtp: (phone: string, code: string) => Promise<{ success: boolean; message: string; verifiedAt?: string }>;
  logout: () => void;
  updateProfile: (fullName: string, phone: string) => { success: boolean; message: string; phoneChanged?: boolean };
  changePassword: () => { success: boolean; message: string };

  // Data collections
  users: User[];
  areas: ParkingArea[];
  slots: ParkingSlot[];
  vehicles: Vehicle[];
  bookings: Booking[];
  payments: Payment[];

  // User Actions - Vehicles
  userVehicles: Vehicle[];
  activeVehicle: Vehicle | null;
  addVehicle: (vehicleNumber: string, vehicleType: 'Car' | 'Motorcycle', brand: string, model: string) => { success: boolean; message: string };
  editVehicle: (vehicleId: number, brand: string, model: string, status: 'Active' | 'Inactive') => { success: boolean; message: string };
  deleteVehicle: (vehicleId: number) => { success: boolean; message: string };
  setActiveVehicle: (vehicleId: number) => void;

  // Search & Availability Checking
  isSlotAvailable: (slotId: number, dateStr: string, timeStr: string, durationHours: number) => boolean;
  searchSlots: (areaId: number, vehicleType: 'Car' | 'Motorcycle', dateStr: string, timeStr: string, durationHours: number, bookingType?: 'hourly' | 'full_day') => SlotSearchResult[];
  getSuggestedTimes: (
    areaId: number,
    vehicleType: 'Car' | 'Motorcycle' | 'All',
    dateStr: string,
    timeStr: string,
    durationHours: number,
    bookingType?: 'hourly' | 'full_day'
  ) => SuggestedTimeSlot[];
  fetchSlotAvailability: (
    params: {
      areaId: number;
      vehicleType: 'Car' | 'Motorcycle' | 'All';
      dateStr: string;
      timeStr: string;
      durationHours: number;
      bookingType?: 'hourly' | 'full_day';
    },
    onProgress?: (percent: number, stage: string) => void
  ) => Promise<{
    slots: SlotSearchResult[];
    suggestedTimes: SuggestedTimeSlot[];
  }>;
  fetchNextAvailableSlotsForArea: (params: {
    areaId: number;
    vehicleType: 'Car' | 'Motorcycle' | 'All';
    dateStr: string;
    timeStr: string;
    durationHours: number;
    bookingType?: 'hourly' | 'full_day';
  }) => Promise<SuggestedTimeSlot[]>;
  refreshLiveData: () => Promise<{ syncedAt: string }>;

  // Bookings & Payments
  createBooking: (slotId: number, vehicleId: number, dateStr: string, timeStr: string, durationHours: number, bookingType?: 'hourly' | 'full_day') => { success: boolean; message: string; bookingId?: number; priceTotal?: number };
  cancelBooking: (bookingId: number) => { success: boolean; message: string };
  processPayment: (bookingId: number, method: PaymentMethod) => { success: boolean; message: string };
  checkInWithQr: (
    qrPayload: string,
    preferredBookingId?: number
  ) => Promise<{
    success: boolean;
    message: string;
    booking?: Booking;
    slot?: ParkingSlot;
    area?: ParkingArea;
    alreadyCheckedIn?: boolean;
  }>;

  // Admin Actions
  toggleUserStatus: (userId: number, newStatus: 'Active' | 'Blocked') => { success: boolean; message: string };
  addArea: (areaName: string, location: string, status?: 'Active' | 'Inactive') => { success: boolean; message: string };
  updateArea: (areaId: number, areaName: string, location: string, status: 'Active' | 'Inactive') => { success: boolean; message: string };
  addSlot: (areaId: number, slotNumber: string, vehicleType: 'Car' | 'Motorcycle', pricePerHour: number, status?: 'Available' | 'Booked' | 'Occupied', dayPrice?: number) => { success: boolean; message: string };
  updateSlot: (slotId: number, pricePerHour: number, status: 'Available' | 'Booked' | 'Occupied', areaId?: number, slotNumber?: string, vehicleType?: 'Car' | 'Motorcycle', dayPrice?: number) => { success: boolean; message: string };
  adminCancelBooking: (bookingId: number) => { success: boolean; message: string };

  // Cookie Consent
  cookieConsent: 'pending' | 'accepted' | 'declined';
  setCookieConsentState: (status: 'accepted' | 'declined') => void;

  // Reset
  resetDatabase: () => void;
}

const ParkEaseContext = createContext<ParkEaseContextType | undefined>(undefined);

const normalizeLoadedUser = (u: User): User => {
  if (typeof u.phone_verified === 'boolean') return u;
  // Seeded demo users (1..3) default to verified; others require explicit verification
  const isPreset = INITIAL_USERS.some(seed => seed.user_id === u.user_id && seed.email === u.email);
  return {
    ...u,
    phone_verified: isPreset,
    phone_verified_at: isPreset ? u.created_at : undefined
  };
};

const isValidMobilePhone = (phone: string): boolean => {
  const cleaned = phone.replace(/[\s()-]/g, '').trim();
  return /^(?:(?:\+?88)?01[3-9]\d{8}|\+[1-9]\d{9,14})$/.test(cleaned);
};

const SLOT_SYNC_CHANNEL = 'parkease_realtime_slots';
const SLOT_SEED_VERSION = '130_cm_v1';

const normalizeAreaLocation = (area: ParkingArea): ParkingArea => {
  if (area.area_name === 'Agrabad' && area.location.includes('Agrabad Commercial Area')) {
    return {
      ...area,
      location: area.location.replace('Agrabad Commercial Area', 'Agrabad')
    };
  }
  if (area.area_name === 'Bahaddarhat' && area.location.includes('Bahaddarhat Bus Terminal Area')) {
    return {
      ...area,
      location: area.location.replace('Bahaddarhat Bus Terminal Area', 'Bahaddarhat Area')
    };
  }
  return area;
};

const isLegacySlotDataset = (slotList: ParkingSlot[]): boolean => {
  if (slotList.length === 0) return false;
  return slotList.some((s) => /^(G|A|K|B|P|CH)-\d+$/i.test(s.slot_number));
};

const isStaleFullSlotSeed = (slotList: ParkingSlot[]): boolean => {
  if (!Array.isArray(slotList) || slotList.length === 0) return true;
  // Reset any legacy pre-130 seed caches (such as the old 22-slot or 23-slot datasets)
  if (slotList.length <= 30) return true;
  return isLegacySlotDataset(slotList);
};

const mergeSlotsWithUpdates = (
  baseSlots: ParkingSlot[],
  incomingSlots: ParkingSlot[]
): ParkingSlot[] => {
  if (incomingSlots.length === 0 || isLegacySlotDataset(incomingSlots)) return baseSlots;
  const incomingById = new Map<number, ParkingSlot>();
  for (const s of incomingSlots) {
    incomingById.set(s.slot_id, s);
  }
  const merged = baseSlots.map((existing) => incomingById.get(existing.slot_id) ?? existing);
  const existingIds = new Set(baseSlots.map((s) => s.slot_id));
  for (const s of incomingSlots) {
    if (!existingIds.has(s.slot_id)) {
      merged.push(s);
    }
  }
  return merged;
};

interface ParsedParkEaseQr {
  valid: boolean;
  areaId?: number;
  slotId?: number;
  slotNumber?: string;
  areaName?: string;
}

const parseParkEaseQrPayload = (rawInput: string): ParsedParkEaseQr => {
  const raw = rawInput.trim();
  if (!raw) return { valid: false };

  // 1. JSON format: {"system":"ParkEase","area_id":1,"slot_id":2,"slot_number":"C-02"}
  if (raw.startsWith('{') && raw.endsWith('}')) {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const sys = String(parsed.system || parsed.app || '').toLowerCase();
      if (sys && sys !== 'parkease') {
        return { valid: false };
      }
      const areaId = parsed.area_id !== undefined ? Number(parsed.area_id) : undefined;
      const slotId = parsed.slot_id !== undefined ? Number(parsed.slot_id) : undefined;
      const slotNumber = parsed.slot_number ? String(parsed.slot_number).trim().toUpperCase() : undefined;
      const areaName = parsed.area_name ? String(parsed.area_name).trim() : undefined;
      if ((areaId && !isNaN(areaId)) || (slotId && !isNaN(slotId)) || slotNumber || areaName) {
        return {
          valid: true,
          areaId: areaId && !isNaN(areaId) ? areaId : undefined,
          slotId: slotId && !isNaN(slotId) ? slotId : undefined,
          slotNumber,
          areaName
        };
      }
    } catch {
      return { valid: false };
    }
  }

  // 2. Pipe / delimited gate pass format: PARKEASE|AREA:1|SLOT:C-01
  if (raw.toUpperCase().startsWith('PARKEASE')) {
    const parts = raw.split('|').slice(1);
    let areaId: number | undefined;
    let slotId: number | undefined;
    let slotNumber: string | undefined;

    for (const part of parts) {
      const [kRaw, vRaw] = part.split(':');
      if (!kRaw || !vRaw) continue;
      const key = kRaw.trim().toUpperCase();
      const val = vRaw.trim();
      if (key === 'AREA' || key === 'AREA_ID') {
        const num = Number(val);
        if (!isNaN(num)) areaId = num;
      } else if (key === 'SLOT_ID') {
        const num = Number(val);
        if (!isNaN(num)) slotId = num;
      } else if (key === 'SLOT' || key === 'BAY') {
        slotNumber = val.toUpperCase();
      }
    }

    if (areaId || slotId || slotNumber) {
      return { valid: true, areaId, slotId, slotNumber };
    }
  }

  // 3. URL format: parkease://checkin?area_id=1&slot=C-01 or https://.../checkin?area_id=1
  if (raw.includes('?') || raw.toLowerCase().startsWith('parkease://')) {
    try {
      const normalizedUrl = raw.startsWith('parkease://')
        ? raw.replace('parkease://', 'https://parkease.local/')
        : raw;
      const url = new URL(normalizedUrl);
      const areaParam = url.searchParams.get('area_id');
      const slotIdParam = url.searchParams.get('slot_id');
      const slotParam = url.searchParams.get('slot') || url.searchParams.get('slot_number');
      const areaId = areaParam ? Number(areaParam) : undefined;
      const slotId = slotIdParam ? Number(slotIdParam) : undefined;
      const slotNumber = slotParam ? slotParam.trim().toUpperCase() : undefined;
      if ((areaId && !isNaN(areaId)) || (slotId && !isNaN(slotId)) || slotNumber) {
        return {
          valid: true,
          areaId: areaId && !isNaN(areaId) ? areaId : undefined,
          slotId: slotId && !isNaN(slotId) ? slotId : undefined,
          slotNumber
        };
      }
    } catch {
      return { valid: false };
    }
  }

  return { valid: false };
};

export const ParkEaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage or initial seed
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('pe_users');
    const parsed: User[] = saved ? JSON.parse(saved) : INITIAL_USERS;
    return parsed.map(normalizeLoadedUser);
  });

  const [areas, setAreas] = useState<ParkingArea[]>(() => {
    const saved = localStorage.getItem('pe_areas');
    if (!saved) return INITIAL_AREAS;
    const parsed = JSON.parse(saved) as ParkingArea[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed.map(normalizeAreaLocation)
      : INITIAL_AREAS;
  });

  const [slots, setSlots] = useState<ParkingSlot[]>(() => {
    const currentSeedVer = localStorage.getItem('pe_seed_version');
    const saved = localStorage.getItem('pe_slots');
    if (!saved || currentSeedVer !== SLOT_SEED_VERSION) {
      localStorage.setItem('pe_seed_version', SLOT_SEED_VERSION);
      return INITIAL_SLOTS;
    }
    const parsed: ParkingSlot[] = JSON.parse(saved);
    if (isStaleFullSlotSeed(parsed)) {
      return INITIAL_SLOTS;
    }
    // Upgrade saved slots lacking day_price
    return parsed.map((s) => {
      const hasDayPrice = typeof s.day_price === 'number' && s.day_price > 0;
      if (hasDayPrice) return s;
      return {
        ...s,
        price_per_hour: s.vehicle_type === 'Car' ? 250 : 100,
        day_price: s.vehicle_type === 'Car' ? 2000 : 1000
      };
    });
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem('pe_vehicles');
    return saved ? JSON.parse(saved) : INITIAL_VEHICLES;
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('pe_bookings');
    if (!saved) return INITIAL_BOOKINGS;
    const parsed: Booking[] = JSON.parse(saved);
    return parsed.map((b) =>
      b.booking_id === 2 && b.vehicle_id === 2 && b.slot_id === 4
        ? { ...b, slot_id: 21 }
        : b
    );
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem('pe_payments');
    return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('pe_current_user');
    return saved ? normalizeLoadedUser(JSON.parse(saved)) : null;
  });

  const [cookieConsent, setCookieConsent] = useState<'pending' | 'accepted' | 'declined'>(() => {
    const saved = localStorage.getItem('pe_cookie_consent');
    return (saved as 'accepted' | 'declined') || 'pending';
  });

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('pe_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('pe_areas', JSON.stringify(areas));
  }, [areas]);

  useEffect(() => {
    localStorage.setItem('pe_slots', JSON.stringify(slots));
  }, [slots]);

  useEffect(() => {
    localStorage.setItem('pe_vehicles', JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    localStorage.setItem('pe_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('pe_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('pe_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('pe_current_user');
    }
  }, [currentUser]);

  // Cross-tab real-time synchronization for active browser sessions
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      channel = new BroadcastChannel(SLOT_SYNC_CHANNEL);
      channel.onmessage = (event: MessageEvent) => {
        const msg = event.data as
          | { type: 'SLOT_UPDATE'; slot: ParkingSlot }
          | { type: 'BOOKING_CHECKIN'; bookingId: number; checkedInAt: string }
          | undefined;
        if (!msg) return;
        if (msg.type === 'SLOT_UPDATE' && msg.slot) {
          setSlots((prev) => mergeSlotsWithUpdates(prev, [msg.slot]));
        } else if (msg.type === 'BOOKING_CHECKIN') {
          setBookings((prev) =>
            prev.map((b) =>
              b.booking_id === msg.bookingId ? { ...b, checked_in_at: msg.checkedInAt } : b
            )
          );
        }
      };
    }

    const handleStorageSync = (e: StorageEvent) => {
      if (e.key === 'pe_slots' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as ParkingSlot[];
          if (Array.isArray(parsed) && !isStaleFullSlotSeed(parsed)) {
            setSlots(parsed);
          }
        } catch {
          // Ignore malformed storage payload
        }
      } else if (e.key === 'pe_bookings' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as Booking[];
          if (Array.isArray(parsed)) setBookings(parsed);
        } catch {
          // Ignore malformed storage payload
        }
      }
    };

    window.addEventListener('storage', handleStorageSync);
    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorageSync);
    };
  }, []);

  // Broadcast slot status updates across open tabs (Flask handles Firestore writes)
  const syncSlotToCloudAndBroadcast = async (slot: ParkingSlot): Promise<void> => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel(SLOT_SYNC_CHANNEL);
        channel.postMessage({ type: 'SLOT_UPDATE', slot });
        channel.close();
      } catch {
        // Ignore BroadcastChannel unavailability
      }
    }
  };

  // Auth Operations
  const login = (email: string, role?: 'user' | 'admin'): { success: boolean; message: string } => {
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return { success: false, message: 'Invalid credentials. User with this email was not found.' };
    }

    if (user.status === 'Blocked') {
      return { success: false, message: 'Your account is blocked. Please contact support.' };
    }

    if (role && user.role !== role) {
      return { success: false, message: `Access denied. Account is not registered as ${role}.` };
    }

    setCurrentUser(user);
    return { success: true, message: `Welcome back, ${user.full_name}!` };
  };

  // Sync verified backend demo session into React user state
  const completeDemoSession = (account: {
    user_id: number;
    full_name: string;
    email: string;
    role: 'user' | 'admin';
  }) => {
    const cleanEmail = account.email.trim().toLowerCase();
    const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      const updatedUser: User = {
        ...existing,
        user_id: account.user_id || existing.user_id,
        full_name: account.full_name || existing.full_name,
        role: account.role,
        status: 'Active'
      };
      setUsers((prev) => prev.map((u) => (u.email.toLowerCase() === cleanEmail ? updatedUser : u)));
      setCurrentUser(updatedUser);
      return;
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const createdUser: User = {
      user_id: account.user_id,
      full_name: account.full_name,
      email: cleanEmail,
      phone: '',
      phone_verified: true,
      phone_verified_at: now,
      role: account.role,
      status: 'Active',
      created_at: now
    };
    setUsers((prev) => [...prev, createdUser]);
    setCurrentUser(createdUser);
  };

  const register = (
    fullName: string,
    email: string,
    phone: string,
    consent: boolean,
    optionalVehicle?: OptionalVehicleInput
  ): { success: boolean; message: string; user?: User } => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();
    const cleanPhone = phone.replace(/[\s()-]/g, '').trim();

    if (!cleanName || !cleanEmail || !cleanPhone) {
      return { success: false, message: 'All registration fields are required.' };
    }

    if (!isValidMobilePhone(cleanPhone)) {
      return { success: false, message: 'Enter a valid mobile number (e.g. 018XXXXXXXX).' };
    }

    // Legal requirement G3: Check consent checkbox
    if (!consent) {
      return { success: false, message: 'You must agree to the Terms & Conditions and Privacy Policy.' };
    }

    const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { success: false, message: 'An account with this email is already registered.' };
    }

    let pendingVehicle: Vehicle | null = null;
    if (optionalVehicle) {
      const cleanPlate = optionalVehicle.vehicleNumber.trim().toUpperCase();
      const cleanBrand = optionalVehicle.brand.trim();
      const cleanModel = optionalVehicle.model.trim();
      if (cleanPlate || cleanBrand || cleanModel) {
        if (!cleanPlate || !cleanBrand || !cleanModel) {
          return {
            success: false,
            message: 'Complete License Plate, Brand, and Model to add a vehicle, or leave all three blank.'
          };
        }
        if (vehicles.some(v => v.vehicle_number.toUpperCase() === cleanPlate)) {
          return {
            success: false,
            message: 'A vehicle with this license plate number already exists in the system.'
          };
        }
        const newVehicleId = vehicles.length > 0 ? Math.max(...vehicles.map(v => v.vehicle_id)) + 1 : 1;
        const nowVeh = new Date().toISOString().replace('T', ' ').substring(0, 19);
        pendingVehicle = {
          vehicle_id: newVehicleId,
          user_id: users.length > 0 ? Math.max(...users.map(u => u.user_id)) + 1 : 1,
          vehicle_number: cleanPlate,
          vehicle_type: optionalVehicle.vehicleType,
          brand: cleanBrand,
          model: cleanModel,
          status: 'Active',
          is_active_selection: true,
          created_at: nowVeh
        };
      }
    }

    const newId = users.length > 0 ? Math.max(...users.map(u => u.user_id)) + 1 : 1;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newUser: User = {
      user_id: newId,
      full_name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      phone_verified: false,
      role: 'user',
      status: 'Active',
      created_at: now
    };

    setUsers(prev => [...prev, newUser]);
    if (pendingVehicle) {
      setVehicles(prev => [...prev, { ...pendingVehicle, user_id: newId }]);
    }
    setCurrentUser(newUser);
    return {
      success: true,
      message: 'Account created. Complete SMS OTP verification to enable parking bookings.',
      user: newUser
    };
  };

  // Request SMS OTP for mobile verification
  const sendPhoneOtp = async (phone: string): Promise<OtpSendResponse> => {
    const cleanPhone = phone.replace(/[\s()-]/g, '').trim();
    if (!isValidMobilePhone(cleanPhone)) {
      return {
        success: false,
        message: 'Enter a valid mobile number (e.g. 018XXXXXXXX or +88018XXXXXXXX).'
      };
    }

    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          message: data.error || 'Failed to send verification code.',
          retryAfterSeconds: data.retryAfterSeconds
        };
      }

      return {
        success: true,
        message: `6-digit SMS verification code sent to ${data.maskedPhone}.`,
        maskedPhone: data.maskedPhone,
        expiresInSeconds: data.expiresInSeconds,
        resendCooldownSeconds: data.resendCooldownSeconds,
        deliveryMode: data.deliveryMode,
        sandboxOtp: data.sandboxOtp
      };
    } catch {
      return {
        success: false,
        message: 'Network error while requesting SMS verification code.'
      };
    }
  };

  // Verify 6-digit SMS OTP and persist verification state
  const verifyPhoneOtp = async (
    phone: string,
    code: string
  ): Promise<{ success: boolean; message: string; verifiedAt?: string }> => {
    const cleanPhone = phone.replace(/[\s()-]/g, '').trim();
    const cleanCode = code.replace(/\s+/g, '').trim();

    if (!/^\d{6}$/.test(cleanCode)) {
      return { success: false, message: 'Enter the 6-digit numeric verification code.' };
    }

    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, code: cleanCode })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          success: false,
          message: data.error || 'Verification failed. Check the code and try again.'
        };
      }

      const verifiedAt = String(data.verifiedAt || new Date().toISOString().replace('T', ' ').substring(0, 19));

      if (currentUser) {
        const updatedUser: User = {
          ...currentUser,
          phone: cleanPhone,
          phone_verified: true,
          phone_verified_at: verifiedAt
        };
        setCurrentUser(updatedUser);
        setUsers(prev => prev.map(u => (u.user_id === currentUser.user_id ? updatedUser : u)));
      }

      return {
        success: true,
        message: 'Mobile phone confirmed. Your account is now cleared for reservations.',
        verifiedAt
      };
    } catch {
      return {
        success: false,
        message: 'Network error while verifying OTP code.'
      };
    }
  };

  // Firebase Google Sign-In (Auth only; browser never calls Firestore directly)
  const loginWithGoogle = async (): Promise<{ success: boolean; message: string; role?: 'user' | 'admin' }> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const email = (fbUser.email || '').toLowerCase();
      const displayName = fbUser.displayName || 'Google Driver';

      const isAdminEmail = email === 'admin@parkease.com' || email === 'pritom20054@gmail.com';
      const existing = users.find(u => u.email.toLowerCase() === email);

      let appUser: User;
      if (existing) {
        appUser = existing;
      } else {
        const newId = users.length > 0 ? Math.max(...users.map(u => u.user_id)) + 1 : 1;
        const hasConfirmedFbPhone = Boolean(fbUser.phoneNumber);
        appUser = {
          user_id: newId,
          full_name: displayName,
          email,
          phone: fbUser.phoneNumber || '01700000000',
          phone_verified: hasConfirmedFbPhone,
          role: isAdminEmail ? 'admin' : 'user',
          status: 'Active',
          created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
        setUsers(prev => [...prev, appUser]);
      }

      setCurrentUser(appUser);
      return {
        success: true,
        message: `Signed in with Google as ${appUser.full_name}`,
        role: appUser.role
      };
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      return {
        success: false,
        message: err.message || 'Google Sign-in failed. Please try again.'
      };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    fbSignOut(auth).catch(() => {});
  };

  const updateProfile = (fullName: string, phone: string): { success: boolean; message: string; phoneChanged?: boolean } => {
    if (!currentUser) return { success: false, message: 'Not logged in.' };
    const cleanName = fullName.trim();
    const cleanPhone = phone.replace(/[\s()-]/g, '').trim();

    if (!cleanName || !cleanPhone) {
      return { success: false, message: 'Full name and phone cannot be empty.' };
    }

    if (!isValidMobilePhone(cleanPhone)) {
      return { success: false, message: 'Enter a valid mobile number (e.g. 018XXXXXXXX).' };
    }

    const phoneChanged = cleanPhone !== currentUser.phone.replace(/[\s()-]/g, '').trim();
    const updatedUser: User = {
      ...currentUser,
      full_name: cleanName,
      phone: cleanPhone,
      phone_verified: phoneChanged ? false : Boolean(currentUser.phone_verified),
      phone_verified_at: phoneChanged ? undefined : currentUser.phone_verified_at
    };
    setUsers(prev => prev.map(u => u.user_id === currentUser.user_id ? updatedUser : u));
    setCurrentUser(updatedUser);
    return {
      success: true,
      phoneChanged,
      message: phoneChanged
        ? 'Profile updated. Verify your new mobile number via SMS OTP to keep booking enabled.'
        : 'Profile updated successfully.'
    };
  };

  const changePassword = (): { success: boolean; message: string } => {
    return { success: true, message: 'Password updated successfully.' };
  };

  // User Vehicles
  const userVehicles = currentUser ? vehicles.filter(v => v.user_id === currentUser.user_id) : [];
  const activeVehicle = userVehicles.find(v => v.is_active_selection) || userVehicles[0] || null;

  const addVehicle = (vehicleNumber: string, vehicleType: 'Car' | 'Motorcycle', brand: string, model: string): { success: boolean; message: string } => {
    if (!currentUser) return { success: false, message: 'Please log in to add a vehicle.' };

    const cleanNumber = vehicleNumber.trim().toUpperCase();
    const cleanBrand = brand.trim();
    const cleanModel = model.trim();

    if (!cleanNumber || !cleanBrand || !cleanModel) {
      return { success: false, message: 'Please provide all vehicle details.' };
    }

    // Check unique vehicle number
    if (vehicles.some(v => v.vehicle_number.toUpperCase() === cleanNumber)) {
      return { success: false, message: 'A vehicle with this license plate number already exists in the system.' };
    }

    const newId = vehicles.length > 0 ? Math.max(...vehicles.map(v => v.vehicle_id)) + 1 : 1;
    const isFirst = userVehicles.length === 0;

    const newVehicle: Vehicle = {
      vehicle_id: newId,
      user_id: currentUser.user_id,
      vehicle_number: cleanNumber,
      vehicle_type: vehicleType,
      brand: cleanBrand,
      model: cleanModel,
      status: 'Active',
      is_active_selection: isFirst,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    setVehicles(prev => [...prev, newVehicle]);
    return { success: true, message: 'Vehicle added successfully.' };
  };

  const editVehicle = (vehicleId: number, brand: string, model: string, status: 'Active' | 'Inactive'): { success: boolean; message: string } => {
    if (!currentUser) return { success: false, message: 'Not authenticated.' };

    const cleanBrand = brand.trim();
    const cleanModel = model.trim();

    if (!cleanBrand || !cleanModel) {
      return { success: false, message: 'Brand and model cannot be empty.' };
    }

    setVehicles(prev => prev.map(v => {
      if (v.vehicle_id === vehicleId && v.user_id === currentUser.user_id) {
        return { ...v, brand: cleanBrand, model: cleanModel, status };
      }
      return v;
    }));

    return { success: true, message: 'Vehicle details saved.' };
  };

  const deleteVehicle = (vehicleId: number): { success: boolean; message: string } => {
    if (!currentUser) return { success: false, message: 'Not authenticated.' };

    // Check for active upcoming booking
    const hasActiveBooking = bookings.some(b => b.vehicle_id === vehicleId && b.booking_status === 'Confirmed');
    if (hasActiveBooking) {
      return { success: false, message: 'Cannot delete a vehicle that has an active upcoming booking.' };
    }

    setVehicles(prev => prev.filter(v => !(v.vehicle_id === vehicleId && v.user_id === currentUser.user_id)));
    return { success: true, message: 'Vehicle deleted.' };
  };

  const setActiveVehicle = (vehicleId: number) => {
    if (!currentUser) return;
    setVehicles(prev => prev.map(v => {
      if (v.user_id === currentUser.user_id) {
        return { ...v, is_active_selection: v.vehicle_id === vehicleId };
      }
      return v;
    }));
  };

  // Helper for Overlap Detection
  const isSlotAvailable = (slotId: number, dateStr: string, timeStr: string, durationHours: number): boolean => {
    const slot = slots.find(s => s.slot_id === slotId);
    if (!slot || slot.status !== 'Available') return false;

    // Convert time string "HH:MM" to minutes
    const [reqHour, reqMin] = timeStr.split(':').map(Number);
    if (isNaN(reqHour) || isNaN(reqMin)) return false;

    const startMinutes = reqHour * 60 + reqMin;
    const endMinutes = startMinutes + durationHours * 60;

    // Confirmed bookings on that date
    const slotBookings = bookings.filter(b => b.slot_id === slotId && b.booking_date === dateStr && b.booking_status === 'Confirmed');

    for (const b of slotBookings) {
      const [bHour, bMin] = b.booking_time.split(':').map(Number);
      const bStartMinutes = bHour * 60 + (bMin || 0);
      const bEndMinutes = bStartMinutes + b.duration_hours * 60;

      // Overlap formula: (startA < endB) and (endA > startB)
      if (startMinutes < bEndMinutes && endMinutes > bStartMinutes) {
        return false;
      }
    }

    return true;
  };

  const searchSlots = (
    areaId: number,
    vehicleType: 'Car' | 'Motorcycle',
    dateStr: string,
    timeStr: string,
    durationHours: number,
    bookingType: 'hourly' | 'full_day' = 'hourly'
  ): SlotSearchResult[] => {
    const area = areas.find(a => a.area_id === areaId);
    if (!area || area.status !== 'Active') return [];

    const effectiveHours = bookingType === 'full_day' ? 24 : durationHours;
    const matchingSlots = slots.filter(s => s.area_id === areaId && s.vehicle_type === vehicleType);

    const available: SlotSearchResult[] = [];
    for (const slot of matchingSlots) {
      if (isSlotAvailable(slot.slot_id, dateStr, timeStr, effectiveHours)) {
        available.push({
          ...slot,
          area_name: area.area_name,
          location: area.location,
          calculated_total: bookingType === 'full_day' ? slot.day_price : slot.price_per_hour * effectiveHours
        });
      }
    }

    return available;
  };

  // Compute historical next-available time windows for a parking area
  const computeSuggestedTimesInternal = (
    areaId: number,
    vehicleType: 'Car' | 'Motorcycle' | 'All',
    dateStr: string,
    timeStr: string,
    durationHours: number,
    bookingType: 'hourly' | 'full_day',
    sourceAreas: ParkingArea[],
    sourceSlots: ParkingSlot[],
    sourceBookings: Booking[]
  ): SuggestedTimeSlot[] => {
    const area = sourceAreas.find(a => a.area_id === areaId);
    if (!area || area.status !== 'Active') return [];

    const effectiveHours = bookingType === 'full_day' ? 24 : Math.max(1, durationHours);
    const matchingSlots = sourceSlots.filter(
      s => s.area_id === areaId && (vehicleType === 'All' || s.vehicle_type === vehicleType)
    );
    if (matchingSlots.length === 0) return [];

    // Build hour-by-hour demand profile from historical bookings in this area + system baseline
    const areaSlotIds = new Set(sourceSlots.filter(s => s.area_id === areaId).map(s => s.slot_id));
    const areaBookings = sourceBookings.filter(
      b => areaSlotIds.has(b.slot_id) && b.booking_status !== 'Cancelled'
    );
    const systemBookings = sourceBookings.filter(b => b.booking_status !== 'Cancelled');

    const hourlyHits = new Array<number>(24).fill(0);
    const relevantHistory = areaBookings.length > 0 ? areaBookings : systemBookings;

    for (const b of relevantHistory) {
      const [h] = b.booking_time.split(':').map(Number);
      if (isNaN(h)) continue;
      const dur = Math.max(1, Math.min(24, b.duration_hours || 1));
      for (let offset = 0; offset < dur; offset++) {
        hourlyHits[(h + offset) % 24] += 1;
      }
    }

    const maxHits = Math.max(1, ...hourlyHits);
    const getDemandPct = (hour: number): number => {
      const recordRatio = hourlyHits[hour] / maxHits;
      // Combine recorded booking hits with realistic Chattogram daytime peak pattern
      const daytimeBaseline =
        hour >= 9 && hour <= 13 ? 42 : hour >= 16 && hour <= 20 ? 48 : hour >= 6 && hour <= 8 ? 22 : 14;
      const pct = Math.round(
        relevantHistory.length > 0 ? recordRatio * 65 + daytimeBaseline * 0.35 : daytimeBaseline
      );
      return Math.max(8, Math.min(95, pct));
    };

    const checkSlotFreeOnSource = (slot: ParkingSlot, candDate: string, candTime: string): boolean => {
      if (slot.status !== 'Available') return false;
      const [reqHour, reqMin] = candTime.split(':').map(Number);
      if (isNaN(reqHour) || isNaN(reqMin)) return false;
      const startMinutes = reqHour * 60 + reqMin;
      const endMinutes = startMinutes + effectiveHours * 60;

      const slotBookings = sourceBookings.filter(
        b => b.slot_id === slot.slot_id && b.booking_date === candDate && b.booking_status === 'Confirmed'
      );
      for (const b of slotBookings) {
        const [bHour, bMin] = b.booking_time.split(':').map(Number);
        const bStartMinutes = bHour * 60 + (bMin || 0);
        const bEndMinutes = bStartMinutes + b.duration_hours * 60;
        if (startMinutes < bEndMinutes && endMinutes > bStartMinutes) {
          return false;
        }
      }
      return true;
    };

    const [baseYear, baseMonth, baseDay] = dateStr.split('-').map(Number);
    const [baseHour, baseMin] = timeStr.split(':').map(Number);
    const baseDt = new Date(
      isNaN(baseYear) ? new Date().getFullYear() : baseYear,
      isNaN(baseMonth) ? new Date().getMonth() : baseMonth - 1,
      isNaN(baseDay) ? new Date().getDate() : baseDay,
      isNaN(baseHour) ? 9 : baseHour,
      isNaN(baseMin) ? 0 : baseMin,
      0,
      0
    );

    const suggestions: SuggestedTimeSlot[] = [];
    const seenKeys = new Set<string>();

    // Pass 1: Scan upcoming 1..36 hours for confirmed conflict-free open slots
    for (let step = 1; step <= 36 && suggestions.length < 3; step++) {
      const candDt = new Date(baseDt.getTime() + step * 60 * 60 * 1000);
      const candYear = candDt.getFullYear();
      const candMonth = String(candDt.getMonth() + 1).padStart(2, '0');
      const candDay = String(candDt.getDate()).padStart(2, '0');
      const candDate = `${candYear}-${candMonth}-${candDay}`;
      const candHour = candDt.getHours();
      const candTime = `${String(candHour).padStart(2, '0')}:00`;
      const key = `${candDate}_${candTime}`;
      if (seenKeys.has(key)) continue;

      const openSlots: SlotSearchResult[] = matchingSlots
        .filter(s => checkSlotFreeOnSource(s, candDate, candTime))
        .map(slot => ({
          ...slot,
          area_name: area.area_name,
          location: area.location,
          calculated_total: bookingType === 'full_day' ? slot.day_price : slot.price_per_hour * effectiveHours
        }));

      if (openSlots.length > 0) {
        seenKeys.add(key);
        const demandPct = getDemandPct(candHour);
        const endsBookedSoon = areaBookings.some(b => {
          const [bh] = b.booking_time.split(':').map(Number);
          return b.booking_date === candDate && bh + b.duration_hours === candHour;
        });

        suggestions.push({
          date: candDate,
          time: candTime,
          durationHours: effectiveHours,
          availableCount: openSlots.length,
          slots: openSlots,
          historicalDemandPct: demandPct,
          historicalReason: endsBookedSoon
            ? `Prior reservation clears before ${candTime} (${demandPct}% historical demand)`
            : `${demandPct}% historical occupancy in ${area.area_name} around ${candTime}`
        });
      }
    }

    // Pass 2 fallback: if all matching slots in the area are temporarily Booked/Occupied,
    // recommend lowest-demand historical turnover hours (+2h, +4h, next morning)
    if (suggestions.length === 0) {
      const candidateOffsets = [2, 4, 8];
      for (const offset of candidateOffsets) {
        const candDt = new Date(baseDt.getTime() + offset * 60 * 60 * 1000);
        const candDate = `${candDt.getFullYear()}-${String(candDt.getMonth() + 1).padStart(2, '0')}-${String(candDt.getDate()).padStart(2, '0')}`;
        const candHour = candDt.getHours();
        const candTime = `${String(candHour).padStart(2, '0')}:00`;
        const demandPct = getDemandPct(candHour);

        suggestions.push({
          date: candDate,
          time: candTime,
          durationHours: effectiveHours,
          availableCount: matchingSlots.length,
          slots: matchingSlots.map(slot => ({
            ...slot,
            area_name: area.area_name,
            location: area.location,
            calculated_total: bookingType === 'full_day' ? slot.day_price : slot.price_per_hour * effectiveHours
          })),
          historicalDemandPct: demandPct,
          historicalReason: `Projected bay turnover from historical ${area.area_name} logs (${demandPct}% typical load)`,
          isProjectedTurnover: true
        });
      }
    }

    return suggestions;
  };

  const getSuggestedTimes = (
    areaId: number,
    vehicleType: 'Car' | 'Motorcycle' | 'All',
    dateStr: string,
    timeStr: string,
    durationHours: number,
    bookingType: 'hourly' | 'full_day' = 'hourly'
  ): SuggestedTimeSlot[] => {
    return computeSuggestedTimesInternal(
      areaId,
      vehicleType,
      dateStr,
      timeStr,
      durationHours,
      bookingType,
      areas,
      slots,
      bookings
    );
  };

  // Compute next available windows from active area inventory and current booking schedule
  const fetchNextAvailableSlotsForArea = async (params: {
    areaId: number;
    vehicleType: 'Car' | 'Motorcycle' | 'All';
    dateStr: string;
    timeStr: string;
    durationHours: number;
    bookingType?: 'hourly' | 'full_day';
  }): Promise<SuggestedTimeSlot[]> => {
    const areaIdNum = Number(params.areaId);
    const effectiveBookingType =
      params.bookingType || (params.durationHours === 24 ? 'full_day' : 'hourly');
    const effectiveHours =
      effectiveBookingType === 'full_day' ? 24 : Math.max(1, params.durationHours);

    return computeSuggestedTimesInternal(
      areaIdNum,
      params.vehicleType,
      params.dateStr,
      params.timeStr,
      effectiveHours,
      effectiveBookingType,
      areas,
      slots,
      bookings
    );
  };

  // Async availability fetch using Flask API (when active) plus live context with progress events
  const fetchSlotAvailability = async (
    params: {
      areaId: number;
      vehicleType: 'Car' | 'Motorcycle' | 'All';
      dateStr: string;
      timeStr: string;
      durationHours: number;
      bookingType?: 'hourly' | 'full_day';
    },
    onProgress?: (percent: number, stage: string) => void
  ): Promise<{ slots: SlotSearchResult[]; suggestedTimes: SuggestedTimeSlot[] }> => {
    const emit = (pct: number, stage: string) => {
      if (onProgress) onProgress(pct, stage);
    };
    const pauseTick = (ms: number) => new Promise(resolve => window.setTimeout(resolve, ms));

    const effectiveBookingType = params.bookingType || (params.durationHours === 24 ? 'full_day' : 'hourly');
    const effectiveHours = effectiveBookingType === 'full_day' ? 24 : Math.max(1, params.durationHours);

    emit(15, 'Connecting to backend...');
    let liveAreas = areas;
    const liveSlots = slots;
    const liveBookings = bookings;

    // 1. Refresh public parking areas from Flask /api/areas (backend reads Firestore)
    try {
      const areaRes = await fetch('/api/areas');
      if (areaRes.ok) {
        const contentType = areaRes.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const payload = (await areaRes.json()) as {
            success?: boolean;
            areas?: Array<{
              area_id?: number;
              area_name?: string;
              location?: string;
              status?: string;
              created_at?: string;
            }>;
          };
          if (payload.success && Array.isArray(payload.areas) && payload.areas.length > 0) {
            const fetchedAreas = payload.areas
              .map(a =>
                normalizeAreaLocation({
                  area_id: Number(a.area_id),
                  area_name: String(a.area_name || ''),
                  location: String(a.location || ''),
                  status: (a.status === 'Inactive' ? 'Inactive' : 'Active') as 'Active' | 'Inactive',
                  created_at: String(a.created_at || '')
                })
              )
              .filter(a => !isNaN(a.area_id) && Boolean(a.area_name));

            if (fetchedAreas.length > 0) {
              liveAreas = fetchedAreas;
              setAreas(fetchedAreas);
            }
          }
        }
      }
    } catch {
      // Ignore network errors when running in offline/local preview mode
    }

    emit(45, 'Fetching parking slot inventory...');
    await pauseTick(140);

    emit(72, 'Checking booking schedules...');
    await pauseTick(140);

    // Evaluate slot overlap for requested schedule
    const areaObj = liveAreas.find(a => a.area_id === Number(params.areaId));
    const availableResults: SlotSearchResult[] = [];

    if (areaObj && areaObj.status === 'Active') {
      const areaMatchingSlots = liveSlots.filter(
        s =>
          s.area_id === Number(params.areaId) &&
          (params.vehicleType === 'All' || s.vehicle_type === params.vehicleType)
      );

      const [reqHour, reqMin] = params.timeStr.split(':').map(Number);
      const startMinutes = !isNaN(reqHour) ? reqHour * 60 + (reqMin || 0) : 0;
      const endMinutes = startMinutes + effectiveHours * 60;

      for (const slot of areaMatchingSlots) {
        if (slot.status !== 'Available') continue;

        const conflicting = liveBookings.some(b => {
          if (b.slot_id !== slot.slot_id || b.booking_date !== params.dateStr || b.booking_status !== 'Confirmed') {
            return false;
          }
          const [bHour, bMin] = b.booking_time.split(':').map(Number);
          const bStart = bHour * 60 + (bMin || 0);
          const bEnd = bStart + b.duration_hours * 60;
          return startMinutes < bEnd && endMinutes > bStart;
        });

        if (!conflicting) {
          availableResults.push({
            ...slot,
            area_name: areaObj.area_name,
            location: areaObj.location,
            calculated_total:
              effectiveBookingType === 'full_day' ? slot.day_price : slot.price_per_hour * effectiveHours
          });
        }
      }
    }

    let suggestedTimes: SuggestedTimeSlot[] = [];
    if (availableResults.length === 0) {
      emit(88, 'Zero slots open; querying next available times...');
      suggestedTimes = await fetchNextAvailableSlotsForArea(params);
      if (suggestedTimes.length === 0) {
        suggestedTimes = computeSuggestedTimesInternal(
          Number(params.areaId),
          params.vehicleType,
          params.dateStr,
          params.timeStr,
          effectiveHours,
          effectiveBookingType,
          liveAreas,
          liveSlots,
          liveBookings
        );
      }
    } else {
      emit(90, 'Preparing available slots...');
      await pauseTick(100);
    }

    emit(100, 'Complete');
    return {
      slots: availableResults,
      suggestedTimes
    };
  };

  // Lightweight periodic live refresh for Admin Dashboard and User Find Parking
  const refreshLiveData = async (): Promise<{ syncedAt: string }> => {
    const syncLocalCollection = <T,>(
      storageKey: string,
      setter: React.Dispatch<React.SetStateAction<T[]>>
    ) => {
      try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return;
        const parsed = JSON.parse(raw) as T[];
        if (!Array.isArray(parsed)) return;
        const serialized = JSON.stringify(parsed);
        setter((prev) => (JSON.stringify(prev) === serialized ? prev : parsed));
      } catch {
        // Ignore storage parse failure
      }
    };

    // Sync cross-tab local state if another session updated records
    try {
      const rawAreas = localStorage.getItem('pe_areas');
      if (rawAreas) {
        const parsedAreas = JSON.parse(rawAreas) as ParkingArea[];
        if (Array.isArray(parsedAreas) && parsedAreas.length > 0) {
          const normalized = parsedAreas.map(normalizeAreaLocation);
          const serialized = JSON.stringify(normalized);
          setAreas((prev) => (JSON.stringify(prev) === serialized ? prev : normalized));
        }
      }
    } catch {
      // Ignore storage parse failure
    }
    try {
      const rawSlots = localStorage.getItem('pe_slots');
      if (rawSlots) {
        const parsedSlots = JSON.parse(rawSlots) as ParkingSlot[];
        if (!isStaleFullSlotSeed(parsedSlots)) {
          const serialized = JSON.stringify(parsedSlots);
          setSlots((prev) => (JSON.stringify(prev) === serialized ? prev : parsedSlots));
        }
      }
    } catch {
      // Ignore storage parse failure
    }
    syncLocalCollection<Booking>('pe_bookings', setBookings);
    syncLocalCollection<Payment>('pe_payments', setPayments);
    syncLocalCollection<Vehicle>('pe_vehicles', setVehicles);
    syncLocalCollection<User>('pe_users', setUsers);

    // Refresh public parking areas via Flask backend API (when Flask server is active)
    try {
      const resp = await fetch('/api/areas');
      if (resp.ok) {
        const contentType = resp.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const payload = (await resp.json()) as {
            success?: boolean;
            areas?: Array<{
              area_id?: number;
              area_name?: string;
              location?: string;
              status?: string;
              created_at?: string;
            }>;
          };
          if (payload.success && Array.isArray(payload.areas) && payload.areas.length > 0) {
            const fetchedAreas: ParkingArea[] = payload.areas
              .map((a) =>
                normalizeAreaLocation({
                  area_id: Number(a.area_id),
                  area_name: String(a.area_name || ''),
                  location: String(a.location || ''),
                  status: (a.status === 'Inactive' ? 'Inactive' : 'Active') as 'Active' | 'Inactive',
                  created_at: String(a.created_at || '')
                })
              )
              .filter((a) => !isNaN(a.area_id) && Boolean(a.area_name));

            if (fetchedAreas.length > 0) {
              setAreas((prev) =>
                JSON.stringify(prev) === JSON.stringify(fetchedAreas) ? prev : fetchedAreas
              );
            }
          }
        }
      }
    } catch {
      // Ignore network errors when running in offline/local preview mode
    }

    return {
      syncedAt: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
    };
  };

  // Create Booking
  const createBooking = (
    slotId: number,
    vehicleId: number,
    dateStr: string,
    timeStr: string,
    durationHours: number,
    bookingType: 'hourly' | 'full_day' = 'hourly'
  ): { success: boolean; message: string; bookingId?: number; priceTotal?: number } => {
    if (!currentUser) return { success: false, message: 'Please log in to book a parking slot.' };
    if (currentUser.status === 'Blocked') return { success: false, message: 'Account is blocked.' };
    if (!currentUser.phone_verified) {
      return {
        success: false,
        message: 'Mobile phone verification via SMS OTP is required before booking a parking slot.'
      };
    }

    const effectiveHours = bookingType === 'full_day' ? 24 : durationHours;
    if (effectiveHours < 1) {
      return { success: false, message: 'Duration must be at least 1 hour.' };
    }

    // 1. Own vehicle verification
    const vehicle = vehicles.find(v => v.vehicle_id === vehicleId && v.user_id === currentUser.user_id);
    if (!vehicle || vehicle.status !== 'Active') {
      return { success: false, message: 'You must select one of your own active registered vehicles.' };
    }

    // 2. Slot existence and vehicle type match
    const slot = slots.find(s => s.slot_id === slotId);
    if (!slot) return { success: false, message: 'Selected parking slot does not exist.' };

    if (slot.vehicle_type !== vehicle.vehicle_type) {
      return { success: false, message: `Vehicle mismatch: Slot is for ${slot.vehicle_type}, but chosen vehicle is ${vehicle.vehicle_type}.` };
    }

    // 3. Double-check overlap right before saving
    if (!isSlotAvailable(slotId, dateStr, timeStr, effectiveHours)) {
      return { success: false, message: 'This slot was just reserved by another user for the chosen time range. Please choose another slot.' };
    }

    // 4. Calculate price from slot rates (day_price for full day, price_per_hour * hours otherwise)
    const priceTotal = bookingType === 'full_day' ? slot.day_price : slot.price_per_hour * effectiveHours;
    const newBookingId = bookings.length > 0 ? Math.max(...bookings.map(b => b.booking_id)) + 1 : 1;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newBooking: Booking = {
      booking_id: newBookingId,
      user_id: currentUser.user_id,
      vehicle_id: vehicle.vehicle_id,
      slot_id: slot.slot_id,
      booking_date: dateStr,
      booking_time: timeStr,
      duration_hours: effectiveHours,
      price_total: priceTotal,
      payment_status: 'Pending',
      booking_status: 'Confirmed',
      created_at: now
    };

    setBookings(prev => [...prev, newBooking]);
    return { success: true, message: 'Booking reserved! Please proceed to payment.', bookingId: newBookingId, priceTotal };
  };

  const cancelBooking = (bookingId: number): { success: boolean; message: string } => {
    if (!currentUser) return { success: false, message: 'Not logged in.' };

    const booking = bookings.find(b => b.booking_id === bookingId && b.user_id === currentUser.user_id);
    if (!booking) return { success: false, message: 'Booking not found.' };

    if (booking.booking_status !== 'Confirmed') {
      return { success: false, message: `Cannot cancel a booking with status ${booking.booking_status}.` };
    }

    setBookings(prev => prev.map(b => b.booking_id === bookingId ? { ...b, booking_status: 'Cancelled' } : b));
    return { success: true, message: 'Booking cancelled successfully.' };
  };

  const processPayment = (bookingId: number, method: PaymentMethod): { success: boolean; message: string } => {
    if (!currentUser) return { success: false, message: 'Not logged in.' };

    const booking = bookings.find(b => b.booking_id === bookingId && b.user_id === currentUser.user_id);
    if (!booking) return { success: false, message: 'Booking not found.' };

    if (booking.payment_status === 'Paid') {
      return { success: false, message: 'Booking is already paid.' };
    }

    const newPaymentId = payments.length > 0 ? Math.max(...payments.map(p => p.payment_id)) + 1 : 1;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newPayment: Payment = {
      payment_id: newPaymentId,
      booking_id: bookingId,
      amount: booking.price_total,
      payment_method: method,
      payment_status: 'Paid',
      payment_date: now
    };

    setPayments(prev => [...prev, newPayment]);
    setBookings(prev => prev.map(b => b.booking_id === bookingId ? { ...b, payment_status: 'Paid' } : b));

    return { success: true, message: `Payment of BDT ${booking.price_total} confirmed via ${method}.` };
  };

  // QR Arrival Scan: scan parking area / bay QR upon arrival to mark slot 'Occupied' in real time
  const checkInWithQr = async (
    qrPayload: string,
    preferredBookingId?: number
  ): Promise<{
    success: boolean;
    message: string;
    booking?: Booking;
    slot?: ParkingSlot;
    area?: ParkingArea;
    alreadyCheckedIn?: boolean;
  }> => {
    if (!currentUser) {
      return { success: false, message: 'Please log in to confirm arrival at a parking area.' };
    }
    if (currentUser.status === 'Blocked') {
      return { success: false, message: 'Account is blocked.' };
    }

    const parsed = parseParkEaseQrPayload(qrPayload);
    if (!parsed.valid) {
      return {
        success: false,
        message: 'Unrecognized QR code. Scan an official ParkEase parking area or bay QR code.'
      };
    }

    // Resolve target slot if QR includes slot_id or slot_number
    let qrTargetSlot: ParkingSlot | undefined;
    if (parsed.slotId) {
      qrTargetSlot = slots.find((s) => s.slot_id === parsed.slotId);
    } else if (parsed.slotNumber) {
      qrTargetSlot = slots.find(
        (s) =>
          s.slot_number.toUpperCase() === parsed.slotNumber &&
          (!parsed.areaId || s.area_id === parsed.areaId)
      );
    }

    const resolvedAreaId = parsed.areaId ?? qrTargetSlot?.area_id;
    const area =
      (resolvedAreaId ? areas.find((a) => a.area_id === resolvedAreaId) : undefined) ||
      (parsed.areaName
        ? areas.find((a) => a.area_name.toLowerCase() === parsed.areaName?.toLowerCase())
        : undefined);

    if (!area) {
      return {
        success: false,
        message: 'The scanned QR code does not match any active ParkEase parking area.'
      };
    }

    if (area.status !== 'Active') {
      return {
        success: false,
        message: `${area.area_name} is currently inactive for arrival scanning.`
      };
    }

    const userConfirmedBookings = bookings.filter(
      (b) => b.user_id === currentUser.user_id && b.booking_status === 'Confirmed'
    );

    if (userConfirmedBookings.length === 0) {
      return {
        success: false,
        message: `You have no active Confirmed booking for arrival at ${area.area_name}.`
      };
    }

    // Find matching confirmed booking in this area (and specific slot if encoded)
    const areaSlotsById = new Map<number, ParkingSlot>();
    for (const s of slots) {
      if (s.area_id === area.area_id) {
        areaSlotsById.set(s.slot_id, s);
      }
    }

    const bookingsInArea = userConfirmedBookings.filter((b) => areaSlotsById.has(b.slot_id));

    if (bookingsInArea.length === 0) {
      return {
        success: false,
        message: `No active Confirmed booking found for ${area.area_name}. Check your reservation area before scanning.`
      };
    }

    let matchedBooking: Booking | undefined;
    if (preferredBookingId) {
      matchedBooking = bookingsInArea.find((b) => b.booking_id === preferredBookingId);
    }
    if (!matchedBooking && qrTargetSlot) {
      matchedBooking = bookingsInArea.find((b) => b.slot_id === qrTargetSlot.slot_id);
      if (!matchedBooking) {
        const assignedSlot = areaSlotsById.get(bookingsInArea[0].slot_id);
        return {
          success: false,
          message: `Scanned QR is for Slot ${qrTargetSlot.slot_number}, but your Confirmed booking #${bookingsInArea[0].booking_id} is assigned to Slot ${assignedSlot?.slot_number || 'another bay'} in ${area.area_name}.`
        };
      }
    }
    if (!matchedBooking) {
      // Prefer a confirmed booking not yet marked occupied
      matchedBooking =
        bookingsInArea.find((b) => !b.checked_in_at) || bookingsInArea[0];
    }

    const matchedSlot = areaSlotsById.get(matchedBooking.slot_id);
    if (!matchedSlot) {
      return { success: false, message: 'Assigned parking slot could not be located.' };
    }

    if (matchedBooking.checked_in_at && matchedSlot.status === 'Occupied') {
      return {
        success: true,
        alreadyCheckedIn: true,
        message: `Booking #${matchedBooking.booking_id} is already active at ${area.area_name} (Slot ${matchedSlot.slot_number} is Occupied).`,
        booking: matchedBooking,
        slot: matchedSlot,
        area
      };
    }

    if (matchedSlot.status === 'Occupied' && !matchedBooking.checked_in_at) {
      return {
        success: false,
        message: `Slot ${matchedSlot.slot_number} in ${area.area_name} is currently marked Occupied. Please contact the gate attendant.`
      };
    }

    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const updatedSlot: ParkingSlot = { ...matchedSlot, status: 'Occupied' };
    const updatedBooking: Booking = { ...matchedBooking, checked_in_at: nowTimestamp };

    setSlots((prev) =>
      prev.map((s) => (s.slot_id === updatedSlot.slot_id ? updatedSlot : s))
    );
    setBookings((prev) =>
      prev.map((b) => (b.booking_id === updatedBooking.booking_id ? updatedBooking : b))
    );

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel(SLOT_SYNC_CHANNEL);
        channel.postMessage({
          type: 'BOOKING_CHECKIN',
          bookingId: updatedBooking.booking_id,
          checkedInAt: nowTimestamp
        });
        channel.close();
      } catch {
        // Ignore BroadcastChannel unavailability
      }
    }

    await syncSlotToCloudAndBroadcast(updatedSlot);

    return {
      success: true,
      message: `Arrival confirmed at ${area.area_name}. Slot ${updatedSlot.slot_number} is now Occupied.`,
      booking: updatedBooking,
      slot: updatedSlot,
      area
    };
  };

  // Admin Actions
  const toggleUserStatus = (userId: number, newStatus: 'Active' | 'Blocked'): { success: boolean; message: string } => {
    setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, status: newStatus } : u));
    return { success: true, message: `User status set to ${newStatus}.` };
  };

  const addArea = (areaName: string, location: string, status: 'Active' | 'Inactive' = 'Active'): { success: boolean; message: string } => {
    const cleanName = areaName.trim();
    const cleanLoc = location.trim();
    if (!cleanName || !cleanLoc) return { success: false, message: 'Area name and location are required.' };

    if (areas.some(a => a.area_name.toLowerCase() === cleanName.toLowerCase())) {
      return { success: false, message: 'An area with this name already exists.' };
    }

    const newId = areas.length > 0 ? Math.max(...areas.map(a => a.area_id)) + 1 : 1;
    const newArea: ParkingArea = {
      area_id: newId,
      area_name: cleanName,
      location: cleanLoc,
      status,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    setAreas(prev => [...prev, newArea]);
    return { success: true, message: 'Parking area added.' };
  };

  const updateArea = (areaId: number, areaName: string, location: string, status: 'Active' | 'Inactive'): { success: boolean; message: string } => {
    const cleanName = areaName.trim();
    const cleanLoc = location.trim();
    if (!cleanName || !cleanLoc) return { success: false, message: 'Area name and location are required.' };

    // Prevent duplicate area names on edit
    if (areas.some(a => a.area_id !== areaId && a.area_name.toLowerCase() === cleanName.toLowerCase())) {
      return { success: false, message: 'An area with this name already exists.' };
    }

    setAreas(prev => prev.map(a => a.area_id === areaId ? { ...a, area_name: cleanName, location: cleanLoc, status } : a));
    return { success: true, message: 'Area updated successfully.' };
  };

  const addSlot = (
    areaId: number,
    slotNumber: string,
    vehicleType: 'Car' | 'Motorcycle',
    pricePerHour: number,
    status: 'Available' | 'Booked' | 'Occupied' = 'Available',
    dayPrice?: number
  ): { success: boolean; message: string } => {
    const cleanNum = slotNumber.trim().toUpperCase();
    const resolvedDayPrice = dayPrice !== undefined ? dayPrice : (vehicleType === 'Car' ? 2000 : 1000);
    if (!cleanNum || pricePerHour <= 0 || resolvedDayPrice <= 0) {
      return { success: false, message: 'Valid slot number and prices are required.' };
    }

    if (slots.some(s => s.area_id === areaId && s.slot_number.toUpperCase() === cleanNum)) {
      return { success: false, message: `Slot ${cleanNum} already exists in this area.` };
    }

    const newId = slots.length > 0 ? Math.max(...slots.map(s => s.slot_id)) + 1 : 1;
    const newSlot: ParkingSlot = {
      slot_id: newId,
      area_id: areaId,
      slot_number: cleanNum,
      vehicle_type: vehicleType,
      price_per_hour: pricePerHour,
      day_price: resolvedDayPrice,
      status,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    setSlots(prev => [...prev, newSlot]);
    void syncSlotToCloudAndBroadcast(newSlot);
    return { success: true, message: `Slot ${cleanNum} created.` };
  };

  const updateSlot = (
    slotId: number,
    pricePerHour: number,
    status: 'Available' | 'Booked' | 'Occupied',
    areaId?: number,
    slotNumber?: string,
    vehicleType?: 'Car' | 'Motorcycle',
    dayPrice?: number
  ): { success: boolean; message: string } => {
    if (pricePerHour <= 0) return { success: false, message: 'Price must be greater than zero.' };

    const current = slots.find(s => s.slot_id === slotId);
    if (!current) return { success: false, message: 'Slot not found.' };

    const nextAreaId = areaId !== undefined ? areaId : current.area_id;
    const nextSlotNumber = slotNumber !== undefined ? slotNumber.trim().toUpperCase() : current.slot_number;
    const nextVehicleType = vehicleType !== undefined ? vehicleType : current.vehicle_type;
    const nextDayPrice = dayPrice !== undefined ? dayPrice : current.day_price;

    if (!nextSlotNumber) return { success: false, message: 'Slot number is required.' };
    if (nextDayPrice <= 0) return { success: false, message: 'Day price must be greater than zero.' };

    // Prevent duplicate slot number inside target area
    if (slots.some(s => s.slot_id !== slotId && s.area_id === nextAreaId && s.slot_number.toUpperCase() === nextSlotNumber)) {
      return { success: false, message: `Slot ${nextSlotNumber} already exists in this area.` };
    }

    const updatedSlot: ParkingSlot = {
      ...current,
      area_id: nextAreaId,
      slot_number: nextSlotNumber,
      vehicle_type: nextVehicleType,
      price_per_hour: pricePerHour,
      day_price: nextDayPrice,
      status
    };

    setSlots(prev =>
      prev.map(s => (s.slot_id === slotId ? updatedSlot : s))
    );
    void syncSlotToCloudAndBroadcast(updatedSlot);
    return { success: true, message: `Slot ${nextSlotNumber} updated.` };
  };

  const adminCancelBooking = (bookingId: number): { success: boolean; message: string } => {
    setBookings(prev => prev.map(b => b.booking_id === bookingId ? { ...b, booking_status: 'Cancelled' } : b));
    return { success: true, message: `Booking #${bookingId} cancelled by Admin.` };
  };

  // Cookie Consent Handling
  const setCookieConsentState = (status: 'accepted' | 'declined') => {
    setCookieConsent(status);
    localStorage.setItem('pe_cookie_consent', status);
  };

  // Reset to original seed
  const resetDatabase = () => {
    setUsers(INITIAL_USERS);
    setAreas(INITIAL_AREAS);
    setSlots(INITIAL_SLOTS);
    setVehicles(INITIAL_VEHICLES);
    setBookings(INITIAL_BOOKINGS);
    setPayments(INITIAL_PAYMENTS);
    setCurrentUser(null);
    localStorage.clear();
  };

  return (
    <ParkEaseContext.Provider
      value={{
        currentUser,
        login,
        completeDemoSession,
        loginWithGoogle,
        register,
        sendPhoneOtp,
        verifyPhoneOtp,
        logout,
        updateProfile,
        changePassword,
        users,
        areas,
        slots,
        vehicles,
        bookings,
        payments,
        userVehicles,
        activeVehicle,
        addVehicle,
        editVehicle,
        deleteVehicle,
        setActiveVehicle,
        isSlotAvailable,
        searchSlots,
        getSuggestedTimes,
        fetchSlotAvailability,
        fetchNextAvailableSlotsForArea,
        refreshLiveData,
        createBooking,
        cancelBooking,
        processPayment,
        checkInWithQr,
        toggleUserStatus,
        addArea,
        updateArea,
        addSlot,
        updateSlot,
        adminCancelBooking,
        cookieConsent,
        setCookieConsentState,
        resetDatabase
      }}
    >
      {children}
    </ParkEaseContext.Provider>
  );
};

export const useParkEase = () => {
  const context = useContext(ParkEaseContext);
  if (!context) {
    throw new Error('useParkEase must be used within a ParkEaseProvider');
  }
  return context;
};
