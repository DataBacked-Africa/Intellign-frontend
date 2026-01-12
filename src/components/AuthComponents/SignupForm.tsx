"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { AuthInput } from './AuthInput';
import { ArrowRight, Loader2 } from 'lucide-react';
import axiosInstance from '@/lib/axiosConfig';
import { useUserStore } from '@/store/useUserStore';
import { showToast } from '../ui/CustomToast';
import { useRouter } from 'next/navigation';

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
            // Error is handled by interceptor, but we catch here to stop loading state
            console.error('Registration failed', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-[#1E1E1E] mb-2">Create Account</h2>
                <p className="text-gray-500">Join us to start optimizing your data workflows.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <AuthInput
                    label="Organization Name"
                    name="organizationName"
                    type="text"
                    placeholder="Acme Corp"
                    value={formData.organizationName}
                    onChange={handleChange}
                    required
                />

                <AuthInput
                    label="Email Address"
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
                    className="w-full bg-[#5c1427] text-white py-3 rounded-lg font-semibold shadow-lg hover:bg-[#7a1b34] hover:shadow-xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            Get Started
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                <p className="text-gray-500 text-sm">
                    Already have an account?{' '}
                    <Link
                        href="/auth/login"
                        className="font-semibold text-[#5c1427] hover:text-[#7a1b34] transition-colors"
                    >
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default SignupForm;
