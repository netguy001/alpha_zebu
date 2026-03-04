/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        screens: {
            'xs': '480px',
            'sm': '640px',
            'md': '768px',
            'lg': '1024px',
            'xl': '1400px',
            '2xl': '1920px',
        },
        extend: {
            colors: {
                // ── Existing brand primary (indigo) ──────────────────────────
                primary: {
                    50: '#eef2ff',
                    100: '#e0e7ff',
                    200: '#c7d2fe',
                    300: '#a5b4fc',
                    400: '#818cf8',
                    500: '#6366f1',
                    600: '#4f46e5',
                    700: '#4338ca',
                    800: '#3730a3',
                    900: '#312e81',
                },
                // ── CSS-var-backed surface / text tokens ──────────────────────
                surface: {
                    50: 'rgb(var(--surface-50) / <alpha-value>)',
                    100: 'rgb(var(--surface-100) / <alpha-value>)',
                    200: 'rgb(var(--surface-200) / <alpha-value>)',
                    700: 'rgb(var(--surface-700) / <alpha-value>)',
                    800: 'rgb(var(--surface-800) / <alpha-value>)',
                    850: 'rgb(var(--surface-850) / <alpha-value>)',
                    900: 'rgb(var(--surface-900) / <alpha-value>)',
                    950: 'rgb(var(--surface-950) / <alpha-value>)',
                },
                gray: {
                    300: 'rgb(var(--gray-300) / <alpha-value>)',
                    400: 'rgb(var(--gray-400) / <alpha-value>)',
                    500: 'rgb(var(--gray-500) / <alpha-value>)',
                    600: 'rgb(var(--gray-600) / <alpha-value>)',
                    700: 'rgb(var(--gray-700) / <alpha-value>)',
                },
                heading: 'rgb(var(--c-heading) / <alpha-value>)',
                edge: 'rgb(var(--c-edge) / <alpha-value>)',
                overlay: 'rgb(var(--c-overlay) / <alpha-value>)',
                accent: {
                    cyan: '#22d3ee',
                    emerald: '#34d399',
                    amber: '#fbbf24',
                },
                // ── Semantic trading colors ───────────────────────────────────
                profit: '#22c55e',
                loss: '#ef4444',
                buy: '#22c55e',
                sell: '#ef4444',
                // ── Trading design system tokens ─────────────────────────────
                brand: {
                    primary: '#2196F3',
                    dim: '#1565C0',
                    glow: 'rgba(33,150,243,0.15)',
                },
                bull: {
                    DEFAULT: '#26A69A',
                    dim: '#1A7A70',
                    glow: 'rgba(38,166,154,0.2)',
                },
                bear: {
                    DEFAULT: '#EF5350',
                    dim: '#B71C1C',
                    glow: 'rgba(239,83,80,0.2)',
                },
                text: {
                    primary: '#E8EAF0',
                    secondary: '#9BA3AF',
                    muted: '#4B5563',
                    inverse: '#0B0E11',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
                price: ['DM Mono', 'JetBrains Mono', 'monospace'],
                display: ['Syne', 'Inter', 'sans-serif'],
            },
            // ── Trading-specific font sizes ───────────────────────────────────
            fontSize: {
                'price-lg': ['clamp(1.125rem, 1.5vw, 1.5rem)', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '600' }],
                'price-md': ['clamp(0.875rem, 1vw, 1.125rem)', { lineHeight: '1', letterSpacing: '-0.01em', fontWeight: '600' }],
                'price-sm': ['0.875rem', { lineHeight: '1', letterSpacing: '-0.01em', fontWeight: '500' }],
                'label': ['0.6875rem', { lineHeight: '1.2', letterSpacing: '0.04em', fontWeight: '500' }],
                'adaptive': ['clamp(0.75rem, 0.8vw, 0.875rem)', { lineHeight: '1.4' }],
            },
            spacing: {
                'panel-gap': '2px',
            },
            // ── Shadows ───────────────────────────────────────────────────────
            boxShadow: {
                'card': '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
                'panel': '0 4px 24px rgba(0,0,0,0.5)',
                'bull': '0 0 12px rgba(38,166,154,0.3)',
                'bear': '0 0 12px rgba(239,83,80,0.3)',
                'focused': '0 0 0 2px rgba(33,150,243,0.5)',
            },
            // ── Animations ────────────────────────────────────────────────────
            animation: {
                // existing
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'slide-in-right': 'slideInRight 0.3s ease-out',
                'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
                // new trading-grade
                'price-up': 'priceFlash 600ms ease-out',
                'price-down': 'priceFlashRed 600ms ease-out',
                'skeleton': 'shimmer 1.5s infinite',
                'slide-in': 'slideIn 200ms ease-out',
                'marquee': 'marquee 40s linear infinite',
                'float': 'float 6s ease-in-out infinite',
                'shimmer-slow': 'shimmerSlow 3s ease-in-out infinite',
            },
            keyframes: {
                // existing
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideInRight: {
                    '0%': { opacity: '0', transform: 'translateX(20px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                pulseSubtle: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.8' },
                },
                glow: {
                    '0%': { boxShadow: '0 0 5px rgba(99, 102, 241, 0.2)' },
                    '100%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)' },
                },
                // new
                priceFlash: {
                    '0%': { backgroundColor: 'rgba(38,166,154,0.35)' },
                    '100%': { backgroundColor: 'transparent' },
                },
                priceFlashRed: {
                    '0%': { backgroundColor: 'rgba(239,83,80,0.35)' },
                    '100%': { backgroundColor: 'transparent' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                slideIn: {
                    '0%': { transform: 'translateY(-4px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                marquee: {
                    '0%': { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(-50%)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-12px)' },
                },
                shimmerSlow: {
                    '0%, 100%': { opacity: '0.5' },
                    '50%': { opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}
