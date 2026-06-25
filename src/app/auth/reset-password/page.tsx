import { Suspense } from "react";
import ResetPasswordForm from "@/components/AuthComponents/ResetPasswordForm";
import { Loader2 } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Reset Password | Intellign",
    description: "Set a new Intellign account password",
};

export default function ResetPasswordPage() {
    return (
        <main className="w-full flex justify-center items-center anime-in fade-in zoom-in duration-500">
            <Suspense
                fallback={
                    <div className="w-full flex justify-center py-12">
                        <Loader2 style={{ width: 22, height: 22, animation: "spin 1s linear infinite", color: "var(--brand-maroon)" }} />
                    </div>
                }
            >
                <ResetPasswordForm />
            </Suspense>
        </main>
    );
}
