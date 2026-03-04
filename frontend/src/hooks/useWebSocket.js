import { useEffect, useRef, useCallback } from 'react';
import { useMarketStore } from '../store/useMarketStore';
import { useZeroLossStore } from '../stores/useZeroLossStore';
import { WS_MAX_BACKOFF_MS, WS_HEARTBEAT_MS } from '../utils/constants';

/**
 * WebSocket hook for real-time market data.
 *
 * Handles:
 * - Auto reconnect with exponential backoff (cap 30s)
 * - Heartbeat pings every 30s
 * - Subscription model: subscribe/unsubscribe to symbol lists
 * - Queues subscriptions made while disconnected
 * - Exposes connection status for UI indicators
 *
 * @returns {{
 *   status: 'connecting'|'connected'|'disconnected'|'error',
 *   subscribe: (symbols: string[]) => void,
 *   unsubscribe: (symbols: string[]) => void,
 * }}
 */
export function useWebSocket() {
    const wsRef = useRef(null);
    const statusRef = useRef('disconnected');
    const backoffRef = useRef(1000);
    const reconnectTimer = useRef(null);
    const heartbeatTimer = useRef(null);
    const messageQueue = useRef([]);   // queued while disconnected
    const mountedRef = useRef(true);

    const updateQuote = useMarketStore((s) => s.updateQuote);
    const setWsStatus = useMarketStore((s) => s.setWsStatus);
    const handleZeroLoss = useZeroLossStore((s) => s.handleWsMessage);

    const send = useCallback((payload) => {
        const msg = JSON.stringify(payload);
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(msg);
        } else {
            // Queue for when connection is established
            messageQueue.current.push(msg);
        }
    }, []);

    const flushQueue = useCallback(() => {
        while (messageQueue.current.length > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(messageQueue.current.shift());
        }
    }, []);

    const startHeartbeat = useCallback(() => {
        if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
        heartbeatTimer.current = setInterval(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'ping' }));
            }
        }, WS_HEARTBEAT_MS);
    }, []);

    const connect = useCallback(() => {
        if (!mountedRef.current) return;
        if (wsRef.current?.readyState === WebSocket.OPEN ||
            wsRef.current?.readyState === WebSocket.CONNECTING) return;

        // Resolve WebSocket URL from current host, include JWT for auth
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const token = localStorage.getItem('alphasync_token');
        // Generate unique client ID per connection to avoid server-side collisions
        const clientId = `market_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const url = token
            ? `${protocol}//${host}/ws/${clientId}?token=${encodeURIComponent(token)}`
            : `${protocol}//${host}/ws/${clientId}`;

        statusRef.current = 'connecting';
        setWsStatus('connecting');

        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            if (!mountedRef.current) { ws.close(); return; }
            backoffRef.current = 1000; // reset backoff on success
            statusRef.current = 'connected';
            setWsStatus('connected');
            startHeartbeat();
            flushQueue(); // drain queued messages
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                // Handle real-time quote updates from Zebu
                if (data.type === 'quote' && data.symbol) {
                    updateQuote(data.symbol, data);
                }
                // Backward compat: also handle "price_update" type (legacy format)
                if (data.type === 'price_update' && data.data?.symbol) {
                    updateQuote(data.data.symbol, data.data);
                }
                // Route zeroloss channel messages to the zeroloss store
                if (data.channel === 'zeroloss') {
                    handleZeroLoss(data);
                }
                // pong / other message types can be handled here
            } catch { /* malformed JSON — ignore */ }
        };

        ws.onerror = () => {
            statusRef.current = 'error';
            setWsStatus('error');
        };

        ws.onclose = () => {
            if (!mountedRef.current) return;
            statusRef.current = 'disconnected';
            setWsStatus('disconnected');
            if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);

            // Exponential backoff reconnect
            const delay = Math.min(backoffRef.current, WS_MAX_BACKOFF_MS);
            backoffRef.current = Math.min(backoffRef.current * 2, WS_MAX_BACKOFF_MS);
            reconnectTimer.current = setTimeout(connect, delay);
        };
    }, [flushQueue, setWsStatus, startHeartbeat, updateQuote]);

    useEffect(() => {
        mountedRef.current = true;
        connect();
        return () => {
            mountedRef.current = false;
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
            if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
            wsRef.current?.close();
        };
    }, [connect]);

    const subscribe = useCallback((symbols) => {
        send({ type: 'subscribe', symbols });
    }, [send]);

    const unsubscribe = useCallback((symbols) => {
        send({ type: 'unsubscribe', symbols });
    }, [send]);

    // Return the current status from store (reactive)
    const status = useMarketStore((s) => s.wsStatus);
    return { status, subscribe, unsubscribe };
}
