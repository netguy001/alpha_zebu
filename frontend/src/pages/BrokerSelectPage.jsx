import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/useAuthStore";
import { useBrokerStore } from "../stores/useBrokerStore";
import toast from "react-hot-toast";
import {
  HiArrowRight,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiArrowLeft,
  HiCheck,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineKey,
  HiOutlineUser,
  HiOutlineLockClosed,
  HiX,
} from "react-icons/hi";

/* ─── Animated Background ────────────────────────────────────── */
function FloatingOrbs() {
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
            animation: `floatOrb ${8 + Math.random() * 12}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Broker Data ────────────────────────────────────────────── */
const BROKERS = [
  {
    id: "zebull",
    name: "Zebull (Mynt)",
    logoText: "ZEBULL",
    logoSub: "MYNT",
    color: "#00b894",
    active: true,
  },
  {
    id: "zerodha",
    name: "Zerodha",
    logoText: "ZERODHA",
    logoSub: "",
    color: "#387ed1",
    active: false,
  },
  {
    id: "angelone",
    name: "Angel One",
    logoText: "ANGEL",
    logoSub: "ONE",
    color: "#ff6b35",
    active: false,
  },
  {
    id: "upstox",
    name: "Upstox",
    logoText: "UPSTOX",
    logoSub: "",
    color: "#7b2ff7",
    active: false,
  },
  {
    id: "groww",
    name: "Groww",
    logoText: "GROWW",
    logoSub: "",
    color: "#5367ff",
    active: false,
  },
  {
    id: "dhan",
    name: "Dhan",
    logoText: "DHAN",
    logoSub: "",
    color: "#00d1b2",
    active: false,
  },
];

/* ─── Broker Card — Big square box with logo + name ──────────── */
function BrokerCard({ broker, index, onSelect, selected }) {
  const isSelected = selected === broker.id;
  const delay = index * 50;

  return (
    <div
      className={`
                group relative flex flex-col items-center justify-center rounded-2xl border aspect-square
                transition-all duration-400 cursor-pointer select-none
                ${isSelected
          ? "border-emerald-400/60 ring-2 ring-emerald-400/20 scale-[1.04]"
          : broker.active
            ? "border-white/8 hover:border-white/20 hover:scale-[1.04]"
            : "border-white/5 opacity-40 hover:opacity-55"
        }
            `}
      style={{
        background: isSelected
          ? "rgba(16, 185, 129, 0.06)"
          : "rgba(10, 12, 25, 0.65)",
        animation: `brokerSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms both`,
      }}
      onClick={() => broker.active && onSelect(broker.id)}
    >
      {/* Selection check */}
      {isSelected && (
        <div
          className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/40"
          style={{
            animation: "popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both",
          }}
        >
          <HiCheck className="w-3 h-3 text-white stroke-2" />
        </div>
      )}

      {/* Coming Soon badge */}
      {!broker.active && (
        <div className="absolute top-2.5 right-2.5">
          <span className="text-[7px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded bg-white/5 text-gray-600 border border-white/5">
            Soon
          </span>
        </div>
      )}

      {/* Logo Box */}
      <div
        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex flex-col items-center justify-center gap-0.5 mb-3 transition-transform duration-300 group-hover:scale-110"
        style={{
          background: `${broker.color}12`,
          border: `1.5px solid ${broker.color}30`,
          boxShadow: isSelected ? `0 0 30px ${broker.color}15` : "none",
        }}
      >
        <span
          className="text-[11px] sm:text-[13px] font-black tracking-wider leading-none"
          style={{ color: broker.color }}
        >
          {broker.logoText}
        </span>
        {broker.logoSub && (
          <span
            className="text-[7px] sm:text-[8px] font-bold tracking-widest leading-none mt-0.5 opacity-60"
            style={{ color: broker.color }}
          >
            {broker.logoSub}
          </span>
        )}
      </div>

      {/* Name */}
      <span
        className={`text-xs font-semibold text-center leading-tight px-2 transition-colors ${isSelected ? "text-white" : "text-gray-400 group-hover:text-gray-300"}`}
      >
        {broker.name}
      </span>
    </div>
  );
}

/* ─── Zebu Login Modal ────────────────────────────────────────── */
function ZebuLoginModal({ open, onClose, onSuccess }) {
  const [uid, setUid] = useState("");
  const [password, setPassword] = useState("");
  const [factor2, setFactor2] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const brokerLogin = useBrokerStore((s) => s.login);
  const loading = useBrokerStore((s) => s.loading);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!uid.trim() || !password.trim()) {
      toast.error("User ID and Password are required");
      return;
    }
    try {
      await brokerLogin(uid.trim(), password, factor2.trim());
      toast.success("Zebu connected successfully!");
      onSuccess?.();
    } catch (err) {
      toast.error(err.message || "Login failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: "fadeIn 0.2s ease both" }}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md mx-4 rounded-2xl border border-white/10 shadow-2xl"
        style={{
          background: "rgba(12, 14, 28, 0.95)",
          animation: "modalSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
        >
          <HiX className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(0, 184, 148, 0.12)",
                border: "1.5px solid rgba(0, 184, 148, 0.3)",
              }}
            >
              <span
                className="text-[10px] font-black tracking-wider"
                style={{ color: "#00b894" }}
              >
                ZEBU
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Connect Zebull
              </h2>
              <p className="text-xs text-gray-500">
                Enter your Zebu trading account credentials
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* User ID */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">
              Zebu User ID
            </label>
            <div className="relative">
              <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                placeholder="e.g. FA12345"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm placeholder-gray-600 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all"
                autoFocus
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your Zebu password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm placeholder-gray-600 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? (
                  <HiOutlineEyeOff className="w-4 h-4" />
                ) : (
                  <HiOutlineEye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* 2FA: DOB or TOTP */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">
              DOB / 2FA{" "}
              <span className="text-gray-600 font-normal">(DD-MM-YYYY or TOTP)</span>
            </label>
            <div className="relative">
              <HiOutlineKey className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={factor2}
                onChange={(e) => setFactor2(e.target.value)}
                placeholder="DD-MM-YYYY or 6-digit TOTP"
                maxLength={10}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm placeholder-gray-600 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all"
                autoComplete="off"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !uid.trim() || !password.trim()}
            className={`
              w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2.5 transition-all duration-300
              ${loading || !uid.trim() || !password.trim()
                ? "bg-white/[0.04] border border-white/8 text-gray-600 cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98]"
              }
            `}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                Connect Zebull <HiArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="px-6 pb-5">
          <div className="flex items-center gap-1.5 justify-center px-3 py-2 rounded-full bg-white/[0.02] border border-white/5">
            <HiOutlineShieldCheck className="w-3.5 h-3.5 text-emerald-500/60" />
            <span className="text-[10px] text-gray-600">
              Password is hashed before sending · Token encrypted at rest
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function BrokerSelectPage() {
  const navigate = useNavigate();
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [showContent, setShowContent] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const brokerLoading = useBrokerStore((s) => s.loading);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSelect = (brokerId) => {
    setSelectedBroker(brokerId);
  };

  const handleContinue = async () => {
    if (!selectedBroker) return;

    // For Zebull — open direct login modal
    if (selectedBroker === "zebull") {
      setShowLoginModal(true);
      return;
    }

    // For other brokers (coming soon) — just go to dashboard
    setIsTransitioning(true);
    setTimeout(() => navigate("/dashboard"), 500);
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    setIsTransitioning(true);
    setTimeout(() => navigate("/dashboard"), 400);
  };

  const handleBack = () => {
    navigate("/select-mode");
  };

  return (
    <div
      className={`min-h-screen w-full overflow-x-hidden transition-all duration-500 ${isTransitioning ? "opacity-0 scale-[1.02]" : "opacity-100 scale-100"}`}
      style={{ background: "#07080f" }}
    >
      <FloatingOrbs />

      {/* Gradient overlays */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full bg-emerald-600/[0.04] blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full bg-teal-600/[0.03] blur-[100px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Back button */}
        <div
          style={{
            animation: showContent ? "fadeDown 0.5s ease both" : "none",
          }}
        >
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-white border border-white/5 hover:border-white/15 bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-300 mb-8"
          >
            <HiArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
        </div>

        {/* Header */}
        <div
          className="text-center mb-10"
          style={{
            animation: showContent
              ? "fadeDown 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both"
              : "none",
          }}
        >
          <div className="flex justify-center mb-5">
            <img
              src="/logo.png"
              alt="AlphaSync"
              className="h-10 sm:h-11 object-contain dark:brightness-100 brightness-0"
            />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4">
            <HiOutlineSparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px] font-semibold text-indigo-300">
              Demo Trading
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
            Select Your{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Broker
            </span>
          </h1>
          <p className="text-sm text-gray-500">
            Choose your preferred broker to get started.
          </p>
        </div>

        {/* Broker Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 mb-10">
          {BROKERS.map((broker, i) => (
            <BrokerCard
              key={broker.id}
              broker={broker}
              index={i}
              onSelect={handleSelect}
              selected={selectedBroker}
            />
          ))}
        </div>

        {/* Continue */}
        <div
          className="flex flex-col items-center gap-3"
          style={{
            animation: showContent
              ? "fadeDown 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both"
              : "none",
          }}
        >
          <button
            onClick={handleContinue}
            disabled={!selectedBroker || brokerLoading}
            className={`
                            px-10 py-3 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all duration-400
                            ${selectedBroker
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.03] active:scale-[0.97]"
                : "bg-white/[0.04] border border-white/8 text-gray-600 cursor-not-allowed"
              }
                        `}
          >
            {brokerLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Connecting...
              </>
            ) : selectedBroker ? (
              <>
                Continue with{" "}
                {BROKERS.find((b) => b.id === selectedBroker)?.name}
                <HiArrowRight className="w-4 h-4" />
              </>
            ) : (
              "Select a broker to continue"
            )}
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/5">
            <HiOutlineShieldCheck className="w-3.5 h-3.5 text-emerald-500/60" />
            <span className="text-[10px] text-gray-600">
              Credentials encrypted · Never stored on our servers
            </span>
          </div>
        </div>
      </div>

      <style>{`
                @keyframes floatOrb {
                    0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
                    25% { transform: translate(15px, -25px) scale(1.15); opacity: 0.5; }
                    50% { transform: translate(-10px, -50px) scale(0.85); opacity: 0.35; }
                    75% { transform: translate(12px, -15px) scale(1.05); opacity: 0.45; }
                }
                @keyframes fadeDown {
                    from { opacity: 0; transform: translateY(-18px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes brokerSlideUp {
                    from { opacity: 0; transform: translateY(30px) scale(0.92); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes popIn {
                    from { opacity: 0; transform: scale(0); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>

      {/* Zebu Login Modal */}
      <ZebuLoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}
