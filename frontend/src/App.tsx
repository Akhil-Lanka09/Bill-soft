import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { MobileBottomNav } from './components/common/MobileBottomNav';

// Pages
import { Login } from './pages/Login';
import { POSBilling } from './pages/POSBilling';
import { BillsList } from './pages/BillsList';
import { Products } from './pages/Products';
import { Customers } from './pages/Customers';
import { Purchases } from './pages/Purchases';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

const ProtectedLayout: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-mono">Initializing Vijaya Nursery POS...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-slate-100">
        <Navbar />
        <div className="flex flex-1 overflow-hidden relative">
          <Sidebar />
          <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
            <Routes>
              <Route path="/" element={<POSBilling />} />
              <Route path="/bills" element={<BillsList />} />
              <Route path="/products" element={<Products />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/purchases" element={<Purchases />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
        <MobileBottomNav />
      </div>
    </CartProvider>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
