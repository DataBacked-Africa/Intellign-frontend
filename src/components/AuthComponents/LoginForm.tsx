"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { AuthInput } from './AuthInput';
import { ArrowRight, Loader2, LogIn } from 'lucide-react';
import axiosInstance from '@/lib/axiosConfig';
import { useUserStore } from '@/store/useUserStore';
import { showToast } from '@/components/ui/CustomToast';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

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
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[400px] bg-white rounded-2xl shadow-sm border border-gray-200 p-8"
        >
            <div className="text-center mb-8 space-y-2">
                <div className="w-12 h-12 bg-[#5c1427]/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <LogIn className="w-6 h-6 text-[#5c1427]" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Welcome back</h2>
                <p className="text-sm text-gray-500">Sign in to your optimization workspace.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <AuthInput
                    label="Email"
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
                    <div className="flex justify-end pt-1">
                        <Link
                            href="/auth/forgot-password"
                            className="text-xs font-medium text-gray-500 hover:text-[#5c1427] transition-colors"
                        >
                            Forgot password?
                        </Link>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#5c1427] hover:bg-[#7a1b34] text-white h-10 rounded-lg font-medium shadow-sm transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group text-sm"
                >
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            Sign In
                            <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                <p className="text-gray-500 text-sm">
                    New to the platform?{' '}
                    <Link
                        href="/auth/signup"
                        className="font-semibold text-[#5c1427] hover:underline decoration-[#5c1427]/30 underline-offset-4 transition-all"
                    >
                        Create Account
                    </Link>
                </p>
            </div>
        </motion.div>
    );
};

export default LoginForm;
