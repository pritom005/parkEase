import React, { useState } from 'react';
import { mockDb } from '../../db/mockDb';
import {
  BarChart3,
  CalendarCheck,
  CreditCard,
  Grid,
  Download,
  FileSpreadsheet,
} from 'lucide-react';

export const AdminReports: React.FC = () => {
  const [activeReport, setActiveReport] = useState<'bookings' | 'payments' | 'usage'>('bookings');

  const bookings = mockDb.getAllBookings();
  const payments = mockDb.getAllPayments();
  const areas = mockDb.getAreas();
  const allSlots = mockDb.getAllSlots();

  // 1. Booking Report Calculations
  const confirmedCount = bookings.filter((b) => b.booking_status === 'Confirmed').length;
  const completedCount = bookings.filter((b) => b.booking_status === 'Completed').length;
  const cancelledCount = bookings.filter((b) => b.booking_status === 'Cancelled').length;

  const carBookings = bookings.filter((b) => b.vehicle_type === 'Car').length;
  const motoBookings = bookings.filter((b) => b.vehicle_type === 'Motorcycle').length;

  const bookingsByArea = areas.map((a) => {
    const count = bookings.filter((b) => b.area_name === a.area_name).length;
    return { area_name: a.area_name, count };
  });

  // 2. Payment Report Calculations
  const totalRevenue = payments.reduce((sum, p) => sum + (p.payment_status === 'Paid' ? p.amount : 0), 0);
  const methods = ['bKash', 'Nagad', 'Rocket', 'Visa', 'MasterCard'] as const;
  const paymentBreakdown = methods.map((m) => {
    const list = payments.filter((p) => p.payment_method === m && p.payment_status === 'Paid');
    const count = list.length;
    const amount = list.reduce((s, p) => s + p.amount, 0);
    return { method: m, count, amount };
  });

  // 3. Parking Usage Calculations
  const usageByArea = areas.map((a) => {
    const areaSlots = mockDb.getSlotsByArea(a.area_id);
    const total = areaSlots.length;
    const avail = areaSlots.filter((s) => s.status === 'Available').length;
    const booked = areaSlots.filter((s) => s.status === 'Booked').length;
    const occupied = areaSlots.filter((s) => s.status === 'Occupied').length;
    const inUse = booked + occupied;
    const utilPercent = total > 0 ? Math.round((inUse / total) * 100) : 0;
    return {
      area_id: a.area_id,
      area_name: a.area_name,
      total,
      avail,
      booked,
      occupied,
      utilPercent,
    };
  });

  // Export CSV handler
  const handleExportCsv = () => {
    let csvContent = '';
    let filename = 'parkease_report.csv';

    if (activeReport === 'bookings') {
      filename = 'parkease_bookings_report.csv';
      csvContent = 'Booking ID,Customer,Phone,Vehicle,Area,Slot,Date,Time,Duration (hrs),Total (BDT),Status\n';
      bookings.forEach((b) => {
        csvContent += `"${b.booking_id}","${b.user_name || ''}","${b.user_phone || ''}","${b.vehicle_number || ''}","${b.area_name || ''}","${b.slot_number || ''}","${b.booking_date}","${b.booking_time}","${b.duration_hours}","${b.price_total}","${b.booking_status}"\n`;
      });
    } else if (activeReport === 'payments') {
      filename = 'parkease_payments_report.csv';
      csvContent = 'Payment ID,Booking ID,Customer,Method,Amount (BDT),Status,Date\n';
      payments.forEach((p) => {
        csvContent += `"${p.payment_id}","${p.booking_id}","${p.user_name || ''}","${p.payment_method}","${p.amount}","${p.payment_status}","${p.payment_date}"\n`;
      });
    } else {
      filename = 'parkease_parking_usage_report.csv';
      csvContent = 'Area ID,Area Name,Total Slots,Available,Booked,Occupied,Utilization (%)\n';
      usageByArea.forEach((u) => {
        csvContent += `"${u.area_id}","${u.area_name}","${u.total}","${u.avail}","${u.booked}","${u.occupied}","${u.utilPercent}%"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#16261d] tracking-tight">
            System Reports
          </h1>
          <p className="text-xs text-[#455549] mt-1">
            Generate and review database-derived reports on bookings, payments, and parking slot usage.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="neu-btn-primary px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export Report (CSV)</span>
        </button>
      </div>

      {/* Report Selector Tabs */}
      <div className="neu-raised p-2 rounded-xl border border-[#cfd9d1] flex flex-wrap gap-2">
        <button
          onClick={() => setActiveReport('bookings')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
            activeReport === 'bookings'
              ? 'bg-[#1b5e3b] text-white shadow-xs'
              : 'bg-[#eff5f0] text-[#455549] hover:text-[#16261d]'
          }`}
        >
          <CalendarCheck className="w-3.5 h-3.5" />
          <span>Booking Reports</span>
        </button>

        <button
          onClick={() => setActiveReport('payments')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
            activeReport === 'payments'
              ? 'bg-[#1b5e3b] text-white shadow-xs'
              : 'bg-[#eff5f0] text-[#455549] hover:text-[#16261d]'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Payment Reports</span>
        </button>

        <button
          onClick={() => setActiveReport('usage')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
            activeReport === 'usage'
              ? 'bg-[#1b5e3b] text-white shadow-xs'
              : 'bg-[#eff5f0] text-[#455549] hover:text-[#16261d]'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Parking Usage Reports</span>
        </button>
      </div>

      {/* 1. BOOKING REPORTS */}
      {activeReport === 'bookings' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1]">
              <span className="text-[10px] font-mono text-[#455549] uppercase block font-semibold">
                CONFIRMED (ACTIVE)
              </span>
              <strong className="text-2xl font-bold text-[#1b5e3b] block mt-1">
                {confirmedCount}
              </strong>
              <span className="text-[10px] text-[#455549] block mt-0.5">Currently active</span>
            </div>

            <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1]">
              <span className="text-[10px] font-mono text-[#455549] uppercase block font-semibold">
                COMPLETED
              </span>
              <strong className="text-2xl font-bold text-blue-800 block mt-1">
                {completedCount}
              </strong>
              <span className="text-[10px] text-[#455549] block mt-0.5">Finished sessions</span>
            </div>

            <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1]">
              <span className="text-[10px] font-mono text-[#455549] uppercase block font-semibold">
                CANCELLED
              </span>
              <strong className="text-2xl font-bold text-gray-700 block mt-1">
                {cancelledCount}
              </strong>
              <span className="text-[10px] text-[#455549] block mt-0.5">Cancelled by user/admin</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* By Vehicle Type */}
            <div className="neu-raised p-5 rounded-xl border border-[#cfd9d1] space-y-3">
              <h3 className="text-sm font-bold text-[#16261d]">Bookings by Vehicle Category</h3>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-white rounded border border-[#cfd9d1] flex justify-between items-center">
                  <span className="font-medium text-[#16261d]">Passenger Cars</span>
                  <strong className="font-mono text-[#1b5e3b]">{carBookings} Bookings</strong>
                </div>
                <div className="p-3 bg-white rounded border border-[#cfd9d1] flex justify-between items-center">
                  <span className="font-medium text-[#16261d]">Motorcycles</span>
                  <strong className="font-mono text-[#1b5e3b]">{motoBookings} Bookings</strong>
                </div>
              </div>
            </div>

            {/* By Area */}
            <div className="neu-raised p-5 rounded-xl border border-[#cfd9d1] space-y-3">
              <h3 className="text-sm font-bold text-[#16261d]">Bookings by Parking Area</h3>
              <div className="space-y-2 text-xs">
                {bookingsByArea.map((item) => (
                  <div
                    key={item.area_name}
                    className="p-2.5 bg-white rounded border border-[#cfd9d1] flex justify-between items-center"
                  >
                    <span className="text-[#16261d]">{item.area_name}</span>
                    <strong className="font-mono text-[#1b5e3b]">{item.count} Bookings</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PAYMENT REPORTS */}
      {activeReport === 'payments' && (
        <div className="space-y-6">
          <div className="neu-raised p-5 rounded-xl border border-[#cfd9d1]">
            <span className="text-[10px] font-mono text-[#455549] uppercase block font-semibold">
              TOTAL RECORDED REVENUE
            </span>
            <strong className="text-3xl font-extrabold text-[#1b5e3b] font-mono block mt-1">
              ৳{totalRevenue} BDT
            </strong>
            <p className="text-xs text-[#455549] mt-1">
              Aggregated from {payments.filter((p) => p.payment_status === 'Paid').length} paid database transactions.
            </p>
          </div>

          <div className="neu-raised p-5 rounded-xl border border-[#cfd9d1] space-y-4">
            <h3 className="text-sm font-bold text-[#16261d]">
              Revenue Breakdown by Payment Method
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#cfd9d1] text-[#455549] uppercase font-mono text-[10px]">
                    <th className="py-2.5 px-3">Payment Method</th>
                    <th className="py-2.5 px-3">Transactions</th>
                    <th className="py-2.5 px-3">Total Amount</th>
                    <th className="py-2.5 px-3">Share of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#cfd9d1]/60">
                  {paymentBreakdown.map((row) => {
                    const share = totalRevenue > 0 ? Math.round((row.amount / totalRevenue) * 100) : 0;
                    return (
                      <tr key={row.method} className="hover:bg-[#dee4df]/50">
                        <td className="py-3 px-3 font-semibold text-[#16261d]">{row.method}</td>
                        <td className="py-3 px-3 font-mono">{row.count}</td>
                        <td className="py-3 px-3 font-mono font-bold text-[#1b5e3b]">৳{row.amount}</td>
                        <td className="py-3 px-3 font-mono text-[#455549]">{share}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. PARKING USAGE REPORTS */}
      {activeReport === 'usage' && (
        <div className="space-y-6">
          <div className="neu-raised p-5 rounded-xl border border-[#cfd9d1] space-y-4">
            <h3 className="text-sm font-bold text-[#16261d]">
              Parking Area Capacity & Real Utilization
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#cfd9d1] text-[#455549] uppercase font-mono text-[10px]">
                    <th className="py-2.5 px-3">Area Name</th>
                    <th className="py-2.5 px-3">Total Slots</th>
                    <th className="py-2.5 px-3">Available</th>
                    <th className="py-2.5 px-3">Booked</th>
                    <th className="py-2.5 px-3">Occupied</th>
                    <th className="py-2.5 px-3">Occupancy Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#cfd9d1]/60">
                  {usageByArea.map((row) => (
                    <tr key={row.area_id} className="hover:bg-[#dee4df]/50">
                      <td className="py-3 px-3 font-semibold text-[#16261d]">{row.area_name}</td>
                      <td className="py-3 px-3 font-mono">{row.total}</td>
                      <td className="py-3 px-3 font-mono text-[#1b5e3b] font-bold">{row.avail}</td>
                      <td className="py-3 px-3 font-mono text-amber-700">{row.booked}</td>
                      <td className="py-3 px-3 font-mono text-red-700">{row.occupied}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-[#dee4df] rounded-full h-2">
                            <div
                              className="bg-[#1b5e3b] h-2 rounded-full"
                              style={{ width: `${row.utilPercent}%` }}
                            ></div>
                          </div>
                          <span className="font-mono font-bold text-[11px] text-[#16261d]">
                            {row.utilPercent}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
