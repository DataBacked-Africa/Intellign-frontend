"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { AuthInput } from './AuthInput';
import { ArrowRight, Loader2 } from 'lucide-react';
import axiosInstance from '@/lib/axiosConfig';
import { useUserStore } from '@/store/useUserStore';
import { showToast } from '@/components/ui/CustomToast';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const SignupForm = () => {
    const router = useRouter();
    const login = useUserStore(state => state.login);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        organizationName: '',
        password: '',
        confirmPassword: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validate = (): boolean => {
        const next: Record<string, string> = {};
        if (!formData.name.trim()) next.name = 'Full name is required.';
        if (!formData.email.trim()) next.email = 'Email is required.';
        if (!formData.organizationName.trim()) next.organizationName = 'Organization name is required.';
        if (formData.password.length < 8) next.password = 'Password must be at least 8 characters.';
        if (formData.password !== formData.confirmPassword) next.confirmPassword = 'Passwords do not match.';
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsLoading(true);
        try {
            const { confirmPassword: _, ...payload } = formData;
            const response = await axiosInstance.post('/auth/register', payload);

            if (response.data.status === 'success') {
                const { user, tokens } = response.data.data;
                login(user, tokens.accessToken, tokens.refreshToken);
                showToast.success('Account created', `Welcome, ${user.name}!`);
                router.push('/');
            }
        } catch (error: any) {
            const msg = error.response?.data?.message ?? 'Registration failed. Please try again.';
            if (msg.toLowerCase().includes('email')) {
                setErrors(prev => ({ ...prev, email: 'An account with this email already exists.' }));
            } else {
                showToast.error('Sign up failed', msg);
            }
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
            <div className="space-y-1">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Create an account</h1>
                <p className="text-gray-500">Start optimizing your data workflows today.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <AuthInput
                    label="Full Name"
                    name="name"
                    type="text"
                    placeholder="Ada Lovelace"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    error={errors.name}
                />

                <AuthInput
                    label="Email"
                    name="email"
                    type="email"
                    placeholder="ada@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    error={errors.email}
                />

                <AuthInput
                    label="Organization"
                    name="organizationName"
                    type="text"
                    placeholder="Acme Corp"
                    value={formData.organizationName}
                    onChange={handleChange}
                    required
                    error={errors.organizationName}
                />

                <AuthInput
                    label="Password"
                    name="password"
                    type="password"
                    placeholder="At least 8 characters"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    error={errors.password}
                />

                <AuthInput
                    label="Confirm Password"
                    name="confirmPassword"
                    type="password"
                    placeholder="Repeat your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    error={errors.confirmPassword}
                />

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#171717] hover:bg-black text-white h-12 rounded-xl font-medium shadow-xl shadow-black/5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group text-[15px] mt-2"
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

            <div className="pt-4 border-t border-gray-100 text-center">
                <p className="text-gray-500 text-sm">
                    Already have an account?{' '}
                    <Link
                        href="/auth/login"
                        className="font-semibold text-black hover:underline underline-offset-4"
                    >
                        Sign In
                    </Link>
                </p>
            </div>
        </motion.div>
    );
};

export default SignupForm;
