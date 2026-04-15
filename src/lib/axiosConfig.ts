import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { showToast } from '@/components/ui/CustomToast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token!);
        }
    });

    failedQueue = [];
};

// Request Interceptor
axiosInstance.interceptors.request.use(
    (config) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError | any) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
        const message = error.response?.data?.message || error.message || 'Something went wrong';

        // Skip token refresh for auth endpoints — let the caller handle errors directly
        const isAuthRequest = originalRequest?.url?.includes('/auth/login')
            || originalRequest?.url?.includes('/auth/register')
            || originalRequest?.url?.includes('/auth/refresh');

        if (error.response) {
            switch (error.response.status) {
                case 401:
                    // Don't intercept 401s from auth endpoints
                    if (isAuthRequest) {
                        return Promise.reject(error);
                    }

                    // If already retried, prevent infinite loop
                    if (originalRequest._retry) {
                        break;
                    }

                    if (isRefreshing) {
                        return new Promise(function (resolve, reject) {
                            failedQueue.push({ resolve, reject });
                        })
                            .then((token) => {
                                if (originalRequest.headers) {
                                    originalRequest.headers.Authorization = `Bearer ${token}`;
                                }
                                return axiosInstance(originalRequest);
                            })
                            .catch((err) => {
                                return Promise.reject(err);
                            });
                    }

                    originalRequest._retry = true;
                    isRefreshing = true;

                    try {
                        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

                        if (!refreshToken) {
                            throw new Error("No refresh token available");
                        }

                        // Call Refresh Token API
                        const response = await axios.post(`${API_URL}/auth/refresh`, {
                            refreshToken
                        });

                        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

                        if (typeof window !== 'undefined') {
                            localStorage.setItem('token', accessToken);
                            if (newRefreshToken) {
                                localStorage.setItem('refreshToken', newRefreshToken);
                            }
                        }

                        // Update queue
                        processQueue(null, accessToken);

                        // Retry original
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                        }
                        return axiosInstance(originalRequest);

                    } catch (err) {
                        processQueue(err, null);

                        // Logout on failure
                        try {
                            const { useUserStore } = require('@/store/useUserStore');
                            useUserStore.getState().logout();
                        } catch (e) {
                            if (typeof window !== 'undefined') {
                                localStorage.removeItem('token');
                                localStorage.removeItem('refreshToken');
                            }
                        }
                        showToast.error('Session Expired', 'Please login again.');
                        if (typeof window !== 'undefined') {
                            window.location.href = '/auth/login';
                        }
                    } finally {
                        isRefreshing = false;
                    }
                    break;
                case 403:
                    showToast.error('Access Denied', 'You do not have permission to perform this action.');
                    break;
                case 404: {
                    // Agent and smart-ingest 404s are handled in-component — don't spam toasts
                    const silentPath = originalRequest?.url?.includes('/agent/') ||
                        originalRequest?.url?.includes('/smart-ingest/');
                    if (!silentPath) {
                        showToast.error('Not Found', 'The requested resource could not be found.');
                    }
                    break;
                }
                case 500:
                    showToast.error('Server Error', 'Something went wrong on our end. Please try again.');
                    break;
                default:
                    showToast.error('Error', message);
            }
        } else {
            showToast.error('Network Error', 'Please check your internet connection.');
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
