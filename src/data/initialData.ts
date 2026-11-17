/**
 * ParkEase Seed Data for Chattogram City
 * Aligned with database/seed.sql
 * Areas: GEC Circle, Agrabad, Khulshi, Bahaddarhat, Patenga, Chawkbazar
 */

import { User, Vehicle, ParkingArea, ParkingSlot, Booking, Payment } from '../types';

export const INITIAL_USERS: User[] = [
  {
    user_id: 1,
    full_name: 'System Administrator',
    email: 'admin@parkease.com',
    phone: '01711000001',
    phone_verified: true,
    phone_verified_at: '2026-01-10 09:05:00',
    role: 'admin',
    status: 'Active',
    created_at: '2026-01-10 09:00:00'
  },
  {
    user_id: 2,
    full_name: 'Tanvir Ahmed',
    email: 'user@parkease.com',
    phone: '01819000002',
    phone_verified: true,
    phone_verified_at: '2026-02-15 11:25:00',
    role: 'user',
    status: 'Active',
    created_at: '2026-02-15 11:20:00'
  },
  {
    user_id: 3,
    full_name: 'Nusrat Jahan',
    email: 'nusrat@parkease.com',
    phone: '01912000003',
    phone_verified: true,
    phone_verified_at: '2026-03-01 14:15:00',
    role: 'user',
    status: 'Active',
    created_at: '2026-03-01 14:10:00'
  }
];

export const INITIAL_AREAS: ParkingArea[] = [
  {
    area_id: 1,
    area_name: 'GEC Circle',
    location: 'GEC More, Near Sanmar Ocean City, Chattogram',
    status: 'Active',
    created_at: '2026-01-01 08:00:00'
  },
  {
    area_id: 2,
    area_name: 'Agrabad',
    location: 'Agrabad, Near WTC, Chattogram',
    status: 'Active',
    created_at: '2026-01-01 08:00:00'
  },
  {
    area_id: 3,
    area_name: 'Khulshi',
    location: 'Zakir Hossain Road, Khulshi, Chattogram',
    status: 'Active',
    created_at: '2026-01-01 08:00:00'
  },
  {
    area_id: 4,
    area_name: 'Bahaddarhat',
    location: 'Bahaddarhat Area, Chattogram',
    status: 'Active',
    created_at: '2026-01-01 08:00:00'
  },
  {
    area_id: 5,
    area_name: 'Patenga',
    location: 'Patenga Beach Road, Airport Crossing, Chattogram',
    status: 'Active',
    created_at: '2026-01-01 08:00:00'
  },
  {
    area_id: 6,
    area_name: 'Chawkbazar',
    location: 'College Road, Near Parade Ground, Chattogram',
    status: 'Active',
    created_at: '2026-01-01 08:00:00'
  }
];

interface AreaSlotQuota {
  areaId: number;
  cars: number;
  motorcycles: number;
}

const AREA_SLOT_QUOTAS: AreaSlotQuota[] = [
  { areaId: 1, cars: 20, motorcycles: 12 }, // GEC Circle: 32
  { areaId: 2, cars: 20, motorcycles: 10 }, // Agrabad: 30
  { areaId: 3, cars: 12, motorcycles: 6 },  // Khulshi: 18
  { areaId: 4, cars: 14, motorcycles: 6 },  // Bahaddarhat: 20
  { areaId: 5, cars: 10, motorcycles: 5 },  // Patenga: 15
  { areaId: 6, cars: 8, motorcycles: 7 }    // Chawkbazar: 15
];

const buildInitialSlots = (): ParkingSlot[] => {
  const list: ParkingSlot[] = [];
  let nextSlotId = 1;

  for (const quota of AREA_SLOT_QUOTAS) {
    for (let i = 1; i <= quota.cars; i += 1) {
      list.push({
        slot_id: nextSlotId++,
        area_id: quota.areaId,
        slot_number: `C-${String(i).padStart(2, '0')}`,
        vehicle_type: 'Car',
        price_per_hour: 250,
        day_price: 2000,
        status: 'Available',
        created_at: '2026-01-01 08:00:00'
      });
    }
    for (let i = 1; i <= quota.motorcycles; i += 1) {
      list.push({
        slot_id: nextSlotId++,
        area_id: quota.areaId,
        slot_number: `M-${String(i).padStart(2, '0')}`,
        vehicle_type: 'Motorcycle',
        price_per_hour: 100,
        day_price: 1000,
        status: 'Available',
        created_at: '2026-01-01 08:00:00'
      });
    }
  }

  return list;
};

export const INITIAL_SLOTS: ParkingSlot[] = buildInitialSlots();

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    vehicle_id: 1,
    user_id: 2,
    vehicle_number: 'Chatta Metro-Ga 14-2231',
    vehicle_type: 'Car',
    brand: 'Toyota',
    model: 'Premio 2018',
    status: 'Active',
    is_active_selection: true,
    created_at: '2026-02-16 10:00:00'
  },
  {
    vehicle_id: 2,
    user_id: 2,
    vehicle_number: 'Chatta Metro-Ha 12-8954',
    vehicle_type: 'Motorcycle',
    brand: 'Yamaha',
    model: 'FZ-S V3',
    status: 'Active',
    is_active_selection: false,
    created_at: '2026-02-18 12:30:00'
  },
  {
    vehicle_id: 3,
    user_id: 3,
    vehicle_number: 'Chatta Metro-Ga 15-4421',
    vehicle_type: 'Car',
    brand: 'Honda',
    model: 'Civic 2020',
    status: 'Active',
    is_active_selection: true,
    created_at: '2026-03-02 09:15:00'
  }
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    booking_id: 1,
    user_id: 2,
    vehicle_id: 1,
    slot_id: 1,
    booking_date: '2026-11-12',
    booking_time: '10:00',
    duration_hours: 3,
    price_total: 750.00,
    payment_status: 'Paid',
    booking_status: 'Confirmed',
    created_at: '2026-11-11 08:30:00'
  },
  {
    booking_id: 2,
    user_id: 2,
    vehicle_id: 2,
    slot_id: 21,
    booking_date: '2026-11-10',
    booking_time: '14:00',
    duration_hours: 2,
    price_total: 200.00,
    payment_status: 'Paid',
    booking_status: 'Completed',
    created_at: '2026-11-10 13:45:00'
  }
];

export const INITIAL_PAYMENTS: Payment[] = [
  {
    payment_id: 1,
    booking_id: 1,
    amount: 750.00,
    payment_method: 'bKash',
    payment_status: 'Paid',
    payment_date: '2026-11-11 08:30:00'
  },
  {
    payment_id: 2,
    booking_id: 2,
    amount: 200.00,
    payment_method: 'Nagad',
    payment_status: 'Paid',
    payment_date: '2026-11-10 13:45:00'
  }
];
