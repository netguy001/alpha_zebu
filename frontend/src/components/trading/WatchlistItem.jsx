import { memo, useRef, useEffect, useState } from 'react';
import { cn } from '../../utils/cn';
import { formatPrice, formatPercent } from '../../utils/formatters';

/**
 * Single watchlist row.
 * — Default state : symbol name (left) + price & change% (right)
 * — Hover state   : symbol name (left) + [BUY] [SELL] buttons (right)
 * Price-flash animation on LTP change is preserved.
 *
 * FIXES:
 * - Removed hover jump/wiggle animation (was caused by transform/translate on hover)
 * - NSE/BSE badge now uses explicit colors visible in both dark & light mode
 * - Uses font-price for numeric values, ▲/▼ arrows for change direction
 */
const WatchlistItem = memo(function WatchlistItem({
    item,
    price = {},
    isSelected,
    onSelect,
    onRemove,
    onBuy,
    onSell,
}) {
    const [flashClass, setFlashClass] = useState('');
    const [hovered, setHovered] = useState(false);
    const prevPriceRef = useRef(price?.price);

    // ── Price flash animation ─────────────────────────────────────────────────
    useEffect(() => {
        const prev = prevPriceRef.current;
        const curr = price?.price;
        if (prev !== undefined && curr !== undefined && prev !== curr) {
            const cls = curr > prev ? 'animate-price-up' : 'animate-price-down';
            setFlashClass(cls);
            const t = setTimeout(() => setFlashClass(''), 650);
            prevPriceRef.current = curr;
            return () => clearTimeout(t);
        }
        prevPriceRef.current = curr;
    }, [price?.price]);

    const changePositive = (price?.change ?? 0) >= 0;
    const symbol = item.symbol?.replace('.NS', '');
    const exchange = item.exchange || 'NSE';

    return (
        <div
            onClick={onSelect}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={cn(
                'relative flex items-center justify-between px-3 py-2 cursor-pointer',
                'border-b border-edge/[0.03]',
                'transition-colors duration-150',
                'hover:bg-overlay/[0.03]',
                isSelected
                    ? 'bg-primary-600/10 border-l-[3px] border-l-primary-500'
                    : 'border-l-[3px] border-l-transparent',
                flashClass
            )}
        >
            {/* ── Left: symbol + exchange badge ───────────────────────────── */}
            <div className="flex-1 min-w-0">
                <div className="font-semibold text-[13px] text-heading truncate">{symbol}</div>
                <div className="flex items-center gap-1 mt-0.5">
                    <span className={cn(
                        'inline-flex items-center px-1 py-0 rounded text-[9px] font-medium leading-4 tracking-wide',
                        'bg-gray-200 text-gray-600',
                        'dark:bg-surface-700 dark:text-gray-400',
                    )}>
                        {exchange}
                    </span>
                    {item.company_name && (
                        <span className="text-[10px] text-gray-500 truncate leading-tight max-w-[90px]">
                            {item.company_name}
                        </span>
                    )}
                </div>
            </div>

            {/* ── Right: price+change OR buy/sell on hover ─────────────────── */}
            <div className="flex-shrink-0 ml-1">
                {hovered ? (
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onBuy?.(item.symbol);
                            }}
                            className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-500 hover:bg-emerald-400 text-white transition-colors duration-150 leading-none"
                        >
                            BUY
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onSell?.(item.symbol);
                            }}
                            className="px-2 py-1 rounded-md text-[11px] font-bold bg-red-500 hover:bg-red-400 text-white transition-colors duration-150 leading-none"
                        >
                            SELL
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove?.(item.id);
                            }}
                            className="p-0.5 rounded text-gray-400 hover:text-red-400 transition-colors"
                            title="Remove from watchlist"
                        >
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-end">
                        <span className="text-[13px] font-price font-semibold text-heading tabular-nums">
                            {price?.price != null ? formatPrice(price.price) : '—'}
                        </span>
                        <span className={cn(
                            'flex items-center gap-0.5 text-[10px] font-price tabular-nums',
                            changePositive ? 'text-bull' : 'text-bear'
                        )}>
                            <span className="text-[9px] leading-none">{changePositive ? '▲' : '▼'}</span>
                            {price?.change_percent != null
                                ? formatPercent(price.change_percent, 2)
                                : '—'}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}, (prev, next) =>
    prev.price?.price === next.price?.price &&
    prev.price?.change_percent === next.price?.change_percent &&
    prev.isSelected === next.isSelected &&
    prev.item.id === next.item.id
);

export default WatchlistItem;
