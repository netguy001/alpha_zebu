import { useState, memo } from 'react';
import { cn } from '../../utils/cn';

/**
 * DockContainer — tabbed bottom panel container for positions/orders/logs.
 *
 * Features:
 *  - Collapsible via a toggle handle (click the grab bar)
 *  - Tab bar with counts
 *  - Only active tab panel is rendered (lazy)
 *  - Respects parent height constraints
 *
 * Props:
 *  - tabs: Array<{ key: string, label: string, count?: number, content: ReactNode }>
 *  - defaultTab: string
 *  - collapsed: boolean
 *  - onToggleCollapse: () => void
 *  - className: string
 */
function DockContainer({
    tabs = [],
    defaultTab,
    collapsed = false,
    onToggleCollapse,
    className,
}) {
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.key);

    const activeContent = tabs.find((t) => t.key === activeTab)?.content;

    return (
        <div className={cn(
            'flex flex-col bg-surface-900/20 border-t border-edge/5 overflow-hidden transition-all duration-200',
            collapsed ? 'h-[32px]' : 'h-full',
            className,
        )}>
            {/* Tab bar + collapse handle */}
            <div className="flex items-center border-b border-edge/5 flex-shrink-0">
                {/* Collapse toggle */}
                <button
                    onClick={onToggleCollapse}
                    className="px-2 py-2 text-gray-600 hover:text-gray-400 transition-colors"
                    title={collapsed ? 'Expand panel' : 'Collapse panel'}
                >
                    <svg
                        className={cn('w-3.5 h-3.5 transition-transform duration-200', collapsed && 'rotate-180')}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                {/* Tabs */}
                {tabs.map(({ key, label, count }) => (
                    <button
                        key={key}
                        onClick={() => {
                            setActiveTab(key);
                            if (collapsed) onToggleCollapse?.();
                        }}
                        className={cn(
                            'px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap',
                            activeTab === key
                                ? 'text-primary-400 border-b-2 border-primary-500'
                                : 'text-gray-500 hover:text-gray-300'
                        )}
                    >
                        {label}
                        {count != null && (
                            <span className="ml-1.5 text-[10px] font-mono text-gray-600">
                                ({count})
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Active tab content */}
            {!collapsed && (
                <div className="flex-1 overflow-y-auto min-h-0">
                    {activeContent}
                </div>
            )}
        </div>
    );
}

export default memo(DockContainer);
