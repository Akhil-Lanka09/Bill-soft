import React from 'react';
import {
  User,
  UserPlus,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Key,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  ChevronRight,
  X,
  ArrowLeft,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { Product } from '../../types';

interface CartPanelProps {
  heldCount: number;
  onHoldBill: () => void;
  onOpenHeldModal: () => void;
  onOpenCustomerModal: () => void;
  onOpenPaymentDrawer: () => void;
  onRequestRateOverride: (product: Product, currentRate: number) => void;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

export const CartPanel: React.FC<CartPanelProps> = ({
  heldCount,
  onHoldBill,
  onOpenHeldModal,
  onOpenCustomerModal,
  onOpenPaymentDrawer,
  onRequestRateOverride,
  isMobileDrawer = false,
  onCloseMobileDrawer,
}) => {
  const {
    items,
    customer,
    setCustomer,
    updateQuantity,
    removeItem,
    billDiscountType,
    billDiscountValue,
    setBillDiscount,
    summary,
    clearCart,
  } = useCart();

  return (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Mobile Drawer Top Header */}
      {isMobileDrawer && (
        <div className="md:hidden bg-slate-900 text-white p-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <button
              onClick={onCloseMobileDrawer}
              className="p-1 text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-sm">Active Cart ({items.length} items)</span>
          </div>
          <button
            onClick={onCloseMobileDrawer}
            className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Customer Header Bar */}
      <div className="p-3 sm:p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2.5 truncate">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="text-xs font-bold text-slate-800 truncate">
              {customer ? customer.name : 'Walk-in Customer'}
            </div>
            <div className="text-[10px] text-slate-500 truncate">
              {customer ? customer.phone : 'Standard retail cash sale'}
              {customer?.currentBalance ? (
                <span className="text-rose-600 font-bold ml-1">
                  (Due: ₹{customer.currentBalance})
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          {customer && (
            <button
              onClick={() => setCustomer(null)}
              className="text-[10px] text-slate-400 hover:text-rose-600 p-1"
              title="Switch to Walk-in"
            >
              Clear
            </button>
          )}
          <button
            onClick={onOpenCustomerModal}
            className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 hover:border-emerald-500 rounded-lg text-slate-700 transition-colors flex items-center space-x-1 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
            <span>{customer ? 'Change' : 'Select'}</span>
          </button>
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-2">
        {items.length === 0 ? (
          <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-slate-400 p-6 text-center select-none">
            <div className="w-16 h-16 rounded-full bg-white shadow-sm border border-emerald-500/30 p-1 flex items-center justify-center mb-3">
              <img
                src="/vijaya-nursery-logo.jpg"
                alt="Vijaya Plant Nursery"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <h5 className="text-xs font-black text-slate-700 tracking-wide mb-0.5">VIJAYA PLANT NURSERY</h5>
            <p className="text-[10px] text-amber-600 font-bold mb-1">SINCE 1982</p>
            <p className="text-[11px] text-slate-400 max-w-[200px] leading-relaxed">
              Tap plants from the catalog to start counter billing
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.product._id}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col space-y-1.5"
            >
              <div className="flex items-start justify-between">
                <div className="pr-2 min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-800 leading-tight truncate">
                    {item.product.name}
                  </div>
                  {item.product.localName && (
                    <div className="text-[10px] text-emerald-700 font-medium truncate">
                      {item.product.localName}
                    </div>
                  )}
                  {item.overrideApplied && (
                    <div className="text-[9px] text-amber-700 font-mono font-semibold flex items-center space-x-1 mt-0.5">
                      <Key className="w-2.5 h-2.5" />
                      <span>PIN Override Rate</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => removeItem(item.product._id)}
                  className="text-slate-300 hover:text-rose-500 p-1 transition-colors shrink-0"
                  title="Remove item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Controls & Price Row */}
              <div className="flex items-center justify-between pt-1">
                {/* Quantity Controls - Large touch targets for thumbs */}
                <div className="flex items-center space-x-1 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                  <button
                    onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                    className="w-7 h-7 rounded-md bg-white hover:bg-slate-200 flex items-center justify-center text-slate-700 shadow-xs transition-colors active:scale-95"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-xs font-bold font-mono">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                    className="w-7 h-7 rounded-md bg-white hover:bg-slate-200 flex items-center justify-center text-slate-700 shadow-xs transition-colors active:scale-95"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Rate & Total */}
                <div className="text-right">
                  <div className="text-xs font-black text-slate-800">
                    ₹{(item.rate * item.quantity).toFixed(2)}
                  </div>
                  <button
                    onClick={() => onRequestRateOverride(item.product, item.rate)}
                    className="text-[10px] text-slate-400 hover:text-emerald-700 underline font-mono cursor-pointer"
                  >
                    @ ₹{item.rate}/unit
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Footer Calculation & Actions */}
      <div className="p-3 sm:p-3.5 bg-slate-50 border-t border-slate-200 space-y-2.5 shrink-0 safe-area-bottom">
        {/* Bill Discount Row */}
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-600">Bill Discount:</span>
          <div className="flex items-center space-x-1.5">
            <input
              type="number"
              min="0"
              max="100"
              value={billDiscountValue || ''}
              onChange={(e) =>
                setBillDiscount(billDiscountType, parseFloat(e.target.value) || 0)
              }
              placeholder="0"
              className="w-14 text-right py-1 px-2 text-xs bg-white border border-slate-300 rounded-md font-mono"
            />
            <span className="text-slate-500 font-bold">%</span>
          </div>
        </div>

        {/* Totals Breakdown */}
        {summary && (
          <div className="space-y-1 text-xs pt-2 border-t border-slate-200 font-mono">
            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal:</span>
              <span>₹{summary.subtotal.toFixed(2)}</span>
            </div>
            {summary.billDiscountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Discount:</span>
                <span>-₹{summary.billDiscountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>GST Tax Total:</span>
              <span>₹{summary.totalTax.toFixed(2)}</span>
            </div>
            {summary.roundOff !== 0 && (
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Round Off:</span>
                <span>₹{summary.roundOff.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm sm:text-base font-black text-slate-900 pt-1.5 border-t border-slate-300">
              <span>NET PAYABLE:</span>
              <span className="text-emerald-700 font-mono">₹{summary.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Quick Actions Row */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onHoldBill}
            disabled={items.length === 0}
            className="py-2 px-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-40"
          >
            <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Hold</span>
          </button>

          <button
            onClick={onOpenHeldModal}
            className="py-2 px-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center space-x-1 cursor-pointer"
          >
            <PlayCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>Held ({heldCount})</span>
          </button>

          <button
            onClick={clearCart}
            disabled={items.length === 0}
            className="py-2 px-1 text-[11px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-40"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>

        {/* Main Checkout Button */}
        <button
          onClick={onOpenPaymentDrawer}
          disabled={items.length === 0 || !summary}
          className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black py-3 rounded-xl text-sm transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
        >
          <span>Proceed to Payment</span>
          {summary && <span>(₹{summary.grandTotal.toFixed(2)})</span>}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
