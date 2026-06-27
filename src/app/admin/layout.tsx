"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import adminApi from "@/lib/adminApi";
import { adminPath } from "@/lib/adminPath";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    // Robust across host rewrite: matches "/login" and "/admin/login".
    const isLogin = pathname.endsWith("/login");
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        if (isLogin) { setChecked(true); return; }
        let cancelled = false;
        // Probe an admin-gated endpoint; 403/401 → not an admin → login.
        adminApi.get("/overview")
            .then(() => { if (!cancelled) setChecked(true); })
            .catch(() => { if (!cancelled) router.replace(adminPath("/login")); });
        return () => { cancelled = true; };
    }, [isLogin, router]);

    // Force a clean light brand theme for the whole admin section, regardless of
    // the app's active (dark) theme, and apply the marketing fonts.
    const themeProps = {
        "data-theme": "light",
        style: { fontFamily: "var(--font-sans)", colorScheme: "light" as const },
    };

    if (isLogin) return <div {...themeProps}>{children}</div>;

    if (!checked) {
        return (
            <div {...themeProps} className="min-h-screen flex items-center justify-center bg-[var(--brand-bone)] text-neutral-400 text-sm">
                Checking access…
            </div>
        );
    }

    return (
        <div {...themeProps} className="flex min-h-screen bg-[var(--brand-bone)] text-neutral-900">
            <AdminNav />
            <main className="flex-1 p-8 overflow-y-auto">{children}</main>
        </div>
    );
}
