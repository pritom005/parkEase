// Raw SQL schema and Seed files for University DBMS Project
// ParkEase Smart Parking Management System (MySQL & Flask Architecture)

export const PARKEASE_SQL = `-- ParkEase Database Schema (MySQL)
-- University DBMS Project - Chattogram Metropolitan Smart Parking
-- -------------------------------------------------------------

CREATE DATABASE IF NOT EXISTS parkease_db;
USE parkease_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    status ENUM('Active', 'Blocked') NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
    vehicle_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    vehicle_number VARCHAR(50) NOT NULL UNIQUE,
    vehicle_type ENUM('Car', 'Motorcycle') NOT NULL,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vehicle_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Parking Areas Table
CREATE TABLE IF NOT EXISTS parking_areas (
    area_id INT AUTO_INCREMENT PRIMARY KEY,
    area_name VARCHAR(100) NOT NULL UNIQUE,
    location VARCHAR(255) NOT NULL,
    status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    car_rate_hourly DECIMAL(8, 2) NOT NULL DEFAULT 250.00,
    motorcycle_rate_hourly DECIMAL(8, 2) NOT NULL DEFAULT 100.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Parking Slots Table
-- Official Hourly Rates: Car = BDT 250/hr, Motorcycle = BDT 100/hr
CREATE TABLE IF NOT EXISTS parking_slots (
    slot_id INT AUTO_INCREMENT PRIMARY KEY,
    area_id INT NOT NULL,
    slot_number VARCHAR(20) NOT NULL,
    vehicle_type ENUM('Car', 'Motorcycle') NOT NULL,
    price_per_hour DECIMAL(8, 2) NOT NULL DEFAULT 250.00,
    status ENUM('Available', 'Booked', 'Occupied', 'Blocked') NOT NULL DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_area_slot (area_id, slot_number),
    CONSTRAINT fk_slot_area FOREIGN KEY (area_id) REFERENCES parking_areas(area_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Bookings Table (Hourly Rates, Check-In, Check-Out, Overtime Billing & No-Show Tracking)
CREATE TABLE IF NOT EXISTS bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_code VARCHAR(30) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    slot_id INT NOT NULL,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    duration_hours INT NOT NULL,
    hourly_rate DECIMAL(8, 2) NOT NULL DEFAULT 250.00,
    original_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    check_in_time DATETIME NULL,
    check_out_time DATETIME NULL,
    billable_hours INT NOT NULL DEFAULT 1,
    extra_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    price_total DECIMAL(10, 2) NOT NULL,
    payment_status ENUM('Pending', 'Paid', 'Failed') NOT NULL DEFAULT 'Pending',
    booking_status ENUM('Confirmed', 'Checked-In', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Confirmed',
    cancellation_reason VARCHAR(255) NULL,
    is_no_show BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_booking_user FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_booking_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id),
    CONSTRAINT fk_booking_slot FOREIGN KEY (slot_id) REFERENCES parking_slots(slot_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('bKash', 'Nagad', 'Rocket', 'Visa', 'MasterCard', 'Civic Wallet') NOT NULL,
    payment_status ENUM('Paid', 'Pending', 'Failed') NOT NULL DEFAULT 'Paid',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    transaction_ref VARCHAR(100) NOT NULL,
    CONSTRAINT fk_payment_booking FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Admin Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    notification_type ENUM('New Booking', 'Cancellation', 'System Alert') NOT NULL DEFAULT 'New Booking',
    booking_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notification_booking FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Performance Indexes & Concurrency Guards
CREATE INDEX idx_booking_overlap ON bookings(slot_id, booking_date, booking_status);
CREATE INDEX idx_user_bookings ON bookings(user_id);
CREATE INDEX idx_booking_noshow ON bookings(booking_status, booking_date, booking_time);
CREATE INDEX idx_notification_read ON notifications(is_read);
CREATE INDEX idx_notification_created ON notifications(created_at);

-- -------------------------------------------------------------
-- MIGRATION SCRIPT (For existing MySQL deployments)
-- -------------------------------------------------------------
-- ALTER TABLE parking_slots MODIFY COLUMN price_per_hour DECIMAL(8, 2) NOT NULL DEFAULT 250.00;
-- UPDATE parking_slots SET price_per_hour = 250.00 WHERE vehicle_type = 'Car';
-- UPDATE parking_slots SET price_per_hour = 100.00 WHERE vehicle_type = 'Motorcycle';
-- ALTER TABLE bookings ADD COLUMN hourly_rate DECIMAL(8, 2) NOT NULL DEFAULT 250.00 AFTER duration_hours;
-- ALTER TABLE bookings ADD COLUMN original_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER hourly_rate;
-- ALTER TABLE bookings ADD COLUMN check_in_time DATETIME NULL AFTER original_amount;
-- ALTER TABLE bookings ADD COLUMN check_out_time DATETIME NULL AFTER check_in_time;
-- ALTER TABLE bookings ADD COLUMN billable_hours INT NOT NULL DEFAULT 1 AFTER check_out_time;
-- ALTER TABLE bookings ADD COLUMN extra_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER billable_hours;
-- ALTER TABLE bookings ADD COLUMN cancellation_reason VARCHAR(255) NULL AFTER booking_status;
-- ALTER TABLE bookings ADD COLUMN is_no_show BOOLEAN NOT NULL DEFAULT FALSE AFTER cancellation_reason;
-- ALTER TABLE bookings MODIFY COLUMN booking_status ENUM('Confirmed', 'Checked-In', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Confirmed';
`;

export const SEED_SQL = `-- ParkEase Seed Data (MySQL)
-- -------------------------------------------------------------

USE parkease_db;

-- Insert Admin and Citizen Users
INSERT INTO users (user_id, full_name, email, phone, password_hash, role, status) VALUES
(1, 'Engr. M. Rafiqul Islam', 'admin@parkease.ctg', '+880 1819-293847', 'scrypt:32768:8:1$e48$admin_hash_placeholder', 'admin', 'Active'),
(2, 'Tanvir Ahmed', 'tanvir@parkease.ctg', '+880 1712-349042', 'scrypt:32768:8:1$e48$user_hash_placeholder', 'user', 'Active'),
(3, 'Dr. Kamrul Zaman', 'kamrul@chattogram.gov.bd', '+880 1819-293848', 'scrypt:32768:8:1$e48$user_hash_placeholder', 'user', 'Active'),
(4, 'Shamim Reza', 'shamim@agrabad.ctg', '+880 1912-384910', 'scrypt:32768:8:1$e48$user_hash_placeholder', 'user', 'Active'),
(5, 'Tariqul Islam', 'tariqul@gmail.com', '+880 1712-089281', 'scrypt:32768:8:1$e48$user_hash_placeholder', 'user', 'Blocked');

-- Insert 6 Municipal Parking Hubs across Chattogram
INSERT INTO parking_areas (area_id, area_name, location, status, car_rate_hourly, motorcycle_rate_hourly) VALUES
(1, 'GEC Circle Hub', 'CDA Avenue, East Nasirabad, GEC Circle, Chattogram', 'Active', 250.00, 100.00),
(2, 'Agrabad Commercial Area', 'Commercial Area, Agrabad C/A, Zone 02 CBD, Chattogram', 'Active', 250.00, 100.00),
(3, 'Khulshi Residential Hub', 'Zakir Hossain Road, VIP Sector, Khulshi Hill, Chattogram', 'Active', 250.00, 100.00),
(4, 'Bahaddarhat Bus Terminal Hub', 'Arterial Terminal Connector, Bahaddarhat, Chattogram', 'Active', 250.00, 100.00),
(5, 'Patenga Coastal Area', 'Marine Drive Promenade, South Patenga, Chattogram', 'Active', 250.00, 100.00),
(6, 'Chawkbazar Market Area', 'Academic & Bazaar Sector, Chawkbazar, Chattogram', 'Active', 250.00, 100.00);

-- Insert Sample Parking Slots with Authoritative Rates:
-- Cars (Zone A) @ BDT 250/hr
INSERT INTO parking_slots (area_id, slot_number, vehicle_type, price_per_hour, status) VALUES
(1, 'C-01', 'Car', 250.00, 'Available'),
(1, 'C-02', 'Car', 250.00, 'Booked'),
(1, 'C-03', 'Car', 250.00, 'Occupied'),
(1, 'C-04', 'Car', 250.00, 'Occupied'),
(1, 'C-05', 'Car', 250.00, 'Available'),
(1, 'C-06', 'Car', 250.00, 'Available'),
(1, 'C-07', 'Car', 250.00, 'Available'),
(1, 'C-08', 'Car', 250.00, 'Available'),
(1, 'C-09', 'Car', 250.00, 'Booked'),
(1, 'C-10', 'Car', 250.00, 'Available'),
(1, 'C-11', 'Car', 250.00, 'Available'),
(1, 'C-12', 'Car', 250.00, 'Occupied'),
-- Motorcycles (Zone B) @ BDT 100/hr
(1, 'M-01', 'Motorcycle', 100.00, 'Available'),
(1, 'M-02', 'Motorcycle', 100.00, 'Booked'),
(1, 'M-03', 'Motorcycle', 100.00, 'Available'),
(1, 'M-04', 'Motorcycle', 100.00, 'Available'),
(1, 'M-05', 'Motorcycle', 100.00, 'Occupied'),
(1, 'M-06', 'Motorcycle', 100.00, 'Available');

-- Insert Vehicles
INSERT INTO vehicles (vehicle_id, user_id, vehicle_number, vehicle_type, brand, model, status) VALUES
(1, 2, 'DHK-METRO-GA-11-2045', 'Car', 'Toyota', 'Corolla Altis', 'Active'),
(2, 2, 'CTG-HA-12-8840', 'Motorcycle', 'Honda', 'CB Hornet 160R', 'Active'),
(3, 3, 'DHK-METRO-GA-35-1829', 'Car', 'Toyota', 'Allion 2019', 'Active'),
(4, 4, 'CHA-10-8291', 'Car', 'Nissan', 'Sunny 2016', 'Active');

-- Insert Seed Bookings
INSERT INTO bookings (booking_id, booking_code, user_id, vehicle_id, slot_id, booking_date, booking_time, duration_hours, hourly_rate, original_amount, check_in_time, check_out_time, billable_hours, extra_amount, price_total, payment_status, booking_status, cancellation_reason, is_no_show, created_at) VALUES
(1, 'PK-88219', 2, 1, 4, '2026-10-10', '09:30:00', 8, 250.00, 2000.00, '2026-10-10 09:35:00', NULL, 8, 0.00, 2000.00, 'Paid', 'Checked-In', NULL, FALSE, '2026-10-10 09:20:00'),
(2, 'PK-87402', 2, 1, 33, '2026-10-08', '09:15:00', 8, 250.00, 2000.00, '2026-10-08 09:18:00', '2026-10-08 17:15:00', 8, 0.00, 2000.00, 'Paid', 'Completed', NULL, FALSE, '2026-10-08 09:00:00'),
(3, 'PK-86110', 2, 2, 42, '2026-10-05', '14:00:00', 5, 100.00, 500.00, '2026-10-05 14:02:00', '2026-10-05 19:00:00', 5, 0.00, 500.00, 'Paid', 'Completed', NULL, FALSE, '2026-10-05 13:45:00'),
(4, 'PK-8842', 3, 3, 12, '2026-10-10', '16:30:00', 2, 250.00, 500.00, NULL, NULL, 2, 0.00, 500.00, 'Paid', 'Confirmed', NULL, FALSE, '2026-10-10 16:15:00'),
(5, 'PK-89104', 2, 2, 24, '2026-10-10', '15:00:00', 2, 100.00, 200.00, NULL, NULL, 2, 0.00, 200.00, 'Paid', 'Confirmed', NULL, FALSE, '2026-10-10 14:45:00'),
(6, 'PK-85012', 4, 4, 34, '2026-10-10', '10:00:00', 2, 250.00, 500.00, NULL, NULL, 2, 0.00, 500.00, 'Paid', 'Cancelled', 'Cancelled due to no-show', TRUE, '2026-10-10 09:45:00'),
(7, 'PK-84920', 2, 1, 39, '2026-10-09', '11:00:00', 2, 250.00, 500.00, '2026-10-09 11:02:00', '2026-10-09 13:20:00', 3, 250.00, 750.00, 'Paid', 'Completed', NULL, FALSE, '2026-10-09 10:45:00');

-- Insert Initial Admin Notifications
INSERT INTO notifications (notification_id, notification_type, booking_id, title, message, is_read, created_at) VALUES
(1, 'New Booking', 1, 'New Booking Confirmed: PK-88219', 'Tanvir Ahmed reserved Bay C-04 at GEC Circle Hub for 8 hours (Car @ ৳250/hr). Total: ৳2000.', FALSE, '2026-10-10 09:20:00'),
(2, 'New Booking', 4, 'New Booking Confirmed: PK-8842', 'Dr. Kamrul Zaman reserved Bay C-12 at GEC Circle Hub for 2 hours (Car @ ৳250/hr). Total: ৳500.', TRUE, '2026-10-10 16:15:00'),
(3, 'Cancellation', 6, 'Booking Cancelled: PK-85012', 'Booking PK-85012 auto-cancelled due to no-show after 10-minute grace period elapsed. Bay A-02 released.', TRUE, '2026-10-10 10:11:00');
`;

export const PYTHON_APP_REFERENCE = `# Python Flask backend reference (python/app.py)
# ParkEase Smart Parking System - Flask, MySQL Connector & Scheduler
from flask import Flask, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
import mysql.connector
import datetime
import math
from functools import wraps

app = Flask(__name__)
app.secret_key = "MY_FLASK_SECRET_KEY"

# Authoritative Hourly Rates
HOURLY_RATES = {
    'Car': 250.00,
    'Motorcycle': 100.00
}

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('role') != 'admin':
            return jsonify({'error': 'Unauthorized admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

# -------------------------------------------------------------
# 1. ATOMIC BOOKING + NOTIFICATION CREATION WITH TRANSACTION
# -------------------------------------------------------------
@app.route('/api/user/book', methods=['POST'])
def create_booking():
    if 'user_id' not in session:
        return jsonify({'error': 'Authentication required'}), 401

    data = request.get_json()
    user_id = session['user_id']
    vehicle_id = data.get('vehicle_id')
    slot_id = data.get('slot_id')
    booking_date = data.get('booking_date')
    booking_time = data.get('booking_time')
    duration_hours = int(data.get('duration_hours', 1))

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        conn.start_transaction()

        # Step A: Validate user, vehicle ownership & slot compatibility
        cursor.execute("SELECT status, full_name, email FROM users WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()
        if not user or user['status'] == 'Blocked':
            conn.rollback()
            return jsonify({'error': 'User account inactive or blocked'}), 403

        cursor.execute(
            "SELECT vehicle_type, vehicle_number, model FROM vehicles WHERE vehicle_id = %s AND user_id = %s AND status = 'Active'",
            (vehicle_id, user_id)
        )
        vehicle = cursor.fetchone()
        if not vehicle:
            conn.rollback()
            return jsonify({'error': 'Invalid or unowned vehicle'}), 400

        cursor.execute("SELECT slot_number, vehicle_type, area_id FROM parking_slots WHERE slot_id = %s FOR UPDATE", (slot_id,))
        slot = cursor.fetchone()
        if not slot or slot['vehicle_type'] != vehicle['vehicle_type']:
            conn.rollback()
            return jsonify({'error': 'Vehicle type does not match slot type'}), 400

        # Step B: Double-check overlap right before insert (Race condition guard)
        cursor.execute("""
            SELECT booking_id FROM bookings
            WHERE slot_id = %s
              AND booking_date = %s
              AND booking_status IN ('Confirmed', 'Checked-In')
              AND (booking_time < ADDTIME(%s, SEC_TO_TIME(%s * 3600))
                   AND ADDTIME(booking_time, SEC_TO_TIME(duration_hours * 3600)) > %s)
        """, (slot_id, booking_date, booking_time, duration_hours, booking_time))
        if cursor.fetchone():
            conn.rollback()
            return jsonify({'error': 'Slot already reserved for requested time window'}), 409

        # Step C: Authoritative Backend Hourly Rate Calculation (Never trust client)
        # Round up partial hours for billable hours as per project business rules (Car: 250 BDT, Bike: 100 BDT)
        hourly_rate = HOURLY_RATES.get(vehicle['vehicle_type'], 250.00)
        billable_hours = max(1, math.ceil(float(data.get('duration_hours', 1))))
        original_amount = hourly_rate * billable_hours
        price_total = original_amount
        booking_code = f"PK-{int(datetime.datetime.now().timestamp()) % 100000:05d}"

        cursor.execute("""
            INSERT INTO bookings (
                booking_code, user_id, vehicle_id, slot_id, booking_date, booking_time,
                duration_hours, hourly_rate, original_amount, billable_hours, extra_amount,
                price_total, payment_status, booking_status
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'Pending', 'Confirmed')
        """, (
            booking_code, user_id, vehicle_id, slot_id, booking_date, booking_time,
            billable_hours, hourly_rate, original_amount, billable_hours, 0.00,
            price_total
        ))
        booking_id = cursor.lastrowid

        # Mark slot status as Booked
        cursor.execute("UPDATE parking_slots SET status = 'Booked' WHERE slot_id = %s", (slot_id,))

        # Step D: Atomically Insert Admin Notification
        notif_msg = f"New booking {booking_code} reserved by {user['full_name']} for Bay {slot['slot_number']} ({vehicle['vehicle_type']} @ ৳{hourly_rate}/hr). Total: ৳{price_total:.2f}."
        cursor.execute("""
            INSERT INTO notifications (notification_type, booking_id, title, message, is_read)
            VALUES ('New Booking', %s, %s, %s, FALSE)
        """, (booking_id, f"New Booking: {booking_code}", notif_msg))

        conn.commit()
        return jsonify({'success': True, 'booking_id': booking_id, 'booking_code': booking_code}), 201

    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# -------------------------------------------------------------
# 2. ARRIVAL / CHECK-IN ENDPOINT
# -------------------------------------------------------------
@app.route('/api/bookings/<int:booking_id>/check-in', methods=['POST'])
def check_in(booking_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        conn.start_transaction()
        cursor.execute("SELECT * FROM bookings WHERE booking_id = %s FOR UPDATE", (booking_id,))
        booking = cursor.fetchone()
        if not booking:
            conn.rollback()
            return jsonify({'error': 'Booking not found'}), 404

        if booking['booking_status'] == 'Cancelled':
            conn.rollback()
            return jsonify({'error': f"Booking was cancelled ({booking['cancellation_reason']})"}), 400

        if booking['booking_status'] == 'Checked-In':
            conn.rollback()
            return jsonify({'success': True, 'message': 'Already checked in'})

        now_bst = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        cursor.execute("""
            UPDATE bookings
            SET booking_status = 'Checked-In', check_in_time = %s
            WHERE booking_id = %s
        """, (now_bst, booking_id))

        cursor.execute("UPDATE parking_slots SET status = 'Occupied' WHERE slot_id = %s", (booking['slot_id'],))
        conn.commit()
        return jsonify({'success': True, 'check_in_time': now_bst})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# -------------------------------------------------------------
# 3. CHECK-OUT & OVERTIME BILLING ENDPOINT
# -------------------------------------------------------------
# Formula:
# Total billable hours = booked hours + ceil(additional hours beyond booked end time)
# Final parking charge = total billable hours * applicable hourly rate
@app.route('/api/bookings/<int:booking_id>/check-out', methods=['POST'])
def check_out(booking_id):
    data = request.get_json() or {}
    payment_method = data.get('payment_method', 'bKash')

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        conn.start_transaction()
        cursor.execute("SELECT b.*, v.vehicle_type FROM bookings b JOIN vehicles v ON b.vehicle_id = v.vehicle_id WHERE b.booking_id = %s FOR UPDATE", (booking_id,))
        booking = cursor.fetchone()
        if not booking:
            conn.rollback()
            return jsonify({'error': 'Booking not found'}), 404

        if booking['booking_status'] == 'Completed':
            conn.rollback()
            return jsonify({'success': True, 'message': 'Already checked out (idempotent)'})

        if booking['booking_status'] == 'Cancelled':
            conn.rollback()
            return jsonify({'error': 'Cannot check out a cancelled booking'}), 400

        # Calculate actual exit and overtime
        now_dt = datetime.datetime.now()
        now_bst = now_dt.strftime('%Y-%m-%d %H:%M:%S')

        sched_start = datetime.datetime.combine(booking['booking_date'], (datetime.datetime.min + booking['booking_time']).time())
        sched_end = sched_start + datetime.timedelta(hours=booking['duration_hours'])

        overtime_hours = 0
        if now_dt > sched_end:
            overtime_seconds = (now_dt - sched_end).total_seconds()
            overtime_hours = math.ceil(overtime_seconds / 3600)

        booked_hours = booking['duration_hours']
        billable_hours = booked_hours + overtime_hours
        hourly_rate = float(booking['hourly_rate'])
        total_charge = billable_hours * hourly_rate
        original_amount = float(booking['original_amount'])
        outstanding_amount = max(0.0, total_charge - original_amount)

        # Record overtime payment if extra amount incurred
        if outstanding_amount > 0:
            tx_ref = f"{payment_method[:2].upper()}-OT-{int(now_dt.timestamp())}"
            cursor.execute("""
                INSERT INTO payments (booking_id, amount, payment_method, payment_status, transaction_ref)
                VALUES (%s, %s, %s, 'Paid', %s)
            """, (booking_id, outstanding_amount, payment_method, tx_ref))

        # Update booking record
        cursor.execute("""
            UPDATE bookings
            SET check_out_time = %s,
                billable_hours = %s,
                extra_amount = %s,
                price_total = %s,
                booking_status = 'Completed',
                payment_status = 'Paid'
            WHERE booking_id = %s
        """, (now_bst, billable_hours, outstanding_amount, total_charge, booking_id))

        # Release bay back to public availability
        cursor.execute("UPDATE parking_slots SET status = 'Available' WHERE slot_id = %s", (booking['slot_id'],))

        conn.commit()
        return jsonify({
            'success': True,
            'booked_hours': booked_hours,
            'billable_hours': billable_hours,
            'hourly_rate': hourly_rate,
            'total_charge': total_charge,
            'outstanding_amount': outstanding_amount
        })
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# -------------------------------------------------------------
# 4. AUTOMATIC 10-MINUTE NO-SHOW CANCELLATION SCHEDULER
# -------------------------------------------------------------
# Runs periodically on the backend to enforce the 10-minute grace rule
@app.route('/api/cron/process-no-shows', methods=['POST', 'GET'])
def process_no_shows():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cancelled_count = 0

    try:
        conn.start_transaction()
        # Find bookings where status is Confirmed and current time > scheduled_start + 10 minutes
        cursor.execute("""
            SELECT b.booking_id, b.booking_code, b.slot_id, b.user_id, u.full_name, s.slot_number
            FROM bookings b
            JOIN users u ON b.user_id = u.user_id
            JOIN parking_slots s ON b.slot_id = s.slot_id
            WHERE b.booking_status = 'Confirmed'
              AND NOW() >= ADDTIME(CONCAT(b.booking_date, ' ', b.booking_time), '00:10:00')
            FOR UPDATE
        """)
        overdue_bookings = cursor.fetchall()

        for b in overdue_bookings:
            # Mark booking as Cancelled due to no-show
            cursor.execute("""
                UPDATE bookings
                SET booking_status = 'Cancelled',
                    cancellation_reason = 'Cancelled due to no-show',
                    is_no_show = TRUE
                WHERE booking_id = %s
            """, (b['booking_id'],))

            # Release reserved slot back to public availability
            cursor.execute("UPDATE parking_slots SET status = 'Available' WHERE slot_id = %s", (b['slot_id'],))

            # Generate admin cancellation notification
            notif_msg = f"Booking {b['booking_code']} auto-cancelled due to no-show after 10-minute grace period elapsed. Bay {b['slot_number']} released."
            cursor.execute("""
                INSERT INTO notifications (notification_type, booking_id, title, message, is_read)
                VALUES ('Cancellation', %s, %s, %s, FALSE)
            """, (b['booking_id'], f"No-Show Cancelled: {b['booking_code']}", notif_msg))

            cancelled_count += 1

        conn.commit()
        return jsonify({'success': True, 'cancelled_count': cancelled_count})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
`;
