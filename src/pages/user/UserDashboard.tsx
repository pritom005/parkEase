import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mockDb } from '../../db/mockDb';
import {
  Car,
  Bike,
  QrCode,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Plus,
  ArrowRight,
  ExternalLink,
  Download,
} from 'lucide-react';

interface Props {
  onNavigate: (view: string, extra?: any) => void;
  onViewReceipt: (bookingId: number) => void;
}

export const UserDashboard: React.FC<Props> = ({ onNavigate, onViewReceipt }) => {
  const { currentUser } = useAuth();
  const userId = currentUser?.user_id || 2;
  const vehicles = mockDb.getVehiclesByUserId(userId);
  const bookings = mockDb.getBookingsByUser(userId);
  const activeBooking = bookings.find((b) => b.booking_status === 'Confirmed' || b.booking_status === 'Checked-In');

  // Quick reservation state
  const areas = mockDb.getAreas();
  const [quickAreaId, setQuickAreaId] = useState(1);
  const [quickVehicleCat, setQuickVehicleCat] = useState<'Car' | 'Motorcycle'>('Car');
  const [quickVehicleId, setQuickVehicleId] = useState<number>(vehicles[0]?.vehicle_id || 1);
  const [quickSelectedSlot, setQuickSelectedSlot] = useState('P-04');

  return (
    <div className="space-y-8">
      {/* Top Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-[#1b5e3b] uppercase tracking-wider block">
            CHATTOGRAM METRO • LIVE NETWORK CONNECTED
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#16261d] tracking-tight">
            User Dashboard
          </h1>
          <p className="text-xs text-[#455549] mt-1">
            Welcome back, <strong className="text-[#16261d]">{currentUser?.full_name || 'Tanvir Ahmed'}</strong>.
            Manage your vehicles, view active reservations, and quickly book parking bays across Chattogram.
          </p>
        </div>

        <button
          onClick={() => onNavigate('user-booking')}
          className="neu-btn-primary px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Car className="w-4 h-4" />
          <span>Book a Slot</span>
        </button>
      </div>

      {/* Top 3 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Active Reservation */}
        <div className="neu-raised p-5 rounded-xl border border-[#cfd9d1] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-[#455549]">ACTIVE BOOKING</span>
              <span className="text-[10px] font-semibold bg-[#dcefe3] text-[#1b5e3b] px-2 py-0.5 rounded border border-[#1b5e3b]">
                Active
              </span>
            </div>
            <h3 className="text-lg font-bold text-[#16261d]">
              {activeBooking ? '1 Active Reservation' : 'No Active Booking'}
            </h3>
            <p className="text-xs text-[#455549] mt-1">
              {activeBooking
                ? `${activeBooking.area_name} (${activeBooking.slot_number}, ${activeBooking.vehicle_type})`
                : 'Reserve a guaranteed bay now.'}
            </p>
            {activeBooking && (
              <span className="text-[11px] text-[#1b5e3b] font-medium block mt-2 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Valid until Today 18:00
              </span>
            )}
          </div>
          <div className="pt-4">
            <button
              onClick={() => onNavigate('user-confirmation', { booking: activeBooking || bookings[0] })}
              className="w-full neu-btn-secondary py-2 rounded-lg text-xs font-semibold hover:text-[#1b5e3b] transition"
            >
              View Ticket / Entry Pass
            </button>
          </div>
        </div>

        {/* Card 2: Vehicle Inventory */}
        <div className="neu-raised p-5 rounded-xl border border-[#cfd9d1] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-[#455549]">VEHICLE INVENTORY</span>
              <span className="text-[10px] font-semibold bg-[#dcefe3] text-[#1b5e3b] px-2 py-0.5 rounded border border-[#1b5e3b]">
                Verified
              </span>
            </div>
            <h3 className="text-lg font-bold text-[#16261d]">
              {vehicles.length} Registered Vehicles
            </h3>
            <p className="text-xs text-[#455549] mt-1">
              Primary: {vehicles[0]?.brand} {vehicles[0]?.model || 'Sedan'}
            </p>
            <span className="text-[11px] text-[#455549] block mt-1">
              Secondary: {vehicles[1]?.brand || 'None'} {vehicles[1]?.model || ''}
            </span>
          </div>
          <div className="pt-4">
            <button
              onClick={() => onNavigate('user-vehicles')}
              className="w-full neu-btn-secondary py-2 rounded-lg text-xs font-semibold hover:text-[#1b5e3b] transition"
            >
              Manage Vehicles
            </button>
          </div>
        </div>

        {/* Card 3: Billing Clearance */}
        <div className="neu-raised p-5 rounded-xl border border-[#cfd9d1] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-[#455549]">BILLING CLEARANCE</span>
              <span className="text-[10px] font-semibold bg-[#dcefe3] text-[#1b5e3b] px-2 py-0.5 rounded border border-[#1b5e3b]">
                Paid
              </span>
            </div>
            <h3 className="text-lg font-bold text-[#16261d]">
              Last Paid: {bookings[0]?.price_total || 1000} BDT
            </h3>
            <p className="text-xs text-[#455549] mt-1">
              Via bKash Wallet (TxID: 99B87A1)
            </p>
            <span className="text-[11px] text-[#455549] block mt-1 font-mono">
              Booking #{bookings[0]?.booking_code || 'PK-88219'} (GEC Hub)
            </span>
          </div>
          <div className="pt-4">
            <button
              onClick={() => onViewReceipt(bookings[0]?.booking_id || 1)}
              className="w-full neu-btn-secondary py-2 rounded-lg text-xs font-semibold hover:text-[#1b5e3b] transition flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Last Receipt</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Parking Permit Card */}
      {activeBooking && (
        <div className="neu-raised p-6 rounded-xl border border-[#cfd9d1] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#cfd9d1] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1b5e3b]"></span>
                <span className="text-[11px] font-bold text-[#1b5e3b] uppercase tracking-wider font-mono">
                  AUTHORIZED ENTRY PASS
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#16261d]">
                {activeBooking.area_name} (Central Area)
              </h2>
            </div>
            <span className="text-xs font-mono text-[#455549]">
              NODE: CTG-GEC-IN-04
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Details */}
            <div className="lg:col-span-8 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-[#eff5f0] rounded-lg border border-[#cfd9d1]">
                  <span className="text-[10px] text-[#455549] uppercase block font-semibold">Assigned Slot</span>
                  <strong className="text-base font-bold text-[#16261d] font-mono tabular-nums">
                    BAY {activeBooking.slot_number}
                  </strong>
                  <span className="text-[10px] text-[#455549] block">Ground Level, {activeBooking.vehicle_type}</span>
                </div>

                <div className="p-3 bg-[#eff5f0] rounded-lg border border-[#cfd9d1]">
                  <span className="text-[10px] text-[#455549] uppercase block font-semibold">Check-In Time</span>
                  <strong className="text-base font-bold text-[#16261d]">
                    Today, {activeBooking.booking_time}
                  </strong>
                  <span className="text-[10px] text-[#455549] block">Gate Sensor 01</span>
                </div>

                <div className="p-3 bg-[#eff5f0] rounded-lg border border-[#cfd9d1]">
                  <span className="text-[10px] text-[#455549] uppercase block font-semibold">Valid Until</span>
                  <strong className="text-base font-bold text-[#16261d]">
                    Today, 18:00
                  </strong>
                  <span className="text-[10px] text-[#1b5e3b] font-bold block">8h 30m Remaining</span>
                </div>
              </div>

              <div className="p-3 bg-[#e8eee9] rounded-lg border border-[#cfd9d1] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#455549] uppercase block font-semibold">Authorized Vehicle</span>
                  <span className="text-xs font-bold text-[#16261d]">{activeBooking.vehicle_model}</span>
                </div>
                <span className="px-2.5 py-1 bg-[#16261d] text-white rounded font-mono font-bold text-xs">
                  {activeBooking.vehicle_number}
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => alert('Booking extended by 1 hour (subject to slot availability).')}
                  className="neu-btn-secondary px-4 py-2 rounded-lg text-xs font-semibold"
                >
                  Extend Booking
                </button>
                <button
                  onClick={() => alert('GPS Navigation opening for CDA Avenue, East Nasirabad, GEC Circle.')}
                  className="neu-btn-secondary px-4 py-2 rounded-lg text-xs font-semibold"
                >
                  Get Directions
                </button>
              </div>
            </div>

            {/* QR Pass */}
            <div className="lg:col-span-4 p-5 bg-[#dee4df] rounded-xl border border-[#cfd9d1] text-center space-y-2">
              <span className="text-[10px] font-mono font-bold text-[#455549] uppercase block">
                ENTRY GATE BARRIER CODE
              </span>
              <div className="inline-block px-3 py-1 bg-[#dcefe3] text-[#1b5e3b] font-mono font-bold text-sm rounded">
                PK-9941-GEC
              </div>

              {/* QR Code Graphic */}
              <div className="w-32 h-32 mx-auto bg-white p-2 rounded-lg border border-[#cfd9d1] flex flex-col items-center justify-center shadow-xs">
                <QrCode className="w-24 h-24 text-[#16261d]" />
                <span className="text-[9px] font-mono text-[#455549]">TAP TO ENLARGE</span>
              </div>

              <p className="text-[10px] text-[#455549] leading-tight">
                Scan code or present vehicle plate at entry barrier. Barrier opens automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Bay Reservation Section */}
      <div className="neu-raised p-6 rounded-xl border border-[#cfd9d1] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#16261d]">Quick Bay Reservation</h2>
            <p className="text-xs text-[#455549]">Instantly reserve and hold a slot for 15 minutes.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="flex items-center gap-1 text-[#1b5e3b]">
              <span className="w-2 h-2 rounded-full bg-[#1b5e3b]"></span> Available
            </span>
            <span className="flex items-center gap-1 text-amber-700">
              <span className="w-2 h-2 rounded-full bg-amber-600"></span> Booked
            </span>
            <span className="flex items-center gap-1 text-red-700">
              <span className="w-2 h-2 rounded-full bg-red-600"></span> Occupied
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-[#16261d] mb-1">Select Parking Hub</label>
            <select
              value={quickAreaId}
              onChange={(e) => setQuickAreaId(Number(e.target.value))}
              className="w-full p-2.5 rounded-lg text-xs neu-input"
            >
              {areas.map((a) => (
                <option key={a.area_id} value={a.area_id}>
                  {a.area_name} ({a.total_slots} Slots)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#16261d] mb-1">Vehicle Category</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setQuickVehicleCat('Car')}
                className={`py-2 text-xs font-semibold rounded-lg transition ${
                  quickVehicleCat === 'Car' ? 'bg-[#1b5e3b] text-white' : 'neu-btn-secondary'
                }`}
              >
                Car
              </button>
              <button
                type="button"
                onClick={() => setQuickVehicleCat('Motorcycle')}
                className={`py-2 text-xs font-semibold rounded-lg transition ${
                  quickVehicleCat === 'Motorcycle' ? 'bg-[#1b5e3b] text-white' : 'neu-btn-secondary'
                }`}
              >
                Bike
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#16261d] mb-1">Assigned Vehicle</label>
            <select
              value={quickVehicleId}
              onChange={(e) => setQuickVehicleId(Number(e.target.value))}
              className="w-full p-2.5 rounded-lg text-xs neu-input"
            >
              {vehicles.map((v) => (
                <option key={v.vehicle_id} value={v.vehicle_id}>
                  {v.brand} {v.model} ({v.vehicle_number})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#16261d] mb-1">Arrival Schedule</label>
            <input
              type="text"
              readOnly
              value="Today, 14:00 (2h slot)"
              className="w-full p-2.5 rounded-lg text-xs neu-input bg-[#e8eee9]"
            />
          </div>
        </div>

        {/* 4-Bay preview grid */}
        <div className="p-4 bg-[#eff5f0] rounded-xl border border-[#cfd9d1] space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-[#16261d]">PARKING ZONE SECTION A PREVIEW</span>
            <span className="text-[#455549]">Standard Tariff: 1,000 BDT/Day (or 60 BDT/hr)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-[#e8eee9] neu-raised-sm rounded-lg text-center">
              <span className="text-xs font-bold font-mono block">P-01</span>
              <span className="text-[10px] text-[#1b5e3b] font-semibold">AVAILABLE</span>
            </div>
            <div className="p-3 bg-[#e8eee9] neu-pressed-sm rounded-lg text-center opacity-75">
              <span className="text-xs font-bold font-mono block">P-02</span>
              <span className="text-[10px] text-amber-700 font-semibold">BOOKED</span>
            </div>
            <div className="p-3 bg-[#e8eee9] neu-pressed-sm rounded-lg text-center opacity-75">
              <span className="text-xs font-bold font-mono block">P-03</span>
              <span className="text-[10px] text-red-700 font-semibold">OCCUPIED</span>
            </div>
            <div className="p-3 bg-[#1b5e3b] text-white rounded-lg text-center neu-raised-sm">
              <span className="text-xs font-bold font-mono block">P-04</span>
              <span className="text-[10px] text-[#e6b422] font-semibold">SELECTED</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <span className="text-xs text-[#455549] flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-[#1b5e3b]" />
              Slot P-04 reserved for 15 minutes pending final payment confirmation.
            </span>
            <button
              onClick={() => onNavigate('user-booking')}
              className="neu-btn-primary px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
            >
              <span>Proceed to Reserve Slot</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Registered Vehicles Mini Cards */}
      <div className="neu-raised p-6 rounded-xl border border-[#cfd9d1] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#16261d]">Registered Vehicles</h2>
            <p className="text-xs text-[#455549]">Vehicles enrolled for automated ANPR boom barrier entry.</p>
          </div>
          <button
            onClick={() => onNavigate('user-vehicles')}
            className="neu-btn-secondary px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Vehicle</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {vehicles.map((v) => (
            <div key={v.vehicle_id} className="p-4 bg-[#eff5f0] rounded-lg border border-[#cfd9d1] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {v.vehicle_type === 'Car' ? (
                    <Car className="w-4 h-4 text-[#1b5e3b]" />
                  ) : (
                    <Bike className="w-4 h-4 text-[#1b5e3b]" />
                  )}
                  <span className="text-xs font-bold text-[#16261d]">
                    {v.brand} {v.model}
                  </span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${v.is_default ? 'bg-[#dcefe3] text-[#1b5e3b]' : 'bg-[#e4eae5] text-[#455549]'}`}>
                  {v.is_default ? 'Primary Active' : 'Secondary'}
                </span>
              </div>

              <div className="p-2.5 bg-white rounded border border-[#cfd9d1] flex items-center justify-between font-mono">
                <span className="text-xs font-bold text-[#16261d]">{v.vehicle_number}</span>
                <span className="text-[10px] text-[#1b5e3b] font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> BRTA Verified
                </span>
              </div>

              <span className="text-[11px] text-[#455549] block font-mono">
                RFID Tag: {v.rfid_tag || 'RFID-CTG-88219'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Booking History Table */}
      <div className="neu-raised p-6 rounded-xl border border-[#cfd9d1] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#16261d]">Recent Booking History</h2>
            <p className="text-xs text-[#455549]">Past parking sessions and fiscal receipts.</p>
          </div>
          <button
            onClick={() => onNavigate('user-history')}
            className="text-xs font-semibold text-[#1b5e3b] hover:underline flex items-center gap-1"
          >
            <span>View Full History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#cfd9d1] text-[#455549] uppercase font-mono text-[10px]">
                <th className="py-2.5 px-3">Booking ID</th>
                <th className="py-2.5 px-3">Parking Hub</th>
                <th className="py-2.5 px-3">Vehicle</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Tariff</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#cfd9d1]/60">
              {bookings.slice(0, 3).map((b) => (
                <tr key={b.booking_id} className="hover:bg-[#dee4df]/50">
                  <td className="py-3 px-3 font-mono font-bold text-[#1b5e3b]">{b.booking_code}</td>
                  <td className="py-3 px-3 text-[#16261d] font-medium">{b.area_name}</td>
                  <td className="py-3 px-3 text-[#455549]">{b.vehicle_number}</td>
                  <td className="py-3 px-3 text-[#455549]">{b.booking_date}</td>
                  <td className="py-3 px-3 font-mono font-bold text-[#16261d]">{b.price_total} BDT</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        b.booking_status === 'Confirmed'
                          ? 'bg-[#dcefe3] text-[#1b5e3b] border-[#1b5e3b]'
                          : b.booking_status === 'Completed'
                          ? 'bg-[#eff5f0] text-[#16261d] border-[#6b8273]'
                          : 'bg-red-100 text-red-700 border-red-300'
                      }`}
                    >
                      {b.booking_status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => onViewReceipt(b.booking_id)}
                      className="inline-flex items-center gap-1 text-[#1b5e3b] hover:underline font-semibold text-xs"
                    >
                      <Download className="w-3 h-3" />
                      <span>Receipt</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
