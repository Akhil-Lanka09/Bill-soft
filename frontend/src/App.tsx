import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { LaunchScreen } from './components/common/LaunchScreen';

// POSBilling is the primary operational page - keep ready
import { POSBilling } from './pages/POSBilling';

// Lazy-load secondary management routes on demand
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const BillsList = lazy(() => import('./pages/BillsList').then(m => ({ default: m.BillsList })));
const Products = lazy(() => import('./pages/Products').then(m => ({ default: m.Products })));
const Customers = lazy(() => import('./pages/Customers').then(m => ({ default: m.Customers })));
const Purchases = lazy(() => import('./pages/Purchases').then(m => ({ default: m.Purchases })));
const Reports = lazy(() => import('./pages/Reports').then(m => ({ default: m.Reports })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));

const RouteLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center p-12 text-slate-400">
    <div className="flex items-center space-x-2">
      <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-medium">Loading view...</span>
    </div>
  </div>
);

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
            <Suspense fallback={<RouteLoadingFallback />}>
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
            </Suspense>
          </main>
        </div>
        <MobileBottomNav />
      </div>
    </CartProvider>
  );
};

export const App: React.FC = () => {
  const [showLaunch, setShowLaunch] = useState<boolean>(true);

  useEffect(() => {
    const handleReopen = () => setShowLaunch(true);
    window.addEventListener('reopen-launch-screen', handleReopen);
    return () => window.removeEventListener('reopen-launch-screen', handleReopen);
  }, []);

  return (
    <AuthProvider>
      {showLaunch && <LaunchScreen onComplete={() => setShowLaunch(false)} />}
      <BrowserRouter>
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
