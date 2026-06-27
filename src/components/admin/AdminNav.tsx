"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminStore } from "@/store/useAdminStore";
import { adminPath, bareAdminPath } from "@/lib/adminPath";

// `path` is the logical admin path (no /admin prefix); hrefs are host-resolved.
const NAV: { path: string; label: string }[] = [
    { path: "/", label: "Dashboard" },
    { path: "/users", label: "Users" },
    { path: "/orgs", label: "Organizations" },
    { path: "/subscriptions", label: "Subscriptions" },
    { path: "/activity", label: "Activity" },
    { path: "/usage", label: "LLM Usage" },
    { path: "/failures", label: "Failures" },
    { path: "/system", label: "System / Ops" },
    { path: "/feedback", label: "Feedback" },
    { path: "/admins", label: "Admins" },
    { path: "/flags", label: "Flags & Broadcast" },
];

export default function AdminNav() {
    const pathname = usePathname();
    const here = bareAdminPath(pathname);
    const { admin, tier, logout } = useAdminStore();

    return (
        <aside className="w-60 shrink-0 border-r border-[#3E0E1A]/10 bg-[#FBF8F4] flex flex-col h-screen sticky top-0">
            <div className="px-5 py-5 border-b border-[#3E0E1A]/10">
                <div className="text-xs tracking-[0.18em] uppercase text-[#3E0E1A]">Intellign</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                    {tier === "is_superuser" ? "Superuser" : "Platform admin"}
                </div>
            </div>
            <nav className="flex-1 overflow-y-auto py-3 px-2">
                {NAV.map((item) => {
                    const active = item.path === "/" ? here === "/" : here.startsWith(item.path);
                    return (
                        <Link
                            key={item.path}
                            href={adminPath(item.path)}
                            className={`block rounded-md px-3 py-2 text-sm mb-0.5 transition ${active
                                ? "bg-[#3E0E1A] text-[#FBF8F4] font-medium"
                                : "text-neutral-600 hover:bg-[#3E0E1A]/5"
                                }`}
                        >
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
            <div className="px-5 py-4 border-t border-[#3E0E1A]/10">
                <div className="text-xs text-neutral-500 truncate">{admin?.email}</div>
                <button
                    onClick={logout}
                    className="mt-2 text-xs text-[#3E0E1A] hover:underline"
                >
                    Sign out
                </button>
            </div>
        </aside>
    );
}
