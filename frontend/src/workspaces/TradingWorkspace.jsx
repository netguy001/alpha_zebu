// ─── TradingWorkspace ────────────────────────────────────────────────────────
// CSS Grid layout: Watchlist | (ChartHeader + Chart + BottomDock) | OrderPanel
// + floating StrategyDock
// Responsive: Desktop grid → Tablet (no watchlist) → Mobile (drawers + trade bar)
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { useMarketStore } from '../store/useMarketStore';
import { useWatchlistStore } from '../stores/useWatchlistStore';
import { useStrategyStore } from '../stores/useStrategyStore';
import { useMarketData } from '../hooks/useMarketData';
import { useBreakpoint } from '../hooks/useBreakpoint';
import ChartHeader from '../components/trading/ChartHeader';
import ZebuLiveChart from '../components/trading/ZebuLiveChart';
import Watchlist from '../components/trading/Watchlist';
import OrderPanel from '../components/trading/OrderPanel';
import ResizablePanel from '../components/layout/ResizablePanel';
import ResponsiveDrawer from '../components/layout/ResponsiveDrawer';
import DockContainer from '../components/layout/DockContainer';
import MobileTradeBar from '../components/layout/MobileTradeBar';
import { PositionsPanel, OrderHistoryPanel } from '../panels';
import { StrategyDock } from '../strategy/components';
import { runEngine, getAvailableStrategies } from '../strategy';
import ErrorBoundary from '../components/ErrorBoundary';
import { cn } from '../utils/cn';
import { CHART_PERIODS, DEFAULT_CHART_PERIOD } from '../utils/constants';
import { useZeroLossStore } from '../stores/useZeroLossStore';

// ── Main workspace ───────────────────────────────────────────────────────────
export default function TradingWorkspace() {
    const [searchParams] = useSearchParams();
    const initialSymbol = searchParams.get('symbol') || 'RELIANCE.NS';

    const [selectedSymbol, setSelectedSymbol] = useState(initialSymbol);
    const [chartPeriod, setChartPeriod] = useState(DEFAULT_CHART_PERIOD);
    const [isTerminalFocused, setIsTerminalFocused] = useState(false);
    const [strategyDockOpen, setStrategyDockOpen] = useState(false);
    const [bottomCollapsed, setBottomCollapsed] = useState(false);

    // Sync selectedSymbol when URL ?symbol= changes (e.g. ticker bar click)
    useEffect(() => {
        const urlSymbol = searchParams.get('symbol');
        if (urlSymbol && urlSymbol !== selectedSymbol) {
            setSelectedSymbol(urlSymbol);
        }
    }, [searchParams]);

    // Responsive drawer states
    const [watchlistDrawerOpen, setWatchlistDrawerOpen] = useState(false);
    const [orderDrawerOpen, setOrderDrawerOpen] = useState(false);

    // Breakpoint
    const { isMobile, isCompact, isWide } = useBreakpoint();

    // ── Stores ────────────────────────────────────────────────────────────────
    const { holdings, orders, refreshPortfolio } = usePortfolioStore();
    const batchUpdateQuotes = useMarketStore((s) => s.batchUpdateQuotes);

    // ── Watchlist store — FIX: use proper reactive selectors, NOT broken JS getters ──
    // The store previously had `get items()` and `get watchlistId()` as JS getters.
    // Those were removed. Now we must select raw state and derive what we need.
    const watchlists = useWatchlistStore((s) => s.watchlists);
    const activeId = useWatchlistStore((s) => s.activeId);
    const watchlistPrices = useWatchlistStore((s) => s.prices);
    const loadWatchlist = useWatchlistStore((s) => s.loadWatchlist);
    const fetchWatchlistPrices = useWatchlistStore((s) => s.fetchPrices);

    // Derive items safely — only recomputes when watchlists/activeId actually change
    const watchlistItems = useMemo(
        () => watchlists.find(w => w.id === activeId)?.items ?? [],
        [watchlists, activeId]
    );

    // Strategy store
    const setEngineOutput = useStrategyStore((s) => s.setEngineOutput);

    // ── Hooks ─────────────────────────────────────────────────────────────────
    const { quote, candles, isLoading: chartLoading, fetchCandles } = useMarketData(selectedSymbol);

    const zlConfidence = useZeroLossStore((s) => s.confidence[selectedSymbol] || null);

    // ── Derived: Trend data — locked to first candle load per symbol ─────────
    const trendLockRef = useRef({ symbol: null, data: null });

    const trendData = useMemo(() => {
        if (!candles || candles.length === 0) return trendLockRef.current.data;

        if (trendLockRef.current.symbol === selectedSymbol) {
            return trendLockRef.current.data;
        }

        const strategies = getAvailableStrategies();
        const enabledIds = strategies.map((s) => s.id);
        const result = runEngine(candles, enabledIds);
        setEngineOutput(result);
        const data = {
            overall: result.overall,
            confidence: result.confidence,
            weightedScore: result.weightedScore ?? 0,
        };
        trendLockRef.current = { symbol: selectedSymbol, data };
        return data;
    }, [candles, selectedSymbol, setEngineOutput]);

    // ── Effects ───────────────────────────────────────────────────────────────
    useEffect(() => {
        const cfg = CHART_PERIODS[chartPeriod] || CHART_PERIODS[DEFAULT_CHART_PERIOD];
        fetchCandles(cfg.period, cfg.interval);
    }, [selectedSymbol, chartPeriod, fetchCandles]);

    useEffect(() => { refreshPortfolio(); }, [refreshPortfolio]);
    useEffect(() => { loadWatchlist(); }, [loadWatchlist]);

    // FIX: watchlistItems is now always a valid array (never undefined),
    // so .length is safe. Poll every 5s for faster price updates.
    useEffect(() => {
        if (watchlistItems.length === 0) return;
        fetchWatchlistPrices();
        const id = setInterval(fetchWatchlistPrices, 5_000);
        return () => clearInterval(id);
    }, [watchlistItems, fetchWatchlistPrices]);

    useEffect(() => {
        if (Object.keys(watchlistPrices).length > 0) {
            batchUpdateQuotes(watchlistPrices);
        }
    }, [watchlistPrices, batchUpdateQuotes]);

    // Close drawers on breakpoint change to desktop
    useEffect(() => {
        if (isWide) {
            setWatchlistDrawerOpen(false);
            setOrderDrawerOpen(false);
        }
    }, [isWide]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const [orderSide, setOrderSide] = useState(null);

    const handleSelectSymbol = useCallback((symbol) => {
        setSelectedSymbol(symbol);
        if (isCompact) setWatchlistDrawerOpen(false);
    }, [isCompact]);

    const handleBuy = useCallback(() => {
        setOrderSide('BUY');
        setOrderDrawerOpen(true);
    }, []);

    const handleSell = useCallback(() => {
        setOrderSide('SELL');
        setOrderDrawerOpen(true);
    }, []);

    // ── Dock tabs ─────────────────────────────────────────────────────────────
    const dockTabs = useMemo(() => [
        {
            key: 'positions',
            label: 'Positions',
            count: holdings.length,
            content: <PositionsPanel holdings={holdings} onSell={(s) => { setSelectedSymbol(s); handleSell(); }} />,
        },
        {
            key: 'orders',
            label: 'Orders',
            count: orders.length,
            content: <OrderHistoryPanel orders={orders} />,
        },
    ], [holdings, orders]);

    // ── Shared watchlist element ───────────────────────────────────────────────
    // NOTE: Watchlist now reads everything from useWatchlistStore internally.
    // We no longer need to pass items/prices/watchlistId as props.
    const watchlistEl = (
        <Watchlist
            selectedSymbol={selectedSymbol}
            onSelectSymbol={handleSelectSymbol}
            onBuy={(s) => { setSelectedSymbol(s); handleBuy(); }}
            onSell={(s) => { setSelectedSymbol(s); handleSell(); }}
        />
    );

    const orderPanelEl = (
        <OrderPanel
            symbol={selectedSymbol}
            currentPrice={quote?.price ?? 0}
            isTerminalFocused={isTerminalFocused}
            initialSide={orderSide}
        />
    );

    return (
        <div
            className="terminal-grid h-[calc(100vh-56px-36px)]"
            onFocus={() => setIsTerminalFocused(true)}
            onBlur={() => setIsTerminalFocused(false)}
        >
            {/* ── WATCHLIST AREA ─────────────────────────────────────── */}
            {isWide ? (
                <ResizablePanel
                    side="left"
                    defaultSize={260}
                    minSize={200}
                    maxSize={400}
                    className="terminal-area-watchlist hidden lg:flex"
                >
                    {watchlistEl}
                </ResizablePanel>
            ) : (
                <ResponsiveDrawer
                    open={watchlistDrawerOpen}
                    onClose={() => setWatchlistDrawerOpen(false)}
                    side="left"
                    isCompact={true}
                    width="w-[280px]"
                >
                    {watchlistEl}
                </ResponsiveDrawer>
            )}

            {/* ── CHART HEADER AREA ─────────────────────────────────── */}
            <div className="terminal-area-header min-w-0">
                <ChartHeader
                    symbol={selectedSymbol}
                    quote={quote}
                    period={chartPeriod}
                    onPeriodChange={setChartPeriod}
                    strategyDockOpen={strategyDockOpen}
                    onToggleStrategyDock={() => setStrategyDockOpen((v) => !v)}
                    trendData={trendData}
                    isMobile={isMobile}
                />
            </div>

            {/* ── CHART AREA ────────────────────────────────────────── */}
            <div className="terminal-area-chart min-w-0 min-h-0 relative">
                <ErrorBoundary fallback="Chart failed to load. Please refresh.">
                    <ZebuLiveChart
                        candles={candles}
                        isLoading={chartLoading}
                        trendData={trendData}
                        symbol={selectedSymbol}
                        period={chartPeriod}
                        zeroLossTrend={zlConfidence}
                    />
                </ErrorBoundary>
            </div>

            {/* ── BOTTOM DOCK ───────────────────────────────────────── */}
            <div className={cn(
                'terminal-area-bottom min-w-0',
                bottomCollapsed ? 'h-[32px]' : 'h-[180px] lg:h-[200px]',
                'transition-all duration-200'
            )}>
                <DockContainer
                    tabs={dockTabs}
                    defaultTab="positions"
                    collapsed={bottomCollapsed}
                    onToggleCollapse={() => setBottomCollapsed((v) => !v)}
                />
            </div>

            {/* ── ORDER PANEL AREA ──────────────────────────────────── */}
            {isWide ? (
                <ResizablePanel
                    side="right"
                    defaultSize={300}
                    minSize={260}
                    maxSize={420}
                    className="terminal-area-orders hidden lg:flex"
                >
                    {orderPanelEl}
                </ResizablePanel>
            ) : (
                <ResponsiveDrawer
                    open={orderDrawerOpen}
                    onClose={() => setOrderDrawerOpen(false)}
                    side="right"
                    isCompact={true}
                    width="w-[320px]"
                >
                    {orderPanelEl}
                </ResponsiveDrawer>
            )}

            {/* ── MOBILE/TABLET TRADE BAR ────────────────────────── */}
            {isCompact && (
                <div className="terminal-area-tradebar">
                    <MobileTradeBar
                        symbol={selectedSymbol}
                        price={quote?.price ?? 0}
                        onBuy={handleBuy}
                        onSell={handleSell}
                        onToggleWatchlist={() => setWatchlistDrawerOpen((v) => !v)}
                    />
                </div>
            )}

            {/* ── Floating Strategy Dock popup ───────────────────────── */}
            <ErrorBoundary fallback="Strategy dock failed to load.">
                <StrategyDock
                    candles={candles}
                    isOpen={strategyDockOpen}
                    onClose={() => setStrategyDockOpen(false)}
                />
            </ErrorBoundary>
        </div>
    );
}