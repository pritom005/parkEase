import React, { useState } from 'react';
import { mockDb } from '../../db/mockDb';
import { Payment, PaymentMethod } from '../../types';
import {
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

export const AdminPayments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>(() => mockDb.getAllPayments());
  const [methodFilter, setMethodFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = payments.filter((p) => {
    if (methodFilter !== 'All' && p.payment_method !== methodFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = String(p.payment_id).includes(q);
      const matchBooking = String(p.booking_id).includes(q);
      const matchUser = p.user_name?.toLowerCase().includes(q) || false;
      const matchArea = p.area_name?.toLowerCase().includes(q) || false;
      if (!matchId && !matchBooking && !matchUser && !matchArea) return false;
    }
    return true;
  });

  const totalPayments = payments.length;
  const totalAmount = payments.reduce((sum, p) => sum + (p.payment_status === 'Paid' ? p.amount : 0), 0);
  const paidCount = payments.filter((p) => p.payment_status === 'Paid').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#16261d] tracking-tight">
          Payment Records
        </h1>
        <p className="text-xs text-[#455549] mt-1">
          Review simulated customer payment transactions, gateway methods, and amounts.
        </p>
      </div>

      {/* Summary KPI derived strictly from database */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block font-semibold">
            TOTAL PAYMENTS
          </span>
          <strong className="text-2xl font-bold text-[#16261d] block mt-1">
            {totalPayments}
          </strong>
          <span className="text-[10px] text-[#455549] block mt-0.5">Database payment entries</span>
        </div>

        <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block font-semibold">
            TOTAL AMOUNT COLLECTED
          </span>
          <strong className="text-2xl font-bold text-[#1b5e3b] font-mono block mt-1">
            ৳{totalAmount}
          </strong>
          <span className="text-[10px] text-[#455549] block mt-0.5">Sum of paid transactions</span>
        </div>

        <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block font-semibold">
            PAID STATUS
          </span>
          <strong className="text-2xl font-bold text-[#1b5e3b] block mt-1">
            {paidCount}
          </strong>
          <span className="text-[10px] text-[#1b5e3b] font-medium block mt-0.5">
            Cleared transactions
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-[#16261d]">Payment Method:</span>
          {['All', 'bKash', 'Nagad', 'Rocket', 'Visa', 'MasterCard'].map((m) => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                methodFilter === m
                  ? 'bg-[#1b5e3b] text-white'
                  : 'bg-[#eff5f0] text-[#455549] hover:text-[#16261d]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#455549] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search payment ID, booking, user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs neu-input"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="neu-raised p-5 rounded-xl border border-[#cfd9d1]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#16261d]">
            Transaction Ledger ({filtered.length} Records)
          </h2>
        </div>

        {filtered.length === 0 ? (
          <div className="p-8 text-center text-[#455549] text-xs">
            No payment records found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#cfd9d1] text-[#455549] uppercase font-mono text-[10px]">
                  <th className="py-2.5 px-3">Payment ID</th>
                  <th className="py-2.5 px-3">Booking ID</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Parking Area & Slot</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#cfd9d1]/60">
                {filtered.map((p) => (
                  <tr key={p.payment_id} className="hover:bg-[#dee4df]/50">
                    <td className="py-3 px-3 font-mono font-bold text-[#16261d]">
                      #{p.payment_id}
                    </td>
                    <td className="py-3 px-3 font-mono text-[#455549]">
                      #{p.booking_id}
                    </td>
                    <td className="py-3 px-3 font-medium text-[#16261d]">
                      {p.user_name || 'Customer'}
                    </td>
                    <td className="py-3 px-3 text-[#455549]">
                      {p.area_name} ({p.slot_number})
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-[#16261d]">
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-[#1b5e3b]">
                      ৳{p.amount}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.payment_status === 'Paid'
                            ? 'bg-[#dcefe3] text-[#1b5e3b]'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.payment_status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#455549] font-mono text-[11px]">
                      {p.payment_date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
