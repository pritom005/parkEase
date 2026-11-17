"""
ParkEase Firestore Integrity & Read-Only Verification Script
All functions are plain functions with no custom classes.

Usage:
  python database/check_firestore.py
"""

import os
import sys
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore

# Load environment variables from python/.env and root .env
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(ROOT_DIR, "python", ".env"))
load_dotenv(os.path.join(ROOT_DIR, ".env"))

EXPECTED_AREAS = {
    "GEC Circle": (20, 12),
    "Agrabad": (20, 10),
    "Khulshi": (12, 6),
    "Bahaddarhat": (14, 6),
    "Patenga": (10, 5),
    "Chawkbazar": (8, 7),
}

ALLOWED_PAYMENT_METHODS = {"bKash", "Nagad", "Rocket", "Visa", "MasterCard"}
ALLOWED_SLOT_STATUSES = {"Available", "Booked", "Occupied"}
ALLOWED_BOOKING_STATUSES = {"Confirmed", "Completed", "Cancelled"}
ALLOWED_PAYMENT_STATUSES = {"Pending", "Paid", "Failed"}


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


# Load all documents from a collection as a dict keyed by document ID
def load_collection_map(db, collection_name):
    result = {}
    for snap in db.collection(collection_name).stream():
        data = snap.to_dict() or {}
        result[snap.id] = data
    return result


# Record a check failure into the errors list
def add_error(errors, message):
    errors.append(message)


# Verify users collection, password hash presence, roles, statuses, and users_by_email lookup
def check_users(users_map, users_by_email_map, errors):
    users_by_id = {}
    emails_seen = set()
    has_admin = False
    has_demo_user = False

    for doc_id, u in users_map.items():
        uid = u.get("user_id")
        if str(uid) != doc_id:
            add_error(errors, f"users/{doc_id}: user_id={uid} does not match doc id.")
        users_by_id[uid] = u

        email = str(u.get("email", "")).strip()
        if not email or email != email.lower():
            add_error(errors, f"users/{doc_id}: email '{email}' must be lowercase and non-empty.")
        if email in emails_seen:
            add_error(errors, f"users/{doc_id}: duplicate email '{email}'.")
        emails_seen.add(email)

        lookup = users_by_email_map.get(email)
        if not lookup or lookup.get("user_id") != uid:
            add_error(errors, f"users_by_email/{email}: missing or mismatched user_id for user {uid}.")

        if not u.get("password_hash"):
            add_error(errors, f"users/{doc_id}: missing password_hash.")

        if u.get("role") not in ("user", "admin"):
            add_error(errors, f"users/{doc_id}: invalid role '{u.get('role')}'.")
        if u.get("status") not in ("Active", "Blocked"):
            add_error(errors, f"users/{doc_id}: invalid status '{u.get('status')}'.")

        if email == "admin@parkease.com" and u.get("role") == "admin":
            has_admin = True
        if email == "user@parkease.com" and u.get("role") == "user":
            has_demo_user = True

    if not has_admin:
        add_error(errors, "Missing base admin account admin@parkease.com with role='admin'.")
    if not has_demo_user:
        add_error(errors, "Missing base demo user account user@parkease.com with role='user'.")

    for email_key, ref_doc in users_by_email_map.items():
        if ref_doc.get("user_id") not in users_by_id:
            add_error(errors, f"users_by_email/{email_key}: points to missing user_id {ref_doc.get('user_id')}.")

    return users_by_id


# Verify parking_areas and parking_slots counts, prices, uniqueness, and lookup docs
def check_areas_and_slots(areas_map, areas_by_name_map, slots_map, slots_lookup_map, errors):
    areas_by_id = {}
    slots_by_id = {}
    area_counts = {}

    for doc_id, a in areas_map.items():
        aid = a.get("area_id")
        if str(aid) != doc_id:
            add_error(errors, f"parking_areas/{doc_id}: area_id={aid} does not match doc id.")
        areas_by_id[aid] = a
        name = str(a.get("area_name", "")).strip()
        name_key = name.lower()
        lookup = areas_by_name_map.get(name_key)
        if not lookup or lookup.get("area_id") != aid:
            add_error(errors, f"areas_by_name/{name_key}: missing or mismatched area_id for area {aid}.")
        area_counts[aid] = {"name": name, "Car": 0, "Motorcycle": 0}

    if len(areas_by_id) != 6:
        add_error(errors, f"Expected 6 parking_areas, found {len(areas_by_id)}.")

    seen_area_names = set()
    for a in areas_by_id.values():
        seen_area_names.add(a.get("area_name"))
    for expected_name in EXPECTED_AREAS:
        if expected_name not in seen_area_names:
            add_error(errors, f"Missing expected parking area '{expected_name}'.")

    seen_slot_keys = set()
    for doc_id, s in slots_map.items():
        sid = s.get("slot_id")
        if str(sid) != doc_id:
            add_error(errors, f"parking_slots/{doc_id}: slot_id={sid} does not match doc id.")
        slots_by_id[sid] = s

        aid = s.get("area_id")
        if aid not in areas_by_id:
            add_error(errors, f"parking_slots/{doc_id}: references missing area_id={aid}.")
            continue

        v_type = s.get("vehicle_type")
        if v_type not in ("Car", "Motorcycle"):
            add_error(errors, f"parking_slots/{doc_id}: invalid vehicle_type '{v_type}'.")
        else:
            area_counts[aid][v_type] += 1

        if s.get("status") not in ALLOWED_SLOT_STATUSES:
            add_error(errors, f"parking_slots/{doc_id}: invalid status '{s.get('status')}'.")

        hourly = float(s.get("price_per_hour", 0) or 0)
        daily = float(s.get("day_price", 0) or 0)
        if hourly <= 0 or daily <= 0:
            add_error(errors, f"parking_slots/{doc_id}: prices must be > 0 (got hourly={hourly}, day={daily}).")

        slot_num = str(s.get("slot_number", "")).strip().upper()
        slot_key = f"{aid}__{slot_num}"
        if slot_key in seen_slot_keys:
            add_error(errors, f"parking_slots/{doc_id}: duplicate slot_number '{slot_num}' in area {aid}.")
        seen_slot_keys.add(slot_key)

        lookup = slots_lookup_map.get(slot_key)
        if not lookup or lookup.get("slot_id") != sid:
            add_error(errors, f"slots_by_area_number/{slot_key}: missing or mismatched slot_id {sid}.")

    if len(slots_by_id) != 130:
        add_error(errors, f"Expected 130 parking_slots, found {len(slots_by_id)}.")

    total_cars = 0
    total_motos = 0
    for counts in area_counts.values():
        total_cars += counts["Car"]
        total_motos += counts["Motorcycle"]
        expected = EXPECTED_AREAS.get(counts["name"])
        if expected:
            exp_car, exp_moto = expected
            if counts["Car"] != exp_car or counts["Motorcycle"] != exp_moto:
                add_error(
                    errors,
                    f"Area '{counts['name']}': expected ({exp_car} Car, {exp_moto} Moto), got ({counts['Car']} Car, {counts['Motorcycle']} Moto).",
                )

    if total_cars != 84 or total_motos != 46:
        add_error(errors, f"Expected total slots (84 Car, 46 Motorcycle), got ({total_cars} Car, {total_motos} Motorcycle).")

    return areas_by_id, slots_by_id


# Verify vehicles foreign keys, allowed fields, and vehicles_by_number lookup
def check_vehicles(vehicles_map, vehicles_lookup_map, users_by_id, errors):
    vehicles_by_id = {}
    plates_seen = set()

    for doc_id, v in vehicles_map.items():
        vid = v.get("vehicle_id")
        if str(vid) != doc_id:
            add_error(errors, f"vehicles/{doc_id}: vehicle_id={vid} does not match doc id.")
        vehicles_by_id[vid] = v

        uid = v.get("user_id")
        if uid not in users_by_id:
            add_error(errors, f"vehicles/{doc_id}: owner user_id={uid} does not exist.")

        if v.get("vehicle_type") not in ("Car", "Motorcycle"):
            add_error(errors, f"vehicles/{doc_id}: invalid vehicle_type '{v.get('vehicle_type')}'.")
        if v.get("status") not in ("Active", "Inactive"):
            add_error(errors, f"vehicles/{doc_id}: invalid status '{v.get('status')}'.")

        plate_key = str(v.get("vehicle_number", "")).strip().upper()
        if not plate_key:
            add_error(errors, f"vehicles/{doc_id}: empty vehicle_number.")
        if plate_key in plates_seen:
            add_error(errors, f"vehicles/{doc_id}: duplicate vehicle_number '{plate_key}'.")
        plates_seen.add(plate_key)

        lookup = vehicles_lookup_map.get(plate_key)
        if not lookup or lookup.get("vehicle_id") != vid:
            add_error(errors, f"vehicles_by_number/{plate_key}: missing or mismatched vehicle_id {vid}.")

    return vehicles_by_id


# Verify bookings integrity, ownership, vehicle-slot match, exact pricing, and Confirmed overlaps
def check_bookings(bookings_map, users_by_id, vehicles_by_id, areas_by_id, slots_by_id, errors):
    bookings_by_id = {}
    confirmed_windows_by_slot = {}

    for doc_id, b in bookings_map.items():
        bid = b.get("booking_id")
        if str(bid) != doc_id:
            add_error(errors, f"bookings/{doc_id}: booking_id={bid} does not match doc id.")
        bookings_by_id[bid] = b

        uid = b.get("user_id")
        vid = b.get("vehicle_id")
        aid = b.get("area_id")
        sid = b.get("slot_id")

        if uid not in users_by_id:
            add_error(errors, f"bookings/{doc_id}: missing user_id={uid}.")
        if vid not in vehicles_by_id:
            add_error(errors, f"bookings/{doc_id}: missing vehicle_id={vid}.")
        if aid not in areas_by_id:
            add_error(errors, f"bookings/{doc_id}: missing area_id={aid}.")
        if sid not in slots_by_id:
            add_error(errors, f"bookings/{doc_id}: missing slot_id={sid}.")

        v = vehicles_by_id.get(vid)
        s = slots_by_id.get(sid)
        if v and v.get("user_id") != uid:
            add_error(errors, f"bookings/{doc_id}: vehicle {vid} belongs to user {v.get('user_id')}, not {uid}.")
        if s and s.get("area_id") != aid:
            add_error(errors, f"bookings/{doc_id}: slot {sid} belongs to area {s.get('area_id')}, not {aid}.")
        if v and s and v.get("vehicle_type") != s.get("vehicle_type"):
            add_error(
                errors,
                f"bookings/{doc_id}: vehicle type {v.get('vehicle_type')} mismatches slot type {s.get('vehicle_type')}.",
            )

        b_status = b.get("booking_status")
        p_status = b.get("payment_status")
        if b_status not in ALLOWED_BOOKING_STATUSES:
            add_error(errors, f"bookings/{doc_id}: invalid booking_status '{b_status}'.")
        if p_status not in ALLOWED_PAYMENT_STATUSES:
            add_error(errors, f"bookings/{doc_id}: invalid payment_status '{p_status}'.")

        dur = int(b.get("duration_hours", 0) or 0)
        if dur <= 0:
            add_error(errors, f"bookings/{doc_id}: duration_hours must be > 0 (got {dur}).")

        if s and dur > 0:
            expected_price = float(s.get("day_price", 0)) if dur == 24 else float(s.get("price_per_hour", 0)) * dur
            actual_price = float(b.get("price_total", 0) or 0)
            if abs(actual_price - expected_price) > 0.01:
                add_error(
                    errors,
                    f"bookings/{doc_id}: price_total={actual_price} != expected {expected_price} (dur={dur}).",
                )

        if b_status == "Confirmed" and dur > 0:
            try:
                start_dt = datetime.strptime(f"{b.get('booking_date')} {b.get('booking_time')}", "%Y-%m-%d %H:%M:%S")
                end_dt = start_dt + timedelta(hours=dur)
                existing_windows = confirmed_windows_by_slot.get(sid, [])
                for other_bid, ex_start, ex_end in existing_windows:
                    if ex_start < end_dt and ex_end > start_dt:
                        add_error(
                            errors,
                            f"Overlap on slot {sid}: Confirmed booking {bid} overlaps booking {other_bid}.",
                        )
                existing_windows.append((bid, start_dt, end_dt))
                confirmed_windows_by_slot[sid] = existing_windows
            except Exception:
                add_error(errors, f"bookings/{doc_id}: invalid booking_date/booking_time format.")

    return bookings_by_id


# Verify payments methods, statuses, amount match, and payments_by_booking lookup
def check_payments(payments_map, payments_lookup_map, bookings_by_id, errors):
    payments_by_id = {}
    paid_bookings_seen = set()

    for doc_id, p in payments_map.items():
        pid = p.get("payment_id")
        if str(pid) != doc_id:
            add_error(errors, f"payments/{doc_id}: payment_id={pid} does not match doc id.")
        payments_by_id[pid] = p

        bid = p.get("booking_id")
        b = bookings_by_id.get(bid)
        if not b:
            add_error(errors, f"payments/{doc_id}: references missing booking_id={bid}.")
            continue

        if bid in paid_bookings_seen:
            add_error(errors, f"payments/{doc_id}: duplicate payment for booking_id={bid}.")
        paid_bookings_seen.add(bid)

        if p.get("payment_method") not in ALLOWED_PAYMENT_METHODS:
            add_error(errors, f"payments/{doc_id}: invalid payment_method '{p.get('payment_method')}'.")
        if p.get("payment_status") not in ("Paid", "Failed"):
            add_error(errors, f"payments/{doc_id}: invalid payment_status '{p.get('payment_status')}'.")

        if p.get("payment_status") != b.get("payment_status"):
            add_error(
                errors,
                f"payments/{doc_id}: payment_status '{p.get('payment_status')}' != booking '{b.get('payment_status')}'.",
            )

        p_amt = float(p.get("amount", 0) or 0)
        b_amt = float(b.get("price_total", 0) or 0)
        if abs(p_amt - b_amt) > 0.01:
            add_error(errors, f"payments/{doc_id}: amount {p_amt} != booking price_total {b_amt}.")

        lookup = payments_lookup_map.get(str(bid))
        if not lookup or lookup.get("payment_id") != pid:
            add_error(errors, f"payments_by_booking/{bid}: missing or mismatched payment_id {pid}.")

    return payments_by_id


# Verify all counters/<collection> documents are strictly greater than current max integer IDs
def check_counters(counters_map, collection_id_sets, errors):
    for col_name, id_dict in collection_id_sets.items():
        c_doc = counters_map.get(col_name)
        if not c_doc or "next_id" not in c_doc:
            add_error(errors, f"counters/{col_name}: missing counter document or next_id field.")
            continue
        next_id = int(c_doc.get("next_id", 0))
        max_id = max([int(k) for k in id_dict.keys()]) if id_dict else 0
        if next_id <= max_id:
            add_error(errors, f"counters/{col_name}: next_id={next_id} must be > max_id={max_id}.")


# Print read-only database statistics summary
def print_summary(users_by_id, areas_by_id, slots_by_id, vehicles_by_id, bookings_by_id, payments_by_id):
    slot_status_counts = {"Available": 0, "Booked": 0, "Occupied": 0}
    for s in slots_by_id.values():
        st = s.get("status", "Available")
        slot_status_counts[st] = slot_status_counts.get(st, 0) + 1

    booking_status_counts = {"Confirmed": 0, "Completed": 0, "Cancelled": 0}
    for b in bookings_by_id.values():
        bs = b.get("booking_status", "")
        booking_status_counts[bs] = booking_status_counts.get(bs, 0) + 1

    print("ParkEase Firestore Summary:")
    print(f"  users: {len(users_by_id)}")
    print(f"  parking_areas: {len(areas_by_id)}")
    print(f"  parking_slots: {len(slots_by_id)} -> {slot_status_counts}")
    print(f"  vehicles: {len(vehicles_by_id)}")
    print(f"  bookings: {len(bookings_by_id)} -> {booking_status_counts}")
    print(f"  payments: {len(payments_by_id)}")


# Run all read-only verification checks and exit 0 on pass or 1 on failure
def main():
    db = get_firestore_db()
    errors = []

    users_map = load_collection_map(db, "users")
    users_by_email_map = load_collection_map(db, "users_by_email")
    areas_map = load_collection_map(db, "parking_areas")
    areas_by_name_map = load_collection_map(db, "areas_by_name")
    slots_map = load_collection_map(db, "parking_slots")
    slots_lookup_map = load_collection_map(db, "slots_by_area_number")
    vehicles_map = load_collection_map(db, "vehicles")
    vehicles_lookup_map = load_collection_map(db, "vehicles_by_number")
    bookings_map = load_collection_map(db, "bookings")
    payments_map = load_collection_map(db, "payments")
    payments_lookup_map = load_collection_map(db, "payments_by_booking")
    counters_map = load_collection_map(db, "counters")

    users_by_id = check_users(users_map, users_by_email_map, errors)
    areas_by_id, slots_by_id = check_areas_and_slots(areas_map, areas_by_name_map, slots_map, slots_lookup_map, errors)
    vehicles_by_id = check_vehicles(vehicles_map, vehicles_lookup_map, users_by_id, errors)
    bookings_by_id = check_bookings(bookings_map, users_by_id, vehicles_by_id, areas_by_id, slots_by_id, errors)
    payments_by_id = check_payments(payments_map, payments_lookup_map, bookings_by_id, errors)

    check_counters(
        counters_map,
        {
            "users": users_by_id,
            "parking_areas": areas_by_id,
            "parking_slots": slots_by_id,
            "vehicles": vehicles_by_id,
            "bookings": bookings_by_id,
            "payments": payments_by_id,
        },
        errors,
    )

    print_summary(users_by_id, areas_by_id, slots_by_id, vehicles_by_id, bookings_by_id, payments_by_id)

    if errors:
        print(f"\nFAIL: Found {len(errors)} issue(s):")
        for err in errors:
            print(f"  - {err}")
        sys.exit(1)

    print("\nPASS: All Firestore collections, uniqueness lookups, counters, pricing, and non-overlap rules are valid.")


if __name__ == "__main__":
    main()
