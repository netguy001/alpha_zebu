//LandingPage.jsx
import { Link } from "react-router-dom";
import { useAuthStore } from "../stores/useAuthStore";
import {
  HiArrowRight,
  HiChartBar,
  HiLightningBolt,
  HiShieldCheck,
  HiCurrencyRupee,
  HiTrendingUp,
  HiCog,
  HiCheckCircle,
} from "react-icons/hi";

/* ─── Static data ────────────────────────────────────────────── */
const TICKER = [
  { s: "NIFTY 50", p: "25,487.05", c: "+0.56%", up: true },
  { s: "SENSEX", p: "83,765.50", c: "+0.54%", up: true },
  { s: "RELIANCE", p: "1,420.75", c: "-0.52%", up: false },
  { s: "TCS", p: "3,598.30", c: "+2.44%", up: true },
  { s: "HDFCBANK", p: "1,920.00", c: "+0.83%", up: true },
  { s: "INFOSYS", p: "1,281.50", c: "-1.85%", up: false },
  { s: "ICICIBANK", p: "1,392.20", c: "+1.34%", up: true },
  { s: "WIPRO", p: "495.60", c: "-1.63%", up: false },
  { s: "BAJFINANCE", p: "7,845.00", c: "+2.55%", up: true },
  { s: "ASIANPAINT", p: "2,145.80", c: "-1.62%", up: false },
  { s: "BANK NIFTY", p: "61,286.30", c: "+0.84%", up: true },
];

const FEATURES = [
  {
    icon: HiChartBar,
    title: "Professional Charts",
    desc: "TradingView-powered candlestick charts with 20+ technical indicators and multi-timeframe analysis.",
  },
  {
    icon: HiLightningBolt,
    title: "Instant Order Execution",
    desc: "Market, limit, and stop-loss orders with real-time fills and live position tracking.",
  },
  {
    icon: HiCog,
    title: "Algo Strategy Engine",
    desc: "Build and deploy SMA, RSI, MACD and Bollinger Band strategies. Automated execution.",
  },
  {
    icon: HiShieldCheck,
    title: "Risk Management",
    desc: "Position sizing, stop-loss rules, drawdown limits, and portfolio-level risk analytics.",
  },
  {
    icon: HiCurrencyRupee,
    title: "₹10,00,000 Virtual Capital",
    desc: "Start with ₹10L in simulated funds. No real money, zero risk, full learning.",
  },
  {
    icon: HiTrendingUp,
    title: "Portfolio Analytics",
    desc: "Real-time P&L, win rate analysis, sector allocation, and performance benchmarking.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Create Free Account",
    desc: "Sign up in 30 seconds. No KYC, no bank details, no real money ever required.",
  },
  {
    n: "02",
    title: "Get ₹10L Capital",
    desc: "Your account is instantly loaded with ₹10,00,000 in virtual funds to trade with.",
  },
  {
    n: "03",
    title: "Start Trading",
    desc: "Access real NSE/BSE data, place orders, run algo strategies, and master the markets.",
  },
];

const STATS = [
  { v: "500+", l: "Active Traders" },
  { v: "₹50 Cr+", l: "Simulated Volume" },
  { v: "200+", l: "NSE/BSE Stocks" },
  { v: "99.9%", l: "Platform Uptime" },
];

/* ─── SVG Chart ──────────────────────────────────────────────── */
function AreaChart() {
  const line =
    "0,70 40,62 80,75 120,50 160,56 200,34 240,48 280,24 320,38 360,16 400,30 440,8 480,22 520,0";
  return (
    <svg
      viewBox="0 0 520 80"
      className="w-full h-16"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="lc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={line + " 520,80 0,80"} fill="url(#lc)" stroke="none" />
      <polyline
        points={line}
        fill="none"
        stroke="#6366f1"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ─── Ticker ─────────────────────────────────────────────────── */
function Ticker() {
  const items = [...TICKER, ...TICKER];
  return (
    <div className="overflow-hidden border-y border-edge/5 bg-surface-900/50 py-2.5">
      <div className="flex animate-marquee will-change-transform">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 px-5 border-r border-edge/5 flex-shrink-0"
          >
            <span className="text-[11px] font-semibold text-gray-500 tracking-wide uppercase">
              {item.s}
            </span>
            <span className="text-[12px] font-mono text-gray-300">
              {item.p}
            </span>
            <span
              className={`text-[11px] font-mono font-semibold ${item.up ? "text-profit" : "text-loss"}`}
            >
              {item.c}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function LandingPage() {
  const isAuthenticated = !!useAuthStore((s) => s.user);

  return (
    <div className="min-h-screen bg-surface-950 text-heading">
      {/* ── Nav ─────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 lg:px-14 h-16 border-b border-edge/5 backdrop-blur-xl bg-surface-950/80">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="AlphaSync"
            className="h-14 rounded-lg object-contain dark:brightness-100 brightness-0"
          />
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="btn-primary text-sm inline-flex items-center gap-2"
            >
              Dashboard <HiArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-gray-400 hover:text-heading text-sm font-medium transition-colors px-3 py-2"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn-primary text-sm inline-flex items-center gap-2"
              >
                Get Started <HiArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────── */}
      <section className="px-6 lg:px-14 pt-20 pb-16">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary-500/20 bg-primary-500/8 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-profit animate-pulse" />
              <span className="text-xs font-medium text-primary-300 tracking-wide">
                Live NSE &amp; BSE Market Data
              </span>
            </div>
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-tight tracking-tight mb-6">
              India&apos;s Most Advanced
              <span className="block bg-gradient-to-r from-primary-400 to-accent-cyan bg-clip-text text-transparent">
                Trading Simulator.
              </span>
            </h1>
            <p className="text-lg text-gray-400 leading-relaxed mb-8 max-w-lg">
              Practice with real NSE &amp; BSE data. Execute trades, run algo
              strategies, and build your edge — with ₹10,00,000 in virtual
              capital. Risk nothing. Learn everything.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Link
                to="/register"
                className="btn-primary inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base"
              >
                Start Trading Free <HiArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="btn-secondary inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base"
              >
                Sign In to Account
              </Link>
            </div>

            <div className="flex items-center gap-6 flex-wrap">
              {[
                { v: "500+", l: "Active traders" },
                { v: "₹50 Cr+", l: "Simulated" },
                { v: "200+", l: "NSE stocks" },
              ].map(({ v, l }) => (
                <div key={l} className="flex flex-col">
                  <span className="text-lg font-bold text-heading">{v}</span>
                  <span className="text-xs text-gray-500">{l}</span>
                </div>
              ))}
              <div className="hidden sm:block w-px h-8 bg-edge/10" />
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <HiShieldCheck className="w-4 h-4 text-profit/60" />
                No real money involved
              </div>
            </div>
          </div>

          {/* Right: Product Preview */}
          <div className="hidden lg:block">
            <div className="glass-card overflow-hidden shadow-panel">
              <div className="flex items-center justify-between px-4 py-3 border-b border-edge/5 bg-surface-900/60">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-loss/60" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/60" />
                  <div className="w-3 h-3 rounded-full bg-profit/60" />
                </div>
                <span className="text-[11px] font-mono text-gray-500">
                  RELIANCE.NS — 3M
                </span>
                <span className="text-[11px] font-mono text-profit flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-profit animate-pulse" />
                  LIVE
                </span>
              </div>
              <div className="flex items-center gap-5 px-4 py-2.5 bg-surface-900/40 border-b border-edge/5">
                <div>
                  <div className="text-xl font-bold text-heading font-mono">
                    ₹1,420.70
                  </div>
                  <div className="text-xs text-loss font-mono">
                    ▼ 7.30 (−0.51%)
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  {["1D", "1W", "1M", "3M", "1Y"].map((p) => (
                    <span
                      key={p}
                      className={`text-[11px] px-2 py-0.5 rounded font-medium ${p === "3M" ? "bg-primary-500/20 text-primary-400" : "text-gray-600"}`}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-surface-900/20 p-4">
                <AreaChart />
              </div>
              <div className="flex bg-surface-900/60 border-t border-edge/5 divide-x divide-edge/5">
                {[
                  { s: "RELIANCE", p: "1420.7", c: "−0.51%", up: false },
                  { s: "TCS", p: "3598.3", c: "+2.44%", up: true },
                  { s: "HDFCBANK", p: "1920.0", c: "+0.83%", up: true },
                  { s: "INFY", p: "1281.5", c: "−1.85%", up: false },
                ].map(({ s, p, c, up }) => (
                  <div
                    key={s}
                    className="flex-1 px-3 py-2.5 flex flex-col gap-0.5"
                  >
                    <span className="text-[10px] font-semibold text-gray-500">
                      {s}
                    </span>
                    <span className="text-xs font-mono text-gray-300">{p}</span>
                    <span
                      className={`text-[11px] font-mono font-medium ${up ? "text-profit" : "text-loss"}`}
                    >
                      {c}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Ticker ──────────────────────────────────── */}
      <Ticker />

      {/* ── Features ────────────────────────────────── */}
      <section className="px-6 lg:px-14 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-3">
              Everything you need to trade.
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Professional tools for every trader, available for free.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="glass-card-hover p-6">
                <div className="w-10 h-10 rounded-xl bg-primary-600/15 border border-primary-500/15 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary-400" />
                </div>
                <h3 className="text-base font-bold text-heading mb-2">
                  {title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────── */}
      <section className="px-6 lg:px-14 py-14 border-y border-edge/5 bg-surface-900/30">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map(({ v, l }) => (
            <div key={l} className="text-center">
              <div className="text-3xl font-extrabold text-heading tracking-tight mb-1">
                {v}
              </div>
              <div className="text-sm text-gray-500">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ────────────────────────────── */}
      <section className="px-6 lg:px-14 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-3">
              Up and trading in minutes.
            </h2>
            <p className="text-gray-400 text-lg">
              Three steps. No paperwork. No deposit.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-10">
            {STEPS.map(({ n, title, desc }, i) => (
              <div key={i} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-primary-500/20 to-transparent -translate-x-1/2" />
                )}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-primary-600/15 border border-primary-500/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-black text-primary-400 font-mono">
                      {n}
                    </span>
                  </div>
                  <HiCheckCircle className="w-5 h-5 text-profit/60" />
                </div>
                <h3 className="text-lg font-bold text-heading mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────── */}
      <section className="px-6 lg:px-14 py-20 border-t border-edge/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl lg:text-5xl font-extrabold tracking-tight mb-5">
            Ready to trade
            <span className="block bg-gradient-to-r from-primary-400 to-accent-cyan bg-clip-text text-transparent">
              like a professional?
            </span>
          </h2>
          <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
            Join 500+ traders already practising on AlphaSync. Create your free
            account and start trading today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="btn-primary inline-flex items-center justify-center gap-2 px-10 py-4 text-base"
            >
              Create Free Account <HiArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="btn-secondary inline-flex items-center justify-center gap-2 px-10 py-4 text-base"
            >
              Sign In
            </Link>
          </div>
          <p className="text-gray-600 text-sm mt-6 flex items-center justify-center gap-2">
            <HiShieldCheck className="w-4 h-4 text-profit/50" />
            No real money. No credit card. Free forever.
          </p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="border-t border-edge/5 px-6 lg:px-14 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="AlphaSync"
              className="h-10 rounded-lg object-contain dark:brightness-100 brightness-0"
            />
            <p className="text-xs text-gray-600">Simulation Trading Platform</p>
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-500">
            {["Privacy Policy", "Terms of Service", "Support", "GitHub"].map(
              (l) => (
                <a
                  key={l}
                  href="#"
                  className="hover:text-gray-300 transition-colors"
                >
                  {l}
                </a>
              ),
            )}
          </div>
          <p className="text-xs text-gray-600 text-center md:text-right">
            For educational purposes only. No real money involved.
          </p>
        </div>
      </footer>
    </div>
  );
}
