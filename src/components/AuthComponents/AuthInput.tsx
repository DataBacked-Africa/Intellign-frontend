"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

export const AuthInput: React.FC<AuthInputProps> = ({ label, error, className, type, ...props }) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';

    return (
        <div className="w-full space-y-2">
            <label className="text-sm font-medium text-gray-700 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {label}
            </label>
            <div className="relative">
                <input
                    type={isPassword ? (showPassword ? 'text' : 'password') : type}
                    className={cn(
                        "flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5c1427]/10 focus:border-[#5c1427] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
                        isPassword && "pr-10",
                        error && "border-red-500 focus:ring-red-500/10 focus:border-red-500",
                        className
                    )}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                    >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                )}
            </div>
            {error && (
                <p className="text-[0.8rem] font-medium text-red-500 animate-in slide-in-from-top-1 fade-in-0">
                    {error}
                </p>
            )}
        </div>
    );
};
