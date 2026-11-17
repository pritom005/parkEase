"""
ParkEase Firestore Seeder
Replaces database/seed.sql and database/demo-data.sql for Google Cloud Firestore.
All functions are plain functions with no custom classes.

Usage:
  python database/seed_firestore.py               # Part A: base areas, 130 slots, admin & demo user
  python database/seed_firestore.py --demo        # Part A + Part B sample dataset (~105 bookings)
  python database/seed_firestore.py --refresh     # Wipe existing ParkEase docs (after YES) and reseed Part A
  python database/seed_firestore.py --demo --refresh
  python database/seed_firestore.py --cleanup     # Wipe all ParkEase docs (after YES)
"""

import os
import sys
import json
import argparse
from datetime import datetime, timedelta
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore

# Load environment variables from python/.env and root .env
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(ROOT_DIR, "python", ".env"))
load_dotenv(os.path.join(ROOT_DIR, ".env"))

COLLECTIONS_TO_MANAGE = [
    "users",
    "users_by_email",
    "vehicles",
    "vehicles_by_number",
    "parking_areas",
    "areas_by_name",
    "parking_slots",
    "slots_by_area_number",
    "bookings",
    "payments",
    "payments_by_booking",
    "counters",
]


# Initialize Firebase Admin SDK safely once and return Firestore client
def get_firestore_db():
    if not firebase_admin._apps:
        raw_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "").strip()
        if not raw_json:
            raise RuntimeError("FIREBASE_SERVICE_ACCOUNT_JSON environment variable is required.")

        info = json.loads(raw_json)
        if isinstance(info.get("private_key"), str) and "\\n" in info["private_key"]:
            info["private_key"] = info["private_key"].replace("\\n", "\n")

        cred = credentials.Certificate(info)
        firebase_admin.initialize_app(cred)

    database_id = os.getenv("FIREBASE_DATABASE_ID", "").strip()
    if database_id and database_id != "(default)":
        return firestore.client(database_id=database_id)
    return firestore.client()


# Commit a list of (doc_ref, data_dict) writes using Firestore batches (max 400 per batch)
def commit_writes(db, write_items):
    index = 0
    total = len(write_items)
    while index < total:
        batch = db.batch()
        chunk = write_items[index:index + 400]
        for ref, payload in chunk:
            batch.set(ref, payload)
        batch.commit()
        index += 400


# Check if any primary collection already holds documents
def database_has_existing_data(db):
    for col_name in ["users", "parking_areas", "parking_slots"]:
        docs = db.collection(col_name).limit(1).stream()
        for _ in docs:
            return True
    return False


# Delete all documents from ParkEase Firestore collections in batches
def delete_all_parkease_collections(db):
    deleted_count = 0
    for col_name in COLLECTIONS_TO_MANAGE:
        while True:
            snaps = list(db.collection(col_name).limit(400).stream())
            if not snaps:
                break
            batch = db.batch()
            for snap in snaps:
                batch.delete(snap.reference)
                deleted_count += 1
            batch.commit()
    return deleted_count


# Read ADMIN_PASSWORD_HASH and USER_PASSWORD_HASH strictly from environment without printing
def load_required_password_hashes():
    admin_hash = os.getenv("ADMIN_PASSWORD_HASH", "").strip()
    user_hash = os.getenv("USER_PASSWORD_HASH", "").strip()
    if not admin_hash or not user_hash:
        raise RuntimeError(
            "ADMIN_PASSWORD_HASH and USER_PASSWORD_HASH environment variables must be set before seeding."
        )
    return admin_hash, user_hash


# Build Part A base documents: 2 accounts, 6 areas, 130 slots, lookup docs, and counters
def build_base_records(admin_hash, user_hash, now_str):
    users = [
        {
            "user_id": 1,
            "full_name": "System Administrator",
            "email": "admin@parkease.com",
            "phone": "01711000001",
            "password_hash": admin_hash,
            "role": "admin",
            "status": "Active",
            "created_at": now_str,
        },
        {
            "user_id": 2,
            "full_name": "Tanvir Ahmed",
            "email": "user@parkease.com",
            "phone": "01819000002",
            "password_hash": user_hash,
            "role": "user",
            "status": "Active",
            "created_at": now_str,
        },
    ]

    area_specs = [
        (1, "GEC Circle", "GEC More, Near Sanmar Ocean City, Chattogram", 20, 12),
        (2, "Agrabad", "Agrabad, Near WTC, Chattogram", 20, 10),
        (3, "Khulshi", "Zakir Hossain Road, Khulshi, Chattogram", 12, 6),
        (4, "Bahaddarhat", "Bahaddarhat Area, Chattogram", 14, 6),
        (5, "Patenga", "Patenga Beach Road, Airport Crossing, Chattogram", 10, 5),
        (6, "Chawkbazar", "College Road, Near Parade Ground, Chattogram", 8, 7),
    ]

    areas = []
    slots = []
    slot_id = 1
    for area_id, area_name, location, car_count, moto_count in area_specs:
        areas.append({
            "area_id": area_id,
            "area_name": area_name,
            "location": location,
            "status": "Active",
            "created_at": now_str,
        })

        i = 1
        while i <= car_count:
            slots.append({
                "slot_id": slot_id,
                "area_id": area_id,
                "slot_number": f"C-{i:02d}",
                "vehicle_type": "Car",
                "price_per_hour": 250.0,
                "day_price": 2000.0,
                "status": "Available",
                "created_at": now_str,
            })
            slot_id += 1
            i += 1

        j = 1
        while j <= moto_count:
            slots.append({
                "slot_id": slot_id,
                "area_id": area_id,
                "slot_number": f"M-{j:02d}",
                "vehicle_type": "Motorcycle",
                "price_per_hour": 100.0,
                "day_price": 1000.0,
                "status": "Available",
                "created_at": now_str,
            })
            slot_id += 1
            j += 1

    return users, areas, slots


# Build Part B demo users, vehicles, non-overlapping bookings, payments, and live slot statuses
def build_demo_records(base_users, base_slots, user_hash, now_dt):
    now_str = now_dt.strftime("%Y-%m-%d %H:%M:%S")
    users = list(base_users)

    sample_user_specs = [
        ("Nusrat Jahan", "nusrat.jahan@example.com", "01000000001", "Active"),
        ("Mahmudul Hasan", "mahmudul.hasan@example.com", "01000000002", "Active"),
        ("Farhana Yasmin", "farhana.yasmin@example.com", "01000000003", "Active"),
        ("Rafiqul Islam", "rafiqul.islam@example.com", "01000000004", "Active"),
        ("Sadia Afrin", "sadia.afrin@example.com", "01000000005", "Active"),
        ("Kamrul Chowdhury", "kamrul.chowdhury@example.com", "01000000006", "Active"),
        ("Tasnim Akter", "tasnim.akter@example.com", "01000000007", "Active"),
        ("Imran Hossain", "imran.hossain@example.com", "01000000008", "Active"),
        ("Nabila Rahman", "nabila.rahman@example.com", "01000000009", "Active"),
        ("Tariqul Karim", "tariqul.karim@example.com", "01000000010", "Active"),
        ("Jannatul Ferdous", "jannatul.ferdous@example.com", "01000000011", "Active"),
        ("Shafiqul Alam", "shafiqul.alam@example.com", "01000000012", "Active"),
        ("Maliha Tabassum", "maliha.tabassum@example.com", "01000000013", "Active"),
        ("Ashraful Haque", "ashraful.haque@example.com", "01000000014", "Active"),
        ("Fariha Sultana", "fariha.sultana@example.com", "01000000015", "Active"),
        ("Nayeem Uddin", "nayeem.uddin@example.com", "01000000016", "Active"),
        ("Sumaiya Khatun", "sumaiya.khatun@example.com", "01000000017", "Active"),
        ("Rashedul Hoque", "rashedul.hoque@example.com", "01000000018", "Blocked"),
        ("Samira Chowdhury", "samira.chowdhury@example.com", "01000000019", "Blocked"),
        ("Jahidul Hasan", "jahidul.hasan@example.com", "01000000020", "Blocked"),
    ]

    uid = 3
    for full_name, email, phone, status in sample_user_specs:
        users.append({
            "user_id": uid,
            "full_name": full_name,
            "email": email,
            "phone": phone,
            "password_hash": user_hash,
            "role": "user",
            "status": status,
            "created_at": now_str,
        })
        uid += 1

    # 28 vehicles (18 Car, 10 Motorcycle); Tanvir (user_id=2) owns 3 vehicles
    vehicle_specs = [
        (1, 2, "CHATTA METRO-GA 14-2231", "Car", "Toyota", "Premio 2019", "Active"),
        (2, 2, "CHATTA METRO-HA 12-8954", "Motorcycle", "Yamaha", "FZ-S V3", "Active"),
        (3, 2, "CHATTA METRO-GA 19-3302", "Car", "Honda", "Grace 2020", "Active"),
        (4, 3, "CHATTA METRO-GA 15-4421", "Car", "Honda", "Civic 2021", "Active"),
        (5, 4, "CHATTA METRO-GA 17-1182", "Car", "Toyota", "Axio 2018", "Active"),
        (6, 4, "CHATTA METRO-LA 11-5023", "Motorcycle", "Suzuki", "Gixxer SF", "Active"),
        (7, 5, "CHATTA METRO-KHA 13-6640", "Car", "Nissan", "X-Trail 2019", "Active"),
        (8, 6, "CHATTA METRO-GA 18-7745", "Car", "Toyota", "Allion 2020", "Active"),
        (9, 7, "CHATTA METRO-GA 12-9014", "Car", "Hyundai", "Tucson 2021", "Active"),
        (10, 7, "CHATTA METRO-HA 14-3119", "Motorcycle", "Honda", "CB Hornet 160R", "Active"),
        (11, 8, "CHATTA METRO-GA 16-2058", "Car", "Toyota", "Corolla Cross 2022", "Active"),
        (12, 9, "CHATTA METRO-GA 11-4890", "Car", "Mitsubishi", "Outlander 2019", "Active"),
        (13, 10, "CHATTA METRO-HA 13-7721", "Motorcycle", "Bajaj", "Pulsar N160", "Active"),
        (14, 10, "CHATTA METRO-GA 20-1144", "Car", "Toyota", "Noah Hybrid 2020", "Active"),
        (15, 11, "CHATTA METRO-GA 15-8832", "Car", "Honda", "CR-V 2021", "Active"),
        (16, 12, "CHATTA METRO-KHA 12-3309", "Car", "Toyota", "Vitz 2017", "Active"),
        (17, 12, "CHATTA METRO-HA 16-4410", "Motorcycle", "TVS", "Apache RTR 160 4V", "Active"),
        (18, 13, "CHATTA METRO-GA 13-5521", "Car", "Mazda", "Axela 2018", "Active"),
        (19, 14, "CHATTA METRO-LA 14-6091", "Motorcycle", "Yamaha", "R15 V4", "Active"),
        (20, 14, "CHATTA METRO-GA 21-7712", "Car", "Toyota", "Raize 2022", "Active"),
        (21, 15, "CHATTA METRO-GA 17-3490", "Car", "Suzuki", "Swift 2020", "Active"),
        (22, 16, "CHATTA METRO-HA 15-9904", "Motorcycle", "Suzuki", "GSX-R150", "Active"),
        (23, 17, "CHATTA METRO-GA 18-1129", "Car", "Toyota", "Yaris 2021", "Active"),
        (24, 18, "CHATTA METRO-HA 17-6230", "Motorcycle", "Hero", "Thriller 160R", "Active"),
        (25, 18, "CHATTA METRO-GA 19-4812", "Car", "Honda", "HR-V 2020", "Active"),
        (26, 19, "CHATTA METRO-LA 12-7341", "Motorcycle", "Honda", "CBR 150R", "Active"),
        (27, 20, "CHATTA METRO-GA 16-8450", "Car", "Toyota", "Aqua 2018", "Inactive"),
        (28, 21, "CHATTA METRO-HA 11-2940", "Motorcycle", "Bajaj", "Discover 125", "Inactive"),
    ]

    vehicles = []
    active_car_vehicles = []
    active_moto_vehicles = []
    for vid, owner_id, plate, v_type, brand, model, status in vehicle_specs:
        v_doc = {
            "vehicle_id": vid,
            "user_id": owner_id,
            "vehicle_number": plate,
            "vehicle_type": v_type,
            "brand": brand,
            "model": model,
            "status": status,
            "created_at": now_str,
        }
        vehicles.append(v_doc)
        if status == "Active" and owner_id != 2:
            if v_type == "Car":
                active_car_vehicles.append(v_doc)
            else:
                active_moto_vehicles.append(v_doc)

    # Index slots by area_id and vehicle_type
    slots_by_id = {}
    slots_by_area_type = {}
    for s in base_slots:
        slots_by_id[s["slot_id"]] = s
        key = (s["area_id"], s["vehicle_type"])
        if key not in slots_by_area_type:
            slots_by_area_type[key] = []
        slots_by_area_type[key].append(s)

    # Occupied right now: GEC 14 (10C+4M), Agrabad 11 (8C+3M), Khulshi 6 (4C+2M), Bahaddarhat 4 (3C+1M), Patenga 2 (1C+1M), Chawkbazar 3 (2C+1M) => 40
    occupied_targets = [
        (1, "Car", 10), (1, "Motorcycle", 4),
        (2, "Car", 8), (2, "Motorcycle", 3),
        (3, "Car", 4), (3, "Motorcycle", 2),
        (4, "Car", 3), (4, "Motorcycle", 1),
        (5, "Car", 1), (5, "Motorcycle", 1),
        (6, "Car", 2), (6, "Motorcycle", 1),
    ]

    # Booked later (different slots): GEC 5 (4C+1M), Agrabad 4 (3C+1M), Khulshi 2 (1C+1M), Bahaddarhat 2 (1C+1M), Patenga 1 (1C), Chawkbazar 1 (1M) => 15
    booked_targets = [
        (1, "Car", 4), (1, "Motorcycle", 1),
        (2, "Car", 3), (2, "Motorcycle", 1),
        (3, "Car", 1), (3, "Motorcycle", 1),
        (4, "Car", 1), (4, "Motorcycle", 1),
        (5, "Car", 1),
        (6, "Motorcycle", 1),
    ]

    used_slots_live = set()
    occupied_slot_ids = []
    for aid, v_type, count in occupied_targets:
        pool = slots_by_area_type[(aid, v_type)]
        idx = 0
        taken = 0
        while taken < count and idx < len(pool):
            sid = pool[idx]["slot_id"]
            if sid not in used_slots_live:
                slots_by_id[sid]["status"] = "Occupied"
                used_slots_live.add(sid)
                occupied_slot_ids.append(sid)
                taken += 1
            idx += 1

    booked_slot_ids = []
    for aid, v_type, count in booked_targets:
        pool = slots_by_area_type[(aid, v_type)]
        idx = 0
        taken = 0
        while taken < count and idx < len(pool):
            sid = pool[idx]["slot_id"]
            if sid not in used_slots_live:
                slots_by_id[sid]["status"] = "Booked"
                used_slots_live.add(sid)
                booked_slot_ids.append(sid)
                taken += 1
            idx += 1

    payment_methods = ["bKash", "Nagad", "Rocket", "Visa", "MasterCard"]
    bookings = []
    payments = []
    slot_windows = {}
    booking_id = 1
    payment_id = 1

    # Check non-overlap on slot before adding a booking
    def register_slot_window(sid, start_dt, dur_hours):
        end_dt = start_dt + timedelta(hours=dur_hours)
        existing = slot_windows.get(sid, [])
        for ex_start, ex_end in existing:
            if ex_start < end_dt and ex_end > start_dt:
                return False
        existing.append((start_dt, end_dt))
        slot_windows[sid] = existing
        return True

    car_idx = 0
    moto_idx = 0

    # Pick an active vehicle matching the slot's vehicle_type
    def pick_sample_vehicle(v_type):
        nonlocal car_idx, moto_idx
        if v_type == "Car":
            v = active_car_vehicles[car_idx % len(active_car_vehicles)]
            car_idx += 1
            return v
        v = active_moto_vehicles[moto_idx % len(active_moto_vehicles)]
        moto_idx += 1
        return v

    # Helper to append a booking (and optional Paid/Failed payment record)
    def add_booking_and_payment(user_id, v_doc, slot_doc, start_dt, dur_hours, pay_status, b_status, is_full_day=False):
        nonlocal booking_id, payment_id
        effective_dur = 24 if is_full_day else int(dur_hours)
        if not register_slot_window(slot_doc["slot_id"], start_dt, effective_dur):
            return False

        price_total = float(slot_doc["day_price"]) if is_full_day or effective_dur == 24 else float(slot_doc["price_per_hour"]) * effective_dur
        created_at = (start_dt - timedelta(hours=2)).strftime("%Y-%m-%d %H:%M:%S")

        bookings.append({
            "booking_id": booking_id,
            "user_id": user_id,
            "vehicle_id": v_doc["vehicle_id"],
            "area_id": slot_doc["area_id"],
            "slot_id": slot_doc["slot_id"],
            "booking_date": start_dt.strftime("%Y-%m-%d"),
            "booking_time": start_dt.strftime("%H:%M:%S"),
            "duration_hours": effective_dur,
            "price_total": price_total,
            "payment_status": pay_status,
            "booking_status": b_status,
            "created_at": created_at,
        })

        if pay_status in ["Paid", "Failed"]:
            method = payment_methods[(payment_id - 1) % len(payment_methods)]
            pay_time = (start_dt - timedelta(minutes=30)).strftime("%Y-%m-%d %H:%M:%S")
            payments.append({
                "payment_id": payment_id,
                "booking_id": booking_id,
                "amount": price_total,
                "payment_method": method,
                "payment_status": pay_status,
                "payment_date": pay_time,
            })
            payment_id += 1

        booking_id += 1
        return True

    # 1. 40 Active-Right-Now Confirmed bookings (all Paid); first one belongs to Tanvir (user_id=2)
    active_start = (now_dt - timedelta(hours=1)).replace(minute=0, second=0, microsecond=0)
    for idx, sid in enumerate(occupied_slot_ids):
        slot_doc = slots_by_id[sid]
        if idx == 0:
            v_doc = vehicles[0]  # Tanvir's Toyota Premio (Car) on GEC Circle C-01
            uid_owner = 2
            dur = 4
            full_day = False
        else:
            v_doc = pick_sample_vehicle(slot_doc["vehicle_type"])
            uid_owner = v_doc["user_id"]
            full_day = (idx % 10 == 9)
            dur = 24 if full_day else (2 + (idx % 4))
        add_booking_and_payment(uid_owner, v_doc, slot_doc, active_start, dur, "Paid", "Confirmed", is_full_day=full_day)

    # 2. 15 Booked-Later Confirmed bookings (tomorrow / +2d): 10 Paid + 5 Pending; one Pending belongs to Tanvir
    tomorrow_base = (now_dt + timedelta(days=1)).replace(hour=10, minute=0, second=0, microsecond=0)
    for idx, sid in enumerate(booked_slot_ids):
        slot_doc = slots_by_id[sid]
        day_offset = 0 if idx < 10 else 1
        start_dt = tomorrow_base + timedelta(days=day_offset, hours=(idx % 6))
        if idx == 10:
            # Tanvir's later Confirmed booking (Pending payment) on Agrabad or GEC Moto
            if slot_doc["vehicle_type"] == "Car":
                v_doc = vehicles[2]
            else:
                v_doc = vehicles[1]
            uid_owner = 2
            pay_status = "Pending"
            full_day = False
            dur = 3
        else:
            v_doc = pick_sample_vehicle(slot_doc["vehicle_type"])
            uid_owner = v_doc["user_id"]
            # First 10 are Paid, remaining 5 (including idx==10) are Pending
            pay_status = "Paid" if idx < 10 else "Pending"
            full_day = (idx in [2, 8])
            dur = 24 if full_day else (2 + (idx % 4))
        add_booking_and_payment(uid_owner, v_doc, slot_doc, start_dt, dur, pay_status, "Confirmed", is_full_day=full_day)

    # 3. 38 Completed bookings in the last 30 days (all Paid); first 6 belong to Tanvir
    hist_anchor = (now_dt - timedelta(days=2)).replace(hour=9, minute=0, second=0, microsecond=0)
    tanvir_hist_slots = [1, 21, 33, 53, 63, 81]
    for i, sid in enumerate(tanvir_hist_slots):
        slot_doc = slots_by_id[sid]
        v_doc = vehicles[1] if slot_doc["vehicle_type"] == "Motorcycle" else vehicles[0]
        start_dt = hist_anchor - timedelta(days=i * 4)
        full_day = (i == 4)
        dur = 24 if full_day else (2 + (i % 4))
        add_booking_and_payment(2, v_doc, slot_doc, start_dt, dur, "Paid", "Completed", is_full_day=full_day)

    # Remaining 32 Completed bookings weighted toward GEC Circle (1) and Agrabad (2)
    completed_area_cycle = [1, 1, 1, 2, 2, 2, 3, 4, 5, 6]
    completed_added = 0
    cursor_step = 0
    while completed_added < 32:
        aid = completed_area_cycle[cursor_step % len(completed_area_cycle)]
        v_type = "Car" if cursor_step % 3 != 2 else "Motorcycle"
        area_pool = slots_by_area_type[(aid, v_type)]
        slot_doc = area_pool[cursor_step % len(area_pool)]
        v_doc = pick_sample_vehicle(v_type)
        days_back = 3 + (cursor_step % 26)
        start_dt = (now_dt - timedelta(days=days_back)).replace(hour=14, minute=0, second=0, microsecond=0)
        full_day = (completed_added % 9 == 0)
        dur = 24 if full_day else (2 + (completed_added % 3))
        if add_booking_and_payment(v_doc["user_id"], v_doc, slot_doc, start_dt, dur, "Paid", "Completed", is_full_day=full_day):
            completed_added += 1
        else:
            # Shift start day slightly if that slot+day already had a completed record
            alt_dt = start_dt - timedelta(days=27 - (completed_added % 5))
            if add_booking_and_payment(v_doc["user_id"], v_doc, slot_doc, alt_dt, dur, "Paid", "Completed", is_full_day=full_day):
                completed_added += 1
        cursor_step += 1

    # 4. 12 Cancelled bookings (2 for Tanvir + 10 for sample users; 4 Failed payments + 8 Pending)
    tanvir_cancel_specs = [
        (34, vehicles[2], 7, "Pending"),
        (22, vehicles[1], 11, "Failed"),
    ]
    for sid, v_doc, days_back, pay_status in tanvir_cancel_specs:
        slot_doc = slots_by_id[sid]
        start_dt = (now_dt - timedelta(days=days_back)).replace(hour=16, minute=0, second=0, microsecond=0)
        add_booking_and_payment(2, v_doc, slot_doc, start_dt, 3, pay_status, "Cancelled", is_full_day=False)

    cancel_added = 0
    cancel_step = 0
    while cancel_added < 10 and cancel_step < 50:
        aid = completed_area_cycle[cancel_step % len(completed_area_cycle)]
        v_type = "Car" if cancel_step % 3 != 1 else "Motorcycle"
        area_pool = slots_by_area_type[(aid, v_type)]
        slot_doc = area_pool[(cancel_step + 2) % len(area_pool)]
        v_doc = pick_sample_vehicle(v_type)
        days_back = 4 + cancel_step * 2
        start_dt = (now_dt - timedelta(days=days_back)).replace(hour=18, minute=0, second=0, microsecond=0)
        pay_status = "Failed" if cancel_added < 3 else "Pending"
        if add_booking_and_payment(v_doc["user_id"], v_doc, slot_doc, start_dt, 2, pay_status, "Cancelled", is_full_day=False):
            cancel_added += 1
        else:
            alt_dt = start_dt - timedelta(hours=3)
            if add_booking_and_payment(v_doc["user_id"], v_doc, slot_doc, alt_dt, 2, pay_status, "Cancelled", is_full_day=False):
                cancel_added += 1
        cancel_step += 1

    return users, vehicles, list(slots_by_id.values()), bookings, payments


# Prepare Firestore write batches for all collections, uniqueness docs, and counters
def seed_firestore(with_demo=False, do_refresh=False):
    db = get_firestore_db()

    if database_has_existing_data(db):
        if not do_refresh:
            print("ABORTED: Firestore already contains ParkEase data.")
            print("Run with --refresh (or --demo --refresh) to wipe and reseed, or --cleanup to clear first.")
            return False
        confirm = input("Existing ParkEase data will be replaced. Type YES to continue: ").strip()
        if confirm != "YES":
            print("Cancelled.")
            return False
        removed = delete_all_parkease_collections(db)
        print(f"Removed {removed} existing documents.")

    admin_hash, user_hash = load_required_password_hashes()
    now_dt = datetime.now()
    now_str = now_dt.strftime("%Y-%m-%d %H:%M:%S")

    base_users, areas, base_slots = build_base_records(admin_hash, user_hash, now_str)

    if with_demo:
        users, vehicles, slots, bookings, payments = build_demo_records(base_users, base_slots, user_hash, now_dt)
    else:
        users = base_users
        slots = base_slots
        vehicles = []
        bookings = []
        payments = []

    writes = []

    for u in users:
        uid = u["user_id"]
        email_key = u["email"].strip().lower()
        writes.append((db.collection("users").document(str(uid)), u))
        writes.append((db.collection("users_by_email").document(email_key), {"user_id": uid}))

    for a in areas:
        aid = a["area_id"]
        name_key = a["area_name"].strip().lower()
        writes.append((db.collection("parking_areas").document(str(aid)), a))
        writes.append((db.collection("areas_by_name").document(name_key), {"area_id": aid}))

    for s in slots:
        sid = s["slot_id"]
        slot_key = f"{s['area_id']}__{s['slot_number'].strip().upper()}"
        writes.append((db.collection("parking_slots").document(str(sid)), s))
        writes.append((db.collection("slots_by_area_number").document(slot_key), {"slot_id": sid}))

    for v in vehicles:
        vid = v["vehicle_id"]
        plate_key = v["vehicle_number"].strip().upper()
        writes.append((db.collection("vehicles").document(str(vid)), v))
        writes.append((db.collection("vehicles_by_number").document(plate_key), {"vehicle_id": vid}))

    for b in bookings:
        writes.append((db.collection("bookings").document(str(b["booking_id"])), b))

    for p in payments:
        pid = p["payment_id"]
        bid = p["booking_id"]
        writes.append((db.collection("payments").document(str(pid)), p))
        writes.append((db.collection("payments_by_booking").document(str(bid)), {"payment_id": pid}))

    # Set monotonic integer counters above highest seeded IDs
    counters = {
        "users": (max([u["user_id"] for u in users]) + 1) if users else 1,
        "parking_areas": (max([a["area_id"] for a in areas]) + 1) if areas else 1,
        "parking_slots": (max([s["slot_id"] for s in slots]) + 1) if slots else 1,
        "vehicles": (max([v["vehicle_id"] for v in vehicles]) + 1) if vehicles else 1,
        "bookings": (max([b["booking_id"] for b in bookings]) + 1) if bookings else 1,
        "payments": (max([p["payment_id"] for p in payments]) + 1) if payments else 1,
    }
    for name, next_id in counters.items():
        writes.append((db.collection("counters").document(name), {"next_id": next_id}))

    commit_writes(db, writes)

    print("Firestore seeding complete:")
    print(f"  users: {len(users)}")
    print(f"  parking_areas: {len(areas)}")
    print(f"  parking_slots: {len(slots)}")
    print(f"  vehicles: {len(vehicles)}")
    print(f"  bookings: {len(bookings)}")
    print(f"  payments: {len(payments)}")
    return True


# Parse CLI flags and execute cleanup or seed workflow
def main():
    parser = argparse.ArgumentParser(description="Seed ParkEase Firestore database.")
    parser.add_argument("--demo", action="store_true", help="Include Part B sample users, vehicles, bookings, and payments.")
    parser.add_argument("--refresh", action="store_true", help="Wipe existing ParkEase collections after YES confirmation before seeding.")
    parser.add_argument("--cleanup", action="store_true", help="Delete all ParkEase documents from Firestore after YES confirmation.")
    args = parser.parse_args()

    if args.cleanup:
        confirm = input("Type YES to delete all ParkEase data from Firestore: ").strip()
        if confirm != "YES":
            print("Cleanup cancelled.")
            return
        db = get_firestore_db()
        removed = delete_all_parkease_collections(db)
        print(f"Cleanup complete. Deleted {removed} documents.")
        return

    seed_firestore(with_demo=args.demo, do_refresh=args.refresh)


if __name__ == "__main__":
    main()
