import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { useMarketStore } from '../store/useMarketStore';

/**
 * Fetch and manage market data for a given symbol.
 * Polls for quote updates at a configurable interval.
 *
 * @param {string} symbol - e.g. 'RELIANCE.NS'
 * @param {{ pollInterval?: number }} [options]
 * @returns {{
 *   quote: object|null,
 *   candles: Array,
 *   isLoading: boolean,
 *   hasError: boolean,
 *   refetch: () => void,
 * }}
 */
export function useMarketData(symbol, { pollInterval = 15_000 } = {}) {
    const [candles, setCandles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const updateQuote = useMarketStore((s) => s.updateQuote);
    const quote = useMarketStore((s) => s.symbols[symbol] ?? null);

    const fetchQuote = useCallback(async () => {
        if (!symbol) return;
        try {
            const res = await api.get(`/market/quote/${symbol}`);
            updateQuote(symbol, res.data);
            setHasError(false);
        } catch {
            setHasError(true);
        }
    }, [symbol, updateQuote]);

    const fetchCandles = useCallback(async (period = '3mo', interval = '1d') => {
        if (!symbol) return;
        try {
            const res = await api.get(`/market/history/${symbol}?period=${period}&interval=${interval}`);
            setCandles(res.data.candles || []);
        } catch { /* ignore — keep previous data */ }
    }, [symbol]);

    // Initial load — clear old candles so stale data can't bleed across symbols
    useEffect(() => {
        if (!symbol) return;
        setCandles([]);
        setIsLoading(true);
        setHasError(false);
        Promise.all([fetchQuote(), fetchCandles()])
            .finally(() => setIsLoading(false));
    }, [symbol, fetchQuote, fetchCandles]);

    // Polling
    const intervalRef = useRef(null);
    useEffect(() => {
        if (!symbol || pollInterval <= 0) return;
        intervalRef.current = setInterval(fetchQuote, pollInterval);
        return () => clearInterval(intervalRef.current);
    }, [symbol, pollInterval, fetchQuote]);

    return {
        quote,
        candles,
        isLoading,
        hasError,
        refetch: fetchQuote,
        fetchCandles,
    };
}
