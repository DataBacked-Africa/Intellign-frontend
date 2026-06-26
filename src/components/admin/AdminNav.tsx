"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminStore } from "@/store/useAdminStore";

const NAV: { href: string; label: string }[] = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/orgs", label: "Organizations" },
    { href: "/admin/subscriptions", label: "Subscriptions" },
    { href: "/admin/activity", label: "Activity" },
    { href: "/admin/usage", label: "LLM Usage" },
    { href: "/admin/failures", label: "Failures" },
    { href: "/admin/system", label: "System / Ops" },
    { href: "/admin/feedback", label: "Feedback" },
    { href: "/admin/admins", label: "Admins" },
    { href: "/admin/flags", label: "Flags & Broadcast" },
];

export default function AdminNav() {
    const pathname = usePathname();
    const { admin, tier, logout } = useAdminStore();

    return (
        <aside className="w-60 shrink-0 border-r border-neutral-200 bg-neutral-50 flex flex-col h-screen sticky top-0">
            <div className="px-5 py-4 border-b border-neutral-200">
                <div className="font-semibold text-neutral-900">Intellign Admin</div>
                <div className="text-xs text-neutral-500 mt-0.5">
                    {tier === "is_superuser" ? "Superuser" : "Platform admin"}
                </div>
            </div>
            <nav className="flex-1 overflow-y-auto py-2">
                {NAV.map((item) => {
                    const active = item.href === "/admin"
                        ? pathname === "/admin"
                        : pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`block px-5 py-2 text-sm ${active
                                ? "bg-neutral-200 text-neutral-900 font-medium"
                                : "text-neutral-600 hover:bg-neutral-100"
                                }`}
                        >
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
            <div className="px-5 py-3 border-t border-neutral-200">
                <div className="text-xs text-neutral-500 truncate">{admin?.email}</div>
                <button
                    onClick={logout}
                    className="mt-2 text-xs text-red-600 hover:underline"
                >
                    Sign out
                </button>
            </div>
        </aside>
    );
}
