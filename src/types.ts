/**
 * ParkEase Type Definitions
 * Directly matches MySQL database schema for Chattogram City Parking Booking System.
 */

export type UserRole = 'user' | 'admin';
export type UserStatus = 'Active' | 'Blocked';

export interface User {
  user_id: number;
  full_name: string;
  email: string;
  phone: string;
  phone_verified?: boolean;
  phone_verified_at?: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
}

export type VehicleType = 'Car' | 'Motorcycle';
export type VehicleStatus = 'Active' | 'Inactive';

export interface Vehicle {
  vehicle_id: number;
  user_id: number;
  vehicle_number: string;
  vehicle_type: VehicleType;
  brand: string;
  model: string;
  status: VehicleStatus;
  is_active_selection?: boolean;
  created_at: string;
}

export type AreaStatus = 'Active' | 'Inactive';

export interface ParkingArea {
  area_id: number;
  area_name: string;
  location: string;
  status: AreaStatus;
  created_at: string;
}

export type SlotStatus = 'Available' | 'Booked' | 'Occupied';

export interface ParkingSlot {
  slot_id: number;
  area_id: number;
  slot_number: string;
  vehicle_type: VehicleType;
  price_per_hour: number;
  day_price: number;
  status: SlotStatus;
  created_at: string;
}

export type PaymentStatus = 'Pending' | 'Paid' | 'Failed';
export type BookingStatus = 'Confirmed' | 'Completed' | 'Cancelled';

export interface Booking {
  booking_id: number;
  user_id: number;
  vehicle_id: number;
  slot_id: number;
  booking_date: string; // YYYY-MM-DD
  booking_time: string; // HH:MM:SS or HH:MM
  duration_hours: number;
  price_total: number;
  payment_status: PaymentStatus;
  booking_status: BookingStatus;
  checked_in_at?: string;
  created_at: string;
}

export type PaymentMethod = 'bKash' | 'Nagad' | 'Rocket' | 'Visa' | 'MasterCard';

export interface Payment {
  payment_id: number;
  booking_id: number;
  amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_date: string;
}

export interface SlotSearchResult extends ParkingSlot {
  area_name: string;
  location: string;
  calculated_total: number;
}

export interface SuggestedTimeSlot {
  date: string;
  time: string;
  durationHours: number;
  availableCount: number;
  slots: SlotSearchResult[];
  historicalDemandPct: number;
  historicalReason: string;
  isProjectedTurnover?: boolean;
}
