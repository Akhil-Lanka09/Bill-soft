import React, { useState } from 'react';
import { ShieldAlert, X, Check, KeyRound } from 'lucide-react';
import { api } from '../../services/api';

interface OverridePinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (reason: string) => void;
  title?: string;
  description?: string;
}

export const OverridePinModal: React.FC<OverridePinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Manager Override Required',
  description = 'Please have a manager or admin enter their 4-digit authorization PIN.',
}) => {
  const [pin, setPin] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) {
      setError('Please enter the PIN');
      return;
    }
    if (!reason.trim()) {
      setError('Please state an authorization reason');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.verifyOverridePin(pin);
      if (res.success && res.data?.verified) {
        onSuccess(reason);
        onClose();
        setPin('');
        setReason('');
      } else {
        setError(res.message || 'Invalid manager PIN');
      }
    } catch (err: any) {
      setError(err.message || 'Authorization failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">{title}</h3>
              <p className="text-xs text-amber-100 font-medium">Supervisor Authorization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">{description}</p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Manager 4-Digit PIN
            </label>
            <input
              type="password"
              maxLength={6}
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              className="w-full text-center tracking-[0.5em] text-2xl font-mono py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden font-bold"
            />
            <p className="text-[11px] text-slate-400 mt-1 text-center">Default supervisor PIN is: 9900</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Reason for Override
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Bulk customer negotiated discount, damaged leaf sample"
              className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
            />
          </div>

          {error && (
            <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl font-medium">
              {error}
            </div>
          )}

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors flex items-center justify-center space-x-1 shadow-md shadow-amber-600/30 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Verifying...' : 'Authorize'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
