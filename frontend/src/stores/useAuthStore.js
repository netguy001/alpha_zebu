import { create } from 'zustand';
import {
    auth,
    googleProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile,
} from '../config/firebase';
import api from '../services/api';

/**
 * Auth store — Firebase-based authentication.
 *
 * Flow:
 *   1. User signs in via Firebase (Google popup / email+password)
 *   2. Firebase returns an ID token
 *   3. ID token sent to backend POST /api/auth/sync to find-or-create local user
 *   4. Backend returns local user profile
 *   5. All subsequent API calls use the Firebase ID token as Bearer
 */
export const useAuthStore = create((set, get) => ({
    /** @type {object|null} */
    user: (() => {
        try {
            const stored = localStorage.getItem('alphasync_user');
            return stored ? JSON.parse(stored) : null;
        } catch { return null; }
    })(),

    /** @type {import('firebase/auth').User|null} */
    firebaseUser: null,

    /** @type {boolean} */
    loading: true,

    /** @type {boolean} */
    initializing: true,

    // ─── Initialize Firebase auth listener ────────────────────────────────────

    /**
     * Call once on app mount to listen for Firebase auth state changes.
     * Automatically gets fresh tokens and syncs with backend.
     */
    initAuth: () => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                set({ firebaseUser, loading: true });
                try {
                    const token = await firebaseUser.getIdToken();
                    localStorage.setItem('alphasync_token', token);

                    // Sync with backend
                    const res = await api.post('/auth/sync', {});
                    localStorage.setItem('alphasync_user', JSON.stringify(res.data.user));
                    set({ user: res.data.user, loading: false, initializing: false });
                } catch (err) {
                    console.error('Auth sync failed:', err?.response?.data?.detail || err?.response?.data || err.message);
                    // Clear invalid state
                    localStorage.removeItem('alphasync_token');
                    localStorage.removeItem('alphasync_user');
                    set({ user: null, loading: false, initializing: false });
                }
            } else {
                localStorage.removeItem('alphasync_token');
                localStorage.removeItem('alphasync_user');
                set({ user: null, firebaseUser: null, loading: false, initializing: false });
            }
        });
        return unsubscribe;
    },

    // ─── Actions ──────────────────────────────────────────────────────────────

    loginWithGoogle: async () => {
        const result = await signInWithPopup(auth, googleProvider);
        const token = await result.user.getIdToken();
        localStorage.setItem('alphasync_token', token);

        try {
            const res = await api.post('/auth/sync', {});
            localStorage.setItem('alphasync_user', JSON.stringify(res.data.user));
            set({ user: res.data.user, firebaseUser: result.user });
            return { success: true, isNew: res.data.is_new_user };
        } catch (err) {
            const detail = err.response?.data?.detail;
            console.error('Auth sync error:', detail || err.message);
            const error = new Error(detail || err.message);
            error.code = err.code;
            error.response = err.response;
            throw error;
        }
    },

    loginWithEmail: async (email, password) => {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const token = await result.user.getIdToken();
        localStorage.setItem('alphasync_token', token);

        const res = await api.post('/auth/sync', {});
        localStorage.setItem('alphasync_user', JSON.stringify(res.data.user));
        set({ user: res.data.user, firebaseUser: result.user });
        return { success: true };
    },

    registerWithEmail: async (email, password, displayName, username) => {
        const result = await createUserWithEmailAndPassword(auth, email, password);

        // Set display name in Firebase
        if (displayName) {
            await updateProfile(result.user, { displayName });
        }

        const token = await result.user.getIdToken(true);
        localStorage.setItem('alphasync_token', token);

        try {
            const res = await api.post('/auth/sync', { username });
            localStorage.setItem('alphasync_user', JSON.stringify(res.data.user));
            set({ user: res.data.user, firebaseUser: result.user });
            return { success: true };
        } catch (err) {
            const detail = err.response?.data?.detail;
            console.error('Auth sync error:', detail || err.message);
            const error = new Error(detail || err.message);
            error.code = err.code;
            error.response = err.response;
            throw error;
        }
    },

    resetPassword: async (email) => {
        await sendPasswordResetEmail(auth, email);
    },

    logout: async () => {
        try {
            await api.post('/auth/logout');
        } catch {
            // Best-effort
        }
        await signOut(auth);
        localStorage.removeItem('alphasync_token');
        localStorage.removeItem('alphasync_user');
        set({ user: null, firebaseUser: null });
    },

    /**
     * Get a fresh Firebase ID token (auto-refreshes if expired).
     * Used by the API interceptor.
     */
    getToken: async () => {
        const { firebaseUser } = get();
        if (!firebaseUser) {
            // Try getting from Firebase auth directly
            const currentUser = auth.currentUser;
            if (currentUser) {
                return await currentUser.getIdToken();
            }
            return null;
        }
        return await firebaseUser.getIdToken();
    },

    /**
     * Partially update user fields in store + localStorage.
     */
    updateUser: (patch) => {
        const current = get().user;
        if (!current) return;
        const updated = { ...current, ...patch };
        localStorage.setItem('alphasync_user', JSON.stringify(updated));
        set({ user: updated });
    },
}));