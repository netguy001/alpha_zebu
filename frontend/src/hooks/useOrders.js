import { useState, useCallback, useEffect } from 'react';
import api from '../services/api';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { validateOrderForm } from '../utils/validators';
import { ORDER_SIDE, ORDER_TYPE } from '../utils/constants';
import toast from 'react-hot-toast';

/**
 * Encapsulates order form state and submission logic,
 * wiring into the existing /orders API endpoint.
 *
 * @param {string} symbol - Pre-selected symbol
 * @returns {{
 *   form: object,
 *   setForm: Function,
 *   setSide: (side: 'BUY'|'SELL') => void,
 *   totalCost: number,
 *   isSubmitting: boolean,
 *   submitOrder: () => Promise<void>,
 *   resetForm: () => void,
 * }}
 */
export function useOrders(symbol) {
    const refreshPortfolio = usePortfolioStore((s) => s.refreshPortfolio);

    const [form, setForm] = useState({
        side: ORDER_SIDE.BUY,
        order_type: ORDER_TYPE.MARKET,
        product_type: 'CNC',
        quantity: 1,
        price: '',
        triggerPrice: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentPrice, setCurrentPrice] = useState(0);

    // Fetch live price to estimate total cost
    useEffect(() => {
        if (!symbol) return;
        api.get(`/market/quote/${symbol}`)
            .then((r) => setCurrentPrice(r.data?.price ?? 0))
            .catch(() => { });
    }, [symbol]);

    const setSide = useCallback((side) => {
        setForm((f) => ({ ...f, side }));
    }, []);

    const resetForm = useCallback(() => {
        setForm({
            side: ORDER_SIDE.BUY,
            order_type: ORDER_TYPE.MARKET,
            product_type: 'CNC',
            quantity: 1,
            price: '',
            triggerPrice: '',
        });
    }, []);

    const submitOrder = useCallback(async () => {
        const { valid, error } = validateOrderForm(form);
        if (!valid) { toast.error(error); return; }

        setIsSubmitting(true);
        try {
            const payload = {
                symbol,
                side: form.side,
                order_type: form.order_type,
                quantity: parseInt(form.quantity, 10),
                price: form.order_type === 'LIMIT' ? parseFloat(form.price) : null,
                trigger_price: form.order_type === 'SL' || form.order_type === 'SL-M'
                    ? parseFloat(form.triggerPrice)
                    : null,
            };
            await api.post('/orders', payload);
            toast.success(`${form.side} order placed for ${symbol?.replace('.NS', '')}`);
            await refreshPortfolio();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Order failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }, [form, symbol, refreshPortfolio]);

    const totalCost = currentPrice * (parseInt(form.quantity, 10) || 0);

    return {
        form,
        setForm,
        setSide,
        totalCost,
        isSubmitting,
        submitOrder,
        resetForm,
    };
}
