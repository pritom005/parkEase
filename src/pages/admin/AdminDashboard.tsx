import React, { useState, useEffect } from 'react';
import { mockDb } from '../../db/mockDb';
import { AdminNotification } from '../../types';
import {
  Shield,
  Radio,
  Car,
  AlertTriangle,
  Download,
  Lock,
  Unlock,
  CheckCircle2,
  TrendingUp,
  Activity,
  ArrowRight,
  Bell,
  Check,
  ExternalLink,
  CheckCheck,
} from 'lucide-react';

interface Props {
  onNavigate: (view: string, extra?: any) => void;
}

export const AdminDashboard: React.FC<Props> = ({ onNavigate }) => {
  const areas = mockDb.getAreas();
  const slots = mockDb.getAllSlots();
  const bookings = mockDb.getAllBookings();
  const users = mockDb.getUsers();
  const vehicles = mockDb.getAllVehicles();
  const gateLogs = mockDb.getGateLogs();

  const [emergencyOverride, setEmergencyOverride] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>(() => mockDb.getNotifications());
  const [unreadCount, setUnreadCount] = useState<number>(() => mockDb.getUnreadNotificationsCount());

  const refreshNotifs = () => {
    setNotifications(mockDb.getNotifications());
    setUnreadCount(mockDb.getUnreadNotificationsCount());
  };

  useEffect(() => {
    const timer = setInterval(refreshNotifs, 2000);
    return () => clearInterval(timer);
  }, []);

  const handleMarkRead = (id: number) => {
    mockDb.markNotificationAsRead(id);
    refreshNotifs();
  };

  const handleMarkAllRead = () => {
    mockDb.markAllNotificationsAsRead();
    refreshNotifs();
  };

  const totalSlots = 130;
  const occupiedSlots = slots.filter((s) => s.status === 'Occupied').length + 72; // simulated metropolitan grid
  const availableSlots = totalSlots - occupiedSlots;

  const toggleEmergency = () => {
    const newState = !emergencyOverride;
    setEmergencyOverride(newState);
    if (newState) {
      alert('EMERGENCY COMMAND ISSUED: All 24 electromechanical boom barriers in Chattogram Metropolitan grid set to FREE EGRESS / RAISED.');
    } else {
      alert('NORMAL TELEMETRY RESUMED: Barrier actuators re-armed.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#455549] mb-1">
            <span>MUNICIPAL CONTROL ROOM</span>
            <span>/</span>
            <span>CHATTOGRAM METROPOLITAN</span>
            <span>/</span>
            <span className="text-[#1b5e3b] font-bold">SYSTEM OVERVIEW</span>
            <span>•</span>
            <span className="text-[#1b5e3b] font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#1b5e3b] animate-pulse"></span>
              Live Optical ANPR Telemetry: Active (24 Barrier Gates Synced)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#16261d] tracking-tight">
            Administrative Command & Parking Telemetry
          </h1>
          <p className="text-xs text-[#455549] mt-1">
            Real-time municipal capacity monitoring, ANPR optical barrier passage, and NBR tax compliant revenue settlement across Chattogram City Corporation (CCC) zones.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={toggleEmergency}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs transition ${
              emergencyOverride
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'bg-red-700 text-white hover:bg-red-800'
            }`}
          >
            {emergencyOverride ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            <span>{emergencyOverride ? 'Emergency Override: ACTIVE' : 'Emergency Gate Lock / Release'}</span>
          </button>
          <button
            onClick={() => alert('Exporting CCC Daily Municipal Mobility Audit (PDF/CSV)...')}
            className="neu-btn-secondary px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Daily Municipal Audit</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="neu-raised p-5 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block mb-1">
            TOTAL METROPOLITAN SLOTS
          </span>
          <h3 className="text-3xl font-extrabold text-[#16261d] font-mono">{totalSlots} Bays</h3>
          <div className="w-full bg-[#dee4df] rounded-full h-1.5 mt-2">
            <div className="bg-[#1b5e3b] h-1.5 rounded-full" style={{ width: '78%' }}></div>
          </div>
          <div className="flex justify-between text-[11px] text-[#455549] mt-2 font-mono">
            <span>84 Car Slots</span>
            <span>46 Motorcycle Bays</span>
          </div>
        </div>

        <div className="neu-raised p-5 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block mb-1">
            ACTIVE OCCUPIED BAYS
          </span>
          <h3 className="text-3xl font-extrabold text-[#16261d] font-mono">
            {occupiedSlots} <span className="text-base text-[#455549] font-normal">/ {totalSlots}</span>
          </h3>
          <span className="text-[11px] text-amber-700 font-bold block mt-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-600"></span> High Demand (Peak Hour: 16:30 BST)
          </span>
          <span className="text-[11px] text-[#1b5e3b] font-semibold block mt-1 font-mono">
            {availableSlots} Bays Available for Immediate Booking
          </span>
        </div>

        <div className="neu-raised p-5 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block mb-1">
            TODAY'S MUNICIPAL REVENUE
          </span>
          <h3 className="text-3xl font-extrabold text-[#1b5e3b] font-mono">128,450 BDT</h3>
          <span className="text-[11px] text-[#1b5e3b] font-bold block mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +14.2% vs yesterday • NBR TAX OK
          </span>
          <span className="text-[11px] text-[#455549] block mt-1">
            bKash & Civic Wallet: 89% digital share
          </span>
        </div>

        <div className="neu-raised p-5 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block mb-1">
            OPTICAL BARRIER CLEARANCES
          </span>
          <h3 className="text-3xl font-extrabold text-[#16261d] font-mono">1,418 Passages</h3>
          <span className="text-[11px] text-[#1b5e3b] font-semibold block mt-1">
            99.2% Automated Optical Plate Clearance
          </span>
          <span className="text-[11px] text-[#455549] block mt-1 font-mono">
            11 Manual Holds • Avg Speed: 0.8s
          </span>
        </div>
      </div>

      {/* Live Citizen Booking Notifications & Real-Time Alerts */}
      <div className="neu-raised p-6 rounded-xl border border-[#cfd9d1] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#cfd9d1]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#dcefe3] text-[#1b5e3b] flex items-center justify-center font-bold">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#16261d]">
                  Live Citizen Booking Notifications & Alerts
                </h3>
                {unreadCount > 0 ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                    {unreadCount} UNREAD
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#dee4df] text-[#455549]">
                    ALL READ
                  </span>
                )}
              </div>
              <p className="text-xs text-[#455549]">
                Transactional alerts emitted on confirmed bookings across Chattogram municipal parking hubs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="neu-btn-secondary px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <CheckCheck className="w-3.5 h-3.5 text-[#1b5e3b]" />
                <span>Mark All Read</span>
              </button>
            )}
            <button
              onClick={() => onNavigate('admin-bookings')}
              className="neu-btn-primary px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <span>Manage Bookings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="p-8 text-center text-[#455549] space-y-2">
            <Bell className="w-10 h-10 mx-auto text-[#6b8273]/40" />
            <p className="text-sm font-bold text-[#16261d]">No Booking Notifications</p>
            <p className="text-xs">All citizen reservations have been settled and audited.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notifications.slice(0, 6).map((notif) => (
              <div
                key={notif.notification_id}
                onClick={() => {
                  handleMarkRead(notif.notification_id);
                  onNavigate('admin-bookings', { bookingId: notif.booking_id });
                }}
                className={`p-4 rounded-xl border cursor-pointer transition text-left flex flex-col justify-between ${
                  !notif.is_read
                    ? 'bg-[#dcefe3]/40 border-[#1b5e3b]/50 neu-raised-sm'
                    : 'bg-white/60 border-[#cfd9d1] hover:bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#1b5e3b] text-white">
                        {notif.notification_type}
                      </span>
                      <span className="font-mono text-xs font-bold text-[#16261d]">
                        {notif.booking_code}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {!notif.is_read ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkRead(notif.notification_id);
                          }}
                          title="Mark Read"
                          className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded text-[10px] font-bold flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Unread</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-[#6b8273] font-mono">Read</span>
                      )}
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-[#16261d]">
                    {notif.customer_name}
                  </h4>
                  <p className="text-[11px] text-[#455549]">{notif.customer_email}</p>

                  <div className="mt-2 pt-2 border-t border-[#cfd9d1]/70 space-y-1 text-xs text-[#455549]">
                    <div className="flex justify-between">
                      <span className="text-[11px] text-[#6b8273]">Facility & Bay:</span>
                      <strong className="text-[#16261d]">{notif.parking_area} (Bay {notif.parking_slot_number})</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[11px] text-[#6b8273]">Vehicle:</span>
                      <strong className="text-[#16261d] font-mono text-[11px]">{notif.vehicle_number}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[11px] text-[#6b8273]">Schedule:</span>
                      <span className="font-mono text-[11px]">{notif.booking_date} @ {notif.start_time} ({notif.duration_hours}h)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[11px] text-[#6b8273]">Total Tariff:</span>
                      <strong className="text-[#1b5e3b] font-bold font-mono">৳{notif.total_price}.00</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-[#cfd9d1]/50 flex items-center justify-between text-[10px] text-[#6b8273] font-mono">
                  <span>{notif.created_at}</span>
                  <span className="text-[#1b5e3b] font-semibold flex items-center gap-0.5 hover:underline">
                    <span>Inspect Booking</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Municipal Parking Hub Overview (6 Hubs) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#16261d]">Municipal Parking Hub Overview</h2>
            <p className="text-xs text-[#455549]">
              Continuous telemetry stream from 6 Chattogram City Corporation municipal nodes.
            </p>
          </div>
          <span className="text-xs font-mono text-[#1b5e3b] flex items-center gap-1 font-semibold">
            <Radio className="w-3.5 h-3.5 animate-pulse" /> Real-time Sensor Sync
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {areas.map((a, i) => {
            const occupancies = [94, 80, 78, 72, 67, 50];
            const occ = occupancies[i] || 70;
            return (
              <div key={a.area_id} className="neu-raised p-5 rounded-xl border border-[#cfd9d1] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#455549]">
                    ZONE 0{i + 1} • {a.area_name.split(' ')[0]}
                  </span>
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                    ● {occ}% OCC
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#16261d]">{a.area_name}</h3>

                <div>
                  <div className="flex justify-between text-xs text-[#455549] mb-1 font-mono">
                    <span>Occupied Capacity:</span>
                    <strong>{Math.round((a.total_slots * occ) / 100)} / {a.total_slots} Bays</strong>
                  </div>
                  <div className="w-full bg-[#dee4df] rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${occ > 90 ? 'bg-red-600' : occ > 75 ? 'bg-amber-600' : 'bg-[#1b5e3b]'}`}
                      style={{ width: `${occ}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#cfd9d1] text-xs">
                  <span className="text-[11px] font-mono text-[#1b5e3b]">
                    ANPR: Normal Flow
                  </span>
                  <button
                    onClick={() => onNavigate('admin-slots')}
                    className="text-xs font-bold text-[#1b5e3b] hover:underline"
                  >
                    View Slot Matrix →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Grid: Live Barrier Gate Passage Telemetry & Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Telemetry Stream (8 cols) */}
        <div className="lg:col-span-8 neu-raised p-6 rounded-xl border border-[#cfd9d1] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#16261d] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#1b5e3b]" />
                Live Barrier Gate Passage Telemetry & Audit Stream
              </h3>
              <p className="text-xs text-[#455549]">
                Automated ANPR optical camera capture & municipal barrier dispatch.
              </p>
            </div>
            <span className="text-[10px] font-mono text-[#1b5e3b] bg-[#dcefe3] px-2 py-1 rounded font-bold">
              CCC FIBER GRID (5s SYNC)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#cfd9d1] text-[#455549] uppercase font-mono text-[10px]">
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Hub & Gate ID</th>
                  <th className="py-2.5 px-3">Vehicle Plate (BRTA)</th>
                  <th className="py-2.5 px-3">OCR Match</th>
                  <th className="py-2.5 px-3">Permit / Driver</th>
                  <th className="py-2.5 px-3">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#cfd9d1]/60">
                {gateLogs.map((log) => (
                  <tr key={log.log_id} className="hover:bg-[#dee4df]/50">
                    <td className="py-3 px-3 font-mono text-[#455549]">{log.detection_time.split(',')[1] || log.detection_time}</td>
                    <td className="py-3 px-3">
                      <strong className="block text-[#16261d]">{log.hub_name}</strong>
                      <span className="text-[10px] text-[#455549] font-mono">{log.gate_id}</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-[#16261d]">
                      {log.plate_number}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${log.ocr_match_percent > 95 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {log.ocr_match_percent}%
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[#16261d] font-medium block">{log.vehicle_name}</span>
                      <span className="text-[10px] text-[#455549]">{log.barrier_clearance}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-[#1b5e3b] font-bold">
                      Settled
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Diagnostics & Hub Actions (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="neu-raised p-5 rounded-xl border border-[#cfd9d1] space-y-3">
            <h4 className="text-xs font-bold text-[#16261d] uppercase tracking-wider bay-accent-line">
              ANPR Barrier Node Diagnostics
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-white rounded border border-[#cfd9d1]">
                <span className="text-[10px] text-[#455549] block">Gate Nodes:</span>
                <strong className="text-[#1b5e3b]">24 / 24 Online</strong>
              </div>
              <div className="p-2.5 bg-white rounded border border-[#cfd9d1]">
                <span className="text-[10px] text-[#455549] block">Fiber Latency:</span>
                <strong className="font-mono">28 ms</strong>
              </div>
              <div className="p-2.5 bg-white rounded border border-[#cfd9d1]">
                <span className="text-[10px] text-[#455549] block">Camera Optical IR:</span>
                <strong className="font-mono">60 FPS</strong>
              </div>
              <div className="p-2.5 bg-white rounded border border-[#cfd9d1]">
                <span className="text-[10px] text-[#455549] block">Lens Sensor Temp:</span>
                <strong className="font-mono">31 °C</strong>
              </div>
            </div>
          </div>

          <div className="neu-raised p-5 rounded-xl border border-[#cfd9d1] space-y-3">
            <h4 className="text-xs font-bold text-[#16261d] uppercase tracking-wider bay-accent-line">
              Immediate Hub Directives
            </h4>
            <div className="space-y-2">
              <button
                onClick={() => alert('Broadcast sent: Variable Message Signs updated to Hub Full.')}
                className="w-full text-left p-2.5 bg-[#eff5f0] hover:bg-[#dee4df] rounded-lg text-xs font-semibold text-[#16261d] transition flex justify-between items-center"
              >
                <span>Broadcast "Hub Full" to VMS Signboards</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#1b5e3b]" />
              </button>
              <button
                onClick={() => alert('Syncing with Bangladesh Police BRTA Stolen Vehicle Hotlist...')}
                className="w-full text-left p-2.5 bg-[#eff5f0] hover:bg-[#dee4df] rounded-lg text-xs font-semibold text-[#16261d] transition flex justify-between items-center"
              >
                <span>Sync BRTA Stolen Vehicle Hotlist</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#1b5e3b]" />
              </button>
              <button
                onClick={() => onNavigate('admin-cameras')}
                className="w-full text-left p-2.5 bg-[#dcefe3] hover:bg-[#cbe6d3] rounded-lg text-xs font-bold text-[#1b5e3b] transition flex justify-between items-center"
              >
                <span>Open Live Gate Camera Stream Inspector</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#1b5e3b]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
