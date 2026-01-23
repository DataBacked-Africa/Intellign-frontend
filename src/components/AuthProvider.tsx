'use client';

import { useEffect } from 'react';
import axios from 'axios';
import { useUserStore } from '@/store/useUserStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const { login, logout, refreshToken, isAuthenticated } = useUserStore();

    useEffect(() => {
        const refreshTokenOnLoad = async () => {
            const storedRefreshToken = localStorage.getItem('refreshToken');

            if (!storedRefreshToken) {
                // No refresh token, user is not authenticated
                return;
            }

            try {
                const response = await axios.post(`${API_URL}/auth/refresh`, {
                    refreshToken: storedRefreshToken
                });

                const { accessToken, refreshToken: newRefreshToken, user } = response.data.data;

                // Update localStorage
                localStorage.setItem('token', accessToken);
                if (newRefreshToken) {
                    localStorage.setItem('refreshToken', newRefreshToken);
                }

                // Update store if we have user data from refresh response
                if (user) {
                    login(user, accessToken, newRefreshToken || storedRefreshToken);
                } else {
                    // Just update the tokens in localStorage, store will hydrate from persist
                    // We need to get the current user from store and re-login with new tokens
                    const currentUser = useUserStore.getState().user;
                    if (currentUser) {
                        login(currentUser, accessToken, newRefreshToken || storedRefreshToken);
                    }
                }
            } catch (error) {
                console.error('Token refresh failed on load:', error);
                // Clear tokens and logout if refresh fails
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                logout();
            }
        };

        refreshTokenOnLoad();
    }, []); // Run once on mount (page load/reload)

    return <>{children}</>;
}
