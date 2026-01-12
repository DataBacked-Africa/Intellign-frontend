import LoginForm from "@/components/AuthComponents/LoginForm";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Login | Data Ingestion Portal",
    description: "Sign in to your account",
};

export default function LoginPage() {
    return (
        <main className="w-full flex justify-center items-center anime-in fade-in zoom-in duration-500">
            <LoginForm />
        </main>
    );
}
