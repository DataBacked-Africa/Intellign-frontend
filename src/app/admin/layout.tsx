"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import adminApi from "@/lib/adminApi";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const isLogin = pathname === "/admin/login";
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        if (isLogin) { setChecked(true); return; }
        let cancelled = false;
        // Probe an admin-gated endpoint; 403/401 → not an admin → login.
        adminApi.get("/overview")
            .then(() => { if (!cancelled) setChecked(true); })
            .catch(() => { if (!cancelled) router.replace("/admin/login"); });
        return () => { cancelled = true; };
    }, [isLogin, router]);

    if (isLogin) return <>{children}</>;

    if (!checked) {
        return <div className="min-h-screen flex items-center justify-center text-neutral-400 text-sm">Checking access…</div>;
    }

    return (
        <div className="flex min-h-screen bg-neutral-100 text-neutral-900">
            <AdminNav />
            <main className="flex-1 p-8 overflow-y-auto">{children}</main>
        </div>
    );
}
