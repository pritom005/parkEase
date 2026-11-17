-- ============================================================================
-- OLD DESIGN (MySQL) - NOT USED
-- Replaced by database/seed_firestore.py. Kept only for historical reference.
-- ============================================================================

-- ParkEase Seed Data for Chattogram City
USE parkease_db;

-- 1. Insert Default Admin and User
INSERT INTO users (user_id, full_name, email, phone, password_hash, role, status) VALUES
(1, 'System Administrator', 'admin@parkease.com', '01711000001', 'scrypt:32768:8:1$12345$83e60128cf7e3d64287895fbc9a7ebf4c51e360f04c6ca934f2a24558e807ca5fdb76b1f3aa6e17bc83c3472097327ef3e3f6ff84cb15093f18579ad048d08cb', 'admin', 'Active'),
(2, 'Tanvir Ahmed', 'user@parkease.com', '01819000002', 'scrypt:32768:8:1$12345$83e60128cf7e3d64287895fbc9a7ebf4c51e360f04c6ca934f2a24558e807ca5fdb76b1f3aa6e17bc83c3472097327ef3e3f6ff84cb15093f18579ad048d08cb', 'user', 'Active'),
(3, 'Nusrat Jahan', 'nusrat@parkease.com', '01912000003', 'scrypt:32768:8:1$12345$83e60128cf7e3d64287895fbc9a7ebf4c51e360f04c6ca934f2a24558e807ca5fdb76b1f3aa6e17bc83c3472097327ef3e3f6ff84cb15093f18579ad048d08cb', 'user', 'Active');

-- 2. Insert The 6 Required Parking Areas in Chattogram City
INSERT INTO parking_areas (area_id, area_name, location, status) VALUES
(1, 'GEC Circle', 'GEC More, Near Sanmar Ocean City, Chattogram', 'Active'),
(2, 'Agrabad', 'Agrabad, Near WTC, Chattogram', 'Active'),
(3, 'Khulshi', 'Zakir Hossain Road, Khulshi, Chattogram', 'Active'),
(4, 'Bahaddarhat', 'Bahaddarhat Area, Chattogram', 'Active'),
(5, 'Patenga', 'Patenga Beach Road, Airport Crossing, Chattogram', 'Active'),
(6, 'Chawkbazar', 'College Road, Near Parade Ground, Chattogram', 'Active');

-- 3. Insert 130 Parking Slots (84 Car, 46 Motorcycle), One Area at a Time

-- Area 1: GEC Circle (20 Car + 12 Motorcycle = 32)
INSERT INTO parking_slots (slot_id, area_id, slot_number, vehicle_type, price_per_hour, day_price, status) VALUES
(1, 1, 'C-01', 'Car', 250.00, 2000.00, 'Available'),
(2, 1, 'C-02', 'Car', 250.00, 2000.00, 'Available'),
(3, 1, 'C-03', 'Car', 250.00, 2000.00, 'Available'),
(4, 1, 'C-04', 'Car', 250.00, 2000.00, 'Available'),
(5, 1, 'C-05', 'Car', 250.00, 2000.00, 'Available'),
(6, 1, 'C-06', 'Car', 250.00, 2000.00, 'Available'),
(7, 1, 'C-07', 'Car', 250.00, 2000.00, 'Available'),
(8, 1, 'C-08', 'Car', 250.00, 2000.00, 'Available'),
(9, 1, 'C-09', 'Car', 250.00, 2000.00, 'Available'),
(10, 1, 'C-10', 'Car', 250.00, 2000.00, 'Available'),
(11, 1, 'C-11', 'Car', 250.00, 2000.00, 'Available'),
(12, 1, 'C-12', 'Car', 250.00, 2000.00, 'Available'),
(13, 1, 'C-13', 'Car', 250.00, 2000.00, 'Available'),
(14, 1, 'C-14', 'Car', 250.00, 2000.00, 'Available'),
(15, 1, 'C-15', 'Car', 250.00, 2000.00, 'Available'),
(16, 1, 'C-16', 'Car', 250.00, 2000.00, 'Available'),
(17, 1, 'C-17', 'Car', 250.00, 2000.00, 'Available'),
(18, 1, 'C-18', 'Car', 250.00, 2000.00, 'Available'),
(19, 1, 'C-19', 'Car', 250.00, 2000.00, 'Available'),
(20, 1, 'C-20', 'Car', 250.00, 2000.00, 'Available'),
(21, 1, 'M-01', 'Motorcycle', 100.00, 1000.00, 'Available'),
(22, 1, 'M-02', 'Motorcycle', 100.00, 1000.00, 'Available'),
(23, 1, 'M-03', 'Motorcycle', 100.00, 1000.00, 'Available'),
(24, 1, 'M-04', 'Motorcycle', 100.00, 1000.00, 'Available'),
(25, 1, 'M-05', 'Motorcycle', 100.00, 1000.00, 'Available'),
(26, 1, 'M-06', 'Motorcycle', 100.00, 1000.00, 'Available'),
(27, 1, 'M-07', 'Motorcycle', 100.00, 1000.00, 'Available'),
(28, 1, 'M-08', 'Motorcycle', 100.00, 1000.00, 'Available'),
(29, 1, 'M-09', 'Motorcycle', 100.00, 1000.00, 'Available'),
(30, 1, 'M-10', 'Motorcycle', 100.00, 1000.00, 'Available'),
(31, 1, 'M-11', 'Motorcycle', 100.00, 1000.00, 'Available'),
(32, 1, 'M-12', 'Motorcycle', 100.00, 1000.00, 'Available');

-- Area 2: Agrabad (20 Car + 10 Motorcycle = 30)
INSERT INTO parking_slots (slot_id, area_id, slot_number, vehicle_type, price_per_hour, day_price, status) VALUES
(33, 2, 'C-01', 'Car', 250.00, 2000.00, 'Available'),
(34, 2, 'C-02', 'Car', 250.00, 2000.00, 'Available'),
(35, 2, 'C-03', 'Car', 250.00, 2000.00, 'Available'),
(36, 2, 'C-04', 'Car', 250.00, 2000.00, 'Available'),
(37, 2, 'C-05', 'Car', 250.00, 2000.00, 'Available'),
(38, 2, 'C-06', 'Car', 250.00, 2000.00, 'Available'),
(39, 2, 'C-07', 'Car', 250.00, 2000.00, 'Available'),
(40, 2, 'C-08', 'Car', 250.00, 2000.00, 'Available'),
(41, 2, 'C-09', 'Car', 250.00, 2000.00, 'Available'),
(42, 2, 'C-10', 'Car', 250.00, 2000.00, 'Available'),
(43, 2, 'C-11', 'Car', 250.00, 2000.00, 'Available'),
(44, 2, 'C-12', 'Car', 250.00, 2000.00, 'Available'),
(45, 2, 'C-13', 'Car', 250.00, 2000.00, 'Available'),
(46, 2, 'C-14', 'Car', 250.00, 2000.00, 'Available'),
(47, 2, 'C-15', 'Car', 250.00, 2000.00, 'Available'),
(48, 2, 'C-16', 'Car', 250.00, 2000.00, 'Available'),
(49, 2, 'C-17', 'Car', 250.00, 2000.00, 'Available'),
(50, 2, 'C-18', 'Car', 250.00, 2000.00, 'Available'),
(51, 2, 'C-19', 'Car', 250.00, 2000.00, 'Available'),
(52, 2, 'C-20', 'Car', 250.00, 2000.00, 'Available'),
(53, 2, 'M-01', 'Motorcycle', 100.00, 1000.00, 'Available'),
(54, 2, 'M-02', 'Motorcycle', 100.00, 1000.00, 'Available'),
(55, 2, 'M-03', 'Motorcycle', 100.00, 1000.00, 'Available'),
(56, 2, 'M-04', 'Motorcycle', 100.00, 1000.00, 'Available'),
(57, 2, 'M-05', 'Motorcycle', 100.00, 1000.00, 'Available'),
(58, 2, 'M-06', 'Motorcycle', 100.00, 1000.00, 'Available'),
(59, 2, 'M-07', 'Motorcycle', 100.00, 1000.00, 'Available'),
(60, 2, 'M-08', 'Motorcycle', 100.00, 1000.00, 'Available'),
(61, 2, 'M-09', 'Motorcycle', 100.00, 1000.00, 'Available'),
(62, 2, 'M-10', 'Motorcycle', 100.00, 1000.00, 'Available');

-- Area 3: Khulshi (12 Car + 6 Motorcycle = 18)
INSERT INTO parking_slots (slot_id, area_id, slot_number, vehicle_type, price_per_hour, day_price, status) VALUES
(63, 3, 'C-01', 'Car', 250.00, 2000.00, 'Available'),
(64, 3, 'C-02', 'Car', 250.00, 2000.00, 'Available'),
(65, 3, 'C-03', 'Car', 250.00, 2000.00, 'Available'),
(66, 3, 'C-04', 'Car', 250.00, 2000.00, 'Available'),
(67, 3, 'C-05', 'Car', 250.00, 2000.00, 'Available'),
(68, 3, 'C-06', 'Car', 250.00, 2000.00, 'Available'),
(69, 3, 'C-07', 'Car', 250.00, 2000.00, 'Available'),
(70, 3, 'C-08', 'Car', 250.00, 2000.00, 'Available'),
(71, 3, 'C-09', 'Car', 250.00, 2000.00, 'Available'),
(72, 3, 'C-10', 'Car', 250.00, 2000.00, 'Available'),
(73, 3, 'C-11', 'Car', 250.00, 2000.00, 'Available'),
(74, 3, 'C-12', 'Car', 250.00, 2000.00, 'Available'),
(75, 3, 'M-01', 'Motorcycle', 100.00, 1000.00, 'Available'),
(76, 3, 'M-02', 'Motorcycle', 100.00, 1000.00, 'Available'),
(77, 3, 'M-03', 'Motorcycle', 100.00, 1000.00, 'Available'),
(78, 3, 'M-04', 'Motorcycle', 100.00, 1000.00, 'Available'),
(79, 3, 'M-05', 'Motorcycle', 100.00, 1000.00, 'Available'),
(80, 3, 'M-06', 'Motorcycle', 100.00, 1000.00, 'Available');

-- Area 4: Bahaddarhat (14 Car + 6 Motorcycle = 20)
INSERT INTO parking_slots (slot_id, area_id, slot_number, vehicle_type, price_per_hour, day_price, status) VALUES
(81, 4, 'C-01', 'Car', 250.00, 2000.00, 'Available'),
(82, 4, 'C-02', 'Car', 250.00, 2000.00, 'Available'),
(83, 4, 'C-03', 'Car', 250.00, 2000.00, 'Available'),
(84, 4, 'C-04', 'Car', 250.00, 2000.00, 'Available'),
(85, 4, 'C-05', 'Car', 250.00, 2000.00, 'Available'),
(86, 4, 'C-06', 'Car', 250.00, 2000.00, 'Available'),
(87, 4, 'C-07', 'Car', 250.00, 2000.00, 'Available'),
(88, 4, 'C-08', 'Car', 250.00, 2000.00, 'Available'),
(89, 4, 'C-09', 'Car', 250.00, 2000.00, 'Available'),
(90, 4, 'C-10', 'Car', 250.00, 2000.00, 'Available'),
(91, 4, 'C-11', 'Car', 250.00, 2000.00, 'Available'),
(92, 4, 'C-12', 'Car', 250.00, 2000.00, 'Available'),
(93, 4, 'C-13', 'Car', 250.00, 2000.00, 'Available'),
(94, 4, 'C-14', 'Car', 250.00, 2000.00, 'Available'),
(95, 4, 'M-01', 'Motorcycle', 100.00, 1000.00, 'Available'),
(96, 4, 'M-02', 'Motorcycle', 100.00, 1000.00, 'Available'),
(97, 4, 'M-03', 'Motorcycle', 100.00, 1000.00, 'Available'),
(98, 4, 'M-04', 'Motorcycle', 100.00, 1000.00, 'Available'),
(99, 4, 'M-05', 'Motorcycle', 100.00, 1000.00, 'Available'),
(100, 4, 'M-06', 'Motorcycle', 100.00, 1000.00, 'Available');

-- Area 5: Patenga (10 Car + 5 Motorcycle = 15)
INSERT INTO parking_slots (slot_id, area_id, slot_number, vehicle_type, price_per_hour, day_price, status) VALUES
(101, 5, 'C-01', 'Car', 250.00, 2000.00, 'Available'),
(102, 5, 'C-02', 'Car', 250.00, 2000.00, 'Available'),
(103, 5, 'C-03', 'Car', 250.00, 2000.00, 'Available'),
(104, 5, 'C-04', 'Car', 250.00, 2000.00, 'Available'),
(105, 5, 'C-05', 'Car', 250.00, 2000.00, 'Available'),
(106, 5, 'C-06', 'Car', 250.00, 2000.00, 'Available'),
(107, 5, 'C-07', 'Car', 250.00, 2000.00, 'Available'),
(108, 5, 'C-08', 'Car', 250.00, 2000.00, 'Available'),
(109, 5, 'C-09', 'Car', 250.00, 2000.00, 'Available'),
(110, 5, 'C-10', 'Car', 250.00, 2000.00, 'Available'),
(111, 5, 'M-01', 'Motorcycle', 100.00, 1000.00, 'Available'),
(112, 5, 'M-02', 'Motorcycle', 100.00, 1000.00, 'Available'),
(113, 5, 'M-03', 'Motorcycle', 100.00, 1000.00, 'Available'),
(114, 5, 'M-04', 'Motorcycle', 100.00, 1000.00, 'Available'),
(115, 5, 'M-05', 'Motorcycle', 100.00, 1000.00, 'Available');

-- Area 6: Chawkbazar (8 Car + 7 Motorcycle = 15)
INSERT INTO parking_slots (slot_id, area_id, slot_number, vehicle_type, price_per_hour, day_price, status) VALUES
(116, 6, 'C-01', 'Car', 250.00, 2000.00, 'Available'),
(117, 6, 'C-02', 'Car', 250.00, 2000.00, 'Available'),
(118, 6, 'C-03', 'Car', 250.00, 2000.00, 'Available'),
(119, 6, 'C-04', 'Car', 250.00, 2000.00, 'Available'),
(120, 6, 'C-05', 'Car', 250.00, 2000.00, 'Available'),
(121, 6, 'C-06', 'Car', 250.00, 2000.00, 'Available'),
(122, 6, 'C-07', 'Car', 250.00, 2000.00, 'Available'),
(123, 6, 'C-08', 'Car', 250.00, 2000.00, 'Available'),
(124, 6, 'M-01', 'Motorcycle', 100.00, 1000.00, 'Available'),
(125, 6, 'M-02', 'Motorcycle', 100.00, 1000.00, 'Available'),
(126, 6, 'M-03', 'Motorcycle', 100.00, 1000.00, 'Available'),
(127, 6, 'M-04', 'Motorcycle', 100.00, 1000.00, 'Available'),
(128, 6, 'M-05', 'Motorcycle', 100.00, 1000.00, 'Available'),
(129, 6, 'M-06', 'Motorcycle', 100.00, 1000.00, 'Available'),
(130, 6, 'M-07', 'Motorcycle', 100.00, 1000.00, 'Available');

-- 4. Insert Initial User Vehicles
INSERT INTO vehicles (vehicle_id, user_id, vehicle_number, vehicle_type, brand, model, status) VALUES
(1, 2, 'Chatta Metro-Ga 14-2231', 'Car', 'Toyota', 'Premio 2018', 'Active'),
(2, 2, 'Chatta Metro-Ha 12-8954', 'Motorcycle', 'Yamaha', 'FZ-S V3', 'Active'),
(3, 3, 'Chatta Metro-Ga 15-4421', 'Car', 'Honda', 'Civic 2020', 'Active');

-- 5. Insert Sample Bookings
INSERT INTO bookings (booking_id, user_id, vehicle_id, slot_id, booking_date, booking_time, duration_hours, price_total, payment_status, booking_status) VALUES
(1, 2, 1, 1, '2026-11-12', '10:00:00', 3, 750.00, 'Paid', 'Confirmed'),
(2, 2, 2, 21, '2026-11-10', '14:00:00', 2, 200.00, 'Paid', 'Completed');

-- 6. Insert Sample Payments
INSERT INTO payments (payment_id, booking_id, amount, payment_method, payment_status, payment_date) VALUES
(1, 1, 750.00, 'bKash', 'Paid', '2026-11-11 08:30:00'),
(2, 2, 200.00, 'Nagad', 'Paid', '2026-11-10 13:45:00');
