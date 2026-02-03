import AppShell from "@/components/Layout/AppShell";
import React from "react";

export default function SessionLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AppShell>
            {children}
        </AppShell>
    );
}
