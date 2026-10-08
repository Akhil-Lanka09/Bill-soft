import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Printer,
  Ban,
  RotateCcw,
  CheckCircle2,
  Clock,
  Eye,
  Calendar,
  CalendarDays,
  Download,
  FileSpreadsheet,
  Filter,
} from 'lucide-react';
import { api } from '../services/api';
import { Bill } from '../types';
import { useAuth } from '../context/AuthContext';
import { ThermalReceiptModal } from '../components/common/ThermalReceiptModal';

export const BillsList: React.FC = () => {
  const { user } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Date Range state
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [datePreset, setDatePreset] = useState<'all' | 'this_month' | 'today' | 'last_7'>('all');

  // Modals
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [billToCancel, setBillToCancel] = useState<Bill | null>(null);

  useEffect(() => {
    loadBills();
  }, [paymentStatusFilter, statusFilter, startDate, endDate]);

  const loadBills = async () => {
    setLoading(true);
    try {
      const res = await api.getBills({
        search,
        paymentStatus: paymentStatusFilter,
        status: statusFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: 100,
      });
      if (res.success) setBills(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadBills();
  };

  const handlePrint = (bill: Bill) => {
    setSelectedBill(bill);
    setShowReceiptModal(true);
  };

  const handleOpenCancel = (bill: Bill) => {
    setBillToCancel(bill);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billToCancel) return;
    try {
      await api.cancelBill(billToCancel._id, cancelReason || 'Manager cancellation');
      setShowCancelModal(false);
      setBillToCancel(null);
      loadBills();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel bill');
    }
  };

  const handlePreset = (preset: 'all' | 'this_month' | 'today' | 'last_7') => {
    setDatePreset(preset);
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');

    if (preset === 'today') {
      setStartDate(`${y}-${m}-${d}`);
      setEndDate(`${y}-${m}-${d}`);
    } else if (preset === 'this_month') {
      const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
      setStartDate(`${y}-${m}-01`);
      setEndDate(`${y}-${m}-${String(lastDay).padStart(2, '0')}`);
    } else if (preset === 'last_7') {
      const past = new Date(Date.now() - 7 * 86400000);
      const pastM = String(past.getMonth() + 1).padStart(2, '0');
      const pastD = String(past.getDate()).padStart(2, '0');
      setStartDate(`${past.getFullYear()}-${pastM}-${pastD}`);
      setEndDate(`${y}-${m}-${d}`);
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleDownloadCSV = () => {
    if (bills.length === 0) {
      alert('No invoices found in the selected date range to download.');
      return;
    }

    const headers = [
      'Invoice Number',
      'Invoice Type',
      'Date & Time',
      'Customer Name',
      'Customer Phone',
      'Customer GSTIN',
      'Items Summary',
      'Total Items Count',
      'Subtotal (INR)',
      'Bill Discount (INR)',
      'Taxable Amount (INR)',
      'CGST (INR)',
      'SGST (INR)',
      'IGST (INR)',
      'Total GST (INR)',
      'Round Off (INR)',
      'Grand Total (INR)',
      'Total Paid (INR)',
      'Balance Due (INR)',
      'Payment Modes',
      'Payment Status',
      'Cashier Name',
      'Invoice Status',
    ];

    const rows = bills.map((b) => {
      const itemsSummary = b.items
        .map((i) => `${i.productName} (Qty: ${i.quantity})`)
        .join('; ');

      const paymentModes = b.payments.map((p) => p.method.toUpperCase()).join(', ');

      const dateStr = new Date(b.billDate).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
      });

      return [
        `"${b.invoiceNumber}"`,
        `"${b.billType === 'tax_invoice' ? 'Tax Invoice' : 'Bill of Supply'}"`,
        `"${dateStr}"`,
        `"${(b.customerName || 'Walk-in Customer').replace(/"/g, '""')}"`,
        `"${b.customerPhone || ''}"`,
        `"${b.customerGstin || ''}"`,
        `"${itemsSummary.replace(/"/g, '""')}"`,
        b.items.length,
        b.subtotal.toFixed(2),
        b.billDiscountAmount.toFixed(2),
        b.taxableAmount.toFixed(2),
        b.totalCgst.toFixed(2),
        b.totalSgst.toFixed(2),
        b.totalIgst.toFixed(2),
        b.totalTax.toFixed(2),
        b.roundOff.toFixed(2),
        b.grandTotal.toFixed(2),
        b.totalPaid.toFixed(2),
        b.balanceDue.toFixed(2),
        `"${paymentModes}"`,
        `"${b.paymentStatus.toUpperCase()}"`,
        `"${b.agentName || ''}"`,
        `"${b.status.toUpperCase()}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = `BN_Reddy_Nursery_Invoices_${startDate || 'All'}_to_${endDate || 'Current'}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintRegister = () => {
    window.print();
  };

  // Summary Metrics for the filtered period
  const totalSales = bills.filter((b) => b.status === 'active').reduce((acc, b) => acc + b.grandTotal, 0);
  const totalTax = bills.filter((b) => b.status === 'active').reduce((acc, b) => acc + b.totalTax, 0);
  const totalPaid = bills.filter((b) => b.status === 'active').reduce((acc, b) => acc + b.totalPaid, 0);
  const totalDue = bills.filter((b) => b.status === 'active').reduce((acc, b) => acc + b.balanceDue, 0);

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Header with Title and Download Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center space-x-2">
            <Receipt className="w-6 h-6 text-emerald-600" />
            <span>Sales Invoices & Counter Bills</span>
          </h2>
          <p className="text-xs text-slate-500">
            Audit trail of issued tax invoices, reprints, returns, and payment statuses
          </p>
        </div>

        {/* Download & Print Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadCSV}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs cursor-pointer"
            title="Download invoices for selected period as Excel/CSV"
          >
            <Download className="w-4 h-4" />
            <span>Download Invoices (CSV / Excel)</span>
          </button>
          <button
            onClick={handlePrintRegister}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Print invoice list"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Register</span>
          </button>
        </div>
      </div>

      {/* Period Summary Metric Banner */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Invoices Count</div>
          <div className="text-xl font-black text-slate-800 mt-0.5">{bills.length}</div>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Total Sales</div>
          <div className="text-xl font-black text-emerald-700 mt-0.5">₹{totalSales.toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">Total GST</div>
          <div className="text-xl font-black text-blue-700 mt-0.5">₹{totalTax.toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Amount Collected</div>
          <div className="text-xl font-black text-slate-800 mt-0.5">₹{totalPaid.toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">Balance Due</div>
          <div className="text-xl font-black text-amber-700 mt-0.5">₹{totalDue.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* Filters: Date Range + Quick Presets + Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        {/* Row 1: Quick Date Presets and Date Pickers */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
            <span className="text-xs font-semibold text-slate-500 flex items-center space-x-1 mr-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Period:</span>
            </span>
            <button
              onClick={() => handlePreset('this_month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                datePreset === 'this_month'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              📅 This Month
            </button>
            <button
              onClick={() => handlePreset('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                datePreset === 'today'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => handlePreset('last_7')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                datePreset === 'last_7'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => handlePreset('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                datePreset === 'all'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              All Time
            </button>
          </div>

          {/* Manual Date Inputs */}
          <div className="flex items-center space-x-2 text-xs">
            <div className="flex items-center space-x-1">
              <span className="text-slate-500 font-medium">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('all');
                }}
                className="py-1 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 outline-hidden"
              />
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-slate-500 font-medium">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('all');
                }}
                className="py-1 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Row 2: Search and Status Selects */}
        <div className="flex flex-col md:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice number (BN/2026-27/...) or customer phone..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-hidden focus:border-emerald-500"
            />
          </form>

          <div className="flex space-x-2">
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-hidden"
            >
              <option value="">All Payment Types</option>
              <option value="paid">Paid Full</option>
              <option value="partial">Partial</option>
              <option value="credit">Credit / Due</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-hidden"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="cancelled">Cancelled</option>
              <option value="returned">Returned</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Invoice No</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Cashier</th>
                <th className="py-3 px-4 text-right">Items</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    Loading invoices...
                  </td>
                </tr>
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    No sales invoices found matching filters.
                  </td>
                </tr>
              ) : (
                bills.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {b.invoiceNumber}
                    </td>

                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(b.billDate).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">
                        {b.customerName || 'Walk-in Customer'}
                      </div>
                      {b.customerPhone && (
                        <div className="text-[10px] text-slate-400">{b.customerPhone}</div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-600">{b.agentName}</td>

                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {b.items.length} items
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                      ₹{b.grandTotal}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block font-bold text-[10px] px-2 py-0.5 rounded-full capitalize ${
                          b.status === 'cancelled'
                            ? 'bg-rose-100 text-rose-700'
                            : b.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {b.status === 'cancelled' ? 'Cancelled' : b.paymentStatus}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => handlePrint(b)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center space-x-1 cursor-pointer"
                        title="Print 80mm Receipt"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-600" />
                        <span>Print</span>
                      </button>

                      <button
                        onClick={() => handlePrint(b)}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold inline-flex items-center space-x-1 cursor-pointer"
                        title="Send via WhatsApp"
                      >
                        <svg className="w-3.5 h-3.5 text-emerald-600 fill-current" viewBox="0 0 24 24">
                          <path d="M12.031 2C6.496 2 2 6.496 2 12.031c0 1.97.57 3.81 1.554 5.372L2.094 22l4.805-1.422a10.02 10.02 0 0 0 5.132 1.453h.005c5.535 0 10.031-4.496 10.031-10.031S17.566 2 12.031 2zm0 18.25a8.21 8.21 0 0 1-4.238-1.17l-.304-.18-2.854.845.85-2.783-.198-.316A8.204 8.204 0 0 1 3.781 12.03c0-4.549 3.701-8.25 8.25-8.25s8.25 3.701 8.25 8.25c0 4.548-3.701 8.25-8.25 8.25zm4.526-6.177c-.248-.124-1.468-.724-1.696-.807-.228-.083-.393-.124-.559.124-.165.248-.642.807-.787.972-.144.165-.289.186-.537.062-.248-.124-1.047-.386-1.995-1.231-.738-.658-1.237-1.472-1.381-1.72-.145-.248-.016-.382.108-.506.112-.112.248-.289.372-.434.124-.145.165-.248.248-.413.083-.165.041-.31-.021-.434-.062-.124-.559-1.347-.765-1.844-.201-.484-.405-.418-.558-.426-.145-.008-.31-.01-.475-.01s-.434.062-.661.31c-.228.248-.868.848-.868 2.068s.889 2.399 1.013 2.565c.124.165 1.749 2.671 4.238 3.746.592.256 1.054.409 1.415.524.595.189 1.137.162 1.565.098.478-.071 1.468-.6 1.675-1.178.207-.579.207-1.075.145-1.178-.062-.103-.227-.165-.475-.289z" />
                        </svg>
                        <span>WhatsApp</span>
                      </button>

                      {user?.role !== 'agent' && b.status === 'active' && (
                        <button
                          onClick={() => handleOpenCancel(b)}
                          className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                          title="Void / Cancel Bill"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CANCEL BILL MODAL */}
      {showCancelModal && billToCancel && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-rose-600 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Void Invoice: {billToCancel.invoiceNumber}</h3>
                <p className="text-xs text-rose-100">Restores items back to product stock</p>
              </div>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-white/80 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmCancel} className="p-5 space-y-4 text-xs">
              <p className="text-slate-600">
                Are you sure you want to cancel bill <strong className="font-mono">{billToCancel.invoiceNumber}</strong> for ₹{billToCancel.grandTotal}?
                All inventory quantities will automatically be reversed in stock ledgers.
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cancellation Reason</label>
                <textarea
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Customer cancelled order before leaving, payment gateway failed, double-billed"
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl h-20 outline-hidden"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 rounded-xl font-semibold text-slate-600 cursor-pointer"
                >
                  Keep Bill
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Confirm Void
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* THERMAL RECEIPT MODAL */}
      <ThermalReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        bill={selectedBill}
      />
    </div>
  );
};
