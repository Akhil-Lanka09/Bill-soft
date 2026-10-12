import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  FileSpreadsheet,
  DollarSign,
  TrendingUp,
  Receipt,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';

export const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sales' | 'gstr1' | 'closing' | 'valuation'>('sales');

  // Sales State
  const [salesData, setSalesData] = useState<any>(null);
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState<boolean>(true);

  // GSTR-1 State
  const [gstr1Data, setGstr1Data] = useState<any>(null);

  // Daily Closing State
  const [closingData, setClosingData] = useState<any>(null);
  const [actualCashInput, setActualCashInput] = useState<string>('');
  const [varianceReason, setVarianceReason] = useState<string>('');
  const [closingSubmitted, setClosingSubmitted] = useState<boolean>(false);

  // Inventory Valuation State
  const [valuationData, setValuationData] = useState<any>(null);

  useEffect(() => {
    loadActiveReport();
  }, [activeTab]);

  const loadActiveReport = async () => {
    setLoading(true);
    try {
      if (activeTab === 'sales') {
        const res = await api.getSalesReport(startDate, endDate);
        if (res.success) setSalesData(res.data);
      } else if (activeTab === 'gstr1') {
        const res = await api.getGSTR1(startDate, endDate);
        if (res.success) setGstr1Data(res.data);
      } else if (activeTab === 'closing') {
        const res = await api.getDailyClosing();
        if (res.success) {
          setClosingData(res.data);
          setActualCashInput(res.data.expectedCash?.toString() || '');
        }
      } else if (activeTab === 'valuation') {
        const res = await api.getInventoryValuation();
        if (res.success) setValuationData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyDateFilter = (e: React.FormEvent) => {
    e.preventDefault();
    loadActiveReport();
  };

  const handleSubmitClosing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closingData) return;
    const actual = parseFloat(actualCashInput) || 0;
    const diff = actual - closingData.expectedCash;

    try {
      await api.submitDailyClosing({
        date: closingData.date,
        openingCash: 0,
        cashSales: closingData.cashSales,
        upiSales: closingData.upiSales,
        cardSales: closingData.cardSales,
        bankSales: closingData.bankSales,
        creditSales: closingData.creditSales,
        totalSales: closingData.totalSales,
        expenses: closingData.expenses,
        returns: closingData.returns,
        expectedCash: closingData.expectedCash,
        actualCash: actual,
        difference: diff,
        differenceReason: varianceReason,
        totalBills: closingData.totalBills,
        totalItems: closingData.totalItems,
      });
      setClosingSubmitted(true);
      alert('Day-end cash closing recorded successfully');
    } catch (err: any) {
      alert(err.message || 'Closing submission failed');
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
            <span>Reports, GST Filings & Day-End Closing</span>
          </h2>
          <p className="text-xs text-slate-500">
            GST GSTR-1 summaries, revenue trends, inventory valuation, and cash drawer reconciliations
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex overflow-x-auto max-w-full bg-slate-200/80 p-1 rounded-xl text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'sales' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sales Trends
          </button>
          <button
            onClick={() => setActiveTab('gstr1')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'gstr1' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            GSTR-1 Tax Return
          </button>
          <button
            onClick={() => setActiveTab('closing')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'closing' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Day-End Closing
          </button>
          <button
            onClick={() => setActiveTab('valuation')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'valuation' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Stock Valuation
          </button>
        </div>
      </div>

      {/* Date Filter (Applicable for Sales & GSTR-1) */}
      {(activeTab === 'sales' || activeTab === 'gstr1') && (
        <form
          onSubmit={handleApplyDateFilter}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs"
        >
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700">From Date:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="py-1.5 px-3 border border-slate-300 rounded-xl font-mono"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700">To Date:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="py-1.5 px-3 border border-slate-300 rounded-xl font-mono"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Filter Period
          </button>
        </form>
      )}

      {/* TAB 1: SALES & REVENUE */}
      {activeTab === 'sales' && (
        <div className="space-y-4">
          {salesData?.summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Gross Sales</div>
                <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
                  ₹{salesData.summary.grossSales?.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">{salesData.summary.totalBills} bills generated</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
                <div className="text-[11px] font-bold text-emerald-800 uppercase">Net Revenue</div>
                <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">
                  ₹{salesData.summary.netSales?.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-emerald-600 mt-1">Discounts: -₹{salesData.summary.totalDiscount}</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-[11px] font-bold text-slate-400 uppercase">GST Tax Collected</div>
                <div className="text-2xl font-black text-slate-800 mt-1 font-mono">
                  ₹{salesData.summary.taxAmount?.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">CGST + SGST Output Tax</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-blue-200 bg-blue-50/20 shadow-xs">
                <div className="text-[11px] font-bold text-blue-800 uppercase">UPI / QR Collections</div>
                <div className="text-2xl font-black text-blue-700 mt-1 font-mono">
                  ₹{salesData.summary.paymentTotals?.upi?.toLocaleString('en-IN') || 0}
                </div>
                <div className="text-[11px] text-blue-600 mt-1">Digital payments share</div>
              </div>
            </div>
          )}

          {/* Daily Trends Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700">
              Daily Revenue Breakdown
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-500 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4 text-center">Bills Count</th>
                  <th className="py-2.5 px-4 text-right">Tax Collected</th>
                  <th className="py-2.5 px-4 text-right">Net Sales Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {salesData?.dailyTrends?.map((d: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-sans font-medium">{d.date}</td>
                    <td className="py-2.5 px-4 text-center">{d.count}</td>
                    <td className="py-2.5 px-4 text-right text-slate-600">₹{d.tax.toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-right font-black text-slate-900">₹{d.sales.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: GSTR-1 TAX REPORT */}
      {activeTab === 'gstr1' && (
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex justify-between items-center text-xs text-emerald-900">
            <div>
              <div className="font-bold text-sm">GSTR-1 GST Sales Summary</div>
              <div>
                Financial Year: <span className="font-mono font-bold">{gstr1Data?.financialYear || '2026-27'}</span> • B2B Invoices:{' '}
                <span className="font-bold">{gstr1Data?.b2bCount || 0}</span> • B2C Invoices:{' '}
                <span className="font-bold">{gstr1Data?.b2cCount || 0}</span>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-xl shadow-xs"
            >
              Export Printable GST Report
            </button>
          </div>

          {/* HSN Summary Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700">
              Table 12: HSN Summary of Outward Supplies
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-500 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">HSN Code</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4 text-right">Quantity</th>
                  <th className="py-2.5 px-4 text-right">Taxable Value</th>
                  <th className="py-2.5 px-4 text-right">CGST</th>
                  <th className="py-2.5 px-4 text-right">SGST</th>
                  <th className="py-2.5 px-4 text-right">Total Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {gstr1Data?.hsnSummary?.map((h: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-bold text-slate-900">{h.hsn}</td>
                    <td className="py-2.5 px-4 font-sans font-medium text-slate-700">{h.description}</td>
                    <td className="py-2.5 px-4 text-right">{h.quantity}</td>
                    <td className="py-2.5 px-4 text-right">₹{h.taxableValue.toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-right">₹{h.cgst.toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-right">₹{h.sgst.toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-right font-black text-slate-900">₹{h.totalValue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DAY-END CASH RECONCILIATION */}
      {activeTab === 'closing' && closingData && (
        <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
          <div className="bg-slate-900 text-white p-5">
            <h3 className="font-bold text-base">Day-End Counter Cash Reconciliation</h3>
            <p className="text-xs text-slate-400">
              Date: {new Date(closingData.date).toLocaleDateString('en-IN')} • Counter Register 01
            </p>
          </div>

          <form onSubmit={handleSubmitClosing} className="p-6 space-y-4 text-xs font-mono">
            <div className="space-y-2 pb-4 border-b border-slate-200 text-slate-700">
              <div className="flex justify-between">
                <span>Cash Sales Recorded:</span>
                <span className="font-bold">₹{closingData.cashSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>UPI / QR Sales:</span>
                <span className="text-blue-600 font-bold">₹{closingData.upiSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Expenses Paid from Drawer:</span>
                <span className="text-rose-600 font-bold">-₹{closingData.expenses.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-slate-200 text-slate-900 font-black">
                <span>Expected Cash in Drawer:</span>
                <span className="text-emerald-700">₹{closingData.expectedCash.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 font-sans">
                Physical Cash Counted in Drawer (₹)
              </label>
              <input
                type="number"
                required
                value={actualCashInput}
                onChange={(e) => setActualCashInput(e.target.value)}
                className="w-full text-xl font-bold py-2.5 px-3 border border-slate-300 rounded-xl"
              />
            </div>

            {parseFloat(actualCashInput) !== closingData.expectedCash && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1 font-sans">
                  Variance Explanation
                </label>
                <input
                  type="text"
                  value={varianceReason}
                  onChange={(e) => setVarianceReason(e.target.value)}
                  placeholder="Explain cash shortage or excess"
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl font-sans"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer font-sans"
            >
              Confirm Daily Register Closing
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: INVENTORY VALUATION */}
      {activeTab === 'valuation' && valuationData && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Total Nursery Cost</div>
              <div className="text-2xl font-black text-slate-800 mt-1 font-mono">
                ₹{valuationData.summary.totalCostValuation?.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Acquisition cost of plants & pots</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
              <div className="text-[11px] font-bold text-emerald-800 uppercase">Total Retail Potential</div>
              <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">
                ₹{valuationData.summary.totalSellingValuation?.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-emerald-600 mt-1">Full retail sale value</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-blue-200 bg-blue-50/20 shadow-xs">
              <div className="text-[11px] font-bold text-blue-800 uppercase">Gross Profit Margin Potential</div>
              <div className="text-2xl font-black text-blue-700 mt-1 font-mono">
                ₹{valuationData.summary.potentialProfit?.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-blue-600 mt-1">Estimated gross return</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
