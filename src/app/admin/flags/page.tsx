"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import adminApi from "@/lib/adminApi";
import { useAdminStore } from "@/store/useAdminStore";
import { PageHeader, Card } from "@/components/admin/ui";

const FLAGS = [
    { key: "signups_disabled", label: "Disable signups" },
    { key: "maintenance_mode", label: "Maintenance mode" },
];

export default function AdminFlagsPage() {
    const isSuperuser = useAdminStore((s) => s.isSuperuser());
    const [busy, setBusy] = useState(false);
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [email, setEmail] = useState(false);

    const setFlag = async (key: string, value: boolean) => {
        setBusy(true);
        try { await adminApi.post("/flags", { key, value }); toast.success(`${key} = ${value}`); }
        catch (e: unknown) { toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed"); }
        finally { setBusy(false); }
    };

    const broadcast = async () => {
        if (!title || !body) { toast.error("Title and body required"); return; }
        setBusy(true);
        try {
            const r = await adminApi.post("/broadcast", { title, body, email });
            toast.success(`Sent to ${r.data.recipients} users`);
            setTitle(""); setBody("");
        } catch (e: unknown) { toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed"); }
        finally { setBusy(false); }
    };

    if (!isSuperuser) {
        return (
            <div>
                <PageHeader title="Flags & Broadcast" />
                <p className="text-sm text-neutral-400">Superuser access required.</p>
            </div>
        );
    }

    return (
        <div>
            <PageHeader title="Flags & Broadcast" subtitle="Platform kill-switches and announcements" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Kill-switches">
                    <div className="space-y-2">
                        {FLAGS.map((f) => (
                            <div key={f.key} className="flex items-center justify-between text-sm">
                                <span>{f.label}</span>
                                <div className="flex gap-2">
                                    <button disabled={busy} onClick={() => setFlag(f.key, true)} className="rounded-md border border-red-300 text-red-600 px-2 py-1 text-xs hover:bg-red-50">On</button>
                                    <button disabled={busy} onClick={() => setFlag(f.key, false)} className="rounded-md border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-50">Off</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card title="Broadcast to all users">
                    <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title"
                        className="w-full mb-2 rounded-md border border-neutral-300 px-3 py-2 text-sm" />
                    <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message" rows={3}
                        className="w-full mb-2 rounded-md border border-neutral-300 px-3 py-2 text-sm" />
                    <label className="flex items-center gap-2 text-sm mb-3">
                        <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} /> Also send email
                    </label>
                    <button disabled={busy} onClick={broadcast} className="rounded-md bg-neutral-900 text-white text-sm px-4 py-2 hover:bg-neutral-800 disabled:opacity-60">
                        Send broadcast
                    </button>
                </Card>
            </div>
        </div>
    );
}
