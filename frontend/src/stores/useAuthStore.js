import { create } from 'zustand';
import api from '../services/api';

/**
 * Auth store — replaces AuthContext.
 * Owns: user, token, isAuthenticated, login, register, logout, updateUser.
 */
export const useAuthStore = create((set, get) => ({
    /** @type {object|null} */
    user: (() => {
        try {
            const stored = localStorage.getItem('alphasync_user');
            return stored ? JSON.parse(stored) : null;
        } catch { return null; }
    })(),

    /** @type {boolean} */
    loading: false,

    // ─── Actions ──────────────────────────────────────────────────────────────

    login: async (email, password, totpCode = null) => {
        const res = await api.post('/auth/login', { email, password, totp_code: totpCode });
        if (res.data.requires_2fa) return { requires2FA: true };
        localStorage.setItem('alphasync_token', res.data.access_token);
        localStorage.setItem('alphasync_refresh', res.data.refresh_token);
        localStorage.setItem('alphasync_user', JSON.stringify(res.data.user));
        set({ user: res.data.user });
        return { success: true };
    },

    register: async (data) => {
        const res = await api.post('/auth/register', data);
        localStorage.setItem('alphasync_token', res.data.access_token);
        localStorage.setItem('alphasync_refresh', res.data.refresh_token);
        localStorage.setItem('alphasync_user', JSON.stringify(res.data.user));
        set({ user: res.data.user });
        return { success: true };
    },

    logout: async () => {
        try {
            await api.post('/auth/logout');
        } catch {
            // Best-effort — clear local state regardless
        }
        localStorage.removeItem('alphasync_token');
        localStorage.removeItem('alphasync_refresh');
        localStorage.removeItem('alphasync_user');
        set({ user: null });
    },

    /**
     * Partially update user fields in store + localStorage.
     * Used by: avatar upload, profile form, any settings save.
     * 
     * @param {Partial<object>} patch - fields to merge into current user
     * 
     * @example
     * updateUser({ avatar_url: 'https://...' })
     * updateUser({ full_name: 'Bharath A', phone: '+91 99999 99999' })
     */
    updateUser: (patch) => {
        const current = get().user;
        if (!current) return;
        const updated = { ...current, ...patch };
        localStorage.setItem('alphasync_user', JSON.stringify(updated));
        set({ user: updated });
    },
}));