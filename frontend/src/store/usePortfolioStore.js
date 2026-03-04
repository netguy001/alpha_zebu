import { create } from 'zustand';
import api from '../services/api';

/**
 * Portfolio store — holdings, positions, orders and funds.
 * All mutations proxy through existing services/api.js.
 */
export const usePortfolioStore = create((set, get) => ({
    /** @type {Array} Current holdings from /portfolio/holdings */
    holdings: [],

    /** @type {Array} Intraday positions from /portfolio/positions */
    positions: [],

    /** @type {Array} Orders from /orders */
    orders: [],

    /** @type {object|null} Portfolio summary from /portfolio/summary */
    summary: null,

    /** @type {{ realized: number, unrealized: number, total: number }} */
    pnl: { realized: 0, unrealized: 0, total: 0 },

    /** @type {boolean} */
    isLoading: false,

    // ─── Actions ──────────────────────────────────────────────────────────────

    /**
     * Fetch all portfolio data in parallel.
     * Called on mount and after order placement.
     */
    refreshPortfolio: async () => {
        set({ isLoading: true });
        try {
            const [summaryRes, holdingsRes, ordersRes] = await Promise.allSettled([
                api.get('/portfolio/summary'),
                api.get('/portfolio/holdings'),
                api.get('/orders'),
            ]);

            const summary = summaryRes.status === 'fulfilled' ? summaryRes.value.data.summary : get().summary;
            const holdings = holdingsRes.status === 'fulfilled' ? holdingsRes.value.data.holdings ?? [] : get().holdings;
            const orders = ordersRes.status === 'fulfilled' ? ordersRes.value.data.orders ?? [] : get().orders;

            set({
                summary,
                holdings,
                orders,
                pnl: {
                    realized: summary?.realized_pnl ?? 0,
                    unrealized: summary?.total_pnl ?? 0,
                    total: summary?.total_pnl ?? 0,
                },
            });
        } catch { /* ignore — keep stale data */ } finally {
            set({ isLoading: false });
        }
    },

    /**
     * Live-update a single position's P&L without a full refetch.
     * @param {string} symbol
     * @param {Partial<object>} data
     */
    updatePosition: (symbol, data) =>
        set((state) => ({
            positions: state.positions.map((p) =>
                p.symbol === symbol ? { ...p, ...data } : p
            ),
        })),

    /**
     * Append a new order to local state (optimistic update).
     * @param {object} order
     */
    addOrder: (order) =>
        set((state) => ({ orders: [order, ...state.orders] })),
}));
