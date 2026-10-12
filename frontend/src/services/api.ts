const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export class ApiError extends Error {
  code?: string;
  statusCode: number;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      data?.message || 'Something went wrong',
      response.status,
      data?.code
    );
  }

  return data;
}

const buildQueryString = (params?: Record<string, any>): string => {
  if (!params) return '';
  const entries = Object.entries(params).filter(
    ([_, val]) => val !== undefined && val !== null && val !== ''
  );
  if (!entries.length) return '';
  return '?' + new URLSearchParams(entries).toString();
};

export const api = {
  // Auth
  login: (credentials: { username: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getMe: () => request('/auth/me'),
  changePassword: (passwords: { currentPassword: string; newPassword: string }) =>
    request('/auth/change-password', { method: 'POST', body: JSON.stringify(passwords) }),

  // Products & Inventory
  getProducts: (params?: Record<string, any>) => {
    return request(`/products${buildQueryString(params)}`);
  },
  searchProducts: (q: string, limit: number = 20) =>
    request(`/products/search?q=${encodeURIComponent(q)}&limit=${limit}`),
  getProductById: (id: string) => request(`/products/${id}`),
  createProduct: (data: any) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: any) =>
    request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  adjustStock: (id: string, data: { quantity: number; type: string; reason: string }) =>
    request(`/products/${id}/adjust-stock`, { method: 'POST', body: JSON.stringify(data) }),
  reconcileStock: (id: string, data: { physicalStock: number; reason: string }) =>
    request(`/products/${id}/reconcile-stock`, { method: 'POST', body: JSON.stringify(data) }),
  getStockHistory: (id: string, page: number = 1) =>
    request(`/products/${id}/stock-history?page=${page}`),
  getCategories: () => request('/products/categories'),
  getInventorySummary: () => request('/products/inventory-summary'),

  // Billing & POS
  calculateSummary: (payload: any) =>
    request('/bills/calculate', { method: 'POST', body: JSON.stringify(payload) }),
  createBill: (payload: any) =>
    request('/bills', { method: 'POST', body: JSON.stringify(payload) }),
  getBills: (params?: Record<string, any>) => {
    return request(`/bills${buildQueryString(params)}`);
  },
  getBillById: (id: string) => request(`/bills/${id}`),
  getThermalReceipt: (id: string) => request(`/bills/${id}/receipt`),
  cancelBill: (id: string, reason: string) =>
    request(`/bills/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
  processReturn: (id: string, payload: { items: any[]; reason: string }) =>
    request(`/bills/${id}/return`, { method: 'POST', body: JSON.stringify(payload) }),
  holdBill: (payload: any) =>
    request('/bills/hold', { method: 'POST', body: JSON.stringify(payload) }),
  getHeldBills: () => request('/bills/held'),
  deleteHeldBill: (id: string) =>
    request(`/bills/held/${id}`, { method: 'DELETE' }),

  // Customers & Ledgers
  getCustomers: (params?: Record<string, any>) => {
    return request(`/customers${buildQueryString(params)}`);
  },
  getCustomerById: (id: string) => request(`/customers/${id}`),
  createCustomer: (data: any) =>
    request('/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id: string, data: any) =>
    request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getCustomerLedger: (id: string, fromDate?: string, toDate?: string) => {
    let qs = '';
    if (fromDate || toDate) {
      qs = '?' + new URLSearchParams({ ...(fromDate && { fromDate }), ...(toDate && { toDate }) }).toString();
    }
    return request(`/customers/${id}/ledger${qs}`);
  },
  recordCustomerPayment: (id: string, payload: any) =>
    request(`/customers/${id}/payments`, { method: 'POST', body: JSON.stringify(payload) }),

  // Purchases & Suppliers
  getSuppliers: (search?: string) =>
    request(`/purchases/suppliers${search ? '?search=' + encodeURIComponent(search) : ''}`),
  createSupplier: (data: any) =>
    request('/purchases/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  getPurchases: (page: number = 1, supplierId?: string) => {
    let qs = `?page=${page}`;
    if (supplierId) qs += `&supplierId=${supplierId}`;
    return request(`/purchases${qs}`);
  },
  createPurchase: (data: any) =>
    request('/purchases', { method: 'POST', body: JSON.stringify(data) }),

  // Reports
  getDashboard: () => request('/reports/dashboard'),
  getSalesReport: (startDate?: string, endDate?: string) => {
    let qs = '';
    if (startDate || endDate) {
      qs = '?' + new URLSearchParams({ ...(startDate && { startDate }), ...(endDate && { endDate }) }).toString();
    }
    return request(`/reports/sales${qs}`);
  },
  getGSTR1: (startDate: string, endDate: string) =>
    request(`/reports/gstr1?startDate=${startDate}&endDate=${endDate}`),
  getInventoryValuation: () => request('/reports/inventory-valuation'),
  getDailyClosing: (date?: string) =>
    request(`/reports/daily-closing${date ? '?date=' + date : ''}`),
  submitDailyClosing: (data: any) =>
    request('/reports/daily-closing', { method: 'POST', body: JSON.stringify(data) }),
  getExpenses: (params?: Record<string, any>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/reports/expenses${qs}`);
  },
  createExpense: (data: any) =>
    request('/reports/expenses', { method: 'POST', body: JSON.stringify(data) }),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (data: any) =>
    request('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  verifyOverridePin: (pin: string) =>
    request('/settings/override-pin/verify', { method: 'POST', body: JSON.stringify({ pin }) }),

  // Users
  getUsers: () => request('/users'),
  createUser: (data: any) =>
    request('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: string, data: any) =>
    request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id: string) =>
    request(`/users/${id}`, { method: 'DELETE' }),
  resetPassword: (id: string, password: string) =>
    request(`/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ newPassword: password }) }),
};
