import ForgotPasswordForm from "@/components/AuthComponents/ForgotPasswordForm";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Forgot Password | Intellign",
    description: "Reset your Intellign account password",
};

export default function ForgotPasswordPage() {
    return (
        <main className="w-full flex justify-center items-center anime-in fade-in zoom-in duration-500">
            <ForgotPasswordForm />
        </main>
    );
}
