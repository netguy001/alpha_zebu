import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import MarketTickerBar from './MarketTickerBar';
import { useWebSocket } from '../../hooks/useWebSocket';
import { cn } from '../../utils/cn';
import { LS_SIDEBAR } from '../../utils/constants';

/**
 * Root authenticated shell: sidebar + navbar + market ticker + page content.
 *
 * Layout grid (desktop):
 *   [Fixed Sidebar 240/72px] [Main: Navbar 56px / TickerBar 36px / Page]
 *
 * Terminal route: main area is overflow-hidden (no page scroll)
 * Other routes: main area is overflow-y-auto
 * Mobile: sidebar becomes a full-width overlay drawer; main content stays at 0 margin.
 */
export default function AppShell() {
    const location = useLocation();

    // Detect terminal route for overflow control
    const isTerminal = location.pathname.startsWith('/terminal');

    // ── Mount WebSocket — always connected when authenticated ──────────────
    useWebSocket();

    // ── Sidebar state — persisted to localStorage ─────────────────────────────
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        const stored = localStorage.getItem(LS_SIDEBAR);
        if (stored !== null) return stored === 'true';
        return true; // default collapsed
    });

    const toggle = () => {
        setSidebarCollapsed((prev) => {
            const next = !prev;
            localStorage.setItem(LS_SIDEBAR, String(next));
            return next;
        });
    };

    // Auto-close sidebar on mobile when navigating
    useEffect(() => {
        if (window.innerWidth < 1024) {
            setSidebarCollapsed(true);
            localStorage.setItem(LS_SIDEBAR, 'true');
        }
    }, [location.pathname]);

    return (
        <div className="min-h-screen bg-surface-950 flex">
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={toggle}
            />

            <div
                className={cn(
                    'flex flex-col flex-1 min-w-0',
                    sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[240px]'
                )}
            >
                <Navbar onMenuToggle={toggle} />
                <MarketTickerBar />

                {/* Page content — terminal gets no overflow (grid handles it) */}
                <main className={cn(
                    'flex-1',
                    isTerminal ? 'overflow-hidden' : 'overflow-y-auto'
                )}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
