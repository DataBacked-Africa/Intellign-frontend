import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
    id: string;
    name: string;
    email: string;
    role?: string;
    organizationId?: string;
    organizationName?: string;
}

interface UserState {
    user: User | null;
    isAuthenticated: boolean;
    token: string | null;
    refreshToken: string | null;
    isLoading: boolean;

    // Actions
    login: (user: User, token: string, refreshToken: string) => void;
    logout: () => void;
    setTokens: (token: string, refreshToken: string) => void;
    setLoading: (loading: boolean) => void;
    updateUser: (updates: Partial<User>) => void;
}

const clearLocalAuth = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
};

export const useUserStore = create<UserState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            token: null,
            refreshToken: null,
            isLoading: false,

            login: (user, token, refreshToken) => {
                if (typeof window !== 'undefined') {
                    localStorage.setItem('token', token);
                    localStorage.setItem('refreshToken', refreshToken);
                }
                set({ user, isAuthenticated: true, token, refreshToken });
            },

            /**
             * Calls the backend to invalidate the refresh token, then clears local state.
             * Safe to call even if the server is unreachable — always clears locally.
             */
            logout: async () => {
                const token = get().token;
                if (token) {
                    try {
                        // Import lazily to avoid circular dep with axiosConfig
                        const { default: axiosInstance } = await import('@/lib/axiosConfig');
                        await axiosInstance.post('/api/v1/auth/logout');
                    } catch {
                        // If the request fails (expired, network issue) we still clear locally
                    }
                }
                clearLocalAuth();
                set({ user: null, isAuthenticated: false, token: null, refreshToken: null });
            },

            /**
             * Updates stored tokens without re-fetching the user object.
             * Used by the axios interceptor after a silent refresh.
             */
            setTokens: (token, refreshToken) => {
                if (typeof window !== 'undefined') {
                    localStorage.setItem('token', token);
                    localStorage.setItem('refreshToken', refreshToken);
                }
                set({ token, refreshToken });
            },

            setLoading: (isLoading) => set({ isLoading }),

            updateUser: (updates) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...updates } : null,
                })),
        }),
        {
            name: 'user-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
                token: state.token,
                refreshToken: state.refreshToken,
            }),
        }
    )
);
