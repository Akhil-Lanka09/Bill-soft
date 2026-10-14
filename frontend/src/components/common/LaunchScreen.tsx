import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Rocket,
  ShieldCheck,
  CheckCircle2,
  Store,
  ArrowRight,
  TrendingUp,
  Boxes,
} from 'lucide-react';

interface LaunchScreenProps {
  onComplete: () => void;
}

export const LaunchScreen: React.FC<LaunchScreenProps> = ({ onComplete }) => {
  // 'launch' | 'cinematic' | 'exiting'
  const [phase, setPhase] = useState<'launch' | 'cinematic' | 'exiting'>('launch');
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('Initializing POS Engine...');

  const handleLaunchClick = () => {
    setPhase('cinematic');
  };

  const handleSkip = () => {
    setPhase('exiting');
    setTimeout(() => {
      onComplete();
    }, 400);
  };

  // Cinematic sequence progress
  useEffect(() => {
    if (phase !== 'cinematic') return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setPhase('exiting');
            setTimeout(onComplete, 500);
          }, 400);
          return 100;
        }

        const next = prev + 3;
        if (next > 75) {
          setStatusMessage('Ready for Billing & Counter Checkout ✨');
        } else if (next > 45) {
          setStatusMessage('Configuring Cash & UPI Payment Gateways...');
        } else if (next > 20) {
          setStatusMessage('Connecting 86 Plant Varieties from MongoDB Atlas...');
        }
        return next;
      });
    }, 55);

    return () => clearInterval(interval);
  }, [phase, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden flex flex-col items-center justify-center bg-[#070b12] text-white transition-opacity duration-500 ${
        phase === 'exiting' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-600/15 blur-[140px] pointer-events-none animate-float-orb" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-teal-500/15 blur-[150px] pointer-events-none animate-float-orb" style={{ animationDelay: '3s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-emerald-500/10 blur-[180px] pointer-events-none" />

      {/* Subtle Tech Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* PHASE 1: LAUNCH BILL-SOFT */}
      {phase === 'launch' && (
        <div className="relative z-10 max-w-4xl w-full mx-auto px-4 py-8 flex flex-col items-center text-center animate-bloom-in select-none">
          {/* Top Status Pill */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 text-xs font-semibold backdrop-blur-md mb-8 shadow-lg shadow-emerald-950/50">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block -ml-3" />
            <span>ENTERPRISE POS • LIVE AT VIJAYA NURSERY • v1.0.1</span>
          </div>

          {/* Central Logo Emblem */}
          <div className="relative mb-6">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 p-0.5 shadow-[0_0_60px_rgba(16,185,129,0.35)] flex items-center justify-center">
              <div className="w-full h-full bg-[#0a111a] rounded-3xl flex items-center justify-center border border-emerald-400/30 backdrop-blur-xl group">
                <Store className="w-12 h-12 text-emerald-400 transition-transform duration-500 group-hover:scale-110 drop-shadow-[0_0_15px_rgba(52,211,153,0.6)]" />
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-md font-mono">
              POS PRO
            </div>
          </div>

          {/* System Title */}
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-3">
            <span className="bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              BILL-
            </span>
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(16,185,129,0.4)]">
              SOFT
            </span>
          </h1>

          <p className="text-base sm:text-xl font-medium text-emerald-200/90 max-w-xl mx-auto mb-2">
            Professional Nursery POS & Retail Billing Management System
          </p>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto mb-10 leading-relaxed">
            Instant counter billing, botanical variety tracking, automated inventory deduction, and GST-ready invoices.
          </p>

          {/* Feature Badges Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-2xl w-full mb-12">
            <div className="bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 p-4 rounded-2xl backdrop-blur-md transition-all text-left group">
              <Boxes className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-slate-200">86 Plant Varieties</div>
              <div className="text-[11px] text-slate-400">Synced live with stock audit</div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 p-4 rounded-2xl backdrop-blur-md transition-all text-left group">
              <ShieldCheck className="w-5 h-5 text-teal-400 mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-slate-200">INV Tax Invoicing</div>
              <div className="text-[11px] text-slate-400">Sequential & GST-compliant</div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 p-4 rounded-2xl backdrop-blur-md transition-all text-left group">
              <TrendingUp className="w-5 h-5 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-slate-200">Cash & UPI QR</div>
              <div className="text-[11px] text-slate-400">Rapid payment checkout</div>
            </div>
          </div>

          {/* THE MAIN LAUNCH BUTTON */}
          <button
            onClick={handleLaunchClick}
            className="group relative cursor-pointer outline-hidden transition-all duration-300 hover:scale-105 active:scale-95"
          >
            {/* Outer Glow Halo */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 opacity-75 blur-xl group-hover:opacity-100 group-hover:blur-2xl transition duration-500 animate-pulse" />

            {/* Button Surface */}
            <div className="relative px-10 sm:px-14 py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 font-black text-white shadow-2xl flex items-center space-x-4 border border-emerald-300/40 overflow-hidden">
              {/* Shimmer Sweep Effect */}
              <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-[-25deg] animate-shimmer-sweep pointer-events-none" />

              <Rocket className="w-6 h-6 text-emerald-100 animate-bounce transition-transform group-hover:rotate-12" />
              <div className="text-left">
                <div className="text-lg sm:text-xl font-black tracking-wide leading-tight flex items-center space-x-2">
                  <span>Launch Bill-Soft</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                </div>
                <div className="text-[11px] font-normal text-emerald-100/80">
                  Click to initialize nursery billing system
                </div>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* PHASE 2: VIJAYA NURSERY CINEMATIC ANIMATION */}
      {phase === 'cinematic' && (
        <div className="relative z-10 max-w-3xl w-full mx-auto px-4 py-8 flex flex-col items-center text-center animate-bloom-in select-none">
          {/* Skip Button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 sm:top-8 sm:right-8 text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 transition-all cursor-pointer flex items-center space-x-1 backdrop-blur-md"
          >
            <span>Skip Intro</span>
            <span>✕</span>
          </button>

          {/* Glowing Animated Botanical Seal */}
          <div className="relative mb-8">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-400 to-amber-300 p-1 shadow-[0_0_80px_rgba(16,185,129,0.5)] flex items-center justify-center animate-spin" style={{ animationDuration: '20s' }}>
              <div className="w-full h-full bg-[#05110c] rounded-full flex items-center justify-center border border-emerald-400/40">
                <span className="text-4xl sm:text-5xl">🌿</span>
              </div>
            </div>
            {/* Sparkle Badges */}
            <div className="absolute -top-2 -right-2 p-2 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 animate-pulse">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          {/* Cinematic Subtitle */}
          <div className="text-xs sm:text-sm font-bold uppercase tracking-[0.35em] text-amber-300/90 mb-3 drop-shadow-sm font-mono">
            ESTABLISHED QUALITY HORTICULTURE
          </div>

          {/* Giant Vijaya Nursery Animated Typography */}
          <h2 className="text-4xl sm:text-7xl font-black mb-4 uppercase tracking-[0.25em] animate-text-reveal">
            <span className="bg-gradient-to-r from-emerald-300 via-teal-100 to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_0_45px_rgba(52,211,153,0.6)]">
              VIJAYA
            </span>{' '}
            <span className="bg-gradient-to-r from-teal-200 via-white to-emerald-300 bg-clip-text text-transparent drop-shadow-[0_0_45px_rgba(52,211,153,0.6)]">
              NURSERY
            </span>
          </h2>

          <p className="text-sm sm:text-lg text-slate-300 font-medium max-w-lg mx-auto mb-10 leading-relaxed italic">
            “Nurturing nature, delivering healthy fruit varieties, timber plants & exotic greens.”
          </p>

          {/* System Initialization Progress */}
          <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-md shadow-2xl">
            <div className="flex justify-between items-center text-xs font-semibold mb-2">
              <span className="text-emerald-400 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{statusMessage}</span>
              </span>
              <span className="font-mono text-slate-400">{progress}%</span>
            </div>

            {/* Glowing Progress Bar */}
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)] transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 font-mono">
              <span>Vissannapeta, AP</span>
              <span>GSTIN: 37ABCDE1234F1Z5</span>
              <span>INV Prefix Ready</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
