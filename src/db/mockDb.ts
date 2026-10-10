import {
  User,
  Vehicle,
  ParkingArea,
  ParkingSlot,
  Booking,
  Payment,
  GateLog,
  PaymentMethod,
  SlotStatus,
  AdminNotification,
  BillingDetails,
  VehicleType,
} from '../types';

export const CAR_HOURLY_RATE = 250;
export const BIKE_HOURLY_RATE = 100;

const STORAGE_KEY = 'parkease_db_store_v2';

export function formatBangladeshDateTime(date: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(date);
    const get = (type: string) => parts.find((p) => p.type === type)?.value || '00';
    return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
  } catch {
    return date.toISOString().replace('T', ' ').substring(0, 19);
  }
}

export function parseBangladeshDateTime(dateStr: string, timeStr: string): number {
  const fullTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  const iso = `${dateStr}T${fullTime}+06:00`;
  const time = new Date(iso).getTime();
  return isNaN(time) ? Date.now() : time;
}

interface DbSchema {
  users: User[];
  vehicles: Vehicle[];
  parking_areas: ParkingArea[];
  parking_slots: ParkingSlot[];
  bookings: Booking[];
  payments: Payment[];
  gate_logs: GateLog[];
  notifications: AdminNotification[];
}


const INITIAL_AREAS: ParkingArea[] = [
  {
    area_id: 1,
    area_name: 'GEC Circle Hub',
    location: 'CDA Avenue, East Nasirabad, GEC Circle, Chattogram',
    status: 'Active',
    total_slots: 32,
    car_slots: 20,
    motorcycle_slots: 12,
    car_rate_hourly: 250,
    motorcycle_rate_hourly: 100,
    car_rate_daily: 2500,
    motorcycle_rate_daily: 1000,
    warden_name: 'Insp. Faruk Hossain',
    hotline: '+880 1712-884920',
    coordinates: '22.3587° N, 91.8215° E',
  },
  {
    area_id: 2,
    area_name: 'Agrabad Commercial Area',
    location: 'Commercial Area, Agrabad C/A, Zone 02 CBD, Chattogram',
    status: 'Active',
    total_slots: 35,
    car_slots: 24,
    motorcycle_slots: 11,
    car_rate_hourly: 250,
    motorcycle_rate_hourly: 100,
    car_rate_daily: 2500,
    motorcycle_rate_daily: 1000,
    warden_name: 'Warden M. Alamgir',
    hotline: '+880 1819-301928',
    coordinates: '22.3275° N, 91.8122° E',
  },
  {
    area_id: 3,
    area_name: 'Khulshi Residential Hub',
    location: 'Zakir Hossain Road, VIP Sector, Khulshi Hill, Chattogram',
    status: 'Active',
    total_slots: 18,
    car_slots: 12,
    motorcycle_slots: 6,
    car_rate_hourly: 250,
    motorcycle_rate_hourly: 100,
    car_rate_daily: 2500,
    motorcycle_rate_daily: 1000,
    warden_name: 'Warden S. Dewan',
    hotline: '+880 1912-748291',
    coordinates: '22.3640° N, 91.8020° E',
  },
  {
    area_id: 4,
    area_name: 'Bahaddarhat Bus Terminal Hub',
    location: 'Arterial Terminal Connector, Bahaddarhat, Chattogram',
    status: 'Active',
    total_slots: 25,
    car_slots: 18,
    motorcycle_slots: 7,
    car_rate_hourly: 250,
    motorcycle_rate_hourly: 100,
    car_rate_daily: 2500,
    motorcycle_rate_daily: 1000,
    warden_name: 'SI T. Barua',
    hotline: '+880 1611-928374',
    coordinates: '22.3688° N, 91.8412° E',
  },
  {
    area_id: 5,
    area_name: 'Patenga Coastal Area',
    location: 'Marine Drive Promenade, South Patenga, Chattogram',
    status: 'Active',
    total_slots: 15,
    car_slots: 10,
    motorcycle_slots: 5,
    car_rate_hourly: 250,
    motorcycle_rate_hourly: 100,
    car_rate_daily: 2500,
    motorcycle_rate_daily: 1000,
    warden_name: 'Warden K. Chowdhury',
    hotline: '+880 1512-837465',
    coordinates: '22.2350° N, 91.7910° E',
  },
  {
    area_id: 6,
    area_name: 'Chawkbazar Market Area',
    location: 'Academic & Bazaar Sector, Chawkbazar, Chattogram',
    status: 'Active',
    total_slots: 10,
    car_slots: 4,
    motorcycle_slots: 6,
    car_rate_hourly: 250,
    motorcycle_rate_hourly: 100,
    car_rate_daily: 2500,
    motorcycle_rate_daily: 1000,
    warden_name: 'Warden R. Das',
    hotline: '+880 1822-948172',
    coordinates: '22.3592° N, 91.8385° E',
  },
];

const INITIAL_USERS: User[] = [
  {
    user_id: 1,
    full_name: 'Engr. M. Rafiqul Islam',
    email: 'admin@parkease.ctg',
    phone: '+880 1819-293847',
    password_hash: 'pbkdf2:sha256:admin123',
    role: 'admin',
    status: 'Active',
    nid: '1984-1592-384910',
    wallet_balance: 0,
    created_at: '2025-01-10 08:00:00',
  },
  {
    user_id: 2,
    full_name: 'Tanvir Ahmed',
    email: 'tanvir@parkease.ctg',
    phone: '+880 1712-349042',
    password_hash: 'pbkdf2:sha256:user123',
    role: 'user',
    status: 'Active',
    nid: '1984-1592-384910',
    wallet_balance: 2450,
    created_at: '2025-02-15 11:30:00',
  },
  {
    user_id: 3,
    full_name: 'Dr. Kamrul Zaman',
    email: 'kamrul@chattogram.gov.bd',
    phone: '+880 1819-293848',
    password_hash: 'pbkdf2:sha256:user123',
    role: 'user',
    status: 'Active',
    nid: '1978-2940-192841',
    wallet_balance: 3850,
    created_at: '2025-03-01 09:15:00',
  },
  {
    user_id: 4,
    full_name: 'Shamim Reza',
    email: 'shamim@agrabad.ctg',
    phone: '+880 1912-384910',
    password_hash: 'pbkdf2:sha256:user123',
    role: 'user',
    status: 'Active',
    nid: '1982-4910-381920',
    wallet_balance: 420,
    created_at: '2025-03-12 14:00:00',
  },
  {
    user_id: 5,
    full_name: 'Tariqul Islam',
    email: 'tariqul@gmail.com',
    phone: '+880 1712-089281',
    password_hash: 'pbkdf2:sha256:user123',
    role: 'user',
    status: 'Blocked',
    nid: '1995-1829-491029',
    wallet_balance: -480,
    created_at: '2025-04-05 16:20:00',
  },
];

const INITIAL_VEHICLES: Vehicle[] = [
  {
    vehicle_id: 1,
    user_id: 2, // Tanvir Ahmed
    vehicle_number: 'DHK-METRO-GA-11-2045',
    vehicle_type: 'Car',
    brand: 'Toyota',
    model: 'Corolla Altis 2020',
    status: 'Active',
    is_default: true,
    rfid_tag: 'RFID-CTG-88219',
    brta_verified: true,
    chassis_number: 'NZE141-9482103',
    engine_number: '1NZ-FE-829104',
  },
  {
    vehicle_id: 2,
    user_id: 2, // Tanvir Ahmed
    vehicle_number: 'CTG-HA-12-8840',
    vehicle_type: 'Motorcycle',
    brand: 'Honda',
    model: 'CB Hornet 160R',
    status: 'Active',
    is_default: false,
    rfid_tag: 'RFID-CTG-44102',
    brta_verified: true,
    chassis_number: 'MC12-491028',
    engine_number: 'HND-4910-E',
  },
  {
    vehicle_id: 3,
    user_id: 3, // Dr. Kamrul Zaman
    vehicle_number: 'DHK-METRO-GA-35-1829',
    vehicle_type: 'Car',
    brand: 'Toyota',
    model: 'Allion 2019',
    status: 'Active',
    is_default: true,
    rfid_tag: 'RFID-CTG-77401',
    brta_verified: true,
  },
  {
    vehicle_id: 4,
    user_id: 4, // Shamim Reza
    vehicle_number: 'CHA-10-8291',
    vehicle_type: 'Car',
    brand: 'Nissan',
    model: 'Sunny 2016',
    status: 'Active',
    is_default: true,
    rfid_tag: 'RFID-CTG-63102',
    brta_verified: true,
  },
];

const INITIAL_SLOTS: ParkingSlot[] = [
  // GEC Circle Hub (area_id = 1) - Zone A (Cars: C-01 to C-20)
  { slot_id: 1, area_id: 1, slot_number: 'C-01', vehicle_type: 'Car', price_per_hour: 250, status: 'Occupied', zone: 'Zone A (Ground Level)', sensor_id: 'MAG-GEC-01-A', current_plate: 'GA-13-4412' },
  { slot_id: 2, area_id: 1, slot_number: 'C-02', vehicle_type: 'Car', price_per_hour: 250, status: 'Occupied', zone: 'Zone A (Ground Level)', sensor_id: 'MAG-GEC-02-A', current_plate: 'KHA-19-0128' },
  { slot_id: 3, area_id: 1, slot_number: 'C-03', vehicle_type: 'Car', price_per_hour: 250, status: 'Occupied', zone: 'Zone A (Ground Level)', sensor_id: 'MAG-GEC-03-A', current_plate: 'BHA-11-7892' },
  { slot_id: 4, area_id: 1, slot_number: 'C-04', vehicle_type: 'Car', price_per_hour: 250, status: 'Occupied', zone: 'Zone A (Ground Level)', sensor_id: 'MAG-GEC-04-A', current_plate: 'DHK-METRO-GA-11-2045' },
  { slot_id: 5, area_id: 1, slot_number: 'C-05', vehicle_type: 'Car', price_per_hour: 250, status: 'Available', zone: 'Zone A (Ground Level)', sensor_id: 'MAG-GEC-05-A' },
  { slot_id: 6, area_id: 1, slot_number: 'C-06', vehicle_type: 'Car', price_per_hour: 250, status: 'Occupied', zone: 'Zone A (Ground Level)', sensor_id: 'MAG-GEC-06-A', current_plate: 'CHA-53-1920' },
  { slot_id: 7, area_id: 1, slot_number: 'C-07', vehicle_type: 'Car', price_per_hour: 250, status: 'Occupied', zone: 'Zone A (Ground Level)', sensor_id: 'MAG-GEC-07-A', current_plate: 'GA-15-6602' },
  { slot_id: 8, area_id: 1, slot_number: 'C-08', vehicle_type: 'Car', price_per_hour: 250, status: 'Occupied', zone: 'Zone A (Ground Level)', sensor_id: 'MAG-GEC-08-A', current_plate: 'GA-29-3310' },
  { slot_id: 9, area_id: 1, slot_number: 'C-09', vehicle_type: 'Car', price_per_hour: 250, status: 'Occupied', zone: 'Zone A (Ground Level)', sensor_id: 'MAG-GEC-09-A', current_plate: 'KHA-12-5891' },
  { slot_id: 10, area_id: 1, slot_number: 'C-10', vehicle_type: 'Car', price_per_hour: 250, status: 'Occupied', zone: 'Zone A (Ground Level)', sensor_id: 'MAG-GEC-10-A', current_plate: 'GA-44-1290' },
  { slot_id: 11, area_id: 1, slot_number: 'C-11', vehicle_type: 'Car', price_per_hour: 250, status: 'Occupied', zone: 'Zone A (Ground Level)', sensor_id: 'MAG-GEC-11-A', current_plate: 'GA-14-1102' },
  { slot_id: 12, area_id: 1, slot_number: 'C-12', vehicle_type: 'Car', price_per_hour: 250, status: 'Booked', zone: 'Zone A (Ground Level)', sensor_id: 'MAG-GEC-12-A', current_plate: 'DHK-METRO-GA-35-1829' },
  { slot_id: 13, area_id: 1, slot_number: 'C-13', vehicle_type: 'Car', price_per_hour: 250, status: 'Occupied', zone: 'Zone A (Ground Level)', sensor_id: 'MAG-GEC-13-A', current_plate: 'GA-31-0612' },
  { slot_id: 14, area_id: 1, slot_number: 'C-14', vehicle_type: 'Car', price_per_hour: 250, status: 'Occupied', zone: 'Zone A (Ground Level)', sensor_id: 'MAG-GEC-14-A', current_plate: 'GHA-11-9281' },
  { slot_id: 15, area_id: 1, slot_number: 'C-15', vehicle_type: 'Car', price_per_hour: 250, status: 'Occupied', zone: 'Zone A (Ground Level)', sensor_id: 'MAG-GEC-15-A', current_plate: 'BA-12-7019' },
  { slot_id: 16, area_id: 1, slot_number: 'C-16', vehicle_type: 'Car', price_per_hour: 250, status: 'Occupied', zone: 'Zone A (Ground Level)', sensor_id: 'MAG-GEC-16-A', current_plate: 'GA-18-9102' },
  { slot_id: 17, area_id: 1, slot_number: 'C-17', vehicle_type: 'Car', price_per_hour: 250, status: 'Occupied', zone: 'Zone A (Ground Level)', sensor_id: 'MAG-GEC-17-A', current_plate: 'GA-35-1820' },
  { slot_id: 18, area_id: 1, slot_number: 'C-18', vehicle_type: 'Car', price_per_hour: 250, status: 'Occupied', zone: 'Zone A (Ground Level)', sensor_id: 'MAG-GEC-18-A', current_plate: 'CHA-10-8291' },
  { slot_id: 19, area_id: 1, slot_number: 'C-19', vehicle_type: 'Car', price_per_hour: 250, status: 'Blocked', zone: 'Zone A (Ground Level)', sensor_id: 'MAG-GEC-19-A' },
  { slot_id: 20, area_id: 1, slot_number: 'C-20', vehicle_type: 'Car', price_per_hour: 250, status: 'Occupied', zone: 'Zone A (Ground Level)', sensor_id: 'MAG-GEC-20-A', current_plate: 'GA-22-6718' },

  // GEC Circle Hub - Zone B (Motorcycles: M-01 to M-12)
  { slot_id: 21, area_id: 1, slot_number: 'M-01', vehicle_type: 'Motorcycle', price_per_hour: 100, status: 'Occupied', zone: 'Zone B (East Lane)', sensor_id: 'IND-GEC-M01', current_plate: 'HA-12-8840' },
  { slot_id: 22, area_id: 1, slot_number: 'M-02', vehicle_type: 'Motorcycle', price_per_hour: 100, status: 'Occupied', zone: 'Zone B (East Lane)', sensor_id: 'IND-GEC-M02', current_plate: 'HA-14-2201' },
  { slot_id: 23, area_id: 1, slot_number: 'M-03', vehicle_type: 'Motorcycle', price_per_hour: 100, status: 'Occupied', zone: 'Zone B (East Lane)', sensor_id: 'IND-GEC-M03', current_plate: 'LA-11-9041' },
  { slot_id: 24, area_id: 1, slot_number: 'M-04', vehicle_type: 'Motorcycle', price_per_hour: 100, status: 'Available', zone: 'Zone B (East Lane)', sensor_id: 'IND-GEC-M04' },
  { slot_id: 25, area_id: 1, slot_number: 'M-05', vehicle_type: 'Motorcycle', price_per_hour: 100, status: 'Occupied', zone: 'Zone B (East Lane)', sensor_id: 'IND-GEC-M05', current_plate: 'HA-33-1029' },
  { slot_id: 26, area_id: 1, slot_number: 'M-06', vehicle_type: 'Motorcycle', price_per_hour: 100, status: 'Occupied', zone: 'Zone B (East Lane)', sensor_id: 'IND-GEC-M06', current_plate: 'HA-18-5521' },
  { slot_id: 27, area_id: 1, slot_number: 'M-07', vehicle_type: 'Motorcycle', price_per_hour: 100, status: 'Occupied', zone: 'Zone B (East Lane)', sensor_id: 'IND-GEC-M07', current_plate: 'HA-19-4402' },
  { slot_id: 28, area_id: 1, slot_number: 'M-08', vehicle_type: 'Motorcycle', price_per_hour: 100, status: 'Occupied', zone: 'Zone B (East Lane)', sensor_id: 'IND-GEC-M08', current_plate: 'LA-22-9011' },
  { slot_id: 29, area_id: 1, slot_number: 'M-09', vehicle_type: 'Motorcycle', price_per_hour: 100, status: 'Occupied', zone: 'Zone B (East Lane)', sensor_id: 'IND-GEC-M09', current_plate: 'HA-15-7733' },
  { slot_id: 30, area_id: 1, slot_number: 'M-10', vehicle_type: 'Motorcycle', price_per_hour: 100, status: 'Occupied', zone: 'Zone B (East Lane)', sensor_id: 'IND-GEC-M09', current_plate: 'HA-21-3310' },
  { slot_id: 31, area_id: 1, slot_number: 'M-11', vehicle_type: 'Motorcycle', price_per_hour: 100, status: 'Available', zone: 'Zone B (East Lane)', sensor_id: 'IND-GEC-M11' },
  { slot_id: 32, area_id: 1, slot_number: 'M-12', vehicle_type: 'Motorcycle', price_per_hour: 100, status: 'Occupied', zone: 'Zone B (East Lane)', sensor_id: 'IND-GEC-M12', current_plate: 'HA-11-0943' },

  // Agrabad Commercial Area (area_id = 2)
  { slot_id: 33, area_id: 2, slot_number: 'A-01', vehicle_type: 'Car', price_per_hour: 250, status: 'Available', zone: 'Ground Level North' },
  { slot_id: 34, area_id: 2, slot_number: 'A-02', vehicle_type: 'Car', price_per_hour: 250, status: 'Available', zone: 'Ground Level North' },
  { slot_id: 35, area_id: 2, slot_number: 'A-03', vehicle_type: 'Car', price_per_hour: 250, status: 'Occupied', zone: 'Ground Level North', current_plate: 'DHK-GHA-11-9382' },
  { slot_id: 36, area_id: 2, slot_number: 'A-04', vehicle_type: 'Car', price_per_hour: 250, status: 'Available', zone: 'Ground Level North' },
  { slot_id: 37, area_id: 2, slot_number: 'MA-01', vehicle_type: 'Motorcycle', price_per_hour: 100, status: 'Available', zone: 'East Bay' },
  { slot_id: 38, area_id: 2, slot_number: 'MA-02', vehicle_type: 'Motorcycle', price_per_hour: 100, status: 'Available', zone: 'East Bay' },

  // Khulshi Residential Hub (area_id = 3)
  { slot_id: 39, area_id: 3, slot_number: 'K-01', vehicle_type: 'Car', price_per_hour: 250, status: 'Available', zone: 'Main Level' },
  { slot_id: 40, area_id: 3, slot_number: 'K-02', vehicle_type: 'Car', price_per_hour: 250, status: 'Available', zone: 'Main Level' },
  { slot_id: 41, area_id: 3, slot_number: 'K-03', vehicle_type: 'Car', price_per_hour: 250, status: 'Occupied', zone: 'Main Level', current_plate: 'CHA-10-8291' },
  { slot_id: 42, area_id: 3, slot_number: 'KM-01', vehicle_type: 'Motorcycle', price_per_hour: 100, status: 'Available', zone: 'Two Wheeler Bay' },
];

const INITIAL_BOOKINGS: Booking[] = [
  {
    booking_id: 1,
    booking_code: 'PK-88219',
    user_id: 2,
    vehicle_id: 1,
    slot_id: 4, // C-04
    booking_date: '2026-10-10',
    booking_time: '09:30',
    duration_hours: 8,
    hourly_rate: 250,
    original_amount: 2000,
    billable_hours: 8,
    extra_amount: 0,
    price_total: 2000,
    payment_status: 'Paid',
    booking_status: 'Checked-In',
    check_in_time: '2026-10-10 09:35:00',
    created_at: '2026-10-10 09:20:00',
    user_name: 'Tanvir Ahmed',
    user_phone: '+880 1712-349042',
    vehicle_number: 'DHK-METRO-GA-11-2045',
    vehicle_model: 'Toyota Corolla Altis',
    vehicle_type: 'Car',
    area_name: 'GEC Circle Hub',
    slot_number: 'C-04',
  },
  {
    booking_id: 2,
    booking_code: 'PK-87402',
    user_id: 2,
    vehicle_id: 1,
    slot_id: 33, // A-01
    booking_date: '2026-10-08',
    booking_time: '09:15',
    duration_hours: 8,
    hourly_rate: 250,
    original_amount: 2000,
    billable_hours: 8,
    extra_amount: 0,
    price_total: 2000,
    payment_status: 'Paid',
    booking_status: 'Completed',
    check_in_time: '2026-10-08 09:18:00',
    check_out_time: '2026-10-08 17:15:00',
    created_at: '2026-10-08 09:00:00',
    user_name: 'Tanvir Ahmed',
    user_phone: '+880 1712-349042',
    vehicle_number: 'DHK-METRO-GA-11-2045',
    vehicle_model: 'Toyota Corolla Altis',
    vehicle_type: 'Car',
    area_name: 'Agrabad Commercial Area',
    slot_number: 'A-01',
  },
  {
    booking_id: 3,
    booking_code: 'PK-86110',
    user_id: 2,
    vehicle_id: 2,
    slot_id: 42, // KM-01
    booking_date: '2026-10-05',
    booking_time: '14:00',
    duration_hours: 5,
    hourly_rate: 100,
    original_amount: 500,
    billable_hours: 5,
    extra_amount: 0,
    price_total: 500,
    payment_status: 'Paid',
    booking_status: 'Completed',
    check_in_time: '2026-10-05 14:02:00',
    check_out_time: '2026-10-05 19:00:00',
    created_at: '2026-10-05 13:45:00',
    user_name: 'Tanvir Ahmed',
    user_phone: '+880 1712-349042',
    vehicle_number: 'CTG-HA-12-8840',
    vehicle_model: 'Honda CB Hornet 160R',
    vehicle_type: 'Motorcycle',
    area_name: 'Khulshi Residential Hub',
    slot_number: 'KM-01',
  },
  {
    booking_id: 4,
    booking_code: 'PK-8842',
    user_id: 3,
    vehicle_id: 3,
    slot_id: 12, // C-12
    booking_date: '2026-10-15',
    booking_time: '16:30',
    duration_hours: 2,
    hourly_rate: 250,
    original_amount: 500,
    billable_hours: 2,
    extra_amount: 0,
    price_total: 500,
    payment_status: 'Paid',
    booking_status: 'Confirmed',
    created_at: '2026-10-10 16:15:00',
    user_name: 'Dr. Kamrul Zaman',
    user_phone: '+880 1819-293848',
    vehicle_number: 'DHK-METRO-GA-35-1829',
    vehicle_model: 'Toyota Allion 2019',
    vehicle_type: 'Car',
    area_name: 'GEC Circle Hub',
    slot_number: 'C-12',
  },
  {
    booking_id: 5,
    booking_code: 'PK-89104',
    user_id: 2,
    vehicle_id: 2,
    slot_id: 24, // M-04
    booking_date: '2026-10-15',
    booking_time: '15:00',
    duration_hours: 2,
    hourly_rate: 100,
    original_amount: 200,
    billable_hours: 2,
    extra_amount: 0,
    price_total: 200,
    payment_status: 'Paid',
    booking_status: 'Confirmed',
    created_at: '2026-10-10 14:45:00',
    user_name: 'Tanvir Ahmed',
    user_phone: '+880 1712-349042',
    vehicle_number: 'CTG-HA-12-8840',
    vehicle_model: 'Honda CB Hornet 160R',
    vehicle_type: 'Motorcycle',
    area_name: 'GEC Circle Hub',
    slot_number: 'M-04',
  },
  {
    booking_id: 6,
    booking_code: 'PK-85012',
    user_id: 4,
    vehicle_id: 4,
    slot_id: 34, // A-02
    booking_date: '2026-10-10',
    booking_time: '10:00',
    duration_hours: 2,
    hourly_rate: 250,
    original_amount: 500,
    billable_hours: 2,
    extra_amount: 0,
    price_total: 500,
    payment_status: 'Paid',
    booking_status: 'Cancelled',
    cancellation_reason: 'Cancelled due to no-show',
    is_no_show: true,
    created_at: '2026-10-10 09:45:00',
    user_name: 'Shamim Reza',
    user_phone: '+880 1912-384910',
    vehicle_number: 'CHA-10-8291',
    vehicle_model: 'Nissan Sunny 2016',
    vehicle_type: 'Car',
    area_name: 'Agrabad Commercial Area',
    slot_number: 'A-02',
  },
  {
    booking_id: 7,
    booking_code: 'PK-84920',
    user_id: 2,
    vehicle_id: 1,
    slot_id: 39, // K-01
    booking_date: '2026-10-09',
    booking_time: '11:00',
    duration_hours: 2,
    hourly_rate: 250,
    original_amount: 500,
    billable_hours: 3, // 2h booked + 20m overtime rounded up = 3 billable hrs
    extra_amount: 250, // 3 * 250 - 500 = 250
    price_total: 750,
    payment_status: 'Paid',
    booking_status: 'Completed',
    check_in_time: '2026-10-09 11:02:00',
    check_out_time: '2026-10-09 13:20:00',
    actual_duration_minutes: 140, // 2 hours 20 mins
    created_at: '2026-10-09 10:45:00',
    user_name: 'Tanvir Ahmed',
    user_phone: '+880 1712-349042',
    vehicle_number: 'DHK-METRO-GA-11-2045',
    vehicle_model: 'Toyota Corolla Altis',
    vehicle_type: 'Car',
    area_name: 'Khulshi Residential Hub',
    slot_number: 'K-01',
  },
];

const INITIAL_PAYMENTS: Payment[] = [
  {
    payment_id: 1,
    booking_id: 1,
    amount: 2000,
    payment_method: 'bKash',
    payment_status: 'Paid',
    payment_date: '2026-10-10 09:25:00',
    transaction_ref: 'BK-2025-88219-99B87A1',
    booking_code: 'PK-88219',
    user_name: 'Tanvir Ahmed',
    area_name: 'GEC Circle Hub',
    slot_number: 'C-04',
  },
  {
    payment_id: 2,
    booking_id: 2,
    amount: 2000,
    payment_method: 'Civic Wallet',
    payment_status: 'Paid',
    payment_date: '2026-10-08 09:05:00',
    transaction_ref: 'CW-2025-4491',
    booking_code: 'PK-87402',
    user_name: 'Tanvir Ahmed',
    area_name: 'Agrabad Commercial Area',
    slot_number: 'A-01',
  },
  {
    payment_id: 3,
    booking_id: 3,
    amount: 500,
    payment_method: 'Nagad',
    payment_status: 'Paid',
    payment_date: '2026-10-05 13:50:00',
    transaction_ref: 'NG-2025-1940',
    booking_code: 'PK-86110',
    user_name: 'Tanvir Ahmed',
    area_name: 'Khulshi Residential Hub',
    slot_number: 'KM-01',
  },
  {
    payment_id: 4,
    booking_id: 4,
    amount: 500,
    payment_method: 'bKash',
    payment_status: 'Paid',
    payment_date: '2026-10-10 16:18:00',
    transaction_ref: 'BK-2025-9482',
    booking_code: 'PK-8842',
    user_name: 'Dr. Kamrul Zaman',
    area_name: 'GEC Circle Hub',
    slot_number: 'C-12',
  },
];

const INITIAL_GATE_LOGS: GateLog[] = [
  {
    log_id: 1,
    plate_number: 'DHK-METRO-GA-11-2045',
    vehicle_name: 'Toyota Corolla Altis',
    hub_name: 'GEC Circle Hub',
    gate_id: 'Gate North #02',
    detection_time: 'Today, 09:30:14 AM',
    ocr_match_percent: 99.8,
    status: 'Inside Bay',
    barrier_clearance: 'RFID Verified (380ms)',
  },
  {
    log_id: 2,
    plate_number: 'CTG-HA-12-8840',
    vehicle_name: 'Honda CB Hornet',
    hub_name: 'Khulshi Residential Terminal',
    gate_id: 'Gate South #01',
    detection_time: 'Yesterday, 06:14:22 PM',
    ocr_match_percent: 98.4,
    status: 'Exited Clearance',
    barrier_clearance: 'Optical ANPR Match',
  },
  {
    log_id: 3,
    plate_number: 'DHK-METRO-GA-11-2045',
    vehicle_name: 'Toyota Corolla Altis',
    hub_name: 'Agrabad Commercial Hub',
    gate_id: 'Main Inbound Gate #04',
    detection_time: '07 Oct 2026, 08:45:00 AM',
    ocr_match_percent: 99.4,
    status: 'Completed',
    barrier_clearance: 'RFID Verified (410ms)',
  },
  {
    log_id: 4,
    plate_number: 'DHK-METRO-GHA-7731',
    vehicle_name: 'Toyota Premio (Unregistered)',
    hub_name: 'Bahaddarhat Terminal',
    gate_id: 'Gate West #01',
    detection_time: 'Today, 04:35:49 PM',
    ocr_match_percent: 82.1,
    status: 'Diverted',
    barrier_clearance: 'Mismatch (Cashier Hold)',
  },
];

const INITIAL_NOTIFICATIONS: AdminNotification[] = [
  {
    notification_id: 1,
    notification_type: 'New Booking',
    booking_id: 1,
    booking_code: 'PK-88219',
    customer_name: 'Tanvir Ahmed',
    customer_email: 'tanvir@parkease.ctg',
    parking_area: 'GEC Circle Hub',
    parking_slot_number: 'C-04',
    vehicle_number: 'DHK-METRO-GA-11-2045',
    booking_date: '2026-10-10',
    start_time: '09:30',
    duration_hours: 8,
    total_price: 1000,
    booking_status: 'Confirmed',
    message: 'New parking reservation confirmed for Bay C-04 at GEC Circle Hub by Tanvir Ahmed.',
    is_read: false,
    created_at: '2026-10-10 09:20:00',
  },
  {
    notification_id: 2,
    notification_type: 'New Booking',
    booking_id: 4,
    booking_code: 'PK-8842',
    customer_name: 'Dr. Kamrul Zaman',
    customer_email: 'kamrul@chattogram.gov.bd',
    parking_area: 'GEC Circle Hub',
    parking_slot_number: 'C-12',
    vehicle_number: 'DHK-METRO-GA-35-1829',
    booking_date: '2026-10-10',
    start_time: '16:30',
    duration_hours: 2,
    total_price: 120,
    booking_status: 'Confirmed',
    message: 'New parking reservation confirmed for Bay C-12 at GEC Circle Hub by Dr. Kamrul Zaman.',
    is_read: true,
    created_at: '2026-10-10 16:15:00',
  },
];

class MockDbService {
  private data: DbSchema;

  constructor() {
    this.data = this.loadData();
    // Run initial no-show grace check
    this.processNoShowCancellations();
    // Run background automatic no-show cancellation
    if (typeof window !== 'undefined') {
      window.setInterval(() => {
        this.processNoShowCancellations();
      }, 5000);
    }
  }

  private loadData(): DbSchema {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!parsed.notifications) {
          parsed.notifications = JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS));
        }
        // Authoritative rate migration for existing browser storage: Car BDT 250/hr, Motorcycle BDT 100/hr
        if (parsed.parking_slots) {
          parsed.parking_slots.forEach((s: ParkingSlot) => {
            s.price_per_hour = s.vehicle_type === 'Car' ? 250 : 100;
          });
        }
        if (parsed.parking_areas) {
          parsed.parking_areas.forEach((a: ParkingArea) => {
            a.car_rate_hourly = 250;
            a.motorcycle_rate_hourly = 100;
          });
        }
        if (parsed.bookings) {
          parsed.bookings.forEach((b: Booking) => {
            const vType = b.vehicle_type || 'Car';
            if (!b.hourly_rate) {
              b.hourly_rate = vType === 'Car' ? 250 : 100;
            }
            if (!b.billable_hours) {
              b.billable_hours = b.duration_hours;
            }
            if (!b.original_amount) {
              b.original_amount = b.duration_hours * b.hourly_rate;
            }
            if (b.booking_status === 'Cancelled' && b.is_no_show && !b.cancellation_reason) {
              b.cancellation_reason = 'Cancelled due to no-show';
            }
          });
        }
        return parsed;
      }
    } catch {
      // Fallback
    }
    return {
      users: INITIAL_USERS,
      vehicles: INITIAL_VEHICLES,
      parking_areas: INITIAL_AREAS,
      parking_slots: INITIAL_SLOTS,
      bookings: INITIAL_BOOKINGS,
      payments: INITIAL_PAYMENTS,
      gate_logs: INITIAL_GATE_LOGS,
      notifications: JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS)),
    };
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // Ignore
    }
  }

  public resetToDefault() {
    this.data = {
      users: JSON.parse(JSON.stringify(INITIAL_USERS)),
      vehicles: JSON.parse(JSON.stringify(INITIAL_VEHICLES)),
      parking_areas: JSON.parse(JSON.stringify(INITIAL_AREAS)),
      parking_slots: JSON.parse(JSON.stringify(INITIAL_SLOTS)),
      bookings: JSON.parse(JSON.stringify(INITIAL_BOOKINGS)),
      payments: JSON.parse(JSON.stringify(INITIAL_PAYMENTS)),
      gate_logs: JSON.parse(JSON.stringify(INITIAL_GATE_LOGS)),
      notifications: JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS)),
    };
    this.save();
  }


  // Users
  public getUsers(): User[] {
    return [...this.data.users];
  }

  public getUserById(id: number): User | undefined {
    return this.data.users.find((u) => u.user_id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public updateUserStatus(userId: number, status: 'Active' | 'Blocked'): boolean {
    const user = this.data.users.find((u) => u.user_id === userId);
    if (!user) return false;
    user.status = status;
    this.save();
    return true;
  }

  public updateProfile(userId: number, fullName: string, phone: string): boolean {
    const user = this.data.users.find((u) => u.user_id === userId);
    if (!user) return false;
    user.full_name = fullName;
    user.phone = phone;
    this.save();
    return true;
  }

  public changePassword(userId: number, newPasswordHash: string): boolean {
    const user = this.data.users.find((u) => u.user_id === userId);
    if (!user) return false;
    user.password_hash = newPasswordHash;
    this.save();
    return true;
  }

  public registerUser(
    fullName: string,
    email: string,
    phone: string,
    passwordHash: string,
    nid?: string
  ): { success: boolean; user?: User; error?: string } {
    if (this.getUserByEmail(email)) {
      return { success: false, error: 'Email already registered' };
    }
    const newId = this.data.users.length ? Math.max(...this.data.users.map((u) => u.user_id)) + 1 : 1;
    const newUser: User = {
      user_id: newId,
      full_name: fullName,
      email,
      phone,
      password_hash: passwordHash,
      role: 'user',
      status: 'Active',
      nid,
      wallet_balance: 500,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    this.data.users.push(newUser);
    this.save();
    return { success: true, user: newUser };
  }

  // Vehicles
  public getVehiclesByUserId(userId: number): Vehicle[] {
    return this.data.vehicles.filter((v) => v.user_id === userId && v.status === 'Active');
  }

  public getAllVehicles(): Vehicle[] {
    return [...this.data.vehicles];
  }

  public addVehicle(
    userId: number,
    vehicleNumber: string,
    vehicleType: 'Car' | 'Motorcycle',
    brand: string,
    model: string
  ): { success: boolean; vehicle?: Vehicle; error?: string } {
    const exists = this.data.vehicles.find(
      (v) => v.vehicle_number.toUpperCase() === vehicleNumber.trim().toUpperCase()
    );
    if (exists) {
      return { success: false, error: 'Vehicle registration number already exists in municipal registry' };
    }
    const newId = this.data.vehicles.length ? Math.max(...this.data.vehicles.map((v) => v.vehicle_id)) + 1 : 1;
    const isFirst = this.getVehiclesByUserId(userId).length === 0;
    const newVehicle: Vehicle = {
      vehicle_id: newId,
      user_id: userId,
      vehicle_number: vehicleNumber.trim().toUpperCase(),
      vehicle_type: vehicleType,
      brand,
      model,
      status: 'Active',
      is_default: isFirst,
      rfid_tag: `RFID-CTG-${Math.floor(10000 + Math.random() * 90000)}`,
      brta_verified: true,
    };
    this.data.vehicles.push(newVehicle);
    this.save();
    return { success: true, vehicle: newVehicle };
  }

  public setDefaultVehicle(userId: number, vehicleId: number): boolean {
    const userVehicles = this.data.vehicles.filter((v) => v.user_id === userId);
    userVehicles.forEach((v) => {
      v.is_default = v.vehicle_id === vehicleId;
    });
    this.save();
    return true;
  }

  public deleteVehicle(userId: number, vehicleId: number): boolean {
    const vehicle = this.data.vehicles.find((v) => v.vehicle_id === vehicleId && v.user_id === userId);
    if (!vehicle) return false;
    vehicle.status = 'Inactive';
    this.save();
    return true;
  }

  // Parking Areas
  public getAreas(): ParkingArea[] {
    return [...this.data.parking_areas];
  }

  public getAreaById(areaId: number): ParkingArea | undefined {
    return this.data.parking_areas.find((a) => a.area_id === areaId);
  }

  public addArea(area: Omit<ParkingArea, 'area_id'>): ParkingArea {
    const newId = this.data.parking_areas.length
      ? Math.max(...this.data.parking_areas.map((a) => a.area_id)) + 1
      : 1;
    const newArea: ParkingArea = { ...area, area_id: newId };
    this.data.parking_areas.push(newArea);
    this.save();
    return newArea;
  }

  public updateAreaStatus(areaId: number, status: 'Active' | 'Inactive'): boolean {
    const area = this.data.parking_areas.find((a) => a.area_id === areaId);
    if (!area) return false;
    area.status = status;
    this.save();
    return true;
  }

  // Parking Slots
  public getSlotsByArea(areaId: number): ParkingSlot[] {
    return this.data.parking_slots.filter((s) => s.area_id === areaId);
  }

  public getAllSlots(): ParkingSlot[] {
    return [...this.data.parking_slots];
  }

  public getSlotById(slotId: number): ParkingSlot | undefined {
    return this.data.parking_slots.find((s) => s.slot_id === slotId);
  }

  public updateSlotStatus(slotId: number, status: SlotStatus): boolean {
    const slot = this.data.parking_slots.find((s) => s.slot_id === slotId);
    if (!slot) return false;
    slot.status = status;
    this.save();
    return true;
  }

  public addSlot(slot: Omit<ParkingSlot, 'slot_id'>): { success: boolean; slot?: ParkingSlot; error?: string } {
    const exists = this.data.parking_slots.find(
      (s) => s.area_id === slot.area_id && s.slot_number.toUpperCase() === slot.slot_number.toUpperCase()
    );
    if (exists) {
      return { success: false, error: 'Slot number already exists in this area' };
    }
    const newId = this.data.parking_slots.length
      ? Math.max(...this.data.parking_slots.map((s) => s.slot_id)) + 1
      : 1;
    const newSlot: ParkingSlot = { ...slot, slot_id: newId };
    this.data.parking_slots.push(newSlot);
    this.save();
    return { success: true, slot: newSlot };
  }

  // Overlap business rule check:
  // Slot is free if no Confirmed booking overlaps the requested time window AND slot is not Blocked
  public checkSlotOverlap(
    slotId: number,
    bookingDate: string,
    bookingTime: string, // "HH:MM"
    durationHours: number,
    excludeBookingId?: number
  ): { available: boolean; reason?: string } {
    const slot = this.getSlotById(slotId);
    if (!slot) return { available: false, reason: 'Slot does not exist' };
    if (slot.status === 'Blocked') {
      return { available: false, reason: 'Slot is currently blocked by administration' };
    }

    // Convert requested window to start and end minutes
    const [reqHours, reqMins] = bookingTime.split(':').map(Number);
    const reqStart = reqHours * 60 + reqMins;
    const reqEnd = reqStart + durationHours * 60;

    const conflictingBooking = this.data.bookings.find((b) => {
      if (b.slot_id !== slotId) return false;
      if (b.booking_date !== bookingDate) return false;
      if (b.booking_status !== 'Confirmed') return false;
      if (excludeBookingId && b.booking_id === excludeBookingId) return false;

      const [bHours, bMins] = b.booking_time.split(':').map(Number);
      const bStart = bHours * 60 + bMins;
      const bEnd = bStart + b.duration_hours * 60;

      // Overlap condition: reqStart < bEnd AND reqEnd > bStart
      return reqStart < bEnd && reqEnd > bStart;
    });

    if (conflictingBooking) {
      return {
        available: false,
        reason: `Slot is already booked for this window (${conflictingBooking.booking_time} for ${conflictingBooking.duration_hours}h)`,
      };
    }

    return { available: true };
  }

  // Create Booking with strict backend hourly calculation (Car: BDT 250, Motorcycle: BDT 100)
  public createBooking(params: {
    userId: number;
    vehicleId: number;
    slotId: number;
    bookingDate: string;
    bookingTime: string;
    durationHours: number;
  }): { success: boolean; booking?: Booking; error?: string } {
    const user = this.getUserById(params.userId);
    if (!user) return { success: false, error: 'User does not exist' };
    if (user.status === 'Blocked') return { success: false, error: 'User account is blocked' };

    const vehicle = this.data.vehicles.find(
      (v) => v.vehicle_id === params.vehicleId && v.user_id === params.userId && v.status === 'Active'
    );
    if (!vehicle) return { success: false, error: 'Selected vehicle is invalid or does not belong to you' };

    const slot = this.getSlotById(params.slotId);
    if (!slot) return { success: false, error: 'Slot does not exist' };

    if (slot.vehicle_type !== vehicle.vehicle_type) {
      return {
        success: false,
        error: `Vehicle type (${vehicle.vehicle_type}) does not match slot type (${slot.vehicle_type})`,
      };
    }

    // Second check right before saving (Race condition prevention)
    const check = this.checkSlotOverlap(
      params.slotId,
      params.bookingDate,
      params.bookingTime,
      params.durationHours
    );
    if (!check.available) {
      return { success: false, error: check.reason || 'Slot is no longer available' };
    }

    // Authoritative backend hourly rate calculation - NEVER trust price from browser
    // As per project business rules: round up partial hours to full billable hours (e.g. 1.5 hrs -> 2 hrs)
    const hourlyRate = vehicle.vehicle_type === 'Car' ? CAR_HOURLY_RATE : BIKE_HOURLY_RATE;
    const billableHours = Math.max(1, Math.ceil(params.durationHours));
    const priceTotal = hourlyRate * billableHours;
    const newId = this.data.bookings.length
      ? Math.max(...this.data.bookings.map((b) => b.booking_id)) + 1
      : 1;
    const bookingCode = `PK-${Math.floor(10000 + Math.random() * 90000)}`;

    const area = this.getAreaById(slot.area_id);

    const newBooking: Booking = {
      booking_id: newId,
      booking_code: bookingCode,
      user_id: params.userId,
      vehicle_id: params.vehicleId,
      slot_id: params.slotId,
      booking_date: params.bookingDate,
      booking_time: params.bookingTime,
      duration_hours: billableHours,
      hourly_rate: hourlyRate,
      original_amount: priceTotal,
      billable_hours: billableHours,
      extra_amount: 0,
      price_total: priceTotal,
      payment_status: 'Pending',
      booking_status: 'Confirmed',
      created_at: formatBangladeshDateTime(),
      user_name: user.full_name,
      user_phone: user.phone,
      vehicle_number: vehicle.vehicle_number,
      vehicle_model: vehicle.model,
      vehicle_type: vehicle.vehicle_type,
      area_name: area ? area.area_name : 'Municipal Hub',
      slot_number: slot.slot_number,
    };

    this.data.bookings.push(newBooking);
    // Mark slot as booked for visual feedback
    slot.status = 'Booked';

    // Transactionally generate persistent admin notification
    const newNotifId = this.data.notifications.length
      ? Math.max(...this.data.notifications.map((n) => n.notification_id)) + 1
      : 1;

    const notification: AdminNotification = {
      notification_id: newNotifId,
      notification_type: 'New Booking',
      booking_id: newBooking.booking_id,
      booking_code: newBooking.booking_code,
      customer_name: user.full_name,
      customer_email: user.email,
      parking_area: area ? area.area_name : 'Municipal Hub',
      parking_slot_number: slot.slot_number,
      vehicle_number: vehicle.vehicle_number,
      booking_date: params.bookingDate,
      start_time: params.bookingTime,
      duration_hours: params.durationHours,
      total_price: priceTotal,
      booking_status: 'Confirmed',
      message: `New booking ${bookingCode} by ${user.full_name} for Bay ${slot.slot_number} (${vehicle.vehicle_type} @ ৳${hourlyRate}/hr) at ${area ? area.area_name : 'Municipal Hub'}. Total: ৳${priceTotal}.`,
      is_read: false,
      created_at: newBooking.created_at,
    };
    this.data.notifications.unshift(notification);

    this.save();
    return { success: true, booking: newBooking };
  }

  // Process Payment
  public processPayment(
    bookingId: number,
    paymentMethod: PaymentMethod
  ): { success: boolean; payment?: Payment; error?: string } {
    const booking = this.data.bookings.find((b) => b.booking_id === bookingId);
    if (!booking) return { success: false, error: 'Booking does not exist' };
    if (booking.payment_status === 'Paid') {
      return { success: false, error: 'Booking is already paid' };
    }

    const newPaymentId = this.data.payments.length
      ? Math.max(...this.data.payments.map((p) => p.payment_id)) + 1
      : 1;
    const txRef = `${paymentMethod.substring(0, 2).toUpperCase()}-TXN-${Date.now().toString().slice(-6)}`;

    const newPayment: Payment = {
      payment_id: newPaymentId,
      booking_id: bookingId,
      amount: booking.price_total,
      payment_method: paymentMethod,
      payment_status: 'Paid',
      payment_date: formatBangladeshDateTime(),
      transaction_ref: txRef,
      booking_code: booking.booking_code,
      user_name: booking.user_name,
      area_name: booking.area_name,
      slot_number: booking.slot_number,
    };

    booking.payment_status = 'Paid';
    this.data.payments.push(newPayment);
    this.save();
    return { success: true, payment: newPayment };
  }

  // Explicit Arrival / Check-In Workflow
  public checkInBooking(
    bookingId: number,
    checkInTimeStr?: string
  ): { success: boolean; booking?: Booking; error?: string } {
    const booking = this.data.bookings.find((b) => b.booking_id === bookingId);
    if (!booking) return { success: false, error: 'Booking does not exist' };

    if (booking.booking_status === 'Cancelled') {
      return {
        success: false,
        error: `Cannot check in: Booking has been cancelled (${booking.cancellation_reason || 'Cancelled'})`,
      };
    }

    if (booking.booking_status === 'Completed') {
      return { success: false, error: 'Booking has already been completed and checked out' };
    }

    if (booking.booking_status === 'Checked-In') {
      return { success: true, booking }; // Idempotent
    }

    const arrivalTime = checkInTimeStr || formatBangladeshDateTime();
    booking.check_in_time = arrivalTime;
    booking.booking_status = 'Checked-In';

    const slot = this.getSlotById(booking.slot_id);
    if (slot) {
      slot.status = 'Occupied';
    }

    this.save();
    return { success: true, booking };
  }

  // Calculate Bill using Authoritative Formula:
  // Booked hours = duration selected by customer
  // Total billable hours = booked hours + number of additional hours (rounded up) whenever extra time exceeds booked end time
  // Final parking charge = total billable hours * applicable hourly rate (Car: BDT 250, Bike: BDT 100)
  public calculateBilling(
    bookingId: number,
    checkOutTimeStr?: string
  ): BillingDetails | null {
    const booking = this.data.bookings.find((b) => b.booking_id === bookingId);
    if (!booking) return null;

    const vehicle = this.data.vehicles.find((v) => v.vehicle_id === booking.vehicle_id);
    const vehicleType: VehicleType = vehicle?.vehicle_type || booking.vehicle_type || 'Car';
    const hourlyRate = vehicleType === 'Car' ? CAR_HOURLY_RATE : BIKE_HOURLY_RATE;
    const bookedHours = booking.duration_hours;
    const originalAmount = booking.original_amount ?? (bookedHours * hourlyRate);

    const scheduledStartMs = parseBangladeshDateTime(booking.booking_date, booking.booking_time);
    const scheduledEndMs = scheduledStartMs + bookedHours * 3600 * 1000;

    const scheduledStartStr = `${booking.booking_date} ${booking.booking_time}:00`;
    const scheduledEndDate = new Date(scheduledEndMs);
    const scheduledEndStr = formatBangladeshDateTime(scheduledEndDate);

    const actualCheckInStr = booking.check_in_time || scheduledStartStr;
    const actualCheckOutStr = checkOutTimeStr || booking.check_out_time || formatBangladeshDateTime();

    let exitMs: number;
    if (actualCheckOutStr.includes('T')) {
      exitMs = new Date(actualCheckOutStr).getTime();
    } else if (actualCheckOutStr.includes(' ')) {
      const [dPart, tPart] = actualCheckOutStr.split(' ');
      exitMs = parseBangladeshDateTime(dPart, tPart);
    } else {
      exitMs = Date.now();
    }

    if (isNaN(exitMs)) exitMs = scheduledEndMs;

    let actualDurationMinutes = Math.max(1, Math.round((exitMs - scheduledStartMs) / (60 * 1000)));
    if (booking.check_in_time) {
      const [ciDate, ciTime] = booking.check_in_time.split(' ');
      const ciMs = parseBangladeshDateTime(ciDate, ciTime);
      if (!isNaN(ciMs)) {
        actualDurationMinutes = Math.max(1, Math.round((exitMs - ciMs) / (60 * 1000)));
      }
    }

    // Overtime occurs when actual parking end time exceeds scheduled end time
    let overtimeMinutes = 0;
    let overtimeHours = 0;

    if (exitMs > scheduledEndMs) {
      overtimeMinutes = Math.round((exitMs - scheduledEndMs) / (60 * 1000));
      overtimeHours = Math.ceil(overtimeMinutes / 60);
    }

    const billableHours = bookedHours + overtimeHours;
    const totalCharge = billableHours * hourlyRate;
    const paidAmount = booking.payment_status === 'Paid' ? (booking.original_amount ?? booking.price_total) : 0;
    const outstandingAmount = Math.max(0, totalCharge - paidAmount);

    return {
      vehicle_type: vehicleType,
      hourly_rate: hourlyRate,
      booked_hours: bookedHours,
      original_amount: originalAmount,
      scheduled_start: scheduledStartStr,
      scheduled_end: scheduledEndStr,
      check_in_time: booking.check_in_time,
      check_out_time: actualCheckOutStr,
      actual_duration_minutes: actualDurationMinutes,
      overtime_minutes: overtimeMinutes,
      overtime_hours: overtimeHours,
      billable_hours: billableHours,
      total_charge: totalCharge,
      paid_amount: paidAmount,
      outstanding_amount: outstandingAmount,
    };
  }

  // Check-Out and Payment Settlement (Idempotent, never double charges original amount)
  public checkOutBooking(
    bookingId: number,
    checkOutTimeStr?: string,
    paymentMethod: PaymentMethod = 'bKash'
  ): { success: boolean; booking?: Booking; billing?: BillingDetails; error?: string } {
    const booking = this.data.bookings.find((b) => b.booking_id === bookingId);
    if (!booking) return { success: false, error: 'Booking does not exist' };

    if (booking.booking_status === 'Completed') {
      const existingBilling = this.calculateBilling(bookingId, booking.check_out_time);
      return { success: true, booking, billing: existingBilling || undefined };
    }

    if (booking.booking_status === 'Cancelled') {
      return { success: false, error: 'Cannot check out a cancelled booking' };
    }

    const exitTime = checkOutTimeStr || formatBangladeshDateTime();
    const billing = this.calculateBilling(bookingId, exitTime);
    if (!billing) return { success: false, error: 'Failed to calculate billing' };

    // Record additional payment only for outstanding overtime charge
    if (billing.outstanding_amount > 0) {
      const newPaymentId = this.data.payments.length
        ? Math.max(...this.data.payments.map((p) => p.payment_id)) + 1
        : 1;
      const txRef = `${paymentMethod.substring(0, 2).toUpperCase()}-OVERTIME-${Date.now().toString().slice(-6)}`;

      const overtimePayment: Payment = {
        payment_id: newPaymentId,
        booking_id: bookingId,
        amount: billing.outstanding_amount,
        payment_method: paymentMethod,
        payment_status: 'Paid',
        payment_date: formatBangladeshDateTime(),
        transaction_ref: txRef,
        booking_code: booking.booking_code,
        user_name: booking.user_name,
        area_name: booking.area_name,
        slot_number: booking.slot_number,
      };
      this.data.payments.push(overtimePayment);
    }

    booking.check_out_time = exitTime;
    booking.billable_hours = billing.billable_hours;
    booking.price_total = billing.total_charge;
    booking.extra_amount = billing.total_charge - billing.original_amount;
    booking.booking_status = 'Completed';
    booking.payment_status = 'Paid';

    const slot = this.getSlotById(booking.slot_id);
    if (slot) {
      slot.status = 'Available';
    }

    this.save();
    return { success: true, booking, billing };
  }

  // 10-Minute No-Show Automatic Cancellation (Idempotent, Server-side logic)
  public processNoShowCancellations(customNowMs?: number): {
    cancelledCount: number;
    cancelledBookings: Booking[];
  } {
    const nowMs = customNowMs ?? Date.now();
    const GRACE_PERIOD_MS = 10 * 60 * 1000; // 10 minutes
    const cancelledBookings: Booking[] = [];

    for (const b of this.data.bookings) {
      // Only process bookings that are still 'Confirmed' (have not checked in or already been cancelled/completed)
      if (b.booking_status !== 'Confirmed') continue;

      const startMs = parseBangladeshDateTime(b.booking_date, b.booking_time);
      if (isNaN(startMs)) continue;

      const graceEndMs = startMs + GRACE_PERIOD_MS;

      // Never cancel before full 10-minute grace period has elapsed
      if (nowMs >= graceEndMs) {
        b.booking_status = 'Cancelled';
        b.cancellation_reason = 'Cancelled due to no-show';
        b.is_no_show = true;
        cancelledBookings.push(b);

        // Release slot if no other Confirmed or Checked-In booking conflicts with it
        const slot = this.getSlotById(b.slot_id);
        if (slot && (slot.status === 'Booked' || slot.status === 'Occupied')) {
          const hasOtherActive = this.data.bookings.some(
            (other) =>
              other.booking_id !== b.booking_id &&
              other.slot_id === b.slot_id &&
              (other.booking_status === 'Confirmed' || other.booking_status === 'Checked-In')
          );
          if (!hasOtherActive) {
            slot.status = 'Available';
          }
        }

        // Generate persistent admin notification for cancellation
        const newNotifId = this.data.notifications.length
          ? Math.max(...this.data.notifications.map((n) => n.notification_id)) + 1
          : 1;

        this.data.notifications.unshift({
          notification_id: newNotifId,
          notification_type: 'Cancellation',
          booking_id: b.booking_id,
          booking_code: b.booking_code,
          customer_name: b.user_name || 'Customer',
          customer_email: this.getUserById(b.user_id)?.email || 'citizen@parkease.ctg',
          parking_area: b.area_name || 'Municipal Hub',
          parking_slot_number: b.slot_number || 'Bay',
          vehicle_number: b.vehicle_number || '',
          booking_date: b.booking_date,
          start_time: b.booking_time,
          duration_hours: b.duration_hours,
          total_price: b.price_total,
          booking_status: 'Cancelled',
          message: `Booking ${b.booking_code} was automatically cancelled due to no-show after 10-minute grace period elapsed. Bay ${b.slot_number} released back to public availability.`,
          is_read: false,
          created_at: formatBangladeshDateTime(),
        });
      }
    }

    if (cancelledBookings.length > 0) {
      this.save();
    }

    return {
      cancelledCount: cancelledBookings.length,
      cancelledBookings,
    };
  }

  // Force No-Show Expiry helper for testing & immediate audit
  public forceNoShowExpiry(bookingId: number): { success: boolean; booking?: Booking; error?: string } {
    const booking = this.data.bookings.find((b) => b.booking_id === bookingId);
    if (!booking) return { success: false, error: 'Booking not found' };
    if (booking.booking_status !== 'Confirmed') {
      return {
        success: false,
        error: `Booking status is '${booking.booking_status}', only 'Confirmed' bookings can expire for no-show`,
      };
    }

    booking.booking_status = 'Cancelled';
    booking.cancellation_reason = 'Cancelled due to no-show';
    booking.is_no_show = true;

    const slot = this.getSlotById(booking.slot_id);
    if (slot && (slot.status === 'Booked' || slot.status === 'Occupied')) {
      const hasOtherActive = this.data.bookings.some(
        (other) =>
          other.booking_id !== booking.booking_id &&
          other.slot_id === booking.slot_id &&
          (other.booking_status === 'Confirmed' || other.booking_status === 'Checked-In')
      );
      if (!hasOtherActive) {
        slot.status = 'Available';
      }
    }

    const newNotifId = this.data.notifications.length
      ? Math.max(...this.data.notifications.map((n) => n.notification_id)) + 1
      : 1;

    this.data.notifications.unshift({
      notification_id: newNotifId,
      notification_type: 'Cancellation',
      booking_id: booking.booking_id,
      booking_code: booking.booking_code,
      customer_name: booking.user_name || 'Customer',
      customer_email: this.getUserById(booking.user_id)?.email || 'citizen@parkease.ctg',
      parking_area: booking.area_name || 'Municipal Hub',
      parking_slot_number: booking.slot_number || 'Bay',
      vehicle_number: booking.vehicle_number || '',
      booking_date: booking.booking_date,
      start_time: booking.booking_time,
      duration_hours: booking.duration_hours,
      total_price: booking.price_total,
      booking_status: 'Cancelled',
      message: `Booking ${booking.booking_code} cancelled due to no-show after 10-minute arrival grace period elapsed. Bay ${booking.slot_number} released.`,
      is_read: false,
      created_at: formatBangladeshDateTime(),
    });

    this.save();
    return { success: true, booking };
  }

  // Cancel Booking
  public cancelBooking(
    bookingId: number,
    userId: number,
    isAdmin: boolean,
    reason?: string
  ): { success: boolean; error?: string } {
    const booking = this.data.bookings.find((b) => b.booking_id === bookingId);
    if (!booking) return { success: false, error: 'Booking does not exist' };

    if (!isAdmin && booking.user_id !== userId) {
      return { success: false, error: 'Unauthorized to cancel this booking' };
    }

    if (booking.booking_status === 'Cancelled') {
      return { success: false, error: 'Booking is already cancelled' };
    }

    booking.booking_status = 'Cancelled';
    booking.cancellation_reason = reason || 'Cancelled by user/administrator';

    const slot = this.getSlotById(booking.slot_id);
    if (slot && (slot.status === 'Booked' || slot.status === 'Occupied')) {
      const hasOtherActive = this.data.bookings.some(
        (other) =>
          other.booking_id !== booking.booking_id &&
          other.slot_id === booking.slot_id &&
          (other.booking_status === 'Confirmed' || other.booking_status === 'Checked-In')
      );
      if (!hasOtherActive) {
        slot.status = 'Available';
      }
    }

    this.save();
    return { success: true };
  }

  // Bookings getters
  public getBookingsByUser(userId: number): Booking[] {
    return this.data.bookings
      .filter((b) => b.user_id === userId)
      .sort((a, b) => b.booking_id - a.booking_id);
  }

  public getAllBookings(): Booking[] {
    return [...this.data.bookings].sort((a, b) => b.booking_id - a.booking_id);
  }

  public getBookingById(bookingId: number): Booking | undefined {
    return this.data.bookings.find((b) => b.booking_id === bookingId);
  }

  // Payments getters
  public getAllPayments(): Payment[] {
    return [...this.data.payments].sort((a, b) => b.payment_id - a.payment_id);
  }

  // Gate Logs
  public getGateLogs(): GateLog[] {
    return [...this.data.gate_logs];
  }

  // Admin Notifications
  public getNotifications(): AdminNotification[] {
    // Return notifications with synced/validated live booking relations
    return this.data.notifications.map((n) => {
      const b = this.data.bookings.find((item) => item.booking_id === n.booking_id);
      if (b) {
        return {
          ...n,
          booking_code: b.booking_code,
          customer_name: b.user_name || n.customer_name,
          customer_email: this.getUserById(b.user_id)?.email || n.customer_email,
          parking_area: b.area_name || n.parking_area,
          parking_slot_number: b.slot_number || n.parking_slot_number,
          vehicle_number: b.vehicle_number || n.vehicle_number,
          booking_date: b.booking_date,
          start_time: b.booking_time,
          duration_hours: b.duration_hours,
          total_price: b.price_total,
          booking_status: b.booking_status,
        };
      }
      return n;
    });
  }

  public getUnreadNotificationsCount(): number {
    return this.data.notifications.filter((n) => !n.is_read).length;
  }

  public markNotificationAsRead(notificationId: number): boolean {
    const notif = this.data.notifications.find((n) => n.notification_id === notificationId);
    if (!notif) return false;
    notif.is_read = true;
    this.save();
    return true;
  }

  public markAllNotificationsAsRead(): boolean {
    this.data.notifications.forEach((n) => {
      n.is_read = true;
    });
    this.save();
    return true;
  }

  public deleteNotification(notificationId: number): boolean {
    const idx = this.data.notifications.findIndex((n) => n.notification_id === notificationId);
    if (idx === -1) return false;
    this.data.notifications.splice(idx, 1);
    this.save();
    return true;
  }
}


export const mockDb = new MockDbService();
