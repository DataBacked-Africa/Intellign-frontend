import React from 'react';
import { cn } from '@/lib/utils';


interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

export const AuthInput: React.FC<AuthInputProps> = ({ label, error, className, ...props }) => {
    return (
        <div className="w-full space-y-2">
            <label className="text-sm font-medium text-gray-700 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {label}
            </label>
            <input
                className={cn(
                    "flex h-11 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5c1427]/20 focus:border-[#5c1427] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
                    error && "border-red-500 focus:ring-red-500/20 focus:border-red-500",
                    className
                )}
                {...props}
            />
            {error && (
                <p className="text-[0.8rem] font-medium text-red-500 animate-in slide-in-from-top-1 fade-in-0">
                    {error}
                </p>
            )}
        </div>
    );
};
