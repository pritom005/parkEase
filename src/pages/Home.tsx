import React, { useState } from 'react';
import { mockDb } from '../db/mockDb';
import { HERO_PARKING_IMAGE, getAreaImage } from '../data/parkingImages';
import { Car, Bike, Search, Calendar, Clock, ChevronDown, CheckCircle2, Shield, Radio, ArrowRight, ShieldCheck } from 'lucide-react';

interface HomeProps {
  onNavigate: (view: string, extra?: any) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const areas = mockDb.getAreas();
  const [selectedAreaId, setSelectedAreaId] = useState<number>(1);
  const [vehicleCategory, setVehicleCategory] = useState<'Car' | 'Motorcycle'>('Car');
  const [arrivalDate, setArrivalDate] = useState<string>('2026-10-10');
  const [arrivalTime, setArrivalTime] = useState<string>('09:00');

  // Interactive Live Bay demo on hero
  const [demoSelectedBay, setDemoSelectedBay] = useState<string>('P-04');

  // FAQ state
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How do I know if a slot is available before driving there?',
      a: 'Real-time physical slot indicator tiles on ParkEase communicate current bay state: an extruded green raised tile indicates the bay is available for immediate booking. Once reserved, the bay locks instantly on our central gate terminal to prevent double booking.',
    },
    {
      q: 'What are the daily parking rates for cars and motorcycles in Chattogram?',
      a: 'Pricing is strictly standardized across all municipal hubs: Passenger Cars are 60 BDT per hour (or 1,000 BDT full day flat), and Motorcycles are 20 BDT per hour (or 400 BDT full day flat). All rates cover entry and automated ANPR clearance.',
    },
    {
      q: 'Which payment methods are supported?',
      a: 'We support all mainstream domestic payment options including bKash, Nagad, and Rocket mobile wallets, as well as Visa and MasterCard debit or credit cards, and the pre-funded ParkEase Civic Wallet.',
    },
    {
      q: 'What is the 20-minute reservation grace period?',
      a: 'Under CCC Smart Traffic bylaws, once a slot is confirmed, the system holds the slot exclusively for 20 minutes past your scheduled arrival. If your vehicle does not arrive at the boom gate within this window, the bay is released back to the municipal pool.',
    },
  ];

  const handleCheckSlots = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('parking-map', {
      areaId: selectedAreaId,
      vehicleType: vehicleCategory,
      date: arrivalDate,
      time: arrivalTime,
    });
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Heading and Sensor Array Demo */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#dee4df] rounded text-xs font-semibold text-[#1b5e3b] uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#1b5e3b]"></span>
              Chattogram Urban Transit System
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#16261d] tracking-tight leading-tight">
              Book a parking slot in Chattogram before you leave home
            </h1>

            <p className="text-[#455549] text-base sm:text-lg max-w-xl leading-relaxed">
              Making Parking Effortless across key municipal hubs in Chattogram. Real-time sensor telemetry,
              ANPR boom barrier verification, and guaranteed reserved spots.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('user-register')}
                className="neu-btn-primary px-5 py-3 rounded-lg text-sm font-semibold flex items-center gap-2"
              >
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate('parking-map')}
                className="neu-btn-secondary px-5 py-3 rounded-lg text-sm font-semibold"
              >
                Explore Parking
              </button>
            </div>

            {/* Live Bay Sensor Array Hero Preview */}
            <div className="pt-6">
              <div className="neu-raised p-5 rounded-xl border border-[#cfd9d1]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#16261d]">
                      Live Bay Sensor Array (GEC Node 01)
                    </span>
                    <p className="text-[11px] text-[#455549]">Interactive ground sensor status preview</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#1b5e3b] font-mono">
                    <span className="w-2 h-2 rounded-full bg-[#1b5e3b] animate-ping"></span>
                    <span>4-State Sensor Status</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* P-01 Available */}
                  <div
                    onClick={() => setDemoSelectedBay('P-01')}
                    className={`p-3 rounded-lg text-center cursor-pointer transition select-none ${
                      demoSelectedBay === 'P-01'
                        ? 'bg-[#dcefe3] border-2 border-[#1b5e3b] neu-pressed-sm'
                        : 'neu-raised-sm hover:bg-[#e0e7e1]'
                    }`}
                  >
                    <div className="w-7 h-7 mx-auto rounded-full bg-[#dcefe3] text-[#1b5e3b] flex items-center justify-center font-bold text-xs mb-1">
                      P
                    </div>
                    <span className="text-xs font-bold font-mono text-[#16261d]">P-01</span>
                    <p className="text-[10px] text-[#1b5e3b] font-semibold uppercase">Available</p>
                  </div>

                  {/* P-02 Booked */}
                  <div className="p-3 rounded-lg text-center neu-raised-sm opacity-85 select-none bg-[#eff5f0]">
                    <div className="w-7 h-7 mx-auto rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs mb-1">
                      🔒
                    </div>
                    <span className="text-xs font-bold font-mono text-[#16261d]">P-02</span>
                    <p className="text-[10px] text-amber-800 font-semibold uppercase">Booked</p>
                  </div>

                  {/* P-03 Occupied */}
                  <div className="p-3 rounded-lg text-center neu-pressed-sm select-none bg-[#e8eee9]">
                    <div className="w-7 h-7 mx-auto rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs mb-1">
                      🚗
                    </div>
                    <span className="text-xs font-bold font-mono text-[#16261d]">P-03</span>
                    <p className="text-[10px] text-red-700 font-semibold uppercase">Occupied</p>
                  </div>

                  {/* P-04 Selected */}
                  <div
                    onClick={() => setDemoSelectedBay('P-04')}
                    className={`p-3 rounded-lg text-center cursor-pointer transition select-none ${
                      demoSelectedBay === 'P-04'
                        ? 'bg-[#1b5e3b] text-white neu-raised-sm'
                        : 'neu-raised-sm hover:bg-[#e0e7e1]'
                    }`}
                  >
                    <div className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center font-bold text-xs mb-1 ${demoSelectedBay === 'P-04' ? 'bg-white text-[#1b5e3b]' : 'bg-[#dcefe3] text-[#1b5e3b]'}`}>
                      ✓
                    </div>
                    <span className={`text-xs font-bold font-mono ${demoSelectedBay === 'P-04' ? 'text-white' : 'text-[#16261d]'}`}>
                      P-04
                    </span>
                    <p className={`text-[10px] font-semibold uppercase ${demoSelectedBay === 'P-04' ? 'text-[#e6b422]' : 'text-[#1b5e3b]'}`}>
                      Selected
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Tactile Terminal "Find & Reserve Bay" */}
          <div className="lg:col-span-5">
            <div className="neu-raised p-6 rounded-xl border border-[#cfd9d1]">
              <div className="mb-4">
                <span className="text-[11px] font-mono uppercase text-[#1b5e3b] font-semibold tracking-wider">
                  TACTILE TERMINAL
                </span>
                <h3 className="text-xl font-bold text-[#16261d] tracking-tight bay-accent-line mb-3">
                  Find & Reserve Bay
                </h3>

                {/* Hero Parking Terminal Visual */}
                <div className="w-full h-32 rounded-lg overflow-hidden border border-[#cfd9d1] relative shadow-2xs">
                  <img
                    src={HERO_PARKING_IMAGE}
                    alt="Chattogram Metropolitan Smart Parking infrastructure and barrier entry"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2">
                    <div className="text-white text-[10px] font-mono flex items-center justify-between w-full">
                      <span className="font-semibold">CCC Metropolitan Node 01</span>
                      <span className="text-[#e6b422] font-bold">ANPR Grid Active</span>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleCheckSlots} className="space-y-4">
                {/* Target Zone */}
                <div>
                  <label className="block text-xs font-semibold text-[#16261d] mb-1">Target Zone / Area</label>
                  <select
                    value={selectedAreaId}
                    onChange={(e) => setSelectedAreaId(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg text-xs neu-input"
                  >
                    {areas.map((a) => (
                      <option key={a.area_id} value={a.area_id}>
                        {a.area_name} ({a.total_slots} Slots)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vehicle Category & Tariff */}
                <div>
                  <label className="block text-xs font-semibold text-[#16261d] mb-1">Vehicle Category & Tariff</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setVehicleCategory('Car')}
                      className={`p-3 rounded-lg text-center transition ${
                        vehicleCategory === 'Car'
                          ? 'neu-pressed bg-[#dcefe3] border-2 border-[#1b5e3b]'
                          : 'neu-raised-sm hover:bg-[#e0e7e1]'
                      }`}
                    >
                      <Car className="w-5 h-5 mx-auto mb-1 text-[#1b5e3b]" />
                      <span className="text-xs font-bold block text-[#16261d]">Car</span>
                      <span className="text-[10px] text-[#455549]">60 BDT/hr • 1,000/day</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVehicleCategory('Motorcycle')}
                      className={`p-3 rounded-lg text-center transition ${
                        vehicleCategory === 'Motorcycle'
                          ? 'neu-pressed bg-[#dcefe3] border-2 border-[#1b5e3b]'
                          : 'neu-raised-sm hover:bg-[#e0e7e1]'
                      }`}
                    >
                      <Bike className="w-5 h-5 mx-auto mb-1 text-[#1b5e3b]" />
                      <span className="text-xs font-bold block text-[#16261d]">Motorcycle</span>
                      <span className="text-[10px] text-[#455549]">20 BDT/hr • 400/day</span>
                    </button>
                  </div>
                </div>

                {/* Arrival Date & Time */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#16261d] mb-1">Arrival Date</label>
                    <input
                      type="date"
                      value={arrivalDate}
                      onChange={(e) => setArrivalDate(e.target.value)}
                      className="w-full p-2.5 rounded-lg text-xs neu-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#16261d] mb-1">Estimated Entry</label>
                    <input
                      type="time"
                      value={arrivalTime}
                      onChange={(e) => setArrivalTime(e.target.value)}
                      className="w-full p-2.5 rounded-lg text-xs neu-input"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full neu-btn-primary py-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 mt-4"
                >
                  <Search className="w-4 h-4" />
                  <span>Check Available Slots</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Feature summary strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-10">
          <div className="neu-raised-sm p-3.5 rounded-lg flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#dcefe3] text-[#1b5e3b] flex items-center justify-center font-bold">
              6
            </div>
            <div>
              <span className="text-xs font-bold text-[#16261d] block">6 Parking Areas</span>
              <span className="text-[11px] text-[#455549]">Chattogram Metro Network</span>
            </div>
          </div>

          <div className="neu-raised-sm p-3.5 rounded-lg flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#dcefe3] text-[#1b5e3b] flex items-center justify-center font-bold">
              P
            </div>
            <div>
              <span className="text-xs font-bold text-[#16261d] block">130 Verified Slots</span>
              <span className="text-[11px] text-[#455549]">84 Car + 46 Motorcycle</span>
            </div>
          </div>

          <div className="neu-raised-sm p-3.5 rounded-lg flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#dcefe3] text-[#1b5e3b] flex items-center justify-center font-bold">
              ৳
            </div>
            <div>
              <span className="text-xs font-bold text-[#16261d] block">Standard Rates</span>
              <span className="text-[11px] text-[#455549]">Car: 60/hr • Bike: 20/hr</span>
            </div>
          </div>

          <div className="neu-raised-sm p-3.5 rounded-lg flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#dcefe3] text-[#1b5e3b] flex items-center justify-center font-bold">
              💳
            </div>
            <div>
              <span className="text-xs font-bold text-[#16261d] block">Flexible Payment</span>
              <span className="text-[11px] text-[#455549]">bKash, Nagad, Rocket, Cards</span>
            </div>
          </div>
        </div>
      </section>

      {/* Municipal Parking Areas in Chattogram */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <span className="text-xs font-semibold text-[#1b5e3b] uppercase tracking-wider block">
            MUNICIPAL DEPLOYMENT
          </span>
          <h2 className="text-2xl font-bold text-[#16261d] tracking-tight">
            Parking Areas in Chattogram
          </h2>
          <p className="text-xs text-[#455549] mt-1">
            Select a designated area to view sensor-verified capacity, category breakdowns, and real-time gate occupancy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {areas.map((area, idx) => (
            <div
              key={area.area_id}
              className="neu-raised p-5 rounded-xl border border-[#cfd9d1] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-[#455549]">
                    HUB 0{idx + 1} • {area.area_name.split(' ')[0].toUpperCase()}
                  </span>
                  <span className="text-[10px] font-semibold bg-[#dcefe3] text-[#1b5e3b] px-2 py-0.5 rounded border border-[#1b5e3b]">
                    Active
                  </span>
                </div>

                {/* Parking Area Visual Asset */}
                <div className="w-full h-36 rounded-lg overflow-hidden mb-3 border border-[#cfd9d1] relative shadow-2xs">
                  <img
                    src={getAreaImage(area.area_id)}
                    alt={`${area.area_name} municipal parking facility in Chattogram`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#e6b422]"></span>
                    <span>ANPR Verified</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-[#16261d] mb-1 bay-accent-line">
                  {area.area_name}
                </h3>
                <p className="text-xs text-[#455549] mb-4">{area.location}</p>

                <div className="space-y-1.5 text-xs text-[#455549] py-3 border-y border-[#cfd9d1]">
                  <div className="flex justify-between">
                    <span>Total Capacity:</span>
                    <strong className="text-[#16261d] font-mono">{area.total_slots} Slots</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Car Bays (60 BDT/hr):</span>
                    <strong className="text-[#16261d] font-mono">{area.car_slots} Slots</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Motorcycle Bays (20 BDT/hr):</span>
                    <strong className="text-[#16261d] font-mono">{area.motorcycle_slots} Slots</strong>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => onNavigate('parking-map', { areaId: area.area_id })}
                  className="w-full neu-btn-secondary py-2 rounded-lg text-xs font-semibold hover:text-[#1b5e3b] transition"
                >
                  View Slots & Live Map
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Pipeline */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-semibold text-[#1b5e3b] uppercase tracking-wider block">
            WORKFLOW PIPELINE
          </span>
          <h2 className="text-2xl font-bold text-[#16261d] tracking-tight">How It Works</h2>
          <div className="w-16 h-0.5 border-b-2 border-dashed border-[#e6b422] mx-auto my-2"></div>
          <p className="text-xs text-[#455549]">
            Four standardized steps to ensure guaranteed parking access in high-density urban corridors.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="neu-raised p-5 rounded-xl border border-[#cfd9d1]">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded bg-[#dcefe3] text-[#1b5e3b] flex items-center justify-center font-bold">
                🔍
              </div>
              <span className="text-xs font-mono font-bold text-[#455549]">01</span>
            </div>
            <h4 className="text-sm font-bold text-[#16261d] mb-1">Search & Select Area</h4>
            <p className="text-xs text-[#455549] leading-relaxed">
              Find your destination in Chattogram: GEC Circle, Agrabad, Khulshi, Bahaddarhat, Patenga, or Chawkbazar.
            </p>
          </div>

          <div className="neu-raised p-5 rounded-xl border border-[#cfd9d1]">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded bg-[#dcefe3] text-[#1b5e3b] flex items-center justify-center font-bold">
                🅿️
              </div>
              <span className="text-xs font-mono font-bold text-[#455549]">02</span>
            </div>
            <h4 className="text-sm font-bold text-[#16261d] mb-1">Choose Slot & Vehicle</h4>
            <p className="text-xs text-[#455549] leading-relaxed">
              Pick an available Car or Motorcycle slot with real-time sensor status reflected on our tactile visual layout.
            </p>
          </div>

          <div className="neu-raised p-5 rounded-xl border border-[#cfd9d1]">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded bg-[#dcefe3] text-[#1b5e3b] flex items-center justify-center font-bold">
                💳
              </div>
              <span className="text-xs font-mono font-bold text-[#455549]">03</span>
            </div>
            <h4 className="text-sm font-bold text-[#16261d] mb-1">Confirm & Pay</h4>
            <p className="text-xs text-[#455549] leading-relaxed">
              Seamlessly record payment via bKash, Nagad, Rocket, or major Cards for daily or hourly parking without hidden charges.
            </p>
          </div>

          <div className="neu-raised p-5 rounded-xl border border-[#cfd9d1]">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded bg-[#dcefe3] text-[#1b5e3b] flex items-center justify-center font-bold">
                ⚡
              </div>
              <span className="text-xs font-mono font-bold text-[#455549]">04</span>
            </div>
            <h4 className="text-sm font-bold text-[#16261d] mb-1">Park Effortlessly</h4>
            <p className="text-xs text-[#455549] leading-relaxed">
              Arrive with your guaranteed booking confirmation. Pass automated boom gate controls and park in your assigned slot.
            </p>
          </div>
        </div>
      </section>

      {/* System Features */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <span className="text-xs font-semibold text-[#1b5e3b] uppercase tracking-wider block">
            INFRASTRUCTURE STANDARDS
          </span>
          <h2 className="text-2xl font-bold text-[#16261d] tracking-tight">System Features</h2>
          <div className="w-16 h-0.5 border-b-2 border-dashed border-[#e6b422] my-2"></div>
          <p className="text-xs text-[#455549]">
            Designed from the ground up for Chattogram's municipal traffic environment, prioritizing speed, reliability, and precision.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="neu-raised p-5 rounded-xl border border-[#cfd9d1]">
            <div className="w-8 h-8 rounded bg-[#dcefe3] text-[#1b5e3b] flex items-center justify-center font-bold mb-3">
              <Radio className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-[#16261d] mb-1">Real-Time Slot Availability</h4>
            <p className="text-xs text-[#455549] leading-relaxed">
              Instant visibility into Available, Booked, and Occupied slots via continuous physical ground telemetry sensors.
            </p>
          </div>

          <div className="neu-raised p-5 rounded-xl border border-[#cfd9d1]">
            <div className="w-8 h-8 rounded bg-[#dcefe3] text-[#1b5e3b] flex items-center justify-center font-bold mb-3">
              <Car className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-[#16261d] mb-1">Vehicle Management</h4>
            <p className="text-xs text-[#455549] leading-relaxed">
              Register and switch between personal cars and motorcycles effortlessly within a unified user profile interface.
            </p>
          </div>

          <div className="neu-raised p-5 rounded-xl border border-[#cfd9d1]">
            <div className="w-8 h-8 rounded bg-[#dcefe3] text-[#1b5e3b] flex items-center justify-center font-bold mb-3">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-[#16261d] mb-1">Dedicated Chattogram Hubs</h4>
            <p className="text-xs text-[#455549] leading-relaxed">
              Strategic civic zones positioned across GEC, Agrabad, Khulshi, Bahaddarhat, Patenga, and Chawkbazar.
            </p>
          </div>

          <div className="neu-raised p-5 rounded-xl border border-[#cfd9d1]">
            <div className="w-8 h-8 rounded bg-[#dcefe3] text-[#1b5e3b] flex items-center justify-center font-bold mb-3">
              <Calendar className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-[#16261d] mb-1">Advance Daily Booking</h4>
            <p className="text-xs text-[#455549] leading-relaxed">
              Reserve your spot ahead of time to eliminate roadside idling and circling in dense commercial streets.
            </p>
          </div>

          <div className="neu-raised p-5 rounded-xl border border-[#cfd9d1]">
            <div className="w-8 h-8 rounded bg-[#dcefe3] text-[#1b5e3b] flex items-center justify-center font-bold mb-3">
              💳
            </div>
            <h4 className="text-sm font-bold text-[#16261d] mb-1">Multi-Channel Payment Recording</h4>
            <p className="text-xs text-[#455549] leading-relaxed">
              Supports bKash, Nagad, Rocket, Visa, and MasterCard with transparent fee ledgers and zero hidden costs.
            </p>
          </div>

          <div className="neu-raised p-5 rounded-xl border border-[#cfd9d1]">
            <div className="w-8 h-8 rounded bg-[#dcefe3] text-[#1b5e3b] flex items-center justify-center font-bold mb-3">
              📄
            </div>
            <h4 className="text-sm font-bold text-[#16261d] mb-1">Booking History & Receipts</h4>
            <p className="text-xs text-[#455549] leading-relaxed">
              Instant digital verification and downloadable receipt slips for all your active and past parking reservations.
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="neu-raised p-8 rounded-xl border border-[#cfd9d1] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <span className="text-xs font-semibold text-[#1b5e3b] uppercase tracking-wider block">
              CIVIC FOUNDATION
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#16261d] tracking-tight">
              About ParkEase
            </h2>
            <div className="w-16 h-0.5 border-b-2 border-dashed border-[#e6b422]"></div>
            <p className="text-xs sm:text-sm text-[#455549] leading-relaxed">
              ParkEase is built specifically to address urban congestion and parking uncertainty across Chattogram.
              We provide drivers with direct visibility into authorized parking bays, standardized daily rates,
              and straightforward digital reservations.
            </p>
            <p className="text-xs sm:text-sm text-[#455549] leading-relaxed">
              By replacing haphazard street parking with monitored physical sensor networks and automated boom barriers,
              ParkEase delivers orderly space utilization for commercial shoppers, daily office commuters, and logistics operators alike.
            </p>

            <div className="grid grid-cols-3 gap-3 pt-3">
              <div className="p-3 bg-[#e8eee9] rounded-lg border border-[#cfd9d1]">
                <strong className="block text-base font-bold text-[#1b5e3b]">100%</strong>
                <span className="text-[11px] text-[#455549]">Authorized Lots</span>
              </div>
              <div className="p-3 bg-[#e8eee9] rounded-lg border border-[#cfd9d1]">
                <strong className="block text-base font-bold text-[#1b5e3b]">Fixed</strong>
                <span className="text-[11px] text-[#455549]">Daily Tariffs</span>
              </div>
              <div className="p-3 bg-[#e8eee9] rounded-lg border border-[#cfd9d1]">
                <strong className="block text-base font-bold text-[#1b5e3b]">Instant</strong>
                <span className="text-[11px] text-[#455549]">Gate Clearance</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 p-6 bg-[#dee4df] rounded-lg border border-[#cfd9d1] space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#16261d] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#1b5e3b]" />
              Metropolitan Infrastructure Core
            </h4>
            <p className="text-xs text-[#455549] leading-relaxed">
              Direct physical sensor telemetry streams active occupancy changes to our servers within milliseconds,
              keeping reservation locks perfectly synchronized.
            </p>
            <div className="flex justify-between items-center text-xs py-2 border-t border-[#cfd9d1]">
              <span className="text-[#455549]">Data Uplink:</span>
              <span className="text-[#1b5e3b] font-mono font-semibold">Online & Synchronized</span>
            </div>
            <div className="flex justify-between items-center text-xs py-2 border-t border-[#cfd9d1]">
              <span className="text-[#455549]">Standardized Municipal Enforcement:</span>
              <span className="text-[#16261d] font-semibold">Chattogram</span>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <span className="text-xs font-semibold text-[#1b5e3b] uppercase tracking-wider block">
            HELP & ASSISTANCE
          </span>
          <h2 className="text-2xl font-bold text-[#16261d] tracking-tight">Frequently Asked Questions</h2>
          <div className="w-16 h-0.5 border-b-2 border-dashed border-[#e6b422] mx-auto my-2"></div>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="neu-raised rounded-lg border border-[#cfd9d1] overflow-hidden">
              <button
                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                className="w-full p-4 text-left flex items-center justify-between text-xs font-bold text-[#16261d] hover:bg-[#dee4df] transition"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#1b5e3b] transition-transform ${
                    expandedFaq === idx ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedFaq === idx && (
                <div className="px-4 pb-4 pt-1 text-xs text-[#455549] leading-relaxed border-t border-[#cfd9d1]/60 bg-[#eff5f0]">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Box */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="neu-raised p-8 rounded-xl border border-[#cfd9d1] text-center space-y-4">
          <div className="w-10 h-10 rounded-lg bg-[#1b5e3b] text-white flex items-center justify-center font-bold text-lg mx-auto">
            P
          </div>
          <h3 className="text-2xl font-bold text-[#16261d] tracking-tight">
            Ready to park without the hassle?
          </h3>
          <div className="w-16 h-0.5 border-b-2 border-dashed border-[#e6b422] mx-auto"></div>
          <p className="text-xs text-[#455549] max-w-md mx-auto">
            Create your free ParkEase account or check slot availability in Chattogram right now.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('user-register')}
              className="neu-btn-primary px-5 py-2.5 rounded-lg text-xs font-semibold"
            >
              Create Account
            </button>
            <button
              onClick={() => onNavigate('parking-map')}
              className="neu-btn-secondary px-5 py-2.5 rounded-lg text-xs font-semibold"
            >
              Explore Parking Areas
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
