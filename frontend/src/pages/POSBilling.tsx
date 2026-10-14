import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  UserPlus,
  User,
  PauseCircle,
  PlayCircle,
  CreditCard,
  Banknote,
  QrCode,
  AlertTriangle,
  RotateCcw,
  Receipt,
  Check,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  Percent,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Product, Category, Customer, Bill, PaymentDetail } from '../types';
import { api } from '../services/api';
import { OverridePinModal } from '../components/common/OverridePinModal';
import { ThermalReceiptModal } from '../components/common/ThermalReceiptModal';
import { CartPanel } from '../components/pos/CartPanel';
import QRCode from 'qrcode';

export const POSBilling: React.FC = () => {
  const { user } = useAuth();
  const {
    items,
    customer,
    billDiscountType,
    billDiscountValue,
    summary,
    loadingSummary,
    addItem,
    removeItem,
    updateQuantity,
    updateItemRate,
    setCustomer,
    setBillDiscount,
    clearCart,
    loadHeldCart,
  } = useCart();

  // Catalog state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);

  // Customer state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showCustomerModal, setShowCustomerModal] = useState<boolean>(false);
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [newCustomerForm, setNewCustomerForm] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  // Payment Drawer state
  const [showPaymentDrawer, setShowPaymentDrawer] = useState<boolean>(false);
  const [activePaymentMethod, setActivePaymentMethod] = useState<'cash' | 'upi'>('cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [upiQrDataUrl, setUpiQrDataUrl] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);

  // Held Bills state
  const [heldBills, setHeldBills] = useState<any[]>([]);
  const [showHeldModal, setShowHeldModal] = useState<boolean>(false);

  // Modals state
  const [overrideModalOpen, setOverrideModalOpen] = useState<boolean>(false);
  const [pendingOverrideItem, setPendingOverrideItem] = useState<{ product: Product; newRate?: number } | null>(null);
  const [completedBill, setCompletedBill] = useState<Bill | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [showMobileCart, setShowMobileCart] = useState<boolean>(false);

  // Load products & categories concurrently on mount
  useEffect(() => {
    Promise.allSettled([fetchCategories(), fetchProducts(), fetchHeldBills()]);
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.getCategories();
      if (res.success) setCategories(res.data);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await api.getProducts({ limit: 150, isActive: 'true' });
      if (res.success) setProducts(res.data);
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchHeldBills = async () => {
    try {
      const res = await api.getHeldBills();
      if (res.success) setHeldBills(res.data);
    } catch (err) {
      console.error('Failed to fetch held bills', err);
    }
  };

  const searchCustomers = async (query: string) => {
    setCustomerSearch(query);
    try {
      const res = await api.getCustomers({ search: query, limit: 10 });
      if (res.success) setCustomers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Generate UPI QR code dynamically when UPI is selected
  useEffect(() => {
    if (activePaymentMethod === 'upi' && summary?.grandTotal) {
      const upiUrl = `upi://pay?pa=vijayanursery@sbi&pn=Vijaya%20Nursery&am=${summary.grandTotal}&cu=INR&tn=Invoice%20Payment`;
      QRCode.toDataURL(upiUrl, { width: 180, margin: 1 })
        .then((url) => setUpiQrDataUrl(url))
        .catch(console.error);
    }
  }, [activePaymentMethod, summary?.grandTotal]);

  // Compute count of low stock items (< 10)
  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.currentStock < (p.lowStockThreshold || 10)).length;
  }, [products]);

  // Filter products by category and search
  const filteredProducts = products.filter((p) => {
    const matchesCat =
      selectedCategory === 'all'
        ? true
        : selectedCategory === 'low_stock'
        ? p.currentStock < (p.lowStockThreshold || 10)
        : (typeof p.category === 'object' ? p.category._id === selectedCategory : p.category === selectedCategory);

    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCat;

    const matchesQuery =
      p.name.toLowerCase().includes(q) ||
      (p.localName && p.localName.toLowerCase().includes(q)) ||
      (p.botanicalName && p.botanicalName.toLowerCase().includes(q)) ||
      p.sku.toLowerCase().includes(q);

    return matchesCat && matchesQuery;
  });

  const handleProductClick = (product: Product) => {
    if (product.currentStock <= 0) {
      // Require override
      setPendingOverrideItem({ product });
      setOverrideModalOpen(true);
      return;
    }
    addItem(product, 1);
  };

  const handleOverrideSuccess = (reason: string) => {
    if (pendingOverrideItem) {
      addItem(pendingOverrideItem.product, 1);
    }
    setPendingOverrideItem(null);
  };

  const handleHoldBill = async () => {
    if (items.length === 0) return;
    try {
      await api.holdBill({
        items,
        subtotal: summary?.subtotal || 0,
        customerId: customer?._id,
        customerName: customer?.name,
        customerPhone: customer?.phone,
      });
      clearCart();
      fetchHeldBills();
    } catch (err: any) {
      alert(err.message || 'Failed to hold bill');
    }
  };

  const handleResumeHeldBill = async (held: any) => {
    loadHeldCart(held.items, held.customer);
    await api.deleteHeldBill(held._id);
    fetchHeldBills();
    setShowHeldModal(false);
  };

  const handleCheckout = async () => {
    if (items.length === 0 || !summary) return;

    setIsCheckingOut(true);
    try {
      const grandTotal = summary.grandTotal;
      const tendered = parseFloat(cashTendered) || grandTotal;
      const changeAmount = activePaymentMethod === 'cash' ? Math.max(0, tendered - grandTotal) : 0;

      const payments: PaymentDetail[] = [
        {
          method: activePaymentMethod,
          amount: grandTotal,
          receivedAmount: activePaymentMethod === 'cash' ? tendered : grandTotal,
          changeAmount,
          referenceId: paymentReference || undefined,
        },
      ];

      const payload = {
        customerId: customer?._id,
        customerName: customer?.name,
        customerPhone: customer?.phone,
        customerGstin: customer?.gstin,
        customerState: customer?.state || 'Andhra Pradesh',
        billType: 'tax_invoice',
        items: items.map((i) => ({
          productId: i.product._id,
          quantity: i.quantity,
          rate: i.rate,
          discountType: i.discountType,
          discountValue: i.discountValue,
          overrideApplied: i.overrideApplied,
          overrideReason: i.overrideReason,
        })),
        billDiscountType,
        billDiscountValue,
        payments,
        idempotencyKey: 'IDEMP_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      };

      const res = await api.createBill(payload);
      if (res.success && res.data) {
        setCompletedBill(res.data);
        setShowPaymentDrawer(false);
        setShowReceiptModal(true);
        clearCart();
        fetchProducts(); // Refresh stock
      }
    } catch (err: any) {
      alert(err.message || 'Checkout failed');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleQuickCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createCustomer({
        name: newCustName,
        phone: newCustPhone,
        state: 'Andhra Pradesh',
      });
      if (res.success && res.data) {
        setCustomer(res.data);
        setShowCustomerModal(false);
        setNewCustomerForm(false);
        setNewCustName('');
        setNewCustPhone('');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create customer');
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full md:h-[calc(100vh-4rem)] bg-slate-100 overflow-hidden select-none relative">
      {/* LEFT: Products Catalog */}
      <div className="flex-1 flex flex-col p-2.5 sm:p-4 space-y-3 sm:space-y-4 overflow-y-auto md:overflow-hidden border-r border-slate-200 pb-32 md:pb-4">
        {/* Search Bar & Categories Header */}
        <div className="bg-white p-3 rounded-2xl shadow-xs border border-slate-200/80 space-y-3">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plants by name, Telugu name (మామిడి), botanical name, or SKU..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden font-medium placeholder:text-slate-400"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Plants & Items
            </button>
            <button
              onClick={() => setSelectedCategory('low_stock')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1.5 ${
                selectedCategory === 'low_stock'
                  ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-300'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Low Stock &lt; 10 ({lowStockCount})</span>
            </button>
            {categories.map((c) => (
              <button
                key={c._id}
                onClick={() => setSelectedCategory(c._id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === c._id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {loadingProducts ? (
            <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
              Loading inventory catalog...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <ShoppingBag className="w-12 h-12 stroke-1 mb-2 text-slate-300" />
              <p className="text-sm font-medium">No plants found matching query</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-2 text-xs text-emerald-600 hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.currentStock <= 0;
                const isLowStock =
                  product.currentStock > 0 && product.currentStock < (product.lowStockThreshold || 10);

                return (
                  <div
                    key={product._id}
                    onClick={() => handleProductClick(product)}
                    className={`bg-white rounded-2xl p-3.5 border transition-all cursor-pointer group flex flex-col justify-between hover:shadow-md ${
                      isOutOfStock
                        ? 'border-rose-200 bg-rose-50/20 opacity-80'
                        : isLowStock
                        ? 'border-amber-200 hover:border-amber-400'
                        : 'border-slate-200/90 hover:border-emerald-500'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {product.sku}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-700'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {product.currentStock} {product.unit}
                        </span>
                      </div>

                      {/* Plant Names */}
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-emerald-700 transition-colors">
                        {product.name}
                      </h4>
                      {product.localName && (
                        <p className="text-[11px] text-emerald-700 font-medium truncate mt-0.5">
                          {product.localName}
                        </p>
                      )}
                      {product.botanicalName && (
                        <p className="text-[10px] text-slate-400 italic truncate">
                          {product.botanicalName}
                        </p>
                      )}
                    </div>

                    {/* Bottom Price & Tax */}
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-extrabold text-slate-900">
                          ₹{product.sellingPrice}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {product.gstRate > 0 ? `+${product.gstRate}% GST` : '0% GST'}
                        </div>
                      </div>
                      <button className="w-7 h-7 rounded-xl bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white text-slate-600 flex items-center justify-center transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Active Cart & Billing Terminal (Desktop) */}
      <div className="hidden md:flex w-[360px] lg:w-[420px] bg-white flex-col h-full shadow-lg border-l border-slate-200 shrink-0">
        <CartPanel
          heldCount={heldBills.length}
          onHoldBill={handleHoldBill}
          onOpenHeldModal={() => setShowHeldModal(true)}
          onOpenCustomerModal={() => {
            setShowCustomerModal(true);
            searchCustomers('');
          }}
          onOpenPaymentDrawer={() => setShowPaymentDrawer(true)}
          onRequestRateOverride={(product, rate) => {
            setPendingOverrideItem({ product, newRate: rate });
            setOverrideModalOpen(true);
          }}
        />
      </div>

      {/* MOBILE: Floating Cart Bottom Action Bar (Shows when items in cart) */}
      {items.length > 0 && (
        <div className="md:hidden fixed bottom-18 left-3 right-3 z-30 pointer-events-auto animate-in slide-in-from-bottom-2 duration-150">
          <button
            onClick={() => setShowMobileCart(true)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white py-3.5 px-4 rounded-2xl shadow-xl shadow-emerald-950/40 flex items-center justify-between transition-all border border-emerald-400/30"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-black">
                {items.reduce((sum, it) => sum + it.quantity, 0)}
              </div>
              <span className="text-sm font-bold tracking-tight">View Active Cart</span>
            </div>
            <div className="flex items-center space-x-1.5 font-black text-base font-mono">
              <span>₹{summary ? summary.grandTotal.toFixed(2) : '0.00'}</span>
              <ChevronRight className="w-5 h-5" />
            </div>
          </button>
        </div>
      )}

      {/* MOBILE: Full-Screen Cart Sheet Modal */}
      {showMobileCart && (
        <div className="md:hidden fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom duration-200">
          <CartPanel
            heldCount={heldBills.length}
            onHoldBill={() => {
              handleHoldBill();
              setShowMobileCart(false);
            }}
            onOpenHeldModal={() => {
              setShowMobileCart(false);
              setShowHeldModal(true);
            }}
            onOpenCustomerModal={() => {
              setShowCustomerModal(true);
              searchCustomers('');
            }}
            onOpenPaymentDrawer={() => {
              setShowMobileCart(false);
              setShowPaymentDrawer(true);
            }}
            onRequestRateOverride={(product, rate) => {
              setPendingOverrideItem({ product, newRate: rate });
              setOverrideModalOpen(true);
            }}
            isMobileDrawer={true}
            onCloseMobileDrawer={() => setShowMobileCart(false)}
          />
        </div>
      )}

      {/* PAYMENT DRAWER / MODAL */}
      {showPaymentDrawer && summary && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-base">Payment & Checkout</h3>
                <p className="text-xs text-slate-400">Total Due: ₹{summary.grandTotal.toFixed(2)}</p>
              </div>
              <button
                onClick={() => setShowPaymentDrawer(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
              {/* Payment Methods */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Payment Method (Cash or UPI Only)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setActivePaymentMethod('cash')}
                    className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-1.5 ${
                      activePaymentMethod === 'cash'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold shadow-xs ring-2 ring-emerald-400'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-6 h-6 text-emerald-600" />
                    <span className="text-xs font-bold">💵 Cash</span>
                  </button>

                  <button
                    onClick={() => setActivePaymentMethod('upi')}
                    className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-1.5 ${
                      activePaymentMethod === 'upi'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold shadow-xs ring-2 ring-emerald-400'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <QrCode className="w-6 h-6 text-blue-600" />
                    <span className="text-xs font-bold">📱 UPI QR</span>
                  </button>
                </div>
              </div>

              {/* Conditional Payment UI */}
              {activePaymentMethod === 'cash' && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Cash Tendered by Customer (₹)
                    </label>
                    <input
                      type="number"
                      autoFocus
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      placeholder={summary.grandTotal.toString()}
                      className="w-full text-xl font-bold font-mono py-2 px-3 bg-white border border-slate-300 rounded-xl"
                    />
                  </div>

                  {parseFloat(cashTendered) > summary.grandTotal && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex justify-between items-center text-emerald-800">
                      <span className="text-xs font-bold">Return Change to Customer:</span>
                      <span className="text-lg font-mono font-black">
                        ₹{(parseFloat(cashTendered) - summary.grandTotal).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {activePaymentMethod === 'upi' && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center space-y-2">
                  <p className="text-xs font-bold text-slate-700">Scan UPI QR with PhonePe / GPay / Paytm</p>
                  {upiQrDataUrl && (
                    <img
                      src={upiQrDataUrl}
                      alt="UPI QR Code"
                      className="mx-auto w-40 h-40 bg-white p-2 rounded-xl shadow-xs border border-slate-200"
                    />
                  )}
                  <p className="text-[11px] font-mono text-slate-500">VPA: vijayanursery@sbi</p>
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isCheckingOut ? 'Generating Invoice...' : `Complete Sale (₹${summary.grandTotal})`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER SELECT / CREATE MODAL */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm">Select Registered Customer</h3>
              <button onClick={() => setShowCustomerModal(false)} className="text-slate-400 p-1">
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              {!newCustomerForm ? (
                <>
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => searchCustomers(e.target.value)}
                    placeholder="Search by customer name or phone..."
                    className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-hidden"
                  />

                  <div className="max-h-60 overflow-y-auto space-y-1.5">
                    {customers.map((c) => (
                      <div
                        key={c._id}
                        onClick={() => {
                          setCustomer(c);
                          setShowCustomerModal(false);
                        }}
                        className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all cursor-pointer flex justify-between items-center"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-800">{c.name}</div>
                          <div className="text-[11px] text-slate-500">{c.phone}</div>
                        </div>
                        {c.currentBalance > 0 && (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            Due: ₹{c.currentBalance}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setNewCustomerForm(true)}
                    className="w-full py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
                  >
                    + Register New Customer
                  </button>
                </>
              ) : (
                <form onSubmit={handleQuickCreateCustomer} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      placeholder="e.g. Ramesh Naidu"
                      className="w-full text-xs py-2 px-3 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                      placeholder="e.g. 9848011223"
                      className="w-full text-xs py-2 px-3 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div className="flex space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setNewCustomerForm(false)}
                      className="flex-1 py-2 text-xs bg-slate-100 rounded-xl"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 text-xs bg-emerald-600 text-white font-bold rounded-xl"
                    >
                      Save & Select
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HELD BILLS MODAL */}
      {showHeldModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm">Parked / Held Bills ({heldBills.length})</h3>
              <button onClick={() => setShowHeldModal(false)} className="text-slate-400 p-1">
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {heldBills.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-6">No held bills parked</p>
              ) : (
                heldBills.map((h) => (
                  <div
                    key={h._id}
                    className="p-3 border border-slate-200 rounded-xl flex justify-between items-center bg-slate-50"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        {h.customerName || 'Walk-in'} (₹{h.subtotal})
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {h.items.length} items • Held by {h.agentName}
                      </div>
                    </div>
                    <button
                      onClick={() => handleResumeHeldBill(h)}
                      className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
                    >
                      Resume
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* OVERRIDE PIN MODAL */}
      <OverridePinModal
        isOpen={overrideModalOpen}
        onClose={() => {
          setOverrideModalOpen(false);
          setPendingOverrideItem(null);
        }}
        onSuccess={handleOverrideSuccess}
        title="Zero Stock Override"
        description={`Product "${pendingOverrideItem?.product.name}" has 0 stock in system. Enter manager PIN to authorize counter bypass.`}
      />

      {/* THERMAL RECEIPT MODAL */}
      <ThermalReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        bill={completedBill}
      />
    </div>
  );
};
