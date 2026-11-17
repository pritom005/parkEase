-- ============================================================================
-- OLD DESIGN (MySQL) - NOT USED
-- Replaced by `python database/seed_firestore.py --demo`. Kept for reference.
-- ============================================================================
-- ParkEase Demo Data Script (database/demo-data.sql)
-- Purpose: Populates realistic sample data for User Portal and Admin Portal.
-- Run once after database/parkease.sql and database/seed.sql.
--
-- IMPORTANT BEFORE RUNNING:
-- Generate a password hash locally with Python + werkzeug (do NOT hardcode passwords):
--   python3 -c "from werkzeug.security import generate_password_hash; import getpass; print(generate_password_hash(getpass.getpass()))"
-- Paste the generated hash into @DEMO_PASSWORD_HASH below before executing.
-- ============================================================================

USE parkease_db;

SET @DEMO_PASSWORD_HASH = '-- PASTE_HASH_HERE';

-- ============================================================================
-- 1. INSERT 20 NEW DEMO USERS (17 Active, 3 Blocked, Role: user)
-- ============================================================================
INSERT INTO users (full_name, email, phone, password_hash, role, status) VALUES
('Rafiqul Islam', 'rafiqul.islam@example.com', '01000000001', @DEMO_PASSWORD_HASH, 'user', 'Active'),
('Farhana Rahman', 'farhana.rahman@example.com', '01000000002', @DEMO_PASSWORD_HASH, 'user', 'Active'),
('Mahmudul Hasan', 'mahmudul.hasan@example.com', '01000000003', @DEMO_PASSWORD_HASH, 'user', 'Active'),
('Sadia Chowdhury', 'sadia.chowdhury@example.com', '01000000004', @DEMO_PASSWORD_HASH, 'user', 'Active'),
('Imran Hossain', 'imran.hossain@example.com', '01000000005', @DEMO_PASSWORD_HASH, 'user', 'Active'),
('Tahmina Akter', 'tahmina.akter@example.com', '01000000006', @DEMO_PASSWORD_HASH, 'user', 'Active'),
('Shafiqur Karim', 'shafiqur.karim@example.com', '01000000007', @DEMO_PASSWORD_HASH, 'user', 'Active'),
('Mehedi Barua', 'mehedi.barua@example.com', '01000000008', @DEMO_PASSWORD_HASH, 'user', 'Active'),
('Fariha Tasnim', 'fariha.tasnim@example.com', '01000000009', @DEMO_PASSWORD_HASH, 'user', 'Active'),
('Ashraful Alam', 'ashraful.alam@example.com', '01000000010', @DEMO_PASSWORD_HASH, 'user', 'Active'),
('Nafisa Sultana', 'nafisa.sultana@example.com', '01000000011', @DEMO_PASSWORD_HASH, 'user', 'Active'),
('Kamrul Uddin', 'kamrul.uddin@example.com', '01000000012', @DEMO_PASSWORD_HASH, 'user', 'Active'),
('Rashedul Haque', 'rashedul.haque@example.com', '01000000013', @DEMO_PASSWORD_HASH, 'user', 'Active'),
('Maliha Tabassum', 'maliha.tabassum@example.com', '01000000014', @DEMO_PASSWORD_HASH, 'user', 'Active'),
('Zahirul Miah', 'zahirul.miah@example.com', '01000000015', @DEMO_PASSWORD_HASH, 'user', 'Active'),
('Sumaiya Nawar', 'sumaiya.nawar@example.com', '01000000016', @DEMO_PASSWORD_HASH, 'user', 'Active'),
('Noman Siddiqui', 'noman.siddiqui@example.com', '01000000017', @DEMO_PASSWORD_HASH, 'user', 'Active'),
('Sabina Yasmin', 'sabina.yasmin@example.com', '01000000018', @DEMO_PASSWORD_HASH, 'user', 'Blocked'),
('Tareq Aziz', 'tareq.aziz@example.com', '01000000019', @DEMO_PASSWORD_HASH, 'user', 'Blocked'),
('Jubayer Ahmed', 'jubayer.ahmed@example.com', '01000000020', @DEMO_PASSWORD_HASH, 'user', 'Blocked');

-- ============================================================================
-- 2. INSERT 28 NEW DEMO VEHICLES (18 Cars, 10 Motorcycles; 25 Active, 3 Inactive)
--    1 extra Car for Tanvir Ahmed (total 3 for Tanvir) + 27 across 20 new users
-- ============================================================================
INSERT INTO vehicles (user_id, vehicle_number, vehicle_type, brand, model, status) VALUES
((SELECT user_id FROM users WHERE email = 'user@parkease.com'), 'Chattogram Metro-Ga 19-3108', 'Car', 'Honda', 'Vezel', 'Active'),

((SELECT user_id FROM users WHERE email = 'rafiqul.islam@example.com'), 'Chattogram Metro-Ga 21-1042', 'Car', 'Toyota', 'Axio', 'Active'),
((SELECT user_id FROM users WHERE email = 'rafiqul.islam@example.com'), 'Chattogram Metro-Ha 15-3021', 'Motorcycle', 'Honda', 'CB Hornet', 'Active'),
((SELECT user_id FROM users WHERE email = 'farhana.rahman@example.com'), 'Chattogram Metro-Ga 18-5514', 'Car', 'Toyota', 'Premio', 'Active'),
((SELECT user_id FROM users WHERE email = 'mahmudul.hasan@example.com'), 'Chattogram Metro-Ga 23-7741', 'Car', 'Honda', 'Vezel', 'Active'),
((SELECT user_id FROM users WHERE email = 'mahmudul.hasan@example.com'), 'Chattogram Metro-Ha 17-6190', 'Motorcycle', 'Yamaha', 'FZ-S', 'Inactive'),
((SELECT user_id FROM users WHERE email = 'sadia.chowdhury@example.com'), 'Chattogram Metro-Ga 16-4802', 'Car', 'Nissan', 'Sunny', 'Active'),
((SELECT user_id FROM users WHERE email = 'imran.hossain@example.com'), 'Chattogram Metro-Ha 19-8215', 'Motorcycle', 'Suzuki', 'Gixxer', 'Active'),
((SELECT user_id FROM users WHERE email = 'tahmina.akter@example.com'), 'Chattogram Metro-Ga 22-6150', 'Car', 'Toyota', 'Premio', 'Active'),
((SELECT user_id FROM users WHERE email = 'shafiqur.karim@example.com'), 'Chattogram Metro-Ga 15-9083', 'Car', 'Honda', 'Vezel', 'Active'),
((SELECT user_id FROM users WHERE email = 'shafiqur.karim@example.com'), 'Chattogram Metro-Ha 14-2740', 'Motorcycle', 'TVS', 'Apache', 'Active'),
((SELECT user_id FROM users WHERE email = 'mehedi.barua@example.com'), 'Chattogram Metro-Ha 18-5412', 'Motorcycle', 'Yamaha', 'FZ-S', 'Active'),
((SELECT user_id FROM users WHERE email = 'fariha.tasnim@example.com'), 'Chattogram Metro-Ga 24-1186', 'Car', 'Honda', 'Vezel', 'Active'),
((SELECT user_id FROM users WHERE email = 'ashraful.alam@example.com'), 'Chattogram Metro-Ga 17-7325', 'Car', 'Nissan', 'Sunny', 'Active'),
((SELECT user_id FROM users WHERE email = 'ashraful.alam@example.com'), 'Chattogram Metro-Ha 20-4469', 'Motorcycle', 'Honda', 'CB Hornet', 'Active'),
((SELECT user_id FROM users WHERE email = 'nafisa.sultana@example.com'), 'Chattogram Metro-Ga 21-8834', 'Car', 'Toyota', 'Axio', 'Active'),
((SELECT user_id FROM users WHERE email = 'kamrul.uddin@example.com'), 'Chattogram Metro-Ga 19-6601', 'Car', 'Toyota', 'Premio', 'Active'),
((SELECT user_id FROM users WHERE email = 'kamrul.uddin@example.com'), 'Chattogram Metro-Ha 16-9503', 'Motorcycle', 'Suzuki', 'Gixxer', 'Active'),
((SELECT user_id FROM users WHERE email = 'rashedul.haque@example.com'), 'Chattogram Metro-Ga 25-1904', 'Car', 'Toyota', 'Axio', 'Active'),
((SELECT user_id FROM users WHERE email = 'rashedul.haque@example.com'), 'Chattogram Metro-Ha 21-5578', 'Motorcycle', 'TVS', 'Apache', 'Active'),
((SELECT user_id FROM users WHERE email = 'maliha.tabassum@example.com'), 'Chattogram Metro-Ga 20-9142', 'Car', 'Nissan', 'Sunny', 'Active'),
((SELECT user_id FROM users WHERE email = 'zahirul.miah@example.com'), 'Chattogram Metro-Ga 14-6318', 'Car', 'Toyota', 'Premio', 'Active'),
((SELECT user_id FROM users WHERE email = 'zahirul.miah@example.com'), 'Chattogram Metro-Ha 13-7824', 'Motorcycle', 'Yamaha', 'FZ-S', 'Active'),
((SELECT user_id FROM users WHERE email = 'sumaiya.nawar@example.com'), 'Chattogram Metro-Ga 22-3570', 'Car', 'Honda', 'Vezel', 'Active'),
((SELECT user_id FROM users WHERE email = 'noman.siddiqui@example.com'), 'Chattogram Metro-Ga 18-7491', 'Car', 'Toyota', 'Axio', 'Active'),
((SELECT user_id FROM users WHERE email = 'sabina.yasmin@example.com'), 'Chattogram Metro-Ga 22-4019', 'Car', 'Toyota', 'Axio', 'Active'),
((SELECT user_id FROM users WHERE email = 'tareq.aziz@example.com'), 'Chattogram Metro-Ga 13-2950', 'Car', 'Nissan', 'Sunny', 'Inactive'),
((SELECT user_id FROM users WHERE email = 'jubayer.ahmed@example.com'), 'Chattogram Metro-Ha 11-4092', 'Motorcycle', 'TVS', 'Apache', 'Inactive');

-- ============================================================================
-- 3A. TANVIR AHMED BOOKINGS (10 New: 1 Active-Now, 1 Tomorrow Pending, 6 Completed, 2 Cancelled)
-- ============================================================================
INSERT INTO bookings (user_id, vehicle_id, slot_id, booking_date, booking_time, duration_hours, price_total, payment_status, booking_status) VALUES
-- T1: Active-now Full Day (Occupied on GEC Circle C-02, Paid)
(
    (SELECT user_id FROM users WHERE email = 'user@parkease.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chatta Metro-Ga 14-2231'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-02'),
    DATE(DATE_SUB(NOW(), INTERVAL 1 HOUR)), TIME_FORMAT(DATE_SUB(NOW(), INTERVAL 1 HOUR), '%H:%i:00'), 24,
    (SELECT s.day_price FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-02'),
    'Paid', 'Confirmed'
),
-- T2: Upcoming Tomorrow (Booked on Agrabad C-01, Pending payment)
(
    (SELECT user_id FROM users WHERE email = 'user@parkease.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 19-3108'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-01'),
    DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00:00', 4,
    (SELECT s.price_per_hour * 4 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-01'),
    'Pending', 'Confirmed'
),
-- T3..T8: 6 Completed across past 30 days
(
    (SELECT user_id FROM users WHERE email = 'user@parkease.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chatta Metro-Ha 12-8954'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Khulshi' AND s.slot_number = 'M-01'),
    DATE_SUB(CURDATE(), INTERVAL 3 DAY), '09:30:00', 3,
    (SELECT s.price_per_hour * 3 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Khulshi' AND s.slot_number = 'M-01'),
    'Paid', 'Completed'
),
(
    (SELECT user_id FROM users WHERE email = 'user@parkease.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chatta Metro-Ga 14-2231'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-12'),
    DATE_SUB(CURDATE(), INTERVAL 7 DAY), '11:00:00', 24,
    (SELECT s.day_price FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-12'),
    'Paid', 'Completed'
),
(
    (SELECT user_id FROM users WHERE email = 'user@parkease.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 19-3108'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Bahaddarhat' AND s.slot_number = 'C-01'),
    DATE_SUB(CURDATE(), INTERVAL 12 DAY), '14:00:00', 2,
    (SELECT s.price_per_hour * 2 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Bahaddarhat' AND s.slot_number = 'C-01'),
    'Paid', 'Completed'
),
(
    (SELECT user_id FROM users WHERE email = 'user@parkease.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chatta Metro-Ha 12-8954'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'M-08'),
    DATE_SUB(CURDATE(), INTERVAL 18 DAY), '17:00:00', 24,
    (SELECT s.day_price FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'M-08'),
    'Paid', 'Completed'
),
(
    (SELECT user_id FROM users WHERE email = 'user@parkease.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chatta Metro-Ha 12-8954'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Chawkbazar' AND s.slot_number = 'M-01'),
    DATE_SUB(CURDATE(), INTERVAL 22 DAY), '15:00:00', 4,
    (SELECT s.price_per_hour * 4 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Chawkbazar' AND s.slot_number = 'M-01'),
    'Paid', 'Completed'
),
(
    (SELECT user_id FROM users WHERE email = 'user@parkease.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chatta Metro-Ga 14-2231'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Patenga' AND s.slot_number = 'C-01'),
    DATE_SUB(CURDATE(), INTERVAL 27 DAY), '12:00:00', 5,
    (SELECT s.price_per_hour * 5 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Patenga' AND s.slot_number = 'C-01'),
    'Paid', 'Completed'
),
-- T9..T10: 2 Cancelled (Pending payment)
(
    (SELECT user_id FROM users WHERE email = 'user@parkease.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 19-3108'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Khulshi' AND s.slot_number = 'C-01'),
    DATE_SUB(CURDATE(), INTERVAL 9 DAY), '16:00:00', 3,
    (SELECT s.price_per_hour * 3 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Khulshi' AND s.slot_number = 'C-01'),
    'Pending', 'Cancelled'
),
(
    (SELECT user_id FROM users WHERE email = 'user@parkease.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chatta Metro-Ga 14-2231'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-15'),
    DATE_SUB(CURDATE(), INTERVAL 15 DAY), '08:00:00', 2,
    (SELECT s.price_per_hour * 2 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-15'),
    'Pending', 'Cancelled'
);

-- ============================================================================
-- 3B. OTHER USERS BOOKINGS: 39 MORE ACTIVE-NOW CONFIRMED -> OCCUPIED (Total Occupied = 40)
--     Area targets: GEC Circle 14 (1+13), Agrabad 11, Khulshi 6, Bahaddarhat 4, Chawkbazar 3, Patenga 2
-- ============================================================================
INSERT INTO bookings (user_id, vehicle_id, slot_id, booking_date, booking_time, duration_hours, price_total, payment_status, booking_status) VALUES
-- GEC Circle Occupied (13 more + Tanvir C-02 = 14)
(
    (SELECT user_id FROM users WHERE email = 'rafiqul.islam@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 21-1042'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-03'),
    DATE(DATE_SUB(NOW(), INTERVAL 1 HOUR)), TIME_FORMAT(DATE_SUB(NOW(), INTERVAL 1 HOUR), '%H:%i:00'), 24,
    (SELECT s.day_price FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-03'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'farhana.rahman@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 18-5514'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-04'),
    DATE(DATE_SUB(NOW(), INTERVAL 2 HOUR)), TIME_FORMAT(DATE_SUB(NOW(), INTERVAL 2 HOUR), '%H:%i:00'), 4,
    (SELECT s.price_per_hour * 4 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-04'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'mahmudul.hasan@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 23-7741'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-05'),
    DATE(DATE_SUB(NOW(), INTERVAL 1 HOUR)), TIME_FORMAT(DATE_SUB(NOW(), INTERVAL 1 HOUR), '%H:%i:00'), 24,
    (SELECT s.day_price FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-05'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'sadia.chowdhury@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 16-4802'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-06'),
    DATE(DATE_SUB(NOW(), INTERVAL 2 HOUR)), TIME_FORMAT(DATE_SUB(NOW(), INTERVAL 2 HOUR), '%H:%i:00'), 24,
    (SELECT s.day_price FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-06'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'tahmina.akter@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 22-6150'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-07'),
    DATE(DATE_SUB(NOW(), INTERVAL 1 HOUR)), TIME_FORMAT(DATE_SUB(NOW(), INTERVAL 1 HOUR), '%H:%i:00'), 4,
    (SELECT s.price_per_hour * 4 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-07'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'shafiqur.karim@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 15-9083'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-08'),
    DATE(DATE_SUB(NOW(), INTERVAL 2 HOUR)), TIME_FORMAT(DATE_SUB(NOW(), INTERVAL 2 HOUR), '%H:%i:00'), 24,
    (SELECT s.day_price FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-08'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'fariha.tasnim@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 24-1186'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-09'),
    DATE(DATE_SUB(NOW(), INTERVAL 1 HOUR)), TIME_FORMAT(DATE_SUB(NOW(), INTERVAL 1 HOUR), '%H:%i:00'), 4,
    (SELECT s.price_per_hour * 4 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-09'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'ashraful.alam@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 17-7325'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-10'),
    DATE(DATE_SUB(NOW(), INTERVAL 2 HOUR)), TIME_FORMAT(DATE_SUB(NOW(), INTERVAL 2 HOUR), '%H:%i:00'), 24,
    (SELECT s.day_price FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-10'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'nafisa.sultana@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 21-8834'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-11'),
    DATE(DATE_SUB(NOW(), INTERVAL 1 HOUR)), TIME_FORMAT(DATE_SUB(NOW(), INTERVAL 1 HOUR), '%H:%i:00'), 4,
    (SELECT s.price_per_hour * 4 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-11'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'imran.hossain@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ha 19-8215'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'M-02'),
    DATE(DATE_SUB(NOW(), INTERVAL 1 HOUR)), TIME_FORMAT(DATE_SUB(NOW(), INTERVAL 1 HOUR), '%H:%i:00'), 4,
    (SELECT s.price_per_hour * 4 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'M-02'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'mehedi.barua@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ha 18-5412'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'M-03'),
    DATE(DATE_SUB(NOW(), INTERVAL 2 HOUR)), TIME_FORMAT(DATE_SUB(NOW(), INTERVAL 2 HOUR), '%H:%i:00'), 24,
    (SELECT s.day_price FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'M-03'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'kamrul.uddin@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ha 16-9503'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'M-04'),
    DATE(DATE_SUB(NOW(), INTERVAL 1 HOUR)), TIME_FORMAT(DATE_SUB(NOW(), INTERVAL 1 HOUR), '%H:%i:00'), 4,
    (SELECT s.price_per_hour * 4 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'M-04'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'rashedul.haque@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ha 21-5578'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'M-05'),
    DATE(DATE_SUB(NOW(), INTERVAL 2 HOUR)), TIME_FORMAT(DATE_SUB(NOW(), INTERVAL 2 HOUR), '%H:%i:00'), 24,
    (SELECT s.day_price FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'M-05'),
    'Paid', 'Confirmed'
),

-- Agrabad Occupied (11)
(
    (SELECT user_id FROM users WHERE email = 'kamrul.uddin@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 19-6601'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-02'),
    DATE(DATE_SUB(NOW(), INTERVAL 1 HOUR)), TIME_FORMAT(DATE_SUB(NOW(), INTERVAL 1 HOUR), '%H:%i:00'), 24,
    (SELECT s.day_price FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-02'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'rashedul.haque@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 25-1904'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-03'),
    DATE(DATE_SUB(NOW(), INTERVAL 2 HOUR)), TIME_FORMAT(DATE_SUB(NOW(), INTERVAL 2 HOUR), '%H:%i:00'), 4,
    (SELECT s.price_per_hour * 4 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-03'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'maliha.tabassum@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 20-9142'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-04'),
    DATE(DATE_SUB(NOW(), INTERVAL 1 HOUR)), TIME_FORMAT(DATE_SUB(NOW(), INTERVAL 1 HOUR), '%H:%i:00'), 24,
    (SELECT s.day_price FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-04'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'zahirul.miah@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 14-6318'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-05'),
    DATE(DATE_SUB(NOW(), INTERVAL 2 HOUR)), TIME_FORMAT(DATE_SUB(NOW(), INTERVAL 2 HOUR), '%H:%i:00'), 4,
    (SELECT s.price_per_hour * 4 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-05'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'sumaiya.nawar@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 22-3570'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-06'),
    DATE(DATE_SUB(NOW(), INTERVAL 1 HOUR)), TIME_FORMAT(DATE_SUB(NOW(), INTERVAL 1 HOUR), '%H:%i:00'), 24,
    (SELECT s.day_price FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-06'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'noman.siddiqui@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 18-7491'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-07'),
    DATE(DATE_SUB(NOW(), INTERVAL 2 HOUR)), TIME_FORMAT(DATE_SUB(NOW(), INTERVAL 2 HOUR), '%H:%i:00'), 4,
    (SELECT s.price_per_hour * 4 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-07'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'rafiqul.islam@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 21-1042'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-08'),
    DATE(DATE_SUB(NOW(), INTERVAL 1 HOUR)), TIME_FORMAT(DATE_SUB(NOW(), INTERVAL 1 HOUR), '%H:%i:00'), 24,
    (SELECT s.day_price FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-08'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'farhana.rahman@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 18-5514'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-09'),
    DATE(DATE_SUB(NOW(), INTERVAL 2 HOUR)), TIME_FORMAT(DATE_SUB(NOW(), INTERVAL 2 HOUR), '%H:%i:00'), 4,
    (SELECT s.price_per_hour * 4 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-09'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'rafiqul.islam@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ha 15-3021'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'M-02'),
    DATE(DATE_SUB(NOW(), INTERVAL 1 HOUR)), TIME_FORMAT(DATE_SUB(NOW(), INTERVAL 1 HOUR), '%H:%i:00'), 4,
    (SELECT s.price_per_hour * 4 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'M-02'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'shafiqur.karim@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ha 14-2740'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'M-03'),
    DATE(DATE_SUB(NOW(), INTERVAL 2 HOUR)), TIME_FORMAT(DATE_SUB(NOW(), INTERVAL 2 HOUR), '%H:%i:00'), 24,
    (SELECT s.day_price FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'M-03'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'ashraful.alam@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ha 20-4469'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'M-04'),
    DATE(DATE_SUB(NOW(), INTERVAL 1 HOUR)), TIME_FORMAT(DATE_SUB(NOW(), INTERVAL 1 HOUR), '%H:%i:00'), 4,
    (SELECT s.price_per_hour * 4 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'M-04'),
    'Paid', 'Confirmed'
),

-- Khulshi Occupied (6)
(
    (SELECT user_id FROM users WHERE email = 'mahmudul.hasan@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 23-7741'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Khulshi' AND s.slot_number = 'C-02'),
    DATE(DATE_SUB(NOW(), INTERVAL 1 HOUR)), TIME_FORMAT(DATE_SUB(NOW(), INTERVAL 1 HOUR), '%H:%i:00'), 4,
    (SELECT s.price_per_hour * 4 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Khulshi' AND s.slot_number = 'C-02'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'sadia.chowdhury@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 16-4802'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Khulshi' AND s.slot_number = 'C-03'),
    DATE(DATE_SUB(NOW(), INTERVAL 2 HOUR)), TIME_FORMAT(DATE_SUB(NOW(), INTERVAL 2 HOUR), '%H:%i:00'), 24,
    (SELECT s.day_price FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Khulshi' AND s.slot_number = 'C-03'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'tahmina.akter@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 22-6150'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Khulshi' AND s.slot_number = 'C-04'),
    DATE(DATE_SUB(NOW(), INTERVAL 1 HOUR)), TIME_FORMAT(DATE_SUB(NOW(), INTERVAL 1 HOUR), '%H:%i:00'), 4,
    (SELECT s.price_per_hour * 4 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Khulshi' AND s.slot_number = 'C-04'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'shafiqur.karim@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 15-9083'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Khulshi' AND s.slot_number = 'C-05'),
    DATE(DATE_SUB(NOW(), INTERVAL 2 HOUR)), TIME_FORMAT(DATE_SUB(NOW(), INTERVAL 2 HOUR), '%H:%i:00'), 4,
    (SELECT s.price_per_hour * 4 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Khulshi' AND s.slot_number = 'C-05'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'zahirul.miah@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ha 13-7824'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Khulshi' AND s.slot_number = 'M-02'),
    DATE(DATE_SUB(NOW(), INTERVAL 1 HOUR)), TIME_FORMAT(DATE_SUB(NOW(), INTERVAL 1 HOUR), '%H:%i:00'), 4,
    (SELECT s.price_per_hour * 4 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Khulshi' AND s.slot_number = 'M-02'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'imran.hossain@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ha 19-8215'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Khulshi' AND s.slot_number = 'M-03'),
    DATE(DATE_SUB(NOW(), INTERVAL 2 HOUR)), TIME_FORMAT(DATE_SUB(NOW(), INTERVAL 2 HOUR), '%H:%i:00'), 24,
    (SELECT s.day_price FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Khulshi' AND s.slot_number = 'M-03'),
    'Paid', 'Confirmed'
),

-- Bahaddarhat Occupied (4)
(
    (SELECT user_id FROM users WHERE email = 'fariha.tasnim@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 24-1186'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Bahaddarhat' AND s.slot_number = 'C-02'),
    DATE(DATE_SUB(NOW(), INTERVAL 1 HOUR)), TIME_FORMAT(DATE_SUB(NOW(), INTERVAL 1 HOUR), '%H:%i:00'), 4,
    (SELECT s.price_per_hour * 4 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Bahaddarhat' AND s.slot_number = 'C-02'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'ashraful.alam@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 17-7325'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Bahaddarhat' AND s.slot_number = 'C-03'),
    DATE(DATE_SUB(NOW(), INTERVAL 2 HOUR)), TIME_FORMAT(DATE_SUB(NOW(), INTERVAL 2 HOUR), '%H:%i:00'), 24,
    (SELECT s.day_price FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Bahaddarhat' AND s.slot_number = 'C-03'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'nafisa.sultana@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 21-8834'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Bahaddarhat' AND s.slot_number = 'C-04'),
    DATE(DATE_SUB(NOW(), INTERVAL 1 HOUR)), TIME_FORMAT(DATE_SUB(NOW(), INTERVAL 1 HOUR), '%H:%i:00'), 4,
    (SELECT s.price_per_hour * 4 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Bahaddarhat' AND s.slot_number = 'C-04'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'mehedi.barua@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ha 18-5412'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Bahaddarhat' AND s.slot_number = 'M-02'),
    DATE(DATE_SUB(NOW(), INTERVAL 2 HOUR)), TIME_FORMAT(DATE_SUB(NOW(), INTERVAL 2 HOUR), '%H:%i:00'), 4,
    (SELECT s.price_per_hour * 4 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Bahaddarhat' AND s.slot_number = 'M-02'),
    'Paid', 'Confirmed'
),

-- Chawkbazar Occupied (3)
(
    (SELECT user_id FROM users WHERE email = 'maliha.tabassum@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 20-9142'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Chawkbazar' AND s.slot_number = 'C-02'),
    DATE(DATE_SUB(NOW(), INTERVAL 1 HOUR)), TIME_FORMAT(DATE_SUB(NOW(), INTERVAL 1 HOUR), '%H:%i:00'), 4,
    (SELECT s.price_per_hour * 4 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Chawkbazar' AND s.slot_number = 'C-02'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'zahirul.miah@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 14-6318'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Chawkbazar' AND s.slot_number = 'C-03'),
    DATE(DATE_SUB(NOW(), INTERVAL 2 HOUR)), TIME_FORMAT(DATE_SUB(NOW(), INTERVAL 2 HOUR), '%H:%i:00'), 24,
    (SELECT s.day_price FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Chawkbazar' AND s.slot_number = 'C-03'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'kamrul.uddin@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ha 16-9503'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Chawkbazar' AND s.slot_number = 'M-02'),
    DATE(DATE_SUB(NOW(), INTERVAL 1 HOUR)), TIME_FORMAT(DATE_SUB(NOW(), INTERVAL 1 HOUR), '%H:%i:00'), 4,
    (SELECT s.price_per_hour * 4 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Chawkbazar' AND s.slot_number = 'M-02'),
    'Paid', 'Confirmed'
),

-- Patenga Occupied (2)
(
    (SELECT user_id FROM users WHERE email = 'sumaiya.nawar@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 22-3570'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Patenga' AND s.slot_number = 'C-02'),
    DATE(DATE_SUB(NOW(), INTERVAL 1 HOUR)), TIME_FORMAT(DATE_SUB(NOW(), INTERVAL 1 HOUR), '%H:%i:00'), 4,
    (SELECT s.price_per_hour * 4 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Patenga' AND s.slot_number = 'C-02'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'rashedul.haque@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ha 21-5578'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Patenga' AND s.slot_number = 'M-02'),
    DATE(DATE_SUB(NOW(), INTERVAL 2 HOUR)), TIME_FORMAT(DATE_SUB(NOW(), INTERVAL 2 HOUR), '%H:%i:00'), 4,
    (SELECT s.price_per_hour * 4 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Patenga' AND s.slot_number = 'M-02'),
    'Paid', 'Confirmed'
);

-- ============================================================================
-- 3C. OTHER USERS UPCOMING CONFIRMED -> BOOKED (14 more + Tanvir Agrabad C-01 = 15)
--     10 Paid + 5 Pending total across all 15 Booked bookings
-- ============================================================================
INSERT INTO bookings (user_id, vehicle_id, slot_id, booking_date, booking_time, duration_hours, price_total, payment_status, booking_status) VALUES
(
    (SELECT user_id FROM users WHERE email = 'rafiqul.islam@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 21-1042'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-12'),
    DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:00:00', 3,
    (SELECT s.price_per_hour * 3 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-12'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'farhana.rahman@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 18-5514'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-13'),
    DATE_ADD(CURDATE(), INTERVAL 2 DAY), '11:00:00', 4,
    (SELECT s.price_per_hour * 4 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-13'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'mahmudul.hasan@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 23-7741'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-14'),
    DATE_ADD(CURDATE(), INTERVAL 4 DAY), '14:00:00', 24,
    (SELECT s.day_price FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-14'),
    'Pending', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'imran.hossain@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ha 19-8215'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'M-06'),
    DATE_ADD(CURDATE(), INTERVAL 1 DAY), '15:00:00', 2,
    (SELECT s.price_per_hour * 2 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'M-06'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'mehedi.barua@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ha 18-5412'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'M-07'),
    DATE_ADD(CURDATE(), INTERVAL 3 DAY), '16:30:00', 3,
    (SELECT s.price_per_hour * 3 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'M-07'),
    'Pending', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'sadia.chowdhury@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 16-4802'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-10'),
    DATE_ADD(CURDATE(), INTERVAL 2 DAY), '08:30:00', 5,
    (SELECT s.price_per_hour * 5 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-10'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'tahmina.akter@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 22-6150'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-11'),
    DATE_ADD(CURDATE(), INTERVAL 3 DAY), '12:00:00', 24,
    (SELECT s.day_price FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-11'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'shafiqur.karim@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ha 14-2740'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'M-01'),
    DATE_ADD(CURDATE(), INTERVAL 2 DAY), '17:00:00', 4,
    (SELECT s.price_per_hour * 4 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'M-01'),
    'Pending', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'fariha.tasnim@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 24-1186'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Khulshi' AND s.slot_number = 'C-06'),
    DATE_ADD(CURDATE(), INTERVAL 3 DAY), '10:30:00', 3,
    (SELECT s.price_per_hour * 3 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Khulshi' AND s.slot_number = 'C-06'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'ashraful.alam@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ha 20-4469'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Khulshi' AND s.slot_number = 'M-04'),
    DATE_ADD(CURDATE(), INTERVAL 4 DAY), '18:00:00', 2,
    (SELECT s.price_per_hour * 2 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Khulshi' AND s.slot_number = 'M-04'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'nafisa.sultana@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 21-8834'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Bahaddarhat' AND s.slot_number = 'C-05'),
    DATE_ADD(CURDATE(), INTERVAL 2 DAY), '13:00:00', 6,
    (SELECT s.price_per_hour * 6 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Bahaddarhat' AND s.slot_number = 'C-05'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'zahirul.miah@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ha 13-7824'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Bahaddarhat' AND s.slot_number = 'M-03'),
    DATE_ADD(CURDATE(), INTERVAL 5 DAY), '09:00:00', 4,
    (SELECT s.price_per_hour * 4 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Bahaddarhat' AND s.slot_number = 'M-03'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'kamrul.uddin@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ha 16-9503'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Chawkbazar' AND s.slot_number = 'M-03'),
    DATE_ADD(CURDATE(), INTERVAL 5 DAY), '14:30:00', 3,
    (SELECT s.price_per_hour * 3 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Chawkbazar' AND s.slot_number = 'M-03'),
    'Paid', 'Confirmed'
),
(
    (SELECT user_id FROM users WHERE email = 'noman.siddiqui@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 18-7491'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Patenga' AND s.slot_number = 'C-03'),
    DATE_ADD(CURDATE(), INTERVAL 4 DAY), '16:00:00', 24,
    (SELECT s.day_price FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Patenga' AND s.slot_number = 'C-03'),
    'Pending', 'Confirmed'
);

-- ============================================================================
-- 3D. OTHER USERS COMPLETED BOOKINGS (32 more + 6 Tanvir = 38 Completed)
--     Spread across past 3 to 29 days, 07:00 to 21:00, all Paid
-- ============================================================================
INSERT INTO bookings (user_id, vehicle_id, slot_id, booking_date, booking_time, duration_hours, price_total, payment_status, booking_status) VALUES
-- GEC Circle Completed (10)
(
    (SELECT user_id FROM users WHERE email = 'rafiqul.islam@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 21-1042'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-16'),
    DATE_SUB(CURDATE(), INTERVAL 4 DAY), '09:00:00', 3,
    (SELECT s.price_per_hour * 3 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-16'),
    'Paid', 'Completed'
),
(
    (SELECT user_id FROM users WHERE email = 'farhana.rahman@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 18-5514'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-17'),
    DATE_SUB(CURDATE(), INTERVAL 5 DAY), '13:00:00', 4,
    (SELECT s.price_per_hour * 4 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-17'),
    'Paid', 'Completed'
),
(
    (SELECT user_id FROM users WHERE email = 'mahmudul.hasan@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 23-7741'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-18'),
    DATE_SUB(CURDATE(), INTERVAL 6 DAY), '08:00:00', 24,
    (SELECT s.day_price FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-18'),
    'Paid', 'Completed'
),
(
    (SELECT user_id FROM users WHERE email = 'sadia.chowdhury@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 16-4802'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-19'),
    DATE_SUB(CURDATE(), INTERVAL 8 DAY), '11:30:00', 5,
    (SELECT s.price_per_hour * 5 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-19'),
    'Paid', 'Completed'
),
(
    (SELECT user_id FROM users WHERE email = 'tahmina.akter@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 22-6150'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-20'),
    DATE_SUB(CURDATE(), INTERVAL 10 DAY), '15:00:00', 2,
    (SELECT s.price_per_hour * 2 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-20'),
    'Paid', 'Completed'
),
(
    (SELECT user_id FROM users WHERE email = 'shafiqur.karim@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 15-9083'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-16'),
    DATE_SUB(CURDATE(), INTERVAL 14 DAY), '10:00:00', 24,
    (SELECT s.day_price FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-16'),
    'Paid', 'Completed'
),
(
    (SELECT user_id FROM users WHERE email = 'imran.hossain@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ha 19-8215'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'M-09'),
    DATE_SUB(CURDATE(), INTERVAL 11 DAY), '16:00:00', 3,
    (SELECT s.price_per_hour * 3 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'M-09'),
    'Paid', 'Completed'
),
(
    (SELECT user_id FROM users WHERE email = 'mehedi.barua@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ha 18-5412'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'M-10'),
    DATE_SUB(CURDATE(), INTERVAL 16 DAY), '18:00:00', 2,
    (SELECT s.price_per_hour * 2 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'M-10'),
    'Paid', 'Completed'
),
(
    (SELECT user_id FROM users WHERE email = 'sabina.yasmin@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 22-4019'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-17'),
    DATE_SUB(CURDATE(), INTERVAL 24 DAY), '09:30:00', 6,
    (SELECT s.price_per_hour * 6 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-17'),
    'Paid', 'Completed'
),
(
    (SELECT user_id FROM users WHERE email = 'ashraful.alam@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ha 20-4469'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'M-11'),
    DATE_SUB(CURDATE(), INTERVAL 26 DAY), '14:00:00', 4,
    (SELECT s.price_per_hour * 4 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'M-11'),
    'Paid', 'Completed'
),

-- Agrabad Completed (9)
(
    (SELECT user_id FROM users WHERE email = 'fariha.tasnim@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 24-1186'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-13'),
    DATE_SUB(CURDATE(), INTERVAL 4 DAY), '12:00:00', 3,
    (SELECT s.price_per_hour * 3 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-13'),
    'Paid', 'Completed'
),
(
    (SELECT user_id FROM users WHERE email = 'ashraful.alam@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 17-7325'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-14'),
    DATE_SUB(CURDATE(), INTERVAL 6 DAY), '10:30:00', 5,
    (SELECT s.price_per_hour * 5 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-14'),
    'Paid', 'Completed'
),
(
    (SELECT user_id FROM users WHERE email = 'nafisa.sultana@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 21-8834'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-15'),
    DATE_SUB(CURDATE(), INTERVAL 9 DAY), '09:00:00', 24,
    (SELECT s.day_price FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-15'),
    'Paid', 'Completed'
),
(
    (SELECT user_id FROM users WHERE email = 'kamrul.uddin@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 19-6601'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-16'),
    DATE_SUB(CURDATE(), INTERVAL 13 DAY), '13:30:00', 4,
    (SELECT s.price_per_hour * 4 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-16'),
    'Paid', 'Completed'
),
(
    (SELECT user_id FROM users WHERE email = 'rashedul.haque@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 25-1904'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-17'),
    DATE_SUB(CURDATE(), INTERVAL 15 DAY), '11:00:00', 2,
    (SELECT s.price_per_hour * 2 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-17'),
    'Paid', 'Completed'
),
(
    (SELECT user_id FROM users WHERE email = 'maliha.tabassum@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 20-9142'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-18'),
    DATE_SUB(CURDATE(), INTERVAL 19 DAY), '14:00:00', 6,
    (SELECT s.price_per_hour * 6 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-18'),
    'Paid', 'Completed'
),
(
    (SELECT user_id FROM users WHERE email = 'zahirul.miah@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 14-6318'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-19'),
    DATE_SUB(CURDATE(), INTERVAL 23 DAY), '07:30:00', 24,
    (SELECT s.day_price FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-19'),
    'Paid', 'Completed'
),
(
    (SELECT user_id FROM users WHERE email = 'rafiqul.islam@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ha 15-3021'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'M-05'),
    DATE_SUB(CURDATE(), INTERVAL 17 DAY), '16:30:00', 3,
    (SELECT s.price_per_hour * 3 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'M-05'),
    'Paid', 'Completed'
),
(
    (SELECT user_id FROM users WHERE email = 'shafiqur.karim@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ha 14-2740'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'M-06'),
    DATE_SUB(CURDATE(), INTERVAL 25 DAY), '19:00:00', 2,
    (SELECT s.price_per_hour * 2 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'M-06'),
    'Paid', 'Completed'
),

-- Khulshi Completed (5)
(
    (SELECT user_id FROM users WHERE email = 'sumaiya.nawar@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 22-3570'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Khulshi' AND s.slot_number = 'C-07'),
    DATE_SUB(CURDATE(), INTERVAL 5 DAY), '09:00:00', 3,
    (SELECT s.price_per_hour * 3 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Khulshi' AND s.slot_number = 'C-07'),
    'Paid', 'Completed'
),
(
    (SELECT user_id FROM users WHERE email = 'noman.siddiqui@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 18-7491'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Khulshi' AND s.slot_number = 'C-08'),
    DATE_SUB(CURDATE(), INTERVAL 12 DAY), '11:00:00', 24,
    (SELECT s.day_price FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Khulshi' AND s.slot_number = 'C-08'),
    'Paid', 'Completed'
),
(
    (SELECT user_id FROM users WHERE email = 'farhana.rahman@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 18-5514'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Khulshi' AND s.slot_number = 'C-09'),
    DATE_SUB(CURDATE(), INTERVAL 18 DAY), '15:30:00', 4,
    (SELECT s.price_per_hour * 4 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Khulshi' AND s.slot_number = 'C-09'),
    'Paid', 'Completed'
),
(
    (SELECT user_id FROM users WHERE email = 'mehedi.barua@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ha 18-5412'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Khulshi' AND s.slot_number = 'M-05'),
    DATE_SUB(CURDATE(), INTERVAL 21 DAY), '17:00:00', 2,
    (SELECT s.price_per_hour * 2 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Khulshi' AND s.slot_number = 'M-05'),
    'Paid', 'Completed'
),
(
    (SELECT user_id FROM users WHERE email = 'tareq.aziz@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 13-2950'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Khulshi' AND s.slot_number = 'C-10'),
    DATE_SUB(CURDATE(), INTERVAL 28 DAY), '10:00:00', 3,
    (SELECT s.price_per_hour * 3 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Khulshi' AND s.slot_number = 'C-10'),
    'Paid', 'Completed'
),

-- Bahaddarhat Completed (3)
(
    (SELECT user_id FROM users WHERE email = 'mahmudul.hasan@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 23-7741'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Bahaddarhat' AND s.slot_number = 'C-06'),
    DATE_SUB(CURDATE(), INTERVAL 7 DAY), '08:30:00', 4,
    (SELECT s.price_per_hour * 4 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Bahaddarhat' AND s.slot_number = 'C-06'),
    'Paid', 'Completed'
),
(
    (SELECT user_id FROM users WHERE email = 'imran.hossain@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ha 19-8215'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Bahaddarhat' AND s.slot_number = 'M-04'),
    DATE_SUB(CURDATE(), INTERVAL 14 DAY), '16:00:00', 3,
    (SELECT s.price_per_hour * 3 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Bahaddarhat' AND s.slot_number = 'M-04'),
    'Paid', 'Completed'
),
(
    (SELECT user_id FROM users WHERE email = 'tahmina.akter@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 22-6150'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Bahaddarhat' AND s.slot_number = 'C-07'),
    DATE_SUB(CURDATE(), INTERVAL 22 DAY), '12:30:00', 2,
    (SELECT s.price_per_hour * 2 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Bahaddarhat' AND s.slot_number = 'C-07'),
    'Paid', 'Completed'
),

-- Patenga Completed (3)
(
    (SELECT user_id FROM users WHERE email = 'sadia.chowdhury@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 16-4802'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Patenga' AND s.slot_number = 'C-04'),
    DATE_SUB(CURDATE(), INTERVAL 13 DAY), '15:00:00', 4,
    (SELECT s.price_per_hour * 4 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Patenga' AND s.slot_number = 'C-04'),
    'Paid', 'Completed'
),
(
    (SELECT user_id FROM users WHERE email = 'ashraful.alam@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ha 20-4469'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Patenga' AND s.slot_number = 'M-03'),
    DATE_SUB(CURDATE(), INTERVAL 20 DAY), '17:30:00', 3,
    (SELECT s.price_per_hour * 3 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Patenga' AND s.slot_number = 'M-03'),
    'Paid', 'Completed'
),
(
    (SELECT user_id FROM users WHERE email = 'noman.siddiqui@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 18-7491'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Patenga' AND s.slot_number = 'C-05'),
    DATE_SUB(CURDATE(), INTERVAL 29 DAY), '16:00:00', 2,
    (SELECT s.price_per_hour * 2 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Patenga' AND s.slot_number = 'C-05'),
    'Paid', 'Completed'
),

-- Chawkbazar Completed (2)
(
    (SELECT user_id FROM users WHERE email = 'kamrul.uddin@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ha 16-9503'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Chawkbazar' AND s.slot_number = 'M-04'),
    DATE_SUB(CURDATE(), INTERVAL 9 DAY), '18:00:00', 2,
    (SELECT s.price_per_hour * 2 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Chawkbazar' AND s.slot_number = 'M-04'),
    'Paid', 'Completed'
),
(
    (SELECT user_id FROM users WHERE email = 'jubayer.ahmed@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ha 11-4092'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Chawkbazar' AND s.slot_number = 'M-05'),
    DATE_SUB(CURDATE(), INTERVAL 27 DAY), '19:30:00', 2,
    (SELECT s.price_per_hour * 2 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Chawkbazar' AND s.slot_number = 'M-05'),
    'Paid', 'Completed'
);

-- ============================================================================
-- 3E. OTHER USERS CANCELLED BOOKINGS (10 more + 2 Tanvir = 12 Cancelled)
--     4 Failed payments + 6 Pending (NO payment row; never Paid)
-- ============================================================================
INSERT INTO bookings (user_id, vehicle_id, slot_id, booking_date, booking_time, duration_hours, price_total, payment_status, booking_status) VALUES
-- 4 Cancelled with Failed payment
(
    (SELECT user_id FROM users WHERE email = 'sadia.chowdhury@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 16-4802'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-18'),
    DATE_SUB(CURDATE(), INTERVAL 4 DAY), '14:00:00', 3,
    (SELECT s.price_per_hour * 3 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-18'),
    'Failed', 'Cancelled'
),
(
    (SELECT user_id FROM users WHERE email = 'mahmudul.hasan@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 23-7741'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-20'),
    DATE_SUB(CURDATE(), INTERVAL 5 DAY), '11:00:00', 4,
    (SELECT s.price_per_hour * 4 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-20'),
    'Failed', 'Cancelled'
),
(
    (SELECT user_id FROM users WHERE email = 'rashedul.haque@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 25-1904'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Khulshi' AND s.slot_number = 'C-11'),
    DATE_SUB(CURDATE(), INTERVAL 11 DAY), '15:00:00', 2,
    (SELECT s.price_per_hour * 2 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Khulshi' AND s.slot_number = 'C-11'),
    'Failed', 'Cancelled'
),
(
    (SELECT user_id FROM users WHERE email = 'zahirul.miah@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ha 13-7824'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Bahaddarhat' AND s.slot_number = 'M-05'),
    DATE_SUB(CURDATE(), INTERVAL 16 DAY), '18:00:00', 3,
    (SELECT s.price_per_hour * 3 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Bahaddarhat' AND s.slot_number = 'M-05'),
    'Failed', 'Cancelled'
),

-- 6 Cancelled with Pending payment (no payment row)
(
    (SELECT user_id FROM users WHERE email = 'nafisa.sultana@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 21-8834'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-19'),
    DATE_SUB(CURDATE(), INTERVAL 12 DAY), '15:30:00', 2,
    (SELECT s.price_per_hour * 2 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'GEC Circle' AND s.slot_number = 'C-19'),
    'Pending', 'Cancelled'
),
(
    (SELECT user_id FROM users WHERE email = 'fariha.tasnim@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 24-1186'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-12'),
    DATE_SUB(CURDATE(), INTERVAL 18 DAY), '10:00:00', 3,
    (SELECT s.price_per_hour * 3 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Agrabad' AND s.slot_number = 'C-12'),
    'Pending', 'Cancelled'
),
(
    (SELECT user_id FROM users WHERE email = 'tahmina.akter@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 22-6150'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Bahaddarhat' AND s.slot_number = 'C-08'),
    DATE_SUB(CURDATE(), INTERVAL 21 DAY), '13:30:00', 24,
    (SELECT s.day_price FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Bahaddarhat' AND s.slot_number = 'C-08'),
    'Pending', 'Cancelled'
),
(
    (SELECT user_id FROM users WHERE email = 'rafiqul.islam@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 21-1042'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Patenga' AND s.slot_number = 'C-06'),
    DATE_SUB(CURDATE(), INTERVAL 24 DAY), '16:00:00', 2,
    (SELECT s.price_per_hour * 2 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Patenga' AND s.slot_number = 'C-06'),
    'Pending', 'Cancelled'
),
(
    (SELECT user_id FROM users WHERE email = 'maliha.tabassum@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 20-9142'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Chawkbazar' AND s.slot_number = 'C-01'),
    DATE_SUB(CURDATE(), INTERVAL 26 DAY), '19:30:00', 2,
    (SELECT s.price_per_hour * 2 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Chawkbazar' AND s.slot_number = 'C-01'),
    'Pending', 'Cancelled'
),
(
    (SELECT user_id FROM users WHERE email = 'sabina.yasmin@example.com'),
    (SELECT vehicle_id FROM vehicles WHERE vehicle_number = 'Chattogram Metro-Ga 22-4019'),
    (SELECT s.slot_id FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Khulshi' AND s.slot_number = 'C-12'),
    DATE_SUB(CURDATE(), INTERVAL 28 DAY), '09:00:00', 4,
    (SELECT s.price_per_hour * 4 FROM parking_slots s JOIN parking_areas a ON a.area_id = s.area_id WHERE a.area_name = 'Khulshi' AND s.slot_number = 'C-12'),
    'Pending', 'Cancelled'
);

-- ============================================================================
-- 4. INSERT PAYMENTS FOR ALL DEMO BOOKINGS THAT REACHED PAYMENT
--    92 rows total: 88 Paid (40 active-now + 10 future Booked + 38 Completed) + 4 Failed
--    Uses all 5 methods (bKash most, then Nagad, Rocket, Visa, MasterCard).
--    Pending bookings (5 Booked + 8 Cancelled) intentionally have NO payment row.
-- ============================================================================
INSERT INTO payments (booking_id, amount, payment_method, payment_status, payment_date)
SELECT
    b.booking_id,
    b.price_total,
    CASE
        WHEN MOD(b.booking_id, 10) IN (0, 2, 5, 8) THEN 'bKash'
        WHEN MOD(b.booking_id, 10) IN (1, 4, 7) THEN 'Nagad'
        WHEN MOD(b.booking_id, 10) IN (3, 9) THEN 'Rocket'
        WHEN MOD(b.booking_id, 20) = 6 THEN 'Visa'
        ELSE 'MasterCard'
    END AS payment_method,
    b.payment_status,
    CASE
        WHEN b.booking_date > CURDATE() THEN CONCAT(CURDATE(), ' 11:15:00')
        ELSE TIMESTAMP(b.booking_date, b.booking_time)
    END AS payment_date
FROM bookings b
JOIN users u ON u.user_id = b.user_id
WHERE b.payment_status IN ('Paid', 'Failed')
  AND b.booking_id NOT IN (SELECT booking_id FROM payments)
  AND (u.email LIKE '%@example.com' OR u.email = 'user@parkease.com')
ORDER BY b.booking_id ASC;

-- ============================================================================
-- 5. RECALCULATE SLOT STATUSES FROM LIVE CONFIRMED BOOKINGS
--    Only Occupied (40), Booked (15), Available (75); total stays 130
-- ============================================================================
UPDATE parking_slots
SET status = 'Available'
WHERE slot_id > 0;

UPDATE parking_slots s
JOIN bookings b ON b.slot_id = s.slot_id
SET s.status = 'Booked'
WHERE b.booking_status = 'Confirmed'
  AND TIMESTAMP(b.booking_date, b.booking_time) > NOW()
  AND s.slot_id > 0;

UPDATE parking_slots s
JOIN bookings b ON b.slot_id = s.slot_id
SET s.status = 'Occupied'
WHERE b.booking_status = 'Confirmed'
  AND TIMESTAMP(b.booking_date, b.booking_time) <= NOW()
  AND DATE_ADD(TIMESTAMP(b.booking_date, b.booking_time), INTERVAL b.duration_hours HOUR) > NOW()
  AND s.slot_id > 0;

-- ============================================================================
-- 6. DIAGNOSTIC CHECK QUERIES (Run after demo-data.sql; first 6 MUST return 0 rows)
-- ============================================================================

-- Check 1: Overlapping bookings on the same slot (expect 0 rows)
SELECT b1.booking_id AS booking_a, b2.booking_id AS booking_b, b1.slot_id, b1.booking_date
FROM bookings b1
JOIN bookings b2
  ON b1.slot_id = b2.slot_id
 AND b1.booking_id < b2.booking_id
WHERE TIMESTAMP(b1.booking_date, b1.booking_time) < DATE_ADD(TIMESTAMP(b2.booking_date, b2.booking_time), INTERVAL b2.duration_hours HOUR)
  AND DATE_ADD(TIMESTAMP(b1.booking_date, b1.booking_time), INTERVAL b1.duration_hours HOUR) > TIMESTAMP(b2.booking_date, b2.booking_time);

-- Check 2: Booking price disagrees with slot hourly/day price (expect 0 rows; excludes seed #1/#2 if rates differ)
SELECT b.booking_id, b.duration_hours, b.price_total, s.price_per_hour, s.day_price
FROM bookings b
JOIN parking_slots s ON s.slot_id = b.slot_id
WHERE (b.duration_hours = 24 AND b.price_total <> s.day_price)
   OR (b.duration_hours <> 24 AND b.price_total <> s.price_per_hour * b.duration_hours);

-- Check 3: Payment amount != booking price_total (expect 0 rows)
SELECT p.payment_id, p.booking_id, p.amount, b.price_total
FROM payments p
JOIN bookings b ON b.booking_id = p.booking_id
WHERE p.amount <> b.price_total;

-- Check 4: bookings.payment_status disagrees with payments row (expect 0 rows)
SELECT b.booking_id, b.payment_status AS booking_pay_status, p.payment_status AS payment_row_status
FROM bookings b
LEFT JOIN payments p ON p.booking_id = b.booking_id
WHERE (b.payment_status IN ('Paid', 'Failed') AND (p.payment_id IS NULL OR p.payment_status <> b.payment_status))
   OR (b.payment_status = 'Pending' AND p.payment_id IS NOT NULL);

-- Check 5: Vehicle does not belong to booking user (expect 0 rows)
SELECT b.booking_id, b.user_id AS booking_user, v.user_id AS vehicle_owner
FROM bookings b
JOIN vehicles v ON v.vehicle_id = b.vehicle_id
WHERE b.user_id <> v.user_id;

-- Check 6: Vehicle type mismatches slot type (expect 0 rows)
SELECT b.booking_id, v.vehicle_type, s.vehicle_type AS slot_type
FROM bookings b
JOIN vehicles v ON v.vehicle_id = b.vehicle_id
JOIN parking_slots s ON s.slot_id = b.slot_id
WHERE v.vehicle_type <> s.vehicle_type;

-- Check 7: Table and status counts + Admin Dashboard KPI summary
SELECT
    (SELECT COUNT(*) FROM users WHERE role = 'user') AS total_users,
    (SELECT SUM(status = 'Active') FROM users WHERE role = 'user') AS active_users,
    (SELECT SUM(status = 'Blocked') FROM users WHERE role = 'user') AS blocked_users,
    (SELECT COUNT(*) FROM vehicles) AS total_vehicles,
    (SELECT SUM(vehicle_type = 'Car') FROM vehicles) AS car_vehicles,
    (SELECT SUM(vehicle_type = 'Motorcycle') FROM vehicles) AS moto_vehicles,
    (SELECT COUNT(*) FROM parking_areas) AS total_areas,
    (SELECT COUNT(*) FROM parking_slots) AS total_slots,
    (SELECT SUM(status = 'Occupied') FROM parking_slots) AS occupied_slots,
    (SELECT SUM(status = 'Booked') FROM parking_slots) AS booked_slots,
    (SELECT SUM(status = 'Available') FROM parking_slots) AS available_slots,
    (SELECT COUNT(*) FROM bookings) AS total_bookings,
    (SELECT SUM(booking_status = 'Confirmed') FROM bookings) AS confirmed_bookings,
    (SELECT SUM(booking_status = 'Completed') FROM bookings) AS completed_bookings,
    (SELECT SUM(booking_status = 'Cancelled') FROM bookings) AS cancelled_bookings,
    (SELECT COUNT(*) FROM payments) AS total_payments,
    (SELECT SUM(payment_status = 'Paid') FROM payments) AS paid_payments,
    (SELECT SUM(payment_status = 'Failed') FROM payments) AS failed_payments,
    (SELECT COALESCE(SUM(CASE WHEN payment_status = 'Paid' THEN amount ELSE 0 END), 0) FROM payments) AS total_paid_bdt;

-- Check 8: Slot breakdown across all 6 parking areas (130 total slots)
SELECT a.area_name,
       COUNT(s.slot_id) AS total_slots,
       SUM(s.status = 'Occupied') AS occupied,
       SUM(s.status = 'Booked') AS booked,
       SUM(s.status = 'Available') AS available
FROM parking_areas a
JOIN parking_slots s ON s.area_id = a.area_id
GROUP BY a.area_id, a.area_name
ORDER BY a.area_id ASC;

-- ============================================================================
-- 7. PRESENTATION DAY REFRESH BLOCK (COMMENTED OUT — DO NOT DELETE ANY ROWS)
--    Run on presentation morning so the 40 active-now Occupied bookings cover NOW()
--    and all 130 parking_slots statuses stay accurate.
-- ============================================================================
/*
USE parkease_db;

-- Shift currently Occupied Confirmed bookings to start 1 or 2 hours before NOW()
UPDATE bookings b
JOIN parking_slots s ON s.slot_id = b.slot_id
SET b.booking_date = DATE(DATE_SUB(NOW(), INTERVAL (1 + MOD(b.booking_id, 2)) HOUR)),
    b.booking_time = TIME_FORMAT(DATE_SUB(NOW(), INTERVAL (1 + MOD(b.booking_id, 2)) HOUR), '%H:%i:00')
WHERE b.booking_status = 'Confirmed'
  AND s.status = 'Occupied'
  AND b.booking_id > 0;

-- Recalculate every parking slot status from live Confirmed bookings
UPDATE parking_slots
SET status = 'Available'
WHERE slot_id > 0;

UPDATE parking_slots s
JOIN bookings b ON b.slot_id = s.slot_id
SET s.status = 'Booked'
WHERE b.booking_status = 'Confirmed'
  AND TIMESTAMP(b.booking_date, b.booking_time) > NOW()
  AND s.slot_id > 0;

UPDATE parking_slots s
JOIN bookings b ON b.slot_id = s.slot_id
SET s.status = 'Occupied'
WHERE b.booking_status = 'Confirmed'
  AND TIMESTAMP(b.booking_date, b.booking_time) <= NOW()
  AND DATE_ADD(TIMESTAMP(b.booking_date, b.booking_time), INTERVAL b.duration_hours HOUR) > NOW()
  AND s.slot_id > 0;
*/

-- ============================================================================
-- 8. CLEANUP BLOCK (COMMENTED OUT — WARNING: PERMANENTLY REMOVES DEMO DATA)
--    Removes all @example.com demo users, demo vehicles/bookings/payments added
--    by this script (keeping seed.sql rows intact), and resets slot statuses.
-- ============================================================================
/*
USE parkease_db;

-- 1. Delete payments tied to @example.com users or demo bookings added after seed (booking_id > 2)
DELETE p FROM payments p
JOIN bookings b ON b.booking_id = p.booking_id
JOIN users u ON u.user_id = b.user_id
WHERE u.email LIKE '%@example.com'
   OR (u.email = 'user@parkease.com' AND b.booking_id > 2);

-- 2. Delete bookings tied to @example.com users or Tanvir demo bookings (booking_id > 2)
DELETE b FROM bookings b
JOIN users u ON u.user_id = b.user_id
WHERE u.email LIKE '%@example.com'
   OR (u.email = 'user@parkease.com' AND b.booking_id > 2);

-- 3. Delete demo vehicles (keeps seed.sql vehicles 1..3)
DELETE v FROM vehicles v
JOIN users u ON u.user_id = v.user_id
WHERE u.email LIKE '%@example.com'
   OR v.vehicle_number = 'Chattogram Metro-Ga 19-3108';

-- 4. Delete all 20 @example.com demo users
DELETE FROM users
WHERE email LIKE '%@example.com';

-- 5. Reset slot statuses to Available
UPDATE parking_slots
SET status = 'Available'
WHERE slot_id > 0;
*/
