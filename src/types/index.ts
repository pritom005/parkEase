// Database and Application Types for ParkEase Smart Parking System

export type UserRole = 'user' | 'admin';
export type UserStatus = 'Active' | 'Blocked';

export interface User {
  user_id: number;
  full_name: string;
  email: string;
  phone: string;
  password_hash: string;
  role: UserRole;
  status: UserStatus;
  nid?: string;
  wallet_balance?: number;
  created_at: string;
}

export type VehicleType = 'Car' | 'Motorcycle';
export type VehicleStatus = 'Active' | 'Inactive';

export interface Vehicle {
  vehicle_id: number;
  user_id: number;
  vehicle_number: string; // e.g. DHK-METRO-GA-11-2045
  vehicle_type: VehicleType;
  brand: string;
  model: string;
  status: VehicleStatus;
  is_default?: boolean;
  rfid_tag?: string;
  brta_verified?: boolean;
  chassis_number?: string;
  engine_number?: string;
}

export type AreaStatus = 'Active' | 'Inactive';

export interface ParkingArea {
  area_id: number;
  area_name: string;
  location: string;
  status: AreaStatus;
  total_slots: number;
  car_slots: number;
  motorcycle_slots: number;
  car_rate_hourly: number;
  motorcycle_rate_hourly: number;
  car_rate_daily: number;
  motorcycle_rate_daily: number;
  warden_name?: string;
  hotline?: string;
  coordinates?: string;
}

export type SlotStatus = 'Available' | 'Booked' | 'Occupied' | 'Blocked';

export interface ParkingSlot {
  slot_id: number;
  area_id: number;
  slot_number: string; // e.g. C-01, M-01
  vehicle_type: VehicleType;
  price_per_hour: number;
  status: SlotStatus;
  zone: string; // Zone A (Ground Floor / North Wing) or Zone B
  floor?: string;
  sensor_id?: string;
  current_plate?: string;
}

export type PaymentStatus = 'Pending' | 'Paid' | 'Failed';
export type BookingStatus = 'Confirmed' | 'Checked-In' | 'Completed' | 'Cancelled';

export interface Booking {
  booking_id: number;
  booking_code: string; // e.g. PK-88219 or PK-20261015-001
  user_id: number;
  vehicle_id: number;
  slot_id: number;
  booking_date: string; // YYYY-MM-DD
  booking_time: string; // HH:MM
  duration_hours: number;
  price_total: number;
  payment_status: PaymentStatus;
  booking_status: BookingStatus;
  created_at: string;
  // Arrival, Check-In, Check-Out & Overtime fields
  hourly_rate?: number; // 250 for Car, 100 for Motorcycle
  original_amount?: number; // Initial booked charge
  check_in_time?: string; // Actual arrival time
  check_out_time?: string; // Actual exit time
  actual_duration_minutes?: number;
  billable_hours?: number; // Booked hours + ceil(overtime)
  extra_amount?: number; // Overtime charge
  cancellation_reason?: string; // e.g. 'Cancelled due to no-show'
  is_no_show?: boolean;
  // Join fields for convenience
  user_name?: string;
  user_phone?: string;
  vehicle_number?: string;
  vehicle_model?: string;
  vehicle_type?: VehicleType;
  area_name?: string;
  slot_number?: string;
}

export interface BillingDetails {
  vehicle_type: VehicleType;
  hourly_rate: number;
  booked_hours: number;
  original_amount: number;
  scheduled_start: string;
  scheduled_end: string;
  check_in_time?: string;
  check_out_time?: string;
  actual_duration_minutes: number;
  overtime_minutes: number;
  overtime_hours: number;
  billable_hours: number;
  total_charge: number;
  paid_amount: number;
  outstanding_amount: number;
}


export type PaymentMethod = 'bKash' | 'Nagad' | 'Rocket' | 'Visa' | 'MasterCard' | 'Civic Wallet';

export interface Payment {
  payment_id: number;
  booking_id: number;
  amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_date: string;
  transaction_ref: string;
  // Join fields
  booking_code?: string;
  user_name?: string;
  area_name?: string;
  slot_number?: string;
}

export interface GateLog {
  log_id: number;
  plate_number: string;
  vehicle_name: string;
  hub_name: string;
  gate_id: string;
  detection_time: string;
  ocr_match_percent: number;
  status: 'Inside Bay' | 'Exited Clearance' | 'Completed' | 'Diverted';
  barrier_clearance: string;
}

export type NotificationType = 'New Booking' | 'Cancellation' | 'System Alert';

export interface AdminNotification {
  notification_id: number;
  notification_type: NotificationType;
  booking_id: number;
  booking_code: string;
  customer_name: string;
  customer_email: string;
  parking_area: string;
  parking_slot_number: string;
  vehicle_number: string;
  booking_date: string;
  start_time: string;
  duration_hours: number;
  total_price: number;
  booking_status: BookingStatus;
  message: string;
  is_read: boolean;
  created_at: string;
}

