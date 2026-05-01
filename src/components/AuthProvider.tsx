'use client';

import { useEffect, useRef } from 'react';
import axios from 'axios';
import { useUserStore } from '@/store/useUserStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Proactive refresh: refresh the access token this many ms before it expires.
// With a 2h access token this fires ~10 min before expiry.
const REFRESH_BUFFER_MS = 10 * 60 * 1000;

function parseJwtExpiry(token: string): number | null {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
    } catch {
        return null;
    }
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const { login, logout, user } = useUserStore();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const attemptRefresh = async (storedRefreshToken: string): Promise<boolean> => {
        try {
            const response = await axios.post(`${API_URL}/auth/refresh`, {
                refreshToken: storedRefreshToken,
            });

            const { accessToken, refreshToken: newRefreshToken, user: freshUser } =
                response.data.data;

            localStorage.setItem('token', accessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

            const currentUser = freshUser ?? useUserStore.getState().user;
            if (currentUser) {
                login(currentUser, accessToken, newRefreshToken ?? storedRefreshToken);
            }

            // Schedule the next proactive refresh
            scheduleRefresh(accessToken, newRefreshToken ?? storedRefreshToken);

            return true;
        } catch {
            return false;
        }
    };

    const scheduleRefresh = (accessToken: string, refreshToken: string) => {
        if (timerRef.current) clearTimeout(timerRef.current);

        const expiry = parseJwtExpiry(accessToken);
        if (!expiry) return;

        const delay = expiry - Date.now() - REFRESH_BUFFER_MS;
        if (delay <= 0) {
            // Already within the buffer window — refresh immediately
            attemptRefresh(refreshToken);
            return;
        }

        timerRef.current = setTimeout(() => {
            attemptRefresh(refreshToken);
        }, delay);
    };

    useEffect(() => {
        const init = async () => {
            const storedToken = localStorage.getItem('token');
            const storedRefreshToken = localStorage.getItem('refreshToken');

            if (!storedRefreshToken) {
                // No session at all — ensure store is clean
                logout();
                return;
            }

            if (storedToken) {
                const expiry = parseJwtExpiry(storedToken);
                const isExpired = expiry ? expiry <= Date.now() : true;

                if (!isExpired) {
                    // Token still valid — just schedule the next refresh
                    scheduleRefresh(storedToken, storedRefreshToken);
                    return;
                }
            }

            // Access token missing or expired — try to refresh immediately
            const success = await attemptRefresh(storedRefreshToken);
            if (!success) {
                // Refresh token invalid or expired — clear session
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                logout();
            }
        };

        init();

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <>{children}</>;
}
