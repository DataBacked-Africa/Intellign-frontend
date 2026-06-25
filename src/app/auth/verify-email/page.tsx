import { Suspense } from "react";
import VerifyEmailForm from "@/components/AuthComponents/VerifyEmailForm";
import { Loader2 } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Verify Email | Intellign",
    description: "Confirm your Intellign email address",
};

export default function VerifyEmailPage() {
    return (
        <main className="w-full flex justify-center items-center anime-in fade-in zoom-in duration-500">
            <Suspense
                fallback={
                    <div className="w-full flex justify-center py-12">
                        <Loader2 style={{ width: 22, height: 22, animation: "spin 1s linear infinite", color: "var(--brand-maroon)" }} />
                    </div>
                }
            >
                <VerifyEmailForm />
            </Suspense>
        </main>
    );
}
