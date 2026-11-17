import React, { useState } from 'react';
import { useParkEase } from '../../context/ParkEaseContext';
import { PaymentMethod } from '../../types';
import { Search, CreditCard, Smartphone, Receipt } from 'lucide-react';

export const AdminPayments: React.FC = () => {
  const { payments, bookings, slots, areas, users } = useParkEase();

  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<'All' | PaymentMethod>('All');

  // Database totals
  const totalPayments = payments.length;
  const paidPayments = payments.filter((p) => p.payment_status === 'Paid');
  const paidCount = paidPayments.length;
  const totalAmountCollected = paidPayments.reduce((sum, p) => sum + p.amount, 0);

  const filteredPayments = payments.filter((p) => {
    const booking = bookings.find((b) => b.booking_id === p.booking_id);
    const customer = booking ? users.find((u) => u.user_id === booking.user_id) : null;
    const slot = booking ? slots.find((s) => s.slot_id === booking.slot_id) : null;
    const area = slot ? areas.find((a) => a.area_id === slot.area_id) : null;

    const customerName = customer?.full_name || '';
    const areaName = area?.area_name || '';
    const slotNum = slot?.slot_number || '';
    const q = searchTerm.trim().toLowerCase();

    const matchSearch =
      !q ||
      p.payment_id.toString().includes(q) ||
      p.booking_id.toString().includes(q) ||
      customerName.toLowerCase().includes(q) ||
      areaName.toLowerCase().includes(q) ||
      slotNum.toLowerCase().includes(q);

    const matchMethod = methodFilter === 'All' || p.payment_method === methodFilter;
    return matchSearch && matchMethod;
  });

  const getStatusBadgeClass = (status: string) => {
    if (status === 'Paid') return 'badge-available';
    if (status === 'Pending') return 'badge-booked';
    return 'badge-occupied';
  };

  return (
    <div className="admin-page-wrap">
      {/* Breadcrumb & Page Header with thin yellow dashed underline */}
      <div className="admin-breadcrumb">Admin Portal / Payments</div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Payment Records</h1>
          <p className="admin-page-subtitle">
            Review customer payment records, methods, and paid amounts.
          </p>
        </div>
      </div>

      {/* Three Stat Cards (DB counts and sums) */}
      <div className="admin-stats-grid-3">
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Payments</span>
          </div>
          <div className="admin-stat-value">{totalPayments}</div>
          <div className="admin-stat-caption">Database payment entries</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Amount Collected</span>
          </div>
          <div className="admin-stat-value">BDT {totalAmountCollected}</div>
          <div className="admin-stat-caption">Sum of paid transactions</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Paid Status</span>
          </div>
          <div className="admin-stat-value is-success">{paidCount}</div>
          <div className="admin-stat-caption">Completed payments</div>
        </div>
      </div>

      {/* Filter Bar: Payment Method Buttons & Search Input */}
      <div className="admin-filter-card">
        <div className="admin-filter-group">
          <span className="admin-filter-label">Payment Method:</span>
          {(['All', 'bKash', 'Nagad', 'Rocket', 'Visa', 'MasterCard'] as const).map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setMethodFilter(method)}
              className={`admin-filter-btn ${methodFilter === method ? 'active' : ''}`}
            >
              {method}
            </button>
          ))}
        </div>

        <div className="admin-search-box">
          <Search className="admin-search-icon" aria-hidden="true" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search payment ID, booking, user..."
            aria-label="Search payment records"
            className="admin-search-input"
          />
        </div>
      </div>

      {/* Transaction Ledger Flat Table */}
      <div className="admin-flat-table-wrap">
        <div className="admin-flat-table-titlebar">
          <h2 className="admin-card-title">
            <Receipt className="w-4 h-4 text-[var(--primary-forest)]" aria-hidden="true" />
            <span>
              Transaction Ledger ({filteredPayments.length}{' '}
              {filteredPayments.length === 1 ? 'Record' : 'Records'})
            </span>
          </h2>
        </div>

        <div className="admin-table-scroll">
          <table className="admin-flat-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Booking ID</th>
                <th>Customer</th>
                <th>Parking Area &amp; Slot</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length > 0 ? (
                filteredPayments.map((p) => {
                  const booking = bookings.find((b) => b.booking_id === p.booking_id);
                  const customer = booking ? users.find((u) => u.user_id === booking.user_id) : null;
                  const slot = booking ? slots.find((s) => s.slot_id === booking.slot_id) : null;
                  const area = slot ? areas.find((a) => a.area_id === slot.area_id) : null;

                  return (
                    <tr key={p.payment_id}>
                      <td className="font-bold text-[var(--primary-forest)] tabular-nums">
                        #{p.payment_id}
                      </td>
                      <td className="font-semibold text-[var(--text-heading)] tabular-nums">
                        #{p.booking_id}
                      </td>
                      <td>
                        <div className="font-semibold text-[var(--text-heading)]">
                          {customer?.full_name || 'User'}
                        </div>
                        {customer?.phone && (
                          <div className="text-[11px] text-[var(--text-muted)]">
                            {customer.phone}
                          </div>
                        )}
                      </td>
                      <td>
                        {area ? (
                          <span>
                            {area.area_name} ({slot?.slot_number || '-'})
                          </span>
                        ) : (
                          <span className="text-[var(--text-muted)]">-</span>
                        )}
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--text-heading)]">
                          {p.payment_method === 'Visa' || p.payment_method === 'MasterCard' ? (
                            <CreditCard className="w-3.5 h-3.5 text-[var(--primary-forest)]" aria-hidden="true" />
                          ) : (
                            <Smartphone className="w-3.5 h-3.5 text-[var(--primary-forest)]" aria-hidden="true" />
                          )}
                          <span>{p.payment_method}</span>
                        </span>
                      </td>
                      <td className="font-bold text-[var(--primary-forest)] tabular-nums">
                        BDT {p.amount}
                      </td>
                      <td>
                        <span className={`badge-status ${getStatusBadgeClass(p.payment_status)}`}>
                          {p.payment_status}
                        </span>
                      </td>
                      <td className="text-[var(--text-muted)] text-[11px] tabular-nums whitespace-nowrap">
                        {p.payment_date}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-[var(--text-muted)]">
                    No payment records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

