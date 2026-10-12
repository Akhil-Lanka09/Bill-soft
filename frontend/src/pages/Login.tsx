import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sprout, Lock, User, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState<string>('admin');
  const [password, setPassword] = useState<string>('Admin@123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(username, password);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Background glowing effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full z-10">
        {/* Nursery Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-400 items-center justify-center text-white shadow-xl shadow-emerald-500/20 mb-4 border border-emerald-400/30">
            <Sprout className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">VIJAYA NURSERY</h1>
          <p className="text-xs text-emerald-400 font-semibold tracking-wide uppercase mt-1">
            Point of Sale & Nursery Enterprise System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-800/80 backdrop-blur-md rounded-3xl p-8 border border-slate-700/60 shadow-2xl">
          <h2 className="text-lg font-bold text-slate-100 mb-1">Operator Sign In</h2>
          <p className="text-xs text-slate-400 mb-6">Enter counter credentials to open register</p>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium animate-in fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full bg-slate-900/60 border border-slate-700 text-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden transition-all placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-slate-900/60 border border-slate-700 text-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden transition-all placeholder:text-slate-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              <span>{loading ? 'Authenticating Register...' : 'Open Register'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-slate-700/60">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Quick Counter Switch:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'Admin@123')}
                className="p-2 rounded-xl bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center space-x-1 text-emerald-400 text-[11px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">Vijaya</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('manager', 'Manager@123')}
                className="p-2 rounded-xl bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center space-x-1 text-amber-400 text-[11px] font-bold">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Manager</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">Suresh V.</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('cashier', 'Cashier@123')}
                className="p-2 rounded-xl bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center space-x-1 text-blue-400 text-[11px] font-bold">
                  <User className="w-3.5 h-3.5" />
                  <span>Cashier</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">Raju (POS 1)</div>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-500 mt-6">
          Vijaya Nursery • Vissannapeta, Andhra Pradesh • v1.0.0 Enterprise
        </p>
      </div>
    </div>
  );
};
