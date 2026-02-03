"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { AuthInput } from './AuthInput';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';
import axiosInstance from '@/lib/axiosConfig';
import { useUserStore } from '@/store/useUserStore';
import { showToast } from '@/components/ui/CustomToast';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const SignupForm = () => {
    const router = useRouter();
    const login = useUserStore(state => state.login);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        organizationName: '',
        email: '',
        password: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await axiosInstance.post('/auth/register', formData);

            if (response.data.status === 'success') {
                const { user, tokens } = response.data.data;
                login(user, tokens.accessToken, tokens.refreshToken);

                showToast.success('Account Created', 'Welcome to the platform!');
                router.push('/'); // Redirect to dashboard/home
            }
        } catch (error) {
            console.error('Registration failed', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (

        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full space-y-8"
        >
            <div className="text-left space-y-2">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Create an account</h1>
                <p className="text-gray-500">Start optimizing your data workflows today.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <AuthInput
                    label="Organization"
                    name="organizationName"
                    type="text"
                    placeholder="Acme Corp"
                    value={formData.organizationName}
                    onChange={handleChange}
                    required
                />

                <AuthInput
                    label="Email"
                    name="email"
                    type="email"
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />

                <AuthInput
                    label="Password"
                    name="password"
                    type="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#171717] hover:bg-black text-white h-12 rounded-xl font-medium shadow-xl shadow-black/5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group text-[15px]"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            Get Started
                            <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </>
                    )}
                </button>
            </form>

            <div className="pt-6 border-t border-gray-100 text-center">
                <p className="text-gray-500 text-sm">
                    Already have an account?{' '}
                    <Link
                        href="/auth/login"
                        className="font-semibold text-black hover:underline underline-offset-4 transition-all"
                    >
                        Sign In
                    </Link>
                </p>
            </div>
        </motion.div>
    );
};

export default SignupForm;
