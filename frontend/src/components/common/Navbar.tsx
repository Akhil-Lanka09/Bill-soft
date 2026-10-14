import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sprout, LogOut, Clock, ShieldCheck, User as UserIcon, Rocket } from 'lucide-react';

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
    <header className="h-14 md:h-16 bg-[#0b131e] border-b border-slate-800 px-3 md:px-6 flex items-center justify-between shadow-md select-none sticky top-0 z-30">
      {/* Brand */}
      <div className="flex items-center space-x-2 md:space-x-3 min-w-0">
        <div className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-white p-0.5 shadow-md shadow-emerald-500/20 border border-emerald-500/40 shrink-0 flex items-center justify-center overflow-hidden">
          <img
            src="/vijaya-nursery-logo.jpg"
            alt="Vijaya Plant Nursery"
            className="w-full h-full object-contain rounded-full"
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center space-x-1.5 md:space-x-2">
            <h1 className="text-sm sm:text-base md:text-lg font-black tracking-tight text-white leading-tight truncate">
              VIJAYA PLANT NURSERY
            </h1>
            <span className="hidden sm:inline-block text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 shrink-0">
              SINCE 1982
            </span>
          </div>
          <p className="text-[10px] md:text-xs text-emerald-400/80 font-medium truncate">
            Vissannapeta, Andhra Pradesh • POS Terminal
          </p>
        </div>
      </div>

      {/* Center live clock */}
      <div className="hidden md:flex items-center space-x-2 bg-slate-900/90 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 shadow-inner">
        <Clock className="w-4 h-4 text-emerald-400" />
        <span className="font-semibold">{time}</span>
      </div>

      {/* Right controls */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {user && (
          <div className="flex items-center space-x-2.5 sm:space-x-3 bg-slate-900/90 py-1.5 px-3 rounded-xl border border-slate-800 shadow-inner">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-emerald-600/30">
              {user.name.charAt(0)}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-100 flex items-center space-x-1">
                <span>{user.name}</span>
                {user.role === 'admin' && (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </div>
              <div className="text-[10px] capitalize font-medium text-emerald-400/80">
                {user.role} (Counter 01)
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => window.dispatchEvent(new CustomEvent('reopen-launch-screen'))}
          title="Replay Launch Screen & Intro"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-emerald-950/60 hover:border-emerald-500/40 text-emerald-300 text-xs font-semibold transition-all cursor-pointer shadow-xs"
        >
          <Rocket className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">Launch Intro</span>
        </button>

        <button
          onClick={logout}
          title="Sign out of register"
          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-900/40"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
