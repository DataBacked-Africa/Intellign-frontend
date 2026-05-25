import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { showToast } from '@/components/ui/CustomToast';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://intellign.up.railway.app').replace(/\/$/, '');

const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

// ── Token refresh queue ───────────────────────────────────────────────────────
// Queues concurrent requests that arrived while a token refresh is in-flight,
// then replays them with the new token once the refresh resolves.
let isRefreshing = false;
let pendingQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const drainQueue = (error: any, token: string | null = null) => {
    pendingQueue.forEach(p => (error ? p.reject(error) : p.resolve(token!)));
    pendingQueue = [];
};

// AUTH-ONLY paths — never apply the refresh interceptor to these
const AUTH_PATHS = ['/api/v1/auth/refresh', '/api/v1/auth/login', '/api/v1/auth/register'];

// ── Request: attach current access token ──────────────────────────────────────
axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ── Response: handle 401 with silent refresh + replay ─────────────────────────
const SILENT_404_PATTERNS = ['/ingest/', '/results/'];

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        const status: number | undefined = error.response?.status;
        const url: string = originalRequest?.url ?? '';
        const message: string =
            error.response?.data?.detail ??
            error.response?.data?.message ??
            error.message ??
            'Something went wrong';

        // ── No network response ──────────────────────────────────────────────
        if (!error.response) {
            showToast.error('Network Error', 'Please check your internet connection.');
            return Promise.reject(error);
        }

        // ── Silent 404s ──────────────────────────────────────────────────────
        if (status === 404 && SILENT_404_PATTERNS.some(p => url.includes(p))) {
            return Promise.reject(error);
        }

        // ── 401 — attempt silent token refresh ───────────────────────────────
        if (status === 401 && !originalRequest._retry && !AUTH_PATHS.some(p => url.includes(p))) {
            // If a refresh is already in-flight, queue this request
            if (isRefreshing) {
                return new Promise<string>((resolve, reject) => {
                    pendingQueue.push({ resolve, reject });
                }).then((newToken) => {
                    originalRequest.headers = {
                        ...(originalRequest.headers ?? {}),
                        Authorization: `Bearer ${newToken}`,
                    };
                    return axiosInstance(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const storedRefreshToken =
                typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

            if (!storedRefreshToken) {
                isRefreshing = false;
                drainQueue(new Error('No refresh token'));
                // No refresh token — force logout
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    window.location.href = '/auth/login';
                }
                return Promise.reject(error);
            }

            try {
                // Use a plain axios call (not the intercepted instance) to avoid loops
                const refreshResponse = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
                    refresh_token: storedRefreshToken,
                });

                const { tokens, user: rawUser } = refreshResponse.data;
                const accessToken: string = tokens.access_token;
                const newRefreshToken: string | undefined = tokens.refresh_token;
                const user = rawUser
                    ? { ...rawUser, organizationId: rawUser.organization_id }
                    : null;

                // Persist new tokens
                localStorage.setItem('token', accessToken);
                if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

                // Update the Zustand store (lazy import avoids circular deps)
                const { useUserStore } = await import('@/store/useUserStore');
                const store = useUserStore.getState();
                const currentUser = user ?? store.user;
                if (currentUser) {
                    store.login(currentUser, accessToken, newRefreshToken ?? storedRefreshToken);
                }

                drainQueue(null, accessToken);

                // Replay the original request with the new token
                originalRequest.headers = {
                    ...(originalRequest.headers ?? {}),
                    Authorization: `Bearer ${accessToken}`,
                };
                return axiosInstance(originalRequest);
            } catch (refreshError: any) {
                drainQueue(refreshError);

                // Refresh failed — clear session and send to login
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                }
                const { useUserStore } = await import('@/store/useUserStore');
                useUserStore.getState().logout();

                // Small delay so any in-flight toasts settle
                setTimeout(() => { window.location.href = '/auth/login'; }, 100);

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // ── Other 4xx / 5xx errors ───────────────────────────────────────────
        if (status === 422) return Promise.reject(error); // let callers handle validation

        if (status === 500) {
            showToast.error('Server Error', 'Something went wrong on the server. Please try again.');
        } else if (status && status >= 400 && status !== 404 && status !== 422 && status !== 401) {
            showToast.error('Error', message);
        }

        return Promise.reject(error);
    }
);

export { API_URL };
export default axiosInstance;
