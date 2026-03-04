// ─── DashboardWorkspace ──────────────────────────────────────────────────────
// Uses useMarketIndicesStore for indices, usePortfolioStore for holdings.
// Replaces DashboardPage's inline API fetches.
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useMarketIndicesStore } from '../stores/useMarketIndicesStore';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { useZeroLossStore } from '../stores/useZeroLossStore';
import api from '../services/api';
import {
    HiTrendingUp, HiTrendingDown, HiCurrencyRupee,
    HiChartBar, HiArrowRight, HiLightningBolt, HiOutlineBriefcase,
    HiShieldCheck, HiPlay, HiPause,
} from 'react-icons/hi';
import { formatCurrency, formatPrice, formatPercent, pnlColorClass } from '../utils/formatters';
import { Skeleton } from '../components/ui';
import { cn } from '../utils/cn';

export default function DashboardWorkspace() {
    const user = useAuthStore((s) => s.user);
    const indices = useMarketIndicesStore((s) => s.indices);
    const fetchIndices = useMarketIndicesStore((s) => s.fetchIndices);
    const { holdings, refreshPortfolio } = usePortfolioStore();
    const zl = useZeroLossStore();

    const [portfolio, setPortfolio] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [pRes, oRes] = await Promise.allSettled([
                    api.get('/portfolio'),
                    api.get('/orders'),
                ]);
                if (pRes.status === 'fulfilled') setPortfolio(pRes.value.data);
                if (oRes.status === 'fulfilled') setRecentOrders((oRes.value.data.orders || []).slice(0, 5));
            } catch { /* ignore */ }
            setLoading(false);
        };
        load();
        fetchIndices();
        refreshPortfolio();
        zl.fetchAll();
    }, [fetchIndices, refreshPortfolio, zl.fetchAll]);

    if (loading) {
        return (
            <div className="p-4 lg:p-6 space-y-6">
                <Skeleton variant="text" className="h-8 w-48" />
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <Skeleton variant="stat-card" count={5} />
                </div>
                <Skeleton variant="table-row" count={4} />
            </div>
        );
    }

    const totalCapital = (portfolio?.available_capital || 0) + (portfolio?.current_value || 0);
    const totalPnl = portfolio?.total_pnl || 0;

    const STAT_CARDS = [
        { label: 'Total Capital', value: formatCurrency(totalCapital), icon: HiCurrencyRupee },
        { label: 'Available Cash', value: formatCurrency(portfolio?.available_capital), icon: HiCurrencyRupee },
        { label: 'Invested', value: formatCurrency(portfolio?.total_invested), icon: HiChartBar },
        { label: 'Current Value', value: formatCurrency(portfolio?.current_value), icon: HiTrendingUp },
        { label: 'Total P&L', value: formatCurrency(totalPnl), pnl: totalPnl, icon: totalPnl >= 0 ? HiTrendingUp : HiTrendingDown },
    ];

    return (
        <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-heading">
                        Welcome, {user?.full_name?.split(' ')[0] || user?.username || 'Trader'}
                    </h1>
                    <p className="text-gray-500 text-sm mt-0.5">Here&apos;s your portfolio overview</p>
                </div>
                <Link to="/terminal" className="btn-primary text-sm hidden sm:inline-flex items-center gap-2">
                    Trade Now <HiArrowRight className="w-4 h-4" />
                </Link>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {STAT_CARDS.map(({ label, value, icon: Icon, pnl }) => (
                    <div key={label} className="stat-card">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">{label}</span>
                            <Icon className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className={cn('text-xl font-semibold font-mono', pnl !== undefined ? pnlColorClass(pnl) : 'text-heading')}>
                            {value}
                        </span>
                    </div>
                ))}
            </div>

            {/* Active Strategies */}
            <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Strategies</h2>
                    <Link to="/zeroloss" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">View All</Link>
                </div>

                {/* ZeroLoss Strategy Card */}
                <div className="rounded-xl border border-edge/5 bg-surface-900/40 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className={cn('p-2 rounded-lg', zl.enabled ? 'bg-emerald-500/10' : 'bg-gray-500/10')}>
                                <HiShieldCheck className={cn('w-5 h-5', zl.enabled ? 'text-emerald-400' : 'text-gray-500')} />
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-heading">ZeroLoss Strategy</div>
                                <div className="text-[11px] text-gray-500">Confidence-gated · Break-even protected</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                'px-2 py-0.5 rounded text-[10px] font-semibold uppercase',
                                zl.enabled ? 'text-emerald-400 bg-emerald-500/10' : 'text-gray-500 bg-gray-500/10'
                            )}>
                                {zl.enabled ? 'ACTIVE' : 'STOPPED'}
                            </span>
                            {zl.lastUpdate && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Live via WebSocket" />
                            )}
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {[
                            { label: 'Today Trades', value: zl.stats?.today_trades ?? 0 },
                            { label: 'Profit', value: zl.stats?.today_profit ?? 0, color: 'text-emerald-400' },
                            { label: 'Breakeven', value: zl.stats?.today_breakeven ?? 0, color: 'text-amber-400' },
                            { label: 'Positions', value: Object.keys(zl.activePositions || {}).length, color: 'text-blue-400' },
                            { label: "Today's P&L", value: `₹${formatPrice(zl.stats?.today_pnl ?? 0)}`, color: pnlColorClass(zl.stats?.today_pnl ?? 0) },
                        ].map((item, i) => (
                            <div key={i} className="text-center p-2 rounded-lg bg-surface-800/40 border border-edge/[0.03]">
                                <div className="text-[10px] text-gray-600 uppercase tracking-wider">{item.label}</div>
                                <div className={cn('text-sm font-semibold font-mono mt-0.5', item.color || 'text-heading')}>
                                    {item.value}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Confidence Scores Summary (compact) */}
                    {Object.keys(zl.confidence || {}).length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {Object.entries(zl.confidence).map(([symbol, data]) => {
                                const score = data?.score ?? 0;
                                const dir = data?.direction || 'NEUTRAL';
                                const barColor = score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500';
                                const dirColor = dir === 'BULLISH' ? 'text-emerald-400' : dir === 'BEARISH' ? 'text-red-400' : 'text-gray-400';
                                return (
                                    <div key={symbol} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface-800/60 border border-edge/[0.03] text-xs">
                                        <span className="font-semibold text-heading">{symbol.replace('.NS', '')}</span>
                                        <div className="w-12 h-1.5 bg-surface-700 rounded-full overflow-hidden">
                                            <div className={cn('h-full rounded-full transition-all duration-700', barColor)} style={{ width: `${score}%` }} />
                                        </div>
                                        <span className="font-mono text-gray-400">{Math.round(score)}</span>
                                        <span className={cn('text-[10px] font-semibold', dirColor)}>
                                            {dir === 'BULLISH' ? '▲' : dir === 'BEARISH' ? '▼' : '—'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Market Indices + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 glass-card p-5">
                    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Market Indices</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {indices.length > 0 ? indices.map((idx, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-surface-900/40 border border-edge/[0.03]">
                                <div>
                                    <div className="text-xs font-medium text-gray-500">{idx.name}</div>
                                    <div className="text-lg font-mono font-semibold text-heading">
                                        {Number(idx.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <div className={cn('text-right', pnlColorClass(idx.change))}>
                                    <div className="flex items-center gap-1 text-sm font-mono font-semibold justify-end">
                                        {(idx.change ?? 0) >= 0 ? <HiTrendingUp className="w-3.5 h-3.5" /> : <HiTrendingDown className="w-3.5 h-3.5" />}
                                        {idx.change > 0 ? '+' : ''}{formatPrice(idx.change)}
                                    </div>
                                    <div className="text-xs font-mono opacity-70">{formatPercent(idx.change_percent)}</div>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-2 text-center py-8 text-gray-600">
                                <HiChartBar className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                <p className="text-sm">Market data loading...</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="glass-card p-5">
                    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Quick Access</h2>
                    <div className="space-y-2">
                        {[
                            { to: '/terminal', icon: HiChartBar, label: 'Trading Terminal', accent: true },
                            { to: '/portfolio', icon: HiOutlineBriefcase, label: 'Portfolio' },
                            { to: '/algo', icon: HiLightningBolt, label: 'Algo Strategies' },
                            { to: '/zeroloss', icon: HiShieldCheck, label: 'ZeroLoss Strategy' },
                        ].map(({ to, icon: Icon, label, accent }) => (
                            <Link key={to} to={to} className={cn(
                                'flex items-center justify-between p-3 rounded-lg transition-all group',
                                accent
                                    ? 'bg-primary-600/10 hover:bg-primary-600/15 border border-primary-500/15'
                                    : 'bg-surface-800/30 hover:bg-surface-800/60 border border-edge/[0.03]'
                            )}>
                                <div className="flex items-center gap-3">
                                    <Icon className={cn('w-4 h-4', accent ? 'text-primary-400' : 'text-gray-500')} />
                                    <span className={cn('text-sm font-medium', accent ? 'text-primary-300' : 'text-gray-400')}>{label}</span>
                                </div>
                                <HiArrowRight className={cn('w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform', accent ? 'text-primary-400/60' : 'text-gray-600')} />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Holdings + Recent Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="glass-card p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Holdings</h2>
                        <Link to="/portfolio" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">View All</Link>
                    </div>
                    {holdings.length > 0 ? (
                        <div className="space-y-1">
                            {holdings.slice(0, 5).map((h, i) => (
                                <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-overlay/[0.03] transition-colors">
                                    <div>
                                        <div className="text-sm font-semibold text-heading">{h.symbol?.replace('.NS', '')}</div>
                                        <div className="text-xs text-gray-600 font-mono">{h.quantity} shares @ {formatCurrency(h.avg_price)}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-mono font-semibold text-heading">{formatCurrency(h.current_value)}</div>
                                        <div className={cn('text-xs font-mono', pnlColorClass(h.pnl))}>
                                            {(h.pnl ?? 0) >= 0 ? '+' : ''}{formatCurrency(h.pnl)} ({formatPercent(h.pnl_percent)})
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-600">
                            <HiCurrencyRupee className="w-10 h-10 mx-auto mb-2 opacity-30" />
                            <p className="text-sm font-medium text-gray-500">No holdings yet</p>
                            <Link to="/terminal" className="text-xs text-primary-400 hover:text-primary-300 mt-1 inline-block">Start trading &rarr;</Link>
                        </div>
                    )}
                </div>

                <div className="glass-card p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Recent Orders</h2>
                        <Link to="/terminal" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">View All</Link>
                    </div>
                    {recentOrders.length > 0 ? (
                        <div className="space-y-1">
                            {recentOrders.map((o, i) => (
                                <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-overlay/[0.03] transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded', o.side === 'BUY' ? 'bg-bull/10 text-bull' : 'bg-bear/10 text-bear')}>
                                            {o.side}
                                        </span>
                                        <div>
                                            <div className="text-sm font-semibold text-heading">{o.symbol?.replace('.NS', '')}</div>
                                            <div className="text-xs text-gray-600">{o.quantity} qty</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-mono font-semibold text-heading">{formatCurrency(o.filled_price ?? o.price)}</div>
                                        <span className={cn('text-[11px] px-1.5 py-0.5 rounded font-medium',
                                            o.status === 'FILLED' ? 'text-profit bg-profit/10' : 'text-amber-400 bg-amber-400/10'
                                        )}>{o.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-600">
                            <HiChartBar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                            <p className="text-sm font-medium text-gray-500">No orders yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
