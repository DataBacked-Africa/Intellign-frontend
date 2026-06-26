import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AdminTier = "is_superuser" | "is_platform_admin" | null;

export interface AdminIdentity {
    id: string;
    name: string;
    email: string;
}

interface AdminState {
    admin: AdminIdentity | null;
    tier: AdminTier;
    isAuthenticated: boolean;
    login: (admin: AdminIdentity, tier: AdminTier, token: string, refreshToken?: string) => void;
    logout: () => void;
    isSuperuser: () => boolean;
}

export const useAdminStore = create<AdminState>()(
    persist(
        (set, get) => ({
            admin: null,
            tier: null,
            isAuthenticated: false,
            login: (admin, tier, token, refreshToken) => {
                if (typeof window !== "undefined") {
                    localStorage.setItem("token", token);
                    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
                }
                set({ admin, tier, isAuthenticated: true });
            },
            logout: () => {
                if (typeof window !== "undefined") {
                    localStorage.removeItem("token");
                    localStorage.removeItem("refreshToken");
                }
                set({ admin: null, tier: null, isAuthenticated: false });
            },
            isSuperuser: () => get().tier === "is_superuser",
        }),
        { name: "intellign-admin" }
    )
);
