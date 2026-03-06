import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
});

// Add JWT token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('alphasync_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Track whether a token refresh is already in progress
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve(token);
    });
    failedQueue = [];
};

// Handle 401 responses — attempt refresh before logging out
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes('/auth/refresh') &&
            !originalRequest.url?.includes('/auth/login')
        ) {
            if (isRefreshing) {
                // Queue this request until the refresh completes
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem('alphasync_refresh');
            if (!refreshToken) {
                isRefreshing = false;
                processQueue(error);
                _forceLogout();
                return Promise.reject(error);
            }

            try {
                const res = await axios.post('/api/auth/refresh', null, {
                    headers: { Authorization: `Bearer ${refreshToken}` },
                });
                const { access_token, refresh_token: newRefresh } = res.data;
                localStorage.setItem('alphasync_token', access_token);
                if (newRefresh) {
                    localStorage.setItem('alphasync_refresh', newRefresh);
                }
                originalRequest.headers.Authorization = `Bearer ${access_token}`;
                processQueue(null, access_token);
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError);
                _forceLogout();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

function _forceLogout() {
    localStorage.removeItem('alphasync_token');
    localStorage.removeItem('alphasync_refresh');
    localStorage.removeItem('alphasync_user');
    if (window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
}

export default api;
