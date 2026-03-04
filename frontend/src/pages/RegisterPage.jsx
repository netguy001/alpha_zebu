// RegisterPage.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/useAuthStore";
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineUser,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiArrowRight,
  HiShieldCheck,
  HiCheckCircle,
  HiCurrencyRupee,
  HiChartBar,
  HiLightningBolt,
  HiTrendingUp,
} from "react-icons/hi";
import toast from "react-hot-toast";

/* ─── Password Strength Bar ───────────────────────────────────── */
function StrengthBar({ password }) {
  if (!password) return null;
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  const configs = [
    null,
    { label: "Weak", bar: "bg-red-500", text: "text-red-400" },
    { label: "Fair", bar: "bg-amber-400", text: "text-amber-400" },
    { label: "Good", bar: "bg-yellow-400", text: "text-yellow-400" },
    { label: "Strong", bar: "bg-emerald-400", text: "text-emerald-400" },
  ];
  const cfg = configs[score];
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-[3px] flex-1 rounded-full transition-all duration-300 ${i <= score ? cfg.bar : "bg-white/8"}`}
          />
        ))}
      </div>
      <p className={`text-[10px] font-bold ${cfg.text}`}>
        {cfg.label} password
      </p>
    </div>
  );
}

/* ─── Left Panel: Animated Portfolio Visual ───────────────────── */
function RegisterAnimation() {
  const portfolioItems = [
    {
      sym: "RELIANCE",
      qty: 10,
      avg: 1380,
      ltp: 1420,
      pnl: "+₹400",
      up: true,
      pct: "+2.9%",
    },
    {
      sym: "TCS",
      qty: 5,
      avg: 3450,
      ltp: 3598,
      pnl: "+₹740",
      up: true,
      pct: "+4.3%",
    },
    {
      sym: "HDFCBANK",
      qty: 20,
      avg: 1950,
      ltp: 1920,
      pnl: "-₹600",
      up: false,
      pct: "-1.5%",
    },
    {
      sym: "INFY",
      qty: 15,
      avg: 1310,
      ltp: 1281,
      pnl: "-₹435",
      up: false,
      pct: "-2.2%",
    },
    {
      sym: "BAJFIN",
      qty: 3,
      avg: 7600,
      ltp: 7845,
      pnl: "+₹735",
      up: true,
      pct: "+3.2%",
    },
  ];

  const donutData = [
    { label: "IT", pct: 34, col: "#6366f1" },
    { label: "Banking", pct: 28, col: "#22d3ee" },
    { label: "Finance", pct: 20, col: "#a78bfa" },
    { label: "Others", pct: 18, col: "#34d399" },
  ];

  // Simple donut math
  let offset = 0;
  const r = 36,
    circ = 2 * Math.PI * r;
  const donutSlices = donutData.map((d) => {
    const len = (d.pct / 100) * circ;
    const gap = 3;
    const slice = {
      ...d,
      dasharray: `${len - gap} ${circ - len + gap}`,
      dashoffset: -offset,
    };
    offset += len;
    return slice;
  });

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden select-none">
      {/* Glows */}
      <div
        className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-indigo-600/12 blur-3xl"
        style={{ animation: "pulse 4s ease-in-out infinite" }}
      />
      <div
        className="absolute bottom-20 right-0 w-64 h-64 rounded-full bg-violet-500/8 blur-3xl"
        style={{ animation: "pulse 5s ease-in-out infinite" }}
      />

      {/* Logo */}
      <div className="relative z-10 px-9 pt-9 flex-shrink-0">
        <Link to="/">
          <img
            src="/logo.png"
            alt="AlphaSync"
            className="h-11 object-contain dark:brightness-100 brightness-0"
          />
        </Link>
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-center px-7 py-3 gap-3 overflow-hidden">
        {/* Portfolio card */}
        <div
          className="rounded-2xl border border-white/8 overflow-hidden shadow-2xl shadow-black/60"
          style={{
            background: "rgba(10,11,22,0.9)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-3 border-b border-white/5"
            style={{ background: "rgba(0,0,0,0.3)" }}
          >
            <span className="text-[11px] font-bold text-gray-400 tracking-widest uppercase">
              Portfolio
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              LIVE
            </span>
          </div>

          {/* PnL summary row */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
            <div>
              <div className="text-[10px] text-gray-600 font-semibold uppercase tracking-wider">
                Total Value
              </div>
              <div className="text-lg font-black text-white font-mono tracking-tight mt-0.5">
                ₹10,02,840
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-gray-600 font-semibold uppercase tracking-wider">
                Day P&amp;L
              </div>
              <div className="text-base font-black text-emerald-400 font-mono mt-0.5">
                +₹2,840
              </div>
              <div className="text-[10px] text-emerald-500 font-mono">
                +0.28%
              </div>
            </div>
            {/* Mini donut */}
            <div className="relative w-16 h-16">
              <svg viewBox="0 0 88 88" className="w-full h-full -rotate-90">
                {donutSlices.map((s, i) => (
                  <circle
                    key={i}
                    cx="44"
                    cy="44"
                    r={r}
                    fill="none"
                    stroke={s.col}
                    strokeWidth="10"
                    strokeDasharray={s.dasharray}
                    strokeDashoffset={s.dashoffset}
                    opacity="0.85"
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[9px] font-black text-gray-400">MIX</span>
              </div>
            </div>
          </div>

          {/* Holdings */}
          <div className="divide-y divide-white/[0.04]">
            {portfolioItems.map((item, i) => (
              <div
                key={item.sym}
                className="flex items-center px-5 py-2.5 hover:bg-white/[0.02] transition-colors"
                style={{
                  animation: `fadeInUp 0.3s ease-out ${i * 0.07}s both`,
                }}
              >
                <div className="w-16">
                  <div className="text-[11px] font-black text-gray-300 tracking-wide">
                    {item.sym}
                  </div>
                  <div className="text-[9px] text-gray-600 mt-0.5">
                    {item.qty} shares
                  </div>
                </div>
                <div className="flex-1 text-center">
                  <div className="text-[11px] font-mono text-gray-400">
                    ₹{item.ltp.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-[11px] font-black font-mono ${item.up ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {item.pnl}
                  </div>
                  <div
                    className={`text-[9px] font-mono ${item.up ? "text-emerald-500" : "text-red-500"}`}
                  >
                    {item.pct}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sector legend row */}
        <div className="flex gap-2 flex-wrap">
          {donutData.map((d) => (
            <div
              key={d.label}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/8 bg-white/[0.03]"
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: d.col }}
              />
              <span className="text-[10px] text-gray-500 font-semibold">
                {d.label} {d.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="relative z-10 px-9 pb-8 flex-shrink-0">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/8 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-semibold text-indigo-300 tracking-wide">
            Join 500+ active traders today
          </span>
        </div>
        <h2 className="text-[22px] font-black text-white leading-tight tracking-tight">
          Start trading
          <br />
          <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            like a pro.
          </span>
        </h2>
        <p className="text-[12px] text-gray-600 mt-1.5">
          Real data. Virtual money. Zero risk.
        </p>
      </div>

      <style>{`
                @keyframes fadeInUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
                @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
            `}</style>
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────────── */
export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    full_name: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  const set = (key) => (e) =>
    setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword)
      return toast.error("Passwords do not match");
    if (formData.password.length < 8)
      return toast.error("Password must be at least 8 characters");
    setLoading(true);
    try {
      const { confirmPassword, ...data } = formData;
      await register(data);
      toast.success("Account created! Welcome to AlphaSync.");
      navigate("/select-mode");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const fieldCls =
    "w-full py-2.5 rounded-xl text-sm text-white placeholder-gray-600 border transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/25 focus:border-indigo-500/50 focus:bg-white/[0.06]";
  const fieldBg = "bg-white/[0.04] border-white/8";
  const passwordsMatch =
    formData.confirmPassword && formData.password === formData.confirmPassword;

  return (
    <div
      className="h-screen w-screen overflow-hidden flex"
      style={{ background: "#07080f" }}
    >
      {/* LEFT — animated portfolio panel */}
      <div
        className="hidden lg:flex w-[50%] h-full border-r border-white/5 flex-col"
        style={{
          background:
            "linear-gradient(135deg, #0a0c1a 0%, #0d0f20 50%, #08090f 100%)",
        }}
      >
        <RegisterAnimation />
      </div>

      {/* RIGHT — premium form */}
      <div
        className="flex-1 h-full flex items-center justify-center px-7 xl:px-10 relative overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #0b0d1c 0%, #07080f 100%)",
        }}
      >
        {/* Glows */}
        <div
          className="absolute -top-10 -right-10 w-96 h-96 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-10 -left-10 w-72 h-72 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(167,139,250,0.04) 0%, transparent 70%)",
          }}
        />

        {/* Corner accents */}
        <div className="absolute top-0 right-0 w-32 h-32 border-r border-t border-indigo-500/8 rounded-bl-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 border-l border-b border-cyan-500/6 rounded-tr-3xl pointer-events-none" />

        {/* Mobile logo */}
        <div className="lg:hidden absolute top-7 left-1/2 -translate-x-1/2">
          <Link to="/">
            <img
              src="/logo.png"
              alt="AlphaSync"
              className="h-10 object-contain"
            />
          </Link>
        </div>

        <div className="w-full max-w-[400px] relative z-10">
          {/* Live pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/8 mb-5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            <span className="text-[11px] font-semibold text-indigo-300 tracking-wide">
              Free · No KYC · No Bank Details
            </span>
          </div>

          {/* Headline */}
          <div className="mb-5">
            <h1 className="text-[26px] font-black text-white tracking-tight leading-tight mb-1.5">
              Create your account
            </h1>
            <p className="text-[13px] text-gray-500">
              Start with{" "}
              <span className="text-indigo-400 font-bold">₹10,00,000</span>{" "}
              virtual capital — free forever.
            </p>
          </div>

          {/* Glass card */}
          <div className="relative">
            <div
              className="absolute -inset-[1px] rounded-2xl pointer-events-none"
              style={{
                background:
                  "linear-gradient(135deg, rgba(99,102,241,0.22) 0%, rgba(255,255,255,0.03) 50%, rgba(167,139,250,0.12) 100%)",
              }}
            />
            <div
              className="relative rounded-2xl p-5 shadow-2xl"
              style={{
                background: "rgba(14,16,30,0.96)",
                backdropFilter: "blur(24px)",
              }}
            >
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Name + Username row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-widest">
                      Full Name
                    </label>
                    <div className="relative group">
                      <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-gray-600 group-focus-within:text-indigo-400 transition-colors" />
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={set("full_name")}
                        placeholder="Full name"
                        required
                        className={`${fieldCls} ${fieldBg} pl-9 pr-3`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-widest">
                      Username
                    </label>
                    <div className="relative group">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-gray-600 font-mono group-focus-within:text-indigo-400 transition-colors select-none">
                        @
                      </span>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={set("username")}
                        placeholder="username"
                        required
                        className={`${fieldCls} ${fieldBg} pl-7 pr-3`}
                      />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-widest">
                    Email Address
                  </label>
                  <div className="relative group">
                    <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-gray-600 group-focus-within:text-indigo-400 transition-colors" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={set("email")}
                      placeholder="you@example.com"
                      required
                      className={`${fieldCls} ${fieldBg} pl-9 pr-4`}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-widest">
                    Password
                  </label>
                  <div className="relative group">
                    <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-gray-600 group-focus-within:text-indigo-400 transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={set("password")}
                      placeholder="Min 8 characters"
                      required
                      minLength={8}
                      className={`${fieldCls} ${fieldBg} pl-9 pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? (
                        <HiOutlineEyeOff className="w-4 h-4" />
                      ) : (
                        <HiOutlineEye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <StrengthBar password={formData.password} />
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-widest">
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-gray-600 group-focus-within:text-indigo-400 transition-colors" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={set("confirmPassword")}
                      placeholder="Re-enter password"
                      required
                      className={`${fieldCls} ${fieldBg} pl-9 pr-16 ${formData.confirmPassword && !passwordsMatch ? "border-red-500/40" : ""}`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      {passwordsMatch && (
                        <HiCheckCircle className="w-4 h-4 text-emerald-400" />
                      )}
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="text-gray-600 hover:text-gray-300 transition-colors"
                      >
                        {showConfirm ? (
                          <HiOutlineEyeOff className="w-4 h-4" />
                        ) : (
                          <HiOutlineEye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  {formData.confirmPassword && !passwordsMatch && (
                    <p className="text-[10px] text-red-400 font-bold mt-1">
                      Passwords do not match
                    </p>
                  )}
                </div>

                {/* CTA */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="relative w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-[13px] font-black text-white overflow-hidden transition-all duration-200 active:scale-[0.98] disabled:opacity-50 group"
                    style={{
                      background:
                        "linear-gradient(135deg, #6366f1 0%, #4f46e5 60%, #4338ca 100%)",
                      boxShadow: "0 4px 24px rgba(99,102,241,0.35)",
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/12 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create Free Account{" "}
                        <HiArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-150" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Links */}
          <div className="mt-4 text-center space-y-2">
            <p className="text-[13px] text-gray-500">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
              >
                Sign In
              </Link>
            </p>
            <div className="flex items-center justify-center gap-1.5">
              <HiShieldCheck className="w-3.5 h-3.5 text-emerald-500/60" />
              <span className="text-[11px] text-gray-700">
                Free forever. No credit card required.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
