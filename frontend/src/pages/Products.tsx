import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  History,
  SlidersHorizontal,
  X,
  Check,
  TrendingDown,
  TrendingUp,
  Tag,
} from 'lucide-react';
import { api } from '../services/api';
import { Product, Category } from '../types';
import { useAuth } from '../context/AuthContext';

export const Products: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [stockStatusFilter, setStockStatusFilter] = useState<string>('');

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showAdjustModal, setShowAdjustModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockHistory, setStockHistory] = useState<any[]>([]);

  // Adjustment Form
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustType, setAdjustType] = useState<string>('adjustment_in');
  const [adjustReason, setAdjustReason] = useState<string>('');

  // New Product Form
  const [newProd, setNewProd] = useState<any>({
    name: '',
    localName: '',
    botanicalName: '',
    sku: '',
    category: '',
    unit: 'piece',
    hsn: '0602',
    gstRate: 0,
    costPrice: 0,
    sellingPrice: 0,
    openingStock: 0,
    lowStockThreshold: 15,
    location: '',
  });

  useEffect(() => {
    loadData();
  }, [categoryFilter, stockStatusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, sumRes] = await Promise.all([
        api.getProducts({
          search,
          category: categoryFilter,
          stockStatus: stockStatusFilter,
          limit: 100,
        }),
        api.getCategories(),
        api.getInventorySummary(),
      ]);

      if (prodRes.success) setProducts(prodRes.data);
      if (catRes.success) {
        setCategories(catRes.data);
        if (!newProd.category && catRes.data.length > 0) {
          setNewProd((p: any) => ({ ...p, category: catRes.data[0]._id }));
        }
      }
      if (sumRes.success) setSummary(sumRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenAdjust = (p: Product) => {
    setSelectedProduct(p);
    setAdjustQty(1);
    setAdjustType('adjustment_in');
    setAdjustReason('');
    setShowAdjustModal(true);
  };

  const handleSubmitAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      await api.adjustStock(selectedProduct._id, {
        quantity: adjustQty,
        type: adjustType,
        reason: adjustReason || 'Inventory stock correction',
      });
      setShowAdjustModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Stock adjustment failed');
    }
  };

  const handleOpenHistory = async (p: Product) => {
    setSelectedProduct(p);
    setShowHistoryModal(true);
    try {
      const res = await api.getStockHistory(p._id);
      if (res.success) setStockHistory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createProduct(newProd);
      if (res.success) {
        setShowAddModal(false);
        setNewProd({
          name: '',
          localName: '',
          botanicalName: '',
          sku: '',
          category: categories[0]?._id || '',
          unit: 'piece',
          hsn: '0602',
          gstRate: 0,
          costPrice: 0,
          sellingPrice: 0,
          openingStock: 0,
          lowStockThreshold: 15,
          location: '',
        });
        loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create plant');
    }
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center space-x-2">
            <Package className="w-6 h-6 text-emerald-600" />
            <span>Plants & Inventory Catalog</span>
          </h2>
          <p className="text-xs text-slate-500">
            Real-time nursery inventory, botanical specifications, and stock movements
          </p>
        </div>

        {user?.role !== 'agent' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 transition-colors cursor-pointer self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Plant / Item</span>
          </button>
        )}
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Products
            </div>
            <div className="text-2xl font-black text-slate-800 mt-1 font-mono">
              {summary.totalProducts}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">
              {summary.activeProducts} actively on sale
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs">
            <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
              Low Stock Alert
            </div>
            <div className="text-2xl font-black text-amber-800 mt-1 font-mono">
              {summary.lowStock}
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-1">
              Below threshold reorder level
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs">
            <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
              Out of Stock
            </div>
            <div className="text-2xl font-black text-rose-800 mt-1 font-mono">
              {summary.outOfStock}
            </div>
            <div className="text-[11px] text-rose-600 font-medium mt-1">Zero units available</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Retail Valuation
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">
              ₹{summary.stockValue?.toLocaleString('en-IN') || 0}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-1">Estimated catalog value</div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plant by name, Telugu name, botanical name, or SKU..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-hidden focus:border-emerald-500"
          />
        </form>

        <div className="flex space-x-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-hidden"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-hidden"
          >
            <option value="">All Stock Status</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Plant / Product Details</th>
                <th className="py-3 px-4">SKU / HSN</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                {user?.role !== 'agent' && <th className="py-3 px-4 text-right">Cost Price</th>}
                <th className="py-3 px-4 text-center">Stock Level</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Loading inventory catalog...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No plants found matching the selected filters.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isOutOfStock = p.currentStock <= 0;
                  const isLowStock =
                    p.currentStock > 0 && p.currentStock < (p.lowStockThreshold || 15);

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        {p.localName && (
                          <div className="text-[11px] text-emerald-700">{p.localName}</div>
                        )}
                        {p.botanicalName && (
                          <div className="text-[10px] text-slate-400 italic">
                            {p.botanicalName}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        <div>{p.sku}</div>
                        <div className="text-[10px] text-slate-400">HSN: {p.hsn}</div>
                      </td>

                      <td className="py-3 px-4 text-slate-700">
                        {typeof p.category === 'object' ? p.category.name : 'General'}
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                        ₹{p.sellingPrice}
                        <div className="text-[10px] text-slate-400 font-normal">
                          {p.gstRate > 0 ? `+${p.gstRate}% GST` : '0% GST'}
                        </div>
                      </td>

                      {user?.role !== 'agent' && (
                        <td className="py-3 px-4 text-right font-mono text-slate-500">
                          ₹{p.costPrice || 0}
                        </td>
                      )}

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block font-mono font-bold px-2 py-0.5 rounded-full text-[11px] ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-700'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {p.currentStock} {p.unit}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenAdjust(p)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Adjust
                        </button>
                        <button
                          onClick={() => handleOpenHistory(p)}
                          className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                          title="Stock Audit Ledger"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* STOCK ADJUSTMENT MODAL */}
      {showAdjustModal && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Adjust Stock</h3>
                <p className="text-xs text-slate-400">{selectedProduct.name}</p>
              </div>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitAdjustment} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Current Stock</label>
                <div className="text-base font-bold font-mono text-slate-800">
                  {selectedProduct.currentStock} {selectedProduct.unit}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Adjustment Type</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl"
                >
                  <option value="adjustment_in">+ Inward / Found Stock</option>
                  <option value="adjustment_out">- Manual Outward Correction</option>
                  <option value="damage">- Damaged / Broken Pot</option>
                  <option value="mortality">- Plant Mortality / Dried Plant</option>
                  <option value="theft">- Theft / Shortage</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseInt(e.target.value) || 1)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl font-mono text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason / Notes</label>
                <textarea
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Nursery physical count correction or heat damage"
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl h-20 outline-hidden"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 rounded-xl font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STOCK LEDGER HISTORY MODAL */}
      {showHistoryModal && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Stock Ledger Audit Trail</h3>
                <p className="text-xs text-slate-400">{selectedProduct.name}</p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {stockHistory.length === 0 ? (
                <p className="text-center py-6 text-slate-400 text-xs">
                  No stock history logged for this product.
                </p>
              ) : (
                stockHistory.map((h: any, i) => (
                  <div
                    key={i}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-800 capitalize">
                        {h.movementType || h.changeType}
                      </div>
                      <div className="text-[10px] text-slate-500">{h.notes || h.reason}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(h.createdAt).toLocaleString('en-IN')} by {h.userName || h.createdByName}
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <div
                        className={`font-bold ${
                          h.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {h.quantity > 0 ? `+${h.quantity}` : h.quantity}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {h.stockBefore} → {h.stockAfter}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD PLANT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-sm">Add New Plant / Nursery Item</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Common English Name</label>
                  <input
                    type="text"
                    required
                    value={newProd.name}
                    onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                    placeholder="e.g. Taiwan Guava"
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Telugu / Local Name</label>
                  <input
                    type="text"
                    value={newProd.localName}
                    onChange={(e) => setNewProd({ ...newProd, localName: e.target.value })}
                    placeholder="e.g. తైవాన్ జామ"
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Botanical Name</label>
                  <input
                    type="text"
                    value={newProd.botanicalName}
                    onChange={(e) => setNewProd({ ...newProd, botanicalName: e.target.value })}
                    placeholder="e.g. Psidium guajava"
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl italic"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newProd.category}
                    onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SKU / Item Code</label>
                  <input
                    type="text"
                    required
                    value={newProd.sku}
                    onChange={(e) => setNewProd({ ...newProd, sku: e.target.value })}
                    placeholder="PL-GVA-005"
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">HSN Code</label>
                  <input
                    type="text"
                    required
                    value={newProd.hsn}
                    onChange={(e) => setNewProd({ ...newProd, hsn: e.target.value })}
                    placeholder="0602"
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GST Rate (%)</label>
                  <select
                    value={newProd.gstRate}
                    onChange={(e) => setNewProd({ ...newProd, gstRate: parseInt(e.target.value) })}
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl font-mono"
                  >
                    <option value="0">0% (Live Plants)</option>
                    <option value="5">5% (Fertilizer/Soil)</option>
                    <option value="12">12% (Clay/Pots)</option>
                    <option value="18">18% (Tools/Plastic)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    value={newProd.costPrice}
                    onChange={(e) => setNewProd({ ...newProd, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={newProd.sellingPrice}
                    onChange={(e) => setNewProd({ ...newProd, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Opening Stock</label>
                  <input
                    type="number"
                    value={newProd.openingStock}
                    onChange={(e) => setNewProd({ ...newProd, openingStock: parseInt(e.target.value) || 0 })}
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
                  Create Plant Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
