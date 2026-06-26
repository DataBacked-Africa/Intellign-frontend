import axios, { InternalAxiosRequestConfig } from "axios";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://intellign.up.railway.app").replace(/\/$/, "");
export const ADMIN_BASE = `${API_URL}/api/v1/admin`;

// Dedicated admin axios instance: attaches the Bearer token and, on hard auth
// failure, bounces to the admin login (not the app login).
const adminApi = axios.create({
    baseURL: ADMIN_BASE,
    headers: { "Content-Type": "application/json" },
});

adminApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

adminApi.interceptors.response.use(
    (r) => r,
    (error) => {
        const status = error?.response?.status;
        if (status === 401 && typeof window !== "undefined") {
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            if (!window.location.pathname.endsWith("/login")) {
                window.location.href = "/admin/login";
            }
        }
        return Promise.reject(error);
    }
);

export default adminApi;
