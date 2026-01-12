import SignupForm from "@/components/AuthComponents/SignupForm";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sign Up | Data Ingestion Portal",
    description: "Create your account",
};

export default function SignupPage() {
    return (
        <main className="w-full flex justify-center items-center anime-in fade-in zoom-in duration-500">
            <SignupForm />
        </main>
    );
}
