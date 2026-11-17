"""
ParkEase Flask Application
Backend API and Static Server for ParkEase Parking Booking System (Chattogram City).
Uses Google Cloud Firestore via python/database.py (no SQL/MySQL).
"""

import os
import re
import json
import hmac
import hashlib
import secrets
from functools import wraps
from urllib.parse import urlparse
from urllib.request import Request as UrlRequest, urlopen
from datetime import datetime
from flask import Flask, request, jsonify, session, send_from_directory, abort
from werkzeug.exceptions import HTTPException
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv

# Import Firestore data layer plain functions
from database import (
    parse_booking_start,
    get_user_by_id,
    get_user_by_email,
    create_user,
    update_user_profile,
    update_user_password,
    list_users_for_admin,
    update_user_status,
    list_user_vehicles,
    create_vehicle,
    edit_vehicle as db_edit_vehicle,
    delete_vehicle as db_delete_vehicle,
    list_vehicles_for_admin,
    list_active_areas_with_counts,
    list_areas_for_admin,
    create_area as db_create_area,
    update_area as db_update_area,
    list_slots_for_admin,
    create_slot as db_create_slot,
    update_slot as db_update_slot,
    search_available_slots,
    list_user_bookings,
    create_booking as db_create_booking,
    cancel_booking as db_cancel_booking,
    process_payment as db_process_payment,
    list_bookings_for_admin,
    list_payments_for_admin,
    get_admin_dashboard_data,
    get_admin_reports_data,
)

# Load environment variables from python/.env (if present) and root .env
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))
load_dotenv()

app = Flask(__name__, static_folder="../", static_url_path="")
app.secret_key = os.getenv("FLASK_SECRET_KEY") or os.urandom(32)
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = (
    os.getenv("VERCEL") == "1" or os.getenv("FLASK_COOKIE_SECURE", "").lower() == "true"
)

# Simple in-memory rate limiters and OTP store per serverless instance
login_attempts = {}
demo_login_attempts = {}
otp_store = {}

OTP_TTL_SECONDS = 300
OTP_COOLDOWN_SECONDS = 45
OTP_MAX_ATTEMPTS = 5


# -----------------------------------------------------------------------------
# HELPER DECORATORS FOR AUTHENTICATION & ROLE CHECKS
# -----------------------------------------------------------------------------

# Protect API routes that require a logged-in standard user
def user_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"success": False, "message": "Authentication required. Please log in."}), 401
        if session.get("role") != "user":
            return jsonify({"success": False, "message": "Access denied. User role required."}), 403
        return f(*args, **kwargs)
    return decorated_function


# Protect API routes that require a logged-in administrator
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"success": False, "message": "Admin authentication required."}), 401
        if session.get("role") != "admin":
            return jsonify({"success": False, "message": "Access denied. Admin role required."}), 403
        return f(*args, **kwargs)
    return decorated_function


# -----------------------------------------------------------------------------
# STATIC FILE SERVING & SECURITY RULES
# -----------------------------------------------------------------------------

# Reject cross-origin state-changing API requests (CSRF protection)
@app.before_request
def verify_same_origin():
    if request.method in ["POST", "PUT", "PATCH", "DELETE"] and request.path.startswith("/api/"):
        origin = request.headers.get("Origin", "").strip()
        referer = request.headers.get("Referer", "").strip()
        expected_host = request.host.lower()

        if origin:
            origin_host = urlparse(origin).netloc.lower()
            if origin_host and origin_host != expected_host:
                return jsonify({"success": False, "message": "Cross-origin request blocked."}), 403
        elif referer:
            referer_host = urlparse(referer).netloc.lower()
            if referer_host and referer_host != expected_host:
                return jsonify({"success": False, "message": "Cross-origin request blocked."}), 403


# Add standard security and cache headers to every HTTP response
@app.after_request
def add_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if request.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"
    return response


# Serve the public landing page
@app.route("/")
def serve_index():
    return send_from_directory("../", "index.html")


# Serve public static files while blocking backend, rules, and config files
@app.route("/<path:filename>")
def serve_static(filename):
    clean_path = filename.replace("\\", "/").strip("/")
    blocked_prefixes = (
        "python",
        "database",
        "api",
        ".env",
        ".env.example",
        ".git",
        ".vercelignore",
        "server.ts",
        "package.json",
        "requirements.txt",
        "firestore.rules",
        "firebase-applet-config.json",
        "firebase-blueprint.json",
    )
    for prefix in blocked_prefixes:
        if clean_path == prefix or clean_path.startswith(prefix + "/"):
            abort(403)
    return send_from_directory("../", clean_path)


# Return custom 404 page for missing static routes or JSON for missing API endpoints
@app.errorhandler(404)
def not_found_error(e):
    if request.path.startswith("/api/"):
        return jsonify({"success": False, "message": "Endpoint not found"}), 404
    try:
        return send_from_directory("../", "404.html"), 404
    except Exception:
        return jsonify({"success": False, "message": "Page not found"}), 404


# Return safe JSON error on unexpected server failures without leaking secrets or stack traces
@app.errorhandler(Exception)
def handle_unexpected_error(err):
    if isinstance(err, HTTPException):
        return err
    return jsonify({"success": False, "message": "Internal server error. Please try again."}), 500


# Extract client IP address safely behind Vercel/reverse proxies
def get_client_ip():
    forwarded_for = request.headers.get("X-Forwarded-For", "")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.remote_addr or "unknown"


# Apply a sliding-window IP rate limit (default 10 requests per 60 seconds)
def is_ip_rate_limited(store, client_ip, limit=10, window_seconds=60):
    now_ts = datetime.now().timestamp()
    previous = store.get(client_ip, [])
    recent = []
    for ts in previous:
        if now_ts - ts < window_seconds:
            recent.append(ts)
    if len(recent) >= limit:
        store[client_ip] = recent
        return True
    recent.append(now_ts)
    store[client_ip] = recent
    return False


# -----------------------------------------------------------------------------
# AUTHENTICATION ROUTES (USER & ADMIN)
# -----------------------------------------------------------------------------

# Register a new user account in Firestore with legal consent check
@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    full_name = data.get("full_name", "").strip()
    email = data.get("email", "").strip().lower()
    phone = data.get("phone", "").strip()
    password = data.get("password", "")
    terms_consent = data.get("terms_consent", False)

    if not full_name or not email or not phone or not password:
        return jsonify({"success": False, "message": "All fields are required."}), 400

    if not terms_consent:
        return jsonify({"success": False, "message": "You must agree to the Terms & Conditions and Privacy Policy."}), 400

    password_hash = generate_password_hash(password)
    res = create_user(full_name, email, phone, password_hash, role="user", status="Active")
    if not res["ok"]:
        return jsonify({"success": False, "message": res["message"]}), res["status"]

    return jsonify({
        "success": True,
        "message": res["message"],
        "user_id": res["data"]["user_id"],
    })


# Authenticate a standard user and store user_id, role, and full_name in Flask session
@app.route("/api/login", methods=["POST"])
def login():
    if is_ip_rate_limited(login_attempts, get_client_ip()):
        return jsonify({"success": False, "message": "Too many login attempts. Please wait one minute."}), 429

    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    user = get_user_by_email(email)
    if not user:
        return jsonify({"success": False, "message": "Invalid email or password."}), 401

    if user.get("status") == "Blocked":
        return jsonify({"success": False, "message": "Your account has been blocked. Please contact support."}), 403

    if not check_password_hash(user.get("password_hash", ""), password):
        return jsonify({"success": False, "message": "Invalid email or password."}), 401

    if user.get("role") != "user":
        return jsonify({"success": False, "message": "Please use the admin login portal."}), 403

    session["user_id"] = user["user_id"]
    session["role"] = user["role"]
    session["full_name"] = user["full_name"]

    return jsonify({
        "success": True,
        "message": "Login successful",
        "user": {
            "user_id": user["user_id"],
            "full_name": user["full_name"],
            "email": user["email"],
            "role": user["role"],
        },
    })


# Authenticate an administrator and create an admin session
@app.route("/api/admin/login", methods=["POST"])
def admin_login():
    if is_ip_rate_limited(login_attempts, get_client_ip()):
        return jsonify({"success": False, "message": "Too many login attempts. Please wait one minute."}), 429

    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    user = get_user_by_email(email)
    if not user or user.get("role") != "admin":
        return jsonify({"success": False, "message": "Invalid admin credentials."}), 401

    if user.get("status") == "Blocked":
        return jsonify({"success": False, "message": "Admin account is blocked."}), 403

    if not check_password_hash(user.get("password_hash", ""), password):
        return jsonify({"success": False, "message": "Invalid admin credentials."}), 401

    session["user_id"] = user["user_id"]
    session["role"] = "admin"
    session["full_name"] = user["full_name"]

    return jsonify({
        "success": True,
        "message": "Admin login successful",
        "admin": {
            "user_id": user["user_id"],
            "full_name": user["full_name"],
            "email": user["email"],
        },
    })


# Return True only when DEMO_MODE environment variable equals exact 'true'
def is_demo_mode_enabled():
    return os.getenv("DEMO_MODE", "").strip() == "true"


# Expose whether preset demo account mode is enabled without leaking emails or passwords
@app.route("/api/demo-status", methods=["GET"])
def demo_status():
    response = jsonify({"demo": is_demo_mode_enabled()})
    response.headers["Cache-Control"] = "no-store"
    return response


# Sign in the configured demo user or demo admin when DEMO_MODE is exactly 'true'
@app.route("/api/demo-login", methods=["POST"])
def demo_login():
    if not is_demo_mode_enabled():
        return jsonify({"success": False, "message": "Not found."}), 404

    if is_ip_rate_limited(demo_login_attempts, get_client_ip()):
        return jsonify({
            "success": False,
            "message": "Too many demo login attempts. Please wait one minute.",
        }), 429

    data = request.get_json() or {}
    which = str(data.get("which", "")).strip().lower()
    if which not in ["user", "admin"]:
        return jsonify({"success": False, "message": "Invalid demo account type."}), 400

    # Read target email strictly from environment variables, never from browser input
    if which == "user":
        target_email = os.getenv("DEMO_USER_EMAIL", "").strip().lower()
        expected_role = "user"
    else:
        target_email = os.getenv("DEMO_ADMIN_EMAIL", "").strip().lower()
        expected_role = "admin"

    if not target_email:
        return jsonify({
            "success": False,
            "message": "Demo account not found. Ask the project owner to run the demo data script.",
        }), 404

    user = get_user_by_email(target_email)
    if not user:
        return jsonify({
            "success": False,
            "message": "Demo account not found. Ask the project owner to run the demo data script.",
        }), 404

    if user.get("status") != "Active":
        return jsonify({
            "success": False,
            "message": "This demo account is blocked. Please contact support.",
        }), 403

    if user.get("role") != expected_role:
        return jsonify({
            "success": False,
            "message": f"Demo account role mismatch. Expected {expected_role}.",
        }), 403

    # Create Flask session with the exact same keys as normal login
    session["user_id"] = user["user_id"]
    session["role"] = user["role"]
    session["full_name"] = user["full_name"]

    if expected_role == "admin":
        return jsonify({
            "success": True,
            "message": "Admin login successful",
            "admin": {
                "user_id": user["user_id"],
                "full_name": user["full_name"],
                "email": user["email"],
            },
        })

    return jsonify({
        "success": True,
        "message": "Login successful",
        "user": {
            "user_id": user["user_id"],
            "full_name": user["full_name"],
            "email": user["email"],
            "role": user["role"],
        },
    })


# Clear current user or admin Flask session
@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"success": True, "message": "Logged out successfully"})


# Return currently authenticated user profile without exposing password_hash
@app.route("/api/me", methods=["GET"])
def get_current_user():
    if "user_id" not in session:
        return jsonify({"authenticated": False}), 200

    user = get_user_by_id(session["user_id"])
    if not user or user.get("status") == "Blocked":
        session.clear()
        return jsonify({"authenticated": False, "message": "Account blocked or unavailable"}), 200

    safe_user = {
        "user_id": user["user_id"],
        "full_name": user.get("full_name", ""),
        "email": user.get("email", ""),
        "phone": user.get("phone", ""),
        "role": user.get("role", "user"),
        "status": user.get("status", "Active"),
    }
    return jsonify({"authenticated": True, "user": safe_user})


# -----------------------------------------------------------------------------
# SMS OTP ROUTES (FLASK BACKEND ONLY)
# -----------------------------------------------------------------------------

# Normalize Bangladesh or E.164 mobile numbers cleanly
def normalize_phone_number(raw_phone):
    cleaned = re.sub(r"[\s()-]", "", str(raw_phone or "")).strip()
    if not cleaned:
        return None
    if re.match(r"^01[3-9]\d{8}$", cleaned):
        return "+88" + cleaned
    if re.match(r"^8801[3-9]\d{8}$", cleaned):
        return "+" + cleaned
    if re.match(r"^\+8801[3-9]\d{8}$", cleaned):
        return cleaned
    if re.match(r"^\+[1-9]\d{9,14}$", cleaned):
        return cleaned
    return None


# Mask middle digits of a normalized phone number for UI display
def mask_phone_number(normalized_phone):
    local = "0" + normalized_phone[4:] if normalized_phone.startswith("+880") else normalized_phone
    if len(local) <= 5:
        return local
    stars = "*" * max(len(local) - 5, 4)
    return f"{local[:3]}{stars}{local[-2:]}"


# Hash a 6-digit OTP code with SHA-256 bound to the normalized phone number
def hash_otp_code(normalized_phone, code):
    return hashlib.sha256(f"{normalized_phone}:{code}".encode("utf-8")).hexdigest()


# Generate and send a 6-digit SMS OTP using SMS_WEBHOOK_URL or sandbox fallback
@app.route("/api/otp/send", methods=["POST"])
def send_sms_otp():
    data = request.get_json() or {}
    normalized = normalize_phone_number(data.get("phone", ""))
    if not normalized:
        return jsonify({
            "success": False,
            "error": "Enter a valid mobile number (e.g. 018XXXXXXXX or +88018XXXXXXXX).",
        }), 400

    now_ts = datetime.now().timestamp()
    existing = otp_store.get(normalized)
    if existing:
        elapsed_sec = int(now_ts - existing["last_sent_at"])
        if elapsed_sec < OTP_COOLDOWN_SECONDS:
            retry_after = OTP_COOLDOWN_SECONDS - elapsed_sec
            return jsonify({
                "success": False,
                "error": f"Please wait {retry_after} seconds before requesting a new OTP.",
                "retryAfterSeconds": retry_after,
            }), 429

    code = str(secrets.randbelow(900000) + 100000)
    otp_store[normalized] = {
        "code_hash": hash_otp_code(normalized, code),
        "expires_at": now_ts + OTP_TTL_SECONDS,
        "attempts": 0,
        "last_sent_at": now_ts,
    }

    masked_phone = mask_phone_number(normalized)
    sms_webhook_url = os.getenv("SMS_WEBHOOK_URL", "").strip()

    if sms_webhook_url:
        try:
            payload = json.dumps({
                "to": normalized,
                "message": f"Your ParkEase Chattogram verification code is {code}. Valid for 5 minutes.",
            }).encode("utf-8")
            req = UrlRequest(
                sms_webhook_url,
                data=payload,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urlopen(req, timeout=10) as resp:
                if resp.status < 200 or resp.status >= 300:
                    raise RuntimeError("SMS gateway rejected request")

            return jsonify({
                "success": True,
                "maskedPhone": masked_phone,
                "expiresInSeconds": OTP_TTL_SECONDS,
                "resendCooldownSeconds": OTP_COOLDOWN_SECONDS,
                "deliveryMode": "sms",
            })
        except Exception:
            otp_store.pop(normalized, None)
            return jsonify({
                "success": False,
                "error": "Unable to dispatch SMS via configured gateway. Please try again.",
            }), 502

    return jsonify({
        "success": True,
        "maskedPhone": masked_phone,
        "expiresInSeconds": OTP_TTL_SECONDS,
        "resendCooldownSeconds": OTP_COOLDOWN_SECONDS,
        "deliveryMode": "sandbox",
        "sandboxOtp": code,
    })


# Verify a submitted 6-digit SMS OTP code with attempt limits
@app.route("/api/otp/verify", methods=["POST"])
def verify_sms_otp():
    data = request.get_json() or {}
    normalized = normalize_phone_number(data.get("phone", ""))
    clean_code = re.sub(r"\s+", "", str(data.get("code", ""))).strip()

    if not normalized:
        return jsonify({"success": False, "error": "Invalid mobile number format."}), 400

    if not re.match(r"^\d{6}$", clean_code):
        return jsonify({"success": False, "error": "Enter the 6-digit numeric verification code."}), 400

    record = otp_store.get(normalized)
    if not record:
        return jsonify({
            "success": False,
            "error": "No active OTP found for this number. Please request a new code.",
        }), 400

    if datetime.now().timestamp() > record["expires_at"]:
        otp_store.pop(normalized, None)
        return jsonify({
            "success": False,
            "error": "This OTP code has expired. Please request a new code.",
        }), 400

    if record["attempts"] >= OTP_MAX_ATTEMPTS:
        otp_store.pop(normalized, None)
        return jsonify({
            "success": False,
            "error": "Too many incorrect attempts. Please request a new verification code.",
        }), 429

    candidate_hash = hash_otp_code(normalized, clean_code)
    if not hmac.compare_digest(candidate_hash, record["code_hash"]):
        record["attempts"] += 1
        remaining = OTP_MAX_ATTEMPTS - record["attempts"]
        if remaining <= 0:
            otp_store.pop(normalized, None)
            return jsonify({
                "success": False,
                "error": "Too many incorrect attempts. Please request a new verification code.",
            }), 429
        unit = "attempt" if remaining == 1 else "attempts"
        return jsonify({
            "success": False,
            "error": f"Incorrect OTP code. {remaining} {unit} remaining.",
        }), 400

    otp_store.pop(normalized, None)
    return jsonify({
        "success": True,
        "verifiedAt": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "normalizedPhone": normalized,
    })


# -----------------------------------------------------------------------------
# USER PROFILE & PASSWORD ROUTES
# -----------------------------------------------------------------------------

# Update user full_name and phone number
@app.route("/api/profile", methods=["PUT"])
@user_required
def update_profile():
    data = request.get_json() or {}
    full_name = data.get("full_name", "").strip()
    phone = data.get("phone", "").strip()

    if not full_name or not phone:
        return jsonify({"success": False, "message": "Name and phone are required."}), 400

    res = update_user_profile(session["user_id"], full_name, phone)
    if not res["ok"]:
        return jsonify({"success": False, "message": res["message"]}), res["status"]

    session["full_name"] = full_name
    return jsonify({"success": True, "message": res["message"]})


# Change user password after checking old password
@app.route("/api/profile/password", methods=["PUT"])
@user_required
def change_password():
    data = request.get_json() or {}
    old_password = data.get("old_password", "")
    new_password = data.get("new_password", "")

    if not old_password or not new_password:
        return jsonify({"success": False, "message": "Both old and new passwords are required."}), 400

    user = get_user_by_id(session["user_id"])
    if not user or not check_password_hash(user.get("password_hash", ""), old_password):
        return jsonify({"success": False, "message": "Incorrect current password."}), 400

    new_hash = generate_password_hash(new_password)
    res = update_user_password(session["user_id"], new_hash)
    if not res["ok"]:
        return jsonify({"success": False, "message": res["message"]}), res["status"]

    return jsonify({"success": True, "message": res["message"]})


# -----------------------------------------------------------------------------
# VEHICLES MANAGEMENT (USER SPECIFIC)
# -----------------------------------------------------------------------------

# Return all vehicles owned by the logged-in user
@app.route("/api/vehicles", methods=["GET"])
@user_required
def get_user_vehicles():
    vehicles = list_user_vehicles(session["user_id"])
    return jsonify({"success": True, "vehicles": vehicles})


# Add a new vehicle for the logged-in user
@app.route("/api/vehicles", methods=["POST"])
@user_required
def add_vehicle():
    data = request.get_json() or {}
    vehicle_number = data.get("vehicle_number", "").strip().upper()
    vehicle_type = data.get("vehicle_type", "").strip()
    brand = data.get("brand", "").strip()
    model = data.get("model", "").strip()

    if not vehicle_number or vehicle_type not in ["Car", "Motorcycle"] or not brand or not model:
        return jsonify({"success": False, "message": "All vehicle details are required."}), 400

    res = create_vehicle(session["user_id"], vehicle_number, vehicle_type, brand, model)
    if not res["ok"]:
        return jsonify({"success": False, "message": res["message"]}), res["status"]

    return jsonify({
        "success": True,
        "message": res["message"],
        "vehicle_id": res["data"]["vehicle_id"],
    })


# Edit an existing vehicle belonging strictly to the logged-in user
@app.route("/api/vehicles/<int:vehicle_id>", methods=["PUT"])
@user_required
def edit_vehicle(vehicle_id):
    data = request.get_json() or {}
    brand = data.get("brand", "").strip()
    model = data.get("model", "").strip()
    status = data.get("status", "Active")

    if status not in ["Active", "Inactive"]:
        return jsonify({"success": False, "message": "Invalid vehicle status."}), 400

    res = db_edit_vehicle(vehicle_id, session["user_id"], brand, model, status)
    if not res["ok"]:
        return jsonify({"success": False, "message": res["message"]}), res["status"]

    return jsonify({"success": True, "message": res["message"]})


# Delete a vehicle owned by the logged-in user if it has no Confirmed bookings
@app.route("/api/vehicles/<int:vehicle_id>", methods=["DELETE"])
@user_required
def delete_vehicle(vehicle_id):
    res = db_delete_vehicle(vehicle_id, session["user_id"])
    if not res["ok"]:
        return jsonify({"success": False, "message": res["message"]}), res["status"]

    return jsonify({"success": True, "message": res["message"]})


# -----------------------------------------------------------------------------
# PARKING SEARCH & OVERLAP CHECKING
# -----------------------------------------------------------------------------

# Return active parking areas with total and Available slot counts
@app.route("/api/areas", methods=["GET"])
def get_parking_areas():
    areas = list_active_areas_with_counts()
    return jsonify({"success": True, "areas": areas})


# Search available slots matching area, vehicle type, date, time, and duration
@app.route("/api/slots/search", methods=["GET"])
def search_slots():
    area_id = request.args.get("area_id")
    vehicle_type = request.args.get("vehicle_type")
    b_date = request.args.get("date")
    b_time = request.args.get("time")
    duration = request.args.get("duration", 1, type=int)
    booking_type = request.args.get("booking_type", "hourly").strip().lower()
    if booking_type == "full_day":
        duration = 24

    if not area_id or not vehicle_type or not b_date or not b_time or duration < 1:
        return jsonify({"success": False, "message": "Missing search parameters."}), 400

    available_slots = search_available_slots(
        area_id,
        vehicle_type,
        b_date,
        b_time,
        duration,
        booking_type=booking_type,
    )
    return jsonify({
        "success": True,
        "slots": available_slots,
        "duration": duration,
        "booking_type": booking_type,
    })


# -----------------------------------------------------------------------------
# BOOKINGS & PAYMENTS (USER)
# -----------------------------------------------------------------------------

# Return all bookings belonging to the logged-in user
@app.route("/api/bookings", methods=["GET"])
@user_required
def get_user_bookings():
    bookings = list_user_bookings(session["user_id"])
    return jsonify({"success": True, "bookings": bookings})


# Create a booking inside an atomic Firestore transaction with overlap validation
@app.route("/api/bookings", methods=["POST"])
@user_required
def create_booking():
    data = request.get_json() or {}
    slot_id = data.get("slot_id")
    vehicle_id = data.get("vehicle_id")
    booking_date_str = data.get("booking_date")
    booking_time_str = data.get("booking_time")
    booking_type = str(data.get("booking_type", "hourly")).strip().lower()
    duration_hours = 24 if booking_type == "full_day" else data.get("duration_hours", 1)

    try:
        duration_hours = int(duration_hours)
    except Exception:
        return jsonify({"success": False, "message": "Invalid booking duration."}), 400

    req_start = parse_booking_start(booking_date_str, booking_time_str)
    if not slot_id or not vehicle_id or req_start is None or duration_hours < 1:
        return jsonify({"success": False, "message": "Invalid booking parameters."}), 400

    res = db_create_booking(
        session["user_id"],
        slot_id,
        vehicle_id,
        booking_date_str,
        booking_time_str,
        duration_hours,
        booking_type=booking_type,
    )
    if not res["ok"]:
        return jsonify({"success": False, "message": res["message"]}), res["status"]

    return jsonify({
        "success": True,
        "message": res["message"],
        "booking_id": res["data"]["booking_id"],
        "price_total": res["data"]["price_total"],
    })


# Cancel an upcoming confirmed booking belonging to the logged-in user
@app.route("/api/bookings/<int:booking_id>/cancel", methods=["PUT"])
@user_required
def cancel_booking(booking_id):
    res = db_cancel_booking(booking_id, user_id=session["user_id"])
    if not res["ok"]:
        return jsonify({"success": False, "message": res["message"]}), res["status"]

    return jsonify({"success": True, "message": res["message"]})


# Process payment atomically inside a Firestore transaction and mark booking Paid
@app.route("/api/payments", methods=["POST"])
@user_required
def process_payment():
    data = request.get_json() or {}
    booking_id = data.get("booking_id")
    payment_method = data.get("payment_method")

    valid_methods = ["bKash", "Nagad", "Rocket", "Visa", "MasterCard"]
    if payment_method not in valid_methods:
        return jsonify({"success": False, "message": "Invalid payment method selected."}), 400

    if not booking_id:
        return jsonify({"success": False, "message": "Booking not found or unauthorized."}), 404

    res = db_process_payment(booking_id, session["user_id"], payment_method)
    if not res["ok"]:
        return jsonify({"success": False, "message": res["message"]}), res["status"]

    return jsonify({"success": True, "message": res["message"]})


# -----------------------------------------------------------------------------
# ADMIN PORTAL API ROUTES
# -----------------------------------------------------------------------------

# Return database counts, area summaries, and recent activity for the admin dashboard
@app.route("/api/admin/dashboard", methods=["GET"])
@admin_required
def admin_dashboard_counts():
    summary = get_admin_dashboard_data(session["user_id"])
    admin_user = summary.get("admin_user")

    return jsonify({
        "success": True,
        "admin": {
            "user_id": int(admin_user["user_id"]) if admin_user else session["user_id"],
            "full_name": admin_user["full_name"] if admin_user else session.get("full_name", "Administrator"),
            "role": "Admin",
        },
        "counts": summary["counts"],
        "areas_overview": summary["areas_overview"],
        "recent_bookings": summary["recent_bookings"],
        "recent_payments": summary["recent_payments"],
    })


# List registered users for admin with Python substring and status filtering
@app.route("/api/admin/users", methods=["GET"])
@admin_required
def admin_list_users():
    search = request.args.get("search", "").strip()
    status_filter = request.args.get("status", "All")
    users = list_users_for_admin(search=search, status_filter=status_filter)
    return jsonify({"success": True, "users": users})


# Block or unblock a user account
@app.route("/api/admin/users/<int:user_id>/status", methods=["PUT"])
@admin_required
def admin_toggle_user_status(user_id):
    data = request.get_json() or {}
    new_status = data.get("status")
    if new_status not in ["Active", "Blocked"]:
        return jsonify({"success": False, "message": "Invalid status."}), 400

    res = update_user_status(user_id, new_status)
    if not res["ok"]:
        return jsonify({"success": False, "message": res["message"]}), res["status"]

    return jsonify({"success": True, "message": res["message"]})


# List vehicles for admin joined with owner name/email/phone and optional filters
@app.route("/api/admin/vehicles", methods=["GET"])
@admin_required
def admin_list_vehicles():
    search = request.args.get("search", "").strip()
    type_filter = request.args.get("type", "All")
    vehicles = list_vehicles_for_admin(search=search, type_filter=type_filter)
    return jsonify({"success": True, "vehicles": vehicles})


# List all parking areas or create a new parking area for admin
@app.route("/api/admin/areas", methods=["GET", "POST"])
@admin_required
def admin_manage_areas():
    if request.method == "POST":
        data = request.get_json() or {}
        name = data.get("area_name", "").strip()
        location = data.get("location", "").strip()
        status = data.get("status", "Active")

        if not name or not location:
            return jsonify({"success": False, "message": "Area name and location are required."}), 400

        res = db_create_area(name, location, status=status)
        if not res["ok"]:
            return jsonify({"success": False, "message": res["message"]}), res["status"]

        return jsonify({
            "success": True,
            "message": res["message"],
            "area_id": res["data"]["area_id"],
        })

    areas = list_areas_for_admin()
    return jsonify({"success": True, "areas": areas})


# Update an existing parking area
@app.route("/api/admin/areas/<int:area_id>", methods=["PUT"])
@admin_required
def admin_update_area(area_id):
    data = request.get_json() or {}
    name = data.get("area_name", "").strip()
    location = data.get("location", "").strip()
    status = data.get("status", "Active")

    if not name or not location:
        return jsonify({"success": False, "message": "Area name and location are required."}), 400

    res = db_update_area(area_id, name, location, status)
    if not res["ok"]:
        return jsonify({"success": False, "message": res["message"]}), res["status"]

    return jsonify({"success": True, "message": res["message"]})


# List all slots with area name or create a new parking slot for admin
@app.route("/api/admin/slots", methods=["GET", "POST"])
@admin_required
def admin_manage_slots():
    if request.method == "POST":
        data = request.get_json() or {}
        area_id = data.get("area_id")
        slot_number = data.get("slot_number", "").strip().upper()
        vehicle_type = data.get("vehicle_type")
        price_per_hour = data.get("price_per_hour")
        day_price = data.get("day_price")
        status = data.get("status", "Available")

        if day_price is None and vehicle_type in ["Car", "Motorcycle"]:
            day_price = 2000.00 if vehicle_type == "Car" else 1000.00

        if not area_id or not slot_number or vehicle_type not in ["Car", "Motorcycle"] or not price_per_hour or day_price is None:
            return jsonify({"success": False, "message": "All fields are required."}), 400

        res = db_create_slot(area_id, slot_number, vehicle_type, price_per_hour, day_price, status=status)
        if not res["ok"]:
            return jsonify({"success": False, "message": res["message"]}), res["status"]

        return jsonify({
            "success": True,
            "message": res["message"],
            "slot_id": res["data"]["slot_id"],
        })

    slots = list_slots_for_admin()
    return jsonify({"success": True, "slots": slots})


# Update slot hourly/day prices and availability status
@app.route("/api/admin/slots/<int:slot_id>", methods=["PUT"])
@admin_required
def admin_update_slot(slot_id):
    data = request.get_json() or {}
    price_per_hour = data.get("price_per_hour")
    day_price = data.get("day_price")
    status = data.get("status")

    if price_per_hour is None:
        return jsonify({"success": False, "message": "Price per hour is required."}), 400

    if status not in ["Available", "Booked", "Occupied"]:
        return jsonify({"success": False, "message": "Invalid slot status."}), 400

    res = db_update_slot(slot_id, price_per_hour, status, day_price=day_price)
    if not res["ok"]:
        return jsonify({"success": False, "message": res["message"]}), res["status"]

    return jsonify({"success": True, "message": res["message"]})


# List bookings across all users for admin with optional search and status filter
@app.route("/api/admin/bookings", methods=["GET"])
@admin_required
def admin_list_bookings():
    search = request.args.get("search", "").strip()
    status_filter = request.args.get("status", "All")
    bookings = list_bookings_for_admin(search=search, status_filter=status_filter)
    return jsonify({"success": True, "bookings": bookings})


# Allow admin to cancel any booking
@app.route("/api/admin/bookings/<int:booking_id>/cancel", methods=["PUT"])
@admin_required
def admin_cancel_booking(booking_id):
    res = db_cancel_booking(booking_id, user_id=None)
    if not res["ok"]:
        return jsonify({"success": False, "message": res["message"]}), res["status"]

    return jsonify({"success": True, "message": res["message"]})


# List recent payments with customer details for admin
@app.route("/api/admin/payments", methods=["GET"])
@admin_required
def admin_list_payments():
    payments = list_payments_for_admin()
    return jsonify({"success": True, "payments": payments})


# Return analytics data for bookings, revenue, and slot utilization
@app.route("/api/admin/reports", methods=["GET"])
@admin_required
def admin_reports():
    reports = get_admin_reports_data()
    return jsonify({
        "success": True,
        "revenue_by_method": reports["revenue_by_method"],
        "bookings_by_area": reports["bookings_by_area"],
        "usage_by_type": reports["usage_by_type"],
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=(os.getenv("FLASK_DEBUG", "false").lower() == "true"))
