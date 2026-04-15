"use client";

import React, { useEffect } from 'react';
import UploadArea from './UploadArea';
import { useSessionStore } from '@/store/useSessionStore';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';


const MainWorkspace = () => {
    const { clearSession } = useSessionStore();
    const router = useRouter();

    useEffect(() => {
        clearSession();
    }, [clearSession]);

    return (
        <div className="w-full h-full overflow-y-auto flex flex-col items-center justify-start pt-16 md:pt-24 p-4 md:p-8 relative">

            {/* Background Branding (Subtle) */}


            <div className="w-full max-w-5xl z-10">

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-3xl mx-auto"
                >
                    <UploadArea />
                </motion.div>

            </div>
        </div>
    );
};

export default MainWorkspace;
