import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useOrders } from '../../hooks/useOrders';
import { cn } from '../../utils/cn';
import { formatCurrency, formatPrice } from '../../utils/formatters';
import { ORDER_SIDE, ORDER_TYPE, PRODUCT_TYPE } from '../../utils/constants';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

const ORDER_TYPES = [ORDER_TYPE.MARKET, ORDER_TYPE.LIMIT, 'SL', 'SL-M'];
const PRODUCT_TYPES = [PRODUCT_TYPE.CNC, PRODUCT_TYPE.MIS, PRODUCT_TYPE.NRML];

/**
 * Order panel — buy/sell form with confirmation modal.
 *
 * Keyboard shortcuts:
 *   B → switch to Buy tab
 *   S → switch to Sell tab
 *   Enter (while panel focused) → open confirm dialog
 *
 * @param {{
 *   symbol: string,
 *   currentPrice?: number,
 *   isTerminalFocused?: boolean,
 * }} props
 */
export default function OrderPanel({ symbol, currentPrice = 0, isTerminalFocused = false }) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const { form, setForm, setSide, totalCost, isSubmitting, submitOrder } = useOrders(symbol);

    // Keyboard shortcuts (active when terminal is focused and user isn't in an input)
    useKeyboardShortcuts({
        'b': () => setSide(ORDER_SIDE.BUY),
        's': () => setSide(ORDER_SIDE.SELL),
    }, isTerminalFocused);

    const isBuy = form.side === ORDER_SIDE.BUY;
    const isLimit = form.order_type === ORDER_TYPE.LIMIT;
    const isSL = form.order_type === 'SL' || form.order_type === 'SL-M';

    const handleConfirm = async () => {
        setConfirmOpen(false);
        await submitOrder();
    };

    return (
        <div className="flex flex-col h-full bg-surface-900 border-l border-edge/10">
            {/* Header */}
            <div className="px-4 py-3 border-b border-edge/5">
                <h3 className="section-title text-xs mb-3">Order Panel</h3>

                {/* Buy / Sell toggle — segmented pill */}
                <div className="flex rounded-xl overflow-hidden border border-edge/10 bg-surface-800/60 p-0.5">
                    <button
                        onClick={() => setSide(ORDER_SIDE.BUY)}
                        className={cn(
                            'flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200',
                            isBuy
                                ? 'bg-bull text-white shadow-lg shadow-emerald-500/20'
                                : 'text-gray-500 hover:text-gray-300'
                        )}
                    >
                        BUY
                    </button>
                    <button
                        onClick={() => setSide(ORDER_SIDE.SELL)}
                        className={cn(
                            'flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200',
                            !isBuy
                                ? 'bg-bear text-white shadow-lg shadow-red-500/20'
                                : 'text-gray-500 hover:text-gray-300'
                        )}
                    >
                        SELL
                    </button>
                </div>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
                {/* Symbol */}
                <div>
                    <label className="metric-label block mb-1">Symbol</label>
                    <div className="bg-surface-800/60 border border-edge/10 rounded-lg px-3 py-2 text-sm font-semibold text-heading flex items-center justify-between">
                        <span>{symbol?.replace('.NS', '')}</span>
                        <span className="text-xs text-gray-500 font-price tabular-nums">
                            {currentPrice > 0 ? `₹${formatPrice(currentPrice)}` : ''}
                        </span>
                    </div>
                </div>

                {/* Order type — segmented pill */}
                <div>
                    <label className="metric-label block mb-1">Order Type</label>
                    <div className="flex rounded-lg overflow-hidden border border-edge/10 bg-surface-800/40 p-0.5 gap-0.5">
                        {ORDER_TYPES.map((t) => (
                            <button
                                key={t}
                                onClick={() => setForm((f) => ({ ...f, order_type: t }))}
                                className={cn(
                                    'flex-1 py-1.5 text-xs font-semibold rounded-md transition-all duration-150',
                                    form.order_type === t
                                        ? 'bg-primary-600/25 text-primary-400 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-300 hover:bg-surface-700/40'
                                )}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product type — segmented pill */}
                <div>
                    <label className="metric-label block mb-1">Product</label>
                    <div className="flex rounded-lg overflow-hidden border border-edge/10 bg-surface-800/40 p-0.5 gap-0.5">
                        {PRODUCT_TYPES.map((p) => (
                            <button
                                key={p}
                                onClick={() => setForm((f) => ({ ...f, product_type: p }))}
                                className={cn(
                                    'flex-1 py-1.5 text-xs font-semibold rounded-md transition-all duration-150',
                                    form.product_type === p
                                        ? 'bg-primary-600/25 text-primary-400 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-300 hover:bg-surface-700/40'
                                )}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quantity with stepper */}
                <div>
                    <label className="metric-label block mb-1">Quantity</label>
                    <div className="flex items-center border border-edge/10 rounded-lg overflow-hidden bg-surface-800/60">
                        <button
                            onClick={() => setForm((f) => ({ ...f, quantity: Math.max(1, (parseInt(f.quantity) || 1) - 1) }))}
                            className="px-3 py-2 text-gray-400 hover:text-heading hover:bg-overlay/5 transition-all text-lg font-bold"
                        >
                            −
                        </button>
                        <input
                            type="number"
                            min={1}
                            value={form.quantity}
                            onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                            className="flex-1 text-center bg-transparent text-heading text-sm font-price py-2 focus:outline-none tabular-nums"
                        />
                        <button
                            onClick={() => setForm((f) => ({ ...f, quantity: (parseInt(f.quantity) || 0) + 1 }))}
                            className="px-3 py-2 text-gray-400 hover:text-heading hover:bg-overlay/5 transition-all text-lg font-bold"
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* Price (for LIMIT orders) */}
                {isLimit && (
                    <div>
                        <label className="metric-label block mb-1">Limit Price (₹)</label>
                        <input
                            type="number"
                            step="0.05"
                            value={form.price}
                            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                            placeholder={formatPrice(currentPrice)}
                            className="w-full bg-surface-800/60 border border-edge/10 rounded-lg px-3 py-2 text-sm font-price text-heading placeholder-gray-600 focus:outline-none focus:border-primary-500/30 tabular-nums"
                        />
                    </div>
                )}

                {/* Trigger price (for SL/SL-M) */}
                {isSL && (
                    <div>
                        <label className="metric-label block mb-1">Trigger Price (₹)</label>
                        <input
                            type="number"
                            step="0.05"
                            value={form.triggerPrice}
                            onChange={(e) => setForm((f) => ({ ...f, triggerPrice: e.target.value }))}
                            placeholder={formatPrice(currentPrice)}
                            className="w-full bg-surface-800/60 border border-edge/10 rounded-lg px-3 py-2 text-sm font-price text-heading placeholder-gray-600 focus:outline-none focus:border-primary-500/30 tabular-nums"
                        />
                    </div>
                )}

                {/* Order summary */}
                <div className="rounded-xl bg-surface-800/40 border border-edge/5 p-3 space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Est. Value</span>
                        <span className="font-price text-heading font-semibold tabular-nums">{formatCurrency(totalCost)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Qty × Price</span>
                        <span className="font-price text-gray-400 tabular-nums">
                            {form.quantity || 0} × {isLimit && form.price ? `₹${form.price}` : `₹${formatPrice(currentPrice)}`}
                        </span>
                    </div>
                    {/* Margin estimate */}
                    {form.product_type === PRODUCT_TYPE.MIS && totalCost > 0 && (
                        <div className="flex justify-between text-xs border-t border-edge/5 pt-2 mt-1">
                            <span className="text-gray-500">Margin (5x)</span>
                            <span className="font-price text-primary-400 font-medium tabular-nums">
                                {formatCurrency(totalCost / 5)}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Submit button */}
            <div className="px-4 py-3 border-t border-edge/5">
                <Button
                    variant={isBuy ? 'buy' : 'sell'}
                    size="lg"
                    className="w-full"
                    onClick={() => setConfirmOpen(true)}
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                >
                    {isBuy ? 'Place Buy Order' : 'Place Sell Order'}
                </Button>
                <p className="text-[11px] text-gray-600 text-center mt-2">
                    Press <kbd className="bg-surface-700 px-1 rounded text-[10px]">B</kbd> / <kbd className="bg-surface-700 px-1 rounded text-[10px]">S</kbd> to switch sides
                </p>
            </div>

            {/* Confirmation Modal */}
            <Modal
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                title="Confirm Order"
                size="sm"
            >
                <div className="px-6 py-4 space-y-4">
                    {/* Summary */}
                    <div className="rounded-xl border border-edge/10 bg-surface-900/50 divide-y divide-edge/5 text-sm">
                        {[  
                            ['Side', <span className={cn('font-bold', isBuy ? 'text-bull' : 'text-bear')}>{form.side}</span>],
                            ['Symbol', <span className="font-price text-heading">{symbol?.replace('.NS', '')}</span>],
                            ['Order Type', form.order_type],
                            ['Product', form.product_type],
                            ['Quantity', <span className="font-price tabular-nums">{form.quantity}</span>],
                            ['Est. Value', <span className="font-price font-semibold text-heading tabular-nums">{formatCurrency(totalCost)}</span>],
                        ].map(([label, value]) => (
                            <div key={label} className="flex justify-between px-4 py-2.5">
                                <span className="text-gray-500">{label}</span>
                                <span className="text-gray-300">{value}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-3">
                        <Button variant="secondary" className="flex-1" onClick={() => setConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant={isBuy ? 'buy' : 'sell'}
                            className="flex-1"
                            onClick={handleConfirm}
                            isLoading={isSubmitting}
                        >
                            Confirm {form.side}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
