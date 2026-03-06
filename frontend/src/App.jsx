import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import AppShell from './components/layout/AppShell';
import ProtectedRoute from './components/ProtectedRoute';
import ForceDarkMode from './components/ForceDarkMode';
import { useAuthStore } from './stores/useAuthStore';

// ── Lazy-loaded pages ─────────────────────────────────────────────────────────
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'));
const AlgoTradingPage = lazy(() => import('./pages/AlgoTradingPage'));
const ZeroLossPage = lazy(() => import('./pages/ZeroLossPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

// ── Lazy-loaded workspaces (new architecture) ─────────────────────────────────
const DashboardWorkspace = lazy(() => import('./workspaces/DashboardWorkspace'));
const TradingWorkspace = lazy(() => import('./workspaces/TradingWorkspace'));
const TradingModeSelectPage = lazy(() => import('./pages/TradingModeSelectPage'));
const BrokerSelectPage = lazy(() => import('./pages/BrokerSelectPage'));
const BrokerCallbackPage = lazy(() => import('./pages/BrokerCallbackPage'));

/** Full-screen spinner shown during lazy chunk loading */
function PageSkeleton() {
    return (
        <div className="min-h-screen bg-surface-950 flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );
}

export default function App() {
    useEffect(() => {
        const unsubscribe = useAuthStore.getState().initAuth();
        return () => { if (typeof unsubscribe === 'function') unsubscribe(); };
    }, []);

    return (
        <ThemeProvider>
            <BrowserRouter>
                <Suspense fallback={<PageSkeleton />}>
                    <Routes>
                        {/* ── Public (always dark mode) ── */}
                        <Route path="/" element={<ForceDarkMode><LandingPage /></ForceDarkMode>} />
                        <Route path="/login" element={<ForceDarkMode><LoginPage /></ForceDarkMode>} />
                        <Route path="/register" element={<ForceDarkMode><RegisterPage /></ForceDarkMode>} />

                        {/* ── Protected (mode/broker select — always dark, no AppShell) ── */}
                        <Route path="/select-mode" element={
                            <ProtectedRoute><ForceDarkMode><TradingModeSelectPage /></ForceDarkMode></ProtectedRoute>
                        } />
                        <Route path="/select-broker" element={
                            <ProtectedRoute><ForceDarkMode><BrokerSelectPage /></ForceDarkMode></ProtectedRoute>
                        } />
                        <Route path="/broker/callback" element={
                            <ProtectedRoute><ForceDarkMode><BrokerCallbackPage /></ForceDarkMode></ProtectedRoute>
                        } />

                        {/* ── Protected (inside AppShell) ── */}
                        <Route
                            element={
                                <ProtectedRoute>
                                    <AppShell />
                                </ProtectedRoute>
                            }
                        >
                            <Route path="/dashboard" element={<DashboardWorkspace />} />
                            <Route path="/terminal" element={<TradingWorkspace />} />
                            <Route path="/portfolio" element={<PortfolioPage />} />
                            <Route path="/algo" element={<AlgoTradingPage />} />
                            <Route path="/zeroloss" element={<ZeroLossPage />} />
                            <Route path="/settings" element={<SettingsPage />} />
                        </Route>

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Suspense>
            </BrowserRouter>

            <Toaster
                position="bottom-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: 'rgb(var(--surface-700))',
                        color: 'rgb(var(--c-heading))',
                        border: '1px solid rgb(var(--c-edge) / 0.08)',
                        fontSize: '14px',
                        borderRadius: '10px',
                    },
                    success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
                    error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
                }}
            />
        </ThemeProvider>
    );
}
