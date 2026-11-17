import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import {
  INITIAL_USERS,
  INITIAL_SLOTS,
  INITIAL_BOOKINGS,
  INITIAL_PAYMENTS
} from './src/data/initialData';
import type { ParkingSlot, Booking, Payment } from './src/types';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

function getServerGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Simple dictionary to limit demo logins to 10 requests per minute per IP
const demoLoginAttempts: Record<string, number[]> = {};

function isDemoModeEnabled(): boolean {
  return (process.env.DEMO_MODE || '').trim() === 'true';
}

function isDemoRateLimited(clientIp: string): boolean {
  const nowTs = Date.now();
  const previous = demoLoginAttempts[clientIp] || [];
  const recent: number[] = [];
  for (let i = 0; i < previous.length; i += 1) {
    if (nowTs - previous[i] < 60000) {
      recent.push(previous[i]);
    }
  }
  if (recent.length >= 10) {
    demoLoginAttempts[clientIp] = recent;
    return true;
  }
  recent.push(nowTs);
  demoLoginAttempts[clientIp] = recent;
  return false;
}

// Return only whether presentation demo mode is enabled
app.get('/api/demo-status', (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ demo: isDemoModeEnabled() });
});

// Log in configured demo user or demo admin when DEMO_MODE is exactly "true"
app.post('/api/demo-login', (req: Request, res: Response) => {
  if (!isDemoModeEnabled()) {
    return res.status(404).json({ success: false, message: 'Not found.' });
  }

  const forwardedFor = String(req.headers['x-forwarded-for'] || '');
  const clientIp = forwardedFor
    ? forwardedFor.split(',')[0].trim()
    : req.ip || 'unknown';

  if (isDemoRateLimited(clientIp)) {
    return res.status(429).json({
      success: false,
      message: 'Too many demo login attempts. Please wait one minute.'
    });
  }

  const which = String(req.body?.which || '').trim().toLowerCase();
  if (which !== 'user' && which !== 'admin') {
    return res.status(400).json({ success: false, message: 'Invalid demo account type.' });
  }

  const targetEmail = (
    which === 'user'
      ? process.env.DEMO_USER_EMAIL || ''
      : process.env.DEMO_ADMIN_EMAIL || ''
  )
    .trim()
    .toLowerCase();

  if (!targetEmail) {
    return res.status(404).json({
      success: false,
      message: 'Demo account not found. Ask the project owner to run the demo data script.'
    });
  }

  const matchedUser = INITIAL_USERS.find(
    (u) => u.email.toLowerCase() === targetEmail
  );
  if (!matchedUser) {
    return res.status(404).json({
      success: false,
      message: 'Demo account not found. Ask the project owner to run the demo data script.'
    });
  }

  if (matchedUser.status !== 'Active') {
    return res.status(403).json({
      success: false,
      message: 'This demo account is blocked. Please contact support.'
    });
  }

  if (matchedUser.role !== which) {
    return res.status(403).json({
      success: false,
      message: `Demo account role mismatch. Expected ${which}.`
    });
  }

  if (which === 'admin') {
    return res.json({
      success: true,
      message: 'Admin login successful',
      admin: {
        user_id: matchedUser.user_id,
        full_name: matchedUser.full_name,
        email: matchedUser.email
      }
    });
  }

  return res.json({
    success: true,
    message: 'Login successful',
    user: {
      user_id: matchedUser.user_id,
      full_name: matchedUser.full_name,
      email: matchedUser.email,
      role: matchedUser.role
    }
  });
});

// In-memory SMS OTP store (keyed by normalized phone number)
interface OtpRecord {
  codeHash: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}

const OTP_TTL_SECONDS = 300; // 5 minutes
const OTP_COOLDOWN_SECONDS = 45;
const OTP_MAX_ATTEMPTS = 5;
const otpStore = new Map<string, OtpRecord>();

function normalizePhoneNumber(rawPhone: string): string | null {
  const cleaned = (rawPhone || '').replace(/[\s()-]/g, '').trim();
  if (!cleaned) return null;

  // Bangladesh mobile format: 01[3-9]XXXXXXXX -> +8801XXXXXXXXX
  if (/^01[3-9]\d{8}$/.test(cleaned)) {
    return `+88${cleaned}`;
  }
  if (/^8801[3-9]\d{8}$/.test(cleaned)) {
    return `+${cleaned}`;
  }
  if (/^\+8801[3-9]\d{8}$/.test(cleaned)) {
    return cleaned;
  }

  // Generic E.164 international phone (10 to 15 digits)
  if (/^\+[1-9]\d{9,14}$/.test(cleaned)) {
    return cleaned;
  }

  return null;
}

function maskPhoneNumber(normalizedPhone: string): string {
  const local = normalizedPhone.startsWith('+880')
    ? `0${normalizedPhone.slice(4)}`
    : normalizedPhone;
  if (local.length <= 5) return local;
  const prefix = local.slice(0, 3);
  const suffix = local.slice(-2);
  return `${prefix}${'*'.repeat(Math.max(local.length - 5, 4))}${suffix}`;
}

function hashOtpCode(normalizedPhone: string, code: string): string {
  return crypto
    .createHash('sha256')
    .update(`${normalizedPhone}:${code}`)
    .digest('hex');
}

// Send SMS OTP Endpoint
app.post('/api/otp/send', async (req: Request, res: Response) => {
  const { phone } = req.body || {};
  const normalized = normalizePhoneNumber(String(phone || ''));

  if (!normalized) {
    return res.status(400).json({
      success: false,
      error: 'Enter a valid mobile number (e.g. 018XXXXXXXX or +88018XXXXXXXX).'
    });
  }

  const now = Date.now();
  const existing = otpStore.get(normalized);
  if (existing) {
    const elapsedSec = Math.floor((now - existing.lastSentAt) / 1000);
    if (elapsedSec < OTP_COOLDOWN_SECONDS) {
      const retryAfterSeconds = OTP_COOLDOWN_SECONDS - elapsedSec;
      return res.status(429).json({
        success: false,
        error: `Please wait ${retryAfterSeconds} seconds before requesting a new OTP.`,
        retryAfterSeconds
      });
    }
  }

  const code = crypto.randomInt(100000, 1000000).toString();
  otpStore.set(normalized, {
    codeHash: hashOtpCode(normalized, code),
    expiresAt: now + OTP_TTL_SECONDS * 1000,
    attempts: 0,
    lastSentAt: now
  });

  const maskedPhone = maskPhoneNumber(normalized);
  const smsWebhookUrl = (process.env.SMS_WEBHOOK_URL || '').trim();

  if (smsWebhookUrl) {
    try {
      const webhookRes = await fetch(smsWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: normalized,
          message: `Your ParkEase Chattogram verification code is ${code}. Valid for 5 minutes.`
        })
      });

      if (!webhookRes.ok) {
        throw new Error(`SMS gateway responded with status ${webhookRes.status}`);
      }

      return res.json({
        success: true,
        maskedPhone,
        expiresInSeconds: OTP_TTL_SECONDS,
        resendCooldownSeconds: OTP_COOLDOWN_SECONDS,
        deliveryMode: 'sms'
      });
    } catch (err) {
      console.error('SMS webhook delivery failed:', err);
      otpStore.delete(normalized);
      return res.status(502).json({
        success: false,
        error: 'Unable to dispatch SMS via configured gateway. Please try again.'
      });
    }
  }

  // Sandbox preview fallback when no external SMS gateway URL is configured
  console.log(`[ParkEase SMS Sandbox] OTP for ${maskedPhone}: ${code}`);
  return res.json({
    success: true,
    maskedPhone,
    expiresInSeconds: OTP_TTL_SECONDS,
    resendCooldownSeconds: OTP_COOLDOWN_SECONDS,
    deliveryMode: 'sandbox',
    sandboxOtp: code
  });
});

// Verify SMS OTP Endpoint
app.post('/api/otp/verify', (req: Request, res: Response) => {
  const { phone, code } = req.body || {};
  const normalized = normalizePhoneNumber(String(phone || ''));
  const cleanCode = String(code || '').replace(/\s+/g, '').trim();

  if (!normalized) {
    return res.status(400).json({
      success: false,
      error: 'Invalid mobile number format.'
    });
  }

  if (!/^\d{6}$/.test(cleanCode)) {
    return res.status(400).json({
      success: false,
      error: 'Enter the 6-digit numeric verification code.'
    });
  }

  const record = otpStore.get(normalized);
  if (!record) {
    return res.status(400).json({
      success: false,
      error: 'No active OTP found for this number. Please request a new code.'
    });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalized);
    return res.status(400).json({
      success: false,
      error: 'This OTP code has expired. Please request a new code.'
    });
  }

  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    otpStore.delete(normalized);
    return res.status(429).json({
      success: false,
      error: 'Too many incorrect attempts. Please request a new verification code.'
    });
  }

  const candidateHash = Buffer.from(hashOtpCode(normalized, cleanCode), 'hex');
  const expectedHash = Buffer.from(record.codeHash, 'hex');
  const isMatch =
    candidateHash.length === expectedHash.length &&
    crypto.timingSafeEqual(candidateHash, expectedHash);

  if (!isMatch) {
    record.attempts += 1;
    const remaining = OTP_MAX_ATTEMPTS - record.attempts;
    if (remaining <= 0) {
      otpStore.delete(normalized);
      return res.status(429).json({
        success: false,
        error: 'Too many incorrect attempts. Please request a new verification code.'
      });
    }
    return res.status(400).json({
      success: false,
      error: `Incorrect OTP code. ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.`
    });
  }

  otpStore.delete(normalized);
  const verifiedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
  return res.json({
    success: true,
    verifiedAt,
    normalizedPhone: normalized
  });
});

// Video Generation Endpoint using gemini-interactions-api & gemini-omni-1.2-flash
app.post('/api/generate-video', async (req: Request, res: Response) => {
  const { imageBase64, mimeType = 'image/jpeg', prompt, aspectRatio = '16:9' } = req.body || {};
  const userPrompt = prompt
    ? `Animate this parking facility or vehicle photo smoothly with cinematic motion: ${prompt}`
    : 'Create a cinematic flyover animation of this parking area or vehicle entering the parking bay with smooth camera motion.';

  try {
    if (!imageBase64) {
      return res.status(400).json({ error: 'Image base64 data is required' });
    }

    const ai = getServerGeminiClient();
    if (!ai) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in server environment.'
      });
    }

    // Clean base64 string
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    // Call the Interactions API strictly using snake_case response_modalities
    const interaction = await ai.interactions.create({
      model: 'gemini-omni-1.2-flash',
      input: [
        {
          type: 'text',
          text: `${userPrompt}. Ensure the video output conforms to an aspect ratio of ${aspectRatio}.`
        },
        {
          type: 'image',
          mime_type: mimeType,
          data: cleanBase64
        }
      ],
      response_modalities: ['video']
    });

    // Inspect the generated interaction output video
    let videoData: string | null = null;
    let videoMimeType = 'video/mp4';

    if (interaction.output_video?.data) {
      videoData = interaction.output_video.data;
      if (interaction.output_video.mime_type) {
        videoMimeType = interaction.output_video.mime_type;
      }
    } else if (interaction.output_video?.uri) {
      videoData = interaction.output_video.uri;
    } else if (Array.isArray(interaction.steps)) {
      for (const step of interaction.steps) {
        if (step.type === 'model_output' && Array.isArray(step.content)) {
          for (const item of step.content) {
            if (item.type === 'video' || (item as any).video) {
              const v = (item as any).video || item;
              videoData = v.data || v.uri || null;
              if (v.mime_type) videoMimeType = v.mime_type;
              break;
            }
          }
        }
        if (videoData) break;
      }
    }

    return res.json({
      success: true,
      interactionId: interaction.id,
      videoData: videoData ? (videoData.startsWith('http') || videoData.startsWith('data:') ? videoData : `data:${videoMimeType};base64,${videoData}`) : null,
      aspectRatio,
      prompt: userPrompt
    });
  } catch (error: any) {
    console.error('Error generating video via Interactions API:', error);
    const errMsg = error?.message || '';
    const isRateLimit =
      error?.status === 429 ||
      errMsg.includes('429') ||
      errMsg.includes('Rate limit exceeded') ||
      errMsg.includes('Free Tier') ||
      errMsg.includes('RESOURCE_EXHAUSTED');

    if (isRateLimit) {
      // Graceful fallback simulation video so free tier users can test animation UI without errors
      const sampleVideo = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
      return res.json({
        success: true,
        isSimulated: true,
        videoData: sampleVideo,
        aspectRatio,
        prompt: userPrompt,
        message: 'Simulation preview: gemini-omni-1.2-flash requires a paid API key for live video rendering.'
      });
    }

    return res.status(500).json({
      error: errMsg || 'Failed to generate video with gemini-omni-1.2-flash',
      isRateLimit: false
    });
  }
});

interface FirebaseAppletConfig {
  projectId?: string;
  apiKey?: string;
  firestoreDatabaseId?: string;
}

function loadFirebaseConfig(): FirebaseAppletConfig {
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    const raw = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(raw) as FirebaseAppletConfig;
  } catch {
    return {};
  }
}

const ALLOWED_ADMIN_EMAILS = new Set(['admin@parkease.com', 'pritom20054@gmail.com']);

function decodeFirestoreValue(val: Record<string, unknown> | undefined): unknown {
  if (!val) return undefined;
  if ('stringValue' in val) return String(val.stringValue);
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('booleanValue' in val) return Boolean(val.booleanValue);
  if ('nullValue' in val) return null;
  if ('timestampValue' in val) return String(val.timestampValue);
  return undefined;
}

function decodeFirestoreDoc(docObj: {
  name?: string;
  fields?: Record<string, Record<string, unknown>>;
}): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const fields = docObj.fields || {};
  for (const [k, v] of Object.entries(fields)) {
    out[k] = decodeFirestoreValue(v);
  }
  if (docObj.name) {
    const parts = docObj.name.split('/');
    out._docId = parts[parts.length - 1];
  }
  return out;
}

async function fetchFirestoreCollection(
  projectId: string,
  databaseId: string,
  collectionName: string,
  idToken: string
): Promise<Array<Record<string, unknown>>> {
  const docs: Array<Record<string, unknown>> = [];
  let pageToken = '';

  do {
    const baseUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      projectId
    )}/databases/${encodeURIComponent(databaseId)}/documents/${encodeURIComponent(collectionName)}`;
    const url = pageToken
      ? `${baseUrl}?pageSize=500&pageToken=${encodeURIComponent(pageToken)}`
      : `${baseUrl}?pageSize=500`;

    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${idToken}` }
    });
    if (!resp.ok) {
      throw new Error(`Firestore read failed for ${collectionName} (${resp.status})`);
    }
    const payload = (await resp.json()) as {
      documents?: Array<{ name?: string; fields?: Record<string, Record<string, unknown>> }>;
      nextPageToken?: string;
    };
    if (Array.isArray(payload.documents)) {
      for (const d of payload.documents) {
        docs.push(decodeFirestoreDoc(d));
      }
    }
    pageToken = payload.nextPageToken || '';
  } while (pageToken);

  return docs;
}

async function verifyAdminAuth(req: Request): Promise<
  | { ok: true; uid: string; email: string; idToken: string; projectId: string; databaseId: string }
  | { ok: false; status: number; error: string }
> {
  const authHeader = String(req.headers.authorization || '');
  const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
  if (!match || !match[1]) {
    return { ok: false, status: 401, error: 'Authentication required. Missing Bearer token.' };
  }
  const idToken = match[1].trim();

  const fbConfig = loadFirebaseConfig();
  if (!fbConfig.apiKey || !fbConfig.projectId) {
    return { ok: false, status: 500, error: 'Firebase configuration is missing on server.' };
  }
  const databaseId = fbConfig.firestoreDatabaseId || '(default)';

  try {
    const lookupRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(
        fbConfig.apiKey
      )}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      }
    );

    if (!lookupRes.ok) {
      return { ok: false, status: 401, error: 'Invalid or expired authentication token.' };
    }

    const lookupData = (await lookupRes.json()) as {
      users?: Array<{ localId?: string; email?: string; emailVerified?: boolean }>;
    };
    const userRecord = lookupData.users?.[0];
    if (!userRecord?.localId) {
      return { ok: false, status: 401, error: 'Invalid authentication token.' };
    }

    const uid = userRecord.localId;
    const email = String(userRecord.email || '').toLowerCase();

    let isAdmin = ALLOWED_ADMIN_EMAILS.has(email) && userRecord.emailVerified === true;
    if (!isAdmin) {
      const userDocUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
        fbConfig.projectId
      )}/databases/${encodeURIComponent(databaseId)}/documents/users/${encodeURIComponent(uid)}`;
      const userDocRes = await fetch(userDocUrl, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      if (userDocRes.ok) {
        const userDoc = (await userDocRes.json()) as {
          fields?: Record<string, Record<string, unknown>>;
        };
        const decoded = decodeFirestoreDoc(userDoc);
        isAdmin = decoded.role === 'admin';
      }
    }

    if (!isAdmin) {
      return { ok: false, status: 403, error: 'Forbidden: admin role required.' };
    }

    return {
      ok: true,
      uid,
      email,
      idToken,
      projectId: fbConfig.projectId,
      databaseId
    };
  } catch (err) {
    console.error('Admin auth verification error:', err);
    return { ok: false, status: 401, error: 'Unable to verify admin credentials.' };
  }
}

// Read-only Admin Dashboard Summary Route
app.get('/api/admin/dashboard', async (req: Request, res: Response) => {
  const authResult = await verifyAdminAuth(req);
  if (!authResult.ok) {
    return res.status(authResult.status).json({
      success: false,
      error: authResult.error
    });
  }

  try {
    const [slotDocs, bookingDocs, paymentDocs] = await Promise.all([
      fetchFirestoreCollection(
        authResult.projectId,
        authResult.databaseId,
        'parking_slots',
        authResult.idToken
      ),
      fetchFirestoreCollection(
        authResult.projectId,
        authResult.databaseId,
        'bookings',
        authResult.idToken
      ),
      fetchFirestoreCollection(
        authResult.projectId,
        authResult.databaseId,
        'payments',
        authResult.idToken
      )
    ]);

    // Merge Firestore updates with baseline 130-slot seed
    const slotsById = new Map<number, ParkingSlot>(
      INITIAL_SLOTS.map((s) => [s.slot_id, { ...s }])
    );
    const parsedIncomingSlots: ParkingSlot[] = slotDocs
      .map((d) => {
        const vType: 'Car' | 'Motorcycle' =
          d.vehicle_type === 'Motorcycle' ? 'Motorcycle' : 'Car';
        return {
          slot_id: Number(d.slot_id ?? d._docId),
          area_id: Number(d.area_id),
          slot_number: String(d.slot_number || ''),
          vehicle_type: vType,
          price_per_hour: Number(d.price_per_hour ?? (vType === 'Car' ? 250 : 100)),
          day_price: Number(d.day_price ?? (vType === 'Car' ? 2000 : 1000)),
          status: (
            d.status === 'Booked' || d.status === 'Occupied' ? d.status : 'Available'
          ) as ParkingSlot['status'],
          created_at: String(d.created_at || '')
        };
      })
      .filter((s) => !isNaN(s.slot_id) && !isNaN(s.area_id) && Boolean(s.slot_number));

    const hasLegacySlots = parsedIncomingSlots.some((s) =>
      /^(G|A|K|B|P|CH)-\d+$/i.test(s.slot_number)
    );
    if (!hasLegacySlots) {
      for (const s of parsedIncomingSlots) {
        slotsById.set(s.slot_id, s);
      }
    }
    const mergedSlots = Array.from(slotsById.values());

    // Merge Firestore bookings with baseline bookings
    const bookingsById = new Map<number, Booking>(
      INITIAL_BOOKINGS.map((b) => [b.booking_id, { ...b }])
    );
    for (const d of bookingDocs) {
      const bookingId = Number(d.booking_id ?? d._docId);
      const slotId = Number(d.slot_id);
      if (isNaN(bookingId) || isNaN(slotId)) continue;
      bookingsById.set(bookingId, {
        booking_id: bookingId,
        user_id: Number(d.user_id) || 0,
        vehicle_id: Number(d.vehicle_id) || 0,
        slot_id: slotId,
        booking_date: String(d.booking_date || ''),
        booking_time: String(d.booking_time || ''),
        duration_hours: Number(d.duration_hours) || 1,
        price_total: Number(d.price_total) || 0,
        payment_status: (d.payment_status === 'Paid' || d.payment_status === 'Failed'
          ? d.payment_status
          : 'Pending') as Booking['payment_status'],
        booking_status: (d.booking_status === 'Completed' || d.booking_status === 'Cancelled'
          ? d.booking_status
          : 'Confirmed') as Booking['booking_status'],
        checked_in_at: d.checked_in_at ? String(d.checked_in_at) : undefined,
        created_at: String(d.created_at || '')
      });
    }
    const mergedBookings = Array.from(bookingsById.values());

    // Merge Firestore payments with baseline payments
    const paymentsById = new Map<number, Payment>(
      INITIAL_PAYMENTS.map((p) => [p.payment_id, { ...p }])
    );
    for (const d of paymentDocs) {
      const paymentId = Number(d.payment_id ?? d._docId);
      const bookingId = Number(d.booking_id);
      if (isNaN(paymentId) || isNaN(bookingId)) continue;
      paymentsById.set(paymentId, {
        payment_id: paymentId,
        booking_id: bookingId,
        amount: Number(d.amount) || 0,
        payment_method: String(d.payment_method || 'bKash') as Payment['payment_method'],
        payment_status: (d.payment_status === 'Paid' || d.payment_status === 'Failed'
          ? d.payment_status
          : 'Pending') as Payment['payment_status'],
        payment_date: String(d.payment_date || '')
      });
    }
    const mergedPayments = Array.from(paymentsById.values());

    const totalSlots = mergedSlots.length;
    const carSlots = mergedSlots.filter((s) => s.vehicle_type === 'Car').length;
    const motorcycleSlots = mergedSlots.filter((s) => s.vehicle_type === 'Motorcycle').length;
    const availableSlots = mergedSlots.filter((s) => s.status === 'Available').length;
    const bookedSlots = mergedSlots.filter((s) => s.status === 'Booked').length;
    const occupiedCount = mergedSlots.filter((s) => s.status === 'Occupied').length;

    const totalBookings = mergedBookings.length;
    const confirmedBookings = mergedBookings.filter((b) => b.booking_status === 'Confirmed').length;
    const completedBookings = mergedBookings.filter((b) => b.booking_status === 'Completed').length;
    const cancelledBookings = mergedBookings.filter((b) => b.booking_status === 'Cancelled').length;

    const paidPaymentsList = mergedPayments.filter((p) => p.payment_status === 'Paid');
    const paidPayments = paidPaymentsList.length;
    const pendingPayments = mergedPayments.filter((p) => p.payment_status === 'Pending').length;
    const failedPayments = mergedPayments.filter((p) => p.payment_status === 'Failed').length;
    const totalPaidAmount = paidPaymentsList.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return res.json({
      success: true,
      total_slots: totalSlots,
      occupied_count: occupiedCount,
      total_bookings: totalBookings,
      bookings_breakdown: {
        confirmed: confirmedBookings,
        completed: completedBookings,
        cancelled: cancelledBookings
      },
      total_paid_amount: totalPaidAmount,
      counts: {
        slots: totalSlots,
        car_slots: carSlots,
        motorcycle_slots: motorcycleSlots,
        available_slots: availableSlots,
        booked_slots: bookedSlots,
        occupied_slots: occupiedCount,
        bookings: totalBookings,
        confirmed_bookings: confirmedBookings,
        completed_bookings: completedBookings,
        cancelled_bookings: cancelledBookings,
        total_payments: mergedPayments.length,
        paid_payments: paidPayments,
        pending_payments: pendingPayments,
        failed_payments: failedPayments,
        total_revenue: totalPaidAmount
      }
    });
  } catch (err) {
    console.error('Admin dashboard summary error:', err);
    return res.status(500).json({
      success: false,
      error: 'Unable to load admin dashboard metrics.'
    });
  }
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
