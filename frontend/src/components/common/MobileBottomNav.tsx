import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Receipt,
  Package,
  Users,
  Menu,
  X,
  Truck,
  BarChart3,
  Settings,
  LogOut,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export const MobileBottomNav: React.FC = () => {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();
  const [showDrawer, setShowDrawer] = useState<boolean>(false);

  const totalCartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleNavigate = (path: string) => {
    setShowDrawer(false);
    navigate(path);
  };

  const navItems = [
    {
      name: 'POS',
      path: '/',
      icon: ShoppingCart,
      badge: totalCartCount > 0 ? totalCartCount : null,
    },
    {
      name: 'Bills',
      path: '/bills',
      icon: Receipt,
    },
    {
      name: 'Plants',
      path: '/products',
      icon: Package,
    },
    {
      name: 'Customers',
      path: '/customers',
      icon: Users,
    },
  ];

  return (
    <>
      {/* Fixed Bottom Navigation Bar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 text-slate-400 select-none safe-area-bottom">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-1 transition-colors relative ${
                    isActive
                      ? 'text-emerald-400 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="relative">
                      <Icon className={`w-5 h-5 ${isActive ? 'scale-110 text-emerald-400' : ''}`} />
                      {item.badge && (
                        <span className="absolute -top-1.5 -right-2.5 bg-emerald-500 text-white text-[10px] font-black rounded-full min-w-4 h-4 px-1 flex items-center justify-center animate-pulse">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] mt-1 font-medium tracking-tight">
                      {item.name}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}

          {/* More / Menu Button */}
          <button
            onClick={() => setShowDrawer(true)}
            className="flex flex-col items-center justify-center py-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-medium tracking-tight">Menu</span>
          </button>
        </div>
      </nav>

      {/* Mobile Slide-Over Drawer Modal */}
      {showDrawer && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setShowDrawer(false)}
          />

          {/* Drawer Sheet */}
          <div className="relative bg-slate-900 border-t border-slate-800 text-slate-200 rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 space-y-5 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                  {user?.name ? user.name.charAt(0) : 'U'}
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center space-x-1.5">
                    <span>{user?.name || 'Operator'}</span>
                    {user?.role === 'admin' && (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 capitalize">
                    {user?.role || 'Staff'} • Vijaya Nursery Vissannapeta
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowDrawer(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Operations Links */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-1.5">
                Quick Operations
              </div>

              {(user?.role === 'admin' || user?.role === 'manager') && (
                <button
                  onClick={() => handleNavigate('/purchases')}
                  className="w-full flex items-center space-x-3 px-3 py-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-200 font-medium text-sm transition-colors text-left"
                >
                  <Truck className="w-5 h-5 text-amber-400" />
                  <span>Purchases & Stock Inward</span>
                </button>
              )}

              {(user?.role === 'admin' || user?.role === 'manager') && (
                <button
                  onClick={() => handleNavigate('/reports')}
                  className="w-full flex items-center space-x-3 px-3 py-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-200 font-medium text-sm transition-colors text-left"
                >
                  <BarChart3 className="w-5 h-5 text-indigo-400" />
                  <span>Reports, Sales & GST</span>
                </button>
              )}

              {user?.role === 'admin' && (
                <button
                  onClick={() => handleNavigate('/settings')}
                  className="w-full flex items-center space-x-3 px-3 py-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-200 font-medium text-sm transition-colors text-left"
                >
                  <Settings className="w-5 h-5 text-emerald-400" />
                  <span>Settings, PIN & Users</span>
                </button>
              )}
            </div>

            {/* Store Information */}
            <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/50 text-xs space-y-1">
              <div className="font-bold text-emerald-400 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Vijaya Nursery — Live POS</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Main Road, Vissannapeta, AP - 521215
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                GSTIN: 37ABCDE1234F1Z5 • FY 2026-27
              </p>
            </div>

            {/* Logout button */}
            <button
              onClick={() => {
                setShowDrawer(false);
                logout();
              }}
              className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Counter</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
