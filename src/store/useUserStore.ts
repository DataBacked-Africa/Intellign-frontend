import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
    id: string;
    email: string;
    name: string;
    role?: string;
    organizationName?: string;
    // Add other user properties as needed
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
    setLoading: (loading: boolean) => void;
    updateUser: (start: Partial<User>) => void;
}

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            token: null,
            refreshToken: null,
            isLoading: false,

            login: (user, token, refreshToken) => {
                // Ensure token is saved to localStorage for Axios interceptor
                if (typeof window !== 'undefined') {
                    localStorage.setItem('token', token);
                    localStorage.setItem('refreshToken', refreshToken);
                }
                set({ user, isAuthenticated: true, token, refreshToken });
            },

            logout: () => {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                }
                set({ user: null, isAuthenticated: false, token: null, refreshToken: null });
            },

            setLoading: (isLoading) => set({ isLoading }),

            updateUser: (updates) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...updates } : null
                })),
        }),
        {
            name: 'user-storage', // name of the item in the storage (must be unique)
            storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
                token: state.token,
                refreshToken: state.refreshToken
            }), // Select fields to persist
        }
    )
);
