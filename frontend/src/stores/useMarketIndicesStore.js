import { create } from 'zustand';
import api from '../services/api';

/**
 * Market‑indices store — centralises NIFTY/SENSEX/BANKNIFTY polling
 * + full ticker data (indices + popular stocks) for the scrolling bar.
 */
export const useMarketIndicesStore = create((set, get) => ({
    /** @type {Array<object>} Index data (legacy — indices only) */
    indices: [],

    /** @type {Array<object>} Full ticker items (indices + stocks) */
    tickerItems: [],

    /** @type {boolean} */
    isLoading: false,

    /** @type {number|null} Polling interval ID */
    _intervalId: null,

    // ─── Actions ──────────────────────────────────────────────────────────────

    /** Fetch market indices once (legacy). */
    fetchIndices: async () => {
        set({ isLoading: true });
        try {
            const res = await api.get('/market/indices');
            set({ indices: res.data.indices || [] });
        } catch { /* ignore */ } finally {
            set({ isLoading: false });
        }
    },

    /** Fetch full ticker data (indices + stocks). */
    fetchTicker: async () => {
        try {
            const res = await api.get('/market/ticker');
            const items = res.data.items || [];
            // Also extract indices for backward compat
            const indices = items.filter((i) => i.kind === 'index');
            set({ tickerItems: items, indices });
        } catch { /* ignore */ }
    },

    /** Start periodic polling (default 60s). */
    startPolling: (intervalMs = 60_000) => {
        const { _intervalId, fetchTicker } = get();
        if (_intervalId) return; // already polling
        set({ isLoading: true });
        fetchTicker().finally(() => set({ isLoading: false }));
        const id = setInterval(fetchTicker, intervalMs);
        set({ _intervalId: id });
    },

    /** Stop polling. */
    stopPolling: () => {
        const { _intervalId } = get();
        if (_intervalId) {
            clearInterval(_intervalId);
            set({ _intervalId: null });
        }
    },
}));
