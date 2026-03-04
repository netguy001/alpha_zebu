import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('alphasync_token');
        const stored = localStorage.getItem('alphasync_user');
        if (token && stored) {
            try {
                setUser(JSON.parse(stored));
            } catch { /* ignore */ }
        }
        setLoading(false);
    }, []);

    const login = useCallback(async (email, password, totpCode = null) => {
        const res = await api.post('/auth/login', { email, password, totp_code: totpCode });
        if (res.data.requires_2fa) return { requires2FA: true };
        localStorage.setItem('alphasync_token', res.data.access_token);
        localStorage.setItem('alphasync_refresh', res.data.refresh_token);
        localStorage.setItem('alphasync_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        return { success: true };
    }, []);

    const register = useCallback(async (data) => {
        const res = await api.post('/auth/register', data);
        localStorage.setItem('alphasync_token', res.data.access_token);
        localStorage.setItem('alphasync_refresh', res.data.refresh_token);
        localStorage.setItem('alphasync_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        return { success: true };
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('alphasync_token');
        localStorage.removeItem('alphasync_refresh');
        localStorage.removeItem('alphasync_user');
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
