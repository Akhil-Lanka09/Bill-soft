import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  CreditCard,
  Phone,
  FileText,
  DollarSign,
  TrendingUp,
  X,
  Check,
  Building,
} from 'lucide-react';
import { api } from '../services/api';
import { Customer } from '../types';

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [hasOutstandingOnly, setHasOutstandingOnly] = useState<boolean>(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showLedgerModal, setShowLedgerModal] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [ledgerData, setLedgerData] = useState<any>(null);

  // Payment Form
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'bank_transfer'>('cash');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  // New Customer Form
  const [newCust, setNewCust] = useState<any>({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: 'Rajahmundry',
    state: 'Andhra Pradesh',
    gstin: '',
    creditLimit: 20000,
    creditDays: 30,
    openingBalance: 0,
  });

  useEffect(() => {
    loadCustomers();
  }, [hasOutstandingOnly]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.getCustomers({
        search,
        hasOutstanding: hasOutstandingOnly ? 'true' : undefined,
        limit: 100,
      });
      if (res.success) setCustomers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadCustomers();
  };

  const handleOpenPayment = (c: Customer) => {
    setSelectedCustomer(c);
    setPaymentAmount(c.currentBalance || 0);
    setPaymentMethod('cash');
    setPaymentRef('');
    setPaymentNotes('');
    setShowPaymentModal(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    try {
      await api.recordCustomerPayment(selectedCustomer._id, {
        amount: paymentAmount,
        paymentMethod,
        referenceId: paymentRef,
        notes: paymentNotes,
      });
      setShowPaymentModal(false);
      loadCustomers();
    } catch (err: any) {
      alert(err.message || 'Payment recording failed');
    }
  };

  const handleOpenLedger = async (c: Customer) => {
    setSelectedCustomer(c);
    setShowLedgerModal(true);
    setLedgerData(null);
    try {
      const res = await api.getCustomerLedger(c._id);
      if (res.success) setLedgerData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createCustomer(newCust);
      if (res.success) {
        setShowAddModal(false);
        setNewCust({
          name: '',
          phone: '',
          email: '',
          address: '',
          city: 'Rajahmundry',
          state: 'Andhra Pradesh',
          gstin: '',
          creditLimit: 20000,
          creditDays: 30,
          openingBalance: 0,
        });
        loadCustomers();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create customer');
    }
  };

  const totalOutstanding = customers.reduce((acc, c) => acc + (c.currentBalance || 0), 0);
  const customersWithDebt = customers.filter((c) => c.currentBalance > 0).length;

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Header & Quick Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center space-x-2">
            <Users className="w-6 h-6 text-emerald-600" />
            <span>Customer Accounts & Credit Ledger</span>
          </h2>
          <p className="text-xs text-slate-500">
            Wholesale landscapers, garden maintenance contractors, and retail credit balances
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 transition-colors cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Customer</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Customers
          </div>
          <div className="text-2xl font-black text-slate-800 mt-1 font-mono">
            {customers.length}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Registered wholesale & retail buyers
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs">
          <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
            Total Outstanding Receivables
          </div>
          <div className="text-2xl font-black text-rose-700 mt-1 font-mono">
            ₹{totalOutstanding.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">
            {customersWithDebt} accounts with pending balance
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
            Total Lifetime Sales
          </div>
          <div className="text-2xl font-black text-emerald-800 mt-1 font-mono">
            ₹{customers.reduce((acc, c) => acc + (c.totalPurchases || 0), 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Cumulative client orders</div>
        </div>
      </div>

      {/* Search & Toggle Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, phone number, GSTIN, or city..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-hidden focus:border-emerald-500"
          />
        </form>

        <button
          onClick={() => setHasOutstandingOnly(!hasOutstandingOnly)}
          className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            hasOutstandingOnly
              ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold'
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          {hasOutstandingOnly ? '✓ Showing Outstanding Only' : 'Filter: Has Balance Due'}
        </button>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">City / State</th>
                <th className="py-3 px-4">GSTIN</th>
                <th className="py-3 px-4 text-right">Credit Limit</th>
                <th className="py-3 px-4 text-right">Current Balance</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Loading customer accounts...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No customers found matching search.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{c.name}</div>
                      {c.address && (
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">{c.address}</div>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-700">{c.phone}</td>

                    <td className="py-3 px-4 text-slate-600">
                      {c.city || '-'}, {c.state}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {c.gstin || <span className="text-slate-300">-</span>}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      ₹{c.creditLimit?.toLocaleString('en-IN') || 0}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span
                        className={`font-mono font-bold text-xs ${
                          c.currentBalance > 0 ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        ₹{c.currentBalance?.toLocaleString('en-IN') || 0}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right space-x-1">
                      {c.currentBalance > 0 && (
                        <button
                          onClick={() => handleOpenPayment(c)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold cursor-pointer border border-emerald-200"
                        >
                          Receive Payment
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenLedger(c)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer inline-flex items-center space-x-1"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span>Ledger</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD PAYMENT MODAL */}
      {showPaymentModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Receive Customer Payment</h3>
                <p className="text-xs text-slate-400">{selectedCustomer.name}</p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex justify-between items-center text-rose-800">
                <span className="font-semibold">Current Balance Due:</span>
                <span className="text-base font-black font-mono">
                  ₹{selectedCustomer.currentBalance}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Payment Amount Received (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full text-lg font-bold font-mono py-2 px-3 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Mode</label>
                <select
                  value={paymentMethod}
                  onChange={(e: any) => setPaymentMethod(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl"
                >
                  <option value="cash">Cash Received at Counter</option>
                  <option value="upi">UPI / QR Transfer</option>
                  <option value="bank_transfer">Direct Bank NEFT/RTGS</option>
                  <option value="card">Card Swipe</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Transaction / Reference ID
                </label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. UTR / UPI Ref ID / Cheque No"
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Remarks</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Clearance towards invoice balance"
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 rounded-xl font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Confirm Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STATEMENT OF ACCOUNT / RUNNING LEDGER DRAWER */}
      {showLedgerModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Statement of Account (Running Ledger)</h3>
                <p className="text-xs text-slate-400">
                  {selectedCustomer.name} • {selectedCustomer.phone}
                </p>
              </div>
              <button onClick={() => setShowLedgerModal(false)} className="text-slate-400 p-1">
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-mono">
              <div>
                <span className="text-slate-500">Credit Limit:</span>{' '}
                <span className="font-bold">₹{selectedCustomer.creditLimit}</span>
              </div>
              <div>
                <span className="text-slate-500">Net Outstanding:</span>{' '}
                <span className="font-black text-rose-600 text-sm">
                  ₹{selectedCustomer.currentBalance}
                </span>
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              {!ledgerData ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Loading statement of account...
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 uppercase font-semibold text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Description / Ref</th>
                      <th className="py-2.5 px-3 text-right">Debit (Sales)</th>
                      <th className="py-2.5 px-3 text-right">Credit (Receipts)</th>
                      <th className="py-2.5 px-3 text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {ledgerData.entries.map((entry: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-slate-500 text-[11px]">
                          {new Date(entry.date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="py-2 px-3 text-slate-800 font-sans font-medium text-[11px]">
                          {entry.description}
                        </td>
                        <td className="py-2 px-3 text-right text-rose-600 font-bold">
                          {entry.debit > 0 ? `₹${entry.debit}` : '-'}
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-600 font-bold">
                          {entry.credit > 0 ? `₹${entry.credit}` : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-black text-slate-900">
                          ₹{entry.runningBalance}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD CUSTOMER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-sm">Register New Customer</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-6 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer / Firm Name</label>
                  <input
                    type="text"
                    required
                    value={newCust.name}
                    onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
                    placeholder="e.g. Srinivasa Landscapes"
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={newCust.phone}
                    onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
                    placeholder="9848011223"
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GSTIN (Optional)</label>
                  <input
                    type="text"
                    value={newCust.gstin}
                    onChange={(e) => setNewCust({ ...newCust, gstin: e.target.value.toUpperCase() })}
                    placeholder="37AABCS1234F1Z1"
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={newCust.email}
                    onChange={(e) => setNewCust({ ...newCust, email: e.target.value })}
                    placeholder="client@gmail.com"
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={newCust.address}
                  onChange={(e) => setNewCust({ ...newCust, address: e.target.value })}
                  placeholder="Street / Area / Landmark"
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={newCust.creditLimit}
                    onChange={(e) => setNewCust({ ...newCust, creditLimit: parseFloat(e.target.value) || 0 })}
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Credit Days</label>
                  <input
                    type="number"
                    value={newCust.creditDays}
                    onChange={(e) => setNewCust({ ...newCust, creditDays: parseInt(e.target.value) || 0 })}
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Opening Bal (₹)</label>
                  <input
                    type="number"
                    value={newCust.openingBalance}
                    onChange={(e) => setNewCust({ ...newCust, openingBalance: parseFloat(e.target.value) || 0 })}
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 rounded-xl font-semibold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Register Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
