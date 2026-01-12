"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { AuthInput } from './AuthInput';
import { ArrowRight, Loader2 } from 'lucide-react';
import axiosInstance from '@/lib/axiosConfig';
import { useUserStore } from '@/store/useUserStore';
import { showToast } from '@/components/ui/CustomToast';
import { useRouter } from 'next/navigation';

const LoginForm = () => {
    const router = useRouter();
    const login = useUserStore(state => state.login);
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await axiosInstance.post('/auth/login', { email, password });

            if (response.data.status === 'success') {
                const { user, tokens } = response.data.data;
                login(user, tokens.accessToken, tokens.refreshToken);

                showToast.success('Welcome back!', 'You have successfully logged in.');
                router.push('/'); // Redirect to dashboard
            }
        } catch (error) {
            console.error('Login failed', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-[#1E1E1E] mb-2">Welcome Back</h2>
                <p className="text-gray-500">Sign in to access your data ingestion portal.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <AuthInput
                    label="Email Address"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <div className="space-y-1">
                    <AuthInput
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <div className="flex justify-end">
                        <Link
                            href="/auth/forgot-password"
                            className="text-sm font-medium text-[#5c1427] hover:text-[#7a1b34] transition-colors"
                        >
                            Forgot password?
                        </Link>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#5c1427] text-white py-3 rounded-lg font-semibold shadow-lg hover:bg-[#7a1b34] hover:shadow-xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            Sign In
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                <p className="text-gray-500 text-sm">
                    Don&apos;t have an account?{' '}
                    <Link
                        href="/auth/signup"
                        className="font-semibold text-[#5c1427] hover:text-[#7a1b34] transition-colors"
                    >
                        Create Account
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default LoginForm;
