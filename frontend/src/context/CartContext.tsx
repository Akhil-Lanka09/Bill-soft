import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, Customer, BillSummary, PaymentDetail } from '../types';
import { api } from '../services/api';

interface CartContextType {
  items: CartItem[];
  customer: Customer | null;
  billDiscountType: 'percentage' | 'fixed';
  billDiscountValue: number;
  payments: PaymentDetail[];
  summary: BillSummary | null;
  loadingSummary: boolean;
  notes: string;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateItemRate: (productId: string, rate: number, overrideReason?: string) => void;
  updateItemDiscount: (productId: string, discountType: 'percentage' | 'fixed', discountValue: number) => void;
  setCustomer: (customer: Customer | null) => void;
  setBillDiscount: (type: 'percentage' | 'fixed', value: number) => void;
  setPayments: (payments: PaymentDetail[]) => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;
  loadHeldCart: (heldItems: CartItem[], customer?: Customer | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [billDiscountType, setBillDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [billDiscountValue, setBillDiscountValue] = useState<number>(0);
  const [payments, setPayments] = useState<PaymentDetail[]>([]);
  const [summary, setSummary] = useState<BillSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  // Re-calculate bill summary whenever cart items or discounts change
  useEffect(() => {
    if (items.length === 0) {
      setSummary(null);
      return;
    }

    const calc = async () => {
      setLoadingSummary(true);
      try {
        const payload = {
          items: items.map((it) => ({
            productId: it.product._id,
            quantity: it.quantity,
            rate: it.rate,
            discountType: it.discountType,
            discountValue: it.discountValue,
            overrideApplied: it.overrideApplied,
            overrideReason: it.overrideReason,
          })),
          discountType: billDiscountType,
          discountValue: billDiscountValue,
          customerState: customer?.state || 'Andhra Pradesh',
        };

        const res = await api.calculateSummary(payload);
        if (res.success && res.data) {
          setSummary(res.data);
        }
      } catch (err) {
        console.error('Calculation error:', err);
      } finally {
        setLoadingSummary(false);
      }
    };

    const timer = setTimeout(calc, 250);
    return () => clearTimeout(timer);
  }, [items, billDiscountType, billDiscountValue, customer]);

  const addItem = (product: Product, quantity: number = 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.product._id === product._id);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          quantity: next[idx].quantity + quantity,
        };
        return next;
      }
      return [
        ...prev,
        {
          product,
          quantity,
          rate: product.sellingPrice,
          discountType: 'percentage',
          discountValue: 0,
        },
      ];
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.product._id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.product._id === productId ? { ...i, quantity } : i))
    );
  };

  const updateItemRate = (productId: string, rate: number, overrideReason?: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.product._id === productId
          ? { ...i, rate, overrideApplied: true, overrideReason }
          : i
      )
    );
  };

  const updateItemDiscount = (
    productId: string,
    discountType: 'percentage' | 'fixed',
    discountValue: number
  ) => {
    setItems((prev) =>
      prev.map((i) =>
        i.product._id === productId
          ? { ...i, discountType, discountValue }
          : i
      )
    );
  };

  const setBillDiscount = (type: 'percentage' | 'fixed', value: number) => {
    setBillDiscountType(type);
    setBillDiscountValue(value);
  };

  const clearCart = () => {
    setItems([]);
    setCustomer(null);
    setBillDiscountType('percentage');
    setBillDiscountValue(0);
    setPayments([]);
    setSummary(null);
    setNotes('');
  };

  const loadHeldCart = (heldItems: CartItem[], heldCustomer?: Customer | null) => {
    setItems(heldItems);
    if (heldCustomer) setCustomer(heldCustomer);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        customer,
        billDiscountType,
        billDiscountValue,
        payments,
        summary,
        loadingSummary,
        notes,
        addItem,
        removeItem,
        updateQuantity,
        updateItemRate,
        updateItemDiscount,
        setCustomer,
        setBillDiscount,
        setPayments,
        setNotes,
        clearCart,
        loadHeldCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
