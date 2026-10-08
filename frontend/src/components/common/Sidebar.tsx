import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShoppingCart,
  Package,
  Users,
  Truck,
  BarChart3,
  Settings,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  roles?: string[];
  badge?: string;
}

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const navItems: NavItem[] = [
    {
      name: 'POS Billing',
      path: '/',
      icon: ShoppingCart,
      badge: 'F1',
    },
    {
      name: 'Sales & Invoices',
      path: '/bills',
      icon: Receipt,
      badge: 'F2',
    },
    {
      name: 'Plants & Inventory',
      path: '/products',
      icon: Package,
      badge: 'F3',
    },
    {
      name: 'Customers & Ledger',
      path: '/customers',
      icon: Users,
      badge: 'F4',
    },
    {
      name: 'Purchases & Inward',
      path: '/purchases',
      icon: Truck,
      roles: ['admin', 'manager'],
      badge: 'F5',
    },
    {
      name: 'Reports & GST',
      path: '/reports',
      icon: BarChart3,
      roles: ['admin', 'manager'],
      badge: 'F6',
    },
    {
      name: 'Settings & Staff',
      path: '/settings',
      icon: Settings,
      roles: ['admin'],
      badge: 'F7',
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 select-none">
      {/* Navigation list */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
          Operations
        </div>
        {navItems.map((item) => {
          if (item.roles && user && !item.roles.includes(user.role)) {
            return null;
          }

          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all group ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center space-x-3">
                    <Icon
                      className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-emerald-700 text-emerald-100'
                          : 'bg-slate-800 text-slate-500 group-hover:text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Nursery Information Box */}
      <div className="p-4 m-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs">
        <div className="text-emerald-400 font-semibold flex items-center space-x-1.5 mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>System Connected</span>
        </div>
        <p className="text-slate-400 text-[11px]">
          GSTIN: <span className="text-slate-200 font-mono">37ABCDE1234F1Z5</span>
        </p>
        <p className="text-slate-400 text-[11px]">
          Financial Year: <span className="text-emerald-300 font-semibold">2026-27</span>
        </p>
      </div>
    </aside>
  );
};
