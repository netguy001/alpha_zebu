// LandingPage.jsx — Matches the AlphaSync marketing site design
import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useAuthStore } from "../stores/useAuthStore";
import { HiArrowRight } from "react-icons/hi";

/* ─── Static data ────────────────────────────────────────────── */
const TICKER = [
  { s: "RELIANCE", p: "₹2,847.50", c: "+1.24%", up: true },
  { s: "TCS", p: "₹3,912.00", c: "+0.87%", up: true },
  { s: "INFY", p: "₹1,634.25", c: "-0.43%", up: false },
  { s: "HDFCBANK", p: "₹1,578.90", c: "+2.01%", up: true },
  { s: "NIFTY50", p: "₹22,147.00", c: "+0.65%", up: true },
  { s: "WIPRO", p: "₹468.30", c: "-0.18%", up: false },
  { s: "BAJFINANCE", p: "₹7,320.00", c: "+1.55%", up: true },
  { s: "TATAMOTORS", p: "₹956.75", c: "+3.20%", up: true },
];

const MODULES = [
  {
    tag: "Module 01", icon: "📊", title: "Virtual Trade Pro",
    color: "indigo", colorClass: "text-indigo-400 border-indigo-500/30",
    dotColor: "bg-indigo-400",
    desc: "The complete paper trading terminal for NSE & BSE. Trade with ₹10,00,000 of virtual capital, track real-time P&L, manage your portfolio, and learn all order types safely.",
    features: ["MIS / NRML / CNC order types", "Real-time WebSocket LTP feed", "Full order book management", "Portfolio analytics with P&L charts", "Price alerts & watchlists"],
    stack: ["React 18", "FastAPI", "PostgreSQL", "Redis"],
  },
  {
    tag: "Module 02", icon: "⚡", title: "Scalping Trade",
    color: "red", colorClass: "text-red-400 border-red-500/30",
    dotColor: "bg-red-400",
    desc: "A hotkey-driven, ultra-low-latency paper scalping terminal. Execute paper orders in milliseconds, view live DOM, set auto-close timers, and analyse your session win rate.",
    features: ["<50ms LTP refresh rate", "Hotkeys B / S / C / X / Esc", "5-level depth of market (DOM)", "Auto-close timers", "Win rate & R:R analytics"],
    stack: ["Vue 3", "FastAPI", "PostgreSQL", "Redis"],
  },
  {
    tag: "Module 03", icon: "🔗", title: "Copy Trade",
    color: "purple", colorClass: "text-purple-400 border-purple-500/30",
    dotColor: "bg-purple-400",
    desc: "Follow expert traders and automatically mirror their paper positions in under 500ms. Set your copy ratio, define loss limits, and learn strategies from top performers.",
    features: ["<500ms copy latency", "Follow up to 10 experts", "Configurable copy ratio (0.1–1.0)", "7D / 30D / 90D leaderboard", "Auto-unfollow on loss limit"],
    stack: ["Vue 3", "FastAPI", "Bull Queue", "Redis"],
  },
  {
    tag: "Module 04", icon: "🤖", title: "Auto Trade",
    color: "amber", colorClass: "text-amber-400 border-amber-500/30",
    dotColor: "bg-amber-400",
    desc: "Build no-code algorithmic strategies using 10 technical indicators, run 12-month backtests with institutional metrics, and paper-trade live signals automatically.",
    features: ["10 indicators: EMA, RSI, MACD, BB…", "12-month backtests in <30s", "CAGR, Sharpe, Sortino, Drawdown", "Live paper execution engine", "Signal & price alerts"],
    stack: ["Vue 3", "FastAPI", "Celery", "Redis"],
  },
];

const FEATURES = [
  { icon: "🔴", title: "Real-Time Market Data", desc: "Live NSE & BSE prices delivered via WebSocket. LTP refreshes in under 50ms for scalping and under 200ms platform-wide." },
  { icon: "🔐", title: "Unified Authentication", desc: "One account, all four modules. Firebase-based auth with secure session management across the platform." },
  { icon: "📈", title: "Institutional Metrics", desc: "Backtest results include CAGR, Sharpe Ratio, Sortino Ratio, Max Drawdown, and Profit Factor — the same metrics professionals use." },
  { icon: "⚙️", title: "No-Code Strategy Builder", desc: "Build algorithmic strategies using 10 indicators with AND/OR logic. No programming required — just configure and backtest." },
  { icon: "🏆", title: "Expert Leaderboards", desc: "Discover top paper traders ranked by 7D, 30D, 90D, and ALL-time returns. Follow the best and copy their strategy automatically." },
  { icon: "🛡️", title: "Zero Financial Risk", desc: "Paper trading only. No broker API. No real money. No margin calls. AlphaSync is purely educational — your capital stays safe." },
  { icon: "🔔", title: "Smart Alerts", desc: "Set price alerts, strategy signal notifications, and auto-close triggers. Never miss a critical market move during your sessions." },
  { icon: "📊", title: "Deep Analytics", desc: "Session win rates, R:R ratios, equity curves, trade journals, and P&L breakdowns — across every module and every session." },
  { icon: "⚡", title: "Panic Button", desc: "One keystroke closes all your open scalping positions immediately. Perfect for practising discipline and emergency risk management." },
];

const STEPS = [
  { n: 1, title: "Create Your Account", desc: "Register with your email. Get ₹10,00,000 of virtual capital instantly. No KYC, no broker linking, no payment required." },
  { n: 2, title: "Choose Your Module", desc: "Pick the module that matches your trading style — from long-term portfolio building to high-frequency scalping or algorithmic strategies." },
  { n: 3, title: "Trade, Learn & Grow", desc: "Execute paper trades with real market data, analyse your performance, refine your strategy, and gain the confidence to trade live." },
];

const PLATFORM_STATS = [
  { v: "10", label: "Built-in Technical Indicators", sub: "EMA · SMA · RSI · MACD · BB · VWAP · ATR · Stoch · ADX · CCI" },
  { v: "<30s", label: "Backtest Speed", sub: "12 months of OHLCV data processed per strategy" },
  { v: "33", label: "Database Tables", sub: "Across 5 schemas: auth · vtp · st · ct · at" },
];

const TECH_STACK = [
  { icon: "⚛️", name: "React 18", desc: "Virtual Trade Pro frontend" },
  { icon: "💚", name: "Vue 3 + Pinia", desc: "ST, CT & AT frontends" },
  { icon: "🐍", name: "FastAPI", desc: "All backend services" },
  { icon: "🐘", name: "PostgreSQL 16", desc: "Primary database" },
  { icon: "🔴", name: "Redis 7", desc: "Cache, pub/sub & sessions" },
  { icon: "🌐", name: "Nginx", desc: "API gateway + SSL termination" },
  { icon: "🔥", name: "Firebase Auth", desc: "Authentication & identity" },
  { icon: "🐳", name: "Docker", desc: "Container orchestration" },
];

const STATS_BAR = [
  { v: "4", label: "Trading Modules", target: 4 },
  { v: "33", label: "Database Tables", target: 33 },
  { v: "<50ms", label: "LTP Feed Latency" },
  { v: "₹0", label: "Real Capital at Risk" },
];

/* ─── Scroll-reveal hook ─────────────────────────────────────── */
function useFadeUp() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("landing-visible"); obs.unobserve(el); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function FadeUp({ children, className = "", delay = 0, ...props }) {
  const ref = useFadeUp();
  return (
    <div ref={ref} className={`landing-fade-up ${className}`} style={{ transitionDelay: `${delay}s` }} {...props}>
      {children}
    </div>
  );
}

/* ─── Ticker ─────────────────────────────────────────────────── */
function Ticker() {
  const items = [...TICKER, ...TICKER];
  return (
    <div className="mt-16 bg-surface-900/60 border border-edge/10 rounded-2xl px-5 py-3.5 flex items-center gap-5 overflow-hidden">
      <span className="text-[11px] font-bold tracking-widest uppercase text-[#0099FF] whitespace-nowrap border-r border-edge/10 pr-5">
        NSE Live
      </span>
      <div className="overflow-hidden flex-1">
        <div className="flex gap-10 animate-marquee will-change-transform whitespace-nowrap">
          {items.map((t, i) => (
            <span key={i} className="inline-flex items-center gap-2.5 text-[13px] font-semibold">
              <span className="text-gray-500">{t.s}</span>
              <span className="text-gray-300">{t.p}</span>
              <span className={t.up ? "text-profit" : "text-loss"}>{t.c}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function LandingPage() {
  const isAuthenticated = !!useAuthStore((s) => s.user);

  return (
    <div className="min-h-screen bg-surface-950 text-heading overflow-x-hidden">
      {/* ── Nav ─────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-surface-950/85 border-b border-edge/10">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between h-[68px]">
          <a href="#" className="flex items-center">
            <img src="/logo.png" alt="AlphaSync" className="h-9 rounded-lg object-contain dark:brightness-100 brightness-0" />
          </a>
          <div className="hidden md:flex items-center gap-8">
            {[["#modules", "Modules"], ["#how", "How It Works"], ["#features", "Features"], ["#stack", "Tech Stack"]].map(([href, text]) => (
              <a key={href} href={href} className="text-sm font-medium text-gray-400 hover:text-[#0099FF] transition-colors">{text}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link to="/dashboard" className="landing-btn-primary text-sm">
                Dashboard <HiArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="landing-btn-ghost text-sm">Sign In</Link>
                <Link to="/register" className="landing-btn-primary text-sm">Get Early Access</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────── */}
      <section className="pt-40 pb-24 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-[800px] h-[800px] rounded-full top-[-200px] left-1/2 -translate-x-1/2" style={{ background: "radial-gradient(circle, rgba(0,153,255,0.12) 0%, transparent 70%)" }} />
          <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(0,153,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,153,255,0.04) 1px, transparent 1px)", backgroundSize: "60px 60px", maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)" }} />
        </div>
        <div className="max-w-[1200px] mx-auto px-6 relative">
          <div className="text-center max-w-[800px] mx-auto">
            <FadeUp>
              <div className="inline-flex items-center gap-1.5 bg-[#0099FF]/10 border border-[#0099FF]/30 text-[#00D4FF] px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-pulse" />
                Now in Beta — Indian Markets
              </div>
            </FadeUp>
            <FadeUp delay={0.05}>
              <p className="text-[13px] font-bold tracking-[3px] uppercase text-[#00D4FF] mb-3">
                Thriving, Securely
              </p>
            </FadeUp>
            <FadeUp delay={0.1}>
              <h1 className="text-[clamp(40px,6vw,72px)] font-extrabold leading-[1.1] tracking-tight mb-6">
                Paper Trading,<br />
                <span className="bg-gradient-to-r from-[#0099FF] to-[#00D4FF] bg-clip-text text-transparent">
                  Perfected.
                </span>
              </h1>
            </FadeUp>
            <FadeUp delay={0.15}>
              <p className="text-lg text-gray-400 max-w-[600px] mx-auto mb-10 leading-relaxed">
                AlphaSync is India&apos;s most comprehensive paper trading platform.
                Practice strategies, copy expert traders, run backtests, and scalp the markets —
                all without risking a single rupee.
              </p>
            </FadeUp>
            <FadeUp delay={0.2}>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link to="/register" className="landing-btn-primary landing-btn-lg">
                  Start Paper Trading Free <HiArrowRight className="w-4 h-4" />
                </Link>
                <a href="#modules" className="landing-btn-ghost landing-btn-lg">Explore Modules</a>
              </div>
            </FadeUp>
            <FadeUp delay={0.25}>
              <Ticker />
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ──────────────────────────────── */}
      <div className="border-y border-edge/10 bg-surface-900/50 py-8">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {STATS_BAR.map((s, i) => (
              <FadeUp key={i} delay={i * 0.1} className="text-center py-4 lg:border-r border-edge/10 last:border-r-0">
                <div className="text-[40px] font-extrabold bg-gradient-to-r from-[#0099FF] to-[#00D4FF] bg-clip-text text-transparent leading-tight mb-1">
                  {s.v}
                </div>
                <div className="text-[13px] text-gray-500 font-medium">{s.label}</div>
              </FadeUp>
            ))}
          </div>
        </div>
      </div>

      {/* ── Modules ─────────────────────────────────── */}
      <section className="py-24" id="modules">
        <div className="max-w-[1200px] mx-auto px-6">
          <FadeUp className="text-center mb-14">
            <div className="inline-flex items-center gap-1.5 bg-[#0099FF]/10 border border-[#0099FF]/30 text-[#00D4FF] px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-pulse" />
              Four Modules
            </div>
            <h2 className="text-[clamp(28px,4vw,42px)] font-extrabold tracking-tight mb-4">
              One Platform.<br /><span className="bg-gradient-to-r from-[#0099FF] to-[#00D4FF] bg-clip-text text-transparent">Every Trading Style.</span>
            </h2>
            <p className="text-base text-gray-400 max-w-lg mx-auto">
              Whether you&apos;re a beginner, a scalper, a social follower, or an algo enthusiast — AlphaSync has a module built for you.
            </p>
          </FadeUp>
          <div className="grid md:grid-cols-2 gap-6">
            {MODULES.map((m, i) => (
              <FadeUp key={i} delay={i * 0.1}>
                <div className={`group bg-surface-900/60 border border-edge/10 rounded-2xl p-8 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-${m.color}-500/40 hover:shadow-[0_20px_60px_rgba(0,153,255,0.15)]`}>
                  <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-${m.color}-400 to-${m.color}-500`} />
                  <div className="text-2xl mb-5 w-[52px] h-[52px] rounded-xl bg-white/5 border border-white/8 flex items-center justify-center">{m.icon}</div>
                  <div className={`text-[11px] font-bold uppercase tracking-[1.5px] ${m.colorClass.split(" ")[0]} mb-2`}>{m.tag}</div>
                  <h3 className="text-[22px] font-bold mb-3">{m.title}</h3>
                  <p className="text-[14px] text-gray-400 leading-relaxed mb-5">{m.desc}</p>
                  <ul className="flex flex-col gap-2 mb-5">
                    {m.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-[13px] text-gray-400">
                        <span className={`w-1.5 h-1.5 rounded-full ${m.dotColor} flex-shrink-0`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-1.5">
                    {m.stack.map((s) => (
                      <span key={s} className="text-[11px] font-semibold text-gray-500 bg-white/5 border border-edge/10 px-2.5 py-0.5 rounded-md">{s}</span>
                    ))}
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────── */}
      <section className="py-24 bg-surface-900/50" id="how">
        <div className="max-w-[1200px] mx-auto px-6">
          <FadeUp className="text-center mb-14">
            <div className="inline-flex items-center gap-1.5 bg-[#0099FF]/10 border border-[#0099FF]/30 text-[#00D4FF] px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-pulse" />
              Simple to Start
            </div>
            <h2 className="text-[clamp(28px,4vw,42px)] font-extrabold tracking-tight mb-4">
              Up and Running in <span className="bg-gradient-to-r from-[#0099FF] to-[#00D4FF] bg-clip-text text-transparent">3 Steps</span>
            </h2>
            <p className="text-base text-gray-400">No broker account. No real money. No risk. Just smart trading practice.</p>
          </FadeUp>
          <div className="grid md:grid-cols-3 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-8 left-[calc(33.33%+20px)] right-[calc(33.33%+20px)] h-0.5 bg-gradient-to-r from-[#0099FF] to-[#00D4FF]" />
            {STEPS.map((s, i) => (
              <FadeUp key={i} delay={i * 0.15} className="text-center px-6 py-10">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0099FF] to-[#00D4FF] text-white text-[22px] font-extrabold flex items-center justify-center mx-auto mb-6 relative z-10 shadow-[0_0_0_8px_rgb(var(--surface-900)),0_0_0_9px_rgb(var(--c-edge)/0.3)]">
                  {s.n}
                </div>
                <h3 className="text-lg font-bold mb-3">{s.title}</h3>
                <p className="text-[14px] text-gray-400 leading-relaxed">{s.desc}</p>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────── */}
      <section className="py-24" id="features">
        <div className="max-w-[1200px] mx-auto px-6">
          <FadeUp className="text-center mb-14">
            <div className="inline-flex items-center gap-1.5 bg-[#0099FF]/10 border border-[#0099FF]/30 text-[#00D4FF] px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-pulse" />
              Platform Features
            </div>
            <h2 className="text-[clamp(28px,4vw,42px)] font-extrabold tracking-tight mb-4">
              Built for <span className="bg-gradient-to-r from-[#0099FF] to-[#00D4FF] bg-clip-text text-transparent">Serious Traders</span>
            </h2>
            <p className="text-base text-gray-400 max-w-lg mx-auto">
              Every feature is designed to give you the most realistic, educational paper trading experience possible.
            </p>
          </FadeUp>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <FadeUp key={i} delay={i * 0.05}>
                <div className="bg-surface-900/60 border border-edge/10 rounded-2xl p-7 transition-all duration-300 hover:border-[#0099FF]/40 hover:-translate-y-0.5">
                  <div className="text-[32px] mb-4">{f.icon}</div>
                  <h3 className="text-base font-bold mb-2">{f.title}</h3>
                  <p className="text-[13px] text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Platform Stats ──────────────────────────── */}
      <section className="py-24 bg-surface-900/50">
        <div className="max-w-[1200px] mx-auto px-6">
          <FadeUp className="text-center mb-14">
            <div className="inline-flex items-center gap-1.5 bg-[#0099FF]/10 border border-[#0099FF]/30 text-[#00D4FF] px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-pulse" />
              By the Numbers
            </div>
            <h2 className="text-[clamp(28px,4vw,42px)] font-extrabold tracking-tight">
              Platform <span className="bg-gradient-to-r from-[#0099FF] to-[#00D4FF] bg-clip-text text-transparent">at a Glance</span>
            </h2>
          </FadeUp>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PLATFORM_STATS.map((s, i) => (
              <FadeUp key={i} delay={i * 0.1}>
                <div className="bg-surface-950/80 border border-edge/10 rounded-2xl py-10 px-7 text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0099FF]/4 to-transparent" />
                  <div className="relative">
                    <div className="text-[52px] font-black tracking-tighter bg-gradient-to-r from-[#0099FF] to-[#00D4FF] bg-clip-text text-transparent mb-2">{s.v}</div>
                    <div className="text-[14px] text-gray-300 font-medium mb-1">{s.label}</div>
                    <div className="text-[12px] text-gray-500">{s.sub}</div>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech Stack ──────────────────────────────── */}
      <section className="py-24" id="stack">
        <div className="max-w-[1200px] mx-auto px-6">
          <FadeUp className="text-center mb-14">
            <div className="inline-flex items-center gap-1.5 bg-[#0099FF]/10 border border-[#0099FF]/30 text-[#00D4FF] px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-pulse" />
              Open Technology
            </div>
            <h2 className="text-[clamp(28px,4vw,42px)] font-extrabold tracking-tight mb-4">
              Built on <span className="bg-gradient-to-r from-[#0099FF] to-[#00D4FF] bg-clip-text text-transparent">Modern Stack</span>
            </h2>
            <p className="text-base text-gray-400 max-w-lg mx-auto">
              Production-grade technologies chosen for performance, reliability, and developer experience.
            </p>
          </FadeUp>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {TECH_STACK.map((t, i) => (
              <FadeUp key={i} delay={i * 0.05}>
                <div className="bg-surface-900/60 border border-edge/10 rounded-xl px-5 py-6 text-center transition-all duration-200 hover:border-[#0099FF]/40 hover:bg-surface-800/60">
                  <div className="text-[28px] mb-2.5">{t.icon}</div>
                  <div className="text-[14px] font-bold mb-1">{t.name}</div>
                  <div className="text-[11px] text-gray-500">{t.desc}</div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, rgba(0,153,255,0.08) 0%, transparent 70%)" }} />
        <div className="max-w-[620px] mx-auto px-6 relative text-center">
          <FadeUp>
            <div className="inline-flex items-center gap-1.5 bg-[#0099FF]/10 border border-[#0099FF]/30 text-[#00D4FF] px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-pulse" />
              Early Access Open
            </div>
            <h2 className="text-[clamp(28px,4vw,42px)] font-extrabold tracking-tight mb-4">
              Start Paper Trading <span className="bg-gradient-to-r from-[#0099FF] to-[#00D4FF] bg-clip-text text-transparent">for Free</span>
            </h2>
            <p className="text-base text-gray-400 mb-10">
              Join thousands of Indian traders practising strategies on AlphaSync. No broker account needed. Get started today.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <Link to="/register" className="landing-btn-primary landing-btn-lg flex-1">
                Create Free Account <HiArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/login" className="landing-btn-ghost landing-btn-lg">
                Sign In
              </Link>
            </div>
            <div className="mt-5 flex items-center justify-center gap-5">
              {["No credit card", "Paper trading only", "Free forever"].map((t) => (
                <span key={t} className="text-[12px] text-gray-500 flex items-center gap-1.5">
                  <span className="text-profit font-bold">✓</span> {t}
                </span>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="bg-surface-900/60 border-t border-edge/10 pt-16 pb-10">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12" style={{ gridTemplateColumns: "1.5fr 1fr 1fr 1fr" }}>
            <div>
              <img src="/logo.png" alt="AlphaSync" className="h-8 rounded-lg object-contain dark:brightness-100 brightness-0 mb-4" />
              <p className="text-[13px] text-gray-500 leading-relaxed max-w-[260px]">
                AlphaSync is India&apos;s integrated paper trading platform. Practice every trading style — without risking a rupee.
              </p>
              <p className="mt-3 text-[12px] text-gray-600">by <span className="text-[#0099FF] font-semibold">Vianmax™</span></p>
            </div>
            <div>
              <h4 className="text-[13px] font-bold uppercase tracking-widest text-gray-500 mb-4">Modules</h4>
              <ul className="flex flex-col gap-2.5">
                {["Virtual Trade Pro", "Scalping Trade", "Copy Trade", "Auto Trade"].map((l) => (
                  <li key={l}><a href="#modules" className="text-[13px] text-gray-400 hover:text-[#0099FF] transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[13px] font-bold uppercase tracking-widest text-gray-500 mb-4">Platform</h4>
              <ul className="flex flex-col gap-2.5">
                {[["#how", "How It Works"], ["#features", "Features"], ["#stack", "Tech Stack"]].map(([href, text]) => (
                  <li key={href}><a href={href} className="text-[13px] text-gray-400 hover:text-[#0099FF] transition-colors">{text}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[13px] font-bold uppercase tracking-widest text-gray-500 mb-4">Legal</h4>
              <ul className="flex flex-col gap-2.5">
                {["Privacy Policy", "Terms of Use", "Disclaimer", "Contact Us"].map((l) => (
                  <li key={l}><a href="#" className="text-[13px] text-gray-400 hover:text-[#0099FF] transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-edge/10 pt-7 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[13px] text-gray-500">© 2026 Vianmax™. AlphaSync is a paper trading simulator. No real capital or broker API involved.</p>
            <div className="flex gap-3">
              {[["𝕏", "Twitter/X"], ["in", "LinkedIn"], ["⌥", "GitHub"]].map(([icon, title]) => (
                <a key={title} href="#" title={title} className="w-9 h-9 rounded-lg bg-surface-800/80 border border-edge/10 flex items-center justify-center text-gray-500 text-[14px] hover:border-[#0099FF]/40 hover:text-[#0099FF] hover:bg-[#0099FF]/8 transition-all">
                  {icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
