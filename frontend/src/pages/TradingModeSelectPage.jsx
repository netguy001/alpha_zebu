import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import {
    HiOutlineChartBar,
    HiOutlineLightningBolt,
    HiOutlineGlobe,
    HiOutlineCurrencyRupee,
    HiOutlineAcademicCap,
    HiOutlineShieldCheck,
    HiArrowRight,
    HiOutlineLockClosed,
    HiOutlineSparkles,
} from 'react-icons/hi';

/* ─── Animated Background ────────────────────────────────────── */
function FloatingParticles() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(12)].map((_, i) => (
                <div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                        width: `${Math.random() * 4 + 2}px`,
                        height: `${Math.random() * 4 + 2}px`,
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        background: `rgba(${99 + Math.random() * 50}, ${102 + Math.random() * 50}, 241, ${0.12 + Math.random() * 0.18})`,
                        animation: `floatParticle ${8 + Math.random() * 12}s ease-in-out infinite`,
                        animationDelay: `${Math.random() * 5}s`,
                    }}
                />
            ))}
        </div>
    );
}

/* ─── Trading Modes — minimal data ───────────────────────────── */
const TRADING_MODES = [
    { id: 'demo',      title: 'Demo Trading',      icon: HiOutlineAcademicCap,    color: '#6366f1', active: true  },
    { id: 'live',      title: 'Live Trading',       icon: HiOutlineLightningBolt,  color: '#f59e0b', active: false },
    { id: 'options',   title: 'Options Trading',    icon: HiOutlineChartBar,       color: '#06b6d4', active: false },
    { id: 'forex',     title: 'Forex Trading',      icon: HiOutlineGlobe,          color: '#10b981', active: false },
    { id: 'crypto',    title: 'Crypto Trading',     icon: HiOutlineCurrencyRupee,  color: '#a855f7', active: false },
    { id: 'commodity', title: 'Commodity Trading',   icon: HiOutlineShieldCheck,    color: '#f43f5e', active: false },
];

/* ─── Card — big icon box + title ────────────────────────────── */
function ModeCard({ mode, index, onSelect }) {
    const Icon = mode.icon;
    const delay = index * 60;

    return (
        <div
            className={`
                group relative flex flex-col items-center justify-center rounded-2xl border aspect-[4/3]
                transition-all duration-400 cursor-pointer select-none
                ${mode.active
                    ? 'border-indigo-500/30 hover:border-indigo-400/60 hover:scale-[1.04]'
                    : 'border-white/5 opacity-40 hover:opacity-55'
                }
            `}
            style={{
                background: 'rgba(10, 12, 25, 0.65)',
                animation: `cardSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms both`,
            }}
            onClick={() => mode.active && onSelect(mode.id)}
        >
            {/* Soon badge */}
            {!mode.active && (
                <div className="absolute top-2.5 right-2.5">
                    <span className="text-[7px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded bg-white/5 text-gray-600 border border-white/5">
                        Soon
                    </span>
                </div>
            )}

            {/* Active badge */}
            {mode.active && (
                <div className="absolute top-2.5 right-2.5">
                    <span className="text-[7px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                        Active
                    </span>
                </div>
            )}

            {/* Icon */}
            <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110"
                style={{
                    background: `${mode.color}12`,
                    border: `1.5px solid ${mode.color}30`,
                }}
            >
                <Icon className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: mode.color }} />
            </div>

            {/* Title */}
            <span className="text-xs sm:text-sm font-bold text-gray-300 group-hover:text-white transition-colors text-center px-2">
                {mode.title}
            </span>

            {/* Start arrow for active */}
            {mode.active && (
                <div className="mt-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-indigo-400">
                        <span>Start</span>
                        <HiArrowRight className="w-3 h-3" />
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function TradingModeSelectPage() {
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShowContent(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const handleSelect = (modeId) => {
        if (modeId === 'demo') {
            navigate('/select-broker');
        }
    };

    const firstName = user?.full_name?.split(' ')[0] || user?.username || 'Trader';

    return (
        <div className="min-h-screen w-full overflow-x-hidden" style={{ background: '#07080f' }}>
            <FloatingParticles />

            {/* Gradient overlays */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-indigo-600/[0.05] blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-violet-600/[0.04] blur-[100px]" />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

                {/* Header */}
                <div
                    className="text-center mb-10"
                    style={{ animation: showContent ? 'fadeSlideDown 0.7s cubic-bezier(0.16, 1, 0.3, 1) both' : 'none' }}
                >
                    <div className="flex justify-center mb-5">
                        <img src="/logo.png" alt="AlphaSync" className="h-10 sm:h-11 object-contain dark:brightness-100 brightness-0" />
                    </div>

                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4">
                        <HiOutlineSparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-[11px] font-semibold text-indigo-300">Welcome, {firstName}!</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
                        Choose Your{' '}
                        <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                            Trading Mode
                        </span>
                    </h1>
                    <p className="text-sm text-gray-500">
                        Select a mode to get started.
                    </p>
                </div>

                {/* Cards Grid — 3 columns */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-10">
                    {TRADING_MODES.map((mode, i) => (
                        <ModeCard key={mode.id} mode={mode} index={i} onSelect={handleSelect} />
                    ))}
                </div>

                {/* Footer */}
                <div
                    className="text-center"
                    style={{ animation: showContent ? 'fadeSlideDown 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both' : 'none' }}
                >
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/5">
                        <HiOutlineShieldCheck className="w-3.5 h-3.5 text-emerald-500/60" />
                        <span className="text-[10px] text-gray-600">
                            Demo uses simulated funds. No real money involved.
                        </span>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes floatParticle {
                    0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
                    25% { transform: translate(15px, -25px) scale(1.15); opacity: 0.5; }
                    50% { transform: translate(-10px, -50px) scale(0.85); opacity: 0.35; }
                    75% { transform: translate(12px, -15px) scale(1.05); opacity: 0.45; }
                }
                @keyframes fadeSlideDown {
                    from { opacity: 0; transform: translateY(-18px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes cardSlideUp {
                    from { opacity: 0; transform: translateY(30px) scale(0.92); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
}
