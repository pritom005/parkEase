import React, { useState } from 'react';
import { mockDb } from '../../db/mockDb';
import { GateLog } from '../../types';
import {
  Camera,
  Radio,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Sliders,
  Car,
  Maximize2,
  ArrowRight,
} from 'lucide-react';

interface GateCameraFeed {
  id: string;
  gate_id: string;
  hub_name: string;
  type: 'ENTRY' | 'EXIT';
  status: 'ONLINE' | 'STANDBY' | 'DEGRADED';
  fps: number;
  resolution: string;
  ip_address: string;
  active_plate?: string;
  confidence?: number;
}

const GATE_CAMERAS: GateCameraFeed[] = [
  {
    id: 'CAM-GEC-01',
    gate_id: 'GATE-01 (ENTRY)',
    hub_name: 'GEC Circle Multi-Level Terminal',
    type: 'ENTRY',
    status: 'ONLINE',
    fps: 60,
    resolution: '4K UHD (3840x2160)',
    ip_address: '10.14.88.21',
    active_plate: 'CTG-METRO-GA-11-2045',
    confidence: 99.4,
  },
  {
    id: 'CAM-GEC-02',
    gate_id: 'GATE-02 (EXIT)',
    hub_name: 'GEC Circle Multi-Level Terminal',
    type: 'EXIT',
    status: 'ONLINE',
    fps: 60,
    resolution: '4K UHD (3840x2160)',
    ip_address: '10.14.88.22',
    active_plate: 'DHK-METRO-KHA-55-9012',
    confidence: 98.7,
  },
  {
    id: 'CAM-AGR-01',
    gate_id: 'GATE-01 (ENTRY)',
    hub_name: 'Agrabad Commercial Area Hub',
    type: 'ENTRY',
    status: 'ONLINE',
    fps: 58,
    resolution: '1080p FHD (1920x1080)',
    ip_address: '10.14.89.15',
    active_plate: 'CTG-METRO-HA-14-8833',
    confidence: 97.2,
  },
  {
    id: 'CAM-AGR-02',
    gate_id: 'GATE-02 (EXIT)',
    hub_name: 'Agrabad Commercial Area Hub',
    type: 'EXIT',
    status: 'ONLINE',
    fps: 60,
    resolution: '1080p FHD (1920x1080)',
    ip_address: '10.14.89.16',
    active_plate: 'DHK-METRO-CHA-22-4411',
    confidence: 99.1,
  },
  {
    id: 'CAM-NAS-01',
    gate_id: 'GATE-01 (ENTRY/EXIT)',
    hub_name: 'Nasirabad CDA Avenue Smart Lot',
    type: 'ENTRY',
    status: 'ONLINE',
    fps: 60,
    resolution: '4K UHD (3840x2160)',
    ip_address: '10.14.90.04',
    active_plate: 'CTG-METRO-LA-09-1200',
    confidence: 96.8,
  },
  {
    id: 'CAM-KHP-01',
    gate_id: 'GATE-01 (ENTRY)',
    hub_name: 'Khulshi Premium Parking Facility',
    type: 'ENTRY',
    status: 'ONLINE',
    fps: 60,
    resolution: '4K UHD (3840x2160)',
    ip_address: '10.14.91.08',
    active_plate: 'CTG-METRO-GA-33-8822',
    confidence: 99.6,
  },
];

export const AdminGateCameras: React.FC = () => {
  const [selectedCam, setSelectedCam] = useState<GateCameraFeed>(GATE_CAMERAS[0]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const gateLogs: GateLog[] = mockDb.getGateLogs();

  const handleManualTrigger = (gateId: string) => {
    alert(`ANPR Optical Override Triggered for [${gateId}]: Camera snapshot captured and OCR re-evaluated against BRTA National Database.`);
  };

  const handleRefreshStreams = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#455549] mb-1">
            <span>MUNICIPAL CONTROL ROOM</span>
            <span>/</span>
            <span>ANPR OPTICAL TELEMETRY</span>
            <span>/</span>
            <span className="text-[#1b5e3b] font-bold">24-NODE CAMERA GRID</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#16261d] tracking-tight">
            Live Gate Camera Stream Inspector
          </h1>
          <p className="text-xs text-[#455549] mt-1">
            Real-time optical automated number-plate recognition (ANPR) feeds and boom barrier actuator telemetry across Chattogram hubs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshStreams}
            disabled={isRefreshing}
            className="neu-btn-secondary px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#1b5e3b]' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh All Streams'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Feed Player (8 cols) + Camera List & Actuator (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Stream Player & OCR Detection Details */}
        <div className="lg:col-span-8 space-y-4">
          <div className="neu-raised p-4 sm:p-5 rounded-xl border border-[#cfd9d1] space-y-3">
            <div className="flex items-center justify-between border-b border-[#cfd9d1] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping"></span>
                <span className="text-xs font-mono font-bold text-[#16261d]">
                  LIVE FEED: {selectedCam.id} — {selectedCam.hub_name}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="px-2 py-0.5 rounded bg-[#dcefe3] text-[#1b5e3b] font-bold">
                  {selectedCam.resolution}
                </span>
                <span className="px-2 py-0.5 rounded bg-white text-[#455549] border border-[#cfd9d1]">
                  {selectedCam.fps} FPS
                </span>
              </div>
            </div>

            {/* Video Canvas Simulation */}
            <div className="relative bg-[#0f1913] rounded-lg overflow-hidden border border-[#2b4435] aspect-video flex flex-col justify-between p-4 shadow-inner">
              {/* OSD (On-Screen Display) Top */}
              <div className="flex justify-between items-start text-[11px] font-mono text-emerald-400 select-none">
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    REC • {selectedCam.gate_id}
                  </div>
                  <div className="text-emerald-400/70 text-[10px]">
                    IP: {selectedCam.ip_address} | LENS: IR 850nm SONY STARVIS
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">CCC METRO SMART GATEWAY</div>
                  <div className="text-emerald-400/70 text-[10px]">
                    ZONE: CHATTOGRAM CCC-S1
                  </div>
                </div>
              </div>

              {/* ANPR Bounding Box Target */}
              <div className="relative mx-auto my-auto w-64 h-32 border-2 border-emerald-400/80 rounded flex flex-col items-center justify-center bg-emerald-950/20 backdrop-blur-[1px]">
                <div className="absolute -top-3 left-2 bg-emerald-500 text-black text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase">
                  OCR LOCK ({selectedCam.confidence}%)
                </div>
                <span className="text-xs text-emerald-300 font-mono tracking-widest uppercase">
                  BRTA VEHICLE DETECTED
                </span>
                <strong className="text-lg font-mono font-black text-white tracking-widest mt-1 bg-black/70 px-3 py-1 rounded border border-emerald-400/60">
                  {selectedCam.active_plate || 'SCANNING...'}
                </strong>
                <div className="absolute -bottom-2.5 right-2 text-[9px] font-mono text-emerald-300 bg-emerald-950/80 px-1 border border-emerald-500/40">
                  BARRIER: AUTO-ARMED
                </div>
              </div>

              {/* OSD Bottom */}
              <div className="flex justify-between items-end text-[10px] font-mono text-emerald-400/80 select-none">
                <div>
                  LATENCY: 22ms • PROTOCOL: RTSP / H.265 • BRTA API: OK
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700/50">
                    BARRIER: {selectedCam.type === 'ENTRY' ? 'ENTRY BOOM' : 'EXIT BOOM'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Gate Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#455549]">Node Status:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold text-[11px]">
                  {selectedCam.status}
                </span>
                <span className="text-[#455549] ml-2">Type:</span>
                <strong className="text-[#16261d] font-mono">{selectedCam.type}</strong>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleManualTrigger(selectedCam.gate_id)}
                  className="neu-btn-primary px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Force OCR Rescan</span>
                </button>
              </div>
            </div>
          </div>

          {/* Recent ANPR Optical Logs */}
          <div className="neu-raised p-5 rounded-xl border border-[#cfd9d1] space-y-3">
            <h3 className="text-sm font-bold text-[#16261d] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#1b5e3b]" />
              <span>Optical Plate Clearance Audit Log (Recent 6 Events)</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#cfd9d1] text-[10px] font-mono uppercase text-[#455549] bg-[#dee4df]/60">
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3">Gate / Hub</th>
                    <th className="py-2.5 px-3">Plate OCR</th>
                    <th className="py-2.5 px-3">Match</th>
                    <th className="py-2.5 px-3">Vehicle Details</th>
                    <th className="py-2.5 px-3">Barrier Clearance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#cfd9d1]/60">
                  {gateLogs.map((log) => (
                    <tr key={log.log_id} className="hover:bg-[#dee4df]/50">
                      <td className="py-2.5 px-3 font-mono text-[#455549]">{log.detection_time}</td>
                      <td className="py-2.5 px-3">
                        <strong className="block text-[#16261d]">{log.gate_id}</strong>
                        <span className="text-[10px] text-[#455549]">{log.hub_name}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#16261d]">
                        {log.plate_number}
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800">
                          {log.ocr_match_percent}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#16261d]">
                        {log.vehicle_name}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[11px] font-mono font-bold text-[#1b5e3b]">
                          {log.barrier_clearance}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Camera Feed Selector (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#16261d] bay-accent-line">
              Select Optical Camera Feed ({GATE_CAMERAS.length} Nodes)
            </h3>
            <div className="space-y-2">
              {GATE_CAMERAS.map((cam) => {
                const isSelected = selectedCam.id === cam.id;
                return (
                  <button
                    key={cam.id}
                    onClick={() => setSelectedCam(cam)}
                    className={`w-full text-left p-3 rounded-lg border transition flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-[#dcefe3] border-[#1b5e3b] neu-pressed-sm'
                        : 'bg-white border-[#cfd9d1] hover:bg-[#eff5f0]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Camera className={`w-3.5 h-3.5 ${isSelected ? 'text-[#1b5e3b]' : 'text-[#455549]'}`} />
                        <span className="text-xs font-bold text-[#16261d] font-mono">
                          {cam.id}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                        {cam.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#455549] line-clamp-1">
                      {cam.hub_name}
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#455549] pt-1">
                      <span>{cam.gate_id}</span>
                      <span className="text-[#1b5e3b] font-bold">{cam.fps} FPS</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ANPR Specs Card */}
          <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1] space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#16261d] bay-accent-line">
              Hardware Telemetry Specs
            </h4>
            <div className="space-y-2 text-xs text-[#455549]">
              <div className="flex justify-between py-1 border-b border-[#cfd9d1]/60">
                <span>OCR Algorithm:</span>
                <strong className="text-[#16261d] font-mono">TensorRT BRTA-v3.8</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-[#cfd9d1]/60">
                <span>Optical Sensor:</span>
                <strong className="text-[#16261d]">Sony Starvis II 4K</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-[#cfd9d1]/60">
                <span>Barrier Actuator:</span>
                <strong className="text-[#16261d] font-mono">Magnetic Access MicroDrive</strong>
              </div>
              <div className="flex justify-between py-1">
                <span>Passage Cycle:</span>
                <strong className="text-[#1b5e3b] font-mono font-bold">0.8s Open / 1.0s Close</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
