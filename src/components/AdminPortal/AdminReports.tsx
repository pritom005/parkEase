import React, { useMemo, useState } from 'react';
import { useParkEase } from '../../context/ParkEaseContext';
import {
  CalendarCheck,
  CreditCard,
  LayoutGrid,
  Car,
  Bike,
  Printer,
  Download,
  FileText
} from 'lucide-react';

type ReportTab = 'bookings' | 'payments' | 'usage';

function csvEscape(value: string | number): string {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export const AdminReports: React.FC = () => {
  const { areas, slots, bookings, payments, users, currentUser } = useParkEase();
  const [activeTab, setActiveTab] = useState<ReportTab>('bookings');
  const [showAuditPreview, setShowAuditPreview] = useState(false);

  // 1. Booking Report metrics
  const confirmedBookings = bookings.filter((b) => b.booking_status === 'Confirmed').length;
  const completedBookings = bookings.filter((b) => b.booking_status === 'Completed').length;
  const cancelledBookings = bookings.filter((b) => b.booking_status === 'Cancelled').length;

  const carBookingsList = bookings.filter((b) => {
    const s = slots.find((slot) => slot.slot_id === b.slot_id);
    return s?.vehicle_type === 'Car';
  });
  const bikeBookingsList = bookings.filter((b) => {
    const s = slots.find((slot) => slot.slot_id === b.slot_id);
    return s?.vehicle_type === 'Motorcycle';
  });
  const carBookings = carBookingsList.length;
  const bikeBookings = bikeBookingsList.length;
  const carPaidRevenue = carBookingsList.reduce(
    (sum, b) => (b.payment_status === 'Paid' ? sum + b.price_total : sum),
    0
  );
  const bikePaidRevenue = bikeBookingsList.reduce(
    (sum, b) => (b.payment_status === 'Paid' ? sum + b.price_total : sum),
    0
  );

  // 2. Payment Report metrics
  const paidPayments = payments.filter((p) => p.payment_status === 'Paid');
  const pendingPayments = payments.filter((p) => p.payment_status === 'Pending');
  const failedPayments = payments.filter((p) => p.payment_status === 'Failed');
  const pendingOrFailedPayments = payments.filter((p) => p.payment_status !== 'Paid').length;
  const totalRevenue = paidPayments.reduce((sum, p) => sum + p.amount, 0);
  const unpaidAmount = payments
    .filter((p) => p.payment_status !== 'Paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const methodStats: Record<string, { count: number; total: number }> = {
    bKash: { count: 0, total: 0 },
    Nagad: { count: 0, total: 0 },
    Rocket: { count: 0, total: 0 },
    Visa: { count: 0, total: 0 },
    MasterCard: { count: 0, total: 0 }
  };

  paidPayments.forEach((p) => {
    if (methodStats[p.payment_method]) {
      methodStats[p.payment_method].count += 1;
      methodStats[p.payment_method].total += p.amount;
    }
  });

  // 3. Parking Usage Report metrics
  const availableSlotsCount = slots.filter((s) => s.status === 'Available').length;
  const bookedSlotsCount = slots.filter((s) => s.status === 'Booked').length;
  const occupiedSlotsCount = slots.filter((s) => s.status === 'Occupied').length;
  const carSlotsCount = slots.filter((s) => s.vehicle_type === 'Car').length;
  const bikeSlotsCount = slots.filter((s) => s.vehicle_type === 'Motorcycle').length;

  // Per-area database aggregations
  const areaStats = areas.map((a) => {
    const areaSlots = slots.filter((s) => s.area_id === a.area_id);
    const areaSlotIds = new Set(areaSlots.map((s) => s.slot_id));
    const areaBookings = bookings.filter((b) => areaSlotIds.has(b.slot_id));
    const paidBookingsCount = areaBookings.filter((b) => b.payment_status === 'Paid').length;
    const areaRevenue = areaBookings.reduce(
      (sum, b) => (b.payment_status === 'Paid' ? sum + b.price_total : sum),
      0
    );
    const freeCount = areaSlots.filter((s) => s.status === 'Available').length;
    const usedCount = areaSlots.length - freeCount;

    return {
      area_id: a.area_id,
      area_name: a.area_name,
      total_slots: areaSlots.length,
      available_slots: freeCount,
      used_slots: usedCount,
      total_bookings: areaBookings.length,
      paid_bookings: paidBookingsCount,
      revenue: areaRevenue
    };
  });

  // Joined audit ledger rows (newest first)
  const auditLedgerRows = useMemo(() => {
    const slotMap = new Map(slots.map((s) => [s.slot_id, s]));
    const areaMap = new Map(areas.map((a) => [a.area_id, a]));
    const bookingMap = new Map(bookings.map((b) => [b.booking_id, b]));
    const userMap = new Map(users.map((u) => [u.user_id, u]));

    return [...payments]
      .sort((a, b) => b.payment_id - a.payment_id)
      .map((p) => {
        const booking = bookingMap.get(p.booking_id);
        const slot = booking ? slotMap.get(booking.slot_id) : undefined;
        const area = slot ? areaMap.get(slot.area_id) : undefined;
        const customer = booking ? userMap.get(booking.user_id) : undefined;
        return {
          payment_id: p.payment_id,
          booking_id: p.booking_id,
          payment_date: p.payment_date,
          customer_name: customer?.full_name || `User #${booking?.user_id ?? 'N/A'}`,
          area_slot: area && slot ? `${area.area_name} / ${slot.slot_number}` : `Slot #${booking?.slot_id ?? 'N/A'}`,
          vehicle_type: slot?.vehicle_type || 'N/A',
          payment_method: p.payment_method,
          booking_status: booking?.booking_status || 'N/A',
          payment_status: p.payment_status,
          amount: p.amount
        };
      });
  }, [payments, bookings, slots, areas, users]);

  const generatedAtLabel = new Date().toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handlePrintAuditReport = () => {
    window.print();
  };

  const handleExportAuditCsv = () => {
    const lines: string[] = [];
    lines.push(['ParkEase Chattogram - Financial & Booking Audit Report'].map(csvEscape).join(','));
    lines.push(['Generated At', generatedAtLabel].map(csvEscape).join(','));
    lines.push(['Prepared By', currentUser?.full_name || 'Administrator'].map(csvEscape).join(','));
    lines.push('');

    lines.push(['BOOKING & PAYMENT SUMMARY'].map(csvEscape).join(','));
    lines.push(['Metric', 'Value'].map(csvEscape).join(','));
    lines.push(['Total Bookings', bookings.length].map(csvEscape).join(','));
    lines.push(['Confirmed Bookings', confirmedBookings].map(csvEscape).join(','));
    lines.push(['Completed Bookings', completedBookings].map(csvEscape).join(','));
    lines.push(['Cancelled Bookings', cancelledBookings].map(csvEscape).join(','));
    lines.push(['Total Paid Revenue (BDT)', totalRevenue].map(csvEscape).join(','));
    lines.push(['Paid Transactions', paidPayments.length].map(csvEscape).join(','));
    lines.push(['Pending Transactions', pendingPayments.length].map(csvEscape).join(','));
    lines.push(['Failed Transactions', failedPayments.length].map(csvEscape).join(','));
    lines.push(['Unpaid Transactions Amount (BDT)', unpaidAmount].map(csvEscape).join(','));
    lines.push('');

    lines.push(['PAYMENT METHOD BREAKDOWN'].map(csvEscape).join(','));
    lines.push(['Payment Method', 'Paid Count', 'Collected (BDT)', 'Share (%)'].map(csvEscape).join(','));
    Object.entries(methodStats).forEach(([method, data]) => {
      const share = totalRevenue > 0 ? ((data.total / totalRevenue) * 100).toFixed(1) : '0.0';
      lines.push([method, data.count, data.total, `${share}%`].map(csvEscape).join(','));
    });
    lines.push('');

    lines.push(['PARKING AREA BREAKDOWN'].map(csvEscape).join(','));
    lines.push(['Area', 'Total Slots', 'In Use Slots', 'Total Bookings', 'Paid Bookings', 'Paid Revenue (BDT)'].map(csvEscape).join(','));
    areaStats.forEach((stat) => {
      lines.push(
        [
          stat.area_name,
          stat.total_slots,
          stat.used_slots,
          stat.total_bookings,
          stat.paid_bookings,
          stat.revenue
        ]
          .map(csvEscape)
          .join(',')
      );
    });
    lines.push('');

    lines.push(['PAYMENT AUDIT LEDGER'].map(csvEscape).join(','));
    lines.push(
      [
        'Payment ID',
        'Booking ID',
        'Payment Date',
        'Customer',
        'Area / Slot',
        'Vehicle Type',
        'Method',
        'Booking Status',
        'Payment Status',
        'Amount (BDT)'
      ]
        .map(csvEscape)
        .join(',')
    );
    auditLedgerRows.forEach((row) => {
      lines.push(
        [
          row.payment_id,
          row.booking_id,
          row.payment_date,
          row.customer_name,
          row.area_slot,
          row.vehicle_type,
          row.payment_method,
          row.booking_status,
          row.payment_status,
          row.amount
        ]
          .map(csvEscape)
          .join(',')
      );
    });

    const csvContent = lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute('download', `parkease-financial-audit-${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-page-wrap">
      {/* Breadcrumb & Page Header with thin yellow dashed underline */}
      <div className="admin-breadcrumb">Admin Portal / Reports</div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">System Reports</h1>
          <p className="admin-page-subtitle">
            Review booking, payment, and slot usage totals, or export a formatted financial audit report.
          </p>
        </div>

        <div className="admin-header-actions no-print">
          <button
            type="button"
            onClick={() => setShowAuditPreview((prev) => !prev)}
            className="admin-header-link-btn"
            aria-pressed={showAuditPreview}
          >
            <FileText className="w-4 h-4" aria-hidden="true" />
            <span>{showAuditPreview ? 'Back to Report Tabs' : 'Audit Sheet Preview'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportAuditCsv}
            className="admin-header-link-btn"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrintAuditReport}
            className="btn-primary-main text-xs whitespace-nowrap shrink-0"
          >
            <Printer className="w-4 h-4" aria-hidden="true" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Screen-only Interactive Report Tabs View */}
      {!showAuditPreview && (
        <div className="admin-reports-screen-only">
          {/* Category Tabs Bar */}
          <div className="admin-reports-tabs" role="tablist" aria-label="Report categories">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'bookings'}
              onClick={() => setActiveTab('bookings')}
              className={`admin-report-tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
            >
              <CalendarCheck className="w-4 h-4" aria-hidden="true" />
              <span>Booking Reports</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'payments'}
              onClick={() => setActiveTab('payments')}
              className={`admin-report-tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
            >
              <CreditCard className="w-4 h-4" aria-hidden="true" />
              <span>Payment Reports</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'usage'}
              onClick={() => setActiveTab('usage')}
              className={`admin-report-tab-btn ${activeTab === 'usage' ? 'active' : ''}`}
            >
              <LayoutGrid className="w-4 h-4" aria-hidden="true" />
              <span>Parking Usage Reports</span>
            </button>
          </div>

          {/* TAB 1: BOOKING REPORTS */}
          {activeTab === 'bookings' && (
            <>
              <div className="admin-stats-grid-3">
                <div className="admin-stat-card">
                  <div className="admin-stat-header">
                    <span className="admin-stat-label">Confirmed (Active)</span>
                  </div>
                  <div className="admin-stat-value is-success tabular-nums">{confirmedBookings}</div>
                  <div className="admin-stat-caption">Currently active</div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-header">
                    <span className="admin-stat-label">Completed</span>
                  </div>
                  <div className="admin-stat-value tabular-nums">{completedBookings}</div>
                  <div className="admin-stat-caption">Finished sessions</div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-header">
                    <span className="admin-stat-label">Cancelled</span>
                  </div>
                  <div className="admin-stat-value tabular-nums">{cancelledBookings}</div>
                  <div className="admin-stat-caption">Cancelled by user/admin</div>
                </div>
              </div>

              <div className="admin-reports-breakdown-2">
                <section className="breakdown-card">
                  <h2 className="breakdown-card-title">Bookings by Vehicle Category</h2>
                  <div className="breakdown-list">
                    <div className="breakdown-row">
                      <span className="breakdown-row-name inline-flex items-center gap-2">
                        <Car className="w-4 h-4 text-[var(--primary-forest)]" aria-hidden="true" />
                        <span>Cars</span>
                      </span>
                      <span className="breakdown-row-badge tabular-nums">
                        {carBookings} {carBookings === 1 ? 'Booking' : 'Bookings'}
                      </span>
                    </div>
                    <div className="breakdown-row">
                      <span className="breakdown-row-name inline-flex items-center gap-2">
                        <Bike className="w-4 h-4 text-[var(--primary-forest)]" aria-hidden="true" />
                        <span>Motorcycles</span>
                      </span>
                      <span className="breakdown-row-badge tabular-nums">
                        {bikeBookings} {bikeBookings === 1 ? 'Booking' : 'Bookings'}
                      </span>
                    </div>
                  </div>
                </section>

                <section className="breakdown-card">
                  <h2 className="breakdown-card-title">Bookings by Parking Area</h2>
                  <div className="breakdown-list">
                    {areaStats.map((stat) => (
                      <div key={stat.area_id} className="breakdown-row">
                        <span className="breakdown-row-name">{stat.area_name}</span>
                        <span className="breakdown-row-badge tabular-nums">
                          {stat.total_bookings} {stat.total_bookings === 1 ? 'Booking' : 'Bookings'}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </>
          )}

          {/* TAB 2: PAYMENT REPORTS */}
          {activeTab === 'payments' && (
            <>
              <div className="admin-stats-grid-3">
                <div className="admin-stat-card">
                  <div className="admin-stat-header">
                    <span className="admin-stat-label">Total Paid Collected</span>
                  </div>
                  <div className="admin-stat-value tabular-nums">
                    BDT {totalRevenue.toLocaleString()}
                  </div>
                  <div className="admin-stat-caption">Sum of paid records</div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-header">
                    <span className="admin-stat-label">Paid Transactions</span>
                  </div>
                  <div className="admin-stat-value is-success tabular-nums">{paidPayments.length}</div>
                  <div className="admin-stat-caption">Completed payments</div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-header">
                    <span className="admin-stat-label">Pending / Failed</span>
                  </div>
                  <div className="admin-stat-value tabular-nums">{pendingOrFailedPayments}</div>
                  <div className="admin-stat-caption">Unpaid transactions</div>
                </div>
              </div>

              <div className="admin-reports-breakdown-2">
                <section className="breakdown-card">
                  <h2 className="breakdown-card-title">Payments by Method</h2>
                  <div className="breakdown-list">
                    {Object.entries(methodStats).map(([method, data]) => (
                      <div key={method} className="breakdown-row">
                        <span className="breakdown-row-name">{method}</span>
                        <span className="breakdown-row-badge tabular-nums">
                          BDT {data.total.toLocaleString()} ({data.count})
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="breakdown-card">
                  <h2 className="breakdown-card-title">Paid Amount by Parking Area</h2>
                  <div className="breakdown-list">
                    {areaStats.map((stat) => (
                      <div key={stat.area_id} className="breakdown-row">
                        <span className="breakdown-row-name">{stat.area_name}</span>
                        <span className="breakdown-row-badge tabular-nums">
                          BDT {stat.revenue.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </>
          )}

          {/* TAB 3: PARKING USAGE REPORTS */}
          {activeTab === 'usage' && (
            <>
              <div className="admin-stats-grid-3">
                <div className="admin-stat-card">
                  <div className="admin-stat-header">
                    <span className="admin-stat-label">Total Slots</span>
                  </div>
                  <div className="admin-stat-value tabular-nums">{slots.length}</div>
                  <div className="admin-stat-caption">Across {areas.length} parking areas</div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-header">
                    <span className="admin-stat-label">Available Slots</span>
                  </div>
                  <div className="admin-stat-value is-success tabular-nums">{availableSlotsCount}</div>
                  <div className="admin-stat-caption">Ready for booking</div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-header">
                    <span className="admin-stat-label">Booked &amp; Occupied</span>
                  </div>
                  <div className="admin-stat-value tabular-nums">
                    {bookedSlotsCount + occupiedSlotsCount}
                  </div>
                  <div className="admin-stat-caption">
                    {bookedSlotsCount} booked, {occupiedSlotsCount} occupied
                  </div>
                </div>
              </div>

              <div className="admin-reports-breakdown-2">
                <section className="breakdown-card">
                  <h2 className="breakdown-card-title">Slots by Vehicle Category</h2>
                  <div className="breakdown-list">
                    <div className="breakdown-row">
                      <span className="breakdown-row-name inline-flex items-center gap-2">
                        <Car className="w-4 h-4 text-[var(--primary-forest)]" aria-hidden="true" />
                        <span>Cars</span>
                      </span>
                      <span className="breakdown-row-badge tabular-nums">
                        {carSlotsCount} {carSlotsCount === 1 ? 'Slot' : 'Slots'}
                      </span>
                    </div>
                    <div className="breakdown-row">
                      <span className="breakdown-row-name inline-flex items-center gap-2">
                        <Bike className="w-4 h-4 text-[var(--primary-forest)]" aria-hidden="true" />
                        <span>Motorcycles</span>
                      </span>
                      <span className="breakdown-row-badge tabular-nums">
                        {bikeSlotsCount} {bikeSlotsCount === 1 ? 'Slot' : 'Slots'}
                      </span>
                    </div>
                  </div>
                </section>

                <section className="breakdown-card">
                  <h2 className="breakdown-card-title">Slot Usage by Parking Area</h2>
                  <div className="breakdown-list">
                    {areaStats.map((stat) => (
                      <div key={stat.area_id} className="breakdown-row">
                        <span className="breakdown-row-name">{stat.area_name}</span>
                        <span className="breakdown-row-badge tabular-nums">
                          {stat.used_slots} / {stat.total_slots} in use ({stat.available_slots} free)
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </>
          )}
        </div>
      )}

      {/* Printable & Previewable Financial Audit Statement (always rendered for @media print) */}
      <article
        className={`audit-print-sheet ${showAuditPreview ? 'is-preview-open' : ''}`}
        aria-label="Printable financial and booking audit statement"
      >
        {/* Audit Header */}
        <header className="audit-sheet-header">
          <div className="audit-sheet-brand">
            <span className="audit-sheet-logo" aria-hidden="true">P</span>
            <div>
              <h2 className="audit-sheet-title">ParkEase Chattogram · Financial Audit Statement</h2>
              <p className="audit-sheet-subtitle">
                Booking Activity, Payment Reconciliation &amp; Area Revenue Summary
              </p>
            </div>
          </div>

          <div className="audit-sheet-meta">
            <span className="audit-sheet-meta-label">Generated:</span>
            <span className="audit-sheet-meta-value">{generatedAtLabel}</span>
            <span className="audit-sheet-meta-label">Prepared By:</span>
            <span className="audit-sheet-meta-value">{currentUser?.full_name || 'Administrator'}</span>
            <span className="audit-sheet-meta-label">Currency:</span>
            <span className="audit-sheet-meta-value">BDT</span>
          </div>
        </header>

        {/* 1. Executive Summary KPI Strip */}
        <section className="audit-section">
          <h3 className="audit-section-title">1. Executive Booking &amp; Payment Summary</h3>
          <div className="audit-kpi-strip">
            <div className="audit-kpi-box">
              <div className="audit-kpi-label">Gross Paid Revenue</div>
              <div className="audit-kpi-value">BDT {totalRevenue.toLocaleString()}</div>
              <div className="audit-kpi-sub">{paidPayments.length} paid transactions</div>
            </div>

            <div className="audit-kpi-box">
              <div className="audit-kpi-label">Total Bookings</div>
              <div className="audit-kpi-value">{bookings.length}</div>
              <div className="audit-kpi-sub">
                {confirmedBookings} Confirmed · {completedBookings} Completed · {cancelledBookings} Cancelled
              </div>
            </div>

            <div className="audit-kpi-box">
              <div className="audit-kpi-label">Pending &amp; Failed</div>
              <div className="audit-kpi-value">BDT {unpaidAmount.toLocaleString()}</div>
              <div className="audit-kpi-sub">
                {pendingPayments.length} Pending · {failedPayments.length} Failed
              </div>
            </div>

            <div className="audit-kpi-box">
              <div className="audit-kpi-label">Vehicle Revenue Split</div>
              <div className="audit-kpi-value">
                Car {carBookings} / Moto {bikeBookings}
              </div>
              <div className="audit-kpi-sub">
                BDT {carPaidRevenue.toLocaleString()} Car · BDT {bikePaidRevenue.toLocaleString()} Moto
              </div>
            </div>
          </div>
        </section>

        {/* 2. Method & Area Reconciliation Tables */}
        <div className="audit-tables-split">
          <section className="audit-section">
            <h3 className="audit-section-title">2. Payment Method Reconciliation</h3>
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Method</th>
                  <th className="text-right">Paid Count</th>
                  <th className="text-right">Share</th>
                  <th className="text-right">Collected (BDT)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(methodStats).map(([method, data]) => {
                  const sharePct = totalRevenue > 0 ? ((data.total / totalRevenue) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={method}>
                      <td>{method}</td>
                      <td className="text-right">{data.count}</td>
                      <td className="text-right">{sharePct}%</td>
                      <td className="text-right">{data.total.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td>Total Paid</td>
                  <td className="text-right">{paidPayments.length}</td>
                  <td className="text-right">{totalRevenue > 0 ? '100.0%' : '0.0%'}</td>
                  <td className="text-right">BDT {totalRevenue.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </section>

          <section className="audit-section">
            <h3 className="audit-section-title">3. Area Utilization &amp; Paid Revenue</h3>
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Parking Area</th>
                  <th className="text-right">Slots (Used/Total)</th>
                  <th className="text-right">Bookings</th>
                  <th className="text-right">Paid (BDT)</th>
                </tr>
              </thead>
              <tbody>
                {areaStats.map((stat) => (
                  <tr key={stat.area_id}>
                    <td>{stat.area_name}</td>
                    <td className="text-right">
                      {stat.used_slots} / {stat.total_slots}
                    </td>
                    <td className="text-right">{stat.total_bookings}</td>
                    <td className="text-right">{stat.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>All Areas ({areas.length})</td>
                  <td className="text-right">
                    {bookedSlotsCount + occupiedSlotsCount} / {slots.length}
                  </td>
                  <td className="text-right">{bookings.length}</td>
                  <td className="text-right">BDT {totalRevenue.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </section>
        </div>

        {/* 3. Itemized Payment & Booking Audit Ledger */}
        <section className="audit-section">
          <h3 className="audit-section-title">4. Itemized Payment &amp; Booking Audit Ledger</h3>
          {auditLedgerRows.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] m-0 py-3">
              No payment records exist in the system for this audit period.
            </p>
          ) : (
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Booking</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Area / Slot</th>
                  <th>Method</th>
                  <th>Booking Status</th>
                  <th>Payment Status</th>
                  <th className="text-right">Amount (BDT)</th>
                </tr>
              </thead>
              <tbody>
                {auditLedgerRows.map((row) => (
                  <tr key={row.payment_id}>
                    <td>#{row.payment_id}</td>
                    <td>#{row.booking_id}</td>
                    <td>{row.payment_date}</td>
                    <td>{row.customer_name}</td>
                    <td>{row.area_slot}</td>
                    <td>{row.payment_method}</td>
                    <td>{row.booking_status}</td>
                    <td>{row.payment_status}</td>
                    <td className="text-right">{row.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Audit Sign-Off Block */}
        <footer className="audit-signoff">
          <div>
            <div className="audit-signoff-line" />
            <div className="audit-signoff-caption">
              Prepared By ({currentUser?.full_name || 'Administrator'}) · Signature &amp; Date
            </div>
          </div>
          <div>
            <div className="audit-signoff-line" />
            <div className="audit-signoff-caption">Financial Auditor Verification · Signature &amp; Date</div>
          </div>
        </footer>
      </article>
    </div>
  );
};


