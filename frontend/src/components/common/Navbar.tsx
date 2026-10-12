import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sprout, LogOut, Clock, ShieldCheck, User as UserIcon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-xs select-none">
      {/* Brand */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 to-green-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
          <Sprout className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold tracking-tight text-slate-800 leading-tight">
              VIJAYA NURSERY
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              POS Terminal
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium">Main Road, Vissannapeta, Andhra Pradesh</p>
        </div>
      </div>

      {/* Center live clock */}
      <div className="hidden md:flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-600">
        <Clock className="w-4 h-4 text-emerald-600" />
        <span>{time}</span>
      </div>

      {/* Right controls */}
      <div className="flex items-center space-x-4">
        {user && (
          <div className="flex items-center space-x-3 bg-slate-50 py-1.5 px-3 rounded-xl border border-slate-200">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-inner">
              {user.name.charAt(0)}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-slate-800 flex items-center space-x-1">
                <span>{user.name}</span>
                {user.role === 'admin' && (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                )}
              </div>
              <div className="text-[10px] capitalize font-medium text-slate-500">
                {user.role} (Counter 01)
              </div>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          title="Sign out of register"
          className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-100"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
