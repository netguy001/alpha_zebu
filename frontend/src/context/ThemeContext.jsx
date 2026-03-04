import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('alphasync_theme') || 'dark';
    });
    const [forceDark, setForceDark] = useState(false);

    // The theme actually applied to the DOM
    const effectiveTheme = forceDark ? 'dark' : theme;

    useEffect(() => {
        const root = document.documentElement;
        if (effectiveTheme === 'dark') {
            root.classList.add('dark');
            root.classList.remove('light');
        } else {
            root.classList.remove('dark');
            root.classList.add('light');
        }
    }, [effectiveTheme]);

    // Persist user preference separately so it survives force-dark pages
    useEffect(() => {
        localStorage.setItem('alphasync_theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

    return (
        <ThemeContext.Provider value={{ theme: effectiveTheme, userTheme: theme, toggleTheme, setForceDark }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
