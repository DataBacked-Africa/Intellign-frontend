"use client";

import { useAdminData, PageHeader, Table, StateBlock } from "@/components/admin/ui";

interface FB {
    id: string; user_id: string; session_id: string | null;
    sent_at: string | null; responded: boolean; response_note: string | null;
}

export default function AdminFeedbackPage() {
    const { data, loading, error } = useAdminData<FB[]>("/feedback?limit=100");
    return (
        <div>
            <PageHeader title="Feedback" subtitle="First-run feedback emails sent" />
            <StateBlock loading={loading} error={error} />
            {data && (
                <Table
                    columns={["User", "Sent", "Responded", "Note"]}
                    rows={data.map((f) => [
                        f.user_id,
                        f.sent_at ? new Date(f.sent_at).toLocaleString() : "—",
                        f.responded ? "Yes" : "—",
                        f.response_note || "—",
                    ])}
                />
            )}
        </div>
    );
}
