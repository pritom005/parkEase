"""
ParkEase Firestore Data Layer
Replaces MySQL with Google Cloud Firestore via the Firebase Admin SDK.
All functions are plain functions with no custom classes.
"""

import os
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore

# Load environment variables from python/.env (if present) and root .env
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))
load_dotenv()

_firestore_client = None


# Return current UTC-formatted timestamp string matching old SQL format
def now_str():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


# Build a standardized result dictionary for callers
def make_result(ok, status=200, message="", data=None):
    result = {"ok": ok, "status": status, "message": message}
    if data is not None:
        result["data"] = data
    return result


# Initialize Firebase Admin SDK safely once per server instance and return Firestore client
def get_firestore_db():
    global _firestore_client
    if _firestore_client is not None:
        return _firestore_client

    if not firebase_admin._apps:
        raw_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "").strip()
        if not raw_json:
            raise RuntimeError("FIREBASE_SERVICE_ACCOUNT_JSON environment variable is missing.")

        info = json.loads(raw_json)
        if isinstance(info.get("private_key"), str) and "\\n" in info["private_key"]:
            info["private_key"] = info["private_key"].replace("\\n", "\n")

        cred = credentials.Certificate(info)
        firebase_admin.initialize_app(cred)

    database_id = os.getenv("FIREBASE_DATABASE_ID", "").strip()
    if database_id and database_id != "(default)":
        _firestore_client = firestore.client(database_id=database_id)
    else:
        _firestore_client = firestore.client()
    return _firestore_client


# Parse date and time strings into a datetime object, or return None
def parse_booking_start(b_date, b_time_str):
    try:
        clean_time = str(b_time_str).strip()[:5]
        return datetime.strptime(f"{str(b_date).strip()} {clean_time}", "%Y-%m-%d %H:%M")
    except Exception:
        return None


# Return True if an existing booking overlaps the requested [req_start, req_end) window
def bookings_overlap(b_date, b_time, duration_hours, req_start, req_end):
    existing_start = parse_booking_start(b_date, b_time)
    if existing_start is None:
        return False
    existing_end = existing_start + timedelta(hours=int(duration_hours))
    return existing_start < req_end and existing_end > req_start


# Allocate the next integer ID atomically using a counters/<name> document
def allocate_next_id(transaction, db, counter_name):
    counter_ref = db.collection("counters").document(counter_name)
    counter_snap = counter_ref.get(transaction=transaction)
    next_id = 1
    if counter_snap.exists:
        stored = counter_snap.to_dict().get("next_id", 1)
        next_id = int(stored) if stored else 1
    transaction.set(counter_ref, {"next_id": next_id + 1}, merge=True)
    return next_id


# Batch-fetch documents by integer ID list using db.get_all (no per-row loop queries)
def batch_get_map(db, collection_name, id_list):
    unique_ids = []
    seen = set()
    for item_id in id_list:
        if item_id is None:
            continue
        int_id = int(item_id)
        if int_id not in seen:
            seen.add(int_id)
            unique_ids.append(int_id)

    result_map = {}
    if not unique_ids:
        return result_map

    refs = [db.collection(collection_name).document(str(uid)) for uid in unique_ids]
    # Process in chunks of 300 to stay well under get_all request limits
    index = 0
    while index < len(refs):
        chunk = refs[index:index + 300]
        for snap in db.get_all(chunk):
            if snap.exists:
                doc_data = snap.to_dict() or {}
                result_map[int(snap.id)] = doc_data
        index += 300

    return result_map


# Run Firestore count() aggregation safely on a query or collection
def run_count_query(query_or_col):
    rows = query_or_col.count(alias="total").get()
    for row in rows:
        for agg in row:
            return int(agg.value)
    return 0


# Run Firestore count() and sum(field) together if supported, or fall back to reading field
def run_count_and_sum(query_or_col, field_name):
    try:
        agg_query = query_or_col.count(alias="total_count").sum(field_name, alias="total_sum")
        rows = agg_query.get()
        total_count = 0
        total_sum = 0.0
        for row in rows:
            for agg in row:
                if agg.alias == "total_count":
                    total_count = int(agg.value or 0)
                elif agg.alias == "total_sum":
                    total_sum = float(agg.value or 0.0)
        return total_count, total_sum
    except Exception:
        total_count = 0
        total_sum = 0.0
        for snap in query_or_col.select([field_name]).stream():
            data = snap.to_dict() or {}
            total_count += 1
            total_sum += float(data.get(field_name, 0) or 0)
        return total_count, total_sum


# -----------------------------------------------------------------------------
# USERS & AUTHENTICATION
# -----------------------------------------------------------------------------

# Fetch a single user document by integer user_id
def get_user_by_id(user_id):
    db = get_firestore_db()
    snap = db.collection("users").document(str(int(user_id))).get()
    if not snap.exists:
        return None
    data = snap.to_dict() or {}
    data["user_id"] = int(data.get("user_id", snap.id))
    return data


# Fetch a single user document by lowercase email using deterministic lookup doc
def get_user_by_email(email):
    clean_email = str(email or "").strip().lower()
    if not clean_email:
        return None

    db = get_firestore_db()
    lookup_snap = db.collection("users_by_email").document(clean_email).get()
    if lookup_snap.exists:
        lookup_data = lookup_snap.to_dict() or {}
        uid = lookup_data.get("user_id")
        if uid is not None:
            user = get_user_by_id(int(uid))
            if user is not None:
                return user

    # Fallback equality query if user was seeded without lookup doc
    matches = db.collection("users").where("email", "==", clean_email).limit(1).stream()
    for snap in matches:
        data = snap.to_dict() or {}
        data["user_id"] = int(data.get("user_id", snap.id))
        return data
    return None


# Register a new user inside a transaction while enforcing unique lowercase email
def create_user(full_name, email, phone, password_hash, role="user", status="Active"):
    clean_email = str(email or "").strip().lower()
    db = get_firestore_db()
    transaction = db.transaction()

    @firestore.transactional
    def _create_in_tx(tx):
        lookup_ref = db.collection("users_by_email").document(clean_email)
        lookup_snap = lookup_ref.get(transaction=tx)
        if lookup_snap.exists:
            return make_result(False, 409, "Email is already registered. Please log in.")

        new_id = allocate_next_id(tx, db, "users")
        created_at = now_str()
        user_doc = {
            "user_id": new_id,
            "full_name": full_name,
            "email": clean_email,
            "phone": phone,
            "password_hash": password_hash,
            "role": role,
            "status": status,
            "created_at": created_at,
        }
        user_ref = db.collection("users").document(str(new_id))
        tx.set(user_ref, user_doc)
        tx.set(lookup_ref, {"user_id": new_id})
        return make_result(True, 200, "Registration successful! You can now log in.", {"user_id": new_id})

    return _create_in_tx(transaction)


# Update full_name and phone on an existing user document
def update_user_profile(user_id, full_name, phone):
    db = get_firestore_db()
    user_ref = db.collection("users").document(str(int(user_id)))
    snap = user_ref.get()
    if not snap.exists:
        return make_result(False, 404, "User not found.")
    user_ref.update({"full_name": full_name, "phone": phone})
    return make_result(True, 200, "Profile updated successfully")


# Update password_hash on an existing user document
def update_user_password(user_id, password_hash):
    db = get_firestore_db()
    user_ref = db.collection("users").document(str(int(user_id)))
    snap = user_ref.get()
    if not snap.exists:
        return make_result(False, 404, "User not found.")
    user_ref.update({"password_hash": password_hash})
    return make_result(True, 200, "Password changed successfully")


# List standard users for admin with Python substring filtering on a limited slice
def list_users_for_admin(search="", status_filter="All", limit=200):
    db = get_firestore_db()
    rows = []
    # Single equality filter on role requires no composite index
    snaps = db.collection("users").where("role", "==", "user").limit(int(limit)).stream()
    for snap in snaps:
        d = snap.to_dict() or {}
        rows.append({
            "user_id": int(d.get("user_id", snap.id)),
            "full_name": d.get("full_name", ""),
            "email": d.get("email", ""),
            "phone": d.get("phone", ""),
            "role": d.get("role", "user"),
            "status": d.get("status", "Active"),
            "created_at": d.get("created_at", ""),
        })

    rows.sort(key=lambda item: item["user_id"], reverse=True)

    q = str(search or "").strip().lower()
    filtered = []
    for u in rows:
        if status_filter in ["Active", "Blocked"] and u["status"] != status_filter:
            continue
        if q:
            haystack = f"{u['full_name']} {u['email']} {u['phone']}".lower()
            if q not in haystack:
                continue
        filtered.append(u)

    return filtered


# Toggle a user status between Active and Blocked
def update_user_status(user_id, new_status):
    db = get_firestore_db()
    user_ref = db.collection("users").document(str(int(user_id)))
    if not user_ref.get().exists:
        return make_result(False, 404, "User not found.")
    user_ref.update({"status": new_status})
    return make_result(True, 200, f"User status updated to {new_status}")


# -----------------------------------------------------------------------------
# VEHICLES
# -----------------------------------------------------------------------------

# List all vehicles belonging to one user ordered newest first
def list_user_vehicles(user_id):
    db = get_firestore_db()
    vehicles = []
    snaps = db.collection("vehicles").where("user_id", "==", int(user_id)).stream()
    for snap in snaps:
        d = snap.to_dict() or {}
        vehicles.append({
            "vehicle_id": int(d.get("vehicle_id", snap.id)),
            "vehicle_number": d.get("vehicle_number", ""),
            "vehicle_type": d.get("vehicle_type", ""),
            "brand": d.get("brand", ""),
            "model": d.get("model", ""),
            "status": d.get("status", "Active"),
            "created_at": d.get("created_at", ""),
        })
    vehicles.sort(key=lambda item: item["vehicle_id"], reverse=True)
    return vehicles


# Create a new vehicle atomically inside a transaction with unique license plate check
def create_vehicle(user_id, vehicle_number, vehicle_type, brand, model):
    clean_plate = str(vehicle_number or "").strip().upper()
    db = get_firestore_db()
    transaction = db.transaction()

    @firestore.transactional
    def _create_in_tx(tx):
        user_snap = db.collection("users").document(str(int(user_id))).get(transaction=tx)
        if not user_snap.exists:
            return make_result(False, 404, "User account not found.")

        plate_ref = db.collection("vehicles_by_number").document(clean_plate)
        if plate_ref.get(transaction=tx).exists:
            return make_result(False, 409, "Vehicle with this number already exists.")

        new_id = allocate_next_id(tx, db, "vehicles")
        vehicle_doc = {
            "vehicle_id": new_id,
            "user_id": int(user_id),
            "vehicle_number": clean_plate,
            "vehicle_type": vehicle_type,
            "brand": brand,
            "model": model,
            "status": "Active",
            "created_at": now_str(),
        }
        tx.set(db.collection("vehicles").document(str(new_id)), vehicle_doc)
        tx.set(plate_ref, {"vehicle_id": new_id})
        return make_result(True, 200, "Vehicle added successfully", {"vehicle_id": new_id})

    return _create_in_tx(transaction)


# Update brand, model, and status for a vehicle owned by user_id
def edit_vehicle(vehicle_id, user_id, brand, model, status):
    db = get_firestore_db()
    v_ref = db.collection("vehicles").document(str(int(vehicle_id)))
    snap = v_ref.get()
    if not snap.exists:
        return make_result(False, 404, "Vehicle not found or unauthorized.")
    data = snap.to_dict() or {}
    if int(data.get("user_id", 0)) != int(user_id):
        return make_result(False, 404, "Vehicle not found or unauthorized.")

    v_ref.update({"brand": brand, "model": model, "status": status})
    return make_result(True, 200, "Vehicle updated successfully")


# Delete a vehicle owned by user_id if it has no Confirmed upcoming bookings
def delete_vehicle(vehicle_id, user_id):
    db = get_firestore_db()
    v_id = int(vehicle_id)
    v_ref = db.collection("vehicles").document(str(v_id))
    snap = v_ref.get()
    if not snap.exists:
        return make_result(False, 404, "Vehicle not found or unauthorized.")

    v_data = snap.to_dict() or {}
    if int(v_data.get("user_id", 0)) != int(user_id):
        return make_result(False, 404, "Vehicle not found or unauthorized.")

    # Single equality filter on vehicle_id needs no composite index
    booking_snaps = db.collection("bookings").where("vehicle_id", "==", v_id).stream()
    for b_snap in booking_snaps:
        b_data = b_snap.to_dict() or {}
        if b_data.get("booking_status") == "Confirmed":
            return make_result(False, 400, "Cannot delete vehicle with confirmed upcoming bookings.")

    transaction = db.transaction()

    @firestore.transactional
    def _delete_in_tx(tx):
        tx_snap = v_ref.get(transaction=tx)
        if not tx_snap.exists:
            return make_result(False, 404, "Vehicle not found or unauthorized.")
        plate = str((tx_snap.to_dict() or {}).get("vehicle_number", "")).strip().upper()
        tx.delete(v_ref)
        if plate:
            tx.delete(db.collection("vehicles_by_number").document(plate))
        return make_result(True, 200, "Vehicle deleted successfully")

    return _delete_in_tx(transaction)


# List vehicles for admin joined with owner name/email/phone via batched get_all
def list_vehicles_for_admin(search="", type_filter="All", limit=200):
    db = get_firestore_db()
    raw_vehicles = []
    user_ids = []
    snaps = (
        db.collection("vehicles")
        .order_by("vehicle_id", direction=firestore.Query.DESCENDING)
        .limit(int(limit))
        .stream()
    )
    for snap in snaps:
        d = snap.to_dict() or {}
        uid = int(d.get("user_id", 0))
        user_ids.append(uid)
        raw_vehicles.append((int(d.get("vehicle_id", snap.id)), d))

    users_map = batch_get_map(db, "users", user_ids)

    q = str(search or "").strip().lower()
    result = []
    for vid, d in raw_vehicles:
        v_type = d.get("vehicle_type", "")
        if type_filter in ["Car", "Motorcycle"] and v_type != type_filter:
            continue

        owner = users_map.get(int(d.get("user_id", 0)), {})
        owner_name = owner.get("full_name", "")
        v_num = d.get("vehicle_number", "")
        brand = d.get("brand", "")

        if q:
            haystack = f"{v_num} {owner_name} {brand}".lower()
            if q not in haystack:
                continue

        result.append({
            "vehicle_id": vid,
            "vehicle_number": v_num,
            "vehicle_type": v_type,
            "brand": brand,
            "model": d.get("model", ""),
            "status": d.get("status", "Active"),
            "created_at": d.get("created_at", ""),
            "owner_name": owner_name,
            "owner_email": owner.get("email", ""),
            "owner_phone": owner.get("phone", ""),
        })

    return result


# -----------------------------------------------------------------------------
# PARKING AREAS & SLOTS
# -----------------------------------------------------------------------------

# List active parking areas with total and Available slot counts
def list_active_areas_with_counts():
    db = get_firestore_db()
    areas = []
    area_snaps = db.collection("parking_areas").where("status", "==", "Active").stream()
    for snap in area_snaps:
        d = snap.to_dict() or {}
        areas.append({
            "area_id": int(d.get("area_id", snap.id)),
            "area_name": d.get("area_name", ""),
            "location": d.get("location", ""),
            "status": d.get("status", "Active"),
            "total_slots": 0,
            "available_slots": 0,
        })

    slot_counts = {}
    for snap in db.collection("parking_slots").select(["area_id", "status"]).stream():
        d = snap.to_dict() or {}
        aid = int(d.get("area_id", 0))
        if aid not in slot_counts:
            slot_counts[aid] = {"total": 0, "available": 0}
        slot_counts[aid]["total"] += 1
        if d.get("status") == "Available":
            slot_counts[aid]["available"] += 1

    for area in areas:
        counts = slot_counts.get(area["area_id"], {"total": 0, "available": 0})
        area["total_slots"] = counts["total"]
        area["available_slots"] = counts["available"]

    areas.sort(key=lambda item: item["area_name"].lower())
    return areas


# List all parking areas for admin ordered newest ID first
def list_areas_for_admin():
    db = get_firestore_db()
    areas = []
    for snap in db.collection("parking_areas").stream():
        d = snap.to_dict() or {}
        areas.append({
            "area_id": int(d.get("area_id", snap.id)),
            "area_name": d.get("area_name", ""),
            "location": d.get("location", ""),
            "status": d.get("status", "Active"),
            "created_at": d.get("created_at", ""),
        })
    areas.sort(key=lambda item: item["area_id"], reverse=True)
    return areas


# Create a new parking area atomically inside a transaction enforcing unique area_name
def create_area(area_name, location, status="Active"):
    clean_name = str(area_name or "").strip()
    name_key = clean_name.lower()
    db = get_firestore_db()
    transaction = db.transaction()

    @firestore.transactional
    def _create_in_tx(tx):
        name_ref = db.collection("areas_by_name").document(name_key)
        if name_ref.get(transaction=tx).exists:
            return make_result(False, 409, "An area with this name already exists.")

        new_id = allocate_next_id(tx, db, "parking_areas")
        area_doc = {
            "area_id": new_id,
            "area_name": clean_name,
            "location": location,
            "status": status,
            "created_at": now_str(),
        }
        tx.set(db.collection("parking_areas").document(str(new_id)), area_doc)
        tx.set(name_ref, {"area_id": new_id})
        return make_result(True, 200, "Area created successfully", {"area_id": new_id})

    return _create_in_tx(transaction)


# Update an existing parking area atomically while keeping area_name unique
def update_area(area_id, area_name, location, status):
    clean_name = str(area_name or "").strip()
    new_key = clean_name.lower()
    aid = int(area_id)
    db = get_firestore_db()
    transaction = db.transaction()

    @firestore.transactional
    def _update_in_tx(tx):
        area_ref = db.collection("parking_areas").document(str(aid))
        snap = area_ref.get(transaction=tx)
        if not snap.exists:
            return make_result(False, 404, "Parking area not found.")

        old_name = str((snap.to_dict() or {}).get("area_name", "")).strip()
        old_key = old_name.lower()

        if new_key != old_key:
            new_name_ref = db.collection("areas_by_name").document(new_key)
            if new_name_ref.get(transaction=tx).exists:
                return make_result(False, 409, "An area with this name already exists.")
            tx.set(new_name_ref, {"area_id": aid})
            if old_key:
                tx.delete(db.collection("areas_by_name").document(old_key))

        tx.update(area_ref, {"area_name": clean_name, "location": location, "status": status})
        return make_result(True, 200, "Parking area updated successfully")

    return _update_in_tx(transaction)


# List all parking slots for admin joined with area_name
def list_slots_for_admin():
    db = get_firestore_db()
    raw_slots = []
    area_ids = []
    for snap in db.collection("parking_slots").stream():
        d = snap.to_dict() or {}
        aid = int(d.get("area_id", 0))
        area_ids.append(aid)
        raw_slots.append((int(d.get("slot_id", snap.id)), d))

    areas_map = batch_get_map(db, "parking_areas", area_ids)

    slots = []
    for sid, d in raw_slots:
        aid = int(d.get("area_id", 0))
        area = areas_map.get(aid, {})
        slots.append({
            "slot_id": sid,
            "area_id": aid,
            "slot_number": d.get("slot_number", ""),
            "vehicle_type": d.get("vehicle_type", ""),
            "price_per_hour": float(d.get("price_per_hour", 0)),
            "day_price": float(d.get("day_price", 0)),
            "status": d.get("status", "Available"),
            "area_name": area.get("area_name", ""),
        })

    slots.sort(key=lambda item: (item["area_name"].lower(), item["slot_number"]))
    return slots


# Create a new parking slot inside a transaction verifying area existence and (area_id, slot_number) uniqueness
def create_slot(area_id, slot_number, vehicle_type, price_per_hour, day_price, status="Available"):
    aid = int(area_id)
    clean_num = str(slot_number or "").strip().upper()
    unique_key = f"{aid}__{clean_num}"
    db = get_firestore_db()
    transaction = db.transaction()

    @firestore.transactional
    def _create_in_tx(tx):
        area_snap = db.collection("parking_areas").document(str(aid)).get(transaction=tx)
        if not area_snap.exists:
            return make_result(False, 404, "Selected parking area does not exist.")

        lookup_ref = db.collection("slots_by_area_number").document(unique_key)
        if lookup_ref.get(transaction=tx).exists:
            return make_result(False, 409, f"Slot {clean_num} already exists in this area.")

        new_id = allocate_next_id(tx, db, "parking_slots")
        slot_doc = {
            "slot_id": new_id,
            "area_id": aid,
            "slot_number": clean_num,
            "vehicle_type": vehicle_type,
            "price_per_hour": float(price_per_hour),
            "day_price": float(day_price),
            "status": status,
            "created_at": now_str(),
        }
        tx.set(db.collection("parking_slots").document(str(new_id)), slot_doc)
        tx.set(lookup_ref, {"slot_id": new_id})
        return make_result(True, 200, "Slot created successfully", {"slot_id": new_id})

    return _create_in_tx(transaction)


# Update slot hourly price, optional day_price, and availability status
def update_slot(slot_id, price_per_hour, status, day_price=None):
    db = get_firestore_db()
    slot_ref = db.collection("parking_slots").document(str(int(slot_id)))
    if not slot_ref.get().exists:
        return make_result(False, 404, "Slot not found.")

    fields = {"price_per_hour": float(price_per_hour), "status": status}
    if day_price is not None:
        fields["day_price"] = float(day_price)
    slot_ref.update(fields)
    return make_result(True, 200, "Slot updated successfully")


# Search available slots in an active area for a given vehicle type and time window
def search_available_slots(area_id, vehicle_type, b_date, b_time, duration_hours, booking_type="hourly"):
    req_start = parse_booking_start(b_date, b_time)
    if req_start is None or int(duration_hours) < 1:
        return []
    req_end = req_start + timedelta(hours=int(duration_hours))

    db = get_firestore_db()
    aid = int(area_id)
    area_snap = db.collection("parking_areas").document(str(aid)).get()
    if not area_snap.exists:
        return []
    area_data = area_snap.to_dict() or {}
    if area_data.get("status") != "Active":
        return []

    # Single equality filter on area_id avoids needing any composite index
    area_slots = []
    for snap in db.collection("parking_slots").where("area_id", "==", aid).stream():
        d = snap.to_dict() or {}
        if d.get("vehicle_type") == vehicle_type:
            d["slot_id"] = int(d.get("slot_id", snap.id))
            area_slots.append(d)

    if not area_slots:
        return []

    area_slots.sort(key=lambda item: item.get("slot_number", ""))
    area_slot_ids = set(s["slot_id"] for s in area_slots)

    # Read Confirmed bookings once (single equality filter, no composite index)
    confirmed_by_slot = {}
    confirmed_snaps = db.collection("bookings").where("booking_status", "==", "Confirmed").stream()
    for b_snap in confirmed_snaps:
        b = b_snap.to_dict() or {}
        sid = int(b.get("slot_id", 0))
        if sid in area_slot_ids:
            if sid not in confirmed_by_slot:
                confirmed_by_slot[sid] = []
            confirmed_by_slot[sid].append(b)

    available = []
    for s in area_slots:
        sid = s["slot_id"]
        has_conflict = False
        for existing in confirmed_by_slot.get(sid, []):
            if bookings_overlap(
                existing.get("booking_date"),
                existing.get("booking_time"),
                existing.get("duration_hours", 1),
                req_start,
                req_end,
            ):
                has_conflict = True
                break
        if has_conflict:
            continue

        hourly = float(s.get("price_per_hour", 0))
        daily = float(s.get("day_price", 0))
        calc_total = daily if booking_type == "full_day" else hourly * int(duration_hours)
        available.append({
            "slot_id": sid,
            "area_id": aid,
            "slot_number": s.get("slot_number", ""),
            "vehicle_type": s.get("vehicle_type", ""),
            "price_per_hour": hourly,
            "day_price": daily,
            "status": s.get("status", "Available"),
            "area_name": area_data.get("area_name", ""),
            "location": area_data.get("location", ""),
            "calculated_total": calc_total,
        })

    return available


# -----------------------------------------------------------------------------
# BOOKINGS & PAYMENTS
# -----------------------------------------------------------------------------

# Batch-fetch payments keyed by booking_id using payments_by_booking lookup docs
def batch_get_payments_by_booking(db, booking_ids):
    unique_ids = []
    seen = set()
    for bid in booking_ids:
        int_id = int(bid)
        if int_id not in seen:
            seen.add(int_id)
            unique_ids.append(int_id)

    if not unique_ids:
        return {}

    lookup_refs = [db.collection("payments_by_booking").document(str(bid)) for bid in unique_ids]
    payment_ids = []
    bid_by_pid = {}
    index = 0
    while index < len(lookup_refs):
        chunk = lookup_refs[index:index + 300]
        for snap in db.get_all(chunk):
            if snap.exists:
                pid = (snap.to_dict() or {}).get("payment_id")
                if pid is not None:
                    int_pid = int(pid)
                    payment_ids.append(int_pid)
                    bid_by_pid[int_pid] = int(snap.id)
        index += 300

    payments_map = batch_get_map(db, "payments", payment_ids)
    by_booking = {}
    for pid, p_data in payments_map.items():
        bid = int(p_data.get("booking_id", bid_by_pid.get(pid, 0)))
        p_copy = dict(p_data)
        p_copy["payment_id"] = int(p_data.get("payment_id", pid))
        by_booking[bid] = p_copy

    return by_booking


# List all bookings for a single user with batched vehicle, slot, area, and payment joins
def list_user_bookings(user_id):
    db = get_firestore_db()
    raw_bookings = []
    vehicle_ids = []
    slot_ids = []
    booking_ids = []

    for snap in db.collection("bookings").where("user_id", "==", int(user_id)).stream():
        d = snap.to_dict() or {}
        bid = int(d.get("booking_id", snap.id))
        raw_bookings.append((bid, d))
        booking_ids.append(bid)
        vehicle_ids.append(d.get("vehicle_id"))
        slot_ids.append(d.get("slot_id"))

    if not raw_bookings:
        return []

    vehicles_map = batch_get_map(db, "vehicles", vehicle_ids)
    slots_map = batch_get_map(db, "parking_slots", slot_ids)
    area_ids = [s.get("area_id") for s in slots_map.values()]
    areas_map = batch_get_map(db, "parking_areas", area_ids)
    payments_map = batch_get_payments_by_booking(db, booking_ids)

    rows = []
    for bid, b in raw_bookings:
        v = vehicles_map.get(int(b.get("vehicle_id", 0)), {})
        s = slots_map.get(int(b.get("slot_id", 0)), {})
        a = areas_map.get(int(s.get("area_id", b.get("area_id", 0))), {})
        p = payments_map.get(bid, {})
        rows.append({
            "booking_id": bid,
            "booking_date": str(b.get("booking_date", "")),
            "booking_time": str(b.get("booking_time", "")),
            "duration_hours": int(b.get("duration_hours", 1)),
            "price_total": float(b.get("price_total", 0)),
            "payment_status": b.get("payment_status", "Pending"),
            "booking_status": b.get("booking_status", "Confirmed"),
            "created_at": str(b.get("created_at", "")),
            "vehicle_number": v.get("vehicle_number", ""),
            "vehicle_type": v.get("vehicle_type", ""),
            "brand": v.get("brand", ""),
            "model": v.get("model", ""),
            "slot_number": s.get("slot_number", ""),
            "price_per_hour": float(s.get("price_per_hour", 0)),
            "day_price": float(s.get("day_price", 0)),
            "area_name": a.get("area_name", ""),
            "location": a.get("location", ""),
            "payment_id": p.get("payment_id"),
            "payment_method": p.get("payment_method"),
        })

    rows.sort(key=lambda item: (item["booking_date"], item["booking_time"]), reverse=True)
    return rows


# Create a booking atomically inside one Firestore transaction with overlap validation
def create_booking(user_id, slot_id, vehicle_id, booking_date_str, booking_time_str, duration_hours, booking_type="hourly"):
    req_start = parse_booking_start(booking_date_str, booking_time_str)
    if req_start is None or int(duration_hours) < 1:
        return make_result(False, 400, "Invalid booking parameters.")
    req_end = req_start + timedelta(hours=int(duration_hours))

    uid = int(user_id)
    sid = int(slot_id)
    vid = int(vehicle_id)
    clean_time = req_start.strftime("%H:%M:%S")
    clean_date = req_start.strftime("%Y-%m-%d")

    db = get_firestore_db()
    transaction = db.transaction()

    @firestore.transactional
    def _book_in_tx(tx):
        user_snap = db.collection("users").document(str(uid)).get(transaction=tx)
        if not user_snap.exists:
            return make_result(False, 401, "Authentication required. Please log in.")
        user_data = user_snap.to_dict() or {}
        if user_data.get("status") == "Blocked":
            return make_result(False, 403, "Your account has been blocked. Please contact support.")

        v_snap = db.collection("vehicles").document(str(vid)).get(transaction=tx)
        if not v_snap.exists:
            return make_result(False, 400, "Please select an active vehicle from your own garage.")
        v_data = v_snap.to_dict() or {}
        if int(v_data.get("user_id", 0)) != uid or v_data.get("status") != "Active":
            return make_result(False, 400, "Please select an active vehicle from your own garage.")

        slot_ref = db.collection("parking_slots").document(str(sid))
        slot_snap = slot_ref.get(transaction=tx)
        if not slot_snap.exists:
            return make_result(False, 404, "Parking slot does not exist.")
        slot_data = slot_snap.to_dict() or {}

        if slot_data.get("vehicle_type") != v_data.get("vehicle_type"):
            return make_result(
                False,
                400,
                f"Vehicle type mismatch. Slot is for {slot_data.get('vehicle_type')} but vehicle is {v_data.get('vehicle_type')}.",
            )

        area_id = int(slot_data.get("area_id", 0))
        area_snap = db.collection("parking_areas").document(str(area_id)).get(transaction=tx)
        if not area_snap.exists or (area_snap.to_dict() or {}).get("status") != "Active":
            return make_result(False, 400, "Selected parking area is currently inactive.")

        # Query slot's bookings with a single equality filter inside the transaction
        slot_booking_snaps = db.collection("bookings").where("slot_id", "==", sid).get(transaction=tx)
        for b_snap in slot_booking_snaps:
            b_data = b_snap.to_dict() or {}
            if b_data.get("booking_status") != "Confirmed":
                continue
            if bookings_overlap(
                b_data.get("booking_date"),
                b_data.get("booking_time"),
                b_data.get("duration_hours", 1),
                req_start,
                req_end,
            ):
                return make_result(
                    False,
                    409,
                    "This slot was just booked by another user for the chosen time window. Please select another slot.",
                )

        if booking_type == "full_day" or int(duration_hours) == 24:
            price_total = float(slot_data.get("day_price", 0))
        else:
            price_total = float(slot_data.get("price_per_hour", 0)) * int(duration_hours)

        booking_id = allocate_next_id(tx, db, "bookings")
        created_at = now_str()
        booking_doc = {
            "booking_id": booking_id,
            "user_id": uid,
            "vehicle_id": vid,
            "area_id": area_id,
            "slot_id": sid,
            "booking_date": clean_date,
            "booking_time": clean_time,
            "duration_hours": int(duration_hours),
            "price_total": price_total,
            "payment_status": "Pending",
            "booking_status": "Confirmed",
            "created_at": created_at,
        }
        tx.set(db.collection("bookings").document(str(booking_id)), booking_doc)
        # Touch the slot doc in the same transaction so concurrent bookings serialize on it
        tx.update(slot_ref, {"last_booking_at": created_at})
        return make_result(
            True,
            200,
            "Booking created. Please complete payment.",
            {"booking_id": booking_id, "price_total": price_total},
        )

    return _book_in_tx(transaction)


# Cancel a booking owned by user_id (or any booking when user_id is None for admin)
def cancel_booking(booking_id, user_id=None):
    db = get_firestore_db()
    b_ref = db.collection("bookings").document(str(int(booking_id)))
    snap = b_ref.get()
    if not snap.exists:
        return make_result(False, 404, "Booking not found or unauthorized.")

    b_data = snap.to_dict() or {}
    if user_id is not None:
        if int(b_data.get("user_id", 0)) != int(user_id):
            return make_result(False, 404, "Booking not found or unauthorized.")
        current_status = b_data.get("booking_status")
        if current_status != "Confirmed":
            return make_result(False, 400, f"Cannot cancel booking with status '{current_status}'.")

    b_ref.update({"booking_status": "Cancelled"})
    if user_id is None:
        return make_result(True, 200, "Booking marked as cancelled by admin.")
    return make_result(True, 200, "Booking cancelled successfully")


# Process payment inside one Firestore transaction, writing payments and marking booking Paid
def process_payment(booking_id, user_id, payment_method):
    bid = int(booking_id)
    uid = int(user_id)
    db = get_firestore_db()
    transaction = db.transaction()

    @firestore.transactional
    def _pay_in_tx(tx):
        booking_ref = db.collection("bookings").document(str(bid))
        booking_snap = booking_ref.get(transaction=tx)
        if not booking_snap.exists:
            return make_result(False, 404, "Booking not found or unauthorized.")

        b_data = booking_snap.to_dict() or {}
        if int(b_data.get("user_id", 0)) != uid:
            return make_result(False, 404, "Booking not found or unauthorized.")

        if b_data.get("payment_status") == "Paid":
            return make_result(False, 400, "This booking is already paid.")

        pay_lookup_ref = db.collection("payments_by_booking").document(str(bid))
        if pay_lookup_ref.get(transaction=tx).exists:
            return make_result(False, 400, "A payment record already exists for this booking.")

        amount = float(b_data.get("price_total", 0))
        payment_id = allocate_next_id(tx, db, "payments")
        payment_doc = {
            "payment_id": payment_id,
            "booking_id": bid,
            "amount": amount,
            "payment_method": payment_method,
            "payment_status": "Paid",
            "payment_date": now_str(),
        }
        tx.set(db.collection("payments").document(str(payment_id)), payment_doc)
        tx.set(pay_lookup_ref, {"payment_id": payment_id})
        tx.update(booking_ref, {"payment_status": "Paid"})
        return make_result(True, 200, f"Payment of BDT {amount} received via {payment_method}.")

    return _pay_in_tx(transaction)


# -----------------------------------------------------------------------------
# ADMIN DASHBOARD, BOOKINGS, PAYMENTS & REPORTS
# -----------------------------------------------------------------------------

# List bookings for admin with batched joins and Python filtering on a limited slice
def list_bookings_for_admin(search="", status_filter="All", limit=200):
    db = get_firestore_db()
    raw_bookings = []
    user_ids = []
    vehicle_ids = []
    slot_ids = []

    snaps = (
        db.collection("bookings")
        .order_by("booking_id", direction=firestore.Query.DESCENDING)
        .limit(int(limit))
        .stream()
    )
    for snap in snaps:
        d = snap.to_dict() or {}
        bid = int(d.get("booking_id", snap.id))
        raw_bookings.append((bid, d))
        user_ids.append(d.get("user_id"))
        vehicle_ids.append(d.get("vehicle_id"))
        slot_ids.append(d.get("slot_id"))

    users_map = batch_get_map(db, "users", user_ids)
    vehicles_map = batch_get_map(db, "vehicles", vehicle_ids)
    slots_map = batch_get_map(db, "parking_slots", slot_ids)
    area_ids = [s.get("area_id") for s in slots_map.values()]
    areas_map = batch_get_map(db, "parking_areas", area_ids)

    q = str(search or "").strip().lower()
    rows = []
    for bid, b in raw_bookings:
        b_status = b.get("booking_status", "Confirmed")
        if status_filter in ["Confirmed", "Completed", "Cancelled"] and b_status != status_filter:
            continue

        u = users_map.get(int(b.get("user_id", 0)), {})
        v = vehicles_map.get(int(b.get("vehicle_id", 0)), {})
        s = slots_map.get(int(b.get("slot_id", 0)), {})
        a = areas_map.get(int(s.get("area_id", b.get("area_id", 0))), {})

        customer_name = u.get("full_name", "")
        vehicle_number = v.get("vehicle_number", "")
        area_name = a.get("area_name", "")

        if q:
            haystack = f"{customer_name} {vehicle_number} {area_name}".lower()
            if q not in haystack:
                continue

        rows.append({
            "booking_id": bid,
            "booking_date": str(b.get("booking_date", "")),
            "booking_time": str(b.get("booking_time", "")),
            "duration_hours": int(b.get("duration_hours", 1)),
            "price_total": float(b.get("price_total", 0)),
            "payment_status": b.get("payment_status", "Pending"),
            "booking_status": b_status,
            "created_at": str(b.get("created_at", "")),
            "customer_name": customer_name,
            "customer_email": u.get("email", ""),
            "customer_phone": u.get("phone", ""),
            "vehicle_number": vehicle_number,
            "vehicle_type": v.get("vehicle_type", ""),
            "slot_number": s.get("slot_number", ""),
            "area_name": area_name,
        })

    return rows


# List payments for admin joined with customer name and email via batched get_all
def list_payments_for_admin(limit=200):
    db = get_firestore_db()
    raw_payments = []
    booking_ids = []
    snaps = (
        db.collection("payments")
        .order_by("payment_id", direction=firestore.Query.DESCENDING)
        .limit(int(limit))
        .stream()
    )
    for snap in snaps:
        d = snap.to_dict() or {}
        raw_payments.append((int(d.get("payment_id", snap.id)), d))
        booking_ids.append(d.get("booking_id"))

    bookings_map = batch_get_map(db, "bookings", booking_ids)
    user_ids = [b.get("user_id") for b in bookings_map.values()]
    users_map = batch_get_map(db, "users", user_ids)

    rows = []
    for pid, p in raw_payments:
        bid = int(p.get("booking_id", 0))
        b = bookings_map.get(bid, {})
        u = users_map.get(int(b.get("user_id", 0)), {})
        rows.append({
            "payment_id": pid,
            "booking_id": bid,
            "amount": float(p.get("amount", 0)),
            "payment_method": p.get("payment_method", ""),
            "payment_status": p.get("payment_status", "Paid"),
            "payment_date": str(p.get("payment_date", "")),
            "customer_name": u.get("full_name", ""),
            "customer_email": u.get("email", ""),
        })

    return rows


# Compute all counts, revenue, area overview, and latest 6 bookings/payments for admin dashboard
def get_admin_dashboard_data(admin_user_id):
    db = get_firestore_db()
    admin_user = get_user_by_id(admin_user_id)

    # 1. Users summary (single equality query avoids composite index)
    total_users = 0
    active_users = 0
    blocked_users = 0
    for snap in db.collection("users").where("role", "==", "user").select(["status"]).stream():
        total_users += 1
        st = (snap.to_dict() or {}).get("status")
        if st == "Active":
            active_users += 1
        elif st == "Blocked":
            blocked_users += 1

    # 2. Vehicles summary using count() aggregation
    total_vehicles = run_count_query(db.collection("vehicles"))
    car_vehicles = run_count_query(db.collection("vehicles").where("vehicle_type", "==", "Car"))
    motorcycle_vehicles = run_count_query(db.collection("vehicles").where("vehicle_type", "==", "Motorcycle"))

    # 3. Parking areas and per-area slot summaries
    areas_list = []
    area_map = {}
    active_areas = 0
    inactive_areas = 0
    for snap in db.collection("parking_areas").stream():
        d = snap.to_dict() or {}
        aid = int(d.get("area_id", snap.id))
        st = d.get("status", "Active")
        if st == "Active":
            active_areas += 1
        elif st == "Inactive":
            inactive_areas += 1
        entry = {
            "area_id": aid,
            "area_name": d.get("area_name", ""),
            "location": d.get("location", ""),
            "status": st,
            "total_slots": 0,
            "available_slots": 0,
            "booked_slots": 0,
            "occupied_slots": 0,
        }
        areas_list.append(entry)
        area_map[aid] = entry

    areas_list.sort(key=lambda item: item["area_id"])

    total_slots = 0
    car_slots = 0
    motorcycle_slots = 0
    available_slots = 0
    booked_slots = 0
    occupied_slots = 0
    for snap in db.collection("parking_slots").select(["area_id", "vehicle_type", "status"]).stream():
        d = snap.to_dict() or {}
        total_slots += 1
        v_type = d.get("vehicle_type")
        if v_type == "Car":
            car_slots += 1
        elif v_type == "Motorcycle":
            motorcycle_slots += 1

        st = d.get("status")
        aid = int(d.get("area_id", 0))
        if aid in area_map:
            area_map[aid]["total_slots"] += 1

        if st == "Available":
            available_slots += 1
            if aid in area_map:
                area_map[aid]["available_slots"] += 1
        elif st == "Booked":
            booked_slots += 1
            if aid in area_map:
                area_map[aid]["booked_slots"] += 1
        elif st == "Occupied":
            occupied_slots += 1
            if aid in area_map:
                area_map[aid]["occupied_slots"] += 1

    # 4. Bookings counts using Firestore count() aggregation
    total_bookings = run_count_query(db.collection("bookings"))
    confirmed_bookings = run_count_query(db.collection("bookings").where("booking_status", "==", "Confirmed"))
    completed_bookings = run_count_query(db.collection("bookings").where("booking_status", "==", "Completed"))
    cancelled_bookings = run_count_query(db.collection("bookings").where("booking_status", "==", "Cancelled"))

    # 5. Payments counts & Paid revenue using Firestore count() + sum() aggregation
    total_payments = run_count_query(db.collection("payments"))
    paid_payments, total_revenue = run_count_and_sum(
        db.collection("payments").where("payment_status", "==", "Paid"),
        "amount",
    )
    pending_payments = run_count_query(db.collection("payments").where("payment_status", "==", "Pending"))
    failed_payments = run_count_query(db.collection("payments").where("payment_status", "==", "Failed"))

    # 6. Recent 6 bookings and recent 6 payments with batched joins
    recent_bookings = []
    for b in list_bookings_for_admin(limit=6):
        recent_bookings.append({
            "booking_id": b["booking_id"],
            "booking_date": b["booking_date"],
            "booking_time": b["booking_time"][:5],
            "duration_hours": b["duration_hours"],
            "price_total": b["price_total"],
            "payment_status": b["payment_status"],
            "booking_status": b["booking_status"],
            "created_at": b["created_at"],
            "customer_name": b["customer_name"],
            "customer_email": b["customer_email"],
            "vehicle_number": b["vehicle_number"],
            "vehicle_type": b["vehicle_type"],
            "slot_number": b["slot_number"],
            "area_name": b["area_name"],
        })

    recent_payments = []
    for p in list_payments_for_admin(limit=6):
        recent_payments.append({
            "payment_id": p["payment_id"],
            "booking_id": p["booking_id"],
            "amount": p["amount"],
            "payment_method": p["payment_method"],
            "payment_status": p["payment_status"],
            "payment_date": p["payment_date"],
            "customer_name": p["customer_name"],
        })

    return {
        "admin_user": admin_user,
        "counts": {
            "users": total_users,
            "active_users": active_users,
            "blocked_users": blocked_users,
            "vehicles": total_vehicles,
            "car_vehicles": car_vehicles,
            "motorcycle_vehicles": motorcycle_vehicles,
            "areas": len(areas_list),
            "active_areas": active_areas,
            "inactive_areas": inactive_areas,
            "slots": total_slots,
            "car_slots": car_slots,
            "motorcycle_slots": motorcycle_slots,
            "available_slots": available_slots,
            "booked_slots": booked_slots,
            "occupied_slots": occupied_slots,
            "bookings": total_bookings,
            "confirmed_bookings": confirmed_bookings,
            "completed_bookings": completed_bookings,
            "cancelled_bookings": cancelled_bookings,
            "total_payments": total_payments,
            "paid_payments": paid_payments,
            "pending_payments": pending_payments,
            "failed_payments": failed_payments,
            "payments_count": paid_payments,
            "total_revenue": total_revenue,
        },
        "areas_overview": areas_list,
        "recent_bookings": recent_bookings,
        "recent_payments": recent_payments,
    }


# Compute grouped analytics for /api/admin/reports
def get_admin_reports_data():
    db = get_firestore_db()

    # 1. Revenue by payment method for Paid payments
    method_totals = {}
    paid_snaps = (
        db.collection("payments")
        .where("payment_status", "==", "Paid")
        .select(["payment_method", "amount"])
        .stream()
    )
    for snap in paid_snaps:
        d = snap.to_dict() or {}
        method = d.get("payment_method", "")
        if method not in method_totals:
            method_totals[method] = {"payment_method": method, "count": 0, "total": 0.0}
        method_totals[method]["count"] += 1
        method_totals[method]["total"] += float(d.get("amount", 0) or 0)

    revenue_by_method = list(method_totals.values())

    # 2. Load areas and slots once for bookings_by_area and usage_by_type
    area_stats = {}
    for snap in db.collection("parking_areas").select(["area_id", "area_name"]).stream():
        d = snap.to_dict() or {}
        aid = int(d.get("area_id", snap.id))
        area_stats[aid] = {
            "area_name": d.get("area_name", ""),
            "total_bookings": 0,
            "total_revenue": 0.0,
        }

    slot_to_area = {}
    slot_to_type = {}
    type_stats = {}
    for snap in db.collection("parking_slots").select(["slot_id", "area_id", "vehicle_type"]).stream():
        d = snap.to_dict() or {}
        sid = int(d.get("slot_id", snap.id))
        aid = int(d.get("area_id", 0))
        v_type = d.get("vehicle_type", "")
        slot_to_area[sid] = aid
        slot_to_type[sid] = v_type
        if v_type and v_type not in type_stats:
            type_stats[v_type] = {"vehicle_type": v_type, "bookings_count": 0}

    for snap in db.collection("bookings").select(["slot_id", "price_total"]).stream():
        d = snap.to_dict() or {}
        sid = int(d.get("slot_id", 0))
        aid = slot_to_area.get(sid)
        if aid in area_stats:
            area_stats[aid]["total_bookings"] += 1
            area_stats[aid]["total_revenue"] += float(d.get("price_total", 0) or 0)
        v_type = slot_to_type.get(sid)
        if v_type in type_stats:
            type_stats[v_type]["bookings_count"] += 1

    return {
        "revenue_by_method": revenue_by_method,
        "bookings_by_area": list(area_stats.values()),
        "usage_by_type": list(type_stats.values()),
    }
