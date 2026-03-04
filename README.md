<p align="center">
  <img src="frontend/public/logo.png" alt="AlphaSync Logo" height="60" />
</p>

<h1 align="center">AlphaSync — Virtual Stock Trading Platform</h1>

<p align="center">
  <strong>Practice stock trading with ₹10,00,000 virtual money. Zero risk. Real market data. Professional tools.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-0.109-009688?logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/Zustand-5-orange" />
  <img src="https://img.shields.io/badge/TailwindCSS-3-06B6D4?logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/License-Private-red" />
</p>

---

## 📖 What is AlphaSync?

AlphaSync is a **virtual (paper) trading platform** for the Indian stock market. Think of it as a **flight simulator, but for trading stocks**.

- You get **₹10,00,000 of virtual money** when you sign up — completely free
- You can **buy and sell real Indian stocks** (NIFTY 50, SENSEX, etc.) using **real-time market prices**
- Your money is virtual, so there's **zero financial risk** — but the experience is exactly like real trading
- It includes **professional-grade charts**, **automated trading bots**, and a unique **ZeroLoss strategy** that guarantees no net losses

**Who is it for?**
- 🎓 **Students** learning how the stock market works
- 📈 **Beginners** who want to practice before investing real money
- 🤖 **Traders** who want to test automated strategies safely
- 👨‍🏫 **Instructors** teaching finance and trading

---

## 🏗️ Architecture Overview

AlphaSync has two main parts that work together:

```
┌─────────────────────────────────────────────────────────────────┐
│                        YOUR BROWSER                             │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              Frontend (React App)                       │   │
│   │                                                         │   │
│   │  Landing → Login/Register → Select Mode → Select Broker │   │
│   │                        ↓                                │   │
│   │  ┌───────────┬──────────────┬──────────────────────┐    │   │
│   │  │ Dashboard  │   Trading    │  Portfolio / Algo /  │    │   │
│   │  │           │   Terminal   │  ZeroLoss / Settings │    │   │
│   │  └───────────┴──────────────┴──────────────────────┘    │   │
│   └──────────────────────┬──────────────────────────────────┘   │
│                          │                                      │
│           REST API calls + WebSocket (real-time)                │
└──────────────────────────┼──────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│                     BACKEND SERVER                              │
│                                                                 │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│   │   Auth   │  │  Market  │  │ Trading  │  │   Strategy   │   │
│   │ Service  │  │   Data   │  │  Engine  │  │   Engines    │   │
│   └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
│                                                                 │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│   │   Risk   │  │  Event   │  │Background│  │  WebSocket   │   │
│   │  Engine  │  │   Bus    │  │ Workers  │  │   Manager    │   │
│   └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
│                                                                 │
│                    ┌──────────────┐                              │
│                    │   Database   │                              │
│                    │ SQLite/Postgres│                            │
│                    └──────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    │Yahoo Finance│
                    │  (Live NSE  │
                    │   Prices)   │
                    └─────────────┘
```

### In Simple Terms

| Part | What It Does | Like... |
|------|-------------|---------|
| **Frontend** | The app you see and interact with in your browser | The dashboard of a car |
| **Backend** | The brain that processes all your trades and data | The engine under the hood |
| **Database** | Stores all your data — account, trades, portfolio | Your filing cabinet |
| **Yahoo Finance** | Provides real stock prices from NSE (National Stock Exchange) | A live price feed from the market |
| **WebSocket** | Pushes live price updates to your screen instantly | A live radio broadcast |
| **Event Bus** | Internal messaging system that coordinates everything | A post office routing mail between departments |

---

## 🔄 How It Works — The User Journey

```
  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
  │ Landing  │────▶│ Register │────▶│  Select  │────▶│  Select  │
  │   Page   │     │ /Login   │     │   Mode   │     │  Broker  │
  └──────────┘     └──────────┘     └──────────┘     └──────────┘
                                                           │
                        ┌──────────────────────────────────┘
                        ▼
  ┌──────────────────────────────────────────────────────────────┐
  │                    Main Application                          │
  │                                                              │
  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐ │
  │  │ Dashboard │  │  Trading  │  │ Portfolio │  │  Settings │ │
  │  │ Overview  │  │ Terminal  │  │  Manager  │  │   Page    │ │
  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘ │
  │                                                              │
  │  ┌───────────┐  ┌───────────┐                                │
  │  │   Algo    │  │ ZeroLoss  │                                │
  │  │  Trading  │  │ Strategy  │                                │
  │  └───────────┘  └───────────┘                                │
  └──────────────────────────────────────────────────────────────┘
```

### Step-by-Step Flow

1. **Landing Page** — See what AlphaSync offers (features, live ticker, stats)
2. **Register** — Create your account (name, email, password) → You instantly receive ₹10,00,000 virtual capital
3. **Select Trading Mode** — Choose "Demo Trading" (other modes like Live, Options, Crypto are coming soon)
4. **Select Broker** — Pick a broker (Zebull is active; Zerodha, Angel One, Upstox, Groww, Dhan coming soon)
5. **Dashboard** — See your portfolio value, market indices, quick stats, and recent orders
6. **Trading Terminal** — The main trading screen with charts, watchlist, and order placement
7. **Portfolio** — View all your holdings, invested value, and profit/loss
8. **Algo Trading** — Create automated trading bots using strategies like SMA, RSI, MACD
9. **ZeroLoss** — A unique AI-powered strategy that guarantees zero net losses
10. **Settings** — Profile, avatar, password, 2FA security, and theme (dark/light mode)

---

## 🖥️ Frontend Architecture

The frontend is what you see in your browser. It's built with **React** — a popular framework for building interactive user interfaces.

### Tech Stack

| Technology | Purpose |
|-----------|---------|
| **React 18** | Building the user interface (pages, buttons, forms) |
| **Vite** | Ultra-fast development server and build tool |
| **Tailwind CSS** | Styling — makes everything look beautiful with utility classes |
| **Zustand** | State management — keeps data in sync across all pages |
| **Lightweight Charts** | Professional TradingView-style candlestick charts |
| **React Router** | Navigation between pages without full page reloads |
| **Axios** | Communicates with the backend server |
| **React Hot Toast** | Beautiful notification popups |

### Folder Structure

```
frontend/src/
│
├── pages/                    ← Full pages (one per screen)
│   ├── LandingPage.jsx          Homepage / marketing page
│   ├── LoginPage.jsx            User login with 2FA support
│   ├── RegisterPage.jsx         Account creation
│   ├── TradingModeSelectPage    Choose trading mode
│   ├── BrokerSelectPage.jsx     Choose your broker
│   ├── SettingsPage.jsx         Profile, security, theme
│   └── ... (Portfolio, Algo, ZeroLoss pages)
│
├── workspaces/               ← Advanced page layouts
│   ├── DashboardWorkspace.jsx   Main dashboard (newer version)
│   └── TradingWorkspace.jsx     Professional trading terminal
│
├── components/               ← Reusable building blocks
│   ├── layout/                  App shell, sidebar, navbar, ticker bar
│   ├── trading/                 Chart, watchlist, order panel
│   ├── portfolio/               Holdings table, P&L cards
│   ├── ui/                      Buttons, inputs, modals, tooltips
│   ├── ProtectedRoute.jsx       Blocks unauthenticated users
│   ├── ErrorBoundary.jsx        Catches & displays errors gracefully
│   └── ForceDarkMode.jsx        Forces dark theme on specific pages
│
├── panels/                   ← Dockable content panels
│   ├── PositionsPanel.jsx       Open positions table
│   └── OrderHistoryPanel.jsx    Recent orders table
│
├── stores/                   ← Zustand state stores (global data)
│   ├── useAuthStore.js          User login state & tokens
│   ├── useWatchlistStore.js     Multi-watchlist management
│   ├── useZeroLossStore.js      ZeroLoss strategy state
│   ├── useMarketIndicesStore.js Market ticker data
│   └── useStrategyStore.js      Client-side strategy state
│
├── store/                    ← Additional stores
│   ├── useMarketStore.js        Live price quote cache
│   └── usePortfolioStore.js     Holdings & orders
│
├── hooks/                    ← Custom React hooks
│   ├── useWebSocket.js          Real-time price updates
│   ├── useMarketData.js         Fetch quotes & candle history
│   ├── useOrders.js             Order form logic & submission
│   ├── useSearch.js             Stock search with autocomplete
│   ├── useBreakpoint.js         Responsive layout detection
│   ├── useKeyboardShortcuts.js  Keyboard shortcut bindings
│   └── useDraggable.js          Drag-and-drop for floating panels
│
├── strategy/                 ← Client-side technical analysis
│   ├── engine/                  Aggregates 5 weighted strategies
│   ├── indicators/              14 technical indicators (SMA, EMA, RSI, MACD...)
│   ├── strategies/              16 strategy implementations
│   └── components/              Strategy dock UI (floating popup)
│
├── services/
│   └── api.js                   Axios HTTP client with JWT auth
│
├── context/
│   ├── ThemeContext.jsx          Dark/light theme management
│   └── AuthContext.jsx          Legacy auth context
│
├── utils/                    ← Helper functions
│   ├── formatters.js            Currency (₹), percent, date formatting
│   ├── validators.js            Form & order validation
│   ├── constants.js             App-wide constants & config
│   └── cn.js                    CSS class name merger
│
├── App.jsx                   ← Root: routing, theme, providers
├── main.jsx                  ← Entry point
└── index.css                 ← Global styles & design tokens
```

### How the Frontend Manages Data

Think of **Zustand stores** like shared notebooks that any page can read from or write to:

```
┌─────────────────────────────────────────────────────────────┐
│                     Zustand Stores                          │
│  (Shared data accessible from anywhere in the app)         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐        │
│  │  Auth Store │  │Market Store │  │Portfolio Store│        │
│  │ • User info │  │ • Live quotes│  │ • Holdings   │        │
│  │ • JWT token │  │ • WS status │  │ • Orders     │        │
│  │ • Login/out │  │ • Prices    │  │ • P&L        │        │
│  └─────────────┘  └─────────────┘  └──────────────┘        │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐        │
│  │Watchlist    │  │ ZeroLoss   │  │ Market Index │        │
│  │Store        │  │ Store      │  │ Store        │        │
│  │ • Lists     │  │ • Signals  │  │ • NIFTY      │        │
│  │ • Symbols   │  │ • Positions│  │ • SENSEX     │        │
│  │ • Prices    │  │ • Stats    │  │ • BANKNIFTY  │        │
│  └─────────────┘  └─────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
         ▲                    ▲                  ▲
         │     REST API       │    WebSocket     │   Polling
         │    (on demand)     │  (real-time)     │  (periodic)
         ▼                    ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend Server                           │
└─────────────────────────────────────────────────────────────┘
```

### Client-Side Strategy Engine

AlphaSync includes a **strategy analysis engine that runs entirely in your browser** — no server needed:

| Category | What's Included |
|----------|----------------|
| **14 Technical Indicators** | SMA, EMA, RSI, MACD, Bollinger Bands, VWAP, ATR, ADX, CCI, Stochastic, Ichimoku, HMA, Supertrend |
| **16 Trading Strategies** | Moving Average Cross, RSI Momentum, MACD Histogram, Bollinger Bands, Ichimoku, Supertrend, and more |
| **5 Core Engine Strategies** | EMA Cross (25%), RSI Momentum (20%), Volume-Price (15%), Golden RSI (20%), Trend Detector (20%) |

The engine scores each strategy independently and combines them into an overall **BULLISH / BEARISH / NEUTRAL** signal with a confidence percentage.

### Theme System

| Pages | Theme |
|-------|-------|
| Landing, Login, Register, Mode Select, Broker Select | **Always dark mode** (forced) |
| Dashboard, Terminal, Portfolio, Algo, ZeroLoss, Settings | **User's choice** (dark or light toggle in navbar) |

---

## ⚙️ Backend Architecture

The backend is the **server** that runs on your computer (or in the cloud). It handles all the heavy lifting — processing trades, fetching market data, running algorithms, and storing your data.

### Tech Stack

| Technology | Purpose |
|-----------|---------|
| **FastAPI** (Python) | Web framework — handles API requests |
| **SQLAlchemy** | Database toolkit — reads/writes to the database |
| **SQLite** (dev) / **PostgreSQL** (prod) | Stores all user data, trades, portfolios |
| **yfinance** | Fetches real-time NSE stock prices from Yahoo Finance |
| **JWT (JSON Web Tokens)** | Secure authentication tokens |
| **bcrypt** | Password hashing (encryption) |
| **pyotp** | Two-factor authentication (2FA) with TOTP codes |
| **WebSocket** | Pushes real-time updates to the browser |

### Folder Structure

```
backend/
│
├── main.py                   ← Application entry point
│                                Starts server, registers routes,
│                                launches background workers
│
├── config/
│   └── settings.py              All configuration (DB, JWT, limits, intervals)
│
├── database/
│   └── connection.py            Database engine setup & session management
│
├── routes/                   ← API endpoints (what the frontend calls)
│   ├── auth.py                  Login, register, 2FA, logout
│   ├── market.py                Stock quotes, search, history, indices
│   ├── orders.py                Place, list, cancel orders
│   ├── portfolio.py             Portfolio summary, holdings
│   ├── user.py                  Profile, avatar, password change
│   ├── algo.py                  Create & manage algo strategies
│   ├── watchlist.py             Watchlist CRUD operations
│   └── zeroloss.py              ZeroLoss strategy endpoints
│
├── models/                   ← Database table definitions
│   ├── user.py                  Users, sessions, 2FA
│   ├── order.py                 Buy/sell orders
│   ├── portfolio.py             Portfolio, holdings, transactions
│   ├── algo.py                  Algo strategies, trades, logs
│   └── watchlist.py             Watchlists and items
│
├── services/                 ← Business logic
│   ├── auth_service.py          Password hashing, JWT, 2FA utilities
│   ├── market_data.py           Yahoo Finance integration + caching
│   ├── trading_engine.py        Order placement & execution logic
│   ├── portfolio_service.py     Portfolio calculations with live prices
│   ├── algo_engine.py           Algo strategy CRUD operations
│   └── nse_stocks.py            Database of ~280 NSE stocks
│
├── engines/                  ← Computation engines
│   ├── indicators.py            Technical indicators (SMA, EMA, RSI, MACD, etc.)
│   ├── signals.py               Strategy signal generation (BUY/SELL/HOLD)
│   ├── risk_engine.py           Pre-trade risk validation
│   └── market_session.py        NSE trading hours & holiday calendar
│
├── workers/                  ← Background tasks (run continuously)
│   ├── market_worker.py         Fetches live prices every 3 seconds
│   ├── order_worker.py          Checks pending orders every 5 seconds
│   ├── algo_worker.py           Runs algo strategies every 30 seconds
│   └── portfolio_worker.py      Recalculates portfolio on order fills
│
├── strategies/
│   └── zeroloss/             ← ZeroLoss strategy module
│       ├── controller.py        Main orchestrator (background loop)
│       ├── confidence_engine.py Score calculator (0-100)
│       ├── signal_generator.py  Trade signal creator
│       ├── breakeven_manager.py Cost calculator for zero-loss stops
│       └── models.py            ZeroLoss database tables
│
├── websocket/
│   └── manager.py               Real-time connection manager
│
├── core/
│   ├── event_bus.py             Internal messaging system
│   └── rate_limiter.py          API request throttling
│
├── Dockerfile                   Container configuration
└── requirements.txt             Python dependencies
```

### How the Backend Processes a Trade

Here's what happens step-by-step when you click "BUY" on a stock:

```
  You click "BUY 10 shares of RELIANCE"
                    │
                    ▼
  ┌──────────────────────────────────┐
  │     1. API receives order        │  ← POST /api/orders
  │     (routes/orders.py)           │
  └──────────────────┬───────────────┘
                     │
                     ▼
  ┌──────────────────────────────────┐
  │     2. Risk Engine validates     │  ← Is it safe to trade?
  │     • Position size ≤ 500 shares │
  │     • Capital per trade ≤ ₹2L    │
  │     • Portfolio exposure ≤ 80%   │
  │     • Daily loss limit ≤ ₹50K   │
  │     • Open orders ≤ 20          │
  └──────────────────┬───────────────┘
                     │ ✅ Passed
                     ▼
  ┌──────────────────────────────────┐
  │     3. Trading Engine executes   │
  │     • Fetches live price         │
  │     • MARKET order → fills now   │
  │     • LIMIT order → stays open   │
  └──────────────────┬───────────────┘
                     │
                     ▼
  ┌──────────────────────────────────┐
  │     4. Portfolio updated         │
  │     • Capital deducted           │
  │     • Holding added/updated      │
  │     • Transaction recorded       │
  └──────────────────┬───────────────┘
                     │
                     ▼
  ┌──────────────────────────────────┐
  │     5. Events emitted            │
  │     • ORDER_FILLED → WebSocket   │  ← You see it instantly
  │     • PORTFOLIO_UPDATED          │
  └──────────────────────────────────┘
```

### Background Workers — The Silent Engines

These run continuously in the background, keeping everything up to date:

| Worker | What It Does | How Often |
|--------|-------------|-----------|
| **Market Data Worker** | Fetches live stock prices from Yahoo Finance | Every **3 seconds** during market hours |
| **Order Execution Worker** | Checks if any pending LIMIT/STOP-LOSS orders should be filled | Every **5 seconds** |
| **Algo Strategy Worker** | Runs your automated trading bots (SMA, RSI, MACD strategies) | Every **30 seconds** |
| **Portfolio Worker** | Recalculates your portfolio value when orders fill | On every **order fill** event |
| **ZeroLoss Controller** | Scans for ZeroLoss trade signals and monitors active positions | Every **30 seconds** |

### Event Bus — The Internal Post Office

All workers communicate through an **Event Bus** (like an internal messaging system):

```
  Market Worker ──── PRICE_UPDATED ─────┐
                                        │
  Order Worker ──── ORDER_FILLED ───────┤
                                        ├──▶ Event Bus ──▶ WebSocket ──▶ Your Browser
  Algo Worker ──── ALGO_TRADE ──────────┤         │
                                        │         ├──▶ Portfolio Worker
  ZeroLoss ──── ZEROLOSS_SIGNAL ────────┘         │
                                                  └──▶ Database
```

**22 event types** are supported, including: price updates, order lifecycle (placed → filled → cancelled), portfolio changes, algo signals, risk breaches, and system events.

### Risk Engine — Your Safety Net

Every single order (manual or automated) must pass through the Risk Engine:

| Rule | Limit | What It Prevents |
|------|-------|-----------------|
| Max shares per order | 500 | Overly large positions |
| Max capital per trade | ₹2,00,000 | Putting too much into one trade |
| Portfolio exposure limit | 80% | Always keep 20% cash reserve |
| Daily loss limit | ₹50,000 | Prevents catastrophic daily losses |
| Max open orders | 20 | Keeps orders manageable |
| Kill switch | On/Off | Emergency stop for all algo trading |

---

## 🤖 ZeroLoss Strategy — How It Works

ZeroLoss is a unique **intraday (same-day) trading strategy** that guarantees you never lose money on a trade. Here's the concept in simple terms:

### The Core Idea

> When you buy a stock, your stop-loss (the price at which you sell to cut losses) is set at your **exact break-even point** — the price where you'd recover all trading costs. So the worst-case scenario is **₹0 loss**.

### How It Scores Confidence (0-100)

Before entering any trade, ZeroLoss calculates a **confidence score** by analyzing 6 factors:

| Factor | Max Points | What It Measures |
|--------|-----------|-----------------|
| **EMA Stack** | 25 pts | Are moving averages aligned? (Trending vs sideways) |
| **RSI Zone** | 20 pts | Is the stock overbought or in a sweet spot? |
| **MACD Momentum** | 15 pts | Is momentum building in the right direction? |
| **Volume** | 15 pts | Are enough people trading this stock? |
| **Volatility (VIX)** | 15 pts | Is the overall market calm or panicking? |
| **Support/Resistance** | 10 pts | Is the stock near a key price level? |

**Threshold**: A trade is only taken when confidence ≥ **60/100**.

### The Break-Even Math

When you buy a stock, you pay several **hidden costs** (brokerage, taxes, exchange fees). ZeroLoss calculates ALL of them:

| Cost Component | Rate |
|---------------|------|
| Brokerage | ₹20 or 0.03% (whichever is higher) |
| STT (Securities Transaction Tax) | 0.1% per side |
| Exchange charges | 0.00345% |
| SEBI fee | 0.0001% |
| GST | 18% on brokerage + charges |
| Stamp duty | 0.015% (buy only) |
| Slippage buffer | 0.01% |
| **Total round-trip cost** | **~0.25%** |

Your **stop-loss = entry price − total cost per share** (for buy trades), so the worst case is breaking even after all fees.

### ZeroLoss Workflow

```
  Every 30 seconds:
  ┌─────────────────────────────────┐
  │  1. Monitor active positions    │ ← Check if SL or target hit
  │     → Auto-close at 3:20 PM    │
  ├─────────────────────────────────┤
  │  2. Scan watchlist symbols      │ ← Fetch 1-year daily candles
  │     → Calculate 6-factor score  │
  ├─────────────────────────────────┤
  │  3. Score ≥ 60? → Enter trade   │ ← Place order with exact
  │     Score < 60? → Skip          │   SL and target prices
  └─────────────────────────────────┘
```

---

## 📊 Database Schema

All your data is stored in organized tables:

```
┌──────────────────────────────────────────────────────────────┐
│                        DATABASE                              │
│                                                              │
│  ┌──────────┐     ┌──────────┐     ┌──────────────┐         │
│  │  users   │────▶│portfolios│────▶│   holdings   │         │
│  │          │     │          │     │              │         │
│  │ email    │     │ capital  │     │ symbol       │         │
│  │ username │     │ value    │     │ quantity     │         │
│  │ password │     │ P&L      │     │ avg_price    │         │
│  │ capital  │     └──────────┘     │ current_val  │         │
│  └──────────┘                      └──────────────┘         │
│       │                                                      │
│       │         ┌──────────┐     ┌──────────────┐           │
│       ├────────▶│  orders  │────▶│ transactions │           │
│       │         │          │     │              │           │
│       │         │ symbol   │     │ type (BUY/   │           │
│       │         │ side     │     │       SELL)  │           │
│       │         │ quantity │     │ quantity     │           │
│       │         │ status   │     │ price        │           │
│       │         └──────────┘     └──────────────┘           │
│       │                                                      │
│       │         ┌──────────┐     ┌──────────────┐           │
│       ├────────▶│algo_     │────▶│ algo_trades  │           │
│       │         │strategies│     │ algo_logs    │           │
│       │         └──────────┘     └──────────────┘           │
│       │                                                      │
│       │         ┌──────────┐     ┌──────────────┐           │
│       ├────────▶│watchlists│────▶│watchlist_items│           │
│       │         └──────────┘     └──────────────┘           │
│       │                                                      │
│       │         ┌──────────────┐  ┌──────────────┐           │
│       └────────▶│user_sessions │  │two_factor_   │           │
│                 └──────────────┘  │auth          │           │
│                                   └──────────────┘           │
│                                                              │
│  ┌──────────────────┐  ┌─────────────────────┐              │
│  │zeroloss_signals  │  │zeroloss_performance │              │
│  │ confidence_score │  │ total_trades        │              │
│  │ direction        │  │ profit_trades       │              │
│  │ entry/SL/target  │  │ breakeven_trades    │              │
│  └──────────────────┘  │ net_pnl             │              │
│                        └─────────────────────┘              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔌 API Reference

All backend endpoints organized by category:

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|--------|---------|-------------|
| POST | `/register` | Create new account |
| POST | `/login` | Sign in (supports 2FA) |
| GET | `/me` | Get current user profile |
| POST | `/2fa/setup` | Set up two-factor auth |
| POST | `/2fa/verify` | Verify 2FA code |
| POST | `/2fa/disable` | Turn off 2FA |
| POST | `/refresh` | Refresh login token |
| POST | `/logout` | Sign out |

### Market Data (`/api/market`)
| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/quote/{symbol}` | Get live price for a stock |
| GET | `/search?q=` | Search for stocks by name |
| GET | `/history/{symbol}` | Get price history (candles) |
| GET | `/indices` | NIFTY 50, SENSEX, BANKNIFTY, NIFTY IT |
| GET | `/ticker` | All indices + popular stocks for ticker bar |
| GET | `/popular` | List of 20 popular Indian stocks |
| GET | `/batch?symbols=` | Get prices for multiple stocks at once |

### Orders (`/api/orders`)
| Method | Endpoint | Description |
|--------|---------|-------------|
| POST | `/` | Place a new order |
| GET | `/` | List your orders |
| GET | `/{order_id}` | Get specific order details |
| DELETE | `/{order_id}` | Cancel a pending order |

### Portfolio (`/api/portfolio`)
| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/` | Portfolio summary with live P&L |
| GET | `/holdings` | All your stock holdings |
| GET | `/summary` | Combined summary + holdings |

### User Profile (`/api/user`)
| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/profile` | Your profile info |
| PUT | `/profile` | Update name, phone, avatar |
| PUT | `/password` | Change password |
| POST | `/avatar` | Upload profile picture |
| DELETE | `/avatar` | Remove profile picture |

### Algo Trading (`/api/algo`)
| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/strategies` | List your algo strategies |
| POST | `/strategies` | Create a new strategy |
| PUT | `/strategies/{id}/toggle` | Start/stop a strategy |
| PUT | `/strategies/{id}` | Update strategy settings |
| DELETE | `/strategies/{id}` | Delete a strategy |
| GET | `/strategies/{id}/logs` | View strategy execution logs |

### Watchlist (`/api/watchlist`)
| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/` | List all your watchlists |
| POST | `/` | Create a new watchlist |
| PATCH | `/{id}` | Rename a watchlist |
| DELETE | `/{id}` | Delete a watchlist |
| POST | `/{id}/items` | Add a stock to a watchlist |
| DELETE | `/{id}/items/{item_id}` | Remove a stock |

### ZeroLoss (`/api/zeroloss`)
| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/status` | Strategy state & confidence scores |
| POST | `/toggle` | Enable/disable ZeroLoss |
| GET | `/signal` | Latest signal for symbol(s) |
| GET | `/signals` | Signal history (paginated) |
| GET | `/performance` | Daily performance summary |
| GET | `/positions` | Active ZeroLoss positions |
| PUT | `/config` | Update strategy configuration |

---

## 🔐 Security

| Feature | Implementation |
|---------|---------------|
| **Password Storage** | bcrypt hashed (never stored in plain text) |
| **Authentication** | JWT tokens with expiry & session tracking |
| **Two-Factor Auth (2FA)** | TOTP-based (Google Authenticator compatible) |
| **Session Management** | JTI-based revocation (logout invalidates token) |
| **Rate Limiting** | Per-IP: Login 10/min, Register 5/min, API 120/min |
| **CORS** | Restricted to frontend origin only |
| **File Upload** | Avatar: JPG/PNG/GIF/WebP only, max 2MB |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and **npm** (for frontend)
- **Python** 3.11+ (for backend)
- **Git** (to clone the repository)

### Quick Start (Development)

**1. Clone the repository**
```bash
git clone <repository-url>
cd alphasync-react
```

**2. Start the Backend**
```bash
cd backend
pip install -r requirements.txt
python main.py
```
The backend API will be running at `http://localhost:8000`

**3. Start the Frontend**
```bash
cd frontend
npm install
npm run dev
```
The app will be available at `http://localhost:5173`

### Docker (Production)

```bash
docker-compose up --build
```

This starts three containers:
- **Backend** — Port 8000
- **Frontend** — Port 5173
- **PostgreSQL** — Port 5432

---

## 📐 Design Decisions

| Decision | Reasoning |
|----------|-----------|
| **Simulation mode ON by default** | Trading works 24/7 regardless of actual NSE hours — perfect for practice |
| **SQLite for dev, PostgreSQL for prod** | SQLite needs zero setup for development; PostgreSQL scales for production |
| **Event-driven architecture** | Workers don't call each other directly — they communicate through events, making the system modular and maintainable |
| **Client-side strategy engine** | Technical analysis runs in your browser for instant feedback without server round-trips |
| **Forced dark mode on auth pages** | Login/register pages are designed with dark aesthetics; app pages let you choose |
| **Zustand over Redux** | Simpler API, less boilerplate, built-in persistence — better for this project size |
| **Lazy-loaded pages** | Each page loads only when you navigate to it, keeping the initial load fast |
| **Yahoo Finance (yfinance)** | Free, reliable, real-time NSE data without requiring a broker API key |

---

## 📊 Key Numbers

| Metric | Value |
|--------|-------|
| Starting virtual capital | ₹10,00,000 |
| NSE stocks supported | ~280 |
| Technical indicators | 14 (client) + 7 (server) |
| Trading strategies | 16 (client) + 4 (server) |
| Background workers | 5 |
| API endpoints | 40+ |
| Event types | 22 |
| Market data refresh | Every 3 seconds |
| Order check interval | Every 5 seconds |

---

## 📁 Project Structure (Top Level)

```
alphasync-react/
├── backend/              ← Python FastAPI server
├── frontend/             ← React + Vite app
├── docker-compose.yml    ← Container orchestration
└── README.md             ← This file
```

---

<p align="center">
  Built with ❤️ for the Indian trading community<br/>
  <strong>AlphaSync</strong> — Trade smart. Learn faster. Risk nothing.
</p>
