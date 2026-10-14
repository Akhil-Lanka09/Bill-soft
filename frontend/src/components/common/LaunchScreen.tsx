import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Rocket,
  ShieldCheck,
  CheckCircle2,
  Store,
  ArrowRight,
  TrendingUp,
  Boxes,
  PartyPopper,
} from 'lucide-react';

interface LaunchScreenProps {
  onComplete: () => void;
}

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  vRot: number;
  shape: 'rect' | 'circle' | 'ribbon';
  life: number;
  maxLife: number;
  opacity: number;
}

// Balloon definition for celebration on left & right sides
interface BalloonItem {
  id: number;
  side: 'left' | 'right';
  posPercent: number; // offset from screen edge
  color: string;
  shineColor: string;
  size: number; // width in px
  duration: number; // rise time in s
  delay: number; // delay in s
  swayDuration: number;
}

const BALLOON_PALETTES = [
  { color: 'from-emerald-600 to-emerald-800', shine: 'rgba(167,243,208,0.7)', hex: '#059669' },
  { color: 'from-amber-400 to-amber-600', shine: 'rgba(254,240,138,0.8)', hex: '#d97706' },
  { color: 'from-lime-400 to-emerald-600', shine: 'rgba(217,249,157,0.8)', hex: '#65a30d' },
  { color: 'from-yellow-400 to-amber-500', shine: 'rgba(254,249,195,0.8)', hex: '#eab308' },
  { color: 'from-emerald-500 to-teal-700', shine: 'rgba(204,251,241,0.7)', hex: '#0d9488' },
  { color: 'from-orange-500 to-amber-700', shine: 'rgba(254,215,170,0.7)', hex: '#c2410c' },
  { color: 'from-green-500 to-emerald-700', shine: 'rgba(187,247,208,0.7)', hex: '#16a34a' },
];

export const LaunchScreen: React.FC<LaunchScreenProps> = ({ onComplete }) => {
  // 'launch' | 'cinematic' | 'exiting'
  const [phase, setPhase] = useState<'launch' | 'cinematic' | 'exiting'>('launch');
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('Initializing POS Engine...');
  const [balloons, setBalloons] = useState<BalloonItem[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<ConfettiParticle[]>([]);
  const animFrameIdRef = useRef<number | null>(null);

  // Initialize Balloons on the Sides when cinematic starts
  useEffect(() => {
    if (phase !== 'cinematic') return;

    const sideBalloons: BalloonItem[] = [];
    const countPerSide = 9;

    // Left side balloons (spread out in left 0% - 18% width)
    for (let i = 0; i < countPerSide; i++) {
      const pal = BALLOON_PALETTES[i % BALLOON_PALETTES.length];
      sideBalloons.push({
        id: i,
        side: 'left',
        posPercent: 1.5 + (i * 2.0),
        color: pal.color,
        shineColor: pal.shine,
        size: 42 + Math.floor(Math.random() * 22),
        duration: 6.0 + Math.random() * 3.0,
        delay: (i * 0.45) % 2.5,
        swayDuration: 2.5 + Math.random() * 1.5,
      });
    }

    // Right side balloons (spread out in right 0% - 18% width)
    for (let i = 0; i < countPerSide; i++) {
      const pal = BALLOON_PALETTES[(i + 3) % BALLOON_PALETTES.length];
      sideBalloons.push({
        id: i + countPerSide,
        side: 'right',
        posPercent: 1.5 + (i * 2.0),
        color: pal.color,
        shineColor: pal.shine,
        size: 42 + Math.floor(Math.random() * 22),
        duration: 6.0 + Math.random() * 3.0,
        delay: 0.2 + ((i * 0.45) % 2.5),
        swayDuration: 2.5 + Math.random() * 1.5,
      });
    }

    setBalloons(sideBalloons);
  }, [phase]);

  // Burst Party Poppers from the sides - colors matched with logo greens & warm golds
  const firePartyPoppers = (source: 'both' | 'left' | 'right' = 'both') => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width;
    const height = canvas.height;
    const colors = ['#059669', '#10b981', '#34d399', '#65a30d', '#f59e0b', '#fbbf24', '#d97706', '#92400e', '#ffffff'];

    const createBurst = (originX: number, originY: number, angleDeg: number, spreadDeg: number, count = 80) => {
      for (let i = 0; i < count; i++) {
        const angle = ((angleDeg - spreadDeg / 2) + Math.random() * spreadDeg) * (Math.PI / 180);
        const velocity = 13 + Math.random() * 18;
        const shapes: ('rect' | 'circle' | 'ribbon')[] = ['rect', 'circle', 'ribbon'];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];

        particlesRef.current.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: shape === 'ribbon' ? 7 + Math.random() * 8 : 5 + Math.random() * 6,
          rotation: Math.random() * 360,
          vRot: (Math.random() - 0.5) * 16,
          shape,
          life: 0,
          maxLife: 110 + Math.random() * 60,
          opacity: 1,
        });
      }
    };

    if (source === 'both' || source === 'left') {
      createBurst(20, height - 30, -50, 45, 85);
      createBurst(10, height * 0.45, -25, 40, 55);
    }

    if (source === 'both' || source === 'right') {
      createBurst(width - 20, height - 30, -130, 45, 85);
      createBurst(width - 10, height * 0.45, -155, 40, 55);
    }
  };

  // Canvas Party Popper Animation Loop
  useEffect(() => {
    if (phase !== 'cinematic') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Initial Celebration Pop from both flanks!
    firePartyPoppers('both');

    // 4 celebratory bursts spread out across the 6.5s minimum duration
    const t1 = setTimeout(() => firePartyPoppers('both'), 1600);
    const t2 = setTimeout(() => firePartyPoppers('both'), 3300);
    const t3 = setTimeout(() => firePartyPoppers('both'), 5000);

    let isRunning = true;
    const gravity = 0.36;
    const drag = 0.985;

    const loop = () => {
      if (!isRunning) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += gravity;
        p.vx *= drag;
        p.vy *= drag;
        p.rotation += p.vRot;
        p.life += 1;

        if (p.life > p.maxLife * 0.7) {
          p.opacity = Math.max(0, 1 - (p.life - p.maxLife * 0.7) / (p.maxLife * 0.3));
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.55);
        } else if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size, -p.size * 0.25, p.size * 2, p.size * 0.5);
        }

        ctx.restore();

        if (p.life >= p.maxLife || p.y > canvas.height + 50) {
          particles.splice(i, 1);
        }
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      isRunning = false;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [phase]);

  const handleLaunchClick = () => {
    setPhase('cinematic');
  };

  const handleSkip = () => {
    setPhase('exiting');
    setTimeout(() => {
      onComplete();
    }, 400);
  };

  // Cinematic sequence progress - lasts 6.5 SECONDS MINIMUM (65ms * 100 ticks = 6500ms)
  useEffect(() => {
    if (phase !== 'cinematic') return;

    // 100 steps * 65ms = 6500ms = 6.5s (> 6 seconds minimum)
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

        const next = prev + 1;
        if (next >= 85) {
          setStatusMessage('Welcome to Vijaya Plant Nursery! Ready for Billing ✨');
        } else if (next >= 55) {
          setStatusMessage('Verifying Sequential INV Invoicing Engine...');
        } else if (next >= 30) {
          setStatusMessage('Configuring Cash & UPI Payment Gateways...');
        } else if (next >= 10) {
          setStatusMessage('Connecting 86 Plant Varieties from MongoDB Atlas...');
        }
        return next;
      });
    }, 65);

    return () => clearInterval(interval);
  }, [phase, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden flex flex-col items-center justify-center bg-[#070b12] text-white transition-opacity duration-500 ${
        phase === 'exiting' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Dynamic Ambient Background Glows tailored to Forest Green & Warm Amber */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-700/20 blur-[140px] pointer-events-none animate-float-orb" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-amber-600/15 blur-[150px] pointer-events-none animate-float-orb" style={{ animationDelay: '3s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-emerald-600/10 blur-[180px] pointer-events-none" />

      {/* Subtle Tech Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Full-Screen Confetti Canvas for Side Party Popper Cannons */}
      {phase === 'cinematic' && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-20"
        />
      )}

      {/* CELEBRATION BALLOONS ON SIDES (LEFT & RIGHT) */}
      {phase === 'cinematic' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-15">
          {balloons.map((b) => {
            const isLeft = b.side === 'left';
            return (
              <div
                key={b.id}
                className="absolute"
                style={{
                  left: isLeft ? `${b.posPercent}%` : undefined,
                  right: !isLeft ? `${b.posPercent}%` : undefined,
                  bottom: '0',
                  animation: `balloonRise ${b.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite`,
                  animationDelay: `${b.delay}s`,
                }}
              >
                {/* Balloon Sway Container */}
                <div
                  style={{
                    animation: `balloonSway ${b.swayDuration}s ease-in-out infinite alternate`,
                  }}
                  className="flex flex-col items-center"
                >
                  {/* Balloon Egg Body */}
                  <div
                    className={`relative rounded-[50%_50%_50%_50%_/_40%_40%_60%_60%] bg-gradient-to-br ${b.color} shadow-lg`}
                    style={{
                      width: `${b.size}px`,
                      height: `${b.size * 1.25}px`,
                      boxShadow: `0 10px 25px rgba(0,0,0,0.4), inset -4px -4px 10px rgba(0,0,0,0.3)`,
                    }}
                  >
                    {/* Glossy Curved Highlight */}
                    <div
                      className="absolute top-2 left-2 rounded-full pointer-events-none"
                      style={{
                        width: `${b.size * 0.28}px`,
                        height: `${b.size * 0.42}px`,
                        backgroundColor: b.shineColor,
                        transform: 'rotate(-25deg)',
                        filter: 'blur(1px)',
                      }}
                    />

                    {/* Secondary Rim Reflection */}
                    <div
                      className="absolute bottom-2 right-2 rounded-full pointer-events-none opacity-40"
                      style={{
                        width: `${b.size * 0.18}px`,
                        height: `${b.size * 0.18}px`,
                        backgroundColor: '#ffffff',
                      }}
                    />
                  </div>

                  {/* Balloon Knot */}
                  <div
                    className="w-2.5 h-1.5 -mt-0.5 rounded-b-sm bg-inherit opacity-90"
                    style={{
                      backgroundColor: b.shineColor ? undefined : '#10b981',
                    }}
                  />

                  {/* Hanging Wavy String */}
                  <svg
                    width="14"
                    height="45"
                    viewBox="0 0 14 45"
                    className="stroke-slate-400/80 fill-none -mt-0.5"
                  >
                    <path
                      d="M7,0 Q2,12 7,22 T7,44"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SIDE PARTY POPPERS UI ON FLANKS */}
      {phase === 'cinematic' && (
        <>
          {/* Left Side Popper Flank */}
          <div
            onClick={() => firePartyPoppers('left')}
            className="absolute left-3 sm:left-6 bottom-6 sm:bottom-12 z-30 cursor-pointer group flex items-center space-x-2 bg-slate-900/80 border border-emerald-500/40 hover:border-emerald-400 p-2.5 sm:p-3 rounded-2xl backdrop-blur-md shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 animate-popper-blast"
            title="Click to fire left popper!"
          >
            <div className="relative">
              <span className="text-2xl sm:text-3xl block group-hover:rotate-12 transition-transform">
                🎉
              </span>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div className="hidden md:block text-left pr-1">
              <div className="text-[11px] font-black text-emerald-300 uppercase tracking-wider flex items-center space-x-1">
                <span>Party Blast</span>
                <Sparkles className="w-3 h-3 text-amber-300" />
              </div>
              <div className="text-[9px] text-slate-400">Click to pop!</div>
            </div>
          </div>

          {/* Right Side Popper Flank */}
          <div
            onClick={() => firePartyPoppers('right')}
            className="absolute right-3 sm:right-6 bottom-6 sm:bottom-12 z-30 cursor-pointer group flex items-center space-x-2 bg-slate-900/80 border border-amber-500/40 hover:border-amber-400 p-2.5 sm:p-3 rounded-2xl backdrop-blur-md shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 animate-popper-blast"
            title="Click to fire right popper!"
          >
            <div className="hidden md:block text-right pl-1">
              <div className="text-[11px] font-black text-amber-300 uppercase tracking-wider flex items-center justify-end space-x-1">
                <Sparkles className="w-3 h-3 text-emerald-300" />
                <span>Celebration</span>
              </div>
              <div className="text-[9px] text-slate-400">Click to pop!</div>
            </div>
            <div className="relative">
              <span className="text-2xl sm:text-3xl block group-hover:-rotate-12 transition-transform">
                🎉
              </span>
              <span className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            </div>
          </div>
        </>
      )}

      {/* PHASE 1: LAUNCH BILL-SOFT */}
      {phase === 'launch' && (
        <div className="relative z-10 max-w-4xl w-full mx-auto px-4 py-8 flex flex-col items-center text-center animate-bloom-in select-none">
          {/* Top Status Pill */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold backdrop-blur-md mb-6 shadow-lg shadow-emerald-950/50">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block -ml-3" />
            <span>ENTERPRISE POS • VIJAYA PLANT NURSERY • SINCE 1982</span>
          </div>

          {/* Central Logo Emblem with Official Vijaya Nursery Logo */}
          <div className="relative mb-5">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-emerald-600 via-lime-400 to-amber-500 p-1 shadow-[0_0_60px_rgba(16,185,129,0.4)] flex items-center justify-center">
              <div className="w-full h-full bg-white rounded-[22px] p-1.5 flex items-center justify-center border border-emerald-400/30 shadow-inner group">
                <img
                  src="/vijaya-nursery-logo.jpg"
                  alt="Vijaya Nursery Logo"
                  className="w-full h-full object-contain rounded-2xl group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-md font-mono border border-amber-300/40">
              ESTD 1982
            </div>
          </div>

          {/* System Title */}
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-2">
            <span className="bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              BILL-
            </span>
            <span className="bg-gradient-to-r from-emerald-400 via-green-300 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(16,185,129,0.4)]">
              SOFT
            </span>
          </h1>

          <p className="text-base sm:text-xl font-medium text-emerald-200/90 max-w-xl mx-auto mb-1">
            Vijaya Plant Nursery POS & Counter Billing Suite
          </p>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto mb-8 leading-relaxed">
            Instant counter billing, botanical variety tracking, automated inventory deduction, and GST-ready invoices.
          </p>

          {/* Feature Badges Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-2xl w-full mb-10">
            <div className="bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 p-4 rounded-2xl backdrop-blur-md transition-all text-left group">
              <Boxes className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-slate-200">86 Plant Varieties</div>
              <div className="text-[11px] text-slate-400">Synced live with stock audit</div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 hover:border-amber-500/40 p-4 rounded-2xl backdrop-blur-md transition-all text-left group">
              <ShieldCheck className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-slate-200">INV Tax Invoicing</div>
              <div className="text-[11px] text-slate-400">Sequential & GST-compliant</div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 p-4 rounded-2xl backdrop-blur-md transition-all text-left group">
              <TrendingUp className="w-5 h-5 text-green-400 mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-slate-200">Cash & UPI QR</div>
              <div className="text-[11px] text-slate-400">Rapid counter checkout</div>
            </div>
          </div>

          {/* THE MAIN LAUNCH BUTTON */}
          <button
            onClick={handleLaunchClick}
            className="group relative cursor-pointer outline-hidden transition-all duration-300 hover:scale-105 active:scale-95"
          >
            {/* Outer Glow Halo */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-emerald-500 via-lime-400 to-amber-500 opacity-75 blur-xl group-hover:opacity-100 group-hover:blur-2xl transition duration-500 animate-pulse" />

            {/* Button Surface */}
            <div className="relative px-10 sm:px-14 py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-green-600 to-amber-600 font-black text-white shadow-2xl flex items-center space-x-4 border border-emerald-300/40 overflow-hidden">
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

          {/* Glowing Official Vijaya Plant Nursery Logo Emblem */}
          <div className="relative mb-5">
            {/* Outer Rotating Gradient Halo */}
            <div
              className="w-40 h-40 sm:w-52 sm:h-52 rounded-full bg-gradient-to-tr from-emerald-600 via-lime-400 to-amber-500 p-1.5 shadow-[0_0_90px_rgba(16,185,129,0.55),0_0_40px_rgba(245,158,11,0.35)] flex items-center justify-center animate-spin"
              style={{ animationDuration: '24s' }}
            >
              {/* Counter-rotating inner wrapper so the logo stays perfectly upright */}
              <div
                className="w-full h-full rounded-full bg-white p-2 sm:p-2.5 flex items-center justify-center shadow-inner overflow-hidden animate-spin"
                style={{ animationDirection: 'reverse', animationDuration: '24s' }}
              >
                <img
                  src="/vijaya-nursery-logo.jpg"
                  alt="Vijaya Plant Nursery Since 1982"
                  className="w-full h-full object-contain rounded-full drop-shadow-md"
                />
              </div>
            </div>

            {/* Sparkle Badges & Founded Year Tag */}
            <div className="absolute -top-1 -right-1 p-2 rounded-full bg-emerald-500/30 border border-emerald-400 text-emerald-300 animate-pulse shadow-lg">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-4 py-0.5 rounded-full bg-gradient-to-r from-emerald-700 via-amber-600 to-emerald-700 text-white text-[11px] font-black uppercase tracking-wider shadow-lg border border-amber-300/50 whitespace-nowrap">
              SINCE 1982
            </div>
          </div>

          {/* Cinematic Subtitle matching Logo */}
          <div className="text-xs sm:text-sm font-bold uppercase tracking-[0.3em] text-amber-300 mb-2 drop-shadow-sm font-mono flex items-center space-x-2">
            <span>🌿</span>
            <span>PREMIUM BOTANICAL HORTICULTURE</span>
            <span>🌿</span>
          </div>

          {/* Giant Vijaya Plant Nursery Animated Typography */}
          <h2 className="text-3xl sm:text-6xl font-black mb-2 uppercase tracking-[0.2em] animate-text-reveal">
            <span className="bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-500 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(52,211,153,0.6)]">
              VIJAYA
            </span>{' '}
            <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(245,158,11,0.5)]">
              PLANT NURSERY
            </span>
          </h2>

          <p className="text-xs sm:text-base text-emerald-100/90 font-medium max-w-lg mx-auto mb-6 leading-relaxed italic">
            “Four Decades of Trust • Healthy Fruit Varieties, Timber Plants & Exotic Greens.”
          </p>

          {/* System Initialization Progress */}
          <div className="w-full max-w-md bg-slate-900/85 border border-emerald-900/60 rounded-2xl p-4 backdrop-blur-md shadow-2xl">
            <div className="flex justify-between items-center text-xs font-semibold mb-2">
              <span className="text-emerald-400 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <span>{statusMessage}</span>
              </span>
              <span className="font-mono text-amber-400 font-bold">{progress}%</span>
            </div>

            {/* Glowing Progress Bar */}
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-lime-400 to-amber-400 shadow-[0_0_15px_rgba(16,185,129,0.8)] transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 font-mono">
              <span>Vissannapeta, AP</span>
              <span className="text-amber-400/80">SINCE 1982</span>
              <span>INV Billing Ready</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


