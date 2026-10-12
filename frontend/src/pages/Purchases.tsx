import React, { useState, useEffect } from 'react';
import { Truck, Plus, Search, Building2, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { Product } from '../types';

export const Purchases: React.FC = () => {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [showInwardModal, setShowInwardModal] = useState<boolean>(false);
  const [showSupplierModal, setShowSupplierModal] = useState<boolean>(false);

  // Inward Form
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState<string>('');
  const [inwardItems, setInwardItems] = useState<any[]>([
    { productId: '', quantity: 10, costPrice: 50 },
  ]);

  // New Supplier Form
  const [newSup, setNewSup] = useState<any>({
    name: '',
    phone: '',
    city: 'Vissannapeta',
    state: 'Andhra Pradesh',
    gstin: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [purRes, supRes, prodRes] = await Promise.all([
        api.getPurchases(),
        api.getSuppliers(),
        api.getProducts({ limit: 100 }),
      ]);
      if (purRes.success) setPurchases(purRes.data);
      if (supRes.success) {
        setSuppliers(supRes.data);
        if (supRes.data.length > 0) setSelectedSupplier(supRes.data[0]._id);
      }
      if (prodRes.success) setProducts(prodRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddInwardRow = () => {
    setInwardItems([...inwardItems, { productId: products[0]?._id || '', quantity: 10, costPrice: 50 }]);
  };

  const handleUpdateInwardRow = (idx: number, field: string, value: any) => {
    const copy = [...inwardItems];
    copy[idx][field] = value;
    setInwardItems(copy);
  };

  const handleRemoveInwardRow = (idx: number) => {
    setInwardItems(inwardItems.filter((_, i) => i !== idx));
  };

  const handleSubmitInward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) {
      alert('Please select a supplier');
      return;
    }
    try {
      const payload = {
        supplierId: selectedSupplier,
        supplierInvoiceNumber: supplierInvoiceNo,
        items: inwardItems.map((it) => ({
          productId: it.productId || products[0]?._id,
          quantity: parseInt(it.quantity) || 1,
          costPrice: parseFloat(it.costPrice) || 0,
        })),
      };

      const res = await api.createPurchase(payload);
      if (res.success) {
        setShowInwardModal(false);
        setSupplierInvoiceNo('');
        loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Inward recording failed');
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createSupplier(newSup);
      if (res.success) {
        setShowSupplierModal(false);
        setNewSup({ name: '', phone: '', city: 'Vissannapeta', state: 'Andhra Pradesh', gstin: '' });
        loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to add supplier');
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center space-x-2">
            <Truck className="w-6 h-6 text-emerald-600" />
            <span>Purchases & Nursery Stock Inward</span>
          </h2>
          <p className="text-xs text-slate-500">
            Record wholesale plant purchases, seed arrivals, potteries, and stock inward vouchers
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowSupplierModal(true)}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-white border border-slate-300 hover:border-emerald-500 text-slate-700 font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer text-center"
          >
            + Add Supplier
          </button>
          <button
            onClick={() => setShowInwardModal(true)}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Inward Stock / PO</span>
          </button>
        </div>
      </div>

      {/* Supplier List Chips */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="text-xs font-bold text-slate-700 mb-2">Registered Nursery Suppliers:</div>
        <div className="flex flex-wrap gap-2">
          {suppliers.map((s) => (
            <div
              key={s._id}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center space-x-2"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-800">{s.name}</span>
              <span className="text-slate-400 text-[10px]">({s.city})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Purchases Inward List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[650px]">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">PO / Voucher No</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Supplier Firm</th>
                <th className="py-3 px-4">Supplier Invoice</th>
                <th className="py-3 px-4 text-right">Items Inwarded</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Loading purchase history...
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No purchase inward vouchers recorded yet.
                  </td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {p.purchaseNumber}
                    </td>

                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(p.purchaseDate).toLocaleDateString('en-IN')}
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {p.supplierName}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600">
                      {p.supplierInvoiceNumber || '-'}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      {p.items?.reduce((acc: number, it: any) => acc + (it.quantity || 0), 0)} units
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{p.grandTotal}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="inline-block font-bold text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW INWARD / PURCHASE MODAL */}
      {showInwardModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Inward Stock from Supplier</h3>
                <p className="text-xs text-slate-400">Automatically increments live plant inventory</p>
              </div>
              <button onClick={() => setShowInwardModal(false)} className="text-slate-400 p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitInward} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Supplier</label>
                  <select
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl"
                  >
                    {suppliers.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Supplier Bill / DC Number</label>
                  <input
                    type="text"
                    value={supplierInvoiceNo}
                    onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                    placeholder="e.g. INV-9872"
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* Items Rows */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Inward Line Items
                  </label>
                  <button
                    type="button"
                    onClick={handleAddInwardRow}
                    className="text-xs text-emerald-700 font-bold hover:underline"
                  >
                    + Add Item Row
                  </button>
                </div>

                <div className="space-y-2">
                  {inwardItems.map((row, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap sm:flex-nowrap items-center gap-2">
                      <select
                        value={row.productId}
                        onChange={(e) => handleUpdateInwardRow(idx, 'productId', e.target.value)}
                        className="w-full sm:flex-1 py-1.5 px-2 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="">Select Plant / Item...</option>
                        {products.map((pr) => (
                          <option key={pr._id} value={pr._id}>
                            {pr.name} ({pr.sku})
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={row.quantity}
                          onChange={(e) => handleUpdateInwardRow(idx, 'quantity', e.target.value)}
                          className="flex-1 sm:w-20 py-1.5 px-2 border border-slate-300 rounded-lg bg-white font-mono text-right"
                        />

                        <input
                          type="number"
                          min="0"
                          placeholder="Cost"
                          value={row.costPrice}
                          onChange={(e) => handleUpdateInwardRow(idx, 'costPrice', e.target.value)}
                          className="flex-1 sm:w-24 py-1.5 px-2 border border-slate-300 rounded-lg bg-white font-mono text-right"
                        />

                        <button
                          type="button"
                          onClick={() => handleRemoveInwardRow(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowInwardModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 rounded-xl font-semibold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Confirm Inward & Increment Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW SUPPLIER MODAL */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <h3 className="font-bold text-sm">Register Nursery Supplier</h3>
              <button onClick={() => setShowSupplierModal(false)} className="text-slate-400 p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="p-4 sm:p-5 space-y-3.5 text-xs overflow-y-auto">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Supplier Nursery / Firm</label>
                <input
                  type="text"
                  required
                  value={newSup.name}
                  onChange={(e) => setNewSup({ ...newSup, name: e.target.value })}
                  placeholder="e.g. Godavari Planters Wholesale"
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newSup.phone}
                  onChange={(e) => setNewSup({ ...newSup, phone: e.target.value })}
                  placeholder="9440123456"
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={newSup.city}
                    onChange={(e) => setNewSup({ ...newSup, city: e.target.value })}
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={newSup.state}
                    onChange={(e) => setNewSup({ ...newSup, state: e.target.value })}
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">GSTIN (Optional)</label>
                <input
                  type="text"
                  value={newSup.gstin}
                  onChange={(e) => setNewSup({ ...newSup, gstin: e.target.value.toUpperCase() })}
                  placeholder="37AAACK1122P1Z0"
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl uppercase font-mono"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 rounded-xl font-semibold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
